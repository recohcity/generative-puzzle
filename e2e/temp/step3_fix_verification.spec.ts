/**
 * Step3 修复验证测试
 * 验证拼图块适配偏移问题的修复效果
 */

import { test, expect, Page } from '@playwright/test';
test.setTimeout(120000);

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 辅助函数：计算中心点
function calculateCenter(points: Array<{x: number, y: number}>) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  
  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
  
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}

test.describe('Step3: 修复验证测试', () => {
  test('验证桌面端连续窗口调整后拼图块不会偏移', async ({ page }) => {
    console.log('🔧 测试: 桌面端连续窗口调整修复验证');
    
    // 1. 生成拼图
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    await waitForTip(page, '请点击生成你喜欢的形状');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('直线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 2. 获取初始状态
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      return {
        originalShape: state.originalShape,
        puzzle: state.puzzle,
        canvasWidth: canvas ? canvas.width : state.canvasWidth,
        canvasHeight: canvas ? canvas.height : state.canvasHeight,
        isScattered: state.isScattered
      };
    });
    
    expect(initialState.puzzle).toBeTruthy();
    expect(initialState.isScattered).toBe(false);
    
    const initialShapeCenter = calculateCenter(initialState.originalShape);
    const initialPuzzleCenter = calculateCenter(initialState.puzzle.map((p: any) => ({ x: p.x, y: p.y })));
    const initialCanvasCenter = {
      x: initialState.canvasWidth / 2,
      y: initialState.canvasHeight / 2
    };
    
    console.log(`📊 初始状态:`);
    console.log(`  形状中心: (${initialShapeCenter.x.toFixed(1)}, ${initialShapeCenter.y.toFixed(1)})`);
    console.log(`  拼图中心: (${initialPuzzleCenter.x.toFixed(1)}, ${initialPuzzleCenter.y.toFixed(1)})`);
    console.log(`  画布中心: (${initialCanvasCenter.x.toFixed(1)}, ${initialCanvasCenter.y.toFixed(1)})`);
    
    // 3. 连续10次窗口大小调整
    const windowSizes = [
      { width: 1200, height: 900 },
      { width: 1000, height: 800 },
      { width: 1400, height: 1000 },
      { width: 800, height: 600 },
      { width: 1600, height: 1200 },
      { width: 1100, height: 850 },
      { width: 1300, height: 950 },
      { width: 900, height: 700 },
      { width: 1500, height: 1100 },
      { width: 1200, height: 900 } // 回到初始大小
    ];
    
    for (let i = 0; i < windowSizes.length; i++) {
      const size = windowSizes[i];
      console.log(`🔄 第${i + 1}次调整: ${size.width}x${size.height}`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(1000); // 等待适配完成
      
      const currentState = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        const canvas = document.querySelector('canvas');
        return {
          originalShape: state.originalShape,
          puzzle: state.puzzle,
          canvasWidth: canvas ? canvas.width : state.canvasWidth,
          canvasHeight: canvas ? canvas.height : state.canvasHeight,
          isScattered: state.isScattered
        };
      });
      
      expect(currentState.puzzle).toBeTruthy();
      expect(currentState.isScattered).toBe(false);
      
      const currentShapeCenter = calculateCenter(currentState.originalShape);
      const currentPuzzleCenter = calculateCenter(currentState.puzzle.map((p: any) => ({ x: p.x, y: p.y })));
      const currentCanvasCenter = {
        x: currentState.canvasWidth / 2,
        y: currentState.canvasHeight / 2
      };
      
      // 验证形状居中
      const shapeCenterDiffX = Math.abs(currentShapeCenter.x - currentCanvasCenter.x);
      const shapeCenterDiffY = Math.abs(currentShapeCenter.y - currentCanvasCenter.y);
      
      expect(shapeCenterDiffX).toBeLessThan(5); // 形状应该完美居中
      expect(shapeCenterDiffY).toBeLessThan(5);
      
      // 验证拼图块与形状的相对位置保持稳定
      const puzzleShapeDiffX = Math.abs(currentPuzzleCenter.x - currentShapeCenter.x);
      const puzzleShapeDiffY = Math.abs(currentPuzzleCenter.y - currentShapeCenter.y);
      
      console.log(`  形状中心: (${currentShapeCenter.x.toFixed(1)}, ${currentShapeCenter.y.toFixed(1)})`);
      console.log(`  拼图中心: (${currentPuzzleCenter.x.toFixed(1)}, ${currentPuzzleCenter.y.toFixed(1)})`);
      console.log(`  画布中心: (${currentCanvasCenter.x.toFixed(1)}, ${currentCanvasCenter.y.toFixed(1)})`);
      console.log(`  重叠差异: Δx=${puzzleShapeDiffX.toFixed(1)}, Δy=${puzzleShapeDiffY.toFixed(1)}`);
      
      // 修复后，拼图块应该与形状保持很好的重叠
      expect(puzzleShapeDiffX).toBeLessThan(50); // 允许合理误差
      expect(puzzleShapeDiffY).toBeLessThan(50);
    }
    
    console.log('✅ 桌面端连续窗口调整测试通过');
  });

  test('验证移动端横竖屏切换后拼图块不会缩小偏移', async ({ page }) => {
    console.log('🔧 测试: 移动端横竖屏切换修复验证');
    
    // 1. 生成拼图
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    await waitForTip(page, '请点击生成你喜欢的形状');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('直线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 2. 获取初始状态
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      return {
        originalShape: state.originalShape,
        puzzle: state.puzzle,
        canvasWidth: canvas ? canvas.width : state.canvasWidth,
        canvasHeight: canvas ? canvas.height : state.canvasHeight
      };
    });
    
    const initialShapeSize = calculateShapeSize(initialState.originalShape);
    const initialPuzzleSize = calculatePuzzleSize(initialState.puzzle);
    
    console.log(`📊 初始尺寸:`);
    console.log(`  形状尺寸: ${initialShapeSize.toFixed(1)}`);
    console.log(`  拼图尺寸: ${initialPuzzleSize.toFixed(1)}`);
    
    // 3. 模拟多次横竖屏切换
    const orientations = [
      { width: 390, height: 844, name: '竖屏' },  // iPhone 14 竖屏
      { width: 844, height: 390, name: '横屏' },  // iPhone 14 横屏
      { width: 390, height: 844, name: '竖屏' },
      { width: 844, height: 390, name: '横屏' },
      { width: 390, height: 844, name: '竖屏' },
      { width: 844, height: 390, name: '横屏' },
      { width: 390, height: 844, name: '竖屏' },
      { width: 844, height: 390, name: '横屏' },
      { width: 390, height: 844, name: '竖屏' },
      { width: 844, height: 390, name: '横屏' }
    ];
    
    for (let i = 0; i < orientations.length; i++) {
      const orientation = orientations[i];
      console.log(`🔄 第${i + 1}次切换: ${orientation.name} (${orientation.width}x${orientation.height})`);
      
      await page.setViewportSize({ width: orientation.width, height: orientation.height });
      await page.waitForTimeout(1500); // 给更多时间适配
      
      const currentState = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        const canvas = document.querySelector('canvas');
        return {
          originalShape: state.originalShape,
          puzzle: state.puzzle,
          canvasWidth: canvas ? canvas.width : state.canvasWidth,
          canvasHeight: canvas ? canvas.height : state.canvasHeight
        };
      });
      
      const currentShapeSize = calculateShapeSize(currentState.originalShape);
      const currentPuzzleSize = calculatePuzzleSize(currentState.puzzle);
      
      console.log(`  形状尺寸: ${currentShapeSize.toFixed(1)}`);
      console.log(`  拼图尺寸: ${currentPuzzleSize.toFixed(1)}`);
      
      // 验证尺寸不会逐渐缩小
      const shapeSizeRatio = currentShapeSize / initialShapeSize;
      const puzzleSizeRatio = currentPuzzleSize / initialPuzzleSize;
      
      // 尺寸比例应该在合理范围内（考虑到不同屏幕比例的适配）
      expect(shapeSizeRatio).toBeGreaterThan(0.5); // 不应该缩小超过50%
      expect(shapeSizeRatio).toBeLessThan(2.0);     // 不应该放大超过200%
      expect(puzzleSizeRatio).toBeGreaterThan(0.5);
      expect(puzzleSizeRatio).toBeLessThan(2.0);
      
      // 验证形状和拼图块尺寸保持同步
      const sizeRatioDiff = Math.abs(shapeSizeRatio - puzzleSizeRatio);
      expect(sizeRatioDiff).toBeLessThan(0.2); // 尺寸比例差异应该很小
    }
    
    console.log('✅ 移动端横竖屏切换测试通过');
  });
});

// 辅助函数：计算形状尺寸
function calculateShapeSize(shape: Array<{x: number, y: number}>) {
  if (!shape || shape.length === 0) return 0;
  
  const bounds = shape.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
  
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  return Math.max(width, height); // 返回最大边长作为尺寸
}

// 辅助函数：计算拼图块整体尺寸
function calculatePuzzleSize(puzzle: Array<{x: number, y: number, points: Array<{x: number, y: number}>}>) {
  if (!puzzle || puzzle.length === 0) return 0;
  
  // 收集所有拼图块的所有点
  const allPoints: Array<{x: number, y: number}> = [];
  puzzle.forEach(piece => {
    if (piece.points && piece.points.length > 0) {
      allPoints.push(...piece.points);
    }
  });
  
  if (allPoints.length === 0) return 0;
  
  const bounds = allPoints.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
  
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  return Math.max(width, height); // 返回最大边长作为尺寸
}