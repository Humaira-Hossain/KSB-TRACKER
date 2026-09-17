import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const e2eEnvironment = loadEnv('e2e', process.cwd(), '')
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL ?? e2eEnvironment.E2E_DATABASE_URL

if (!e2eDatabaseUrl || e2eDatabaseUrl.includes('your-isolated-test-database-url')) {
  throw new Error(
    'Set E2E_DATABASE_URL to a real isolated PostgreSQL connection string before running E2E tests.',
  )
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start',
      cwd: '../server',
      env: {
        ...process.env,
        DATABASE_URL: e2eDatabaseUrl,
        PORT: '5001',
      },
      url: 'http://127.0.0.1:5001/api/health',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      env: {
        ...process.env,
        VITE_API_URL: 'http://127.0.0.1:5001/api',
      },
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
    },
  ],
})
