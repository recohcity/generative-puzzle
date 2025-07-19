import { test, expect } from '@playwright/test';

test.describe('综合形状适配测试', () => {
  test('验证形状在窗口大小变化时的动态适配', async ({ page }) => {
    console.log('🚀 开始综合形状适配测试');
    
    // 设置初始窗口大小
    await page.setViewportSize({ width: 800, height: 600 });
    
    // 导航到页面
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 等待画布加载 - 使用具体的puzzle canvas
    const canvas = page.locator('#puzzle-canvas');
    await expect(canvas).toBeVisible();
    
    console.log('✅ 页面加载完成，画布可见');
    
    // 点击多边形按钮生成形状
    const polygonButton = page.locator('button:has-text("多边形")');
    await expect(polygonButton).toBeVisible();
    await polygonButton.click();
    
    console.log('🎯 点击多边形按钮生成形状');
    
    // 等待形状生成
    await page.waitForTimeout(2000);
    
    // 验证初始状态
    await verifyShapeAdaptation(page, '初始状态 (800x600)');
    
    // 测试不同的窗口大小
    const testSizes = [
      { width: 1200, height: 800, name: '大窗口 (1200x800)' },
      { width: 600, height: 400, name: '小窗口 (600x400)' },
      { width: 1000, height: 600, name: '宽窗口 (1000x600)' },
      { width: 600, height: 800, name: '高窗口 (600x800)' },
      { width: 900, height: 900, name: '正方形窗口 (900x900)' }
    ];
    
    for (const size of testSizes) {
      console.log(`🔄 测试窗口大小: ${size.name}`);
      
      // 改变窗口大小
      await page.setViewportSize({ width: size.width, height: size.height });
      
      // 等待适配完成
      await page.waitForTimeout(1500);
      
      // 验证适配效果
      await verifyShapeAdaptation(page, size.name);
    }
    
    console.log('✅ 所有窗口大小测试完成');
  });
  
  // 验证形状适配的辅助函数
  async function verifyShapeAdaptation(page: any, testName: string) {
    console.log(`📊 验证适配效果: ${testName}`);
    
    // 获取画布信息
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('#puzzle-canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // 获取画布尺寸
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasMinEdge = Math.min(canvasWidth, canvasHeight);
      const canvasCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
      
      // 检查画布是否有内容
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const hasContent = imageData.data.some((value, index) => {
        // 检查alpha通道，如果不是完全透明就认为有内容
        return index % 4 === 3 && value > 0;
      });
      
      // 如果有内容，分析形状
      let shapeAnalysis = null;
      if (hasContent) {
        // 扫描画布找到形状的边界
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
        
        if (pixelCount > 0) {
          const shapeWidth = maxX - minX;
          const shapeHeight = maxY - minY;
          const shapeDiameter = Math.max(shapeWidth, shapeHeight);
          const shapeCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
          
          // 计算中心偏移
          const centerOffset = {
            x: Math.abs(shapeCenter.x - canvasCenter.x),
            y: Math.abs(shapeCenter.y - canvasCenter.y)
          };
          
          // 计算直径比例
          const diameterRatio = shapeDiameter / canvasMinEdge;
          
          shapeAnalysis = {
            bounds: { minX, maxX, minY, maxY },
            size: { width: shapeWidth, height: shapeHeight },
            diameter: shapeDiameter,
            center: shapeCenter,
            centerOffset,
            diameterRatio,
            pixelCount
          };
        }
      }
      
      return {
        canvasSize: { width: canvasWidth, height: canvasHeight },
        canvasMinEdge,
        canvasCenter,
        hasContent,
        shapeAnalysis
      };
    });
    
    if (!canvasInfo) {
      console.error('❌ 无法获取画布信息');
      return;
    }
    
    console.log(`画布尺寸: ${canvasInfo.canvasSize.width}x${canvasInfo.canvasSize.height}`);
    console.log(`画布最小边长: ${canvasInfo.canvasMinEdge}`);
    console.log(`画布中心: (${canvasInfo.canvasCenter.x}, ${canvasInfo.canvasCenter.y})`);
    console.log(`有内容: ${canvasInfo.hasContent}`);
    
    if (canvasInfo.hasContent && canvasInfo.shapeAnalysis) {
      const shape = canvasInfo.shapeAnalysis;
      
      console.log(`形状边界: (${shape.bounds.minX}, ${shape.bounds.minY}) - (${shape.bounds.maxX}, ${shape.bounds.maxY})`);
      console.log(`形状尺寸: ${shape.size.width.toFixed(1)} x ${shape.size.height.toFixed(1)}`);
      console.log(`形状直径: ${shape.diameter.toFixed(1)}`);
      console.log(`形状中心: (${shape.center.x.toFixed(1)}, ${shape.center.y.toFixed(1)})`);
      console.log(`中心偏移: (${shape.centerOffset.x.toFixed(1)}, ${shape.centerOffset.y.toFixed(1)})`);
      console.log(`直径比例: ${(shape.diameterRatio * 100).toFixed(1)}% (目标: 30%)`);
      console.log(`像素数量: ${shape.pixelCount}`);
      
      // 验证居中 (允许5像素的误差)
      const isCentered = shape.centerOffset.x <= 5 && shape.centerOffset.y <= 5;
      console.log(`✅ 居中检查: ${isCentered ? '通过' : '失败'} (偏移: ${shape.centerOffset.x.toFixed(1)}, ${shape.centerOffset.y.toFixed(1)})`);
      
      // 验证直径比例 (允许5%的误差)
      const targetRatio = 0.30;
      const ratioError = Math.abs(shape.diameterRatio - targetRatio);
      const isCorrectSize = ratioError <= 0.05;
      console.log(`✅ 尺寸检查: ${isCorrectSize ? '通过' : '失败'} (实际: ${(shape.diameterRatio * 100).toFixed(1)}%, 目标: 30%, 误差: ${(ratioError * 100).toFixed(1)}%)`);
      
      // 断言验证
      expect(isCentered, `形状未居中，偏移: (${shape.centerOffset.x.toFixed(1)}, ${shape.centerOffset.y.toFixed(1)})`).toBe(true);
      expect(isCorrectSize, `形状尺寸不正确，实际: ${(shape.diameterRatio * 100).toFixed(1)}%, 目标: 30%`).toBe(true);
      
    } else {
      console.error('❌ 画布中没有检测到形状内容');
      expect(canvasInfo.hasContent, '画布中应该有形状内容').toBe(true);
    }
    
    console.log(`✅ ${testName} 验证完成\n`);
  }
});