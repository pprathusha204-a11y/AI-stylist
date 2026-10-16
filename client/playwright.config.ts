import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5175', launchOptions: { executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort --configLoader runner', url: 'http://127.0.0.1:5175', reuseExistingServer: false },
});
