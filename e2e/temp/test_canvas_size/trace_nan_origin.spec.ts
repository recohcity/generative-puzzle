import { test, expect } from '@playwright/test';

test('深度追踪NaN产生的具体原因', async ({ page }) => {
  // 监听所有console输出
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000');
  
  // 等待游戏完全加载
  await page.waitForTimeout(2000);
  
  // 注入详细的调试代码
  await page.evaluate(() => {
    // 重写Math相关函数来追踪NaN的产生
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
            stack: new Error().stack
          });
        }
        return result;
      };
    }
    
    // 包装所有Math函数
    Object.keys(originalMath).forEach(name => {
      wrapMathFunction(name, originalMath[name]);
    });
    
    // 重写除法运算符（通过包装可能的除法函数）
    window.safeDivide = function(a, b, context = 'unknown') {
      console.log(`🔍 除法运算: ${a} / ${b} (${context})`);
      if (b === 0) {
        console.error(`🚨 除以零错误! ${a} / ${b} in ${context}`);
        return 0; // 或其他安全值
      }
      const result = a / b;
      if (isNaN(result)) {
        console.error(`🚨 除法产生NaN! ${a} / ${b} = ${result} in ${context}`);
      }
      return result;
    };
    
    // 监控对象属性的设置
    function monitorObjectProperties(obj, objName) {
      return new Proxy(obj, {
        set(target, property, value) {
          if (isNaN(value) && typeof value === 'number') {
            console.error(`🚨 ${objName}.${property} 被设置为 NaN!`, {
              value: value,
              stack: new Error().stack
            });
          }
          target[property] = value;
          return true;
        }
      });
    }
    
    // 如果能访问到拼图块对象，监控它们
    if (window.gameInstance && window.gameInstance.puzzlePieces) {
      window.gameInstance.puzzlePieces = window.gameInstance.puzzlePieces.map((piece, index) => {
        return monitorObjectProperties(piece, `puzzlePiece[${index}]`);
      });
    }
  });
  
  // 获取初始状态
  const initialState = await page.evaluate(() => {
    const pieces = window.gameInstance?.puzzlePieces || [];
    return pieces.map((piece, index) => ({
      index,
      x: piece.x,
      y: piece.y,
      points: piece.points ? piece.points.slice(0, 4) : null // 只取前4个点
    }));
  });
  
  console.log('📊 初始拼图块状态:', JSON.stringify(initialState, null, 2));
  
  // 触发窗口大小变化
  console.log('🔄 开始窗口大小变化...');
  await page.setViewportSize({ width: 1000, height: 700 });
  
  // 等待适配完成
  await page.waitForTimeout(1000);
  
  // 检查变化后的状态
  const afterResizeState = await page.evaluate(() => {
    const pieces = window.gameInstance?.puzzlePieces || [];
    return pieces.map((piece, index) => ({
      index,
      x: piece.x,
      y: piece.y,
      points: piece.points ? piece.points.slice(0, 4) : null,
      hasNaN: isNaN(piece.x) || isNaN(piece.y) || (piece.points && piece.points.some(p => isNaN(p)))
    }));
  });
  
  console.log('📊 窗口变化后拼图块状态:', JSON.stringify(afterResizeState, null, 2));
  
  // 分析NaN的具体位置
  const nanAnalysis = afterResizeState.filter(piece => piece.hasNaN);
  if (nanAnalysis.length > 0) {
    console.log('🚨 发现NaN的拼图块:', JSON.stringify(nanAnalysis, null, 2));
    
    // 进一步分析每个有NaN的拼图块
    for (const piece of nanAnalysis) {
      console.log(`\n🔍 分析拼图块 ${piece.index}:`);
      console.log(`  - x坐标: ${piece.x} (isNaN: ${isNaN(piece.x)})`);
      console.log(`  - y坐标: ${piece.y} (isNaN: ${isNaN(piece.y)})`);
      if (piece.points) {
        piece.points.forEach((point, i) => {
          console.log(`  - points[${i}]: ${point} (isNaN: ${isNaN(point)})`);
        });
      }
    }
  }
  
  // 检查适配引擎的状态
  const adaptationEngineState = await page.evaluate(() => {
    if (window.gameInstance && window.gameInstance.unifiedAdaptationEngine) {
      const engine = window.gameInstance.unifiedAdaptationEngine;
      return {
        canvasWidth: engine.canvasWidth,
        canvasHeight: engine.canvasHeight,
        scaleX: engine.scaleX,
        scaleY: engine.scaleY,
        offsetX: engine.offsetX,
        offsetY: engine.offsetY
      };
    }
    return null;
  });
  
  console.log('🔧 适配引擎状态:', JSON.stringify(adaptationEngineState, null, 2));
  
  // 检查是否有除以零的情况
  if (adaptationEngineState) {
    const { canvasWidth, canvasHeight, scaleX, scaleY } = adaptationEngineState;
    console.log('\n🔍 检查潜在的除以零情况:');
    console.log(`  - canvasWidth: ${canvasWidth} (是否为0: ${canvasWidth === 0})`);
    console.log(`  - canvasHeight: ${canvasHeight} (是否为0: ${canvasHeight === 0})`);
    console.log(`  - scaleX: ${scaleX} (isNaN: ${isNaN(scaleX)})`);
    console.log(`  - scaleY: ${scaleY} (isNaN: ${isNaN(scaleY)})`);
  }
});