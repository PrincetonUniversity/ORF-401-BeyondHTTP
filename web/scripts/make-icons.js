// Renders site/img/icon.svg to the PNG sizes the manifest needs.
// Run with `npm run icons` after editing the SVG; the PNGs are committed.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(fileURLToPath(new URL('../site/img/icon.svg', import.meta.url)), 'utf8');
const browser = await chromium.launch();
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    const out = fileURLToPath(new URL(`../site/img/icon-${size}.png`, import.meta.url));
    await page.screenshot({ path: out, omitBackground: false });
    console.log(`wrote ${out}`);
    await page.close();
  }
} finally {
  await browser.close();
}
