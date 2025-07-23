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

test('测试拼图适配逻辑', async ({ page }) => {
  console.log('🔍 开始测试拼图适配逻辑...');

  // 注入调试代码来监控适配过程
  await page.addInitScript(() => {
    // 监控dispatch调用
    window.originalDispatch = null;
    window.dispatchCalls = [];
    
    // 重写console.log来捕获适配相关日志
    const originalLog = console.log;
    window.adaptationLogs = [];
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('适配') || message.includes('adaptation') || message.includes('UPDATE_ADAPTED')) {
        window.adaptationLogs.push({
          timestamp: Date.now(),
          message: message,
          args: args
        });
      }
      originalLog.apply(console, args);
    };
  });

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
  const beforeAdaptation = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    return {
      canvasSize: { width: state.canvasWidth, height: state.canvasHeight },
      previousCanvasSize: state.previousCanvasSize,
      isScattered: state.isScattered,
      puzzleCount: state.puzzle.length,
      firstPiecePoints: state.puzzle[0].points.slice(0, 3),
      adaptationLogs: window.adaptationLogs || []
    };
  });

  console.log('📊 适配前状态:');
  console.log(JSON.stringify(beforeAdaptation, null, 2));

  // 4. 注入适配逻辑监控
  await page.evaluate(() => {
    // 监控GameContext的dispatch
    const gameContext = document.querySelector('[data-testid="game-context"]');
    if (gameContext && gameContext._reactInternalFiber) {
      // 尝试获取React context
      console.log('找到GameContext元素');
    }
    
    // 监控usePuzzleAdaptation的执行
    window.adaptationExecuted = false;
    window.adaptationDetails = [];
  });

  // 5. 触发窗口大小变化
  console.log('🔄 触发窗口大小变化...');
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(3000);

  // 6. 检查适配后的状态
  const afterAdaptation = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    return {
      canvasSize: { width: state.canvasWidth, height: state.canvasHeight },
      previousCanvasSize: state.previousCanvasSize,
      isScattered: state.isScattered,
      puzzleCount: state.puzzle.length,
      firstPiecePoints: state.puzzle[0].points.slice(0, 3),
      adaptationLogs: window.adaptationLogs || [],
      dispatchCalls: window.dispatchCalls || [],
      adaptationExecuted: window.adaptationExecuted,
      adaptationDetails: window.adaptationDetails || []
    };
  });

  console.log('📊 适配后状态:');
  console.log(JSON.stringify(afterAdaptation, null, 2));

  // 7. 分析适配过程
  console.log('\n🔍 适配过程分析:');
  console.log(`适配前画布尺寸: ${beforeAdaptation.canvasSize.width}x${beforeAdaptation.canvasSize.height}`);
  console.log(`适配后画布尺寸: ${afterAdaptation.canvasSize.width}x${afterAdaptation.canvasSize.height}`);
  console.log(`previousCanvasSize变化: ${JSON.stringify(beforeAdaptation.previousCanvasSize)} -> ${JSON.stringify(afterAdaptation.previousCanvasSize)}`);
  console.log(`isScattered状态: ${beforeAdaptation.isScattered} -> ${afterAdaptation.isScattered}`);
  console.log(`拼图块数量: ${beforeAdaptation.puzzleCount} -> ${afterAdaptation.puzzleCount}`);

  // 8. 检查points的变化
  console.log('\n🔍 Points变化分析:');
  console.log('适配前第一个拼图块的前3个点:');
  beforeAdaptation.firstPiecePoints.forEach((point, index) => {
    console.log(`  点${index}: x=${point.x}, y=${point.y}`);
  });
  
  console.log('适配后第一个拼图块的前3个点:');
  afterAdaptation.firstPiecePoints.forEach((point, index) => {
    console.log(`  点${index}: x=${point.x}, y=${point.y}`);
  });

  // 9. 检查适配日志
  if (afterAdaptation.adaptationLogs.length > 0) {
    console.log('\n📝 适配相关日志:');
    afterAdaptation.adaptationLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.message}`);
    });
  } else {
    console.log('\n⚠️ 没有发现适配相关日志');
  }

  // 10. 检查dispatch调用
  if (afterAdaptation.dispatchCalls.length > 0) {
    console.log('\n📞 Dispatch调用:');
    afterAdaptation.dispatchCalls.forEach((call, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(call)}`);
    });
  } else {
    console.log('\n⚠️ 没有发现dispatch调用');
  }

  // 11. 验证points是否变成null
  const pointsAreNull = afterAdaptation.firstPiecePoints.every(point => 
    point.x === null || point.y === null
  );

  if (pointsAreNull) {
    console.log('\n❌ 确认：适配后points坐标变成了null');
  } else {
    console.log('\n✅ 适配后points坐标正常');
  }

  // 12. 手动测试适配逻辑
  const manualAdaptationTest = await page.evaluate(() => {
    // 模拟usePuzzleAdaptation的逻辑
    const state = (window as any).__gameStateForTests__;
    const canvasSize = { width: 1200, height: 800 };
    const previousCanvasSize = { width: 1920, height: 1080 };
    
    if (!state.puzzle || state.puzzle.length === 0) {
      return { error: 'No puzzle data' };
    }

    const firstPiece = state.puzzle[0];
    
    // 计算中心点
    const calculateCenter = (points) => {
      if (!points || points.length === 0) return { x: 0, y: 0 };
      const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / points.length, y: sum.y / points.length };
    };

    const oldCenter = calculateCenter(firstPiece.points);
    
    const normalizedX = oldCenter.x / previousCanvasSize.width;
    const normalizedY = oldCenter.y / previousCanvasSize.height;

    const newCenterX = normalizedX * canvasSize.width;
    const newCenterY = normalizedY * canvasSize.height;
    
    return {
      originalPoints: firstPiece.points.slice(0, 3),
      oldCenter,
      normalizedX,
      normalizedY,
      newCenterX,
      newCenterY,
      canvasSize,
      previousCanvasSize
    };
  });

  console.log('\n🧪 手动适配逻辑测试:');
  console.log(JSON.stringify(manualAdaptationTest, null, 2));
});