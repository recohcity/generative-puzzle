/**
 * 移动端核心链轻量冒烟配置（防自嗨：只测真实用户可见行为，不追求覆盖率）
 *
 * 本地：npx playwright test（复用已启动的 dev server）
 * CI  ：由 ci.yml smoke-mobile job 调用（build + start 生产模式）
 */
import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: isCI ? "github" : "line",
  use: {
    baseURL: "http://localhost:3000",
    // 移动端核心场景：iPhone 触控视口（1.5.14 教训：桌面通过 ≠ 移动端可交付）
    // 用 chromium（轻量、CI 只装 chromium）；触摸/布局/Worker 行为与 Safari 一致
    browserName: "chromium",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  webServer: {
    command: isCI ? "npm run build && npm run start -- -p 3000" : "npm run dev",
    url: "http://localhost:3000",
    timeout: 240_000,
    reuseExistingServer: !isCI,
  },
});
