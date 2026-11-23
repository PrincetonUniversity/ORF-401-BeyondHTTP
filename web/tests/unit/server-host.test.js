import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIRLINES, ServerHost, validateClientMessage } from '../../site/js/server-host.js';
import { CONTROL_PORT, parseGateMessage } from '../../site/js/protocol.js';
import { TCP_INITIAL_RTO_MS, TCP_MAX_ATTEMPTS } from '../../site/js/network.js';
import { fakeEnv, recordingPort, seeded } from './helpers.js';

const CARMON = AIRLINES[0];
const VANDER = AIRLINES[1];
const DESTS = ['Newark', 'Jersey City', 'Paterson'];

/** @type {ServerHost} */
let host;

beforeEach(() => {
  vi.useFakeTimers();
  host = new ServerHost(DESTS, fakeEnv(seeded(42)));
});

afterEach(() => {
  host.stop();
  vi.useRealTimers();
});

/** @param {ReturnType<typeof recordingPort>} port @param {number} id */
const replyFor = (port, id) => port.of('tcp-reply').find((m) => m.id === id);

/**
 * @param {ReturnType<typeof recordingPort>} port
 * @param {number} id
 * @param {string} line
 * @param {string} [serverIp]
 * @param {number} [dstPort]
 */
async function tcp(port, id, line, serverIp = CARMON.ip, dstPort = CONTROL_PORT) {
  port.send({ type: 'tcp', id, host: serverIp, port: dstPort, line });
  await vi.advanceTimersByTimeAsync(TCP_INITIAL_RTO_MS * 2 ** TCP_MAX_ATTEMPTS);
  const reply = replyFor(port, id);
  if (!reply) throw new Error(`no tcp-reply for id ${id}`);
  return reply;
}

describe('connect', () => {
  it('welcomes each tab with its own address and the server list', () => {
    const a = recordingPort();
    const b = recordingPort();
    expect(host.connect(a)).toBe('10.0.2.10');
    expect(host.connect(b)).toBe('10.0.2.11');
    const [welcome] = a.of('welcome');
    expect(welcome).toMatchObject({
      ip: '10.0.2.10',
      controlPort: 8189,
      airlines: [
        { name: 'CarmonCar', ip: '10.0.1.1' },
        { name: 'Vanderides', ip: '10.0.1.2' },
      ],
      conditions: { loss: 0, paused: false, speed: 1 },
    });
    expect(welcome.airlinesState.map((/** @type {any} */ s) => s.listeners)).toEqual([[], []]);
  });

  it('frees the address when a tab says bye', () => {
    const a = recordingPort();
    host.connect(a);
    a.send({ type: 'bye' });
    expect(host.clients.size).toBe(0);
  });
});

describe('registrar over TCP 8189', () => {
  it('replies HELLO to ADD and records the listener', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    const reply = await tcp(a, 1, `ADD ${ip} 51000`);
    expect(reply).toEqual({ type: 'tcp-reply', id: 1, ok: true, line: `HELLO ${ip} 51000` });
    expect(host.airlines[0].registry.all().map((r) => `${r.host}:${r.port}`)).toEqual([`${ip}:51000`]);
    expect(host.airlines[1].registry.size).toBe(0);
    const lastState = a.of('state').at(-1);
    expect(lastState.airlinesState[0].listeners).toEqual([`${ip}:51000`]);
  });

  it('reports a duplicate ADD the way the Java registrar does', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    await tcp(a, 1, `ADD ${ip} 51000`);
    expect((await tcp(a, 2, `ADD ${ip} 51000`)).line).toBe('You failed to deregister last time!');
  });

  it('replies BYE to DROP and UNABLE TO DROP for unknown listeners', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    await tcp(a, 1, `ADD ${ip} 51000`);
    expect((await tcp(a, 2, `DROP ${ip} 51000`)).line).toBe(`BYE ${ip} 51000`);
    expect((await tcp(a, 3, `DROP ${ip} 51000`)).line).toBe(`UNABLE TO DROP ${ip} 51000`);
    expect(host.airlines[0].registry.size).toBe(0);
  });

  it('passes parse errors back as reply lines', async () => {
    const a = recordingPort();
    host.connect(a);
    expect((await tcp(a, 1, 'PING')).line).toBe('INVALID COMMAND');
    expect((await tcp(a, 2, 'ADD 10.0.2.10 port')).line).toBe('INVALID PORT');
  });

  it('refuses connections to other ports and has no route to unknown hosts', async () => {
    const a = recordingPort();
    host.connect(a);
    expect(await tcp(a, 1, 'ADD 10.0.2.10 51000', CARMON.ip, 80)).toMatchObject({
      ok: false,
      error: 'Connection refused',
    });
    expect(await tcp(a, 2, 'ADD 10.0.2.10 51000', '10.9.9.9')).toMatchObject({
      ok: false,
      error: 'No route to host',
    });
    expect(host.airlines[0].registry.size).toBe(0);
  });

  it('times out after all retransmissions at 100% loss, and logs each one', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    a.send({ type: 'set-conditions', conditions: { loss: 1 } });
    expect(await tcp(a, 1, `ADD ${ip} 51000`)).toMatchObject({ ok: false, error: 'Connection timed out' });
    const statuses = a.of('log').map((m) => m.entry.status);
    expect(statuses.filter((s) => s === 'retransmit')).toHaveLength(TCP_MAX_ATTEMPTS - 1);
    expect(statuses.filter((s) => s === 'timeout')).toHaveLength(1);
    expect(host.airlines[0].registry.size).toBe(0);
  });
});

describe('reporter over UDP', () => {
  it('sends each change to every registered, bound listener within 2.5-7.5 s', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    a.send({ type: 'bind', port: 51000 });
    await tcp(a, 1, `ADD ${ip} 51000`);
    a.received.length = 0;
    await vi.advanceTimersByTimeAsync(7500 + 200);
    const datagrams = a.of('udp');
    expect(datagrams.length).toBeGreaterThanOrEqual(1);
    for (const d of datagrams) {
      expect(d.port).toBe(51000);
      expect(d.src).toBe(`${CARMON.ip}:${CARMON.sourcePort}`);
      const change = parseGateMessage(d.payload);
      expect(change).not.toBeNull();
      expect(change?.airline).toBe('CarmonCar');
      expect(DESTS).toContain(change?.destination);
      expect(change?.seats).toBeGreaterThanOrEqual(1);
      expect(change?.seats).toBeLessThanOrEqual(5);
      expect(change?.gate).toBeGreaterThanOrEqual(1);
      expect(change?.gate).toBeLessThanOrEqual(30);
    }
    expect(host.airlines[0].sent).toBeGreaterThanOrEqual(datagrams.length);
    expect(host.airlines[1].sent).toBe(0);
  });

  it('fans out to several tabs', async () => {
    const a = recordingPort();
    const b = recordingPort();
    const ipA = host.connect(a);
    const ipB = host.connect(b);
    a.send({ type: 'bind', port: 51001 });
    b.send({ type: 'bind', port: 51001 });
    await tcp(a, 1, `ADD ${ipA} 51001`, VANDER.ip);
    await tcp(b, 1, `ADD ${ipB} 51001`, VANDER.ip);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(a.of('udp').length).toBeGreaterThanOrEqual(4);
    expect(b.of('udp').length).toBeGreaterThanOrEqual(4);
  });

  it('logs datagrams to an unbound port as unreachable and does not deliver them', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    await tcp(a, 1, `ADD ${ip} 51000`);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(a.of('udp')).toHaveLength(0);
    expect(
      a.of('log').filter((m) => m.entry.proto === 'UDP' && m.entry.status === 'unreachable').length,
    ).toBeGreaterThan(0);
  });

  it('counts lost datagrams at 100% loss and delivers none', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    a.send({ type: 'bind', port: 51000 });
    await tcp(a, 1, `ADD ${ip} 51000`);
    // Let datagrams already in flight land before turning loss on.
    await vi.advanceTimersByTimeAsync(1000);
    a.send({ type: 'set-conditions', conditions: { loss: 1 } });
    a.received.length = 0;
    const sentBefore = host.airlines[0].sent;
    const lostBefore = host.airlines[0].lost;
    await vi.advanceTimersByTimeAsync(30_000);
    const sent = host.airlines[0].sent - sentBefore;
    expect(a.of('udp')).toHaveLength(0);
    expect(sent).toBeGreaterThanOrEqual(4);
    expect(host.airlines[0].lost - lostBefore).toBe(sent);
  });

  it('stops while paused and runs faster at higher speed', async () => {
    const a = recordingPort();
    const ip = host.connect(a);
    a.send({ type: 'bind', port: 51000 });
    await tcp(a, 1, `ADD ${ip} 51000`);
    a.send({ type: 'set-conditions', conditions: { paused: true } });
    const before = host.airlines[0].sent;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(host.airlines[0].sent).toBe(before);

    a.send({ type: 'set-conditions', conditions: { paused: false, speed: 20 } });
    await vi.advanceTimersByTimeAsync(7_500);
    // At 20x each interval is at most 375 ms, so 7.5 s holds at least 20 reports.
    expect(host.airlines[0].sent - before).toBeGreaterThanOrEqual(20);
  });

  it('reset clears listeners, counters and conditions for every tab', async () => {
    const a = recordingPort();
    const b = recordingPort();
    const ip = host.connect(a);
    host.connect(b);
    await tcp(a, 1, `ADD ${ip} 51000`);
    a.send({ type: 'set-conditions', conditions: { loss: 0.5 } });
    b.send({ type: 'reset' });
    expect(host.airlines[0].registry.size).toBe(0);
    expect(host.conditions.loss).toBe(0);
    expect(a.of('state').at(-1).airlinesState[0].listeners).toEqual([]);
  });
});

describe('message validation at the worker boundary', () => {
  it.each([
    null,
    42,
    { type: 'nope' },
    { type: 'bind', port: 0 },
    { type: 'bind', port: '51000' },
    { type: 'tcp', id: 1, host: '10.0.1.1', port: 8189 },
    { type: 'tcp', id: 1.5, host: '10.0.1.1', port: 8189, line: 'ADD' },
    { type: 'tcp', id: 1, host: '10.0.1.1', port: 8189, line: 'ADD\nDROP' },
    { type: 'tcp', id: 1, host: '10.0.1.1', port: 8189, line: 'x'.repeat(201) },
    { type: 'set-conditions', conditions: { loss: 2 } },
  ])('rejects %j', (m) => {
    expect(validateClientMessage(m)).toBeNull();
  });

  it('answers malformed messages with an error instead of acting on them', () => {
    const a = recordingPort();
    host.connect(a);
    a.send({ type: 'set-conditions', conditions: { loss: 5 } });
    expect(a.of('error')).toHaveLength(1);
    expect(host.conditions.loss).toBe(0);
  });
});
