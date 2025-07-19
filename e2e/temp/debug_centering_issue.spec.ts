import { test, expect } from '@playwright/test';

test.describe('形状居中问题调试', () => {
  test('调试形状居中问题', async ({ page }) => {
    console.log('🚀 开始形状居中问题调试');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      // 实时输出重要的调试信息
      if (text.includes('🔧') || text.includes('📊 适配结果分析') || text.includes('记忆系统返回')) {
        console.log(`[浏览器] ${text}`);
      }
    });
    
    // 设置初始窗口大小
    await page.setViewportSize({ width: 800, height: 600 });
    
    // 导航到页面
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 等待画布加载
    const canvas = page.locator('#puzzle-canvas');
    await expect(canvas).toBeVisible();
    
    // 点击多边形按钮生成形状
    const polygonButton = page.locator('button:has-text("多边形")');
    await expect(polygonButton).toBeVisible();
    await polygonButton.click();
    
    console.log('🎯 点击多边形按钮生成形状');
    
    // 等待形状生成
    await page.waitForTimeout(2000);
    
    // 记录初始状态
    const initialState = await captureShapeState(page, '初始状态');
    console.log('📊 初始状态:', JSON.stringify(initialState, null, 2));
    
    // 改变窗口大小
    console.log('\n🔄 开始改变窗口大小到 1200x800');
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 等待适配完成
    await page.waitForTimeout(3000);
    
    // 记录适配后状态
    const adaptedState = await captureShapeState(page, '适配后状态');
    console.log('📊 适配后状态:', JSON.stringify(adaptedState, null, 2));
    
    // 分析居中问题
    if (adaptedState) {
      const centerOffset = Math.sqrt(
        Math.pow(adaptedState.shapeCenter.x - adaptedState.canvasCenter.x, 2) + 
        Math.pow(adaptedState.shapeCenter.y - adaptedState.canvasCenter.y, 2)
      );
      
      console.log('\n🔍 居中分析:');
      console.log(`画布中心: (${adaptedState.canvasCenter.x}, ${adaptedState.canvasCenter.y})`);
      console.log(`形状中心: (${adaptedState.shapeCenter.x.toFixed(1)}, ${adaptedState.shapeCenter.y.toFixed(1)})`);
      console.log(`中心偏移: ${centerOffset.toFixed(1)}px`);
      console.log(`直径比例: ${(adaptedState.diameterRatio * 100).toFixed(1)}%`);
      
      if (centerOffset > 10) {
        console.log('❌ 形状没有正确居中！');
      } else {
        console.log('✅ 形状居中正常');
      }
      
      if (adaptedState.diameterRatio < 0.25 || adaptedState.diameterRatio > 0.35) {
        console.log('❌ 形状大小比例不正确！应该约为30%');
      } else {
        console.log('✅ 形状大小比例正常');
      }
    }
    
    // 输出相关的调试日志
    console.log('\n📋 记忆系统相关日志:');
    const memoryLogs = consoleLogs.filter(log => 
      log.includes('记忆系统') || 
      log.includes('🔧') ||
      log.includes('适配结果分析')
    );
    
    memoryLogs.slice(-10).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });
    
    console.log('✅ 形状居中问题调试完成');
  });
  
  // 捕获形状状态的辅助函数
  async function captureShapeState(page: any, label: string) {
    try {
      const state = await page.evaluate(() => {
        const canvas = document.querySelector('#puzzle-canvas') as HTMLCanvasElement;
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
        
        // 检查画布内容
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        
        // 找到形状边界
        let minX = canvasWidth, maxX = 0, minY = canvasHeight, maxY = 0;
        let pixelCount = 0;
        
        for (let y = 0; y < canvasHeight; y++) {
          for (let x = 0; x < canvasWidth; x++) {
            const index = (y * canvasWidth + x) * 4;
            const alpha = imageData.data[index + 3];
            
            if (alpha > 0) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
              pixelCount++;
            }
          }
        }
        
        if (pixelCount === 0) return null;
        
        const shapeWidth = maxX - minX;
        const shapeHeight = maxY - minY;
        const shapeDiameter = Math.max(shapeWidth, shapeHeight);
        const shapeCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        const diameterRatio = shapeDiameter / Math.min(canvasWidth, canvasHeight);
        
        return {
          canvasSize: { width: canvasWidth, height: canvasHeight },
          shapeBounds: { minX, maxX, minY, maxY },
          shapeSize: { width: shapeWidth, height: shapeHeight },
          shapeDiameter,
          shapeCenter,
          canvasCenter,
          diameterRatio,
          pixelCount
        };
      });
      
      return state;
    } catch (error) {
      console.error(`捕获状态失败 (${label}):`, error);
      return null;
    }
  }
});