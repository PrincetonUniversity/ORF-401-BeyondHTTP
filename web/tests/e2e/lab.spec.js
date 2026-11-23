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

/** @param {Page} page @param {string} airline */
const board = (page, airline) => page.locator(`.board[data-airline="${airline}"]`);
/** @param {Page} page @param {string} airline */
const server = (page, airline) => page.locator(`.server[data-airline="${airline}"]`);
/** @param {import('@playwright/test').Locator} loc */
const count = async (loc) => Number(await loc.textContent());

test('a tab registers with both airlines over TCP and receives UDP gate changes', async ({ page }) => {
  const errors = watchErrors(page);
  const ip = await openLab(page);
  expect(ip).toMatch(/^10\.0\.2\.\d+$/);
  await expect(page.locator('#mode')).toHaveAttribute('data-mode', 'shared');

  /** @type {[string, number][]} */
  const boards = [
    ['CarmonCar', 51000],
    ['Vanderides', 51001],
  ];
  for (const [airline, port] of boards) {
    await expect(board(page, airline).getByTestId('status')).toHaveText(`← HELLO ${ip} ${port}`);
    await expect(server(page, airline).getByTestId('listeners')).toContainText(`${ip}:${port}`);
  }

  await page.locator('#speed').selectOption('20');
  for (const airline of ['CarmonCar', 'Vanderides']) {
    await expect
      .poll(() => count(board(page, airline).getByTestId('received')), { timeout: 15_000 })
      .toBeGreaterThan(2);
    const screen = await board(page, airline).getByTestId('screen').textContent();
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
        received: n('.board[data-airline="CarmonCar"] [data-testid="received"]'),
        sent: n('.server[data-airline="CarmonCar"] [data-testid="sent"]'),
        lost: n('.server[data-airline="CarmonCar"] [data-testid="lost"]'),
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
  const b = board(page, 'Vanderides');
  await b.getByTestId('register').click(); // Unregister
  await expect(b.getByTestId('status')).toHaveText(/BYE|timed out/, { timeout: 20_000 });
  // With 50% loss a single exchange can still fail after 6 tries; retry until it works.
  await expect(async () => {
    if ((await b.getByTestId('register').textContent()) === 'Unregister') await b.getByTestId('register').click();
    await expect(b.getByTestId('status')).toHaveText(`← BYE ${ip} 51001`, { timeout: 15_000 });
  }).toPass({ timeout: 45_000 });
  await expect(server(page, 'Vanderides').getByTestId('listeners')).not.toContainText(`${ip}:51001`);
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
