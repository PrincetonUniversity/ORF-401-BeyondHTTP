// Loads the destination table and creates the ServerHost. Shared by the
// SharedWorker entry point and the single-tab fallback.

import { parseDestinations } from './protocol.js';
import { ServerHost, browserEnv } from './server-host.js';

/** @returns {Promise<ServerHost>} */
export async function bootHost() {
  const url = new URL('../data/des_code.csv', import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url.pathname}: HTTP ${response.status}`);
  return new ServerHost(parseDestinations(await response.text()), browserEnv());
}
