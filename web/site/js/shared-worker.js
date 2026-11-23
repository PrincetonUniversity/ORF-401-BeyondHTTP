// SharedWorker entry point: one simulated network shared by every open tab.

import { bootHost } from './host-boot.js';

/** @type {Promise<import('./server-host.js').ServerHost> | null} */
let hostPromise = null;

/** @param {MessageEvent} event */
function onConnect(event) {
  const port = event.ports[0];
  hostPromise ??= bootHost();
  hostPromise.then(
    (host) => host.connect(port),
    (error) => port.postMessage({ type: 'fatal', error: String(error) }),
  );
}

/** @type {any} */ (self).onconnect = onConnect;
