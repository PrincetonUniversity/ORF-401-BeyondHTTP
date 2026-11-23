// Tab-side socket API over the MessagePort to the ServerHost.
// Mirrors what GateInformationBoard / GateListener do with java.net.

export const TCP_CLIENT_TIMEOUT_MS = 20000;

/**
 * @typedef {import('./server-host.js').LogEntry} LogEntry
 * @typedef {{ name: string, listeners: string[], sent: number, lost: number }} CompanyState
 * @typedef {{ conditions: import('./network.js').Conditions, companiesState: CompanyState[] }} HostState
 * @typedef {HostState & { ip: string, companies: { name: string, ip: string }[], controlPort: number, log: LogEntry[] }} Welcome
 * @typedef {{ postMessage: (m: unknown) => void, onmessage: ((e: MessageEvent) => void) | null }} PortLike
 */

export class LabClient {
  /** @param {PortLike} port */
  constructor(port) {
    this.port = port;
    this.nextId = 1;
    /** @type {Map<number, { resolve: (line: string) => void, reject: (e: Error) => void, timer: ReturnType<typeof setTimeout> }>} */
    this.pending = new Map();
    /** @type {Map<number, (payload: string, src: string) => void>} */
    this.sockets = new Map();
    /** @type {(state: HostState) => void} */
    this.onState = () => {};
    /** @type {(entry: LogEntry) => void} */
    this.onLog = () => {};
    /** @type {(error: string) => void} */
    this.onError = () => {};
    /** @type {Promise<Welcome>} */
    this.ready = new Promise((resolve, reject) => {
      this.resolveWelcome = resolve;
      this.rejectWelcome = reject;
    });
    port.onmessage = (event) => this.dispatch(event.data);
  }

  /** @param {any} m */
  dispatch(m) {
    if (!m || typeof m.type !== 'string') return;
    switch (m.type) {
      case 'welcome':
        this.ip = m.ip;
        this.resolveWelcome?.(m);
        break;
      case 'fatal':
        this.rejectWelcome?.(new Error(m.error));
        this.onError(m.error);
        break;
      case 'error':
        this.onError(m.error);
        break;
      case 'state':
        this.onState(m);
        break;
      case 'log':
        this.onLog(m.entry);
        break;
      case 'udp': {
        const handler = this.sockets.get(m.port);
        if (handler) handler(m.payload, m.src);
        break;
      }
      case 'tcp-reply': {
        const call = this.pending.get(m.id);
        if (!call) return;
        this.pending.delete(m.id);
        clearTimeout(call.timer);
        if (m.ok) call.resolve(m.line);
        else call.reject(new Error(m.error));
        break;
      }
    }
  }

  /**
   * Open a one-line TCP exchange: connect, println(line), readLine().
   *
   * @param {string} host
   * @param {number} port
   * @param {string} line
   * @returns {Promise<string>}
   */
  tcp(host, port, line) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Connection timed out'));
      }, TCP_CLIENT_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.port.postMessage({ type: 'tcp', id, host, port, line });
    });
  }

  /**
   * new DatagramSocket(port) + receive loop.
   *
   * @param {number} port
   * @param {(payload: string, src: string) => void} handler
   */
  bindUdp(port, handler) {
    this.sockets.set(port, handler);
    this.port.postMessage({ type: 'bind', port });
  }

  /** @param {number} port */
  closeUdp(port) {
    this.sockets.delete(port);
    this.port.postMessage({ type: 'unbind', port });
  }

  /** @param {Partial<import('./network.js').Conditions>} conditions */
  setConditions(conditions) {
    this.port.postMessage({ type: 'set-conditions', conditions });
  }

  reset() {
    this.port.postMessage({ type: 'reset' });
  }

  bye() {
    this.port.postMessage({ type: 'bye' });
  }
}
