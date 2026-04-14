import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
  projects: [
    // 기존 테스트용
    {
      name: "chromium",
      testMatch: "home.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // 반응형 시각 테스트 — 4개 뷰포트
    {
      name: "mobile-390",
      testMatch: "visual.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "md-boundary-768",
      testMatch: "visual.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "zfold4-884",
      testMatch: "visual.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 884, height: 1024 } },
    },
    {
      name: "desktop-1280",
      testMatch: "visual.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
