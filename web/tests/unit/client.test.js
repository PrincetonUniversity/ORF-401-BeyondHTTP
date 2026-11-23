import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LabClient, TCP_CLIENT_TIMEOUT_MS } from '../../site/js/client.js';
import { ServerHost } from '../../site/js/server-host.js';
import { fakeEnv, portPair, seeded } from './helpers.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('LabClient talking to a ServerHost', () => {
  it('registers over TCP and receives UDP gate changes', async () => {
    const host = new ServerHost(['Newark'], fakeEnv(seeded(7)));
    const [tab, worker] = portPair();
    const client = new LabClient(tab);
    host.connect(worker);
    const welcome = await client.ready;
    expect(welcome.ip).toBe('10.0.2.10');

    /** @type {string[]} */
    const got = [];
    client.bindUdp(51000, (payload) => got.push(payload));
    const replyPromise = client.tcp('10.0.1.1', 8189, `ADD ${welcome.ip} 51000`);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(replyPromise).resolves.toBe(`HELLO ${welcome.ip} 51000`);

    await vi.advanceTimersByTimeAsync(20_000);
    expect(got.length).toBeGreaterThanOrEqual(2);
    expect(got[0]).toMatch(/^CarmonCar,Newark,SEAT,[1-5],GATE,([1-9]|[12]\d|30)$/);
    host.stop();
  });

  it('rejects when the connection is refused', async () => {
    const host = new ServerHost(['Newark'], fakeEnv(seeded(8)));
    const [tab, worker] = portPair();
    const client = new LabClient(tab);
    host.connect(worker);
    await client.ready;
    const p = client.tcp('10.0.1.2', 80, 'ADD 10.0.2.10 51001');
    const assertion = expect(p).rejects.toThrow('Connection refused');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    host.stop();
  });

  it('times out on its own when nothing answers', async () => {
    const [tab] = portPair();
    const client = new LabClient(tab);
    const p = client.tcp('10.0.1.1', 8189, 'ADD 10.0.2.10 51000');
    const assertion = expect(p).rejects.toThrow('Connection timed out');
    await vi.advanceTimersByTimeAsync(TCP_CLIENT_TIMEOUT_MS + 1);
    await assertion;
  });

  it('surfaces a fatal host error instead of hanging', async () => {
    const [tab, worker] = portPair();
    const client = new LabClient(tab);
    const errors = /** @type {string[]} */ ([]);
    client.onError = (e) => errors.push(e);
    worker.postMessage({ type: 'fatal', error: 'boom' });
    await expect(client.ready).rejects.toThrow('boom');
    expect(errors).toEqual(['boom']);
  });

  it('ignores datagrams for ports it has closed', async () => {
    const [tab, worker] = portPair();
    const client = new LabClient(tab);
    /** @type {string[]} */
    const got = [];
    client.bindUdp(51000, (p) => got.push(p));
    client.closeUdp(51000);
    worker.postMessage({ type: 'udp', port: 51000, src: '10.0.1.1:49152', payload: 'x' });
    await vi.advanceTimersByTimeAsync(0);
    expect(got).toEqual([]);
  });
});
