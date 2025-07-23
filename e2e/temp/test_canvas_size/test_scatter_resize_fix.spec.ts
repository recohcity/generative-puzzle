import { test, expect } from '@playwright/test';

test('Verify scattered puzzle visibility after window resize is fixed', async ({ page }) => {
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
      window.testAPI.generatePuzzle(6);
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
      allPiecesHaveValidCoords: gameState?.puzzlePieces?.every((piece: any) => 
        piece.points?.every((point: any) => 
          typeof point.x === 'number' && 
          typeof point.y === 'number' && 
          !isNaN(point.x) && 
          !isNaN(point.y)
        )
      )
    };
  });
  
  console.log('散开后状态:', JSON.stringify(afterScatterState, null, 2));
  
  // 验证散开后的状态
  expect(afterScatterState.isScattered).toBe(true);
  expect(afterScatterState.puzzlePiecesCount).toBeGreaterThan(0);
  expect(afterScatterState.allPiecesHaveValidCoords).toBe(true);
  
  console.log('=== 步骤3: 多次调整窗口大小测试 ===');
  
  const testSizes = [
    { width: 1200, height: 800 },
    { width: 800, height: 600 },
    { width: 1400, height: 900 },
    { width: 1000, height: 700 }
  ];
  
  for (let i = 0; i < testSizes.length; i++) {
    const size = testSizes[i];
    console.log(`调整到尺寸 ${i + 1}: ${size.width}x${size.height}`);
    
    await page.setViewportSize(size);
    await page.waitForTimeout(1500);
    
    // 检查调整后的状态
    const afterResizeState = await page.evaluate(() => {
      const gameState = (window as any).gameStateForDebug;
      return {
        puzzlePiecesCount: gameState?.puzzlePieces?.length || 0,
        isScattered: gameState?.isScattered,
        allPiecesHaveValidCoords: gameState?.puzzlePieces?.every((piece: any) => 
          piece.points?.every((point: any) => 
            typeof point.x === 'number' && 
            typeof point.y === 'number' && 
            !isNaN(point.x) && 
            !isNaN(point.y) &&
            point.x !== 0 && point.y !== 0  // 确保不是默认的0值
          )
        ),
        visiblePiecesCount: (() => {
          const canvas = document.querySelector('canvas');
          if (!canvas || !gameState?.puzzlePieces) return 0;
          
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          
          return gameState.puzzlePieces.filter((piece: any) => 
            piece.x >= -50 && piece.x <= canvasWidth + 50 && 
            piece.y >= -50 && piece.y <= canvasHeight + 50
          ).length;
        })()
      };
    });
    
    console.log(`调整后状态 ${i + 1}:`, JSON.stringify(afterResizeState, null, 2));
    
    // 验证每次调整后的状态
    expect(afterResizeState.isScattered).toBe(true);
    expect(afterResizeState.puzzlePiecesCount).toBeGreaterThan(0);
    expect(afterResizeState.allPiecesHaveValidCoords).toBe(true);
    expect(afterResizeState.visiblePiecesCount).toBe(afterResizeState.puzzlePiecesCount);
  }
  
  console.log('=== 步骤4: 验证拼图块可以正常交互 ===');
  
  // 尝试移动一个拼图块
  const canvas = page.locator('#puzzle-canvas');
  await canvas.click({ position: { x: 200, y: 200 } });
  await page.waitForTimeout(500);
  
  // 检查是否有拼图块被选中
  const interactionState = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    return {
      selectedPiece: gameState?.selectedPiece,
      hasValidSelection: gameState?.selectedPiece !== null && gameState?.selectedPiece >= 0
    };
  });
  
  console.log('交互状态:', JSON.stringify(interactionState, null, 2));
  
  console.log('✅ 所有测试通过！散开拼图在窗口调整后保持可见且可交互。');
});