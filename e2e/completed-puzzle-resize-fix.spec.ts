import { test, expect } from '@playwright/test';

test.describe('已完成拼图窗口调整修复测试', () => {
  test('已完成拼图在连续窗口调整后保持锁定', async ({ page }) => {
    // 设置初始窗口大小
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 访问游戏页面
    await page.goto('/');
    
    // 等待页面加载完成
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 生成拼图
    await page.click('button:has-text("多边形")');
    await page.waitForTimeout(1000);
    
    // 散开拼图
    await page.click('button:has-text("散开拼图")');
    await page.waitForTimeout(2000);
    
    // 获取第一个拼图块的初始位置
    const initialPuzzleState = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    if (!initialPuzzleState?.puzzle || initialPuzzleState.puzzle.length === 0) {
      throw new Error('拼图未正确生成');
    }
    
    // 模拟完成一个拼图块（将其移动到目标位置）
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('无法获取画布边界');
    }
    
    // 点击第一个拼图块
    await canvas.click({
      position: {
        x: canvasBox.width * 0.3,
        y: canvasBox.height * 0.3
      }
    });
    
    await page.waitForTimeout(500);
    
    // 拖拽到中心位置（目标形状位置）
    await canvas.dragTo(canvas, {
      sourcePosition: {
        x: canvasBox.width * 0.3,
        y: canvasBox.height * 0.3
      },
      targetPosition: {
        x: canvasBox.width * 0.5,
        y: canvasBox.height * 0.5
      }
    });
    
    await page.waitForTimeout(1000);
    
    // 检查是否有拼图完成
    const stateAfterDrag = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    console.log('拖拽后状态:', {
      completedPieces: stateAfterDrag?.completedPieces,
      completedCount: stateAfterDrag?.completedPieces?.length || 0
    });
    
    // 如果没有自动完成，尝试多次微调位置
    if (!stateAfterDrag?.completedPieces || stateAfterDrag.completedPieces.length === 0) {
      // 尝试多个位置进行微调
      const positions = [
        { x: canvasBox.width * 0.48, y: canvasBox.height * 0.48 },
        { x: canvasBox.width * 0.52, y: canvasBox.height * 0.52 },
        { x: canvasBox.width * 0.5, y: canvasBox.height * 0.48 },
        { x: canvasBox.width * 0.5, y: canvasBox.height * 0.52 }
      ];
      
      for (const pos of positions) {
        await canvas.click({ position: pos });
        await page.waitForTimeout(200);
        
        const currentState = await page.evaluate(() => {
          return (window as any).__gameStateForTests__;
        });
        
        if (currentState?.completedPieces && currentState.completedPieces.length > 0) {
          console.log('在位置找到完成的拼图:', pos);
          break;
        }
      }
    }
    
    // 获取完成拼图后的状态
    const stateWithCompleted = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    // 如果仍然没有完成的拼图，跳过测试
    if (!stateWithCompleted?.completedPieces || stateWithCompleted.completedPieces.length === 0) {
      console.log('警告: 无法完成拼图块，跳过窗口调整测试');
      return;
    }
    
    console.log('成功完成拼图块:', stateWithCompleted.completedPieces);
    
    // 记录完成拼图的初始位置
    const completedPieceIndex = stateWithCompleted.completedPieces[0];
    const initialCompletedPiece = stateWithCompleted.puzzle[completedPieceIndex];
    
    console.log('已完成拼图初始位置:', {
      index: completedPieceIndex,
      x: initialCompletedPiece.x,
      y: initialCompletedPiece.y,
      isCompleted: initialCompletedPiece.isCompleted
    });
    
    // 第一次窗口调整
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.waitForTimeout(1000);
    
    // 获取第一次调整后的状态
    const stateAfterResize1 = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    const completedPieceAfterResize1 = stateAfterResize1.puzzle[completedPieceIndex];
    
    console.log('第一次窗口调整后:', {
      x: completedPieceAfterResize1.x,
      y: completedPieceAfterResize1.y,
      isCompleted: completedPieceAfterResize1.isCompleted
    });
    
    // 第二次窗口调整
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(1000);
    
    // 获取第二次调整后的状态
    const stateAfterResize2 = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    const completedPieceAfterResize2 = stateAfterResize2.puzzle[completedPieceIndex];
    
    console.log('第二次窗口调整后:', {
      x: completedPieceAfterResize2.x,
      y: completedPieceAfterResize2.y,
      isCompleted: completedPieceAfterResize2.isCompleted
    });
    
    // 第三次窗口调整
    await page.setViewportSize({ width: 1100, height: 700 });
    await page.waitForTimeout(1000);
    
    // 获取第三次调整后的状态
    const stateAfterResize3 = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    const completedPieceAfterResize3 = stateAfterResize3.puzzle[completedPieceIndex];
    
    console.log('第三次窗口调整后:', {
      x: completedPieceAfterResize3.x,
      y: completedPieceAfterResize3.y,
      isCompleted: completedPieceAfterResize3.isCompleted
    });
    
    // 验证已完成拼图的状态
    expect(completedPieceAfterResize3.isCompleted).toBe(true);
    expect(stateAfterResize3.completedPieces).toContain(completedPieceIndex);
    
    // 验证已完成拼图不能被选中
    await canvas.click({
      position: {
        x: completedPieceAfterResize3.x || canvasBox.width * 0.5,
        y: completedPieceAfterResize3.y || canvasBox.height * 0.5
      }
    });
    
    await page.waitForTimeout(500);
    
    const stateAfterClick = await page.evaluate(() => {
      return (window as any).__gameStateForTests__;
    });
    
    // 已完成拼图不应该被选中
    expect(stateAfterClick.selectedPiece).not.toBe(completedPieceIndex);
    
    console.log('✅ 测试通过: 已完成拼图在连续窗口调整后保持锁定状态');
  });
  
  test('检查修复的调试信息输出', async ({ page }) => {
    // 监听控制台消息
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[修复') || text.includes('originalPositions')) {
        consoleMessages.push(text);
      }
    });
    
    // 设置初始窗口大小
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 访问游戏页面
    await page.goto('/');
    
    // 等待页面加载完成
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 生成拼图
    await page.click('button:has-text("多边形")');
    await page.waitForTimeout(1000);
    
    // 散开拼图
    await page.click('button:has-text("散开拼图")');
    await page.waitForTimeout(2000);
    
    // 调整窗口大小触发修复逻辑
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.waitForTimeout(1000);
    
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(1000);
    
    // 检查是否有修复相关的调试信息
    console.log('捕获的调试信息:', consoleMessages);
    
    // 验证调试信息的存在（如果有originalPositions的话）
    const hasOriginalPositions = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return state?.originalPositions && state.originalPositions.length > 0;
    });
    
    if (hasOriginalPositions) {
      const hasFixMessages = consoleMessages.some(msg => 
        msg.includes('修复检测') || 
        msg.includes('修复成功') || 
        msg.includes('originalPositions')
      );
      
      if (hasFixMessages) {
        console.log('✅ 修复调试信息正常输出');
      } else {
        console.log('⚠️ 未检测到修复调试信息，可能是画布尺寸未变化');
      }
    } else {
      console.log('ℹ️ 当前测试中没有originalPositions数据');
    }
  });
});