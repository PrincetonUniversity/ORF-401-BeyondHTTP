import { describe, expect, it } from 'vitest';
import { ListenerRegistry } from '../../site/js/registry.js';

describe('ListenerRegistry (GateListenerDatabase)', () => {
  it('adds a listener once and refuses duplicates', () => {
    const r = new ListenerRegistry();
    expect(r.add('10.0.2.10', 51000, 1)).toBe(true);
    expect(r.add('10.0.2.10', 51000, 2)).toBe(false);
    expect(r.add('10.0.2.10', 51001, 3)).toBe(true);
    expect(r.size).toBe(2);
    expect(r.all()).toEqual([
      { host: '10.0.2.10', port: 51000, created: 1 },
      { host: '10.0.2.10', port: 51001, created: 3 },
    ]);
  });

  it('drops only listeners that exist', () => {
    const r = new ListenerRegistry();
    r.add('10.0.2.10', 51000, 1);
    expect(r.drop('10.0.2.11', 51000)).toBe(false);
    expect(r.drop('10.0.2.10', 51000)).toBe(true);
    expect(r.drop('10.0.2.10', 51000)).toBe(false);
    expect(r.size).toBe(0);
  });
});
