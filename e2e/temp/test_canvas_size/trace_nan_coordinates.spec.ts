import { test, expect } from '@playwright/test';

test('深度追踪NaN坐标产生的具体原因', async ({ page }) => {
  // 注入详细的坐标追踪代码
  await page.addInitScript(() => {
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

    // 追踪所有可能产生NaN的数学运算
    Math.sqrt = function(x) {
      const result = originalMath.sqrt(x);
      if (isNaN(result)) {
        console.log(`[NaN_TRACE] Math.sqrt(${x}) = NaN`);
        console.trace();
      }
      return result;
    };

    // 追踪除法运算
    window.traceDivision = function(a, b, context) {
      const result = a / b;
      if (isNaN(result) || !isFinite(result)) {
        console.log(`[NaN_TRACE] Division: ${a} / ${b} = ${result} in ${context}`);
        console.trace();
      }
      return result;
    };

    // 追踪坐标设置
    window.traceCoordinateSet = function(obj, prop, value, context) {
      if (isNaN(value)) {
        console.log(`[NaN_TRACE] Setting ${prop} to NaN in ${context}`);
        console.log(`[NaN_TRACE] Object:`, obj);
        console.trace();
      }
      return value;
    };

    // 监听窗口大小变化
    let resizeCount = 0;
    window.addEventListener('resize', () => {
      resizeCount++;
      console.log(`[RESIZE_TRACE] Window resize event #${resizeCount}`);
      console.log(`[RESIZE_TRACE] New size: ${window.innerWidth}x${window.innerHeight}`);
    });
  });

  await page.goto('http://localhost:3000');
  
  // 等待游戏完全加载
  await page.waitForTimeout(2000);

  console.log('=== 开始追踪坐标计算 ===');

  // 注入更详细的拼图块坐标追踪
  await page.evaluate(() => {
    // 尝试多种方式找到游戏实例
    let gameInstance = window.gameInstance || window.game;
    
    // 如果直接找不到，尝试从DOM中找到canvas并获取相关实例
    if (!gameInstance) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // 检查canvas上是否有游戏实例的引用
        gameInstance = canvas.gameInstance || canvas._gameInstance;
        console.log('[TRACE] 从canvas找到游戏实例:', !!gameInstance);
      }
    }

    // 尝试从全局对象中查找
    if (!gameInstance) {
      for (let key in window) {
        if (window[key] && typeof window[key] === 'object' && window[key].puzzlePieces) {
          gameInstance = window[key];
          console.log(`[TRACE] 从window.${key}找到游戏实例`);
          break;
        }
      }
    }

    if (!gameInstance) {
      console.log('[ERROR] 无法找到游戏实例');
      console.log('[DEBUG] window对象的键:', Object.keys(window).filter(k => !k.startsWith('webkit')));
      return;
    }

    console.log('[TRACE] 找到游戏实例:', gameInstance);
    console.log('[TRACE] 游戏实例属性:', Object.keys(gameInstance));

    // 追踪拼图块的坐标变化
    if (gameInstance.puzzlePieces) {
      gameInstance.puzzlePieces.forEach((piece, index) => {
        console.log(`[INITIAL] 拼图块 ${index} 初始坐标:`, {
          x: piece.x,
          y: piece.y,
          points: piece.points ? piece.points.slice(0, 4) : 'no points'
        });

        // 监听坐标变化
        const originalX = piece.x;
        const originalY = piece.y;
        
        Object.defineProperty(piece, '_x', { value: originalX, writable: true });
        Object.defineProperty(piece, '_y', { value: originalY, writable: true });
        
        Object.defineProperty(piece, 'x', {
          get() { return this._x; },
          set(value) {
            if (isNaN(value)) {
              console.log(`[NaN_TRACE] 拼图块 ${index} X坐标被设置为NaN`);
              console.log(`[NaN_TRACE] 之前的值:`, this._x);
              console.trace();
            }
            this._x = value;
          }
        });

        Object.defineProperty(piece, 'y', {
          get() { return this._y; },
          set(value) {
            if (isNaN(value)) {
              console.log(`[NaN_TRACE] 拼图块 ${index} Y坐标被设置为NaN`);
              console.log(`[NaN_TRACE] 之前的值:`, this._y);
              console.trace();
            }
            this._y = value;
          }
        });

        // 追踪points数组的变化
        if (piece.points) {
          const originalPoints = [...piece.points];
          piece.points = new Proxy(originalPoints, {
            set(target, property, value) {
              if (typeof property === 'string' && !isNaN(parseInt(property))) {
                if (isNaN(value)) {
                  console.log(`[NaN_TRACE] 拼图块 ${index} points[${property}] 被设置为NaN`);
                  console.log(`[NaN_TRACE] 之前的值:`, target[property]);
                  console.trace();
                }
              }
              target[property] = value;
              return true;
            }
          });
        }
      });
    }

    // 追踪统一适配引擎的调用
    if (gameInstance.unifiedAdaptationEngine) {
      const engine = gameInstance.unifiedAdaptationEngine;
      const originalAdaptScatteredPuzzles = engine.adaptScatteredPuzzles;
      
      engine.adaptScatteredPuzzles = function(...args) {
        console.log('[ADAPTATION] 开始执行散开拼图适配');
        console.log('[ADAPTATION] 参数:', args);
        
        const result = originalAdaptScatteredPuzzles.apply(this, args);
        
        console.log('[ADAPTATION] 适配完成');
        return result;
      };
    }
  });

  // 触发窗口大小变化
  console.log('=== 触发窗口大小变化 ===');
  await page.setViewportSize({ width: 1000, height: 700 });
  
  // 等待适配完成
  await page.waitForTimeout(1000);

  // 检查坐标状态
  const coordinateStatus = await page.evaluate(() => {
    // 使用相同的逻辑找到游戏实例
    let gameInstance = window.gameInstance || window.game;
    
    if (!gameInstance) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        gameInstance = canvas.gameInstance || canvas._gameInstance;
      }
    }

    if (!gameInstance) {
      for (let key in window) {
        if (window[key] && typeof window[key] === 'object' && window[key].puzzlePieces) {
          gameInstance = window[key];
          break;
        }
      }
    }

    if (!gameInstance || !gameInstance.puzzlePieces) {
      return { 
        error: '无法找到拼图块',
        windowKeys: Object.keys(window).filter(k => !k.startsWith('webkit')).slice(0, 20),
        hasCanvas: !!document.querySelector('canvas')
      };
    }

    return gameInstance.puzzlePieces.map((piece, index) => ({
      index,
      x: piece.x,
      y: piece.y,
      isXNaN: isNaN(piece.x),
      isYNaN: isNaN(piece.y),
      points: piece.points ? piece.points.slice(0, 8) : null,
      nanPointsCount: piece.points ? piece.points.filter(p => isNaN(p)).length : 0
    }));
  });

  console.log('=== 坐标状态检查 ===');
  console.log(JSON.stringify(coordinateStatus, null, 2));

  // 再次触发窗口变化来观察
  console.log('=== 第二次窗口变化 ===');
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(1000);

  // 获取控制台日志
  const logs = await page.evaluate(() => {
    return window.consoleLogs || [];
  });

  console.log('=== 控制台日志 ===');
  logs.forEach(log => console.log(log));
});