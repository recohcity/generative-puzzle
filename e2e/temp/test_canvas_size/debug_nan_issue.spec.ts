/**
 * 专门调试NaN问题的测试
 */

import { test, expect, Page } from '@playwright/test';

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page, initialWidth = 1366, initialHeight = 768) {
  await page.setViewportSize({ width: initialWidth, height: initialHeight });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('canvas#puzzle-canvas');
}

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 辅助函数：获取拼图块详细信息
async function getPuzzleDetails(page: Page) {
  return page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state.puzzle) return { puzzle: [], error: 'No puzzle data' };
    
    return {
      puzzle: state.puzzle.map((piece: any, index: number) => {
        // 检查拼图块的基本信息
        const info = {
          index,
          centerX: piece.x,
          centerY: piece.y,
          pointsCount: piece.points ? piece.points.length : 0,
          hasValidPoints: false,
          firstFewPoints: [],
          invalidPoints: []
        };
        
        // 检查前几个点的详细信息
        if (piece.points && Array.isArray(piece.points)) {
          info.firstFewPoints = piece.points.slice(0, 3).map((point: any, i: number) => ({
            index: i,
            x: point.x,
            y: point.y,
            isValid: typeof point.x === 'number' && typeof point.y === 'number' && 
                     isFinite(point.x) && isFinite(point.y)
          }));
          
          // 检查是否有无效点
          piece.points.forEach((point: any, i: number) => {
            if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || 
                !isFinite(point.x) || !isFinite(point.y)) {
              info.invalidPoints.push({ index: i, point });
            }
          });
          
          info.hasValidPoints = info.invalidPoints.length === 0 && piece.points.length > 0;
        }
        
        return info;
      }),
      canvasSize: {
        width: state.canvasWidth,
        height: state.canvasHeight
      },
      scatterCanvasSize: state.scatterCanvasSize
    };
  });
}

test('调试拼图块坐标变成NaN的问题', async ({ page }) => {
  // 1. 导航到页面
  await gotoAndEnsureCanvas(page);
  await waitForTip(page, '请点击生成你喜欢的形状');
  
  // 2. 生成形状
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await waitForTip(page, '请选择切割类型');
  
  // 3. 生成拼图
  await page.getByText('斜线').click();
  await waitForTip(page, '请切割形状');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  await waitForTip(page, '请散开拼图，开始游戏');
  
  // 4. 散开拼图
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  // 等待拼图散开
  await page.waitForFunction(() => {
    const state = (window as any).__gameStateForTests__;
    return state && state.isScattered === true;
  });
  
  // 5. 记录窗口调整前的拼图块详细信息
  const beforeDetails = await getPuzzleDetails(page);
  console.log('窗口调整前的拼图块详细信息:');
  console.log(`画布尺寸: ${beforeDetails.canvasSize.width}x${beforeDetails.canvasSize.height}`);
  console.log(`散开画布尺寸:`, beforeDetails.scatterCanvasSize);
  
  beforeDetails.puzzle.forEach(piece => {
    console.log(`拼图块${piece.index}: 中心(${piece.centerX}, ${piece.centerY}), 点数=${piece.pointsCount}, 有效=${piece.hasValidPoints}`);
    if (piece.firstFewPoints.length > 0) {
      console.log(`  前3个点:`, piece.firstFewPoints);
    }
    if (piece.invalidPoints.length > 0) {
      console.log(`  ⚠️ 无效点:`, piece.invalidPoints);
    }
  });
  
  // 6. 改变浏览器窗口大小
  console.log('\n开始改变窗口大小...');
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(2000); // 等待调整完成
  
  // 7. 记录窗口调整后的拼图块详细信息
  const afterDetails = await getPuzzleDetails(page);
  console.log('\n窗口调整后的拼图块详细信息:');
  console.log(`画布尺寸: ${afterDetails.canvasSize.width}x${afterDetails.canvasSize.height}`);
  console.log(`散开画布尺寸:`, afterDetails.scatterCanvasSize);
  
  afterDetails.puzzle.forEach(piece => {
    console.log(`拼图块${piece.index}: 中心(${piece.centerX}, ${piece.centerY}), 点数=${piece.pointsCount}, 有效=${piece.hasValidPoints}`);
    if (piece.firstFewPoints.length > 0) {
      console.log(`  前3个点:`, piece.firstFewPoints);
    }
    if (piece.invalidPoints.length > 0) {
      console.log(`  ⚠️ 无效点:`, piece.invalidPoints);
    }
  });
  
  // 8. 分析问题
  const hasNaNIssue = afterDetails.puzzle.some(piece => !piece.hasValidPoints);
  
  if (hasNaNIssue) {
    console.log('\n❌ 发现NaN问题！');
    const problemPieces = afterDetails.puzzle.filter(piece => !piece.hasValidPoints);
    console.log(`问题拼图块数量: ${problemPieces.length}/${afterDetails.puzzle.length}`);
    
    problemPieces.forEach(piece => {
      console.log(`拼图块${piece.index}的问题:`, {
        中心坐标: `(${piece.centerX}, ${piece.centerY})`,
        点数: piece.pointsCount,
        无效点数量: piece.invalidPoints.length
      });
    });
  } else {
    console.log('\n✅ 没有发现NaN问题');
  }
  
  // 验证基本功能
  expect(afterDetails.puzzle.length).toBe(beforeDetails.puzzle.length);
  console.log(`拼图块数量保持不变: ${afterDetails.puzzle.length}`);
});