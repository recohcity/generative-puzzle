import { test, expect, Page } from '@playwright/test';

test.setTimeout(120000); // 增加超时时间

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
    try {
      const state = await page.evaluate(() => (window as any).__gameStateForTests__);
      console.log('[robustWaitForFunction] retry after fail, state snapshot:', state);
    } catch (err) {
      console.log('[robustWaitForFunction] retry after fail, but page is closed.');
    }
    await page.waitForFunction(fn, null, { timeout });
  }
}

test('完整流程中的NaN问题追踪', async ({ page }) => {
  console.log('🎮 开始完整流程的NaN问题追踪测试...');

  // 注入NaN追踪代码
  await page.addInitScript(() => {
    // 包装Math函数来追踪NaN
    const originalMath = {
      sqrt: Math.sqrt,
      pow: Math.pow,
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round
    };
    
    function wrapMathFunction(name, originalFunc) {
      Math[name] = function(...args) {
        const result = originalFunc.apply(Math, args);
        if (isNaN(result)) {
          console.error(`🚨 Math.${name} 产生了 NaN!`, {
            args: args,
            result: result,
            stack: new Error().stack.split('\n').slice(0, 5)
          });
        }
        return result;
      };
    }
    
    Object.keys(originalMath).forEach(name => {
      wrapMathFunction(name, originalMath[name]);
    });
    
    // 监控除法运算
    window.safeDivide = function(a, b, context = 'unknown') {
      if (b === 0) {
        console.error(`🚨 除以零错误! ${a} / ${b} in ${context}`);
        return 0;
      }
      const result = a / b;
      if (isNaN(result)) {
        console.error(`🚨 除法产生NaN! ${a} / ${b} = ${result} in ${context}`);
      }
      return result;
    };
    
    // 监控坐标设置
    window.nanTracker = {
      coordinateChanges: [],
      trackCoordinate: function(obj, prop, value, context) {
        if (isNaN(value) && typeof value === 'number') {
          const change = {
            timestamp: Date.now(),
            context: context,
            property: prop,
            value: value,
            stack: new Error().stack.split('\n').slice(0, 10)
          };
          this.coordinateChanges.push(change);
          console.error(`🚨 坐标设置为NaN!`, change);
        }
        return value;
      }
    };
  });

  await gotoAndEnsureCanvas(page);

  // 1. 形状生成
  console.log('步骤 1: 生成云朵形状...');
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await waitForTip(page, '请选择切割类型');

  // 2. 拼图生成
  console.log('步骤 2: 选择切割类型和生成拼图...');
  await page.getByText('斜线').click();
  await waitForTip(page, '请切割形状');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  await waitForTip(page, '请散开拼图，开始游戏');

  // 3. 散开拼图
  console.log('步骤 3: 散开拼图...');
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  await robustWaitForFunction(page, () => {
    const state = (window as any).__gameStateForTests__;
    return state && state.puzzle !== undefined;
  }, 30000);
  
  await robustWaitForFunction(page, () => {
    const state = (window as any).__gameStateForTests__;
    return Array.isArray(state.puzzle) && state.puzzle.length > 0
      && Array.isArray(state.originalPositions) && state.originalPositions.length > 0;
  }, 30000);

  const puzzle = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle);
  await waitForTip(page, `0 / ${puzzle.length} 块拼图已完成`);

  console.log(`✅ 拼图已生成并散开，共 ${puzzle.length} 块`);

  // 4. 获取散开后的初始状态
  const initialPuzzleState = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state || !state.puzzle) return null;
    
    return state.puzzle.map((piece, index) => ({
      index,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
      points: piece.points ? piece.points.slice(0, 4) : null,
      hasNaN: isNaN(piece.x) || isNaN(piece.y) || isNaN(piece.rotation) || 
              (piece.points && piece.points.some(p => isNaN(p.x) || isNaN(p.y)))
    }));
  });

  console.log('📊 初始拼图状态分析:');
  const initialNaNCount = initialPuzzleState?.filter(piece => piece.hasNaN).length || 0;
  console.log(`  - 总拼图块数: ${initialPuzzleState?.length || 0}`);
  console.log(`  - 初始NaN数量: ${initialNaNCount}`);

  if (initialNaNCount > 0) {
    console.log('⚠️ 初始状态就存在NaN问题！');
    const nanPieces = initialPuzzleState?.filter(piece => piece.hasNaN).slice(0, 3);
    nanPieces?.forEach(piece => {
      console.log(`  拼图块${piece.index}: x=${piece.x}, y=${piece.y}, rotation=${piece.rotation}`);
    });
  }

  // 5. 触发窗口大小变化 - 这是关键步骤
  console.log('🔄 开始窗口大小变化测试...');
  
  // 记录变化前的状态
  const beforeResizeState = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    return {
      canvasSize: state.canvasSize,
      scatterCanvasSize: state.scatterCanvasSize,
      puzzleCount: state.puzzle ? state.puzzle.length : 0
    };
  });
  
  console.log('变化前状态:', beforeResizeState);

  // 执行窗口大小变化
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(3000);

  // 6. 检查变化后的状态
  const afterResizeState = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state || !state.puzzle) return null;
    
    return {
      canvasSize: state.canvasSize,
      scatterCanvasSize: state.scatterCanvasSize,
      puzzleCount: state.puzzle.length,
      puzzle: state.puzzle.map((piece, index) => ({
        index,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation,
        points: piece.points ? piece.points.slice(0, 4) : null,
        hasNaN: isNaN(piece.x) || isNaN(piece.y) || isNaN(piece.rotation) || 
                (piece.points && piece.points.some(p => isNaN(p.x) || isNaN(p.y)))
      }))
    };
  });

  console.log('📊 窗口变化后状态分析:');
  console.log('变化后状态:', {
    canvasSize: afterResizeState?.canvasSize,
    scatterCanvasSize: afterResizeState?.scatterCanvasSize,
    puzzleCount: afterResizeState?.puzzleCount
  });

  const afterNaNCount = afterResizeState?.puzzle?.filter(piece => piece.hasNaN).length || 0;
  console.log(`  - 变化后NaN数量: ${afterNaNCount}`);

  if (afterNaNCount > 0) {
    console.log('🚨 发现NaN问题！');
    
    // 详细分析前几个有NaN的拼图块
    const nanPieces = afterResizeState?.puzzle?.filter(piece => piece.hasNaN).slice(0, 5);
    nanPieces?.forEach(piece => {
      console.log(`\n🔍 拼图块 ${piece.index} 的NaN分析:`);
      console.log(`  - x坐标: ${piece.x} (isNaN: ${isNaN(piece.x)})`);
      console.log(`  - y坐标: ${piece.y} (isNaN: ${isNaN(piece.y)})`);
      console.log(`  - rotation: ${piece.rotation} (isNaN: ${isNaN(piece.rotation)})`);
      if (piece.points) {
        piece.points.forEach((point, i) => {
          console.log(`  - points[${i}]: ${point} (isNaN: ${isNaN(point)})`);
        });
      }
    });

    // 获取NaN追踪信息
    const nanTrackerData = await page.evaluate(() => {
      return window.nanTracker ? window.nanTracker.coordinateChanges : [];
    });

    if (nanTrackerData.length > 0) {
      console.log('\n📋 NaN追踪记录:');
      nanTrackerData.slice(-5).forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.context} - ${change.property} = ${change.value}`);
        console.log(`     时间: ${new Date(change.timestamp).toISOString()}`);
        console.log(`     调用栈: ${change.stack.slice(0, 3).join(' -> ')}`);
      });
    }
  }

  // 7. 检查适配引擎状态
  const adaptationEngineState = await page.evaluate(() => {
    // 尝试从多个可能的位置获取适配引擎状态
    const gameState = (window as any).__gameStateForTests__;
    const unifiedEngine = (window as any).unifiedAdaptationEngine;
    
    if (unifiedEngine) {
      return {
        source: 'unifiedAdaptationEngine',
        canvasWidth: unifiedEngine.canvasWidth,
        canvasHeight: unifiedEngine.canvasHeight,
        scaleX: unifiedEngine.scaleX,
        scaleY: unifiedEngine.scaleY,
        offsetX: unifiedEngine.offsetX,
        offsetY: unifiedEngine.offsetY,
        hasNaN: isNaN(unifiedEngine.scaleX) || isNaN(unifiedEngine.scaleY) || 
                isNaN(unifiedEngine.offsetX) || isNaN(unifiedEngine.offsetY)
      };
    }
    
    return { source: 'not_found', error: 'Adaptation engine not found' };
  });

  console.log('🔧 适配引擎状态:', JSON.stringify(adaptationEngineState, null, 2));

  if (adaptationEngineState.hasNaN) {
    console.log('🚨 适配引擎本身存在NaN值！');
  }

  // 8. 检查潜在的除以零情况
  if (adaptationEngineState.source === 'unifiedAdaptationEngine') {
    const { canvasWidth, canvasHeight, scaleX, scaleY } = adaptationEngineState;
    console.log('\n🔍 检查潜在问题:');
    console.log(`  - canvasWidth: ${canvasWidth} (是否为0: ${canvasWidth === 0})`);
    console.log(`  - canvasHeight: ${canvasHeight} (是否为0: ${canvasHeight === 0})`);
    console.log(`  - scaleX: ${scaleX} (isNaN: ${isNaN(scaleX)})`);
    console.log(`  - scaleY: ${scaleY} (isNaN: ${isNaN(scaleY)})`);
    
    if (canvasWidth === 0 || canvasHeight === 0) {
      console.log('🚨 发现画布尺寸为0，这可能导致除以零错误！');
    }
  }

  // 9. 再次触发窗口变化来观察问题是否持续
  console.log('\n🔄 第二次窗口大小变化测试...');
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(2000);

  const secondResizeState = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state || !state.puzzle) return null;
    
    const nanCount = state.puzzle.filter(piece => 
      isNaN(piece.x) || isNaN(piece.y) || isNaN(piece.rotation) || 
      (piece.points && piece.points.some(p => isNaN(p.x) || isNaN(p.y)))
    ).length;
    
    return {
      puzzleCount: state.puzzle.length,
      nanCount: nanCount
    };
  });

  console.log(`第二次变化后NaN数量: ${secondResizeState?.nanCount || 0}`);

  // 10. 最终总结
  console.log('\n📈 NaN问题分析总结:');
  console.log(`  - 初始NaN数量: ${initialNaNCount}`);
  console.log(`  - 第一次窗口变化后: ${afterNaNCount}`);
  console.log(`  - 第二次窗口变化后: ${secondResizeState?.nanCount || 0}`);
  console.log(`  - 拼图块数量保持一致: ${initialPuzzleState?.length === afterResizeState?.puzzleCount}`);

  // 如果发现NaN问题，测试应该失败
  if (afterNaNCount > 0 || (secondResizeState?.nanCount || 0) > 0) {
    throw new Error(`发现NaN坐标问题！第一次变化后: ${afterNaNCount}个, 第二次变化后: ${secondResizeState?.nanCount || 0}个`);
  }

  console.log('✅ 完整流程测试完成，未发现NaN问题');
});