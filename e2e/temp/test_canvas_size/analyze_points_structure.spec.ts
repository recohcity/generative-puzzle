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

test('分析拼图块points数据结构', async ({ page }) => {
  console.log('🔍 开始分析拼图块points数据结构...');

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

  // 3. 详细分析第一个拼图块的points结构
  const detailedAnalysis = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state || !state.puzzle || state.puzzle.length === 0) {
      return { error: 'No puzzle data' };
    }

    const firstPiece = state.puzzle[0];
    
    return {
      pieceInfo: {
        x: firstPiece.x,
        y: firstPiece.y,
        rotation: firstPiece.rotation,
        pointsLength: firstPiece.points ? firstPiece.points.length : 0,
        pointsType: typeof firstPiece.points,
        pointsIsArray: Array.isArray(firstPiece.points)
      },
      firstFewPoints: firstPiece.points ? firstPiece.points.slice(0, 5).map((point, index) => ({
        index,
        point: point,
        pointType: typeof point,
        pointConstructor: point ? point.constructor.name : 'null',
        pointKeys: point && typeof point === 'object' ? Object.keys(point) : [],
        pointValues: point && typeof point === 'object' ? Object.values(point) : [],
        isPoint: point && typeof point === 'object' && 'x' in point && 'y' in point,
        xValue: point && typeof point === 'object' && 'x' in point ? point.x : 'N/A',
        yValue: point && typeof point === 'object' && 'y' in point ? point.y : 'N/A',
        xType: point && typeof point === 'object' && 'x' in point ? typeof point.x : 'N/A',
        yType: point && typeof point === 'object' && 'y' in point ? typeof point.y : 'N/A'
      })) : [],
      allPiecesPointsStructure: state.puzzle.slice(0, 3).map((piece, pieceIndex) => ({
        pieceIndex,
        pointsCount: piece.points ? piece.points.length : 0,
        firstPointStructure: piece.points && piece.points[0] ? {
          type: typeof piece.points[0],
          constructor: piece.points[0].constructor.name,
          keys: Object.keys(piece.points[0]),
          hasXY: 'x' in piece.points[0] && 'y' in piece.points[0],
          x: piece.points[0].x,
          y: piece.points[0].y
        } : null
      }))
    };
  });

  console.log('📊 详细的points结构分析:');
  console.log(JSON.stringify(detailedAnalysis, null, 2));

  // 4. 检查是否是Point对象而不是普通数值
  const pointObjectAnalysis = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const firstPiece = state.puzzle[0];
    const firstPoint = firstPiece.points[0];
    
    return {
      pointString: String(firstPoint),
      pointJSON: JSON.stringify(firstPoint),
      pointToString: firstPoint.toString(),
      pointValueOf: firstPoint.valueOf(),
      isNaNCheck: isNaN(firstPoint),
      numberConversion: Number(firstPoint),
      pointPrototype: Object.getPrototypeOf(firstPoint),
      pointOwnProperties: Object.getOwnPropertyNames(firstPoint)
    };
  });

  console.log('🔬 Point对象深度分析:');
  console.log(JSON.stringify(pointObjectAnalysis, null, 2));

  // 5. 尝试修复 - 检查如何正确访问坐标值
  const coordinateAccess = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const firstPiece = state.puzzle[0];
    const firstPoint = firstPiece.points[0];
    
    // 尝试不同的方式访问坐标
    return {
      directX: firstPoint.x,
      directY: firstPoint.y,
      bracketX: firstPoint['x'],
      bracketY: firstPoint['y'],
      getX: typeof firstPoint.getX === 'function' ? firstPoint.getX() : 'no getX method',
      getY: typeof firstPoint.getY === 'function' ? firstPoint.getY() : 'no getY method',
      // 检查是否有其他属性名
      allProperties: Object.getOwnPropertyDescriptors(firstPoint),
      // 检查原型链上的方法
      prototypeMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(firstPoint))
    };
  });

  console.log('🎯 坐标访问方式分析:');
  console.log(JSON.stringify(coordinateAccess, null, 2));
});