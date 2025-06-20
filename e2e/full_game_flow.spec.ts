import { test, expect, Page } from '@playwright/test';

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
}

// 性能指标基准值
const PERFORMANCE_BENCHMARKS = {
  loadTime: 1000, // 页面加载时间基准：1秒
  shapeGenerationTime: 500, // 形状生成时间基准：500ms
  puzzleGenerationTime: 800, // 拼图生成时间基准：800ms
  scatterTime: 300, // 散开时间基准：300ms
  pieceInteractionTime: 200, // 单个拼图交互时间基准：200ms
  minFps: 30, // 最低帧率基准：30fps
  maxMemoryUsage: 100 * 1024 * 1024, // 最大内存使用基准：100MB
};

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('canvas.relative.cursor-pointer');
  await expect(page.getByRole('button', { name: /生成形状|重新生成形状/ })).toBeVisible(); 
}

// 辅助函数：拖拽拼图到目标位置
async function dragAndDropPiece(page: Page, pieceIndex: number, canvasBox: any, originalPositions: any[]) {
  const { puzzle } = await page.evaluate(() => (window as any).__gameStateForTests__);
  const pieceToDrag = puzzle[pieceIndex];
  const targetPosition = originalPositions[pieceIndex];

  const from = { x: pieceToDrag.x + canvasBox.x, y: pieceToDrag.y + canvasBox.y };
  const to = { x: targetPosition.x + canvasBox.x, y: targetPosition.y + canvasBox.y };

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
}

// 辅助函数：旋转拼图到正确角度
async function rotatePieceToCorrectAngle(page: Page, pieceIndex: number, targetRotation: number) {
  const rightBtn = page.getByTitle('顺时针旋转');
  const leftBtn = page.getByTitle('逆时针旋转');

  const pieceCurrentRotation = (await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, pieceIndex));
  
  let diff = targetRotation - pieceCurrentRotation;
  // 调整角度差到 -180 到 180 之间，以找到最短旋转路径
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // 每次旋转15度，计算所需点击次数
  const turns = Math.round(diff / 15);

  if (Math.abs(turns) > 0) {
    for (let t = 0; t < Math.abs(turns); t++) {
      const prevRotation = await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, pieceIndex);
      if (turns > 0) { // 顺时针
        await expect(rightBtn).toBeEnabled({ timeout: 5000 });
        await rightBtn.click();
      } else { // 逆时针
        await expect(leftBtn).toBeEnabled({ timeout: 5000 });
        await leftBtn.click();
      }
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

test('完整自动化游戏流程（含性能评测）', async ({ page }) => {
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
  console.log('步骤 1: 页面加载后渲染控制面板和画布 - 完成。');

    // 2. 形状生成性能
    const shapeStartTime = Date.now();
    await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await page.getByRole('button', { name: /生成形状|重新生成形状/ }).click();
    await page.waitForFunction(() => (window as any).__gameStateForTests__.originalShape.length > 0, null, { timeout: 10000 });
    metrics.shapeGenerationTime = Date.now() - shapeStartTime;
  console.log('步骤 2: 选择云朵形状并生成 - 完成。');

    // 3. 拼图生成性能（严格按页面顺序：斜线→切割次数→切割形状）
    const puzzleGenStart = Date.now();
    await page.getByText('斜线').click();
    await page.getByRole('button', { name: '1' }).click(); // 默认选择1次切割
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await page.waitForFunction(() => (window as any).__gameStateForTests__.puzzle && (window as any).__gameStateForTests__.puzzle.length > 0, null, { timeout: 10000 });
    metrics.puzzleGenerationTime = Date.now() - puzzleGenStart;
  console.log('步骤 3: 选择斜线切割并渲染拼图 - 完成。');

    // 4. 散开性能
    const scatterStart = Date.now();
    await page.getByRole('button', { name: /散开/ }).click();
    await page.waitForTimeout(300); // 等待动画
    metrics.scatterTime = Date.now() - scatterStart;
  console.log('步骤 4: 点击散开拼图 - 完成。');

    // 5. 画布提示
    const totalPieces = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle.length);
    expect(totalPieces).toBeGreaterThan(0);
  console.log(`步骤 5: 画布提示 (${totalPieces} 块) - 完成。`);

    // 6. 拼图交互性能
    // 获取 originalPositions 和 puzzle
    const originalPositions = await page.evaluate(() => (window as any).__gameStateForTests__.originalPositions);
    const canvasBox = await page.locator('canvas.relative.cursor-pointer').boundingBox();
    if (!canvasBox) throw new Error('canvasBox 获取失败');

    for (let i = 0; i < totalPieces; i++) {
      console.log(`选中拼图块 ${i}`);

      // 选中拼图块
      const pieceCenter = await page.evaluate((idx) => {
        const piece = (window as any).__gameStateForTests__.puzzle[idx];
        return { x: piece.x, y: piece.y };
      }, i);
      await page.mouse.click(canvasBox.x + pieceCenter.x, canvasBox.y + pieceCenter.y);
      await page.waitForTimeout(100); // 等待选中状态生效

      // 1. 旋转到目标角度（点击按钮，自动选择顺时针或逆时针，最短路径）
      const getRotation = async () => await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, i);
      const targetRotation = originalPositions[i].originalRotation ?? originalPositions[i].rotation;
      let currentRotation = await getRotation();
      let rotateCount = 0;
      while (Math.abs(((currentRotation - targetRotation + 360) % 360)) > 7 && rotateCount < 24) {
        const diff = ((targetRotation - currentRotation + 360) % 360);
        const counterDiff = ((currentRotation - targetRotation + 360) % 360);
        const useClockwise = diff <= counterDiff;
        if (useClockwise) {
          await page.getByRole('button', { name: /顺时针/ }).click();
        } else {
          await page.getByRole('button', { name: /逆时针/ }).click();
        }
        await page.waitForTimeout(50);
        currentRotation = await getRotation();
        rotateCount++;
      }
      console.log(`拼图块 ${i} 旋转完成。`);

      // 2. 拖拽到目标位置（用相对位移）
      const targetX = originalPositions[i].x;
      const targetY = originalPositions[i].y;
      const dx = targetX - pieceCenter.x;
      const dy = targetY - pieceCenter.y;
      await page.mouse.move(canvasBox.x + pieceCenter.x, canvasBox.y + pieceCenter.y);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + pieceCenter.x + dx, canvasBox.y + pieceCenter.y + dy, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(200);

      // 拖拽后输出实际位置和目标位置
      const pieceAfter = await page.evaluate((idx) => {
        const piece = (window as any).__gameStateForTests__.puzzle[idx];
        return { x: piece.x, y: piece.y, rotation: piece.rotation };
      }, i);
      console.log(`拼图块 ${i} 拖拽后位置:`, pieceAfter, '目标:', { x: targetX, y: targetY, rotation: targetRotation });

      // 微调：如果未吸附，尝试小幅度多次靠近目标
      let microAdjustCount = 0;
      while (!(await page.evaluate((idx) => (window as any).__gameStateForTests__.completedPieces.includes(idx), i)) && microAdjustCount < 5) {
        await page.mouse.move(canvasBox.x + pieceCenter.x + dx + microAdjustCount, canvasBox.y + pieceCenter.y + dy + microAdjustCount);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + pieceCenter.x + dx, canvasBox.y + pieceCenter.y + dy, { steps: 2 });
        await page.mouse.up();
        await page.waitForTimeout(200);
        microAdjustCount++;
      }

      // 等待 completedPieces 更新（延长等待时间）
      await page.waitForFunction(
        (idx) => (window as any).__gameStateForTests__.completedPieces.includes(idx),
        i,
        { timeout: 10000 }
      );
      const completedCount = await page.evaluate(() => (window as any).__gameStateForTests__.completedPieces.length);
      console.log(`拼图块 ${i} 拖拽完成，已完成数量更新为 ${completedCount}/${totalPieces}。`);
    }
    console.log('步骤 6: 拼图旋转和拖拽到目标位置 - 完成。');

    // 7. 检查完成状态
    console.log('等待前 gameState:', await page.evaluate(() => (window as any).__gameStateForTests__));
    await page.waitForFunction(() => (window as any).__gameStateForTests__.isCompleted, null, { timeout: 20000 });
    console.log('等待后 gameState:', await page.evaluate(() => (window as any).__gameStateForTests__));
  console.log('步骤 7: 最后1块拼图完成时，画布渲染完成效果 - 完成。');

    // 8. 重新开始
    await page.getByRole('button', { name: /重新开始/ }).click();
    await page.waitForTimeout(300);
  console.log('步骤 8: 点击重新开始按钮，清空画布，恢复初始游戏状态 - 完成。');

    // 完成测试后评估性能
    metrics.totalTestTime = Date.now() - startTime;
    metrics.fps = await page.evaluate(() => (window as any).fpsData || []);
    const finalMetrics = await measurePerformance(page);
    metrics.memoryUsage = finalMetrics.memoryUsage;

    // 输出性能评测结果
    console.log('\n=== 性能评测结果 ===');
    console.log(`页面加载时间: ${metrics.loadTime}ms`);
    console.log(`形状生成时间: ${metrics.shapeGenerationTime}ms`);
    console.log(`拼图生成时间: ${metrics.puzzleGenerationTime}ms`);
    console.log(`散开时间: ${metrics.scatterTime}ms`);
    const avgInteractionTime = metrics.pieceInteractionTimes.length > 0 ? (metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length) : '缺失';
    console.log(`平均拼图交互时间: ${avgInteractionTime === '缺失' ? '缺失' : avgInteractionTime.toFixed(2) + 'ms'}`);
    const avgFps = metrics.fps.length > 0 ? (metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length) : '缺失';
    console.log(`平均帧率: ${avgFps === '缺失' ? '缺失' : avgFps.toFixed(1) + 'fps'}`);
    const memMB = metrics.memoryUsage === undefined ? '缺失' : (metrics.memoryUsage / 1024 / 1024).toFixed(2);
    console.log(`内存使用: ${memMB === '缺失' ? '缺失' : memMB + 'MB'}`);
    console.log(`总测试时间: ${metrics.totalTestTime}ms`);
    console.log('====================\n');

    // 用expect断言性能基准
    expect(metrics.loadTime, '页面加载时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.loadTime);
    expect(metrics.shapeGenerationTime, '形状生成时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.shapeGenerationTime);
    expect(metrics.puzzleGenerationTime, '拼图生成时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.puzzleGenerationTime);
    expect(metrics.scatterTime, '散开时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.scatterTime);
    expect(avgInteractionTime, '平均拼图交互时间超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.pieceInteractionTime);
    expect(avgFps, '平均帧率过低').toBeGreaterThanOrEqual(PERFORMANCE_BENCHMARKS.minFps);
    expect(metrics.memoryUsage, '内存使用超标').toBeLessThanOrEqual(PERFORMANCE_BENCHMARKS.maxMemoryUsage);

  console.log('测试通过: 完整自动化游戏流程测试成功。');
  } catch (e) {
    testError = e;
    throw e;
  } finally {
    metrics.totalTestTime = Date.now() - startTime;
    // 兼容未采集到的项
    const icon = (val: number | undefined, base: number, type: 'max' | 'min' = 'max', label = '', unit = '') => {
      if (val === undefined) return `❌ ${label}`;
      const n = typeof val === 'number' ? val : parseFloat(val as any);
      let flag = '';
      if (type === 'max') flag = n > base ? '⚠️' : '✅';
      if (type === 'min') flag = n < base ? '⚠️' : '✅';
      // 内存和帧率保留两位小数，ms保留0位
      let numStr: string | number = n;
      if (unit === 'MB' || unit === 'fps') numStr = n.toFixed(2);
      if (unit === 'ms') numStr = n.toFixed(0);
      return `${flag} ${label}: ${numStr}${unit}`;
    };
    const avgInteractionTime = metrics.pieceInteractionTimes.length > 0 ? (metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length) : undefined;
    const avgFps = metrics.fps.length > 0 ? (metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length) : undefined;
    const memMB = metrics.memoryUsage === undefined ? undefined : (metrics.memoryUsage / 1024 / 1024);
    console.log('\n=== 性能评测结果 ===');
    console.log(icon(metrics.loadTime, PERFORMANCE_BENCHMARKS.loadTime, 'max', '页面加载时间', 'ms'));
    console.log(icon(metrics.shapeGenerationTime, PERFORMANCE_BENCHMARKS.shapeGenerationTime, 'max', '形状生成时间', 'ms'));
    console.log(icon(metrics.puzzleGenerationTime, PERFORMANCE_BENCHMARKS.puzzleGenerationTime, 'max', '拼图生成时间', 'ms'));
    console.log(icon(metrics.scatterTime, PERFORMANCE_BENCHMARKS.scatterTime, 'max', '散开时间', 'ms'));
    console.log(icon(avgInteractionTime, PERFORMANCE_BENCHMARKS.pieceInteractionTime, 'max', '平均拼图交互时间', 'ms'));
    console.log(icon(avgFps, PERFORMANCE_BENCHMARKS.minFps, 'min', '平均帧率', 'fps'));
    console.log(icon(memMB, PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024, 'max', '内存使用', 'MB'));
    console.log(`总测试时间: ${metrics.totalTestTime ?? '缺失'}ms`);
    console.log('====================\n');
  }
});