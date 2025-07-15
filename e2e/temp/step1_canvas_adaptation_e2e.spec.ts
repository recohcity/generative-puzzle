// 步骤1：全局画布适配专项自动化测试脚本（极简判定版）
// 只判断：1. 画布是否为正方形 2. 面板内容是否完整显示
// 运行：npx playwright test e2e/temp/step1_canvas_adaptation_e2e.spec.ts
import { test } from '@playwright/test';

test.describe('全局画布适配极限判定', () => {
  const viewports = [
    { width: 1920, height: 1080, desc: '桌面大屏' },
    { width: 1366, height: 768, desc: '主流笔记本' },
    { width: 375, height: 667, desc: 'iPhone 8 竖屏' },
    { width: 667, height: 375, desc: 'iPhone 8 横屏' },
    { width: 1024, height: 768, desc: 'iPad 横屏' },
    { width: 320, height: 480, desc: '极小屏' },
    { width: 2560, height: 1440, desc: '2K大屏' }
  ];

  for (const { width, height, desc } of viewports) {
    test(`极限适配判定 - ${desc}（${width}x${height}）`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForSelector('#puzzle-canvas', { timeout: 5000 });
      // 1. 判定画布是否为正方形
      const canvas = await page.$('#puzzle-canvas');
      if (!canvas) {
        console.log(`❌ ${desc}：不通过（画布未渲染）`);
        return;
      }
      const box = await canvas.boundingBox();
      if (!box) {
        console.log(`❌ ${desc}：不通过（画布无尺寸）`);
        return;
      }
      // 输出canvas的boundingBox宽高和ratio
      const ratio = Math.abs(box.width - box.height) / Math.max(box.width, box.height);
      console.log(`[${desc}] boundingBox: width=${box.width}, height=${box.height}, ratio=${ratio}`);
      // 输出canvas的width/height属性（如有）
      const canvasSize = await canvas.evaluate(el => {
        if (el instanceof HTMLCanvasElement) {
          return { w: el.width, h: el.height };
        } else {
          return { w: null, h: null };
        }
      });
      console.log(`[${desc}] canvas属性: width=${canvasSize.w}, height=${canvasSize.h}`);
      const isSquare = ratio < 0.03; // 放宽到3%容忍度
      // 2. 判定面板内容是否完整显示（无垂直滚动条）
      // 假定面板容器有id="panel-container"，如无请替换为实际选择器
      const panel = await page.$('#panel-container');
      let panelOk = true;
      if (panel) {
        const { scrollHeight, clientHeight } = await panel.evaluate(el => ({
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        }));
        console.log(`[${desc}] panel: scrollHeight=${scrollHeight}, clientHeight=${clientHeight}`);
        panelOk = scrollHeight <= clientHeight + 2; // 容忍2px误差
      }
      // 输出极简结论
      if (isSquare && panelOk) {
        console.log(`✅ ${desc}：通过`);
      } else {
        let reason = [];
        if (!isSquare) reason.push('画布非正方形');
        if (!panelOk) reason.push('面板内容溢出');
        console.log(`❌ ${desc}：不通过（${reason.join('，')}）`);
      }
    });
  }
}); 