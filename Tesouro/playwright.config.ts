import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1000 },
    locale: 'pt-BR',
    reducedMotion: 'reduce',
    launchOptions: existsSync(localChrome) ? { executablePath: localChrome } : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
