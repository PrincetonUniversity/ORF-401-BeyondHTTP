// Service worker: precache the whole demo so it runs offline once loaded.
// The deploy workflow replaces __BUILD__ with the commit SHA so each release
// gets a fresh cache.

const CACHE = 'gate-lab-__BUILD__';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'data/des_code.csv',
  'img/carmoncar.png',
  'img/vanderides.png',
  'img/icon.svg',
  'img/icon-192.png',
  'img/icon-512.png',
  'js/app.js',
  'js/client.js',
  'js/diagram.js',
  'js/host-boot.js',
  'js/network.js',
  'js/protocol.js',
  'js/registry.js',
  'js/server-host.js',
  'js/shared-worker.js',
];

const sw = /** @type {any} */ (self);

sw.addEventListener('install', (/** @type {any} */ event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (/** @type {any} */ event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('gate-lab-') && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('fetch', (/** @type {any} */ event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.match(request, { ignoreSearch: request.mode === 'navigate' }).then((hit) => hit ?? fetch(request)),
  );
});
