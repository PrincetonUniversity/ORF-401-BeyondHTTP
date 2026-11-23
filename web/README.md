# Gate Information Lab (web)

A browser version of Lab 5 that runs entirely on the client. It is published to GitHub Pages and installs as a PWA
that works offline.

Live demo: <https://princetonuniversity.github.io/ORF-401-BeyondHTTP/>

## Why it is a simulation

Browsers cannot open raw TCP or UDP sockets. The demo keeps the lab's protocol and replaces the network:

| Java lab                                                      | Web demo                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `GateReportingSystem` per airline (registrar + reporter)      | `ServerHost` in a `SharedWorker`, shared by every open tab              |
| TCP 8189: `ADD <ip> <port>` → `HELLO`, `DROP` → `BYE`         | Same lines and replies, with retransmission and timeout on a lossy link |
| UDP datagrams `AIRLINE,DEST,SEAT,n,GATE,n` every 2.5–7.5 s    | Same payload and cadence, sent once and silently lost under packet loss |
| `GateKeeper` with two `GateInformationBoard`s (51000 / 51001) | Two boards per tab, each tab gets its own address on `10.0.2.0/24`      |
| Wireshark                                                     | Packet log showing every TCP exchange and UDP datagram                  |

Each new tab is another machine on the same network. Where `SharedWorker` is unavailable (for example Chrome on
Android) the servers run inside the page and the network covers that tab only. Add `?mode=local` to force this.

## Layout

- `site/`: the static site that is deployed, unchanged except for the service worker cache version.
  - `js/protocol.js`: wire formats, ported from `GateListenerRegistrar`, `GateReporter` and `GateListener`.
  - `js/registry.js`: `GateListenerDatabase`.
  - `js/network.js`: loss, latency, jitter and the TCP retransmission model.
  - `js/server-host.js`: the airline servers and the simulated wire.
  - `js/client.js`, `js/app.js`: tab-side socket API and UI.
  - `sw.js`: precaches every file for offline use.
- `tests/unit/`: Vitest tests for the protocol, network model, servers and PWA wiring.
- `tests/e2e/`: Playwright tests in Chromium (multi-tab, loss, console, fallback, offline).

## Commands

Requires Node.js 22 or later.

```bash
cd web
npm ci
npm run serve          # http://127.0.0.1:4173/ORF-401-BeyondHTTP/
npm test               # lint, format check, type check, unit and e2e tests
scripts/test-docker.sh # the same suite in the Docker image CI uses
```

The first e2e run needs a browser: `npx playwright install chromium`.

`npm run icons` re-renders `site/img/icon-192.png` and `icon-512.png` from `site/img/icon.svg`.

## Deployment

`.github/workflows/web.yml` runs the Docker test suite on every pull request and push that touches `web/`. On
`master`, when the tests pass, it publishes only `web/site/` to GitHub Pages and stamps the service worker cache with
the commit SHA so that installed copies pick up the new release.
