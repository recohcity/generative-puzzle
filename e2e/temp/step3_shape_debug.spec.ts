/**
 * Step3 形状生成调试测试 - 调试为什么形状没有生成
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: 形状生成调试测试', () => {
  test('调试形状生成问题', async ({ page }) => {
    console.log('🔧 形状生成调试测试');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('形状') || text.includes('generateShape') || text.includes('SET_SHAPE_TYPE') || text.includes('SET_ORIGINAL_SHAPE')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 1. 检查初始状态
    console.log('🔄 步骤1: 检查初始状态...');
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        hasBaseShape: state.baseShape?.length > 0,
        baseShapeLength: state.baseShape?.length || 0,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        shapeType: state.shapeType
      };
    });
    console.log('📊 初始状态:', initialState);
    
    // 2. 检查testAPI是否存在
    console.log('🔄 步骤2: 检查testAPI...');
    const testAPIInfo = await page.evaluate(() => {
      return {
        hasTestAPI: !!(window as any).testAPI,
        hasGenerateShape: typeof (window as any).testAPI?.generateShape === 'function',
        testAPIKeys: Object.keys((window as any).testAPI || {})
      };
    });
    console.log('📊 testAPI信息:', testAPIInfo);
    
    // 3. 尝试调用testAPI.generateShape
    console.log('🔄 步骤3: 调用testAPI.generateShape...');
    const generateShapeResult = await page.evaluate(() => {
      try {
        console.log('🔧 准备调用testAPI.generateShape("circle")');
        (window as any).testAPI.generateShape('circle');
        console.log('🔧 testAPI.generateShape调用完成');
        return { success: true };
      } catch (error) {
        console.error('🔧 testAPI.generateShape调用失败:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('📊 generateShape调用结果:', generateShapeResult);
    
    // 等待一下让状态更新
    await page.waitForTimeout(2000);
    
    // 4. 检查调用后的状态
    console.log('🔄 步骤4: 检查调用后状态...');
    const afterGenerateState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        hasBaseShape: state.baseShape?.length > 0,
        baseShapeLength: state.baseShape?.length || 0,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        shapeType: state.shapeType
      };
    });
    console.log('📊 调用后状态:', afterGenerateState);
    
    // 5. 尝试手动调用generateShape函数
    console.log('🔄 步骤5: 尝试手动调用generateShape函数...');
    const manualGenerateResult = await page.evaluate(() => {
      try {
        // 检查是否有generateShape函数
        const gameContext = (window as any).__gameContext__;
        if (gameContext && typeof gameContext.generateShape === 'function') {
          console.log('🔧 找到gameContext.generateShape，准备调用');
          gameContext.generateShape('circle');
          return { success: true, method: 'gameContext' };
        }
        
        // 尝试直接调用
        if (typeof (window as any).generateShape === 'function') {
          console.log('🔧 找到window.generateShape，准备调用');
          (window as any).generateShape('circle');
          return { success: true, method: 'window' };
        }
        
        return { success: false, reason: 'generateShape function not found' };
      } catch (error) {
        console.error('🔧 手动调用generateShape失败:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('📊 手动调用结果:', manualGenerateResult);
    
    // 等待一下
    await page.waitForTimeout(1000);
    
    // 6. 最终状态检查
    const finalState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        hasBaseShape: state.baseShape?.length > 0,
        baseShapeLength: state.baseShape?.length || 0,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        shapeType: state.shapeType
      };
    });
    console.log('📊 最终状态:', finalState);
    
    // 7. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('形状') || 
      log.includes('generateShape') || 
      log.includes('SET_SHAPE_TYPE') ||
      log.includes('SET_ORIGINAL_SHAPE') ||
      log.includes('SET_BASE_SHAPE')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 验证测试结果 - 至少应该设置了shapeType
    expect(finalState.shapeType).toBe('circle');
  });
});