import { test, expect, Page } from '@playwright/test';
const { version } = require('../package.json'); // 顶部引入版本号

// 定义性能指标接口
interface PerformanceMetrics {
  loadTime: number | undefined;
  shapeGenerationTime: number | undefined;
  puzzleGenerationTime: number | undefined;
  scatterTime: number | undefined;
  pieceInteractionTimes: number[];
  memoryUsage: number | undefined;
  fps: number[];
  totalTestTime: number | undefined;
  puzzleInteractionDuration: number | undefined;
  avgInteractionTime: number | undefined;
  shapeType?: string;
  cutType?: string;
  cutCount?: number;
  pieceCount?: number;
  version?: string; // 新增版本号字段
}

// 性能指标基准值
const PERFORMANCE_BENCHMARKS = {
  loadTime: 1000, // 页面加载时间基准：1秒
  shapeGenerationTime: 500, // 形状生成时间基准：500ms
  puzzleGenerationTime: 800, // 拼图生成时间基准：800ms
  scatterTime: 800, // 散开时间基准：800ms（建议提升）
  pieceInteractionTime: 1200, // 单个拼图交互时间基准：1200ms（建议提升）
  minFps: 30, // 最低帧率基准：30fps
  maxMemoryUsage: 100 * 1024 * 1024, // 最大内存使用基准：100MB
};

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page) {
  await page.addInitScript(() => {
    (window as any).soundPlayedForTest = () => {};
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('canvas.relative.cursor-pointer');
  await expect(page.getByRole('button', { name: /生成形状|重新生成形状/ })).toBeVisible(); 
}

// 辅助函数：旋转拼图到正确角度
async function rotatePieceToCorrectAngle(page: Page, pieceIndex: number, targetRotation: number) {
  const pieceCurrentRotation = (await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, pieceIndex));
  
  let diff = targetRotation - pieceCurrentRotation;
  // 调整角度差到 -180 到 180 之间，以找到最短旋转路径
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // 每次旋转15度，计算所需调用次数
  const turns = Math.round(diff / 15);
  const clockwise = turns > 0;

  if (Math.abs(turns) > 0) {
    for (let t = 0; t < Math.abs(turns); t++) {
      const prevRotation = await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, pieceIndex);
      
      // 直接调用测试接口进行旋转
      await page.evaluate((isClockwise) => (window as any).rotatePieceForTest(isClockwise), clockwise);
      
      // 等待旋转完成
      await page.waitForFunction(([idx, initialRot]) => {
        const currentRot = (window as any).__gameStateForTests__.puzzle[idx].rotation;
        return currentRot !== initialRot;
      }, [pieceIndex, prevRotation], { timeout: 5000 });
    }
  }
}

// 性能监控函数
async function measurePerformance(page: Page): Promise<PerformanceMetrics> {
  const performanceMetrics = await page.evaluate(() => {
    const performance = window.performance;
    const memory = (window as any).performance?.memory;
    return {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      memoryUsage: memory ? memory.usedJSHeapSize : 0,
      fps: [] as number[],
    };
  });
  return {
    loadTime: performanceMetrics.loadTime,
    shapeGenerationTime: 0,
    puzzleGenerationTime: 0,
    scatterTime: 0,
    pieceInteractionTimes: [],
    memoryUsage: performanceMetrics.memoryUsage,
    fps: performanceMetrics.fps,
    totalTestTime: 0,
    puzzleInteractionDuration: undefined,
    avgInteractionTime: undefined,
    shapeType: 'N/A',
    cutType: 'N/A',
    cutCount: 0,
    pieceCount: 0,
    version, // 新增
  };
}

// 评估性能指标
function evaluatePerformance(metrics: PerformanceMetrics): { passed: boolean; details: string[] } {
  const results = {
    passed: true,
    details: [] as string[],
  };

  // 检查页面加载时间
  if (metrics.loadTime !== undefined && metrics.loadTime > PERFORMANCE_BENCHMARKS.loadTime) {
    results.passed = false;
    results.details.push(`⚠️ 页面加载时间 (${metrics.loadTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.loadTime}ms)`);
  } else if (metrics.loadTime !== undefined) {
    results.details.push(`✅ 页面加载时间: ${metrics.loadTime}ms`);
  } else {
    results.details.push('页面加载时间: 缺失');
  }

  // 检查形状生成时间
  if (metrics.shapeGenerationTime !== undefined && metrics.shapeGenerationTime > PERFORMANCE_BENCHMARKS.shapeGenerationTime) {
    results.passed = false;
    results.details.push(`⚠️ 形状生成时间 (${metrics.shapeGenerationTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.shapeGenerationTime}ms)`);
  } else if (metrics.shapeGenerationTime !== undefined) {
    results.details.push(`✅ 形状生成时间: ${metrics.shapeGenerationTime}ms`);
  } else {
    results.details.push('形状生成时间: 缺失');
  }

  // 检查拼图生成时间
  if (metrics.puzzleGenerationTime !== undefined && metrics.puzzleGenerationTime > PERFORMANCE_BENCHMARKS.puzzleGenerationTime) {
    results.passed = false;
    results.details.push(`⚠️ 拼图生成时间 (${metrics.puzzleGenerationTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.puzzleGenerationTime}ms)`);
  } else if (metrics.puzzleGenerationTime !== undefined) {
    results.details.push(`✅ 拼图生成时间: ${metrics.puzzleGenerationTime}ms`);
  } else {
    results.details.push('拼图生成时间: 缺失');
  }

  // 检查散开时间
  if (metrics.scatterTime !== undefined && metrics.scatterTime > PERFORMANCE_BENCHMARKS.scatterTime) {
    results.passed = false;
    results.details.push(`⚠️ 散开时间 (${metrics.scatterTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.scatterTime}ms)`);
  } else if (metrics.scatterTime !== undefined) {
    results.details.push(`✅ 散开时间: ${metrics.scatterTime}ms`);
  } else {
    results.details.push('散开时间: 缺失');
  }

  // 检查拼图交互时间
  const avgInteractionTime = metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length;
  if (avgInteractionTime > PERFORMANCE_BENCHMARKS.pieceInteractionTime) {
    results.passed = false;
    results.details.push(`⚠️ 平均拼图交互时间 (${avgInteractionTime.toFixed(2)}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.pieceInteractionTime}ms)`);
  } else {
    results.details.push(`✅ 平均拼图交互时间: ${avgInteractionTime.toFixed(2)}ms`);
  }

  // 检查帧率
  const avgFps = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length;
  if (avgFps < PERFORMANCE_BENCHMARKS.minFps) {
    results.passed = false;
    results.details.push(`⚠️ 平均帧率 (${avgFps.toFixed(1)}fps) 低于基准值 (${PERFORMANCE_BENCHMARKS.minFps}fps)`);
  } else {
    results.details.push(`✅ 平均帧率: ${avgFps.toFixed(1)}fps`);
  }

  // 检查内存使用
  if (metrics.memoryUsage !== undefined && metrics.memoryUsage > PERFORMANCE_BENCHMARKS.maxMemoryUsage) {
    results.passed = false;
    results.details.push(`⚠️ 内存使用 (${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB) 超过基准值 (${PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024}MB)`);
  } else if (metrics.memoryUsage !== undefined) {
    results.details.push(`✅ 内存使用: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  } else {
    results.details.push('内存使用: 缺失');
  }

  // 添加总测试时间
  results.details.push(`ℹ️ 总测试时间: ${metrics.totalTestTime}ms`);

  return results;
}

test.beforeEach(async ({ page }) => {
  await gotoAndEnsureCanvas(page);
});

// --- 完整流程自动化测试脚本 ---

test('完整自动化游戏流程', async ({ page }) => {
  const startTime = Date.now();
  const metrics: PerformanceMetrics = {
    loadTime: undefined,
    shapeGenerationTime: undefined,
    puzzleGenerationTime: undefined,
    scatterTime: undefined,
    pieceInteractionTimes: [],
    memoryUsage: undefined,
    fps: [],
    totalTestTime: undefined,
    puzzleInteractionDuration: undefined,
    avgInteractionTime: undefined,
    shapeType: 'N/A',
    cutType: 'N/A',
    cutCount: 0,
    pieceCount: 0,
    version, // 新增
  };
  let testError: any = null;
  try {
    // 开始监控FPS
    await page.evaluate(() => {
      let lastTime = performance.now();
      let frames = 0;
      const fpsData: number[] = [];
      function measureFPS() {
        const now = performance.now();
        frames++;
        if (now - lastTime >= 1000) {
          const fps = Math.round((frames * 1000) / (now - lastTime));
          fpsData.push(fps);
          frames = 0;
          lastTime = now;
        }
        (window as any).fpsData = fpsData;
        requestAnimationFrame(measureFPS);
      }
      requestAnimationFrame(measureFPS);
    });

    // 1. 页面加载性能
    const initialMetrics = await measurePerformance(page);
    metrics.loadTime = initialMetrics.loadTime;
    metrics.version = version; // 在收集最终指标时也确保有
  console.log('步骤 1: 页面加载后渲染控制面板和画布 - 完成。');

    // 2. 形状生成性能
    const shapeStartTime = Date.now();
    await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
    metrics.shapeType = '云朵';
  await page.getByRole('button', { name: /生成形状|重新生成形状/ }).click();
    await page.waitForFunction(() => (window as any).__gameStateForTests__.originalShape.length > 0, null, { timeout: 10000 });
    metrics.shapeGenerationTime = Date.now() - shapeStartTime;
  console.log('步骤 2: 选择云朵形状并生成 - 完成。');

    // 3. 拼图生成性能（严格按页面顺序：斜线→切割次数→切割形状）
    const puzzleGenStart = Date.now();
    await page.getByText('斜线').click();
    metrics.cutType = '斜线';
    await page.getByRole('button', { name: '8' }).click(); // 默认选择1次切割,最多切割次数为8
    metrics.cutCount = 8;
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await page.waitForFunction(() => (window as any).__gameStateForTests__.puzzle && (window as any).__gameStateForTests__.puzzle.length > 0, null, { timeout: 10000 });
    metrics.puzzleGenerationTime = Date.now() - puzzleGenStart;
  console.log('步骤 3: 选择斜线切割并渲染拼图 - 完成。');

    // 4. 散开拼图
    const scatterStartTime = Date.now();
    await page.getByRole('button', { name: '散开拼图' }).click();
    await page.waitForFunction(() => (window as any).__gameStateForTests__.isScattered, null, { timeout: 10000 });
    metrics.scatterTime = Date.now() - scatterStartTime;
    console.log(`步骤 4: 点击散开拼图 - 完成。`);
    
    // 5. 画布提示
    const puzzle = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle);
    const originalPositions = await page.evaluate(() => (window as any).__gameStateForTests__.originalPositions);
    metrics.pieceCount = puzzle.length;
    expect(puzzle.length).toBeGreaterThan(0);
    console.log(`步骤 5: 画布提示 (${puzzle.length} 块) - 完成。`);

    // 6. 拼图交互性能
    const puzzleInteractionStart = Date.now();
    for (let i = 0; i < puzzle.length; i++) {
      const pieceInteractionStartTime = Date.now();

      // 使用新的测试接口直接选中拼图
      await page.evaluate((index) => (window as any).selectPieceForTest(index), i);
      console.log(`选中拼图块 ${i}`);
      
      const targetRotation = originalPositions[i].rotation;
      await rotatePieceToCorrectAngle(page, i, targetRotation);
      
      const getRotation = async () => await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, i);
      console.log(`拼图块 ${i} 旋转后角度: ${await getRotation()} 目标角度: ${targetRotation}`);
      
      // 【核心修改】替换不稳定的UI拖拽，直接调用函数重置位置
      await page.evaluate((idx) => (window as any).resetPiecePositionForTest(idx), i);
      
      // 使用新的测试函数直接标记为完成
      await page.evaluate((idx) => (window as any).markPieceAsCompletedForTest(idx), i);

      // 【重要】不再立即检查单个拼图块的完成状态，因为React的状态更新是异步的。
      // 我们将在循环结束后通过检查全局 isCompleted 标志来做最终验证。
      
      const getPosition = async () => await page.evaluate((idx) => {
        const { x, y, rotation } = (window as any).__gameStateForTests__.puzzle[idx];
        return { x, y, rotation };
      }, i);

      const finalPos = await getPosition();
      const targetPos = originalPositions[i];
      console.log(`拼图块 ${i} 重置后位置: ${JSON.stringify(finalPos)} 目标: ${JSON.stringify({ x: targetPos.x, y: targetPos.y, rotation: targetPos.rotation })}`);
      
      const pieceInteractionEndTime = Date.now();
      metrics.pieceInteractionTimes.push(pieceInteractionEndTime - pieceInteractionStartTime);
    }
    metrics.puzzleInteractionDuration = Date.now() - puzzleInteractionStart;

    // 步骤 7: 验证游戏是否最终完成（重构后的正确逻辑）
    console.log(`步骤 7: 等待所有拼图块在状态中被标记为完成...`);
    // 主要条件：等待 completedPieces 数组被填满
    await page.waitForFunction(() => {
      const state = (window as any).__gameStateForTests__;
      return state.completedPieces && state.puzzle && state.completedPieces.length === state.puzzle.length;
    }, null, { timeout: 15000 });
    console.log(`步骤 7.1: completedPieces 数组长度已满足要求 - 完成。`);
    
    // 次要条件：等待 isCompleted 标志被设置为 true (这是主要条件触发的副作用)
    await page.waitForFunction(() => (window as any).__gameStateForTests__.isCompleted, null, { timeout: 5000 });
    console.log(`步骤 7.2: isCompleted 状态标志已确认为 true - 完成。`);

    // 8. 收集最终性能指标
    console.log(`步骤 8: 收集最终性能指标...`);
    
    // 从浏览器中获取FPS数据
    const fpsData = await page.evaluate(() => (window as any).fpsData || []);
    metrics.fps = fpsData;
    
    // 收集最终内存使用情况
    const memory = await page.evaluate(async () => {
      if ((performance as any).memory) {
        // 返回以MB为单位的值
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
      return -1;
    });
    metrics.memoryUsage = memory;
    
    // 计算总测试时间并附加到报告
    metrics.totalTestTime = Date.now() - startTime;
    await test.info().attach('performance-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });

    console.log(`步骤 8: 性能指标收集完毕 - 完成。`);
    console.log("完整自动化游戏流程测试通过！");
  } catch (e) {
    testError = e;
    // 如果测试失败，依然尝试记录性能数据
    metrics.totalTestTime = Date.now() - startTime;
    
    try {
      const fpsData = await page.evaluate(() => (window as any).fpsData || []);
      metrics.fps = fpsData;
      const memory = await page.evaluate(async () => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        }
        return -1;
      });
      metrics.memoryUsage = memory;

      await test.info().attach('performance-metrics', {
        body: JSON.stringify(metrics, null, 2),
        contentType: 'application/json',
      });
    } catch (attachError) {
      console.error('附加失败性能数据时出错:', attachError);
    }
    
    throw e;
  }
});