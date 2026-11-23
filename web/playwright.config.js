import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
export const BASE_URL = `http://127.0.0.1:${PORT}/ORF-401-BeyondHTTP/`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve.js',
    url: BASE_URL,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },
});
