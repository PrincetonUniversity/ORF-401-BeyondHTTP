// Shared test helpers: a seeded PRNG, a fake-timer Env and in-memory ports.

/** @param {number} seed */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Env backed by vitest fake timers (call vi.useFakeTimers() first).
 * @param {() => number} random
 * @returns {import('../../site/js/server-host.js').Env}
 */
export function fakeEnv(random) {
  return {
    random,
    now: () => Date.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (h) => clearTimeout(/** @type {any} */ (h)),
  };
}

/** A port that records what the host sends and lets the test send to the host. */
export function recordingPort() {
  /** @type {any[]} */
  const received = [];
  const port = {
    /** @type {((e: any) => void) | null} */
    onmessage: null,
    /** @param {unknown} m */
    postMessage(m) {
      received.push(structuredClone(m));
    },
    /** @param {unknown} m */
    send(m) {
      if (!port.onmessage) throw new Error('host has not attached');
      port.onmessage({ data: structuredClone(m) });
    },
    received,
    /** @param {string} type */
    of(type) {
      return received.filter((m) => m.type === type);
    },
  };
  return port;
}

/**
 * Two linked ports with MessagePort-like queuing: messages wait until the
 * receiver sets onmessage, then arrive asynchronously (microtask).
 */
export function portPair() {
  const make = () => {
    /** @type {any} */
    const p = {
      queue: /** @type {any[]} */ ([]),
      _onmessage: null,
      get onmessage() {
        return p._onmessage;
      },
      set onmessage(fn) {
        p._onmessage = fn;
        const pending = p.queue.splice(0);
        for (const m of pending) Promise.resolve().then(() => p._onmessage?.({ data: m }));
      },
      /** @param {unknown} m */
      postMessage(m) {
        const copy = structuredClone(m);
        const peer = p.peer;
        if (peer._onmessage) Promise.resolve().then(() => peer._onmessage?.({ data: copy }));
        else peer.queue.push(copy);
      },
    };
    return p;
  };
  const a = make();
  const b = make();
  a.peer = b;
  b.peer = a;
  return [a, b];
}
