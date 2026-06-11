import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  webServer: [
    {
      command: 'python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
        DATABASE_URL: 'sqlite:///./backend/studyflow.e2e.db',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        VITE_API_URL: 'http://127.0.0.1:8000',
      },
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
