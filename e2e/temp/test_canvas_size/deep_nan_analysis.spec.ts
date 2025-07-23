/**
 * 深度分析NaN问题的测试
 * 专门用于找出拼图块坐标变成NaN的具体原因
 */

import { test, expect, Page } from '@playwright/test';

// 辅助函数：导航到页面并确保画布和控制面板可见
async function gotoAndEnsureCanvas(page: Page, initialWidth = 1366, initialHeight = 768) {
  await page.setViewportSize({ width: initialWidth, height: initialHeight });
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('canvas#puzzle-canvas');
}

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 辅助函数：获取详细的拼图状态信息
async function getDetailedPuzzleState(page) {
  return await page.evaluate(() => {
    const state = window.puzzleStore?.getState();
    if (!state) return null;
    
    const analyzePoint = (point, index) => {
      if (!point) return { valid: false, reason: 'point is null/undefined' };
      
      const x = point.x;
      const y = point.y;
      
      return {
        valid: typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y),
        x: x,
        y: y,
        xType: typeof x,
        yType: typeof y,
        xIsNaN: isNaN(x),
        yIsNaN: isNaN(y),
        xIsFinite: isFinite(x),
        yIsFinite: isFinite(y),
        reason: !isFinite(x) ? `x is ${x}` : !isFinite(y) ? `y is ${y}` : 'valid'
      };
    };
    
    const analyzePiece = (piece, index) => {
      if (!piece) return { valid: false, reason: 'piece is null/undefined' };
      
      const centerAnalysis = analyzePoint({ x: piece.x, y: piece.y }, -1);
      const pointsAnalysis = piece.points ? piece.points.map(analyzePoint) : [];
      const invalidPoints = pointsAnalysis.filter(p => !p.valid);
      
      return {
        id: piece.id,
        centerValid: centerAnalysis.valid,
        centerX: piece.x,
        centerY: piece.y,
        centerAnalysis: centerAnalysis,
        pointsCount: piece.points ? piece.points.length : 0,
        validPointsCount: pointsAnalysis.filter(p => p.valid).length,
        invalidPointsCount: invalidPoints.length,
        invalidPoints: invalidPoints.slice(0, 3), // 只显示前3个无效点
        rotation: piece.rotation,
        hasValidPoints: invalidPoints.length === 0 && centerAnalysis.valid
      };
    };
    
    return {
      canvasSize: state.canvasSize,
      scatterCanvasSize: state.scatterCanvasSize,
      puzzleCount: state.puzzle ? state.puzzle.length : 0,
      puzzle: state.puzzle ? state.puzzle.map(analyzePiece) : [],
      timestamp: Date.now()
    };
  });
}

// 辅助函数：获取统一适配引擎的内部状态
async function getAdaptationEngineState(page) {
  return await page.evaluate(() => {
    // 尝试获取适配引擎的调试信息
    const debugInfo = {
      hasUnifiedEngine: typeof window.unifiedAdaptationEngine !== 'undefined',
      lastAdaptationConfig: window.lastAdaptationConfig || null,
      lastAdaptationResult: window.lastAdaptationResult || null,
      adaptationHistory: window.adaptationHistory || []
    };
    
    return debugInfo;
  });
}

// 辅助函数：监听控制台日志中的NaN相关信息
async function setupConsoleLogging(page) {
  const nanLogs = [];
  const adaptationLogs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('NaN') || text.includes('isNaN') || text.includes('not a number')) {
      nanLogs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
    }
    
    if (text.includes('统一适配引擎') || text.includes('UnifiedAdaptationEngine') || text.includes('适配')) {
      adaptationLogs.push({
        type: msg.type(),
        text: text,
        timestamp: Date.now()
      });
    }
  });
  
  return { nanLogs, adaptationLogs };
}

test('深度分析拼图块坐标变成NaN的具体原因', async ({ page }) => {
  console.log('\n🔍 开始深度分析NaN问题...');
  
  // 设置控制台日志监听
  const { nanLogs, adaptationLogs } = await setupConsoleLogging(page);
  
  // 1. 导航到页面
  await gotoAndEnsureCanvas(page);
  
  // 2. 获取初始状态
  console.log('\n📊 获取初始状态...');
  const initialState = await getDetailedPuzzleState(page);
  const initialEngineState = await getAdaptationEngineState(page);
  
  console.log('初始拼图状态:', {
    拼图数量: initialState?.puzzleCount || 0,
    画布尺寸: initialState?.canvasSize,
    散开画布尺寸: initialState?.scatterCanvasSize
  });
  
  if (initialState?.puzzle) {
    const invalidPieces = initialState.puzzle.filter(p => !p.hasValidPoints);
    if (invalidPieces.length > 0) {
      console.log('⚠️ 初始状态就有无效拼图块:', invalidPieces.length);
      invalidPieces.slice(0, 3).forEach((piece, index) => {
        console.log(`  拼图块${piece.id}:`, {
          中心坐标: `(${piece.centerX}, ${piece.centerY})`,
          中心有效: piece.centerValid,
          无效点数: piece.invalidPointsCount,
          分析: piece.centerAnalysis
        });
      });
    }
  }
  
  // 3. 按照正确流程生成拼图
  console.log('\n⏳ 开始生成拼图...');
  
  // 等待提示出现
  await page.waitForFunction(() => {
    const tipElement = document.querySelector('.tip, [class*="tip"], [data-testid="tip"]');
    return tipElement && tipElement.textContent.includes('请点击生成你喜欢的形状');
  }, { timeout: 10000 });
  
  // 生成形状
  console.log('点击云朵形状...');
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  
  // 等待切割类型选择
  await page.waitForFunction(() => {
    const tipElement = document.querySelector('.tip, [class*="tip"], [data-testid="tip"]');
    return tipElement && tipElement.textContent.includes('请选择切割类型');
  }, { timeout: 5000 });
  
  // 选择切割类型
  console.log('选择斜线切割...');
  await page.getByText('斜线').click();
  
  // 等待切割形状提示
  await page.waitForFunction(() => {
    const tipElement = document.querySelector('.tip, [class*="tip"], [data-testid="tip"]');
    return tipElement && tipElement.textContent.includes('请切割形状');
  }, { timeout: 5000 });
  
  // 选择拼图块数量并切割
  console.log('选择8块拼图并切割...');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  
  // 等待散开提示
  await page.waitForFunction(() => {
    const tipElement = document.querySelector('.tip, [class*="tip"], [data-testid="tip"]');
    return tipElement && tipElement.textContent.includes('请散开拼图，开始游戏');
  }, { timeout: 5000 });
  
  // 散开拼图
  console.log('散开拼图...');
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  // 等待拼图散开完成
  await page.waitForFunction(() => {
    const state = window.puzzleStore?.getState();
    return state && state.puzzle && state.puzzle.length > 0 && state.isScattered;
  }, { timeout: 10000 });
  
  console.log('✅ 拼图已生成并散开');
  
  // 4. 获取散开后状态
  const afterScatterState = await getDetailedPuzzleState(page);
  console.log('\n📊 散开后状态:');
  if (afterScatterState?.puzzle) {
    const invalidPieces = afterScatterState.puzzle.filter(p => !p.hasValidPoints);
    console.log(`无效拼图块数量: ${invalidPieces.length}/${afterScatterState.puzzleCount}`);
    
    if (invalidPieces.length > 0) {
      console.log('❌ 散开后发现无效拼图块:');
      invalidPieces.slice(0, 5).forEach((piece, index) => {
        console.log(`  拼图块${piece.id}:`, {
          中心坐标: `(${piece.centerX}, ${piece.centerY})`,
          中心分析: piece.centerAnalysis,
          无效点数: piece.invalidPointsCount,
          前3个无效点: piece.invalidPoints
        });
      });
    }
  }
  
  // 5. 获取当前窗口尺寸
  const currentViewport = await page.viewportSize();
  console.log('\n📐 当前窗口尺寸:', currentViewport);
  
  // 6. 改变窗口大小 - 这是触发NaN问题的关键步骤
  console.log('\n🔄 改变窗口大小...');
  const newViewport = { width: 1200, height: 800 };
  await page.setViewportSize(newViewport);
  
  // 等待适配完成
  await page.waitForTimeout(2000);
  
  // 7. 获取窗口大小变化后的状态
  console.log('\n📊 窗口大小变化后的状态:');
  const afterResizeState = await getDetailedPuzzleState(page);
  const afterResizeEngineState = await getAdaptationEngineState(page);
  
  if (afterResizeState?.puzzle) {
    const invalidPieces = afterResizeState.puzzle.filter(p => !p.hasValidPoints);
    console.log(`无效拼图块数量: ${invalidPieces.length}/${afterResizeState.puzzleCount}`);
    
    if (invalidPieces.length > 0) {
      console.log('❌ 窗口大小变化后发现NaN问题:');
      invalidPieces.slice(0, 5).forEach((piece, index) => {
        console.log(`  拼图块${piece.id}:`, {
          中心坐标: `(${piece.centerX}, ${piece.centerY})`,
          中心分析: piece.centerAnalysis,
          无效点数: piece.invalidPointsCount,
          旋转角度: piece.rotation,
          前3个无效点: piece.invalidPoints.map(p => ({
            坐标: `(${p.x}, ${p.y})`,
            原因: p.reason
          }))
        });
      });
    }
  }
  
  // 8. 分析适配引擎状态变化
  console.log('\n🔧 适配引擎状态分析:');
  console.log('初始引擎状态:', initialEngineState);
  console.log('变化后引擎状态:', afterResizeEngineState);
  
  // 9. 分析控制台日志
  console.log('\n📝 NaN相关日志分析:');
  if (nanLogs.length > 0) {
    console.log(`发现${nanLogs.length}条NaN相关日志:`);
    nanLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
    });
  } else {
    console.log('没有发现NaN相关的控制台日志');
  }
  
  console.log('\n📝 适配相关日志分析:');
  if (adaptationLogs.length > 0) {
    console.log(`发现${adaptationLogs.length}条适配相关日志:`);
    adaptationLogs.slice(-10).forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.type}] ${log.text}`);
    });
  } else {
    console.log('没有发现适配相关的控制台日志');
  }
  
  // 10. 尝试手动触发适配过程来观察问题
  console.log('\n🧪 手动触发适配过程进行观察...');
  
  const manualAdaptationResult = await page.evaluate(() => {
    try {
      const state = window.puzzleStore?.getState();
      if (!state || !state.puzzle || state.puzzle.length === 0) {
        return { error: '没有拼图数据可供分析' };
      }
      
      // 模拟适配过程中的计算
      const scatterCanvasSize = state.scatterCanvasSize;
      const targetCanvasSize = state.canvasSize;
      
      if (!scatterCanvasSize || !targetCanvasSize) {
        return { error: '缺少画布尺寸信息' };
      }
      
      // 检查除法运算
      const scaleX = targetCanvasSize.width / scatterCanvasSize.width;
      const scaleY = targetCanvasSize.height / scatterCanvasSize.height;
      
      // 检查中心点计算
      const originalCenterX = scatterCanvasSize.width / 2;
      const originalCenterY = scatterCanvasSize.height / 2;
      const targetCenterX = targetCanvasSize.width / 2;
      const targetCenterY = targetCanvasSize.height / 2;
      
      // 分析第一个拼图块的计算过程
      const firstPiece = state.puzzle[0];
      const relativeX = firstPiece.x - originalCenterX;
      const relativeY = firstPiece.y - originalCenterY;
      const scaledRelativeX = relativeX * scaleX;
      const scaledRelativeY = relativeY * scaleY;
      const finalX = targetCenterX + scaledRelativeX;
      const finalY = targetCenterY + scaledRelativeY;
      
      return {
        scatterCanvasSize,
        targetCanvasSize,
        scaleX,
        scaleY,
        originalCenter: { x: originalCenterX, y: originalCenterY },
        targetCenter: { x: targetCenterX, y: targetCenterY },
        firstPieceAnalysis: {
          original: { x: firstPiece.x, y: firstPiece.y },
          relative: { x: relativeX, y: relativeY },
          scaledRelative: { x: scaledRelativeX, y: scaledRelativeY },
          final: { x: finalX, y: finalY },
          allFinite: [scaleX, scaleY, originalCenterX, originalCenterY, targetCenterX, targetCenterY, relativeX, relativeY, scaledRelativeX, scaledRelativeY, finalX, finalY].every(v => isFinite(v))
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('手动适配计算结果:', manualAdaptationResult);
  
  // 11. 总结分析结果
  console.log('\n📋 NaN问题分析总结:');
  
  const hasNaNProblem = afterResizeState?.puzzle?.some(p => !p.hasValidPoints) || false;
  
  if (hasNaNProblem) {
    console.log('❌ 确认存在NaN问题');
    
    // 分析可能的原因
    const possibleCauses = [];
    
    if (manualAdaptationResult.error) {
      possibleCauses.push(`计算过程错误: ${manualAdaptationResult.error}`);
    } else if (manualAdaptationResult.firstPieceAnalysis && !manualAdaptationResult.firstPieceAnalysis.allFinite) {
      possibleCauses.push('适配计算过程中出现了非有限数值');
    }
    
    if (!afterResizeState.scatterCanvasSize) {
      possibleCauses.push('缺少散开画布尺寸信息');
    }
    
    if (afterResizeState.scatterCanvasSize && (afterResizeState.scatterCanvasSize.width <= 0 || afterResizeState.scatterCanvasSize.height <= 0)) {
      possibleCauses.push('散开画布尺寸无效');
    }
    
    console.log('可能的原因:', possibleCauses);
    
  } else {
    console.log('✅ 未发现NaN问题');
  }
  
  // 验证测试结果
  expect(hasNaNProblem).toBe(false);
});