// 步骤1：全局画布适配专项自动化测试脚本（极简判定版）
// 只判断：1. 画布是否为正方形 2. 面板内容是否完整显示
// 运行：npx playwright test e2e/temp/step1_canvas_adaptation_e2e.spec.ts
import { test } from '@playwright/test';

// ====== 集中管理 userAgent 映射表 ======
const userAgentMap: Record<string, string> = {
  'Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'WeChat': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.16(0x18001025) NetType/WIFI Language/zh_CN',
  'iPhone 13 Pro': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  // ...可继续扩展
};
// ======================================

// ====== 只需维护此处数组即可 ======
const customTestDevices = [
  // 桌面端 Chrome
  {
    name: 'Chrome',
    viewport: { width: 1920, height: 1080 },
    isMobile: false,
    deviceScaleFactor: 1,
    hasTouch: false
  },
  // 桌面端 Edge
  {
    name: 'Edge',
    viewport: { width: 1920, height: 1080 },
    isMobile: false,
    deviceScaleFactor: 1,
    hasTouch: false
  },
  // 微信浏览器（iPhone 横屏）
  {
    name: 'WeChat',
    viewport: { width: 844, height: 390 },
    isMobile: true,
    deviceScaleFactor: 3,
    hasTouch: true
  },
  // iPhone 13 Pro 竖屏
  {
    name: 'iPhone 13 Pro',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 3,
    hasTouch: true
  },
  // ...你可以继续添加更多自定义设备
];
// ===================================

test.describe('自定义设备画布适配专项自动化测试', () => {
  for (const device of customTestDevices) {
    const userAgent = userAgentMap[device.name] || '';
    test(`适配判定 - ${device.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: device.viewport,
        isMobile: device.isMobile,
        deviceScaleFactor: device.deviceScaleFactor,
        hasTouch: device.hasTouch,
        userAgent: userAgent || undefined
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.waitForSelector('#puzzle-canvas', { timeout: 5000 });
      // 1. 判定画布是否为正方形
      const canvas = await page.$('#puzzle-canvas');
      if (!canvas) {
        console.log(`❌ ${device.name}：不通过（画布未渲染）`);
        await context.close();
        return;
      }
      const box = await canvas.boundingBox();
      if (!box) {
        console.log(`❌ ${device.name}：不通过（画布无尺寸）`);
        await context.close();
        return;
      }
      const ratio = Math.abs(box.width - box.height) / Math.max(box.width, box.height);
      console.log(`[${device.name}] boundingBox: width=${box.width}, height=${box.height}, ratio=${ratio}`);
      const canvasSize = await canvas.evaluate((el: any) => {
        if (el instanceof HTMLCanvasElement) {
          return { w: el.width, h: el.height };
        } else {
          return { w: null, h: null };
        }
      });
      console.log(`[${device.name}] canvas属性: width=${canvasSize.w}, height=${canvasSize.h}`);
      const isSquare = ratio < 0.03;
      // 2. 判定面板内容是否完整显示（无垂直滚动条）
      const panel = await page.$('#panel-container');
      let panelOk = true;
      if (panel) {
        const { scrollHeight, clientHeight } = await panel.evaluate((el: any) => ({
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        }));
        console.log(`[${device.name}] panel: scrollHeight=${scrollHeight}, clientHeight=${clientHeight}`);
        panelOk = scrollHeight <= clientHeight + 2;
      }
      if (isSquare && panelOk) {
        console.log(`✅ ${device.name}：通过`);
      } else {
        let reason = [];
        if (!isSquare) reason.push('画布非正方形');
        if (!panelOk) reason.push('面板内容溢出');
        console.log(`❌ ${device.name}：不通过（${reason.join('，')}）`);
      }
      await context.close();
    });
  }
});