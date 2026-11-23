// Wire formats used by Lab 5, ported from the Java sources.
//
// Control channel (TCP 8189), one line per connection:
//   client -> server  "ADD <host> <port>"   server -> client "HELLO <host> <port>"
//   client -> server  "DROP <host> <port>"  server -> client "BYE <host> <port>"
//   (see Lab5_Server/GateListenerRegistrar.java)
//
// Data channel (UDP 51000+), one datagram per gate change:
//   "<AIRLINE>,<DESTINATION>,SEAT,<n>,GATE,<n>"
//   (see Lab5_Server/GateReporter.java and Lab5/GateListener.java)

export const CONTROL_PORT = 8189;
export const MAX_DATAGRAM_BYTES = 255; // GateListener's receive buffer

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/** @param {string} host */
export function isValidHost(host) {
  return IPV4.test(host);
}

/** @param {string} text */
function parsePort(text) {
  if (!/^\d{1,5}$/.test(text)) return null;
  const port = Number(text);
  return port >= 1 && port <= 65535 ? port : null;
}

/**
 * @typedef {{ ok: true, command: 'ADD' | 'DROP', host: string, port: number }} ParsedControl
 * @typedef {{ ok: false, reply: string }} ControlError
 */

/**
 * Parse one control line the way GateListenerRegistrar.run() does.
 * Failure results carry the exact reply the Java registrar would send.
 *
 * @param {string} line
 * @returns {ParsedControl | ControlError}
 */
export function parseControl(line) {
  const tokens = String(line).trim().split(/\s+/).filter(Boolean);
  const [command, host, portText] = tokens;
  if (command !== 'ADD' && command !== 'DROP') {
    return { ok: false, reply: 'INVALID COMMAND' };
  }
  if (host === undefined || !isValidHost(host)) {
    return { ok: false, reply: 'INVALID HOST' };
  }
  const port = portText === undefined ? null : parsePort(portText);
  if (port === null) {
    return { ok: false, reply: 'INVALID PORT' };
  }
  return { ok: true, command, host, port };
}

/**
 * @param {'ADD' | 'DROP'} command
 * @param {string} host
 * @param {number} port
 */
export function formatControl(command, host, port) {
  return `${command} ${host} ${port}`;
}

/**
 * @typedef {{ airline: string, destination: string, seats: number, gate: number }} GateChange
 */

/** @param {GateChange} change */
export function formatGateMessage(change) {
  return `${change.airline},${change.destination},SEAT,${change.seats},GATE,${change.gate}`;
}

/**
 * Parse a datagram the way GateListener.processMessage() does.
 * Malformed datagrams return null; the Java client silently ignores them.
 *
 * @param {string} message
 * @returns {GateChange | null}
 */
export function parseGateMessage(message) {
  const parts = String(message).split(',');
  if (parts.length !== 6) return null;
  const [airline, destination, seatLabel, seatText, gateLabel, gateText] = parts;
  if (seatLabel !== 'SEAT' || gateLabel !== 'GATE') return null;
  if (!airline || !destination) return null;
  if (!/^\d+$/.test(seatText) || !/^\d+$/.test(gateText)) return null;
  return { airline, destination, seats: Number(seatText), gate: Number(gateText) };
}

/**
 * Parse des_code.csv ("<id>,<name>" per line, CRLF tolerated).
 * Mirrors GateReporter: reading stops at the first blank line.
 *
 * @param {string} csv
 * @returns {string[]}
 */
export function parseDestinations(csv) {
  /** @type {string[]} */
  const names = [];
  for (const raw of csv.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line === '') break;
    const comma = line.indexOf(',');
    if (comma < 0) throw new Error(`des_code.csv: malformed line ${JSON.stringify(line)}`);
    const name = line
      .slice(comma + 1)
      .split(',')[0]
      .trim();
    if (!name) throw new Error(`des_code.csv: empty destination in ${JSON.stringify(line)}`);
    names.push(name);
  }
  if (names.length === 0) throw new Error('des_code.csv: no destinations');
  return names;
}

/**
 * One line of the gate board, as GateInformationBoard.display() lays it out
 * with String.format("%-25s") and String.format("%-8s").
 *
 * @param {string} destination
 * @param {number | string} seats
 * @param {number | string} gate
 */
export function boardRow(destination, seats, gate) {
  return destination.padEnd(25) + String(seats).padEnd(11) + String(gate);
}

export const BOARD_HEADER = boardRow('Destination', 'Av. Seats', 'Gate');
