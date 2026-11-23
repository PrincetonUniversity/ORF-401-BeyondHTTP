import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONDITIONS,
  TCP_INITIAL_RTO_MS,
  TCP_MAX_ATTEMPTS,
  tcpFate,
  udpFate,
  validateConditions,
} from '../../site/js/network.js';
import { seeded } from './helpers.js';

/** @param {number[]} values */
const scripted = (values) => {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error('scripted random exhausted');
    return values[i++];
  };
};

describe('validateConditions', () => {
  it('accepts valid partial updates', () => {
    expect(validateConditions({ loss: 0.25, latencyMs: 100, jitterMs: 0, speed: 5, paused: true })).toEqual({
      loss: 0.25,
      latencyMs: 100,
      jitterMs: 0,
      speed: 5,
      paused: true,
    });
    expect(validateConditions({})).toEqual({});
  });

  it.each([
    null,
    [],
    'loss',
    { loss: -0.1 },
    { loss: 1.1 },
    { loss: Number.NaN },
    { latencyMs: 2001 },
    { latencyMs: 1.5 },
    { jitterMs: -1 },
    { speed: 3 },
    { paused: 'yes' },
    { bogus: 1 },
  ])('rejects %j', (input) => {
    expect(validateConditions(input)).toBeNull();
  });
});

describe('udpFate', () => {
  it('never loses with 0% loss and always loses with 100%', () => {
    const r = seeded(1);
    for (let i = 0; i < 500; i++) {
      expect(udpFate({ ...DEFAULT_CONDITIONS, loss: 0 }, r).lost).toBe(false);
      expect(udpFate({ ...DEFAULT_CONDITIONS, loss: 1 }, r).lost).toBe(true);
    }
  });

  it('loses roughly the configured fraction', () => {
    const r = seeded(2);
    let lost = 0;
    for (let i = 0; i < 10000; i++) if (udpFate({ ...DEFAULT_CONDITIONS, loss: 0.3 }, r).lost) lost++;
    expect(lost / 10000).toBeGreaterThan(0.27);
    expect(lost / 10000).toBeLessThan(0.33);
  });

  it('keeps delay within latency + jitter', () => {
    const r = seeded(3);
    for (let i = 0; i < 500; i++) {
      const { delayMs } = udpFate({ ...DEFAULT_CONDITIONS, latencyMs: 100, jitterMs: 50 }, r);
      expect(delayMs).toBeGreaterThanOrEqual(100);
      expect(delayMs).toBeLessThanOrEqual(150);
    }
  });
});

describe('tcpFate', () => {
  const c = { ...DEFAULT_CONDITIONS, latencyMs: 10, jitterMs: 0 };

  it('succeeds on the first attempt without loss', () => {
    const f = tcpFate({ ...c, loss: 0 }, scripted([0.5, 0.5, 0, 0]));
    expect(f).toEqual({ ok: true, attempts: 1, lostAttempts: [], requestDelayMs: 10, totalDelayMs: 20 });
  });

  it('retransmits with exponential backoff, then succeeds', () => {
    // attempt 1: request lost; attempt 2: reply lost; attempt 3: both survive
    const f = tcpFate({ ...c, loss: 0.5 }, scripted([0.1, 0.9, 0.1, 0.9, 0.9, 0, 0]));
    expect(f.ok).toBe(true);
    expect(f.attempts).toBe(3);
    expect(f.lostAttempts).toEqual([TCP_INITIAL_RTO_MS, TCP_INITIAL_RTO_MS * 3]);
    expect(f.totalDelayMs).toBe(TCP_INITIAL_RTO_MS * 3 + 20);
  });

  it('gives up after the maximum number of attempts at 100% loss', () => {
    const f = tcpFate({ ...c, loss: 1 }, seeded(4));
    expect(f.ok).toBe(false);
    expect(f.attempts).toBe(TCP_MAX_ATTEMPTS);
    expect(f.lostAttempts).toHaveLength(TCP_MAX_ATTEMPTS);
    expect(f.totalDelayMs).toBe(TCP_INITIAL_RTO_MS * (2 ** TCP_MAX_ATTEMPTS - 1));
  });
});
