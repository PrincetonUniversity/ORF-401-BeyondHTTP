// Page controller: two GateInformationBoards (as GateKeeper.main() creates),
// a view of each server's registered listeners, network controls, a raw TCP
// console and a packet log.

import { LabClient } from './client.js';
import { LiveDiagram } from './diagram.js';
import { BOARD_HEADER, boardRow, formatControl, parseGateMessage } from './protocol.js';
import { LIMITS } from './network.js';

/** @typedef {import('./client.js').HostState} HostState */
/** @typedef {import('./client.js').LogEntry} LogEntry */

const BOARD_LINES = 200;
const LOG_ROWS = 200;

// GateKeeper.java: CarmonCar on UDP 51000, Vanderides on UDP 51001.
const BOARDS = [
  { airline: 'CarmonCar', udpPort: 51000, logo: 'img/carmoncar.png' },
  { airline: 'Vanderides', udpPort: 51001, logo: 'img/vanderides.png' },
];

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T}
 */
function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return /** @type {T} */ (el);
}

/**
 * @param {string} tag
 * @param {Record<string, string>} [attrs]
 * @param {string} [text]
 */
function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** @param {number} t */
function clock(t) {
  return new Date(t).toLocaleTimeString([], { hour12: false }) + '.' + String(t % 1000).padStart(3, '0');
}

class GateBoard {
  /**
   * @param {LabClient} client
   * @param {{ airline: string, udpPort: number, logo: string }} spec
   * @param {string} serverIp
   * @param {number} controlPort
   */
  constructor(client, spec, serverIp, controlPort) {
    this.client = client;
    this.spec = spec;
    this.serverIp = serverIp;
    this.controlPort = controlPort;
    this.registered = false;
    this.busy = false;
    this.received = 0;
    /** @type {string[]} */
    this.lines = [];

    const root = el('section', { class: 'board', 'data-airline': spec.airline });
    const head = el('header');
    head.append(el('img', { src: spec.logo, alt: `${spec.airline} logo`, width: '273', height: '48' }));
    const meta = el('p', { class: 'meta' });
    meta.append(
      el('span', {}, `server ${serverIp}:${controlPort} · my UDP port ${spec.udpPort} · received `),
      (this.counter = el('strong', { 'data-testid': 'received' }, '0')),
    );
    head.append(meta);
    this.status = el('p', { class: 'status', 'data-testid': 'status', role: 'status' }, 'Not registered');
    this.toggle = /** @type {HTMLButtonElement} */ (
      el('button', { type: 'button', 'data-testid': 'register' }, 'Register')
    );
    this.toggle.addEventListener('click', () => void (this.registered ? this.unregister() : this.register()));
    const controls = el('div', { class: 'row' });
    controls.append(this.toggle, this.status);
    this.screen = el('pre', {
      class: 'screen',
      'data-testid': 'screen',
      tabindex: '0',
      'aria-label': `${spec.airline} gate board`,
    });
    this.screen.textContent = BOARD_HEADER;
    root.append(head, controls, this.screen);
    this.root = root;

    client.bindUdp(spec.udpPort, (payload) => this.onDatagram(payload));
  }

  /** @param {string} line */
  async control(line) {
    this.busy = true;
    this.toggle.disabled = true;
    this.status.textContent = `→ ${line}`;
    try {
      const reply = await this.client.tcp(this.serverIp, this.controlPort, line);
      this.status.textContent = `← ${reply}`;
      return reply;
    } catch (error) {
      this.status.textContent = `✕ ${/** @type {Error} */ (error).message}`;
      return null;
    } finally {
      this.busy = false;
      this.toggle.disabled = false;
    }
  }

  async register() {
    const reply = await this.control(formatControl('ADD', this.client.ip ?? '', this.spec.udpPort));
    // A duplicate ADD ("You failed to deregister last time!") still leaves us registered.
    if (reply && (reply.startsWith('HELLO') || reply.startsWith('You failed'))) this.setRegistered(true);
  }

  async unregister() {
    const reply = await this.control(formatControl('DROP', this.client.ip ?? '', this.spec.udpPort));
    if (reply && (reply.startsWith('BYE') || reply.startsWith('UNABLE'))) this.setRegistered(false);
  }

  /** @param {boolean} value */
  setRegistered(value) {
    this.registered = value;
    this.toggle.textContent = value ? 'Unregister' : 'Register';
    this.root.classList.toggle('live', value);
  }

  /** @param {string[]} listeners host:port entries the server currently holds */
  syncWithServer(listeners) {
    if (this.busy) return;
    const mine = `${this.client.ip}:${this.spec.udpPort}`;
    const listed = listeners.includes(mine);
    if (listed !== this.registered) {
      this.setRegistered(listed);
      if (!listed) this.status.textContent = 'No longer in the server listener table';
    }
  }

  /** GateListener.processMessage() + GateInformationBoard.display() */
  /** @param {string} payload */
  onDatagram(payload) {
    const change = parseGateMessage(payload);
    if (!change) return;
    this.received += 1;
    this.counter.textContent = String(this.received);
    this.lines.push(boardRow(change.destination, change.seats, change.gate));
    if (this.lines.length > BOARD_LINES) this.lines.shift();
    const atBottom = this.screen.scrollTop + this.screen.clientHeight >= this.screen.scrollHeight - 4;
    this.screen.textContent = [BOARD_HEADER, ...this.lines].join('\n');
    if (atBottom) this.screen.scrollTop = this.screen.scrollHeight;
  }

  sendDropOnExit() {
    if (this.registered)
      this.client.port.postMessage({
        type: 'tcp',
        id: 0,
        host: this.serverIp,
        port: this.controlPort,
        line: formatControl('DROP', this.client.ip ?? '', this.spec.udpPort),
      });
  }
}

/** @returns {Promise<{ port: import('./client.js').PortLike, mode: 'shared' | 'local' }>} */
async function openHost() {
  const params = new URLSearchParams(location.search);
  if (params.get('mode') !== 'local' && typeof SharedWorker === 'function') {
    try {
      const worker = new SharedWorker(new URL('./shared-worker.js', import.meta.url), {
        type: 'module',
        name: 'orf401-lab5',
      });
      return { port: worker.port, mode: 'shared' };
    } catch {
      // Fall through to the in-page host (e.g. module SharedWorkers unsupported).
    }
  }
  const { bootHost } = await import('./host-boot.js');
  const host = await bootHost();
  const channel = new MessageChannel();
  host.connect(channel.port2);
  return { port: channel.port1, mode: 'local' };
}

function setupConditions(/** @type {LabClient} */ client) {
  const loss = /** @type {HTMLInputElement} */ ($('#loss'));
  const latency = /** @type {HTMLInputElement} */ ($('#latency'));
  const jitter = /** @type {HTMLInputElement} */ ($('#jitter'));
  const speed = /** @type {HTMLSelectElement} */ ($('#speed'));
  const paused = /** @type {HTMLInputElement} */ ($('#paused'));
  latency.max = String(LIMITS.latencyMs);
  jitter.max = String(LIMITS.jitterMs);
  for (const s of LIMITS.speeds) speed.append(el('option', { value: String(s) }, `${s}×`));

  loss.addEventListener('input', () => client.setConditions({ loss: Number(loss.value) / 100 }));
  latency.addEventListener('input', () => client.setConditions({ latencyMs: Number(latency.value) }));
  jitter.addEventListener('input', () => client.setConditions({ jitterMs: Number(jitter.value) }));
  speed.addEventListener('change', () => client.setConditions({ speed: Number(speed.value) }));
  paused.addEventListener('change', () => client.setConditions({ paused: paused.checked }));
  $('#reset').addEventListener('click', () => client.reset());

  /** @param {import('./network.js').Conditions} c */
  return (c) => {
    const pct = Math.round(c.loss * 100);
    if (document.activeElement !== loss) loss.value = String(pct);
    if (document.activeElement !== latency) latency.value = String(c.latencyMs);
    if (document.activeElement !== jitter) jitter.value = String(c.jitterMs);
    speed.value = String(c.speed);
    paused.checked = c.paused;
    $('#loss-out').textContent = `${pct}%`;
    $('#latency-out').textContent = `${c.latencyMs} ms`;
    $('#jitter-out').textContent = `±${c.jitterMs} ms`;
  };
}

function setupLog() {
  const body = $('#log-body');
  const showTcp = /** @type {HTMLInputElement} */ ($('#show-tcp'));
  const showUdp = /** @type {HTMLInputElement} */ ($('#show-udp'));
  const applyFilter = () => {
    body.classList.toggle('hide-tcp', !showTcp.checked);
    body.classList.toggle('hide-udp', !showUdp.checked);
  };
  showTcp.addEventListener('change', applyFilter);
  showUdp.addEventListener('change', applyFilter);
  /** @param {LogEntry} e */
  return (e) => {
    const row = el('tr', { class: `${e.proto.toLowerCase()} ${e.status}` });
    row.append(
      el('td', {}, clock(e.t)),
      el('td', {}, e.proto),
      el('td', {}, `${e.src} → ${e.dst}`),
      el('td', { class: 'payload' }, e.payload),
      el('td', {}, e.status),
    );
    body.prepend(row);
    while (body.childElementCount > LOG_ROWS) body.lastElementChild?.remove();
  };
}

function setupConsole(
  /** @type {LabClient} */ client,
  /** @type {{ name: string, ip: string }[]} */ airlines,
  /** @type {number} */ controlPort,
) {
  const form = /** @type {HTMLFormElement} */ ($('#console'));
  const server = /** @type {HTMLSelectElement} */ ($('#console-server'));
  const line = /** @type {HTMLInputElement} */ ($('#console-line'));
  const out = $('#console-out');
  for (const a of airlines) server.append(el('option', { value: a.ip }, `${a.name} (${a.ip}:${controlPort})`));
  line.placeholder = `ADD ${client.ip} 51000`;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = line.value.trim();
    if (!text) return;
    out.textContent = `→ ${text}`;
    try {
      out.textContent = `→ ${text}\n← ${await client.tcp(server.value, controlPort, text)}`;
    } catch (error) {
      out.textContent = `→ ${text}\n✕ ${/** @type {Error} */ (error).message}`;
    }
  });
}

function setupInstall() {
  const button = /** @type {HTMLButtonElement} */ ($('#install'));
  /** @type {any} */
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    button.hidden = true;
    await deferred?.prompt();
    deferred = null;
  });
}

/** @param {string} message */
function fail(message) {
  const banner = /** @type {HTMLElement} */ ($('#fatal'));
  banner.textContent = message;
  banner.hidden = false;
}

async function main() {
  setupInstall();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker
      .register('sw.js')
      .catch((error) => console.warn('Service worker registration failed', error));
  }

  const { port, mode } = await openHost();
  const client = new LabClient(port);
  client.onError = (error) => console.warn('Lab host:', error);
  const welcome = await client.ready;

  $('#my-ip').textContent = welcome.ip;
  const modeEl = /** @type {HTMLElement} */ ($('#mode'));
  modeEl.textContent = mode === 'shared' ? 'shared by all tabs' : 'this tab only';
  modeEl.dataset.mode = mode;

  const renderConditions = setupConditions(client);
  const appendLog = setupLog();
  setupConsole(client, welcome.airlines, welcome.controlPort);

  const boards = BOARDS.map((spec) => {
    const server = welcome.airlines.find((a) => a.name === spec.airline);
    if (!server) throw new Error(`Host has no server for ${spec.airline}`);
    const board = new GateBoard(client, spec, server.ip, welcome.controlPort);
    $('#boards').append(board.root);
    return board;
  });

  /** @param {HostState} state */
  const renderState = (state) => {
    renderConditions(state.conditions);
    for (const a of state.airlinesState) {
      const card = $(`#servers [data-airline="${a.name}"]`);
      $('[data-testid="sent"]', card).textContent = String(a.sent);
      $('[data-testid="lost"]', card).textContent = String(a.lost);
      const list = $('ul', card);
      list.replaceChildren(
        ...(a.listeners.length
          ? a.listeners.map((l) => el('li', l.startsWith(`${client.ip}:`) ? { class: 'mine' } : {}, l))
          : [el('li', { class: 'empty' }, '(none)')]),
      );
      boards.find((b) => b.spec.airline === a.name)?.syncWithServer(a.listeners);
    }
  };

  const servers = $('#servers');
  for (const a of welcome.airlines) {
    const card = el('section', { class: 'server', 'data-airline': a.name });
    card.append(el('h3', {}, `${a.name} · ${a.ip}`));
    const stats = el('p', { class: 'meta' });
    stats.append(
      'sent ',
      el('strong', { 'data-testid': 'sent' }, '0'),
      ' · lost on the wire ',
      el('strong', { 'data-testid': 'lost' }, '0'),
    );
    card.append(stats, el('ul', { 'data-testid': 'listeners' }));
    servers.append(card);
  }

  const diagram = new LiveDiagram(
    /** @type {HTMLDetailsElement} */ ($('#diagram-panel')),
    /** @type {SVGSVGElement} */ ($('#diagram')),
    welcome.airlines,
    welcome.ip,
  );

  client.onState = (state) => {
    renderState(state);
    diagram.setState(state.airlinesState);
  };
  client.onLog = (entry) => {
    appendLog(entry);
    diagram.packet(entry);
  };
  renderState(welcome);
  diagram.setState(welcome.airlinesState);
  for (const entry of welcome.log) appendLog(entry);

  window.addEventListener('pagehide', () => {
    for (const board of boards) board.sendDropOnExit();
    client.bye();
  });

  // GateKeeper.main(): both boards call StartUp(), which registers immediately.
  await Promise.all(boards.map((b) => b.register()));
  document.body.dataset.ready = 'true';
}

main().catch((error) => {
  console.error(error);
  fail(`The lab could not start: ${error instanceof Error ? error.message : String(error)}`);
});
