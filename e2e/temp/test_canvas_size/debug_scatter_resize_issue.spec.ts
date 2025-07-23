import { test, expect } from '@playwright/test';

test('Debug scattered puzzle visibility after window resize', async ({ page }) => {
  // 导航到游戏页面
  await page.goto('/');
  
  // 等待页面加载完成
  await page.waitForSelector('canvas', { timeout: 10000 });
  
  // 等待拼图生成完成
  await page.waitForTimeout(2000);
  
  console.log('=== 步骤1: 初始状态检查 ===');
  
  // 检查初始画布状态
  const initialCanvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      canvasExists: !!canvas,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height,
      canvasStyle: canvas ? {
        width: canvas.style.width,
        height: canvas.style.height
      } : null
    };
  });
  
  console.log('初始画布信息:', initialCanvasInfo);
  
  // 检查游戏状态
  const initialGameState = await page.evaluate(() => {
    return (window as any).gameStateForDebug || 'Game state not available';
  });
  
  console.log('初始游戏状态:', JSON.stringify(initialGameState, null, 2));
  
  console.log('=== 步骤2: 散开拼图 ===');
  
  // 点击散开按钮
  const scatterButton = page.locator('button:has-text("散开")');
  await expect(scatterButton).toBeVisible();
  await scatterButton.click();
  
  // 等待散开动画完成
  await page.waitForTimeout(1000);
  
  // 检查散开后的状态
  const afterScatterState = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gameState = (window as any).gameStateForDebug;
    
    return {
      canvasInfo: {
        width: canvas?.width,
        height: canvas?.height,
        styleWidth: canvas?.style.width,
        styleHeight: canvas?.style.height
      },
      gameState: {
        canvasWidth: gameState?.canvasWidth,
        canvasHeight: gameState?.canvasHeight,
        isScattered: gameState?.isScattered,
        puzzlePiecesCount: gameState?.puzzlePieces?.length || 0
      },
      firstPiecePosition: gameState?.puzzlePieces?.[0] ? {
        x: gameState.puzzlePieces[0].x,
        y: gameState.puzzlePieces[0].y,
        points: gameState.puzzlePieces[0].points?.slice(0, 3) // 只取前3个点
      } : null
    };
  });
  
  console.log('散开后状态:', JSON.stringify(afterScatterState, null, 2));
  
  console.log('=== 步骤3: 调整窗口大小 ===');
  
  // 记录调整前的窗口大小
  const beforeResize = await page.viewportSize();
  console.log('调整前窗口大小:', beforeResize);
  
  // 调整窗口大小
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(1000);
  
  console.log('=== 步骤4: 检查调整后状态 ===');
  
  // 检查调整后的状态
  const afterResizeState = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gameState = (window as any).gameStateForDebug;
    
    return {
      canvasInfo: {
        width: canvas?.width,
        height: canvas?.height,
        styleWidth: canvas?.style.width,
        styleHeight: canvas?.style.height
      },
      gameState: {
        canvasWidth: gameState?.canvasWidth,
        canvasHeight: gameState?.canvasHeight,
        isScattered: gameState?.isScattered,
        puzzlePiecesCount: gameState?.puzzlePieces?.length || 0
      },
      firstPiecePosition: gameState?.puzzlePieces?.[0] ? {
        x: gameState.puzzlePieces[0].x,
        y: gameState.puzzlePieces[0].y,
        points: gameState.puzzlePieces[0].points?.slice(0, 3) // 只取前3个点
      } : null,
      // 检查是否有NaN值
      hasNaNInFirstPiece: gameState?.puzzlePieces?.[0] ? {
        xIsNaN: isNaN(gameState.puzzlePieces[0].x),
        yIsNaN: isNaN(gameState.puzzlePieces[0].y),
        pointsHaveNaN: gameState.puzzlePieces[0].points?.some((p: any) => 
          isNaN(p?.x) || isNaN(p?.y)
        )
      } : null
    };
  });
  
  console.log('调整后状态:', JSON.stringify(afterResizeState, null, 2));
  
  console.log('=== 步骤5: 检查拼图块是否在画布范围内 ===');
  
  // 检查拼图块位置是否在画布范围内
  const visibilityCheck = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gameState = (window as any).gameStateForDebug;
    
    if (!canvas || !gameState?.puzzlePieces) {
      return { error: 'Canvas or puzzle pieces not found' };
    }
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const visiblePieces = [];
    const invisiblePieces = [];
    
    gameState.puzzlePieces.forEach((piece: any, index: number) => {
      const isVisible = piece.x >= 0 && piece.x <= canvasWidth && 
                       piece.y >= 0 && piece.y <= canvasHeight;
      
      const pieceInfo = {
        index,
        x: piece.x,
        y: piece.y,
        isVisible,
        canvasSize: { width: canvasWidth, height: canvasHeight }
      };
      
      if (isVisible) {
        visiblePieces.push(pieceInfo);
      } else {
        invisiblePieces.push(pieceInfo);
      }
    });
    
    return {
      canvasSize: { width: canvasWidth, height: canvasHeight },
      totalPieces: gameState.puzzlePieces.length,
      visibleCount: visiblePieces.length,
      invisibleCount: invisiblePieces.length,
      visiblePieces: visiblePieces.slice(0, 3), // 只显示前3个
      invisiblePieces: invisiblePieces.slice(0, 3) // 只显示前3个
    };
  });
  
  console.log('可见性检查:', JSON.stringify(visibilityCheck, null, 2));
  
  console.log('=== 步骤6: 检查适配引擎调用 ===');
  
  // 触发一次手动适配来观察过程
  const adaptationResult = await page.evaluate(() => {
    const gameState = (window as any).gameStateForDebug;
    if (!gameState) return { error: 'No game state' };
    
    // 尝试获取适配引擎的调试信息
    return {
      gameStateCanvasSize: {
        width: gameState.canvasWidth,
        height: gameState.canvasHeight
      },
      actualCanvasSize: {
        width: document.querySelector('canvas')?.width,
        height: document.querySelector('canvas')?.height
      },
      mismatch: gameState.canvasWidth !== document.querySelector('canvas')?.width ||
                gameState.canvasHeight !== document.querySelector('canvas')?.height
    };
  });
  
  console.log('适配检查结果:', JSON.stringify(adaptationResult, null, 2));
});