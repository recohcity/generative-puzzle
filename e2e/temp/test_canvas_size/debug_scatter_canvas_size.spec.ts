import { test, expect } from '@playwright/test';

test('Debug scatterCanvasSize during adaptation', async ({ page }) => {
  // 监听控制台日志
  const consoleLogs: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('scatterCanvasSize') || text.includes('UnifiedAdaptationEngine') || text.includes('散开拼图适配')) {
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
  
  console.log('=== 步骤2: 散开拼图前检查状态 ===');
  
  const beforeScatterState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      canvasWidth: gameState?.canvasWidth,
      canvasHeight: gameState?.canvasHeight,
      scatterCanvasSize: gameState?.scatterCanvasSize,
      isScattered: gameState?.isScattered,
      puzzlePiecesCount: gameState?.puzzlePieces?.length || 0
    };
  });
  
  console.log('散开前状态:', JSON.stringify(beforeScatterState, null, 2));
  
  console.log('=== 步骤3: 散开拼图 ===');
  
  // 散开拼图
  const scatterButton = page.locator('button:has-text("散开")');
  await expect(scatterButton).toBeVisible();
  await scatterButton.click();
  
  await page.waitForTimeout(1000);
  
  // 检查散开后的状态
  const afterScatterState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      canvasWidth: gameState?.canvasWidth,
      canvasHeight: gameState?.canvasHeight,
      scatterCanvasSize: gameState?.scatterCanvasSize,
      isScattered: gameState?.isScattered,
      puzzlePiecesCount: gameState?.puzzlePieces?.length || 0
    };
  });
  
  console.log('散开后状态:', JSON.stringify(afterScatterState, null, 2));
  
  console.log('=== 步骤4: 调整窗口大小前的状态 ===');
  
  // 调整窗口大小前再次检查状态
  const beforeResizeState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      canvasWidth: gameState?.canvasWidth,
      canvasHeight: gameState?.canvasHeight,
      scatterCanvasSize: gameState?.scatterCanvasSize,
      isScattered: gameState?.isScattered,
      puzzlePiecesCount: gameState?.puzzlePieces?.length || 0,
      // 检查第一个拼图块的坐标
      firstPieceCoords: gameState?.puzzlePieces?.[0] ? {
        x: gameState.puzzlePieces[0].x,
        y: gameState.puzzlePieces[0].y,
        firstPointX: gameState.puzzlePieces[0].points?.[0]?.x,
        firstPointY: gameState.puzzlePieces[0].points?.[0]?.y
      } : null
    };
  });
  
  console.log('调整前状态:', JSON.stringify(beforeResizeState, null, 2));
  
  console.log('=== 步骤5: 调整窗口大小 ===');
  
  // 调整窗口大小
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(2000);
  
  console.log('=== 步骤6: 调整后的状态 ===');
  
  // 检查调整后的状态
  const afterResizeState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      canvasWidth: gameState?.canvasWidth,
      canvasHeight: gameState?.canvasHeight,
      scatterCanvasSize: gameState?.scatterCanvasSize,
      isScattered: gameState?.isScattered,
      puzzlePiecesCount: gameState?.puzzlePieces?.length || 0,
      // 检查第一个拼图块的坐标
      firstPieceCoords: gameState?.puzzlePieces?.[0] ? {
        x: gameState.puzzlePieces[0].x,
        y: gameState.puzzlePieces[0].y,
        firstPointX: gameState.puzzlePieces[0].points?.[0]?.x,
        firstPointY: gameState.puzzlePieces[0].points?.[0]?.y
      } : null
    };
  });
  
  console.log('调整后状态:', JSON.stringify(afterResizeState, null, 2));
  
  console.log('=== 捕获的相关日志 ===');
  consoleLogs.forEach((log, index) => {
    console.log(`日志 ${index + 1}:`, log);
  });
  
  // 分析问题
  console.log('=== 问题分析 ===');
  
  if (!afterScatterState.scatterCanvasSize) {
    console.log('❌ 问题：散开后 scatterCanvasSize 为 null/undefined');
  } else {
    console.log('✅ scatterCanvasSize 正常:', afterScatterState.scatterCanvasSize);
  }
  
  if (beforeResizeState.firstPieceCoords && afterResizeState.firstPieceCoords) {
    const beforePoint = beforeResizeState.firstPieceCoords;
    const afterPoint = afterResizeState.firstPieceCoords;
    
    console.log('坐标变化:');
    console.log(`  拼图块中心: (${beforePoint.x}, ${beforePoint.y}) → (${afterPoint.x}, ${afterPoint.y})`);
    console.log(`  第一个点: (${beforePoint.firstPointX}, ${beforePoint.firstPointY}) → (${afterPoint.firstPointX}, ${afterPoint.firstPointY})`);
    
    if (isNaN(afterPoint.firstPointX) || isNaN(afterPoint.firstPointY)) {
      console.log('❌ 问题：点坐标变成了 NaN');
    }
  }
});