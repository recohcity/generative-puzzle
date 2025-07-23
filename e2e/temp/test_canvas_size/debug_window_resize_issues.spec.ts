/**
 * 调试窗口大小变化时的问题
 * 1. 检查是否有执行清空指令
 * 2. 检查拼图块是否离开画布或消失
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

// 辅助函数：获取游戏状态
async function getGameState(page: Page) {
  return page.evaluate(() => (window as any).__gameStateForTests__);
}

// 辅助函数：获取拼图块位置和边界信息
async function getPuzzlePiecesInfo(page: Page) {
  return page.evaluate(() => {
    const state = (window as any).__gameStateForTests__;
    if (!state.puzzle) return [];
    
    // 尝试多种方式获取画布尺寸
    let canvasWidth = state.canvasWidth || 0;
    let canvasHeight = state.canvasHeight || 0;
    
    // 如果状态中没有，尝试从DOM获取
    if (!canvasWidth || !canvasHeight) {
      const canvas = document.getElementById('puzzle-canvas') as HTMLCanvasElement;
      if (canvas) {
        canvasWidth = canvas.width || canvas.clientWidth || 0;
        canvasHeight = canvas.height || canvas.clientHeight || 0;
      }
    }
    
    console.log(`画布尺寸获取: state=${state.canvasWidth}x${state.canvasHeight}, DOM=${canvasWidth}x${canvasHeight}`);
    
    return state.puzzle.map((piece: any, index: number) => {
      // 计算拼图块边界
      let bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      
      // 检查拼图块是否有有效的点数据
      if (!piece.points || !Array.isArray(piece.points) || piece.points.length === 0) {
        console.log(`⚠️ 拼图块${index}没有有效的点数据:`, piece.points);
        bounds = { minX: NaN, maxX: NaN, minY: NaN, maxY: NaN };
      } else {
        // 计算边界，同时检查每个点是否有效
        for (const point of piece.points) {
          if (point && typeof point.x === 'number' && typeof point.y === 'number' && 
              isFinite(point.x) && isFinite(point.y)) {
            bounds.minX = Math.min(bounds.minX, point.x);
            bounds.maxX = Math.max(bounds.maxX, point.x);
            bounds.minY = Math.min(bounds.minY, point.y);
            bounds.maxY = Math.max(bounds.maxY, point.y);
          } else {
            console.log(`⚠️ 拼图块${index}包含无效点:`, point);
          }
        }
        
        // 如果没有有效点，设置为NaN
        if (bounds.minX === Infinity) {
          bounds = { minX: NaN, maxX: NaN, minY: NaN, maxY: NaN };
        }
      }
      
      return {
        index,
        centerX: piece.x,
        centerY: piece.y,
        bounds,
        isOutOfBounds: {
          left: bounds.minX < 0,
          right: bounds.maxX > canvasWidth,
          top: bounds.minY < 0,
          bottom: bounds.maxY > canvasHeight
        },
        canvasSize: { width: canvasWidth, height: canvasHeight }
      };
    });
  });
}

// 辅助函数：监听控制台日志
function setupConsoleListener(page: Page) {
  const consoleLogs: string[] = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    
    // 实时输出重要的调试信息
    if (text.includes('clearRect') || 
        text.includes('清空') || 
        text.includes('clear') ||
        text.includes('reset') ||
        text.includes('边界') ||
        text.includes('bounds') ||
        text.includes('超出')) {
      console.log(`[浏览器] ${text}`);
    }
  });
  
  return consoleLogs;
}

test('检查窗口大小变化时的清空指令和拼图块边界问题', async ({ page }) => {
  // 设置控制台监听
  const consoleLogs = setupConsoleListener(page);
  
  // 1. 导航到页面
  await gotoAndEnsureCanvas(page);
  await waitForTip(page, '请点击生成你喜欢的形状');
  
  // 2. 生成形状
  await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
  await waitForTip(page, '请选择切割类型');
  
  // 3. 生成拼图
  await page.getByText('斜线').click();
  await waitForTip(page, '请切割形状');
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
  await waitForTip(page, '请散开拼图，开始游戏');
  
  // 4. 散开拼图
  await page.getByRole('button', { name: '散开拼图' }).click();
  
  // 等待拼图散开
  await page.waitForFunction(() => {
    const state = (window as any).__gameStateForTests__;
    return state && state.isScattered === true;
  });
  
  // 5. 记录窗口调整前的状态
  const beforeResizeState = await getGameState(page);
  const beforeResizePieces = await getPuzzlePiecesInfo(page);
  
  console.log('窗口调整前的拼图块信息:');
  beforeResizePieces.forEach((piece, index) => {
    console.log(`拼图块${index}: 中心(${piece.centerX.toFixed(1)}, ${piece.centerY.toFixed(1)}), 边界(${piece.bounds.minX.toFixed(1)}, ${piece.bounds.minY.toFixed(1)}, ${piece.bounds.maxX.toFixed(1)}, ${piece.bounds.maxY.toFixed(1)})`);
    if (piece.isOutOfBounds.left || piece.isOutOfBounds.right || piece.isOutOfBounds.top || piece.isOutOfBounds.bottom) {
      console.log(`  ⚠️ 拼图块${index}超出边界: 左=${piece.isOutOfBounds.left}, 右=${piece.isOutOfBounds.right}, 上=${piece.isOutOfBounds.top}, 下=${piece.isOutOfBounds.bottom}`);
    }
  });
  
  // 保存窗口调整前的截图
  await page.screenshot({ path: 'debug-before-resize.png' });
  
  // 6. 改变浏览器窗口大小
  console.log('开始改变窗口大小...');
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(2000); // 等待调整完成和可能的重绘
  
  // 保存窗口调整后的截图
  await page.screenshot({ path: 'debug-after-resize.png' });
  
  // 7. 记录窗口调整后的状态
  const afterResizeState = await getGameState(page);
  const afterResizePieces = await getPuzzlePiecesInfo(page);
  
  console.log('窗口调整后的拼图块信息:');
  afterResizePieces.forEach((piece, index) => {
    console.log(`拼图块${index}: 中心(${piece.centerX.toFixed(1)}, ${piece.centerY.toFixed(1)}), 边界(${piece.bounds.minX.toFixed(1)}, ${piece.bounds.minY.toFixed(1)}, ${piece.bounds.maxX.toFixed(1)}, ${piece.bounds.maxY.toFixed(1)})`);
    if (piece.isOutOfBounds.left || piece.isOutOfBounds.right || piece.isOutOfBounds.top || piece.isOutOfBounds.bottom) {
      console.log(`  ⚠️ 拼图块${index}超出边界: 左=${piece.isOutOfBounds.left}, 右=${piece.isOutOfBounds.right}, 上=${piece.isOutOfBounds.top}, 下=${piece.isOutOfBounds.bottom}`);
    }
  });
  
  // 8. 分析控制台日志
  console.log('\n📋 相关控制台日志:');
  const relevantLogs = consoleLogs.filter(log => 
    log.includes('clearRect') || 
    log.includes('清空') || 
    log.includes('clear') ||
    log.includes('reset') ||
    log.includes('边界') ||
    log.includes('bounds') ||
    log.includes('超出') ||
    log.includes('适配') ||
    log.includes('resize')
  );
  
  relevantLogs.forEach(log => console.log(`  ${log}`));
  
  // 9. 验证结果
  
  // 验证拼图块数量没有变化
  expect(afterResizeState.puzzle.length).toBe(beforeResizeState.puzzle.length);
  console.log(`✅ 拼图块数量保持不变: ${afterResizeState.puzzle.length}`);
  
  // 检查是否有拼图块超出边界
  const outOfBoundsPieces = afterResizePieces.filter(piece => 
    piece.isOutOfBounds.left || piece.isOutOfBounds.right || 
    piece.isOutOfBounds.top || piece.isOutOfBounds.bottom
  );
  
  if (outOfBoundsPieces.length > 0) {
    console.log(`❌ 发现${outOfBoundsPieces.length}个拼图块超出边界:`);
    outOfBoundsPieces.forEach(piece => {
      console.log(`  拼图块${piece.index}: 画布尺寸=${piece.canvasSize.width}x${piece.canvasSize.height}`);
      console.log(`    边界: (${piece.bounds.minX.toFixed(1)}, ${piece.bounds.minY.toFixed(1)}) - (${piece.bounds.maxX.toFixed(1)}, ${piece.bounds.maxY.toFixed(1)})`);
    });
  } else {
    console.log('✅ 所有拼图块都在画布边界内');
  }
  
  // 检查是否有清空相关的日志
  const clearLogs = consoleLogs.filter(log => 
    log.includes('clearRect') || 
    log.includes('清空') || 
    log.includes('clear')
  );
  
  if (clearLogs.length > 0) {
    console.log(`📝 发现${clearLogs.length}条清空相关日志`);
  } else {
    console.log('📝 没有发现明显的清空相关日志');
  }
  
  // 验证拼图块没有消失（所有拼图块都有有效的坐标）
  const validPieces = afterResizePieces.filter(piece => 
    isFinite(piece.centerX) && isFinite(piece.centerY) &&
    isFinite(piece.bounds.minX) && isFinite(piece.bounds.maxX) &&
    isFinite(piece.bounds.minY) && isFinite(piece.bounds.maxY)
  );
  
  expect(validPieces.length).toBe(afterResizePieces.length);
  console.log(`✅ 所有拼图块都有有效坐标: ${validPieces.length}/${afterResizePieces.length}`);
  
  // 10. 测试拼图块是否仍然可以交互
  try {
    // 尝试选择第一个拼图块
    await page.evaluate((index) => (window as any).selectPieceForTest(index), 0);
    
    const selectedPiece = await page.evaluate(() => (window as any).__gameStateForTests__.selectedPiece);
    console.log(`拼图块交互测试: 选择结果=${selectedPiece}`);
    
    if (selectedPiece !== undefined) {
      console.log('✅ 拼图块仍然可以交互');
    } else {
      console.log('⚠️ 拼图块交互可能有问题');
    }
  } catch (error) {
    console.log('❌ 拼图块交互测试失败:', error);
  }
  
  // 最终总结
  console.log('\n📊 测试总结:');
  console.log(`- 拼图块数量: ${beforeResizeState.puzzle.length} → ${afterResizeState.puzzle.length}`);
  console.log(`- 超出边界的拼图块: ${outOfBoundsPieces.length}`);
  console.log(`- 清空相关日志: ${clearLogs.length}条`);
  console.log(`- 画布尺寸变化: ${beforeResizePieces[0]?.canvasSize.width}x${beforeResizePieces[0]?.canvasSize.height} → ${afterResizePieces[0]?.canvasSize.width}x${afterResizePieces[0]?.canvasSize.height}`);
});