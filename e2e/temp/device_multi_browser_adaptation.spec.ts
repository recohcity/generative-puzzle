// device_multi_browser_adaptation.spec.ts
// 步骤1：单设备多浏览器适配专项自动化测试脚本
// 判定：1. 画布是否正方形 2. 输出面板分辨率 3. 面板是否超出屏幕 4. 画布是否超出屏幕
// 运行：npx playwright test e2e/temp/device_multi_browser_adaptation.spec.ts
import { test } from '@playwright/test';

// ====== 集中管理 userAgent 映射表 ======
const userAgentMap: Record<string, string> = {
  'Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'WeChat': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.16(0x18001025) NetType/WIFI Language/zh_CN',
};
// ======================================

// ====== 只需维护此处浏览器数组即可 ======
const browsers = [
  'Chrome',
  'Edge',
  'WeChat',
];
// ===================================

// ====== 只需维护此处设备参数即可 ======
const device = {
  name: 'iPhone 13 Pro',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  deviceScaleFactor: 3,
  hasTouch: true
};
// ===================================

test.describe('单设备多浏览器画布适配专项自动化测试', () => {
  for (const browserName of browsers) {
    const userAgent = userAgentMap[browserName] || '';
    test(`适配判定 - ${device.name} @ ${browserName}`, async ({ browser }) => {
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
        console.log(`❌ ${device.name}@${browserName}：不通过（画布未渲染）`);
        await context.close();
        return;
      }
      // 画布属性宽高
      const canvasSize = await canvas.evaluate((el: any) => {
        if (el instanceof HTMLCanvasElement) {
          return { w: el.width, h: el.height };
        } else {
          return { w: null, h: null };
        }
      });
      if (canvasSize.w == null || canvasSize.h == null) {
        console.log(`❌ ${device.name}@${browserName}：不通过（canvas属性无效）`);
        await context.close();
        return;
      }
      let pass = true;
      let failReasons: string[] = [];
      // 判定 canvas 是否正方形
      const ratio = Math.abs(canvasSize.w - canvasSize.h) / Math.max(canvasSize.w, canvasSize.h);
      const isSquare = ratio < 0.03;
      let canvasShapeMsg = `[画布] width=${canvasSize.w}, height=${canvasSize.h}, ratio=${ratio.toFixed(4)} => ` + (isSquare ? '正方形' : '不是正方形');
      if (!isSquare) {
        pass = false;
        failReasons.push('画布属性非正方形');
      }
      console.log(canvasShapeMsg);
      // panel boundingBox
      let panelMsg = '';
      const panel = await page.$('#panel-container');
      if (panel) {
        const panelBox = await panel.boundingBox();
        if (panelBox) {
          const viewport = device.viewport;
          const panelOverflow = panelBox.x < 0 || panelBox.y < 0 || panelBox.x + panelBox.width > viewport.width + 1 || panelBox.y + panelBox.height > viewport.height + 1;
          panelMsg = `[panel boundingBox] x=${panelBox.x}, y=${panelBox.y}, width=${panelBox.width}, height=${panelBox.height} => ` + (panelOverflow ? '超出屏幕' : '没有超出屏幕');
          if (panelOverflow) {
            pass = false;
            failReasons.push('游戏面板超出屏幕');
          }
          console.log(panelMsg);
        }
      } else {
        panelMsg = '[panel boundingBox] 未找到 #panel-container';
        console.log(panelMsg);
      }
      // canvas boundingBox
      let canvasBoxMsg = '';
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        const viewport = device.viewport;
        const canvasOverflow = canvasBox.x < 0 || canvasBox.y < 0 || canvasBox.x + canvasBox.width > viewport.width + 1 || canvasBox.y + canvasBox.height > viewport.height + 1;
        canvasBoxMsg = `[canvas boundingBox] x=${canvasBox.x}, y=${canvasBox.y}, width=${canvasBox.width}, height=${canvasBox.height} => ` + (canvasOverflow ? '超出屏幕' : '没有超出屏幕');
        if (canvasOverflow) {
          pass = false;
          failReasons.push('画布超出屏幕');
        }
        console.log(canvasBoxMsg);
      }
      // 输出判定
      if (pass) {
        console.log(`✅ ${device.name}@${browserName}：通过`);
      } else {
        console.log(`❌ ${device.name}@${browserName}：不通过`);
        if (!isSquare) console.log('  - 画布不是正方形');
        if (panelMsg.includes('超出屏幕')) console.log('  - 游戏面板超出屏幕');
        if (canvasBoxMsg.includes('超出屏幕')) console.log('  - 画布超出屏幕');
      }
      await page.screenshot({ path: `e2e/temp/screenshots/device_multi_browser_adaptation_${browserName}.png` });
      await context.close();
    });
  }
}); 