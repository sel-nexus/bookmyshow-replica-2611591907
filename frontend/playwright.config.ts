import { defineConfig } from '@playwright/test';

/** Start the live API and Vite app for browser journeys. */
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'CATALOG_TEST_MODE=true NODE_ENV=test node ../backend/node_modules/typescript/bin/tsc -p ../backend/tsconfig.json && CATALOG_TEST_MODE=true NODE_ENV=test node ../backend/dist/index.js',
      url: 'http://127.0.0.1:3000/api/health',
      timeout: 30_000,
      reuseExistingServer: false,
    },
    {
      command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      timeout: 30_000,
      reuseExistingServer: false,
    },
  ],
});
