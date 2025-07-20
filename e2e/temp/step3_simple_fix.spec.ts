/**
 * Step3 简单修复测试 - 直接在浏览器中修复拼图块适配问题
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

test.describe('Step3: 简单修复测试', () => {
  test('直接修复拼图块适配问题', async ({ page }) => {
    console.log('🔧 简单修复测试: 直接修复拼图块适配');
    
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
    
    // 2. 获取初始状态并保存原始拼图块
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      
      // 手动保存原始拼图块状态
      if (state.puzzle && state.puzzle.length > 0) {
        state.originalPuzzleForFix = JSON.parse(JSON.stringify(state.puzzle));
        state.originalCanvasForFix = {
          width: canvas ? canvas.width : 640,
          height: canvas ? canvas.height : 640
        };
        console.log('🔧 已保存原始拼图块状态:', state.originalPuzzleForFix.length, '个拼图块');
        console.log('🔧 已保存原始画布尺寸:', state.originalCanvasForFix);
      }
      
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
    
    console.log('📊 初始状态:');
    console.log(`  形状中心: (${initialShapeCenter.x.toFixed(1)}, ${initialShapeCenter.y.toFixed(1)})`);
    console.log(`  拼图中心: (${initialPuzzleCenter.x.toFixed(1)}, ${initialPuzzleCenter.y.toFixed(1)})`);
    console.log(`  画布尺寸: ${initialState.canvasWidth}x${initialState.canvasHeight}`);
    
    // 3. 第一次窗口调整
    console.log('🔄 第一次窗口调整: 1200x900');
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(2000); // 等待适配完成
    
    // 4. 获取调整后状态
    const firstState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      
      return {
        originalShape: state.originalShape,
        puzzle: state.puzzle,
        canvasWidth: canvas ? canvas.width : state.canvasWidth,
        canvasHeight: canvas ? canvas.height : state.canvasHeight
      };
    });
    
    const firstShapeCenter = calculateCenter(firstState.originalShape);
    const firstPuzzleCenter = calculateCenter(firstState.puzzle.map((p: any) => ({ x: p.x, y: p.y })));
    
    console.log('📊 第一次调整后:');
    console.log(`  形状中心: (${firstShapeCenter.x.toFixed(1)}, ${firstShapeCenter.y.toFixed(1)})`);
    console.log(`  拼图中心: (${firstPuzzleCenter.x.toFixed(1)}, ${firstPuzzleCenter.y.toFixed(1)})`);
    console.log(`  画布尺寸: ${firstState.canvasWidth}x${firstState.canvasHeight}`);
    
    // 5. 在浏览器中手动修复拼图块位置
    const fixedState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      
      if (!state.originalPuzzleForFix || !state.originalCanvasForFix) {
        console.log('🔧 没有原始拼图块数据，无法修复');
        return null;
      }
      
      const currentCanvasSize = {
        width: canvas ? canvas.width : 780,
        height: canvas ? canvas.height : 780
      };
      
      console.log('🔧 开始修复拼图块位置...');
      console.log('🔧 原始画布:', state.originalCanvasForFix);
      console.log('🔧 当前画布:', currentCanvasSize);
      
      // 计算缩放比例
      const originalMinEdge = Math.min(state.originalCanvasForFix.width, state.originalCanvasForFix.height);
      const currentMinEdge = Math.min(currentCanvasSize.width, currentCanvasSize.height);
      const scale = currentMinEdge / originalMinEdge;
      
      // 计算画布中心点
      const originalCenter = {
        x: state.originalCanvasForFix.width / 2,
        y: state.originalCanvasForFix.height / 2
      };
      const currentCenter = {
        x: currentCanvasSize.width / 2,
        y: currentCanvasSize.height / 2
      };
      
      console.log('🔧 缩放比例:', scale.toFixed(3));
      console.log('🔧 原始中心:', originalCenter);
      console.log('🔧 当前中心:', currentCenter);
      
      // 修复拼图块
      const fixedPuzzle = state.originalPuzzleForFix.map(piece => {
        // 适配所有点
        const adaptedPoints = piece.points.map(point => {
          const relativeX = point.x - originalCenter.x;
          const relativeY = point.y - originalCenter.y;
          return {
            x: currentCenter.x + relativeX * scale,
            y: currentCenter.y + relativeY * scale,
            isOriginal: point.isOriginal
          };
        });
        
        // 适配中心位置
        const relativeX = piece.x - originalCenter.x;
        const relativeY = piece.y - originalCenter.y;
        const adaptedX = currentCenter.x + relativeX * scale;
        const adaptedY = currentCenter.y + relativeY * scale;
        
        return {
          ...piece,
          points: adaptedPoints,
          x: adaptedX,
          y: adaptedY,
          rotation: 0,
          originalRotation: 0
        };
      });
      
      console.log('🔧 修复完成，拼图块数量:', fixedPuzzle.length);
      
      return {
        originalShape: state.originalShape,
        currentPuzzle: state.puzzle,
        fixedPuzzle: fixedPuzzle,
        canvasWidth: currentCanvasSize.width,
        canvasHeight: currentCanvasSize.height
      };
    });
    
    if (!fixedState) {
      throw new Error('修复失败：没有原始拼图块数据');
    }
    
    const fixedShapeCenter = calculateCenter(fixedState.originalShape);
    const currentPuzzleCenter = calculateCenter(fixedState.currentPuzzle.map((p: any) => ({ x: p.x, y: p.y })));
    const fixedPuzzleCenter = calculateCenter(fixedState.fixedPuzzle.map((p: any) => ({ x: p.x, y: p.y })));
    
    console.log('📊 修复对比:');
    console.log(`  形状中心: (${fixedShapeCenter.x.toFixed(1)}, ${fixedShapeCenter.y.toFixed(1)})`);
    console.log(`  当前拼图中心: (${currentPuzzleCenter.x.toFixed(1)}, ${currentPuzzleCenter.y.toFixed(1)})`);
    console.log(`  修复后拼图中心: (${fixedPuzzleCenter.x.toFixed(1)}, ${fixedPuzzleCenter.y.toFixed(1)})`);
    
    // 6. 验证修复效果
    const currentDiff = Math.abs(fixedShapeCenter.x - currentPuzzleCenter.x) + Math.abs(fixedShapeCenter.y - currentPuzzleCenter.y);
    const fixedDiff = Math.abs(fixedShapeCenter.x - fixedPuzzleCenter.x) + Math.abs(fixedShapeCenter.y - fixedPuzzleCenter.y);
    
    console.log(`📊 中心差异对比:`);
    console.log(`  当前拼图块差异: ${currentDiff.toFixed(1)}`);
    console.log(`  修复后拼图块差异: ${fixedDiff.toFixed(1)}`);
    console.log(`  改善程度: ${((currentDiff - fixedDiff) / currentDiff * 100).toFixed(1)}%`);
    
    // 验证修复效果
    expect(fixedDiff).toBeLessThan(currentDiff); // 修复后应该更好
    expect(fixedDiff).toBeLessThan(20); // 修复后应该很接近
    
    // 7. 第二次窗口调整测试
    console.log('🔄 第二次窗口调整: 1000x800');
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForTimeout(2000);
    
    const secondState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      
      const currentCanvasSize = {
        width: canvas ? canvas.width : 580,
        height: canvas ? canvas.height : 580
      };
      
      // 再次修复拼图块
      const originalMinEdge = Math.min(state.originalCanvasForFix.width, state.originalCanvasForFix.height);
      const currentMinEdge = Math.min(currentCanvasSize.width, currentCanvasSize.height);
      const scale = currentMinEdge / originalMinEdge;
      
      const originalCenter = {
        x: state.originalCanvasForFix.width / 2,
        y: state.originalCanvasForFix.height / 2
      };
      const currentCenter = {
        x: currentCanvasSize.width / 2,
        y: currentCanvasSize.height / 2
      };
      
      const fixedPuzzle = state.originalPuzzleForFix.map(piece => {
        const adaptedPoints = piece.points.map(point => {
          const relativeX = point.x - originalCenter.x;
          const relativeY = point.y - originalCenter.y;
          return {
            x: currentCenter.x + relativeX * scale,
            y: currentCenter.y + relativeY * scale,
            isOriginal: point.isOriginal
          };
        });
        
        const relativeX = piece.x - originalCenter.x;
        const relativeY = piece.y - originalCenter.y;
        const adaptedX = currentCenter.x + relativeX * scale;
        const adaptedY = currentCenter.y + relativeY * scale;
        
        return {
          ...piece,
          points: adaptedPoints,
          x: adaptedX,
          y: adaptedY,
          rotation: 0,
          originalRotation: 0
        };
      });
      
      return {
        originalShape: state.originalShape,
        currentPuzzle: state.puzzle,
        fixedPuzzle: fixedPuzzle,
        canvasWidth: currentCanvasSize.width,
        canvasHeight: currentCanvasSize.height
      };
    });
    
    const secondShapeCenter = calculateCenter(secondState.originalShape);
    const secondCurrentPuzzleCenter = calculateCenter(secondState.currentPuzzle.map((p: any) => ({ x: p.x, y: p.y })));
    const secondFixedPuzzleCenter = calculateCenter(secondState.fixedPuzzle.map((p: any) => ({ x: p.x, y: p.y })));
    
    console.log('📊 第二次调整后:');
    console.log(`  形状中心: (${secondShapeCenter.x.toFixed(1)}, ${secondShapeCenter.y.toFixed(1)})`);
    console.log(`  当前拼图中心: (${secondCurrentPuzzleCenter.x.toFixed(1)}, ${secondCurrentPuzzleCenter.y.toFixed(1)})`);
    console.log(`  修复后拼图中心: (${secondFixedPuzzleCenter.x.toFixed(1)}, ${secondFixedPuzzleCenter.y.toFixed(1)})`);
    
    const secondCurrentDiff = Math.abs(secondShapeCenter.x - secondCurrentPuzzleCenter.x) + Math.abs(secondShapeCenter.y - secondCurrentPuzzleCenter.y);
    const secondFixedDiff = Math.abs(secondShapeCenter.x - secondFixedPuzzleCenter.x) + Math.abs(secondShapeCenter.y - secondFixedPuzzleCenter.y);
    
    console.log(`📊 第二次中心差异对比:`);
    console.log(`  当前拼图块差异: ${secondCurrentDiff.toFixed(1)}`);
    console.log(`  修复后拼图块差异: ${secondFixedDiff.toFixed(1)}`);
    console.log(`  改善程度: ${((secondCurrentDiff - secondFixedDiff) / secondCurrentDiff * 100).toFixed(1)}%`);
    
    // 验证第二次修复效果
    expect(secondFixedDiff).toBeLessThan(secondCurrentDiff);
    expect(secondFixedDiff).toBeLessThan(20);
    
    console.log('✅ 简单修复测试通过！修复方案有效！');
  });
});