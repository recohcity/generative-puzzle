import { test, expect } from '@playwright/test';

test('深度追踪NaN坐标产生的具体原因', async ({ page }) => {
  // 监听所有console输出
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000');
  
  // 等待游戏完全加载
  await page.waitForTimeout(2000);
  
  // 注入详细的坐标追踪代码
  await page.evaluate(() => {
    // 保存原始的数学运算函数
    const originalMath = {
      divide: (a, b) => {
        const result = a / b;
        if (isNaN(result) || !isFinite(result)) {
          console.error(`[MATH ERROR] Division ${a} / ${b} = ${result}`);
          console.trace('Division error stack trace');
        }
        return result;
      },
      multiply: (a, b) => {
        const result = a * b;
        if (isNaN(result) || !isFinite(result)) {
          console.error(`[MATH ERROR] Multiplication ${a} * ${b} = ${result}`);
          console.trace('Multiplication error stack trace');
        }
        return result;
      },
      subtract: (a, b) => {
        const result = a - b;
        if (isNaN(result) || !isFinite(result)) {
          console.error(`[MATH ERROR] Subtraction ${a} - ${b} = ${result}`);
          console.trace('Subtraction error stack trace');
        }
        return result;
      },
      add: (a, b) => {
        const result = a + b;
        if (isNaN(result) || !isFinite(result)) {
          console.error(`[MATH ERROR] Addition ${a} + ${b} = ${result}`);
          console.trace('Addition error stack trace');
        }
        return result;
      }
    };

    // 重写全局的数学运算以追踪NaN产生
    window.trackedMath = originalMath;
    
    // 监控所有可能的坐标设置
    const originalSetAttribute = SVGElement.prototype.setAttribute;
    SVGElement.prototype.setAttribute = function(name, value) {
      if ((name === 'x' || name === 'y' || name === 'cx' || name === 'cy' || 
           name === 'x1' || name === 'y1' || name === 'x2' || name === 'y2' ||
           name === 'transform' || name === 'd') && 
          (isNaN(parseFloat(value)) || value.includes('NaN'))) {
        console.error(`[NaN COORDINATE] Setting ${name}="${value}" on element:`, this);
        console.trace('NaN coordinate stack trace');
      }
      return originalSetAttribute.call(this, name, value);
    };

    // 监控Canvas坐标设置
    const originalMoveTo = CanvasRenderingContext2D.prototype.moveTo;
    CanvasRenderingContext2D.prototype.moveTo = function(x, y) {
      if (isNaN(x) || isNaN(y)) {
        console.error(`[NaN CANVAS] moveTo(${x}, ${y})`);
        console.trace('Canvas moveTo NaN stack trace');
      }
      return originalMoveTo.call(this, x, y);
    };

    const originalLineTo = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.lineTo = function(x, y) {
      if (isNaN(x) || isNaN(y)) {
        console.error(`[NaN CANVAS] lineTo(${x}, ${y})`);
        console.trace('Canvas lineTo NaN stack trace');
      }
      return originalLineTo.call(this, x, y);
    };

    console.log('[TRACE] NaN追踪系统已激活');
  });

  // 获取初始状态
  const initialState = await page.evaluate(() => {
    const gameInstance = window.gameInstance;
    if (!gameInstance || !gameInstance.puzzlePieces) {
      return { error: 'Game not ready' };
    }

    const pieces = gameInstance.puzzlePieces.map((piece, index) => ({
      index,
      points: piece.points ? piece.points.slice(0, 4) : null,
      x: piece.x,
      y: piece.y,
      centerX: piece.centerX,
      centerY: piece.centerY
    }));

    return {
      canvasWidth: gameInstance.canvas?.width,
      canvasHeight: gameInstance.canvas?.height,
      pieces,
      totalPieces: pieces.length
    };
  });

  console.log('初始状态:', JSON.stringify(initialState, null, 2));

  // 模拟窗口大小变化
  console.log('\n=== 开始窗口大小变化 ===');
  await page.setViewportSize({ width: 1200, height: 900 });
  
  // 等待适配完成
  await page.waitForTimeout(1000);

  // 检查变化后的状态
  const afterResizeState = await page.evaluate(() => {
    const gameInstance = window.gameInstance;
    if (!gameInstance || !gameInstance.puzzlePieces) {
      return { error: 'Game not ready after resize' };
    }

    const pieces = gameInstance.puzzlePieces.map((piece, index) => {
      const hasNaNPoints = piece.points && piece.points.some(p => isNaN(p));
      const hasNaNPosition = isNaN(piece.x) || isNaN(piece.y) || isNaN(piece.centerX) || isNaN(piece.centerY);
      
      return {
        index,
        points: piece.points ? piece.points.slice(0, 4) : null,
        x: piece.x,
        y: piece.y,
        centerX: piece.centerX,
        centerY: piece.centerY,
        hasNaNPoints,
        hasNaNPosition
      };
    });

    const nanPieces = pieces.filter(p => p.hasNaNPoints || p.hasNaNPosition);

    return {
      canvasWidth: gameInstance.canvas?.width,
      canvasHeight: gameInstance.canvas?.height,
      pieces,
      totalPieces: pieces.length,
      nanPieces,
      nanCount: nanPieces.length
    };
  });

  console.log('\n窗口变化后状态:', JSON.stringify(afterResizeState, null, 2));

  // 如果发现NaN，进行更详细的分析
  if (afterResizeState.nanCount > 0) {
    console.log(`\n发现 ${afterResizeState.nanCount} 个拼图块有NaN坐标`);
    
    // 分析适配引擎的状态
    const adaptationAnalysis = await page.evaluate(() => {
      const gameInstance = window.gameInstance;
      const engine = gameInstance.unifiedAdaptationEngine;
      
      if (!engine) {
        return { error: 'Adaptation engine not found' };
      }

      return {
        scaleFactorX: engine.scaleFactorX,
        scaleFactorY: engine.scaleFactorY,
        offsetX: engine.offsetX,
        offsetY: engine.offsetY,
        originalCanvasWidth: engine.originalCanvasWidth,
        originalCanvasHeight: engine.originalCanvasHeight,
        currentCanvasWidth: engine.currentCanvasWidth,
        currentCanvasHeight: engine.currentCanvasHeight,
        hasNaNValues: {
          scaleFactorX: isNaN(engine.scaleFactorX),
          scaleFactorY: isNaN(engine.scaleFactorY),
          offsetX: isNaN(engine.offsetX),
          offsetY: isNaN(engine.offsetY)
        }
      };
    });

    console.log('\n适配引擎状态:', JSON.stringify(adaptationAnalysis, null, 2));

    // 手动触发一次坐标计算来观察过程
    await page.evaluate(() => {
      console.log('\n=== 手动触发坐标计算 ===');
      const gameInstance = window.gameInstance;
      const engine = gameInstance.unifiedAdaptationEngine;
      
      if (engine && gameInstance.puzzlePieces && gameInstance.puzzlePieces.length > 0) {
        const piece = gameInstance.puzzlePieces[0];
        console.log('原始拼图块数据:', {
          x: piece.x,
          y: piece.y,
          points: piece.points ? piece.points.slice(0, 4) : null
        });

        // 模拟适配计算
        if (piece.points && piece.points.length >= 2) {
          const originalX = piece.points[0];
          const originalY = piece.points[1];
          
          console.log('开始坐标转换:');
          console.log('  原始坐标:', originalX, originalY);
          console.log('  缩放因子:', engine.scaleFactorX, engine.scaleFactorY);
          console.log('  偏移量:', engine.offsetX, engine.offsetY);
          
          const scaledX = originalX * engine.scaleFactorX;
          const scaledY = originalY * engine.scaleFactorY;
          console.log('  缩放后:', scaledX, scaledY);
          
          const finalX = scaledX + engine.offsetX;
          const finalY = scaledY + engine.offsetY;
          console.log('  最终坐标:', finalX, finalY);
          
          console.log('  是否为NaN:', isNaN(finalX), isNaN(finalY));
        }
      }
    });
  }

  // 等待更多日志输出
  await page.waitForTimeout(2000);
});