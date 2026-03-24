import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    headless: false,
  },
  // Chrome extensions only work in Chromium
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chromium' },
    },
  ],
});
