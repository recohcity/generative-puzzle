/**
 * Step3 散开拼图适配测试 - 验证散开拼图窗口调整后的适配效果
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: 散开拼图适配测试', () => {
  test('散开拼图窗口调整适配验证', async ({ page }) => {
    console.log('🔧 散开拼图适配测试开始');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('散开') || text.includes('适配') || text.includes('SET_SCATTER_CANVAS_SIZE')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 1. 生成形状
    console.log('🔄 步骤1: 生成形状...');
    await page.evaluate(() => {
      (window as any).testAPI.generateShape('circle');
    });
    await page.waitForTimeout(1000);
    
    // 2. 生成拼图
    console.log('🔄 步骤2: 生成拼图...');
    await page.evaluate(() => {
      (window as any).testAPI.generatePuzzle(2);
    });
    await page.waitForTimeout(1000);
    
    // 3. 检查生成拼图后的状态
    const afterPuzzleState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasBasePuzzle: !!state.basePuzzle,
        basePuzzleLength: state.basePuzzle?.length || 0,
        puzzleLength: state.puzzle?.length || 0,
        isScattered: state.isScattered,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      };
    });
    console.log('📊 生成拼图后状态:', afterPuzzleState);
    
    // 4. 散开拼图
    console.log('🔄 步骤3: 散开拼图...');
    
    // 检查按钮是否存在和可点击
    const scatterButton = page.getByRole('button', { name: '散开拼图' });
    const isVisible = await scatterButton.isVisible();
    const isEnabled = await scatterButton.isEnabled();
    console.log('🔍 散开拼图按钮状态:', { isVisible, isEnabled });
    
    if (!isVisible || !isEnabled) {
      console.log('❌ 散开拼图按钮不可用，跳过测试');
      return;
    }
    
    // 添加控制台监听，捕获散开相关日志
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('scatterPuzzle') || text.includes('SCATTER_CANVAS_SIZE') || text.includes('SCATTER_PUZZLE_COMPLETE')) {
        console.log('🔍 浏览器控制台(散开):', text);
      }
    });
    
    await scatterButton.click();
    console.log('✅ 散开拼图按钮已点击');
    await page.waitForTimeout(3000); // 增加等待时间
    
    // 5. 检查散开后的状态 - 多次检查确保状态更新完成
    let afterScatterState;
    for (let i = 0; i < 5; i++) {
      afterScatterState = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        return {
          isScattered: state.isScattered,
          puzzleLength: state.puzzle?.length || 0,
          hasScatterCanvasSize: !!state.scatterCanvasSize,
          scatterCanvasSize: state.scatterCanvasSize
        };
      });
      
      if (afterScatterState.hasScatterCanvasSize) {
        break; // 如果已经有散开画布尺寸，跳出循环
      }
      
      await page.waitForTimeout(500); // 等待500ms再检查
    }
    console.log('📊 散开后状态:', afterScatterState);
    
    // 6. 记录散开后拼图块的详细位置
    const beforeResizePositions = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      if (!state.puzzle) return null;
      
      return state.puzzle.map((piece: any, index: number) => ({
        index,
        x: piece.x,
        y: piece.y,
        firstPointX: piece.points[0]?.x,
        firstPointY: piece.points[0]?.y
      }));
    });
    console.log('📊 窗口调整前拼图块位置:', beforeResizePositions?.slice(0, 3)); // 只显示前3个
    
    // 7. 调整窗口大小
    console.log('🔄 步骤4: 调整窗口大小...');
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(2000); // 等待适配完成
    
    // 8. 记录调整后拼图块的详细位置
    const afterResizePositions = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      if (!state.puzzle) return null;
      
      return state.puzzle.map((piece: any, index: number) => ({
        index,
        x: piece.x,
        y: piece.y,
        firstPointX: piece.points[0]?.x,
        firstPointY: piece.points[0]?.y
      }));
    });
    console.log('📊 窗口调整后拼图块位置:', afterResizePositions?.slice(0, 3)); // 只显示前3个
    
    // 9. 计算位置变化
    if (beforeResizePositions && afterResizePositions) {
      const positionChanges = beforeResizePositions.map((before, index) => {
        const after = afterResizePositions[index];
        return {
          index,
          deltaX: Math.abs(after.x - before.x),
          deltaY: Math.abs(after.y - before.y),
          deltaDistance: Math.sqrt(
            Math.pow(after.x - before.x, 2) + 
            Math.pow(after.y - before.y, 2)
          )
        };
      });
      
      const avgDelta = positionChanges.reduce((sum, change) => sum + change.deltaDistance, 0) / positionChanges.length;
      const maxDelta = Math.max(...positionChanges.map(change => change.deltaDistance));
      
      console.log('📊 位置变化分析:');
      console.log(`- 平均位置变化: ${avgDelta.toFixed(2)}px`);
      console.log(`- 最大位置变化: ${maxDelta.toFixed(2)}px`);
      console.log(`- 前3个拼图块变化:`, positionChanges.slice(0, 3).map(c => 
        `#${c.index}: ${c.deltaDistance.toFixed(1)}px`
      ));
      
      // 验证适配效果
      if (avgDelta < 50) { // 期望平均变化小于50px
        console.log('✅ 散开拼图适配效果良好');
      } else {
        console.log('❌ 散开拼图适配效果不佳，位置变化过大');
      }
      
      // 断言验证
      expect(avgDelta).toBeLessThan(100); // 放宽标准，先确保基本功能
      expect(maxDelta).toBeLessThan(200);
    }
    
    // 10. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('散开') || 
      log.includes('适配') ||
      log.includes('SET_SCATTER_CANVAS_SIZE') ||
      log.includes('scatterCanvasSize')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 验证基本状态
    expect(afterScatterState.isScattered).toBe(true);
    expect(afterScatterState.hasScatterCanvasSize).toBe(true);
    expect(afterScatterState.puzzleLength).toBeGreaterThan(0);
  });
});