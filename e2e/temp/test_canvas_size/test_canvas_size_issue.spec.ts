import { test, expect, Page } from '@playwright/test';

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page) {
  await page.addInitScript(() => {
    (window as any).soundPlayedForTest = () => {};
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('canvas#puzzle-canvas');
  await waitForTip(page, '请点击生成你喜欢的形状');
}

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 健壮的等待函数
async function robustWaitForFunction(page: Page, fn: () => boolean, timeout = 30000) {
  try {
    await page.waitForFunction(fn, null, { timeout });
  } catch (e) {
    await page.waitForFunction(fn, null, { timeout });
  }
}

test('测试画布尺寸和拼图可见性问题', async ({ page }) => {
  console.log('🔍 开始测试画布尺寸和拼图可见性问题...');

  await gotoAndEnsureCanvas(page);

  // 1. 生成拼图
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await waitForTip(page, '请选择切割类型');
  await page.getByText('斜线').click();
  await waitForTip(page, '请切割形状');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  await waitForTip(page, '请散开拼图，开始游戏');

  // 2. 散开拼图
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  await robustWaitForFunction(page, () => {
    const state = (window as any).__gameStateForTests__;
    return Array.isArray(state.puzzle) && state.puzzle.length > 0;
  }, 30000);

  // 3. 获取散开后的状态
  const beforeResize = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const canvas = document.querySelector('canvas#puzzle-canvas');
    
    return {
      // 游戏状态
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      canvasSize: state.canvasSize,
      scatterCanvasSize: state.scatterCanvasSize,
      puzzleCount: state.puzzle.length,
      
      // DOM画布信息
      canvasElement: {
        width: canvas ? canvas.width : null,
        height: canvas ? canvas.height : null,
        clientWidth: canvas ? canvas.clientWidth : null,
        clientHeight: canvas ? canvas.clientHeight : null,
        offsetWidth: canvas ? canvas.offsetWidth : null,
        offsetHeight: canvas ? canvas.offsetHeight : null
      },
      
      // 拼图块位置信息
      puzzleBounds: state.puzzle.map((piece, index) => {
        if (!piece.points || piece.points.length === 0) {
          return { index, error: 'No points' };
        }
        
        const xs = piece.points.map(p => p.x).filter(x => isFinite(x));
        const ys = piece.points.map(p => p.y).filter(y => isFinite(y));
        
        if (xs.length === 0 || ys.length === 0) {
          return { index, error: 'No valid coordinates' };
        }
        
        return {
          index,
          centerX: piece.x,
          centerY: piece.y,
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
          pointsCount: piece.points.length
        };
      })
    };
  });

  console.log('📊 散开后状态:');
  console.log('游戏状态:', {
    canvasWidth: beforeResize.canvasWidth,
    canvasHeight: beforeResize.canvasHeight,
    canvasSize: beforeResize.canvasSize,
    scatterCanvasSize: beforeResize.scatterCanvasSize,
    puzzleCount: beforeResize.puzzleCount
  });
  console.log('DOM画布信息:', beforeResize.canvasElement);
  console.log('拼图块边界 (前3个):', beforeResize.puzzleBounds.slice(0, 3));

  // 4. 触发窗口大小变化
  console.log('🔄 触发窗口大小变化...');
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(3000);

  // 5. 获取变化后的状态
  const afterResize = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const canvas = document.querySelector('canvas#puzzle-canvas');
    
    return {
      // 游戏状态
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      canvasSize: state.canvasSize,
      scatterCanvasSize: state.scatterCanvasSize,
      puzzleCount: state.puzzle.length,
      
      // DOM画布信息
      canvasElement: {
        width: canvas ? canvas.width : null,
        height: canvas ? canvas.height : null,
        clientWidth: canvas ? canvas.clientWidth : null,
        clientHeight: canvas ? canvas.clientHeight : null,
        offsetWidth: canvas ? canvas.offsetWidth : null,
        offsetHeight: canvas ? canvas.offsetHeight : null
      },
      
      // 拼图块位置信息
      puzzleBounds: state.puzzle.map((piece, index) => {
        if (!piece.points || piece.points.length === 0) {
          return { index, error: 'No points' };
        }
        
        const xs = piece.points.map(p => p.x).filter(x => isFinite(x));
        const ys = piece.points.map(p => p.y).filter(y => isFinite(y));
        
        if (xs.length === 0 || ys.length === 0) {
          return { index, error: 'No valid coordinates' };
        }
        
        return {
          index,
          centerX: piece.x,
          centerY: piece.y,
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
          pointsCount: piece.points.length,
          // 检查是否在画布内
          isVisible: Math.max(...xs) >= 0 && Math.min(...xs) <= (canvas ? canvas.width : 1000) &&
                    Math.max(...ys) >= 0 && Math.min(...ys) <= (canvas ? canvas.height : 1000)
        };
      })
    };
  });

  console.log('📊 窗口变化后状态:');
  console.log('游戏状态:', {
    canvasWidth: afterResize.canvasWidth,
    canvasHeight: afterResize.canvasHeight,
    canvasSize: afterResize.canvasSize,
    scatterCanvasSize: afterResize.scatterCanvasSize,
    puzzleCount: afterResize.puzzleCount
  });
  console.log('DOM画布信息:', afterResize.canvasElement);
  console.log('拼图块边界 (前3个):', afterResize.puzzleBounds.slice(0, 3));

  // 6. 分析可见性问题
  const visiblePieces = afterResize.puzzleBounds.filter(piece => piece.isVisible);
  const invisiblePieces = afterResize.puzzleBounds.filter(piece => !piece.isVisible);

  console.log('\n🔍 可见性分析:');
  console.log(`可见拼图块: ${visiblePieces.length}/${afterResize.puzzleCount}`);
  console.log(`不可见拼图块: ${invisiblePieces.length}/${afterResize.puzzleCount}`);

  if (invisiblePieces.length > 0) {
    console.log('❌ 发现不可见的拼图块:');
    invisiblePieces.slice(0, 3).forEach(piece => {
      console.log(`  拼图块${piece.index}: 中心(${piece.centerX?.toFixed(1)}, ${piece.centerY?.toFixed(1)}), 边界(${piece.minX?.toFixed(1)}, ${piece.minY?.toFixed(1)}) - (${piece.maxX?.toFixed(1)}, ${piece.maxY?.toFixed(1)})`);
    });
  }

  // 7. 检查画布尺寸一致性
  console.log('\n🔍 画布尺寸一致性检查:');
  console.log(`游戏状态中的画布尺寸: ${afterResize.canvasWidth}x${afterResize.canvasHeight}`);
  console.log(`DOM画布实际尺寸: ${afterResize.canvasElement.width}x${afterResize.canvasElement.height}`);
  console.log(`DOM画布显示尺寸: ${afterResize.canvasElement.clientWidth}x${afterResize.canvasElement.clientHeight}`);

  const sizeConsistent = afterResize.canvasWidth === afterResize.canvasElement.width && 
                        afterResize.canvasHeight === afterResize.canvasElement.height;
  
  if (!sizeConsistent) {
    console.log('⚠️ 画布尺寸不一致！这可能导致拼图块位置计算错误');
  }

  // 8. 截图保存当前状态
  await page.screenshot({ 
    path: 'test-results/puzzle-visibility-issue.png', 
    fullPage: true 
  });

  console.log('📸 已保存截图到 test-results/puzzle-visibility-issue.png');
});