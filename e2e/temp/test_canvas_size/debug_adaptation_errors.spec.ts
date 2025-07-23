import { test, expect } from '@playwright/test';

test('Debug adaptation engine errors during resize', async ({ page }) => {
  // 监听控制台错误
  const consoleErrors: string[] = [];
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (text.includes('[UnifiedAdaptationEngine]')) {
      consoleLogs.push(text);
    }
  });
  
  // 导航到游戏页面
  await page.goto('/');
  
  // 等待页面加载完成
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('=== 步骤1: 生成形状和拼图 ===');
  
  // 生成形状
  await page.evaluate(() => {
    if (window.testAPI) {
      window.testAPI.generateShape('circle');
    }
  });
  
  await page.waitForTimeout(1000);
  
  // 生成拼图
  await page.evaluate(() => {
    if (window.testAPI) {
      window.testAPI.generatePuzzle(4);
    }
  });
  
  await page.waitForTimeout(1000);
  
  console.log('=== 步骤2: 散开拼图 ===');
  
  // 散开拼图
  const scatterButton = page.locator('button:has-text("散开")');
  await expect(scatterButton).toBeVisible();
  await scatterButton.click();
  
  await page.waitForTimeout(1000);
  
  // 检查散开后的状态
  const afterScatterState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      puzzlePiecesCount: gameState?.puzzlePieces?.length || 0,
      isScattered: gameState?.isScattered,
      firstPiecePoints: gameState?.puzzlePieces?.[0]?.points?.slice(0, 3) || [],
      canvasSize: {
        width: gameState?.canvasWidth,
        height: gameState?.canvasHeight
      }
    };
  });
  
  console.log('散开后状态:', JSON.stringify(afterScatterState, null, 2));
  
  console.log('=== 步骤3: 调整窗口大小并监听错误 ===');
  
  // 清空之前的错误日志
  consoleErrors.length = 0;
  consoleLogs.length = 0;
  
  // 调整窗口大小
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(2000);
  
  console.log('=== 步骤4: 检查适配后的状态和错误 ===');
  
  // 检查适配后的状态
  const afterResizeState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      puzzlePiecesCount: gameState?.puzzlePieces?.length || 0,
      isScattered: gameState?.isScattered,
      firstPiecePoints: gameState?.puzzlePieces?.[0]?.points?.slice(0, 3) || [],
      canvasSize: {
        width: gameState?.canvasWidth,
        height: gameState?.canvasHeight
      },
      // 检查是否有null/0坐标
      hasNullCoordinates: gameState?.puzzlePieces?.[0]?.points?.some((p: any) => 
        p.x === null || p.y === null || p.x === 0 || p.y === 0
      )
    };
  });
  
  console.log('调整后状态:', JSON.stringify(afterResizeState, null, 2));
  
  // 输出所有捕获的错误和日志
  console.log('=== 捕获的控制台错误 ===');
  consoleErrors.forEach((error, index) => {
    console.log(`错误 ${index + 1}:`, error);
  });
  
  console.log('=== 捕获的适配引擎日志 ===');
  consoleLogs.forEach((log, index) => {
    console.log(`日志 ${index + 1}:`, log);
  });
  
  // 如果有错误，输出详细信息
  if (consoleErrors.length > 0) {
    console.log('❌ 发现适配引擎错误，总计:', consoleErrors.length);
  } else {
    console.log('✅ 没有发现适配引擎错误');
  }
  
  console.log('=== 步骤5: 手动触发适配来观察过程 ===');
  
  // 清空日志
  consoleErrors.length = 0;
  consoleLogs.length = 0;
  
  // 再次调整窗口大小来触发适配
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.waitForTimeout(2000);
  
  console.log('=== 第二次调整后的错误和日志 ===');
  consoleErrors.forEach((error, index) => {
    console.log(`第二次错误 ${index + 1}:`, error);
  });
  
  consoleLogs.forEach((log, index) => {
    console.log(`第二次日志 ${index + 1}:`, log);
  });
});