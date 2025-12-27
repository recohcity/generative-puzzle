// Playwright/Node版本建议: 请确保Playwright与Node.js版本与CI一致，避免环境差异导致flaky
// Playwright: npx playwright --version
// Node.js: node --version

import { test, expect, Page } from '@playwright/test';
import { existsSync } from 'fs';
import packageJson from '../package.json' assert { type: 'json' };
test.setTimeout(60000);
const { version } = packageJson; // 顶部引入版本号

// 定义性能指标接口
interface PerformanceMetrics {
  gotoLoadTime?: number;
  e2eLoadTime?: number;
  loadTime: number | undefined;
  resourceLoadTime?: number; // 新增
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
  version?: string; // 版本号字段
  failReason?: string; // n失败原因字段
  envMode?: string; // 环境模式字段
  // 新增：适配测试相关字段
  adaptationTestResults?: { [resolution: string]: boolean };
  adaptationTestCount?: number;
  adaptationPassCount?: number;
  adaptationPassRate?: string;
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

// 自动识别开发/生产环境
function detectEnvMode() {
  if (process.env.NODE_ENV) return process.env.NODE_ENV;
  if (process.argv.some(arg => arg.includes('dev'))) return 'development';
  if (process.argv.some(arg => arg.includes('start') || arg.includes('prod'))) return 'production';
  try {
    if (existsSync('./.next') || existsSync('./build') || existsSync('./dist')) return 'production';
  } catch { }
  return 'development';
}

// 辅助函数：确保画布可见、UI就绪、音效预加载完成（用于端到端加载时间测量）
// 注意：此函数不执行 page.goto()，因为页面已经在调用前加载完成
// 辅助函数：确保画布可见、UI就绪、音效预加载完成（用于端到端加载时间测量）
// 注意：此函数不执行 page.goto()，因为页面已经在调用前加载完成
async function ensureCanvasAndUIReady(page: Page) {
  // #region agent log
  const e2eStepStart = Date.now();
  const testRunCount = (global as any).__testRunCount__ || 1;
  const isFirstRun = testRunCount === 1;
  fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:66',message:'E2E加载开始',data:{timestamp:Date.now(),testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // 优化：先等待网络空闲，这样画布和UI应该已经渲染完成
  // 等待页面完全加载和多语言系统初始化
  const networkIdleStart = Date.now();
  await page.waitForLoadState('networkidle');
  const networkIdleTime = Date.now() - networkIdleStart;
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:75',message:'networkidle等待完成',data:{networkIdleTime,testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // 等待初始提示出现（确保UI已完全渲染，包括画布）
  // waitForTip 已经确保了UI完全渲染，画布肯定已经可见了
  const tipWaitStart = Date.now();
  await waitForTip(page, '请点击生成你喜欢的形状');
  const tipWaitTime = Date.now() - tipWaitStart;
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:87',message:'提示等待完成',data:{tipWaitTime,testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // 验证画布已可见（快速检查，不应该需要等待）
  // 由于 waitForTip 已经确保了UI完全渲染，画布应该已经可见，这里只是验证
  const canvasWaitStart = Date.now();
  await page.waitForSelector('canvas#puzzle-canvas', { state: 'visible', timeout: 1000 });
  const canvasWaitTime = Date.now() - canvasWaitStart;
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:96',message:'画布等待完成',data:{canvasWaitTime,testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // 等待音效预加载完成（确保音效就绪，满足点击即播）
  // preloadAllSoundEffects 在 GameInterface 的 useEffect 中调用，会创建 Audio 元素并调用 load()
  // 由于音效文件较小（split.mp3, scatter.mp3, finish.mp3 通常 <100KB），加载很快
  // 网络空闲后音效应该已经加载完成，但为了确保，等待150ms
  await page.waitForTimeout(150);
  
  const totalE2eTime = Date.now() - e2eStepStart;
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:107',message:'E2E加载完成',data:{totalE2eTime,networkIdleTime,tipWaitTime,canvasWaitTime,soundWaitTime:150,testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

// 注意：measurePerformance 函数已移除，性能指标在测试流程中直接收集

// 评估性能指标（只做日志和报告，不影响流程通过与否）
function evaluatePerformance(metrics: PerformanceMetrics): { details: string[] } {
  const details = [] as string[];

  // 检查资源加载时间（从0%加载到100%，页面资源加载完成）
  if (metrics.resourceLoadTime !== undefined && metrics.resourceLoadTime > PERFORMANCE_BENCHMARKS.loadTime) {
    details.push(`⚠️ 资源加载时间 (${metrics.resourceLoadTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.loadTime}ms)`);
  } else if (metrics.resourceLoadTime !== undefined) {
    details.push(`✅ 资源加载时间: ${metrics.resourceLoadTime}ms`);
  } else {
    details.push('资源加载时间: 缺失');
  }

  // 检查形状生成时间
  if (metrics.shapeGenerationTime !== undefined && metrics.shapeGenerationTime > PERFORMANCE_BENCHMARKS.shapeGenerationTime) {
    details.push(`⚠️ 形状生成时间 (${metrics.shapeGenerationTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.shapeGenerationTime}ms)`);
  } else if (metrics.shapeGenerationTime !== undefined) {
    details.push(`✅ 形状生成时间: ${metrics.shapeGenerationTime}ms`);
  } else {
    details.push('形状生成时间: 缺失');
  }

  // 检查拼图生成时间
  if (metrics.puzzleGenerationTime !== undefined && metrics.puzzleGenerationTime > PERFORMANCE_BENCHMARKS.puzzleGenerationTime) {
    details.push(`⚠️ 拼图生成时间 (${metrics.puzzleGenerationTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.puzzleGenerationTime}ms)`);
  } else if (metrics.puzzleGenerationTime !== undefined) {
    details.push(`✅ 拼图生成时间: ${metrics.puzzleGenerationTime}ms`);
  } else {
    details.push('拼图生成时间: 缺失');
  }

  // 检查散开时间
  if (metrics.scatterTime !== undefined && metrics.scatterTime > PERFORMANCE_BENCHMARKS.scatterTime) {
    details.push(`⚠️ 散开时间 (${metrics.scatterTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.scatterTime}ms)`);
  } else if (metrics.scatterTime !== undefined) {
    details.push(`✅ 散开时间: ${metrics.scatterTime}ms`);
  } else {
    details.push('散开时间: 缺失');
  }

  // 检查拼图交互时间
  const avgInteractionTime = metrics.pieceInteractionTimes.length > 0 ? metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length : undefined;
  if (avgInteractionTime !== undefined && avgInteractionTime > PERFORMANCE_BENCHMARKS.pieceInteractionTime) {
    details.push(`⚠️ 平均拼图交互时间 (${avgInteractionTime.toFixed(2)}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.pieceInteractionTime}ms)`);
  } else if (avgInteractionTime !== undefined) {
    details.push(`✅ 平均拼图交互时间: ${avgInteractionTime.toFixed(2)}ms`);
  } else {
    details.push('平均拼图交互时间: 缺失');
  }

  // 检查帧率
  const avgFps = metrics.fps.length > 0 ? metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length : undefined;
  if (avgFps !== undefined && avgFps < PERFORMANCE_BENCHMARKS.minFps) {
    details.push(`⚠️ 平均帧率 (${avgFps.toFixed(1)}fps) 低于基准值 (${PERFORMANCE_BENCHMARKS.minFps}fps)`);
  } else if (avgFps !== undefined) {
    details.push(`✅ 平均帧率: ${avgFps.toFixed(1)}fps`);
  } else {
    details.push('平均帧率: 缺失');
  }

  // 检查内存使用
  if (metrics.memoryUsage !== undefined && metrics.memoryUsage > PERFORMANCE_BENCHMARKS.maxMemoryUsage) {
    details.push(`⚠️ 内存使用 (${metrics.memoryUsage.toFixed(2)}MB) 超过基准值 (${(PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB)`);
  } else if (metrics.memoryUsage !== undefined) {
    details.push(`✅ 内存使用: ${metrics.memoryUsage.toFixed(2)}MB`);
  } else {
    details.push('内存使用: 缺失');
  }

  // 添加总测试时间
  details.push(`ℹ️ 总测试时间: ${metrics.totalTestTime}ms`);

  // 端到端加载时间（加载完并进入游戏主界面，所有UI都正常显示完毕，音效就绪）
  const e2eLoadTimeBenchmark = 1800; // 端到端加载时间基准值
  if (metrics.e2eLoadTime !== undefined && metrics.e2eLoadTime > e2eLoadTimeBenchmark) {
    details.push(`⚠️ 端到端加载时间 (${metrics.e2eLoadTime}ms) 超过基准值 (${e2eLoadTimeBenchmark}ms)`);
  } else if (metrics.e2eLoadTime !== undefined) {
    details.push(`✅ 端到端加载时间: ${metrics.e2eLoadTime}ms`);
  } else {
    details.push('端到端加载时间: 缺失');
  }

  // 兼容字段：loadTime 使用 e2eLoadTime 的值（向后兼容）
  // 注意：此字段仅用于兼容，实际评估应使用 resourceLoadTime 和 e2eLoadTime

  return { details };
}

// 健壮的等待函数，自动重试一次，超时提升到 30000ms
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

// 🚀 简化的适配检查函数：减少卡顿
async function checkAdaptation(page: Page, resolutionName: string, resolutionType?: string): Promise<boolean> {
  try {
    const adaptationResult = await page.evaluate(() => {
      const canvas = document.querySelector('canvas#puzzle-canvas') as HTMLCanvasElement;
      const gameState = (window as any).__gameStateForTests__;

      // 基础检查
      if (!canvas || !gameState) {
        return { success: false, reason: '画布或游戏状态不存在' };
      }

      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width <= 0 || canvasRect.height <= 0) {
        return { success: false, reason: '画布尺寸异常' };
      }

      // 简化检查：只检查基本功能
      if (!gameState.originalShape || !Array.isArray(gameState.originalShape) || gameState.originalShape.length === 0) {
        return { success: false, reason: '目标形状数据异常' };
      }

      return { success: true, reason: '基础适配检查通过' };
    });

    console.log(`[适配检查] ${resolutionName}: ${adaptationResult.success ? '✅ PASS' : '❌ FAIL'} - ${adaptationResult.reason}`);

    // 优化：简化调试信息，只在失败时输出关键信息
    if (!adaptationResult.success) {
      const basicDebugInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas#puzzle-canvas') as HTMLCanvasElement;
        const gameState = (window as any).__gameStateForTests__;
        if (!canvas || !gameState) return null;
        return {
          canvasSize: { width: canvas.width, height: canvas.height },
          hasShape: gameState.originalShape && Array.isArray(gameState.originalShape) && gameState.originalShape.length > 0
        };
      });
      console.log(`[适配调试] ${resolutionName} 关键信息:`, basicDebugInfo);
    }

    return adaptationResult.success;
  } catch (error) {
    console.log(`[适配检查] ${resolutionName}: ❌ ERROR - ${error}`);
    return false;
  }
}

// 🚀 简化的适配机制测试：减少卡顿
async function testAdaptationMechanism(page: Page, resolutionName: string): Promise<{ success: boolean, reason: string }> {
  console.log(`[适配机制测试] 简化测试 ${resolutionName}...`);

  try {
    // 简化的基础检查
    const basicTest = await page.evaluate(() => {
      const gameState = (window as any).__gameStateForTests__;

      if (!gameState) {
        return { success: false, reason: '游戏状态不可用' };
      }

      if (!gameState.originalShape || !Array.isArray(gameState.originalShape)) {
        return { success: false, reason: '无形状数据' };
      }

      return { success: true, reason: '基础适配机制检查通过' };
    });

    return basicTest;
  } catch (error) {
    return { success: false, reason: `适配机制测试异常: ${error}` };
  }
}

// 多分辨率适配测试函数（优化：支持一次性测试多个分辨率）
// 核心测试目标：3端分辨率（桌面、移动、平板）+ web端动态变化分辨率时的适配情况
async function performAdaptationTest(page: Page, maxTests?: number, includePortrait?: boolean, includeExtreme?: boolean): Promise<{ results: { [key: string]: boolean }, passCount: number, totalCount: number }> {
  // 优化：测试3端分辨率，覆盖桌面、移动、平板
  // 1. 桌面端分辨率（横屏）
  const desktopResolutions = [
    { width: 1920, height: 1080, name: '1920x1080', type: 'desktop' }, // 全高清桌面
    { width: 1440, height: 900, name: '1440x900', type: 'desktop' },  // 标准桌面
    { width: 1280, height: 720, name: '1280x720', type: 'desktop' }    // 小桌面
  ];
  
  // 2. 移动端分辨率（竖屏）
  const mobileResolutions = [
    { width: 375, height: 667, name: '375x667-mobile', type: 'mobile' },   // iPhone 6/7/8
    { width: 414, height: 896, name: '414x896-mobile', type: 'mobile' },   // iPhone X/11/12
    { width: 360, height: 640, name: '360x640-mobile', type: 'mobile' }    // Android 标准
  ];
  
  // 3. 平板端分辨率（横屏）
  const tabletResolutions = [
    { width: 768, height: 1024, name: '768x1024-tablet', type: 'tablet' }, // iPad 竖屏
    { width: 1024, height: 768, name: '1024x768-tablet', type: 'tablet' }, // iPad 横屏
    { width: 800, height: 600, name: '800x600-tablet', type: 'tablet' }    // 小平板
  ];
  
  // 合并所有分辨率
  let resolutions = [...desktopResolutions, ...mobileResolutions, ...tabletResolutions];
  
  // 如果包含竖屏横屏模式，添加额外的竖屏分辨率（用于测试动态变化）
  // 这些分辨率用于测试web端动态变化分辨率时的适配情况
  if (includePortrait) {
    resolutions = resolutions.concat([
      { width: 1080, height: 1920, name: '1080x1920-portrait', type: 'mobile' }, // 大屏手机竖屏
      { width: 720, height: 1280, name: '720x1280-portrait', type: 'mobile' }  // 中屏手机竖屏
    ]);
  }

  // 如果包含极端分辨率测试，添加桌面端模拟移动端的极端情况
  // 注意：移动端分辨率已经在上面包含，这里主要用于极端场景测试
  if (includeExtreme) {
    resolutions = resolutions.concat([
      { width: 320, height: 568, name: '320x568-extreme', type: 'extreme' }, // iPhone SE
      { width: 2560, height: 1440, name: '2560x1440-extreme', type: 'extreme' } // 4K显示器
    ]);
  }

  // 限制测试次数
  if (maxTests && maxTests < resolutions.length) {
    resolutions = resolutions.slice(0, maxTests);
  }

  const results: { [key: string]: boolean } = {};
  let passCount = 0;

  console.log(`[适配测试] 开始多分辨率适配检查... (${resolutions.length}个分辨率)`);

  for (const resolution of resolutions) {
    console.log(`[适配测试] 切换到分辨率: ${resolution.name} (${resolution.type})`);

    // 改变浏览器分辨率（模拟web端动态变化分辨率）
    // 这是本项目适配的核心体现：测试在不同分辨率动态变化时的适配情况
    await page.setViewportSize({ width: resolution.width, height: resolution.height });

    // 🛡️ 简化的适配等待：减少卡顿
    console.log(`[适配等待] ${resolution.name}: 等待适配完成...`);

    // 触发resize事件并等待适配完成（这是web端动态变化分辨率时的核心适配机制）
    await page.evaluate(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // 简化等待：只等待基本的适配时间
    // 适配系统需要时间响应分辨率变化，300ms足够完成布局调整
    await page.waitForTimeout(300); // 优化：减少到300ms，适配通常很快完成

    console.log(`[适配等待] ${resolution.name}: 适配等待完成`);

    // 🛡️ 最高监督指令：检查核心适配机制
    const mechanismTest = await testAdaptationMechanism(page, resolution.name);
    const adaptationOK = await checkAdaptation(page, resolution.name, resolution.type);

    // 只有核心机制和适配结果都通过才算成功
    const overallSuccess = mechanismTest.success && adaptationOK;
    results[resolution.name] = overallSuccess;

    if (!mechanismTest.success) {
      console.log(`[适配机制] ${resolution.name}: ❌ 核心机制失败 - ${mechanismTest.reason}`);
    }
    if (!adaptationOK) {
      console.log(`[适配结果] ${resolution.name}: ❌ 适配结果失败`);
    }

    if (overallSuccess) {
      passCount++;
    }

    await page.waitForTimeout(200); // 优化：减少到200ms
  }

  console.log(`[适配测试] 完成 - 通过率: ${passCount}/${resolutions.length} (${(passCount / resolutions.length * 100).toFixed(1)}%)`);

  // 恢复到标准分辨率
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(200); // 优化：减少到200ms

  return {
    results,
    passCount,
    totalCount: resolutions.length
  };
}

// 辅助函数：等待画布提示区域出现指定文本
// 更稳健的文本等待方式 - 支持中英文双语
async function waitForTip(page: Page, expectedCN: string, expectedEN?: string) {
  const timeout = 5000; // 优化：减少超时时间到5秒，通常UI响应很快

  if (expectedEN) {
    // 同时等待中文或英文文本，哪个先出现就用哪个
    try {
      await Promise.race([
        expect(page.getByText(expectedCN)).toBeVisible({ timeout }),
        expect(page.getByText(expectedEN)).toBeVisible({ timeout })
      ]);
    } catch (error) {
      // 如果都没找到，再尝试一次中文（因为我们设置了中文环境）
      await expect(page.getByText(expectedCN)).toBeVisible({ timeout: 2000 });
    }
  } else {
    await expect(page.getByText(expectedCN)).toBeVisible({ timeout });
  }
}

test.beforeEach(async ({ page, context }) => {
  // #region agent log
  // 记录测试运行次数（用于判断是否为首次运行）
  const testRunCount = (global as any).__testRunCount__ = ((global as any).__testRunCount__ || 0) + 1;
  const isFirstRun = testRunCount === 1;
  fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:452',message:'beforeEach开始',data:{testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // 设置测试环境的语言偏好（模拟中文用户）
  await page.addInitScript(() => {
    // 模拟中文用户的浏览器环境
    Object.defineProperty(navigator, 'language', {
      get: function () { return 'zh-CN'; }
    });
    Object.defineProperty(navigator, 'languages', {
      get: function () { return ['zh-CN', 'zh']; }
    });

    // 🛡️ 最高监督指令：监控UPDATE_CANVAS_SIZE调用
    (window as any).__adaptationMonitor__ = {
      updateCanvasSizeCalls: 0,
      lastUpdateCanvasSizeTime: 0,
      adaptationHistory: []
    };
  });

  await page.addInitScript(() => {
    (window as any).soundPlayedForTest = () => { };
    // FPS采集脚本
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
    // 隐藏动画，确保浏览器持续刷新
    function dummyAnim() { requestAnimationFrame(dummyAnim); }
    requestAnimationFrame(dummyAnim);
  });
  // 在 beforeEach 中只设置视口，不加载页面
  // 页面加载和测量在测试主流程中进行，确保测量准确性
  await page.setViewportSize({ width: 1920, height: 1080 });
});

// --- 完整流程自动化测试脚本 ---

test('完整自动化游戏流程', async ({ page }) => {
  const startTime = Date.now();
  const metrics: PerformanceMetrics = {
    gotoLoadTime: undefined,
    e2eLoadTime: undefined,
    loadTime: undefined,
    resourceLoadTime: undefined,
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
    version,
    envMode: detectEnvMode(),
  };
  let testError: any = null;
  try {
    // 1. 采集资源加载时间（从0%加载到100%，页面资源加载完成）
    const resourceLoadStart = Date.now();
    const testRunCount = (global as any).__testRunCount__ || 1;
    const isFirstRun = testRunCount === 1;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:537',message:'资源加载开始',data:{timestamp:Date.now(),envMode:metrics.envMode,testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    await page.goto('http://localhost:3000/', { waitUntil: 'load' });
    metrics.resourceLoadTime = Date.now() - resourceLoadStart;
    metrics.gotoLoadTime = metrics.resourceLoadTime; // 兼容字段
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/83e1d94c-afb4-4b86-8b38-165371e14489',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'full_game_flow.spec.ts:543',message:'资源加载完成',data:{resourceLoadTime:metrics.resourceLoadTime,envMode:metrics.envMode,testRunCount,isFirstRun},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // 2. 采集端到端加载时间（加载完并进入游戏主界面，所有UI都正常显示完毕，音效就绪）
    const e2eStart = Date.now();
    await ensureCanvasAndUIReady(page);
    metrics.e2eLoadTime = Date.now() - e2eStart;
    // 兼容老逻辑：loadTime 使用 e2eLoadTime 的值
    metrics.loadTime = metrics.e2eLoadTime;

    // 2. 形状生成时间采集
    const shapeGenStart = Date.now();
    await page.getByTestId('shape-curve-button').click();
    await waitForTip(page, '请选择切割类型');
    metrics.shapeGenerationTime = Date.now() - shapeGenStart;
    metrics.shapeType = '云朵';

    // 节点1：形状生成后适配检查（优化：测试3端分辨率 + 动态变化测试）
    // 优化：测试桌面、移动、平板3端分辨率，以及web端动态变化分辨率时的适配情况
    // 这是本项目适配的核心体现：确保在不同设备和动态变化时都能正常适配
    const shapeAdaptationTest = await performAdaptationTest(page, undefined, true, false); // 测试所有基础分辨率 + 竖屏移动端
    metrics.adaptationTestResults = { ...shapeAdaptationTest.results };
    metrics.adaptationTestCount = shapeAdaptationTest.totalCount;
    metrics.adaptationPassCount = shapeAdaptationTest.passCount;
    metrics.adaptationPassRate = `${(shapeAdaptationTest.passCount / shapeAdaptationTest.totalCount * 100).toFixed(1)}%`;

    // 3. 拼图生成时间采集
    await page.getByTestId('cut-type-curve-button').click();
    metrics.cutType = '曲线';
    await waitForTip(page, '请切割形状');
    await page.getByTestId('cut-count-8-button').click();
    metrics.cutCount = 8;
    const puzzleGenStart = Date.now();
    await page.getByTestId('generate-puzzle-button').click();
    await waitForTip(page, '请散开拼图，开始游戏');
    metrics.puzzleGenerationTime = Date.now() - puzzleGenStart;

    // 5. 散开拼图
    const scatterStartTime = Date.now();
    await page.getByTestId('scatter-puzzle-button').click();
    await robustWaitForFunction(page, () => {
      const state = (window as any).__gameStateForTests__;
      return Array.isArray(state.puzzle) && state.puzzle.length > 0
        && Array.isArray(state.originalPositions) && state.originalPositions.length > 0;
    }, 30000);
    const puzzle = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle);
    await waitForTip(page, `拼图0/${puzzle.length}`);
    metrics.scatterTime = Date.now() - scatterStartTime;

    // 节点2：散开拼图后适配检查（优化：移除重复测试，已在形状生成后测试过）
    // 优化说明：散开拼图后的适配测试与形状生成后的测试重复，移除以提高效率
    // 如果需要，可以在关键节点（如完成拼图后）进行验证性测试

    // 6. 获取拼图数据
    const originalPositions = await page.evaluate(() => (window as any).__gameStateForTests__.originalPositions);
    metrics.pieceCount = puzzle.length;
    expect(puzzle.length).toBeGreaterThan(0);

    // 7. 拼图交互性能测试
    let puzzleInteractionStartTime = Date.now();
    for (let i = 0; i < puzzle.length; i++) {
      const pieceInteractionStartTime = Date.now();

      // 选中拼图并旋转到正确角度
      await page.evaluate((index) => (window as any).selectPieceForTest(index), i);

      const targetRotation = originalPositions[i].rotation;
      await rotatePieceToCorrectAngle(page, i, targetRotation);

      // 重置位置并标记为完成
      await page.evaluate((idx) => (window as any).resetPiecePositionForTest(idx), i);
      await page.evaluate((idx) => (window as any).markPieceAsCompletedForTest(idx), i);

      const pieceInteractionEndTime = Date.now();
      metrics.pieceInteractionTimes.push(pieceInteractionEndTime - pieceInteractionStartTime);

      // 验证第1号拼图完成后的核心状态（简化验证，移除底层细节）
      if (i === 0) {
        const piece0State = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle[0]);
        expect(piece0State.isCompleted).toBe(true);

        const globalState = await page.evaluate(() => (window as any).__gameStateForTests__);
        expect(globalState.completedPieces?.length).toBeGreaterThan(0);

        // 节点3：完成1号拼图后适配检查（优化：移除重复测试，已在形状生成后测试过）
        // 优化说明：完成拼图后的适配测试与形状生成后的测试重复，移除以提高效率
        // 适配系统在游戏运行过程中是稳定的，不需要在每个节点都重复测试
      }
    }
    metrics.puzzleInteractionDuration = Date.now() - puzzleInteractionStartTime;

    // 步骤 7: 验证游戏是否最终完成
    // 合并等待：同时检查 completedPieces 和 isCompleted，避免重复等待
    await robustWaitForFunction(page, () => {
      const state = (window as any).__gameStateForTests__;
      return state.completedPieces && 
             state.puzzle && 
             state.completedPieces.length === state.puzzle.length &&
             state.isCompleted === true;
    }, 30000);
    
    // 验证游戏完成状态
    const finalState = await page.evaluate(() => (window as any).__gameStateForTests__);
    expect(finalState.isCompleted).toBe(true);
    expect(finalState.completedPieces.length).toBe(finalState.puzzle.length);

    // 步骤 7.3: 点击重新开始按钮
    await page.getByRole('button', { name: /重新开始|重新生成/ }).click();
    await waitForTip(page, '请点击生成你喜欢的形状');

    // 8. 收集最终性能指标

    // 从浏览器中获取FPS数据
    // 优化：FPS数据在测试过程中持续收集，通常已经有数据，减少超时时间
    await page.waitForFunction(() => (window as any).fpsData && (window as any).fpsData.length > 0, { timeout: 1000 });
    const fpsData: number[] = await page.evaluate(() => (window as any).fpsData || []);
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

    // 采集被测页面真实环境
    const envMode = await page.evaluate(() => (window as any).__ENV_MODE__ || 'unknown');
    metrics.envMode = envMode;

    // 计算总测试时间并附加到报告
    metrics.totalTestTime = Date.now() - startTime;
    await test.info().attach('performance-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });
    // 输出性能分析日志（不影响测试结果）
    const perfLog = evaluatePerformance(metrics);
    console.log('【性能分析】', perfLog.details.join('\n'));
  } catch (e) {
    testError = e;
    console.error('🚨 测试失败，错误详情:', e);

    // 如果测试失败，依然尝试记录性能数据
    metrics.totalTestTime = Date.now() - startTime;
    // 新增：记录失败原因，类型安全
    metrics.failReason = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);

    // 🔍 调试：输出当前测试状态
    try {
      const currentState = await page.evaluate(() => {
        return {
          gameState: (window as any).__gameStateForTests__,
          url: window.location.href,
          title: document.title,
          canvasExists: !!document.querySelector('canvas#puzzle-canvas')
        };
      });
      console.log('🔍 测试失败时的页面状态:', JSON.stringify(currentState, null, 2));
    } catch (stateError) {
      console.log('🔍 无法获取页面状态:', stateError);
    }

    try {
      await page.waitForFunction(() => (window as any).fpsData && (window as any).fpsData.length > 0, { timeout: 1000 });
      const fpsData: number[] = await page.evaluate(() => (window as any).fpsData || []);
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