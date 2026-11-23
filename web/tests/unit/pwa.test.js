import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = fileURLToPath(new URL('../../site/', import.meta.url));

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [relative(SITE, full).split('\\').join('/')];
  });
}

function precacheList() {
  const sw = readFileSync(join(SITE, 'sw.js'), 'utf8');
  const match = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
  if (!match) throw new Error('PRECACHE not found in sw.js');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('service worker precache', () => {
  it('lists every shipped file exactly once, so the app works offline', () => {
    const listed = precacheList();
    expect(new Set(listed).size).toBe(listed.length);
    const files = walk(SITE)
      .filter((f) => f !== 'sw.js' && !f.endsWith('.DS_Store'))
      .sort();
    expect(listed.filter((f) => f !== './').sort()).toEqual(files);
    expect(listed).toContain('./');
  });

  it('has a build placeholder for the deploy step to stamp', () => {
    expect(readFileSync(join(SITE, 'sw.js'), 'utf8')).toContain("'gate-lab-__BUILD__'");
  });
});

describe('web app manifest', () => {
  const manifest = JSON.parse(readFileSync(join(SITE, 'manifest.webmanifest'), 'utf8'));

  it('uses relative scope and start URL so it works under the Pages subpath', () => {
    expect(manifest.scope).toBe('./');
    expect(manifest.start_url).toBe('./');
    expect(manifest.display).toBe('standalone');
  });

  it('ships 192 and 512 PNG icons that exist and match their declared sizes', () => {
    for (const size of [192, 512]) {
      const icon = manifest.icons.find((/** @type {any} */ i) => i.sizes === `${size}x${size}`);
      expect(icon, `icon ${size}`).toBeDefined();
      const png = readFileSync(join(SITE, icon.src));
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
  });
});

describe('index.html', () => {
  it('only references files that exist, with relative paths', () => {
    const html = readFileSync(join(SITE, 'index.html'), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
      .map((m) => m[1])
      .filter((r) => !r.startsWith('https://'));
    expect(refs.length).toBeGreaterThan(3);
    for (const ref of refs) {
      expect(ref.startsWith('/'), ref).toBe(false);
      expect(() => statSync(join(SITE, ref)), ref).not.toThrow();
    }
  });
});
