// Simulated network conditions. Browsers cannot open raw TCP or UDP sockets,
// so the demo models what the two transports would do on a lossy link.

/**
 * @typedef {object} Conditions
 * @property {number} loss      probability (0..1) that any one packet is lost
 * @property {number} latencyMs one-way base latency
 * @property {number} jitterMs  extra random one-way delay (0..jitterMs); large jitter reorders datagrams
 * @property {number} speed     reporter speed multiplier (1 = the lab's 2.5-7.5 s cadence)
 * @property {boolean} paused   when true the reporters stop sending
 */

/** @type {Readonly<Conditions>} */
export const DEFAULT_CONDITIONS = Object.freeze({
  loss: 0,
  latencyMs: 40,
  jitterMs: 20,
  speed: 1,
  paused: false,
});

export const LIMITS = Object.freeze({
  latencyMs: 2000,
  jitterMs: 2000,
  speeds: Object.freeze([1, 5, 20]),
});

/** TCP retransmission model: first timeout and number of attempts before giving up. */
export const TCP_INITIAL_RTO_MS = 200;
export const TCP_MAX_ATTEMPTS = 6;

/**
 * Validate a partial conditions update from a client. Unknown keys and
 * out-of-range values are rejected rather than clamped so bugs surface.
 *
 * @param {unknown} input
 * @returns {Partial<Conditions> | null}
 */
export function validateConditions(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  /** @type {Partial<Conditions>} */
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    switch (key) {
      case 'loss':
        if (typeof value !== 'number' || !(value >= 0 && value <= 1)) return null;
        out.loss = value;
        break;
      case 'latencyMs':
      case 'jitterMs':
        if (!Number.isInteger(value) || value < 0 || value > LIMITS[key]) return null;
        out[key] = value;
        break;
      case 'speed':
        if (!LIMITS.speeds.includes(/** @type {number} */ (value))) return null;
        out.speed = /** @type {number} */ (value);
        break;
      case 'paused':
        if (typeof value !== 'boolean') return null;
        out.paused = value;
        break;
      default:
        return null;
    }
  }
  return out;
}

/**
 * One-way delay for a single packet.
 *
 * @param {Conditions} c
 * @param {() => number} random
 */
export function oneWayDelay(c, random) {
  return c.latencyMs + Math.floor(random() * (c.jitterMs + 1));
}

/**
 * What happens to one UDP datagram: no acknowledgement, no retry.
 *
 * @param {Conditions} c
 * @param {() => number} random
 * @returns {{ lost: boolean, delayMs: number }}
 */
export function udpFate(c, random) {
  const lost = random() < c.loss;
  return { lost, delayMs: oneWayDelay(c, random) };
}

/**
 * What happens to one TCP request/response exchange. Each attempt needs the
 * request and the reply to survive; a lost attempt costs one retransmission
 * timeout, which doubles each time (exponential backoff).
 *
 * @param {Conditions} c
 * @param {() => number} random
 * @returns {{ ok: boolean, attempts: number, lostAttempts: number[], requestDelayMs: number, totalDelayMs: number }}
 *   lostAttempts lists the elapsed time at which each retransmission fired.
 */
export function tcpFate(c, random) {
  let elapsed = 0;
  let rto = TCP_INITIAL_RTO_MS;
  /** @type {number[]} */
  const lostAttempts = [];
  for (let attempt = 1; attempt <= TCP_MAX_ATTEMPTS; attempt += 1) {
    const requestLost = random() < c.loss;
    const replyLost = !requestLost && random() < c.loss;
    if (!requestLost && !replyLost) {
      const there = oneWayDelay(c, random);
      const back = oneWayDelay(c, random);
      return {
        ok: true,
        attempts: attempt,
        lostAttempts,
        requestDelayMs: elapsed + there,
        totalDelayMs: elapsed + there + back,
      };
    }
    elapsed += rto;
    lostAttempts.push(elapsed);
    rto *= 2;
  }
  return { ok: false, attempts: TCP_MAX_ATTEMPTS, lostAttempts, requestDelayMs: elapsed, totalDelayMs: elapsed };
}
