import { test, expect } from '@playwright/test';

test('完整的NaN问题测试流程', async ({ page }) => {
  // 监听所有console输出
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000');
  
  // 等待游戏完全加载
  await page.waitForTimeout(2000);
  
  // 注入NaN追踪代码
  await page.evaluate(() => {
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
  });
  
  console.log('🎮 开始生成拼图...');
  
  // 点击生成拼图按钮
  await page.click('button:has-text("生成拼图")');
  
  // 等待拼图生成完成
  await page.waitForTimeout(3000);
  
  // 检查拼图是否生成成功
  const initialPuzzleState = await page.evaluate(() => {
    const pieces = window.gameInstance?.puzzlePieces || [];
    console.log(`🧩 生成了 ${pieces.length} 个拼图块`);
    
    return pieces.map((piece, index) => ({
      index,
      x: piece.x,
      y: piece.y,
      points: piece.points ? piece.points.slice(0, 4) : null,
      hasNaN: isNaN(piece.x) || isNaN(piece.y) || (piece.points && piece.points.some(p => isNaN(p)))
    }));
  });
  
  console.log('📊 初始拼图块状态:', JSON.stringify(initialPuzzleState.slice(0, 3), null, 2)); // 只显示前3个
  
  // 检查初始状态是否有NaN
  const initialNaNCount = initialPuzzleState.filter(piece => piece.hasNaN).length;
  console.log(`🔍 初始状态NaN数量: ${initialNaNCount}`);
  
  if (initialNaNCount > 0) {
    console.log('⚠️ 初始状态就存在NaN问题！');
    return;
  }
  
  console.log('🔄 开始窗口大小变化测试...');
  
  // 触发窗口大小变化
  await page.setViewportSize({ width: 1000, height: 700 });
  
  // 等待适配完成
  await page.waitForTimeout(2000);
  
  // 检查变化后的状态
  const afterResizeState = await page.evaluate(() => {
    const pieces = window.gameInstance?.puzzlePieces || [];
    console.log(`🔄 窗口变化后仍有 ${pieces.length} 个拼图块`);
    
    return pieces.map((piece, index) => ({
      index,
      x: piece.x,
      y: piece.y,
      points: piece.points ? piece.points.slice(0, 4) : null,
      hasNaN: isNaN(piece.x) || isNaN(piece.y) || (piece.points && piece.points.some(p => isNaN(p)))
    }));
  });
  
  console.log('📊 窗口变化后拼图块状态:', JSON.stringify(afterResizeState.slice(0, 3), null, 2)); // 只显示前3个
  
  // 分析NaN问题
  const afterResizeNaNCount = afterResizeState.filter(piece => piece.hasNaN).length;
  console.log(`🔍 窗口变化后NaN数量: ${afterResizeNaNCount}`);
  
  if (afterResizeNaNCount > 0) {
    console.log('🚨 发现NaN问题！');
    
    // 详细分析前几个有NaN的拼图块
    const nanPieces = afterResizeState.filter(piece => piece.hasNaN).slice(0, 3);
    nanPieces.forEach(piece => {
      console.log(`\n🔍 拼图块 ${piece.index} 的NaN分析:`);
      console.log(`  - x坐标: ${piece.x} (isNaN: ${isNaN(piece.x)})`);
      console.log(`  - y坐标: ${piece.y} (isNaN: ${isNaN(piece.y)})`);
      if (piece.points) {
        piece.points.forEach((point, i) => {
          console.log(`  - points[${i}]: ${point} (isNaN: ${isNaN(point)})`);
        });
      }
    });
  }
  
  // 检查适配引擎状态
  const adaptationEngineState = await page.evaluate(() => {
    if (window.gameInstance && window.gameInstance.unifiedAdaptationEngine) {
      const engine = window.gameInstance.unifiedAdaptationEngine;
      return {
        canvasWidth: engine.canvasWidth,
        canvasHeight: engine.canvasHeight,
        scaleX: engine.scaleX,
        scaleY: engine.scaleY,
        offsetX: engine.offsetX,
        offsetY: engine.offsetY,
        hasNaN: isNaN(engine.scaleX) || isNaN(engine.scaleY) || isNaN(engine.offsetX) || isNaN(engine.offsetY)
      };
    }
    return null;
  });
  
  console.log('🔧 适配引擎状态:', JSON.stringify(adaptationEngineState, null, 2));
  
  if (adaptationEngineState && adaptationEngineState.hasNaN) {
    console.log('🚨 适配引擎本身存在NaN值！');
  }
  
  // 检查潜在的除以零情况
  if (adaptationEngineState) {
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
  
  // 最后再次检查拼图块数量是否一致
  console.log(`\n📈 拼图块数量对比:`);
  console.log(`  - 初始: ${initialPuzzleState.length}`);
  console.log(`  - 变化后: ${afterResizeState.length}`);
  console.log(`  - 数量是否一致: ${initialPuzzleState.length === afterResizeState.length}`);
});