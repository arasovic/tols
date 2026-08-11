import { defineConfig } from '@playwright/test'

const localUrl = 'http://127.0.0.1:4178'

export default defineConfig({
  testDir: './tests-browser',
  outputDir: './test-results/browser',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}.png',
  use: {
    baseURL: localUrl,
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile-chromium',
      use: { viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4178',
    url: localUrl,
    reuseExistingServer: false,
    timeout: 120_000
  }
})
