import { describe, expect, it } from 'vitest';
import { COMPACT_VIEW, MAX_CLIENT_NODES, VIEW, hostOf, layout, packetStyle } from '../../site/js/diagram.js';

const SERVERS = [
  { name: 'CarmonCar', ip: '10.0.1.1' },
  { name: 'VandeRides', ip: '10.0.1.2' },
];

/** @param {string} status @param {'TCP' | 'UDP'} proto */
const entry = (status, proto = 'UDP') =>
  /** @type {import('../../site/js/server-host.js').LogEntry} */ ({
    seq: 1,
    t: 0,
    proto,
    src: '10.0.1.1:49152',
    dst: '10.0.2.10:51000',
    payload: 'x',
    status,
  });

describe('hostOf', () => {
  it('strips the port', () => {
    expect(hostOf('10.0.2.10:51000')).toBe('10.0.2.10');
    expect(hostOf('10.0.2.10')).toBe('10.0.2.10');
  });
});

describe('packetStyle', () => {
  it('lets delivered packets travel the whole path', () => {
    expect(packetStyle(entry('delivered'))).toEqual({ kind: 'udp', tone: 'ok', stopAt: 1 });
    expect(packetStyle(entry('delivered', 'TCP'))).toEqual({ kind: 'tcp', tone: 'ok', stopAt: 1 });
  });

  it('stops lost, timed-out and retransmitted packets halfway', () => {
    expect(packetStyle(entry('lost'))).toMatchObject({ tone: 'lost', stopAt: 0.5 });
    expect(packetStyle(entry('timeout', 'TCP'))).toMatchObject({ tone: 'lost', stopAt: 0.5 });
    expect(packetStyle(entry('retransmit', 'TCP'))).toMatchObject({ tone: 'warn', stopAt: 0.5 });
  });

  it('marks unreachable and refused packets', () => {
    expect(packetStyle(entry('unreachable'))).toMatchObject({ tone: 'muted', stopAt: 1 });
    expect(packetStyle(entry('refused', 'TCP'))).toMatchObject({ tone: 'bad', stopAt: 1 });
  });
});

describe('layout', () => {
  it('puts servers left and this tab right, inside the view box', () => {
    const { nodes, nodeFor } = layout(SERVERS, [], '10.0.2.10');
    expect(nodes.map((n) => [n.id, n.kind])).toEqual([
      ['10.0.1.1', 'server'],
      ['10.0.1.2', 'server'],
      ['10.0.2.10', 'self'],
    ]);
    expect(nodeFor('10.0.1.1')?.x).toBe(VIEW.serverX);
    expect(nodeFor('10.0.2.10')?.x).toBe(VIEW.clientX);
    for (const n of nodes) {
      expect(n.y).toBeGreaterThanOrEqual(VIEW.pad);
      expect(n.y).toBeLessThanOrEqual(VIEW.height - VIEW.pad);
    }
    expect(nodeFor('10.9.9.9')).toBeUndefined();
  });

  it('orders other clients numerically and de-duplicates them', () => {
    const { nodes } = layout(SERVERS, ['10.0.2.100', '10.0.2.11', '10.0.2.11', '10.0.2.10'], '10.0.2.10');
    expect(nodes.filter((n) => n.kind !== 'server').map((n) => n.id)).toEqual(['10.0.2.10', '10.0.2.11', '10.0.2.100']);
  });

  it('folds clients beyond the limit into one "others" node', () => {
    const clients = Array.from({ length: 10 }, (_, i) => `10.0.2.${20 + i}`);
    const { nodes, nodeFor } = layout(SERVERS, clients, '10.0.2.10');
    const right = nodes.filter((n) => n.kind !== 'server');
    expect(right).toHaveLength(MAX_CLIENT_NODES + 1);
    const others = right.at(-1);
    expect(others?.kind).toBe('other');
    expect(others?.label).toBe(`+${10 - (MAX_CLIENT_NODES - 1)} more`);
    expect(nodeFor('10.0.2.29')).toBe(others);
    expect(nodeFor('10.0.2.20')?.kind).toBe('client');
    const ys = right.map((n) => n.y);
    expect(new Set(ys).size).toBe(ys.length);
  });
});

describe('compact layout', () => {
  it('keeps nodes (132 wide) inside the narrower view box', () => {
    const clients = Array.from({ length: 10 }, (_, i) => `10.0.2.${20 + i}`);
    const { nodes } = layout(SERVERS, clients, '10.0.2.10', COMPACT_VIEW);
    for (const n of nodes) {
      expect(n.x - 66).toBeGreaterThanOrEqual(0);
      expect(n.x + 66).toBeLessThanOrEqual(COMPACT_VIEW.width);
      expect(n.y - 24).toBeGreaterThanOrEqual(0);
      expect(n.y + 24).toBeLessThanOrEqual(COMPACT_VIEW.height);
    }
  });
});
