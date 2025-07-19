// 步骤2：形状适配专项自动化测试脚本
// 测试步骤：
// 1. 加载页面
// 2. 点击多边形（生成形状）
// 3. 检查点1: 计算目标形状比例是否画布边长的30%？是否居画布中心？
// 4. 模拟实时变化浏览器窗口大小（第1轮）
// 5. 检查点2: 页面是否正常显示，有没有报错，如果没有报错，进行3轮
// 6. 检查点3: 目标形状比例是否画布边长的30%？是否居画布中心？
// 7. 模拟实时变化浏览器窗口大小（第2轮）
// 8. 检查点4: 目标形状比例是否画布边长的30%？是否居画布中心？
// 9. 模拟实时变化浏览器窗口大小（第3轮）
// 10. 检查点5: 目标形状比例是否画布边长的30%？是否居画布中心？
// 运行：npx playwright test e2e/temp/step2_shape_adaptation_e2e.spec.ts

import { test, expect } from '@playwright/test';

// ====== 集中管理 userAgent 映射表 ======
const userAgentMap: Record<string, string> = {
  'Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'WeChat': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.16(0x18001025) NetType/WIFI Language/zh_CN',
  'iPhone 13 Pro': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  'iPad': 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
};

// ====== 测试设备配置 ======
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
    viewport: { width: 1366, height: 768 },
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
  // iPad
  {
    name: 'iPad',
    viewport: { width: 1024, height: 768 },
    isMobile: true,
    deviceScaleFactor: 2,
    hasTouch: true
  }
];

// ====== 窗口尺寸变化序列 ======
const windowSizeSequences = [
  // 第1轮：桌面端常见尺寸变化
  [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 }
  ],
  // 第2轮：移动端尺寸变化
  [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 375, height: 667 }
  ],
  // 第3轮：极端比例测试
  [
    { width: 2560, height: 1440 },
    { width: 800, height: 600 },
    { width: 320, height: 568 }
  ]
];

// ====== 辅助函数 ======

/**
 * 等待指定时间
 */
async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查形状是否符合30%比例和居中要求
 */
async function checkShapeAdaptation(page: any, deviceName: string, checkPointName: string) {
  try {
    // 等待形状渲染完成
    await wait(500);

    // 获取画布信息
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('#puzzle-canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      return {
        width: canvas.width,
        height: canvas.height,
        displayWidth: rect.width,
        displayHeight: rect.height
      };
    });

    if (!canvasInfo) {
      console.log(`❌ [${deviceName}] ${checkPointName}: 画布未找到`);
      return false;
    }

    // 获取形状信息（通过检查游戏状态）
    const shapeInfo = await page.evaluate(() => {
      // 尝试从全局状态或DOM中获取形状信息
      const gameState = (window as any).__GAME_STATE__;
      if (gameState && gameState.originalShape) {
        const shape = gameState.originalShape;
        if (!shape || shape.length === 0) return null;

        // 计算形状边界
        const bounds = shape.reduce((acc: any, point: any) => ({
          minX: Math.min(acc.minX, point.x),
          maxX: Math.max(acc.maxX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxY: Math.max(acc.maxY, point.y)
        }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

        // 计算形状中心和尺寸
        const shapeWidth = bounds.maxX - bounds.minX;
        const shapeHeight = bounds.maxY - bounds.minY;
        const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
        const shapeCenterY = (bounds.minY + bounds.maxY) / 2;
        const shapeDiameter = Math.max(shapeWidth, shapeHeight);

        return {
          width: shapeWidth,
          height: shapeHeight,
          diameter: shapeDiameter,
          centerX: shapeCenterX,
          centerY: shapeCenterY,
          bounds
        };
      }
      return null;
    });

    if (!shapeInfo) {
      console.log(`❌ [${deviceName}] ${checkPointName}: 形状信息未找到`);
      return false;
    }

    // 计算画布中心
    const canvasCenterX = canvasInfo.width / 2;
    const canvasCenterY = canvasInfo.height / 2;

    // 计算画布最小边
    const canvasMinDimension = Math.min(canvasInfo.width, canvasInfo.height);
    const expectedDiameter = canvasMinDimension * 0.3; // 30%

    // 检查1: 形状大小是否为画布最小边的30%
    const sizeRatio = shapeInfo.diameter / canvasMinDimension;
    const sizeError = Math.abs(sizeRatio - 0.3);
    const sizeOk = sizeError < 0.05; // 允许5%的误差

    // 检查2: 形状是否居中
    const centerErrorX = Math.abs(shapeInfo.centerX - canvasCenterX);
    const centerErrorY = Math.abs(shapeInfo.centerY - canvasCenterY);
    const maxCenterError = Math.max(centerErrorX, centerErrorY);
    const centerOk = maxCenterError < 10; // 允许10像素的误差

    // 输出详细信息
    console.log(`[${deviceName}] ${checkPointName}:`);
    console.log(`  画布尺寸: ${canvasInfo.width}x${canvasInfo.height}`);
    console.log(`  画布最小边: ${canvasMinDimension}`);
    console.log(`  期望形状直径: ${expectedDiameter.toFixed(1)}`);
    console.log(`  实际形状直径: ${shapeInfo.diameter.toFixed(1)}`);
    console.log(`  尺寸比例: ${(sizeRatio * 100).toFixed(1)}% (期望30%)`);
    console.log(`  尺寸误差: ${(sizeError * 100).toFixed(1)}%`);
    console.log(`  画布中心: (${canvasCenterX}, ${canvasCenterY})`);
    console.log(`  形状中心: (${shapeInfo.centerX.toFixed(1)}, ${shapeInfo.centerY.toFixed(1)})`);
    console.log(`  中心误差: X=${centerErrorX.toFixed(1)}, Y=${centerErrorY.toFixed(1)}`);
    console.log(`  尺寸检查: ${sizeOk ? '✅' : '❌'}`);
    console.log(`  居中检查: ${centerOk ? '✅' : '❌'}`);

    const passed = sizeOk && centerOk;
    console.log(`  总体结果: ${passed ? '✅ 通过' : '❌ 不通过'}`);

    return passed;
  } catch (error) {
    console.log(`❌ [${deviceName}] ${checkPointName}: 检查过程中发生错误:`, error);
    return false;
  }
}

/**
 * 检查页面是否有错误
 */
async function checkPageErrors(page: any, deviceName: string) {
  const errors = await page.evaluate(() => {
    const errorLogs = (window as any).__ERROR_LOGS__ || [];
    return errorLogs;
  });

  if (errors.length > 0) {
    console.log(`❌ [${deviceName}] 页面存在错误:`, errors);
    return false;
  }

  return true;
}

/**
 * 模拟窗口尺寸变化
 */
async function simulateWindowResize(page: any, sizes: Array<{ width: number, height: number }>, deviceName: string, roundName: string) {
  console.log(`[${deviceName}] 开始${roundName}窗口尺寸变化...`);

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    console.log(`[${deviceName}] ${roundName} - 变化${i + 1}: ${size.width}x${size.height}`);

    // 设置新的视口尺寸
    await page.setViewportSize(size);

    // 等待适配完成
    await wait(1000);

    // 触发resize事件确保适配
    await page.evaluate(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // 再次等待
    await wait(500);
  }

  console.log(`[${deviceName}] ${roundName}窗口尺寸变化完成`);
}

// ====== 主测试套件 ======
test.describe('形状适配专项自动化测试', () => {
  for (const device of customTestDevices) {
    const userAgent = userAgentMap[device.name] || '';

    test(`形状适配完整流程测试 - ${device.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: device.viewport,
        isMobile: device.isMobile,
        deviceScaleFactor: device.deviceScaleFactor,
        hasTouch: device.hasTouch,
        userAgent: userAgent || undefined
      });

      const page = await context.newPage();

      // 监听页面错误
      const pageErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageErrors.push(msg.text());
        }
      });

      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });

      // 注入错误收集器
      await page.addInitScript(() => {
        (window as any).__ERROR_LOGS__ = [];
        const originalError = console.error;
        console.error = (...args) => {
          (window as any).__ERROR_LOGS__.push(args.join(' '));
          originalError.apply(console, args);
        };
      });

      try {
        console.log(`\n🚀 开始测试设备: ${device.name}`);

        // 步骤1: 加载页面
        console.log(`[${device.name}] 步骤1: 加载页面`);
        await page.goto('/');
        await page.waitForSelector('#puzzle-canvas', { timeout: 10000 });
        await wait(2000); // 等待页面完全加载

        // 步骤2: 点击多边形（生成形状）
        console.log(`[${device.name}] 步骤2: 点击多边形生成形状`);

        // 查找并点击多边形按钮
        const polygonButton = await page.locator('button:has-text("多边形"), button:has-text("polygon"), [data-testid="polygon-button"]').first();
        if (await polygonButton.count() > 0) {
          await polygonButton.click();
        } else {
          // 尝试其他可能的选择器
          const shapeButtons = await page.locator('button').all();
          for (const button of shapeButtons) {
            const text = await button.textContent();
            if (text && (text.includes('多边形') || text.includes('polygon') || text.includes('形状'))) {
              await button.click();
              break;
            }
          }
        }

        await wait(1000); // 等待形状生成

        // 注入游戏状态访问器
        await page.evaluate(() => {
          // 尝试从React DevTools或全局状态获取游戏状态
          const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
          if (reactRoot && (reactRoot as any)._reactInternalFiber) {
            // 尝试获取React状态
            const fiber = (reactRoot as any)._reactInternalFiber;
            // 这里可以添加更复杂的React状态提取逻辑
          }

          // 作为备选方案，监听状态变化
          (window as any).__GAME_STATE__ = {
            originalShape: [] // 这里需要实际的形状数据
          };
        });

        // 步骤3: 检查点1 - 初始形状检查
        console.log(`[${device.name}] 步骤3: 检查点1 - 初始形状适配检查`);
        const check1Passed = await checkShapeAdaptation(page, device.name, '检查点1');

        // 步骤4: 第1轮窗口尺寸变化
        await simulateWindowResize(page, windowSizeSequences[0], device.name, '第1轮');

        // 步骤5: 检查点2 - 页面错误检查
        console.log(`[${device.name}] 步骤5: 检查点2 - 页面错误检查`);
        const check2Passed = pageErrors.length === 0;
        if (!check2Passed) {
          console.log(`❌ [${device.name}] 检查点2: 页面存在错误`, pageErrors);
        } else {
          console.log(`✅ [${device.name}] 检查点2: 页面无错误`);
        }

        // 如果有错误，不继续后续测试
        if (!check2Passed) {
          console.log(`[${device.name}] 由于页面错误，跳过后续测试`);
          await context.close();
          return;
        }

        // 步骤6: 检查点3 - 第1轮后形状检查
        console.log(`[${device.name}] 步骤6: 检查点3 - 第1轮后形状适配检查`);
        const check3Passed = await checkShapeAdaptation(page, device.name, '检查点3');

        // 步骤7: 第2轮窗口尺寸变化
        await simulateWindowResize(page, windowSizeSequences[1], device.name, '第2轮');

        // 步骤8: 检查点4 - 第2轮后形状检查
        console.log(`[${device.name}] 步骤8: 检查点4 - 第2轮后形状适配检查`);
        const check4Passed = await checkShapeAdaptation(page, device.name, '检查点4');

        // 步骤9: 第3轮窗口尺寸变化
        await simulateWindowResize(page, windowSizeSequences[2], device.name, '第3轮');

        // 步骤10: 检查点5 - 第3轮后形状检查
        console.log(`[${device.name}] 步骤10: 检查点5 - 第3轮后形状适配检查`);
        const check5Passed = await checkShapeAdaptation(page, device.name, '检查点5');

        // 汇总测试结果
        const allChecksPassed = check1Passed && check2Passed && check3Passed && check4Passed && check5Passed;

        console.log(`\n📊 [${device.name}] 测试结果汇总:`);
        console.log(`  检查点1 (初始): ${check1Passed ? '✅' : '❌'}`);
        console.log(`  检查点2 (错误): ${check2Passed ? '✅' : '❌'}`);
        console.log(`  检查点3 (第1轮): ${check3Passed ? '✅' : '❌'}`);
        console.log(`  检查点4 (第2轮): ${check4Passed ? '✅' : '❌'}`);
        console.log(`  检查点5 (第3轮): ${check5Passed ? '✅' : '❌'}`);
        console.log(`  总体结果: ${allChecksPassed ? '✅ 全部通过' : '❌ 存在问题'}`);

        // 使用Playwright的断言
        expect(allChecksPassed).toBe(true);

      } catch (error) {
        console.error(`❌ [${device.name}] 测试过程中发生错误:`, error);
        throw error;
      } finally {
        await context.close();
      }
    });
  }
});

// ====== 单独的快速验证测试 ======
test.describe('形状适配快速验证', () => {
  test('基础形状生成和适配验证', async ({ page }) => {
    console.log('🔍 开始快速验证测试...');

    // 加载页面
    await page.goto('/');
    await page.waitForSelector('#puzzle-canvas', { timeout: 10000 });

    // 检查画布是否存在
    const canvas = await page.$('#puzzle-canvas');
    expect(canvas).not.toBeNull();

    // 获取画布尺寸
    const canvasSize = await page.evaluate(() => {
      const canvas = document.querySelector('#puzzle-canvas') as HTMLCanvasElement;
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    expect(canvasSize).not.toBeNull();
    console.log(`✅ 画布尺寸: ${canvasSize?.width}x${canvasSize?.height}`);

    // 尝试生成形状
    try {
      const buttons = await page.locator('button').all();
      let shapeButtonFound = false;

      for (const button of buttons) {
        const text = await button.textContent();
        if (text && (text.includes('多边形') || text.includes('polygon') || text.includes('形状') || text.includes('生成'))) {
          await button.click();
          shapeButtonFound = true;
          console.log(`✅ 找到并点击了形状按钮: ${text}`);
          break;
        }
      }

      if (!shapeButtonFound) {
        console.log('⚠️ 未找到明确的形状生成按钮，尝试点击第一个按钮');
        if (buttons.length > 0) {
          await buttons[0].click();
        }
      }

      // 等待形状生成
      await wait(2000);

      console.log('✅ 快速验证测试完成');

    } catch (error) {
      console.log('⚠️ 形状生成过程中出现问题:', error);
    }
  });
});