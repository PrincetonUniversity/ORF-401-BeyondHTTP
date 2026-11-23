import { expect, test } from '@playwright/test';

/** @typedef {import('@playwright/test').Page} Page */

/**
 * Fail the test on any uncaught page error or console error.
 * @param {Page} page
 */
function watchErrors(page) {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/** @param {Page} page @param {string} path */
async function openLab(page, path = './') {
  await page.goto(path);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true', { timeout: 15_000 });
  return (await page.locator('#my-ip').textContent()) ?? '';
}

/** @param {Page} page @param {string} company */
const board = (page, company) => page.locator(`.board[data-company="${company}"]`);
/** @param {Page} page @param {string} company */
const server = (page, company) => page.locator(`.server[data-company="${company}"]`);
/** @param {import('@playwright/test').Locator} loc */
const count = async (loc) => Number(await loc.textContent());

test('a tab registers with both companies over TCP and receives UDP gate changes', async ({ page }) => {
  const errors = watchErrors(page);
  const ip = await openLab(page);
  expect(ip).toMatch(/^10\.0\.2\.\d+$/);
  await expect(page.locator('#mode')).toHaveAttribute('data-mode', 'shared');

  /** @type {[string, number][]} */
  const boards = [
    ['CarmonCar', 51000],
    ['VandeRides', 51001],
  ];
  for (const [company, port] of boards) {
    await expect(board(page, company).getByTestId('status')).toHaveText(`← HELLO ${ip} ${port}`);
    await expect(server(page, company).getByTestId('listeners')).toContainText(`${ip}:${port}`);
  }

  await page.locator('#speed').selectOption('20');
  for (const company of ['CarmonCar', 'VandeRides']) {
    await expect
      .poll(() => count(board(page, company).getByTestId('received')), { timeout: 15_000 })
      .toBeGreaterThan(2);
    const screen = await board(page, company).getByTestId('screen').textContent();
    const rows = (screen ?? '').split('\n');
    expect(rows[0]).toMatch(/^Destination\s+Av\. Seats\s+Gate$/);
    expect(rows[1]).toMatch(/^\S.*\s+[1-5]\s+([1-9]|[12]\d|30)$/);
  }
  await expect(page.locator('#log-body tr.udp.delivered').first()).toBeVisible();
  const tcpRows = page.locator('#log-body tr.tcp.delivered');
  await expect(tcpRows.filter({ hasText: `ADD ${ip} 51000` })).toHaveCount(1);
  await expect(tcpRows.filter({ hasText: `HELLO ${ip} 51000` })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('two tabs share one simulated network', async ({ context }) => {
  const one = await context.newPage();
  const two = await context.newPage();
  const errors = [...watchErrors(one), ...watchErrors(two)];
  const ipOne = await openLab(one);
  const ipTwo = await openLab(two);
  expect(ipTwo).not.toBe(ipOne);

  const listeners = server(one, 'CarmonCar').getByTestId('listeners');
  await expect(listeners).toContainText(`${ipOne}:51000`);
  await expect(listeners).toContainText(`${ipTwo}:51000`);

  // Network conditions are shared: changing speed in one tab shows in the other.
  await one.locator('#speed').selectOption('20');
  await expect(two.locator('#speed')).toHaveValue('20');

  for (const page of [one, two]) {
    await expect
      .poll(() => count(board(page, 'CarmonCar').getByTestId('received')), { timeout: 15_000 })
      .toBeGreaterThan(1);
  }
  await two.close({ runBeforeUnload: true });
  await expect(listeners).not.toContainText(`${ipTwo}:51000`, { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('UDP datagrams vanish under 100% loss while the server keeps sending', async ({ page }) => {
  const errors = watchErrors(page);
  await openLab(page);
  await page.locator('#speed').selectOption('20');
  await page.locator('#loss').fill('100');
  await expect(page.locator('#loss-out')).toHaveText('100%');
  // Let anything already in flight land.
  await page.waitForTimeout(500);

  // Read all three counters in one evaluation so no report can land between reads.
  const snapshot = () =>
    page.evaluate(() => {
      /** @param {string} sel */
      const n = (sel) => Number(document.querySelector(sel)?.textContent);
      return {
        received: n('.board[data-company="CarmonCar"] [data-testid="received"]'),
        sent: n('.server[data-company="CarmonCar"] [data-testid="sent"]'),
        lost: n('.server[data-company="CarmonCar"] [data-testid="lost"]'),
      };
    });
  const before = await snapshot();
  await expect.poll(async () => (await snapshot()).sent, { timeout: 15_000 }).toBeGreaterThan(before.sent + 3);
  await page.locator('#paused').check();
  await page.waitForTimeout(300);
  const after = await snapshot();
  expect(after.received).toBe(before.received);
  expect(after.lost - before.lost).toBe(after.sent - before.sent);
  await expect(page.locator('#log-body tr.udp.lost').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('TCP survives moderate loss by retransmitting', async ({ page }) => {
  const errors = watchErrors(page);
  const ip = await openLab(page);
  await page.locator('#loss').fill('50');
  const b = board(page, 'VandeRides');
  await b.getByTestId('register').click(); // Unregister
  await expect(b.getByTestId('status')).toHaveText(/BYE|timed out/, { timeout: 20_000 });
  // With 50% loss a single exchange can still fail after 6 tries; retry until it works.
  await expect(async () => {
    if ((await b.getByTestId('register').textContent()) === 'Unregister') await b.getByTestId('register').click();
    await expect(b.getByTestId('status')).toHaveText(`← BYE ${ip} 51001`, { timeout: 15_000 });
  }).toPass({ timeout: 45_000 });
  await expect(server(page, 'VandeRides').getByTestId('listeners')).not.toContainText(`${ip}:51001`);
  expect(errors).toEqual([]);
});

test('the TCP console shows the registrar replies', async ({ page }) => {
  const errors = watchErrors(page);
  const ip = await openLab(page);
  const line = page.locator('#console-line');
  const out = page.getByTestId('console-out');

  await line.fill(`ADD ${ip} notaport`);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(out).toContainText('← INVALID PORT');

  await line.fill('PING');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(out).toContainText('← INVALID COMMAND');

  await line.fill(`ADD ${ip} 51000`);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(out).toContainText('← You failed to deregister last time!');

  await line.fill(`DROP ${ip} 51000`);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(out).toContainText(`← BYE ${ip} 51000`);
  await expect(board(page, 'CarmonCar').getByTestId('register')).toHaveText('Register');
  expect(errors).toEqual([]);
});

test('single-tab fallback runs the servers inside the page', async ({ page }) => {
  const errors = watchErrors(page);
  const ip = await openLab(page, './?mode=local');
  await expect(page.locator('#mode')).toHaveAttribute('data-mode', 'local');
  await expect(board(page, 'CarmonCar').getByTestId('status')).toHaveText(`← HELLO ${ip} 51000`);
  await page.locator('#speed').selectOption('20');
  await expect
    .poll(() => count(board(page, 'CarmonCar').getByTestId('received')), { timeout: 15_000 })
    .toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('works offline after the first visit', async ({ page, context }) => {
  await openLab(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload once so the page is controlled by the service worker.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  const ip = await openLab(page);
  await expect(board(page, 'CarmonCar').getByTestId('status')).toHaveText(`← HELLO ${ip} 51000`);
  await context.setOffline(false);
});

test('the manifest is served and points at real icons', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifestUrl = new URL(href ?? '', page.url());
  const res = await request.get(manifestUrl.toString());
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  for (const icon of manifest.icons) {
    const iconRes = await request.get(new URL(icon.src, manifestUrl).toString());
    expect(iconRes.ok(), icon.src).toBe(true);
  }
});

test('the live diagram is collapsed by default and animates packets when opened', async ({ page }) => {
  const errors = watchErrors(page);
  const ip = await openLab(page);
  const panel = page.locator('#diagram-panel');
  const diagram = page.locator('#diagram');
  await expect(panel).not.toHaveAttribute('open', '');
  await expect(diagram).toBeHidden();

  await page.locator('#speed').selectOption('20');
  await page.waitForTimeout(1000);
  // Closed: traffic flows but the diagram does no work.
  expect(await page.locator('#diagram .packet').count()).toBe(0);

  await panel.locator('summary').click();
  await expect(diagram).toBeVisible();
  await expect(diagram.locator('[data-node="10.0.1.1"]')).toContainText('CarmonCar');
  await expect(diagram.locator('[data-node="10.0.1.2"]')).toContainText('VandeRides');
  await expect(diagram.locator(`[data-node="${ip}"]`)).toContainText('This tab');
  await expect(diagram.locator(`[data-edge="10.0.1.1>${ip}"]`)).toHaveClass(/live/);
  await expect(diagram.locator('.packet.udp.ok').first()).toBeAttached({ timeout: 5_000 });

  // Lost datagrams are drawn in the lost style.
  await page.locator('#loss').fill('100');
  await expect(diagram.locator('.packet.udp.lost').first()).toBeAttached({ timeout: 5_000 });

  // Unregistering removes the solid link.
  await page.locator('#loss').fill('0');
  await board(page, 'CarmonCar').getByTestId('register').click();
  await expect(board(page, 'CarmonCar').getByTestId('status')).toHaveText(`← BYE ${ip} 51000`);
  await expect(diagram.locator(`[data-edge="10.0.1.1>${ip}"]`)).not.toHaveClass(/live/);

  // Closing the panel clears in-flight packets.
  await panel.locator('summary').click();
  await expect(page.locator('#diagram .packet')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the live diagram shows other tabs as clients', async ({ context }) => {
  const one = await context.newPage();
  const two = await context.newPage();
  await openLab(one);
  const ipTwo = await openLab(two);
  await one.locator('#diagram-panel summary').click();
  const node = one.locator(`#diagram [data-node="${ipTwo}"]`);
  await expect(node).toContainText('Client');
  await expect(one.locator(`#diagram [data-edge="10.0.1.2>${ipTwo}"]`)).toHaveClass(/live/);
});

test('the live diagram switches to the compact drawing on a phone-width screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await page.locator('#diagram-panel summary').click();
  const diagram = page.locator('#diagram');
  await expect(diagram).toHaveClass(/compact/);
  await expect(diagram).toHaveAttribute('viewBox', '0 0 460 360');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.setViewportSize({ width: 1100, height: 844 });
  await expect(diagram).not.toHaveClass(/compact/);
  await expect(diagram).toHaveAttribute('viewBox', '0 0 800 320');
});

test('the page describes ride-sharing companies, not airlines', async ({ page }) => {
  await openLab(page);
  await page.locator('details.intro summary').click();
  await page.locator('#diagram-panel summary').click();
  const text = (await page.locator('body').innerText()).toLowerCase();
  expect(text).not.toMatch(/airline|flight/);
  expect(text).toContain('ride-sharing');
  await expect(page.locator('.server[data-company="VandeRides"] h3')).toHaveText('VandeRides · 10.0.1.2');
  const manifest = await (await page.request.get('manifest.webmanifest')).json();
  expect(JSON.stringify(manifest).toLowerCase()).not.toMatch(/airline|flight/);
  expect(manifest.description.toLowerCase()).toContain('ride-sharing');
});
