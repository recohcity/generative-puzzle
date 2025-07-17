// browser_multi_device_adaptation.spec.ts
// 步骤2：单浏览器多设备适配专项自动化测试脚本
// 聚焦 Chrome 移动端，检查 iPhone 12 Pro 竖屏和横屏
// 运行：npx playwright test e2e/temp/browser_multi_device_adaptation.spec.ts
import { test } from '@playwright/test';

// ====== 集中管理 userAgent 映射表 ======
const userAgentMap: Record<string, string> = {
  'iPhone 12 Pro 竖屏': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'iPhone 12 Pro 横屏': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
};
// ======================================

const browserName = 'Chrome';

const devices = [
  {
    name: 'iPhone 12 Pro 竖屏',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 3,
    hasTouch: true
  },
  {
    name: 'iPhone 12 Pro 横屏',
    viewport: { width: 844, height: 390 },
    isMobile: true,
    deviceScaleFactor: 3,
    hasTouch: true
  }
];

// ===================================

test.describe('单浏览器多设备画布适配专项自动化测试', () => {
  for (const device of devices) {
    const userAgent = userAgentMap[device.name] || '';
    test(`适配判定 - ${device.name} (${device.viewport.width}x${device.viewport.height}) @ ${browserName}`, async ({ browser }) => {
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
      // 自动进入 debug 模式（F10）
      await page.keyboard.press('F10');
      // 等待 debug 辅助元素渲染（可适当延迟，确保红框已绘制）
      await page.waitForTimeout(300);

      // 获取 canvas 元素
      const canvas = await page.$('canvas#puzzle-canvas');
      if (!canvas) {
        console.log(`❌ ${device.name}@${browserName}：不通过（画布未渲染）`);
        await context.close();
        return;
      }
      // 直接用 canvas 属性宽高判定正方形
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
      // 1. 判定 canvas 是否正方形
      const ratio = Math.abs(canvasSize.w - canvasSize.h) / Math.max(canvasSize.w, canvasSize.h);
      const isSquare = ratio < 0.03;
      let canvasShapeMsg = `[画布] width=${canvasSize.w}, height=${canvasSize.h}, ratio=${ratio.toFixed(4)} => ` + (isSquare ? '正方形' : '不是正方形');
      if (!isSquare) {
        pass = false;
        failReasons.push('画布属性非正方形');
      }
      console.log(canvasShapeMsg);
      // 2. 检查游戏面板是否超出屏幕
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
      // 3. 检查画布是否超出屏幕
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
        await page.screenshot({ path: `e2e/temp/screenshots/browser_multi_device_adaptation_${device.name}.png` });
      }
      await context.close();
    });
  }
}); 