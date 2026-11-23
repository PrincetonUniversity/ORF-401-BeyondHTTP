// The "server side" of Lab 5, running in a SharedWorker (all tabs share it)
// or, where SharedWorker is unavailable, inside the page itself.
//
// One ServerHost plays every machine on the simulated network:
//   - one GateReportingSystem per airline (registrar on TCP 8189 + reporter), and
//   - the wire between them and every connected tab, applying loss and delay.

import { CONTROL_PORT, formatGateMessage, isValidHost, parseControl } from './protocol.js';
import { DEFAULT_CONDITIONS, tcpFate, udpFate, validateConditions } from './network.js';
import { ListenerRegistry } from './registry.js';

/** @typedef {import('./network.js').Conditions} Conditions */

export const AIRLINES = Object.freeze([
  Object.freeze({ name: 'CarmonCar', ip: '10.0.1.1', sourcePort: 49152 }),
  Object.freeze({ name: 'VandeRides', ip: '10.0.1.2', sourcePort: 49153 }),
]);

export const CLIENT_SUBNET = '10.0.2.';
export const FIRST_CLIENT_HOST = 10;
export const LOG_HISTORY = 100;
export const MAX_LINE_LENGTH = 200;

/**
 * @typedef {object} Env
 * @property {() => number} random
 * @property {() => number} now
 * @property {(fn: () => void, ms: number) => unknown} setTimeout
 * @property {(handle: unknown) => void} clearTimeout
 */

/**
 * @typedef {object} PortLike
 * @property {(message: unknown) => void} postMessage
 * @property {((event: MessageEvent) => void) | null} onmessage
 */

/**
 * @typedef {'delivered' | 'lost' | 'unreachable' | 'retransmit' | 'timeout' | 'refused'} LogStatus
 * @typedef {{ seq: number, t: number, proto: 'TCP' | 'UDP', src: string, dst: string, payload: string, status: LogStatus }} LogEntry
 */

/**
 * @typedef {{ type: 'bind' | 'unbind', port: number }} BindMessage
 * @typedef {{ type: 'tcp', id: number, host: string, port: number, line: string }} TcpMessage
 * @typedef {{ type: 'set-conditions', conditions: Partial<Conditions> }} ConditionsMessage
 * @typedef {{ type: 'reset' } | { type: 'bye' }} SimpleMessage
 * @typedef {BindMessage | TcpMessage | ConditionsMessage | SimpleMessage} ClientMessage
 */

/** @param {unknown} n */
function isPort(n) {
  return Number.isInteger(n) && /** @type {number} */ (n) >= 1 && /** @type {number} */ (n) <= 65535;
}

/**
 * Validate a message arriving from a tab. Returns null for anything malformed.
 *
 * @param {unknown} data
 * @returns {ClientMessage | null}
 */
export function validateClientMessage(data) {
  if (typeof data !== 'object' || data === null) return null;
  const m = /** @type {Record<string, unknown>} */ (data);
  switch (m.type) {
    case 'bind':
    case 'unbind':
      return isPort(m.port) ? { type: m.type, port: /** @type {number} */ (m.port) } : null;
    case 'tcp':
      if (!Number.isSafeInteger(m.id) || typeof m.host !== 'string' || !isPort(m.port)) return null;
      if (typeof m.line !== 'string' || m.line.length > MAX_LINE_LENGTH || /[\r\n]/.test(m.line)) return null;
      return {
        type: 'tcp',
        id: /** @type {number} */ (m.id),
        host: m.host,
        port: /** @type {number} */ (m.port),
        line: m.line,
      };
    case 'set-conditions': {
      const conditions = validateConditions(m.conditions);
      return conditions ? { type: 'set-conditions', conditions } : null;
    }
    case 'reset':
    case 'bye':
      return { type: m.type };
    default:
      return null;
  }
}

class Client {
  /**
   * @param {string} ip
   * @param {PortLike} port
   */
  constructor(ip, port) {
    this.ip = ip;
    this.port = port;
    /** @type {Set<number>} */
    this.bound = new Set();
  }
}

class Airline {
  /**
   * @param {{ name: string, ip: string, sourcePort: number }} spec
   */
  constructor(spec) {
    this.name = spec.name;
    this.ip = spec.ip;
    this.sourcePort = spec.sourcePort;
    this.registry = new ListenerRegistry();
    this.sent = 0;
    this.lost = 0;
    /** @type {unknown} */
    this.timer = null;
  }
}

export class ServerHost {
  /**
   * @param {string[]} destinations parsed des_code.csv
   * @param {Env} env
   */
  constructor(destinations, env) {
    if (destinations.length === 0) throw new Error('ServerHost needs at least one destination');
    this.destinations = destinations;
    this.env = env;
    /** @type {Conditions} */
    this.conditions = { ...DEFAULT_CONDITIONS };
    /** @type {Map<string, Client>} */
    this.clients = new Map();
    this.nextHost = FIRST_CLIENT_HOST;
    this.seq = 0;
    /** @type {LogEntry[]} */
    this.log = [];
    this.airlines = AIRLINES.map((spec) => new Airline(spec));
    for (const airline of this.airlines) this.schedule(airline);
  }

  /**
   * Attach a tab. The tab is given the next free address on the client subnet.
   *
   * @param {PortLike} port
   * @returns {string} the tab's IP address
   */
  connect(port) {
    const ip = this.allocateIp();
    const client = new Client(ip, port);
    this.clients.set(ip, client);
    port.onmessage = (event) => this.handle(client, event.data);
    port.postMessage({
      type: 'welcome',
      ip,
      airlines: this.airlines.map((a) => ({ name: a.name, ip: a.ip })),
      controlPort: CONTROL_PORT,
      log: this.log,
      ...this.snapshot(),
    });
    return ip;
  }

  allocateIp() {
    for (let tries = 0; tries < 245; tries += 1) {
      const ip = CLIENT_SUBNET + this.nextHost;
      this.nextHost = this.nextHost >= 254 ? FIRST_CLIENT_HOST : this.nextHost + 1;
      if (!this.clients.has(ip)) return ip;
    }
    throw new Error('Simulated subnet is full');
  }

  snapshot() {
    return {
      conditions: { ...this.conditions },
      airlinesState: this.airlines.map((a) => ({
        name: a.name,
        listeners: a.registry.all().map((r) => `${r.host}:${r.port}`),
        sent: a.sent,
        lost: a.lost,
      })),
    };
  }

  broadcastState() {
    const message = { type: 'state', ...this.snapshot() };
    for (const client of this.clients.values()) client.port.postMessage(message);
  }

  /**
   * @param {Omit<LogEntry, 'seq' | 't'>} entry
   */
  record(entry) {
    this.seq += 1;
    const full = { seq: this.seq, t: this.env.now(), ...entry };
    this.log.push(full);
    if (this.log.length > LOG_HISTORY) this.log.shift();
    for (const client of this.clients.values()) client.port.postMessage({ type: 'log', entry: full });
  }

  /**
   * @param {Client} client
   * @param {unknown} data
   */
  handle(client, data) {
    const message = validateClientMessage(data);
    if (!message) {
      client.port.postMessage({ type: 'error', error: 'Malformed message ignored' });
      return;
    }
    switch (message.type) {
      case 'bind':
        client.bound.add(message.port);
        break;
      case 'unbind':
        client.bound.delete(message.port);
        break;
      case 'tcp':
        this.tcp(client, message);
        break;
      case 'set-conditions': {
        const speedChanged =
          message.conditions.speed !== undefined && message.conditions.speed !== this.conditions.speed;
        Object.assign(this.conditions, message.conditions);
        if (speedChanged) for (const airline of this.airlines) this.schedule(airline);
        this.broadcastState();
        break;
      }
      case 'reset':
        for (const airline of this.airlines) {
          airline.registry = new ListenerRegistry();
          airline.sent = 0;
          airline.lost = 0;
        }
        this.conditions = { ...DEFAULT_CONDITIONS };
        for (const airline of this.airlines) this.schedule(airline);
        this.broadcastState();
        break;
      case 'bye':
        this.clients.delete(client.ip);
        break;
    }
  }

  /**
   * Simulate one short-lived TCP connection carrying one request line and one reply line.
   *
   * @param {Client} client
   * @param {TcpMessage} message
   */
  tcp(client, message) {
    const src = `${client.ip}:${50000 + (message.id % 1000)}`;
    const dst = `${message.host}:${message.port}`;
    /** @param {{ ok: true, line: string } | { ok: false, error: string }} result */
    const reply = (result) => client.port.postMessage({ type: 'tcp-reply', id: message.id, ...result });
    const airline = this.airlines.find((a) => a.ip === message.host);
    const fate = tcpFate(this.conditions, this.env.random);

    if (!airline || message.port !== CONTROL_PORT) {
      // No route: SYN goes unanswered. Refused: the host answers with RST.
      const status = airline ? 'refused' : 'unreachable';
      const delay = airline ? fate.totalDelayMs : 0;
      this.env.setTimeout(() => {
        this.record({ proto: 'TCP', src, dst, payload: message.line, status });
        reply({ ok: false, error: airline ? 'Connection refused' : 'No route to host' });
      }, delay);
      return;
    }

    for (const at of fate.lostAttempts.slice(0, fate.ok ? undefined : -1)) {
      this.env.setTimeout(
        () => this.record({ proto: 'TCP', src, dst, payload: message.line, status: 'retransmit' }),
        at,
      );
    }
    if (!fate.ok) {
      this.env.setTimeout(() => {
        this.record({ proto: 'TCP', src, dst, payload: message.line, status: 'timeout' });
        reply({ ok: false, error: 'Connection timed out' });
      }, fate.totalDelayMs);
      return;
    }

    this.env.setTimeout(() => {
      this.record({ proto: 'TCP', src, dst, payload: message.line, status: 'delivered' });
      const answer = this.register(airline, message.line);
      this.env.setTimeout(() => {
        this.record({ proto: 'TCP', src: dst, dst: src, payload: answer, status: 'delivered' });
        reply({ ok: true, line: answer });
      }, fate.totalDelayMs - fate.requestDelayMs);
    }, fate.requestDelayMs);
  }

  /**
   * GateListenerRegistrar: apply one control line and return the reply line.
   *
   * @param {Airline} airline
   * @param {string} line
   */
  register(airline, line) {
    const parsed = parseControl(line);
    if (!parsed.ok) return parsed.reply;
    const { host, port } = parsed;
    let answer;
    if (parsed.command === 'ADD') {
      answer = airline.registry.add(host, port, this.env.now())
        ? `HELLO ${host} ${port}`
        : 'You failed to deregister last time!';
    } else {
      answer = airline.registry.drop(host, port) ? `BYE ${host} ${port}` : `UNABLE TO DROP ${host} ${port}`;
    }
    this.broadcastState();
    return answer;
  }

  /** @param {Airline} airline */
  schedule(airline) {
    if (airline.timer !== null) this.env.clearTimeout(airline.timer);
    // GateReporter: delay = |r.nextInt()| % 5000 + 2500 ms
    const delay = (2500 + Math.floor(this.env.random() * 5000)) / this.conditions.speed;
    airline.timer = this.env.setTimeout(() => {
      airline.timer = null;
      if (!this.conditions.paused) this.report(airline);
      this.schedule(airline);
    }, delay);
  }

  /**
   * GateReporter.run(): one random gate change, one datagram per registered listener.
   *
   * @param {Airline} airline
   */
  report(airline) {
    const r = this.env.random;
    const payload = formatGateMessage({
      airline: airline.name,
      destination: this.destinations[Math.floor(r() * this.destinations.length)],
      seats: 1 + Math.floor(r() * 5),
      gate: 1 + Math.floor(r() * 30),
    });
    const listeners = airline.registry.all();
    for (const listener of listeners) this.sendDatagram(airline, listener.host, listener.port, payload);
    if (listeners.length > 0) this.broadcastState();
  }

  /**
   * @param {Airline} airline
   * @param {string} host
   * @param {number} port
   * @param {string} payload
   */
  sendDatagram(airline, host, port, payload) {
    const src = `${airline.ip}:${airline.sourcePort}`;
    const dst = `${host}:${port}`;
    const fate = udpFate(this.conditions, this.env.random);
    airline.sent += 1;
    if (fate.lost) {
      airline.lost += 1;
      this.record({ proto: 'UDP', src, dst, payload, status: 'lost' });
      return;
    }
    this.env.setTimeout(() => {
      const client = isValidHost(host) ? this.clients.get(host) : undefined;
      if (!client || !client.bound.has(port)) {
        // The sender never learns about this: UDP has no acknowledgement.
        this.record({ proto: 'UDP', src, dst, payload, status: 'unreachable' });
        return;
      }
      this.record({ proto: 'UDP', src, dst, payload, status: 'delivered' });
      client.port.postMessage({ type: 'udp', src, port, payload });
    }, fate.delayMs);
  }

  stop() {
    for (const airline of this.airlines) {
      if (airline.timer !== null) this.env.clearTimeout(airline.timer);
      airline.timer = null;
    }
  }
}

/** @returns {Env} */
export function browserEnv() {
  return {
    random: Math.random,
    now: () => Date.now(),
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (handle) => globalThis.clearTimeout(/** @type {number} */ (handle)),
  };
}
