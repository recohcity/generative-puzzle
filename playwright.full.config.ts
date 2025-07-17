import { defineConfig, devices } from '@playwright/test';

// UA 字典（可补充国产浏览器/微信/自定义 UA）
const userAgents = {
  wechat: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/19A346 MicroMessenger/8.0.16(0x1800102c) NetType/WIFI Language/zh_CN',
  arcMobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 Arc/1.0.0',
  arcDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Arc/1.0.0',
  chromeMobile: 'Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
  chromeDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  safariMobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  safariDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  firefoxDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13.0; rv:109.0) Gecko/20100101 Firefox/109.0',
};

export default defineConfig({
  testDir: './e2e',
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list']
  ],
  timeout: 60 * 1000,
  retries: 2,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    // 桌面端
    {
      name: 'Desktop@Chrome',
      use: { ...devices['Desktop Chrome'], userAgent: userAgents.chromeDesktop, browserName: 'chromium', channel: 'chrome' },
    },
    {
      name: 'Desktop@Safari',
      use: { ...devices['Desktop Safari'], userAgent: userAgents.safariDesktop, browserName: 'webkit' },
    },
    {
      name: 'Desktop@Arc',
      use: { ...devices['Desktop Chrome'], userAgent: userAgents.arcDesktop, browserName: 'chromium' },
    },
    {
      name: 'Desktop@Firefox',
      use: { ...devices['Desktop Firefox'], userAgent: userAgents.firefoxDesktop, browserName: 'firefox' },
    },
    // 移动端 iPhone 12 Pro 竖屏
    {
      name: 'iPhone 12 Pro Portrait@WeChat',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 390, height: 844 }, userAgent: userAgents.wechat, browserName: 'chromium' },
    },
    {
      name: 'iPhone 12 Pro Portrait@Chrome',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 390, height: 844 }, userAgent: userAgents.chromeMobile, browserName: 'chromium', channel: 'chrome' },
    },
    {
      name: 'iPhone 12 Pro Portrait@Safari',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 390, height: 844 }, userAgent: userAgents.safariMobile, browserName: 'webkit' },
    },
    {
      name: 'iPhone 12 Pro Portrait@Arc',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 390, height: 844 }, userAgent: userAgents.arcMobile, browserName: 'chromium' },
    },
    // 移动端 iPhone 12 Pro 横屏
    {
      name: 'iPhone 12 Pro Landscape@WeChat',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 844, height: 390 }, userAgent: userAgents.wechat, browserName: 'chromium' },
    },
    {
      name: 'iPhone 12 Pro Landscape@Chrome',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 844, height: 390 }, userAgent: userAgents.chromeMobile, browserName: 'chromium', channel: 'chrome' },
    },
    {
      name: 'iPhone 12 Pro Landscape@Safari',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 844, height: 390 }, userAgent: userAgents.safariMobile, browserName: 'webkit' },
    },
    {
      name: 'iPhone 12 Pro Landscape@Arc',
      use: { ...devices['iPhone 12 Pro'], viewport: { width: 844, height: 390 }, userAgent: userAgents.arcMobile, browserName: 'chromium' },
    },
    // Android 示例（Pixel 5）
    {
      name: 'Pixel 5@Chrome',
      use: { ...devices['Pixel 5'], browserName: 'chromium', channel: 'chrome' },
    },
    // 更多机型/国产品牌可按此格式补充
    // {
    //   name: 'Xiaomi 13@Chrome',
    //   use: { ...devices['Pixel 5'], viewport: { width: 393, height: 852 }, userAgent: '自定义UA', browserName: 'chromium', channel: 'chrome' },
    // },
    // {
    //   name: 'Huawei P50@WeChat',
    //   use: { ...devices['Pixel 5'], viewport: { width: 428, height: 916 }, userAgent: '自定义微信UA', browserName: 'chromium' },
    // },
  ],
}); 