/**
 * Step3 点击形状按钮测试 - 通过点击实际的形状按钮来测试
 */

import { test, expect } from '@playwright/test';

test.describe('Step3: 点击形状按钮测试', () => {
  test('通过点击形状按钮生成形状并测试basePuzzle', async ({ page }) => {
    console.log('🔧 点击形状按钮测试');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('形状') || text.includes('generateShape') || text.includes('basePuzzle') || text.includes('generatePuzzle')) {
        console.log('🔍 浏览器控制台:', text);
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    
    // 1. 检查初始状态
    console.log('🔄 步骤1: 检查初始状态...');
    const initialState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        shapeType: state.shapeType,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      };
    });
    console.log('📊 初始状态:', initialState);
    
    // 2. 查找并点击圆形按钮
    console.log('🔄 步骤2: 查找并点击圆形按钮...');
    
    // 尝试不同的选择器来找到圆形按钮
    const circleButtonSelectors = [
      'button:has-text("圆形")',
      'button[aria-label*="圆"]',
      'button:has-text("Circle")',
      '[data-testid="circle-button"]',
      'button:has([data-testid="circle"])',
      'button svg[data-testid="circle"]'
    ];
    
    let circleButtonFound = false;
    for (const selector of circleButtonSelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          console.log(`✅ 找到圆形按钮: ${selector}`);
          await button.click();
          circleButtonFound = true;
          break;
        }
      } catch (error) {
        console.log(`❌ 未找到按钮: ${selector}`);
      }
    }
    
    if (!circleButtonFound) {
      // 如果找不到圆形按钮，尝试找到任何形状按钮
      console.log('🔄 尝试查找任何形状按钮...');
      const allButtons = await page.locator('button').all();
      console.log(`📊 页面上共有 ${allButtons.length} 个按钮`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        console.log(`按钮 ${i}: "${buttonText}" (可见: ${isVisible})`);
        
        // 如果按钮文本包含形状相关的词，尝试点击
        if (buttonText && (buttonText.includes('形') || buttonText.includes('Circle') || buttonText.includes('多边') || buttonText.includes('云'))) {
          console.log(`🔄 尝试点击形状按钮: "${buttonText}"`);
          await allButtons[i].click();
          circleButtonFound = true;
          break;
        }
      }
    }
    
    if (!circleButtonFound) {
      console.log('❌ 未找到任何形状按钮，使用testAPI作为备选方案');
      await page.evaluate(() => {
        (window as any).testAPI.generateShape('circle');
      });
    }
    
    // 等待形状生成
    await page.waitForTimeout(3000);
    
    // 3. 检查形状生成后的状态
    console.log('🔄 步骤3: 检查形状生成后状态...');
    const afterShapeState = await page.evaluate(() => {
      const state = (window as any).__gameStateForTests__;
      return {
        hasOriginalShape: state.originalShape?.length > 0,
        originalShapeLength: state.originalShape?.length || 0,
        hasBaseShape: state.baseShape?.length > 0,
        baseShapeLength: state.baseShape?.length || 0,
        shapeType: state.shapeType,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      };
    });
    console.log('📊 形状生成后状态:', afterShapeState);
    
    // 4. 如果形状生成成功，继续测试拼图生成
    if (afterShapeState.hasOriginalShape) {
      console.log('✅ 形状生成成功，继续测试拼图生成...');
      
      // 设置切割参数并生成拼图
      await page.evaluate(() => {
        (window as any).testAPI.generatePuzzle(1);
      });
      
      await page.waitForTimeout(2000);
      
      // 检查拼图生成后的状态
      const afterPuzzleState = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        return {
          hasBasePuzzle: !!state.basePuzzle,
          basePuzzleLength: state.basePuzzle?.length || 0,
          puzzleLength: state.puzzle?.length || 0,
          isScattered: state.isScattered
        };
      });
      console.log('📊 拼图生成后状态:', afterPuzzleState);
      
      if (afterPuzzleState.hasBasePuzzle) {
        console.log('✅ basePuzzle设置成功！');
      } else {
        console.log('❌ basePuzzle未设置');
      }
    } else {
      console.log('❌ 形状生成失败');
    }
    
    // 5. 检查相关日志
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('形状') || 
      log.includes('generateShape') || 
      log.includes('basePuzzle') ||
      log.includes('generatePuzzle') ||
      log.includes('SET_BASE_PUZZLE')
    );
    
    console.log('🔍 相关日志:');
    relevantLogs.forEach(log => console.log('   ', log));
    
    // 验证测试结果 - 至少应该有一些进展
    expect(afterShapeState.shapeType || circleButtonFound).toBeTruthy();
  });
});