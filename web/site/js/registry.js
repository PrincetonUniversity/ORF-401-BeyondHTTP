// Port of Lab5_Server/GateListenerDatabase.java: a table of host:port listeners.

/** @typedef {{ host: string, port: number, created: number }} ListenerRecord */

export class ListenerRegistry {
  constructor() {
    /** @type {Map<string, ListenerRecord>} */
    this.records = new Map();
  }

  /**
   * @param {string} host
   * @param {number} port
   */
  static key(host, port) {
    return `${host}:${port}`;
  }

  /**
   * Returns false when the listener is already registered,
   * matching GateListenerDatabase.add().
   *
   * @param {string} host
   * @param {number} port
   * @param {number} now
   */
  add(host, port, now) {
    const key = ListenerRegistry.key(host, port);
    if (this.records.has(key)) return false;
    this.records.set(key, { host, port, created: now });
    return true;
  }

  /**
   * @param {string} host
   * @param {number} port
   */
  drop(host, port) {
    return this.records.delete(ListenerRegistry.key(host, port));
  }

  /** @returns {ListenerRecord[]} */
  all() {
    return [...this.records.values()];
  }

  get size() {
    return this.records.size;
  }
}
