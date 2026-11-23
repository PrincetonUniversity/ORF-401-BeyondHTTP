// Minimal static server for local use and end-to-end tests. Serves site/
// under BASE_PATH (default "/ORF-401-BeyondHTTP/") to mimic GitHub Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../site', import.meta.url)));
const PORT = Number(process.env.PORT ?? 4173);
const HOST = process.env.HOST ?? '127.0.0.1';
const BASE = process.env.BASE_PATH ?? '/ORF-401-BeyondHTTP/';

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error(`Invalid PORT: ${process.env.PORT}`);
if (!BASE.startsWith('/') || !BASE.endsWith('/')) throw new Error(`BASE_PATH must start and end with "/": ${BASE}`);

/** @type {Record<string, string>} */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/' || url.pathname === BASE.slice(0, -1)) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(404).end('Not found');
    return;
  }
  let rel = decodeURIComponent(url.pathname.slice(BASE.length));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, HOST, () => console.log(`Serving ${ROOT} at http://${HOST}:${PORT}${BASE}`));
