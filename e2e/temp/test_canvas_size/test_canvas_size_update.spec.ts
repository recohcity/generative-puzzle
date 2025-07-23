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

test('测试画布尺寸更新机制', async ({ page }) => {
  console.log('🔍 开始测试画布尺寸更新机制...');

  // 注入监控代码
  await page.addInitScript(() => {
    // 监控updateCanvasSize调用
    window.canvasSizeUpdates = [];
    
    // 重写console.log来捕获相关日志
    const originalLog = console.log;
    window.canvasSizeLogs = [];
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('useResponsiveCanvasSizing') || 
          message.includes('画布尺寸') || 
          message.includes('UPDATE_CANVAS_SIZE')) {
        window.canvasSizeLogs.push({
          timestamp: Date.now(),
          message: message,
          args: args
        });
      }
      originalLog.apply(console, args);
    };
  });

  await gotoAndEnsureCanvas(page);

  // 1. 获取初始状态
  const initialState = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const canvas = document.querySelector('canvas#puzzle-canvas');
    
    return {
      gameState: {
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        canvasSize: state.canvasSize
      },
      domCanvas: {
        width: canvas ? canvas.width : null,
        height: canvas ? canvas.height : null,
        clientWidth: canvas ? canvas.clientWidth : null,
        clientHeight: canvas ? canvas.clientHeight : null
      },
      logs: window.canvasSizeLogs || []
    };
  });

  console.log('📊 初始状态:');
  console.log('游戏状态:', initialState.gameState);
  console.log('DOM画布:', initialState.domCanvas);
  console.log('相关日志数量:', initialState.logs.length);

  // 2. 触发窗口大小变化
  console.log('🔄 触发窗口大小变化...');
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待变化完成
  await page.waitForTimeout(1000);

  // 3. 获取变化后的状态
  const afterResizeState = await page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    const canvas = document.querySelector('canvas#puzzle-canvas');
    
    return {
      gameState: {
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        canvasSize: state.canvasSize
      },
      domCanvas: {
        width: canvas ? canvas.width : null,
        height: canvas ? canvas.height : null,
        clientWidth: canvas ? canvas.clientWidth : null,
        clientHeight: canvas ? canvas.clientHeight : null
      },
      logs: window.canvasSizeLogs || [],
      updates: window.canvasSizeUpdates || []
    };
  });

  console.log('📊 窗口变化后状态:');
  console.log('游戏状态:', afterResizeState.gameState);
  console.log('DOM画布:', afterResizeState.domCanvas);
  console.log('相关日志数量:', afterResizeState.logs.length);

  // 4. 分析日志
  if (afterResizeState.logs.length > 0) {
    console.log('\n📝 画布尺寸相关日志:');
    afterResizeState.logs.slice(-10).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.message}`);
    });
  }

  // 5. 检查问题
  const gameStateHasSize = afterResizeState.gameState.canvasWidth && afterResizeState.gameState.canvasHeight;
  const domCanvasHasSize = afterResizeState.domCanvas.width && afterResizeState.domCanvas.height;

  console.log('\n🔍 问题分析:');
  console.log(`游戏状态有画布尺寸: ${!!gameStateHasSize}`);
  console.log(`DOM画布有尺寸: ${!!domCanvasHasSize}`);
  console.log(`尺寸是否一致: ${gameStateHasSize && domCanvasHasSize && 
    afterResizeState.gameState.canvasWidth === afterResizeState.domCanvas.width &&
    afterResizeState.gameState.canvasHeight === afterResizeState.domCanvas.height}`);

  if (!gameStateHasSize) {
    console.log('❌ 游戏状态中的画布尺寸未更新！');
    
    // 检查是否有相关的错误日志
    const errorLogs = afterResizeState.logs.filter(log => 
      log.message.includes('错误') || log.message.includes('error') || log.message.includes('不可用')
    );
    
    if (errorLogs.length > 0) {
      console.log('发现错误日志:');
      errorLogs.forEach(log => console.log(`  - ${log.message}`));
    }
  }

  // 6. 手动检查容器和画布引用
  const refStatus = await page.evaluate(() => {
    const canvas = document.querySelector('canvas#puzzle-canvas');
    const container = canvas ? canvas.parentElement : null;
    
    return {
      hasCanvas: !!canvas,
      hasContainer: !!container,
      containerSize: container ? {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight
      } : null,
      canvasSize: canvas ? {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight
      } : null
    };
  });

  console.log('\n🔍 DOM引用状态:');
  console.log('有画布元素:', refStatus.hasCanvas);
  console.log('有容器元素:', refStatus.hasContainer);
  console.log('容器尺寸:', refStatus.containerSize);
  console.log('画布尺寸:', refStatus.canvasSize);

  // 7. 手动触发画布尺寸更新
  console.log('\n🧪 手动触发画布尺寸更新...');
  const manualUpdateResult = await page.evaluate(() => {
    try {
      const canvas = document.querySelector('canvas#puzzle-canvas');
      const container = canvas ? canvas.parentElement : null;
      
      if (!canvas || !container) {
        return { error: '画布或容器元素不存在' };
      }

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 模拟useResponsiveCanvasSizing的逻辑
      const newWidth = Math.max(1, containerWidth);
      const newHeight = Math.max(1, containerHeight);
      
      // 直接调用GameContext的updateCanvasSize（如果可用）
      const gameContext = window.__gameContext__;
      if (gameContext && gameContext.updateCanvasSize) {
        gameContext.updateCanvasSize(newWidth, newHeight);
        return { 
          success: true, 
          newSize: { width: newWidth, height: newHeight },
          containerSize: { width: containerWidth, height: containerHeight }
        };
      } else {
        return { error: 'GameContext或updateCanvasSize不可用' };
      }
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log('手动更新结果:', manualUpdateResult);
});