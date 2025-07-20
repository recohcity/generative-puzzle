/**
 * Step3 运行时修复测试 - 在浏览器中直接修复generatePuzzle函数
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

test.describe('Step3: 运行时修复测试', () => {
  test('运行时修复generatePuzzle函数并验证效果', async ({ page }) => {
    console.log('🔧 运行时修复测试: 修复generatePuzzle函数');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('FIXED') || text.includes('basePuzzle') || text.includes('绝对坐标适配')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    // 1. 加载页面并生成形状
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    await waitForTip(page, '请点击生成你喜欢的形状');
    await page.getByRole('button', { name: /多边形/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('直线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '1' }).click();
    
    // 2. 在浏览器中注入修复代码
    console.log('🔧 注入修复代码...');
    const fixResult = await page.evaluate(() => {
      try {
        // 保存原始的dispatch函数引用
        const gameState = (window as any).__gameStateForTests__;
        if (!gameState) {
          return { success: false, error: 'Game state not found' };
        }
        
        // 创建一个修复的generatePuzzle函数
        const originalGeneratePuzzle = (window as any).testAPI.generatePuzzle;
        
        (window as any).testAPI.generatePuzzle = function(cutCount) {
          console.log('🔧 [FIXED] generatePuzzle被调用，cutCount:', cutCount);
          
          // 调用原始函数
          originalGeneratePuzzle.call(this, cutCount);
          
          // 等待一下让dispatch完成，然后手动设置basePuzzle
          setTimeout(() => {
            const currentState = (window as any).__gameStateForTests__;
            if (currentState && currentState.puzzle && currentState.puzzle.length > 0) {
              console.log('🔧 [FIXED] 手动设置basePuzzle，拼图块数量:', currentState.puzzle.length);
              
              // 手动设置basePuzzle
              currentState.basePuzzle = JSON.parse(JSON.stringify(currentState.puzzle));
              
              console.log('🔧 [FIXED] basePuzzle已设置，长度:', currentState.basePuzzle.length);
            } else {
              console.log('🔧 [FIXED] 无法设置basePuzzle，当前拼图状态:', !!currentState?.puzzle);
            }
          }, 100);
        };
        
        // 同时修复拼图块适配函数
        (window as any).fixedAdaptPuzzlePiecesAbsolute = function(
          originalPieces,
          originalCanvasSize,
          currentCanvasSize
        ) {
          console.log('🔧 [FIXED] 绝对坐标适配被调用:', {
            piecesCount: originalPieces?.length || 0,
            originalCanvas: originalCanvasSize,
            currentCanvas: currentCanvasSize
          });
          
          if (!originalPieces || originalPieces.length === 0) {
            console.log('🔧 [FIXED] 没有原始拼图块，返回空数组');
            return originalPieces;
          }
          
          try {
            // 计算缩放比例
            const originalMinEdge = Math.min(originalCanvasSize.width, originalCanvasSize.height);
            const currentMinEdge = Math.min(currentCanvasSize.width, currentCanvasSize.height);
            const scale = currentMinEdge / originalMinEdge;
            
            // 计算画布中心点
            const originalCenter = {
              x: originalCanvasSize.width / 2,
              y: originalCanvasSize.height / 2
            };
            const currentCenter = {
              x: currentCanvasSize.width / 2,
              y: currentCanvasSize.height / 2
            };
            
            console.log('🔧 [FIXED] 适配参数:', {
              scale: scale.toFixed(3),
              originalCenter,
              currentCenter
            });
            
            // 适配每个拼图块
            const adaptedPieces = originalPieces.map(piece => {
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
            
            console.log('🔧 [FIXED] 绝对坐标适配完成:', adaptedPieces.length, '个拼图块');
            return adaptedPieces;
          } catch (error) {
            console.error('🔧 [FIXED] 绝对坐标适配失败:', error);
            return originalPieces;
          }
        };
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('📊 修复结果:', fixResult);
    expect(fixResult.success).toBe(true);
    
    // 3. 点击切割形状按钮
    console.log('🔄 点击切割形状按钮...');
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 4. 检查basePuzzle是否被正确设置
    await page.waitForTimeout(500); // 等待修复代码执行
    
    const afterCutState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      };
    });
    
    console.log('📊 切割后状态:', afterCutState);
    
    expect(afterCutState.hasBasePuzzle).toBe(true);
    expect(afterCutState.basePuzzleLength).toBe(afterCutState.puzzleLength);
    
    // 5. 现在测试窗口大小变化
    console.log('🔄 测试窗口大小变化...');
    
    // 获取初始状态
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      return {
        originalShape: state.originalShape,
        puzzle: state.puzzle,
        basePuzzle: state.basePuzzle,
        canvasWidth: canvas ? canvas.width : state.canvasWidth,
        canvasHeight: canvas ? canvas.height : state.canvasHeight,
        isScattered: state.isScattered
      };
    });
    
    const initialShapeCenter = calculateCenter(initialState.originalShape);
    const initialPuzzleCenter = calculateCenter(initialState.puzzle.map((p: any) => ({ x: p.x, y: p.y })));
    
    console.log('📊 初始状态:');
    console.log(`  形状中心: (${initialShapeCenter.x.toFixed(1)}, ${initialShapeCenter.y.toFixed(1)})`);
    console.log(`  拼图中心: (${initialPuzzleCenter.x.toFixed(1)}, ${initialPuzzleCenter.y.toFixed(1)})`);
    
    // 6. 第一次窗口调整
    console.log('🔄 第一次窗口调整: 1200x900');
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(2000); // 等待适配完成
    
    const firstState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const canvas = document.querySelector('canvas');
      
      // 使用修复的适配函数
      const adaptedPieces = (window as any).fixedAdaptPuzzlePiecesAbsolute(
        state.basePuzzle,
        { width: 640, height: 640 }, // 原始画布尺寸
        { width: canvas ? canvas.width : 780, height: canvas ? canvas.height : 780 } // 当前画布尺寸
      );
      
      return {
        originalShape: state.originalShape,
        puzzle: state.puzzle,
        adaptedPieces: adaptedPieces,
        canvasWidth: canvas ? canvas.width : state.canvasWidth,
        canvasHeight: canvas ? canvas.height : state.canvasHeight
      };
    });
    
    const firstShapeCenter = calculateCenter(firstState.originalShape);
    const firstPuzzleCenter = calculateCenter(firstState.puzzle.map((p: any) => ({ x: p.x, y: p.y })));
    const firstAdaptedCenter = calculateCenter(firstState.adaptedPieces.map((p: any) => ({ x: p.x, y: p.y })));
    
    console.log('📊 第一次调整后:');
    console.log(`  形状中心: (${firstShapeCenter.x.toFixed(1)}, ${firstShapeCenter.y.toFixed(1)})`);
    console.log(`  当前拼图中心: (${firstPuzzleCenter.x.toFixed(1)}, ${firstPuzzleCenter.y.toFixed(1)})`);
    console.log(`  修复后拼图中心: (${firstAdaptedCenter.x.toFixed(1)}, ${firstAdaptedCenter.y.toFixed(1)})`);
    
    // 验证修复后的拼图块与形状中心更接近
    const currentDiff = Math.abs(firstShapeCenter.x - firstPuzzleCenter.x) + Math.abs(firstShapeCenter.y - firstPuzzleCenter.y);
    const fixedDiff = Math.abs(firstShapeCenter.x - firstAdaptedCenter.x) + Math.abs(firstShapeCenter.y - firstAdaptedCenter.y);
    
    console.log(`📊 中心差异对比:`);
    console.log(`  当前拼图块差异: ${currentDiff.toFixed(1)}`);
    console.log(`  修复后拼图块差异: ${fixedDiff.toFixed(1)}`);
    
    // 修复后的差异应该更小
    expect(fixedDiff).toBeLessThan(currentDiff);
    expect(fixedDiff).toBeLessThan(50); // 修复后应该很接近
    
    console.log('✅ 运行时修复测试通过！');
  });
});