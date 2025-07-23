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

test('调试窗口变化后的points结构', async ({ page }) => {
  console.log('🔍 开始调试窗口变化后的points结构...');

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

  // 3. 获取窗口变化前的points结构
  const beforeResize = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const firstPiece = state.puzzle[0];
    
    return {
      pieceX: firstPiece.x,
      pieceY: firstPiece.y,
      pointsLength: firstPiece.points.length,
      firstPoint: {
        raw: firstPiece.points[0],
        x: firstPiece.points[0].x,
        y: firstPiece.points[0].y,
        isOriginal: firstPiece.points[0].isOriginal,
        xIsNaN: isNaN(firstPiece.points[0].x),
        yIsNaN: isNaN(firstPiece.points[0].y),
        objectIsNaN: isNaN(firstPiece.points[0])
      }
    };
  });

  console.log('📊 窗口变化前的points结构:');
  console.log(JSON.stringify(beforeResize, null, 2));

  // 4. 触发窗口大小变化
  console.log('🔄 触发窗口大小变化...');
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(3000);

  // 5. 获取窗口变化后的points结构
  const afterResize = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const firstPiece = state.puzzle[0];
    
    return {
      pieceX: firstPiece.x,
      pieceY: firstPiece.y,
      pointsLength: firstPiece.points.length,
      firstPoint: {
        raw: firstPiece.points[0],
        x: firstPiece.points[0].x,
        y: firstPiece.points[0].y,
        isOriginal: firstPiece.points[0].isOriginal,
        xIsNaN: isNaN(firstPiece.points[0].x),
        yIsNaN: isNaN(firstPiece.points[0].y),
        objectIsNaN: isNaN(firstPiece.points[0]),
        xType: typeof firstPiece.points[0].x,
        yType: typeof firstPiece.points[0].y,
        xIsFinite: isFinite(firstPiece.points[0].x),
        yIsFinite: isFinite(firstPiece.points[0].y)
      },
      // 检查所有点
      allPointsValid: firstPiece.points.every(p => 
        typeof p.x === 'number' && typeof p.y === 'number' && 
        isFinite(p.x) && isFinite(p.y)
      ),
      invalidPointsCount: firstPiece.points.filter(p => 
        isNaN(p.x) || isNaN(p.y) || !isFinite(p.x) || !isFinite(p.y)
      ).length
    };
  });

  console.log('📊 窗口变化后的points结构:');
  console.log(JSON.stringify(afterResize, null, 2));

  // 6. 比较变化
  console.log('\n🔍 变化对比:');
  console.log(`拼图块X坐标变化: ${beforeResize.pieceX} -> ${afterResize.pieceX}`);
  console.log(`拼图块Y坐标变化: ${beforeResize.pieceY} -> ${afterResize.pieceY}`);
  console.log(`第一个点X坐标变化: ${beforeResize.firstPoint.x} -> ${afterResize.firstPoint.x}`);
  console.log(`第一个点Y坐标变化: ${beforeResize.firstPoint.y} -> ${afterResize.firstPoint.y}`);
  console.log(`第一个点X类型变化: ${typeof beforeResize.firstPoint.x} -> ${afterResize.firstPoint.xType}`);
  console.log(`第一个点Y类型变化: ${typeof beforeResize.firstPoint.y} -> ${afterResize.firstPoint.yType}`);
  console.log(`所有点是否有效: 变化前=true -> 变化后=${afterResize.allPointsValid}`);
  console.log(`无效点数量: 变化后=${afterResize.invalidPointsCount}`);

  // 7. 检查是否有适配引擎被调用
  const adaptationInfo = await page.evaluate(() => {
    // 检查是否有适配相关的全局变量或日志
    return {
      hasUnifiedEngine: typeof window.unifiedAdaptationEngine !== 'undefined',
      hasAdaptationLogs: window.adaptationLogs || [],
      windowSize: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      }
    };
  });

  console.log('\n🔧 适配信息:');
  console.log(JSON.stringify(adaptationInfo, null, 2));

  // 8. 如果发现问题，输出详细的错误信息
  if (!afterResize.allPointsValid) {
    console.log('\n❌ 发现points坐标问题！');
    
    // 获取所有无效点的详细信息
    const invalidPointsDetails = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      const firstPiece = state.puzzle[0];
      
      return firstPiece.points.map((point, index) => ({
        index,
        x: point.x,
        y: point.y,
        xType: typeof point.x,
        yType: typeof point.y,
        xIsNaN: isNaN(point.x),
        yIsNaN: isNaN(point.y),
        xIsFinite: isFinite(point.x),
        yIsFinite: isFinite(point.y),
        isValid: typeof point.x === 'number' && typeof point.y === 'number' && 
                 isFinite(point.x) && isFinite(point.y)
      })).filter(p => !p.isValid);
    });

    console.log('无效点详情:', JSON.stringify(invalidPointsDetails, null, 2));
  } else {
    console.log('\n✅ 所有points坐标都是有效的！');
  }
});