import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against an isolated database (portfolio_e2e) with
// throwaway admin credentials, so they never touch development data.
// MongoDB must be reachable on localhost:27017 (docker compose locally,
// a service container in CI).
const E2E_API_PORT = 8001;
const E2E_WEB_PORT = 5174;

// Note: reserved TLDs (.test/.local) fail the API's email validation.
export const E2E_ADMIN_EMAIL = 'e2e-admin@portfolio-ci.dev';
export const E2E_ADMIN_PASSWORD = 'e2e-password-123';
const E2E_ADMIN_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$SRUFV4e7HAD/gQJkWu6EAQ$qqU07L98niHaKe9t7d6PZGNEC3GC+TiVEGKw1bvQey8';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `.venv/bin/python -m uvicorn app.main:app --port ${E2E_API_PORT}`,
      cwd: './backend',
      port: E2E_API_PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        MONGODB_URI: 'mongodb://localhost:27017',
        DB_NAME: 'portfolio_e2e',
        ADMIN_EMAIL: E2E_ADMIN_EMAIL,
        ADMIN_PASSWORD_HASH: E2E_ADMIN_PASSWORD_HASH,
        JWT_SECRET: 'e2e-secret-not-used-outside-tests-0123456789',
        ANALYTICS_SALT: 'e2e-salt',
        RESEND_API_KEY: '',
        FRONTEND_ORIGIN: `http://localhost:${E2E_WEB_PORT}`,
        ENVIRONMENT: 'development',
        COOKIE_SAMESITE: 'lax',
      },
    },
    {
      command: `npm run dev -- --port ${E2E_WEB_PORT} --strictPort`,
      port: E2E_WEB_PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: `http://localhost:${E2E_API_PORT}`,
      },
    },
  ],
});
