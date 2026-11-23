// Animated network diagram. Each packet-log entry becomes a dot that travels
// from sender to receiver: TCP as squares, UDP as circles. Lost packets stop
// halfway and fade out. The diagram does no work while its panel is closed.

const SVG_NS = 'http://www.w3.org/2000/svg';

/** @typedef {{ width: number, height: number, serverX: number, clientX: number, pad: number, compact: boolean }} View */

/** @type {Readonly<View>} */
export const VIEW = Object.freeze({ width: 800, height: 320, serverX: 150, clientX: 650, pad: 50, compact: false });
/** Narrow screens: a tighter drawing so labels stay readable when scaled down. */
/** @type {Readonly<View>} */
export const COMPACT_VIEW = Object.freeze({
  width: 460,
  height: 360,
  serverX: 72,
  clientX: 388,
  pad: 40,
  compact: true,
});
export const COMPACT_BELOW_PX = 560;
const NODE_WIDTH = 132;
export const MAX_CLIENT_NODES = 6;
export const MAX_PACKETS = 80;
export const TRAVEL_MS = 900;
export const FADE_MS = 350;

/** @typedef {import('./server-host.js').LogEntry} LogEntry */
/** @typedef {{ id: string, label: string, sub: string, x: number, y: number, kind: 'server' | 'client' | 'self' | 'other' }} DiagramNode */
/** @typedef {{ kind: 'tcp' | 'udp', tone: 'ok' | 'lost' | 'warn' | 'muted' | 'bad', stopAt: number }} PacketStyle */

/**
 * "10.0.2.10:51000" -> "10.0.2.10"
 * @param {string} address
 */
export function hostOf(address) {
  const colon = address.lastIndexOf(':');
  return colon < 0 ? address : address.slice(0, colon);
}

/**
 * How a log entry is drawn. stopAt is the fraction of the path travelled
 * before the packet fades: lost packets never reach the receiver.
 *
 * @param {LogEntry} entry
 * @returns {PacketStyle}
 */
export function packetStyle(entry) {
  const kind = entry.proto === 'TCP' ? 'tcp' : 'udp';
  switch (entry.status) {
    case 'delivered':
      return { kind, tone: 'ok', stopAt: 1 };
    case 'lost':
    case 'timeout':
      return { kind, tone: 'lost', stopAt: 0.5 };
    case 'retransmit':
      return { kind, tone: 'warn', stopAt: 0.5 };
    case 'unreachable':
      return { kind, tone: 'muted', stopAt: 1 };
    case 'refused':
      return { kind, tone: 'bad', stopAt: 1 };
  }
}

/**
 * Evenly space n items between pad and height - pad.
 * @param {View} view
 * @param {number} n
 * @param {number} i
 */
function spread(view, n, i) {
  const usable = view.height - 2 * view.pad;
  return n === 1 ? view.height / 2 : view.pad + (usable * i) / (n - 1);
}

/**
 * Place servers on the left and client machines on the right. This tab is
 * always shown first; beyond MAX_CLIENT_NODES the rest share one "others" node.
 *
 * @param {{ name: string, ip: string }[]} servers
 * @param {string[]} clientIps every client host currently known
 * @param {string} myIp
 * @param {View} [view]
 * @returns {{ nodes: DiagramNode[], nodeFor: (ip: string) => DiagramNode | undefined }}
 */
export function layout(servers, clientIps, myIp, view = VIEW) {
  /** @type {DiagramNode[]} */
  const nodes = servers.map((s, i) => ({
    id: s.ip,
    label: s.name,
    sub: s.ip,
    x: view.serverX,
    y: spread(view, servers.length, i),
    kind: 'server',
  }));
  const others = [...new Set(clientIps)].filter((ip) => ip !== myIp).sort(compareIp);
  const shown = [myIp, ...others.slice(0, MAX_CLIENT_NODES - 1)];
  const hidden = others.slice(MAX_CLIENT_NODES - 1);
  const slots = shown.length + (hidden.length ? 1 : 0);
  shown.forEach((ip, i) => {
    nodes.push({
      id: ip,
      label: ip === myIp ? 'This tab' : 'Client',
      sub: ip,
      x: view.clientX,
      y: spread(view, slots, i),
      kind: ip === myIp ? 'self' : 'client',
    });
  });
  /** @type {DiagramNode | undefined} */
  let othersNode;
  if (hidden.length) {
    othersNode = {
      id: 'others',
      label: `+${hidden.length} more`,
      sub: 'clients',
      x: view.clientX,
      y: spread(view, slots, slots - 1),
      kind: 'other',
    };
    nodes.push(othersNode);
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const hiddenSet = new Set(hidden);
  return {
    nodes,
    nodeFor: (ip) => byId.get(ip) ?? (hiddenSet.has(ip) ? othersNode : undefined),
  };
}

/** @param {string} a @param {string} b */
function compareIp(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 4; i++) if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

/**
 * @param {string} tag
 * @param {Record<string, string | number>} attrs
 */
function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/**
 * @typedef {object} Packet
 * @property {SVGElement} el
 * @property {number} x1
 * @property {number} y1
 * @property {number} x2
 * @property {number} y2
 * @property {number} start
 * @property {number} stopAt
 */

export class LiveDiagram {
  /**
   * @param {HTMLDetailsElement} panel the collapsible container
   * @param {SVGSVGElement} root
   * @param {{ name: string, ip: string }[]} servers
   * @param {string} myIp
   */
  constructor(panel, root, servers, myIp) {
    this.panel = panel;
    this.root = root;
    this.servers = servers;
    this.myIp = myIp;
    /** @type {Map<string, string[]>} server ip -> registered client hosts */
    this.links = new Map(servers.map((s) => [s.ip, []]));
    /** @type {Packet[]} */
    this.packets = [];
    this.frame = 0;
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    /** @type {View} */
    this.view = VIEW;
    this.edgeLayer = svg('g', { class: 'edges' });
    this.packetLayer = svg('g', { class: 'packets' });
    this.nodeLayer = svg('g', { class: 'nodes' });
    root.append(this.edgeLayer, this.packetLayer, this.nodeLayer);
    this.current = layout(servers, [], myIp);

    panel.addEventListener('toggle', () => {
      if (panel.open) this.render();
      else this.clearPackets();
    });
    // Switch between the wide and compact drawings as the panel resizes.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => {
        if (this.active && this.pickView() !== this.view) {
          this.clearPackets();
          this.render();
        }
      }).observe(panel);
    }
  }

  pickView() {
    const width = this.root.getBoundingClientRect().width || this.panel.getBoundingClientRect().width;
    return width > 0 && width < COMPACT_BELOW_PX ? COMPACT_VIEW : VIEW;
  }

  get active() {
    return this.panel.open;
  }

  /**
   * @param {{ name: string, listeners: string[] }[]} airlinesState
   */
  setState(airlinesState) {
    for (const a of airlinesState) {
      const server = this.servers.find((s) => s.name === a.name);
      if (server) this.links.set(server.ip, [...new Set(a.listeners.map(hostOf))]);
    }
    if (this.active) this.render();
  }

  render() {
    this.view = this.pickView();
    this.root.setAttribute('viewBox', `0 0 ${this.view.width} ${this.view.height}`);
    this.root.classList.toggle('compact', this.view.compact);
    const clients = [...this.links.values()].flat();
    this.current = layout(this.servers, clients, this.myIp, this.view);
    const { nodes, nodeFor } = this.current;

    const edges = [];
    for (const server of this.servers) {
      const from = nodeFor(server.ip);
      const registered = new Set(this.links.get(server.ip) ?? []);
      for (const node of nodes) {
        if (node.kind === 'server' || !from) continue;
        const live =
          node.kind === 'other' ? [...registered].some((ip) => nodeFor(ip) === node) : registered.has(node.id);
        edges.push(
          svg('line', {
            x1: from.x,
            y1: from.y,
            x2: node.x,
            y2: node.y,
            class: live ? 'edge live' : 'edge',
            'data-edge': `${server.ip}>${node.id}`,
          }),
        );
      }
    }
    this.edgeLayer.replaceChildren(...edges);

    this.nodeLayer.replaceChildren(
      ...nodes.map((n) => {
        const g = svg('g', { class: `node ${n.kind}`, transform: `translate(${n.x} ${n.y})`, 'data-node': n.id });
        g.append(
          svg('rect', { x: -NODE_WIDTH / 2, y: -24, width: NODE_WIDTH, height: 48, rx: 8 }),
          Object.assign(svg('text', { y: -4, class: 'label' }), { textContent: n.label }),
          Object.assign(svg('text', { y: 14, class: 'sub' }), {
            textContent: n.kind === 'server' ? `${n.sub}:8189` : n.sub,
          }),
        );
        return g;
      }),
    );
  }

  /** @param {LogEntry} entry */
  packet(entry) {
    if (!this.active) return;
    const { nodeFor } = this.current;
    let from = nodeFor(hostOf(entry.src));
    let to = nodeFor(hostOf(entry.dst));
    // A host not on the diagram yet (e.g. a console ADD for a new address): redraw once.
    if (!from || !to) {
      this.render();
      from = this.current.nodeFor(hostOf(entry.src));
      to = this.current.nodeFor(hostOf(entry.dst));
    }
    if (!from || !to || from === to) return;

    const style = packetStyle(entry);
    if (this.reducedMotion) {
      this.flashEdge(from, to, style);
      return;
    }
    if (this.packets.length >= MAX_PACKETS) this.packets.shift()?.el.remove();

    const el =
      style.kind === 'tcp' ? svg('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2 }) : svg('circle', { r: 6 });
    el.setAttribute('class', `packet ${style.kind} ${style.tone}`);
    el.setAttribute('transform', `translate(${from.x} ${from.y})`);
    const title = svg('title');
    title.textContent = `${entry.proto} ${entry.src} → ${entry.dst}: ${entry.payload} (${entry.status})`;
    el.append(title);
    this.packetLayer.append(el);
    this.packets.push({
      el,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      start: performance.now(),
      stopAt: style.stopAt,
    });
    if (!this.frame) this.frame = requestAnimationFrame((t) => this.tick(t));
  }

  /**
   * @param {DiagramNode} from
   * @param {DiagramNode} to
   * @param {PacketStyle} style
   */
  flashEdge(from, to, style) {
    const serverId = from.kind === 'server' ? from.id : to.id;
    const clientId = from.kind === 'server' ? to.id : from.id;
    const edge = this.edgeLayer.querySelector(`[data-edge="${serverId}>${clientId}"]`);
    if (!edge) return;
    edge.classList.add('flash', style.tone);
    setTimeout(() => edge.classList.remove('flash', style.tone), 400);
  }

  /** @param {number} now */
  tick(now) {
    this.frame = 0;
    this.packets = this.packets.filter((p) => {
      const t = (now - p.start) / TRAVEL_MS;
      const f = Math.min(t, 1) * p.stopAt;
      const x = p.x1 + (p.x2 - p.x1) * f;
      const y = p.y1 + (p.y2 - p.y1) * f;
      p.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      if (t <= 1) return true;
      const fade = 1 - ((t - 1) * TRAVEL_MS) / FADE_MS;
      if (fade <= 0) {
        p.el.remove();
        return false;
      }
      p.el.setAttribute('opacity', fade.toFixed(2));
      return true;
    });
    if (this.packets.length) this.frame = requestAnimationFrame((t) => this.tick(t));
  }

  clearPackets() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const p of this.packets) p.el.remove();
    this.packets = [];
  }
}
