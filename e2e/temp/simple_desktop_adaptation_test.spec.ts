// 简单桌面端适配测试 - 专注于1366x768 → 1920x1080的基本居中适配
// 运行命令: npx playwright test e2e/temp/simple_desktop_adaptation_test.spec.ts --headed

import { test, expect, Page } from '@playwright/test';

// 辅助函数：等待画布提示区域出现指定文本
async function waitForTip(page: Page, expected: string) {
  await expect(page.getByText(expected)).toBeVisible({ timeout: 10000 });
}

// 辅助函数：获取形状的详细信息
async function getShapeInfo(page: Page) {
  return await page.evaluate(() => {
    const gameState = (window as any).__gameStateForTests__;
    
    if (!gameState || !gameState.originalShape || gameState.originalShape.length === 0) {
      return null;
    }
    
    // 计算形状边界框
    const xs = gameState.originalShape.map((p: any) => p.x);
    const ys = gameState.originalShape.map((p: any) => p.y);
    
    const bounds = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
    
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
    
    const size = {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY
    };
    
    return {
      canvasSize: {
        width: gameState.canvasWidth,
        height: gameState.canvasHeight
      },
      shapeBounds: bounds,
      shapeCenter: center,
      shapeSize: size,
      canvasCenter: {
        x: gameState.canvasWidth / 2,
        y: gameState.canvasHeight / 2
      }
    };
  });
}

test.describe('简单桌面端适配测试', () => {
  test('1366x768 → 1920x1080 基本居中适配', async ({ page }) => {
    console.log('🎯 开始简单桌面端适配测试...');
    
    // 初始化
    await page.addInitScript(() => {
      (window as any).soundPlayedForTest = () => {};
    });
    
    // 步骤1: 设置初始分辨率为1366x768
    console.log('📐 步骤1: 设置初始分辨率 1366x768');
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // 步骤2: 打开游戏并生成形状
    console.log('🎮 步骤2: 初始化游戏');
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');
    await waitForTip(page, '请点击生成你喜欢的形状');
    
    // 生成云朵形状
    await page.getByRole('button', { name: /云朵形状|云朵/ }).click();
    await waitForTip(page, '请选择切割类型');
    
    await page.getByText('斜线').click();
    await waitForTip(page, '请切割形状');
    
    await page.getByRole('button', { name: '4' }).click();
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await waitForTip(page, '请散开拼图，开始游戏');
    
    // 步骤3: 记录1366x768下的形状信息
    console.log('📊 步骤3: 记录1366x768下的形状信息');
    await page.waitForTimeout(1000); // 等待形状生成完成
    
    const initialInfo = await getShapeInfo(page);
    if (!initialInfo) {
      throw new Error('无法获取初始形状信息');
    }
    
    console.log('📋 1366x768 形状信息:');
    console.log(`   画布尺寸: ${initialInfo.canvasSize.width}x${initialInfo.canvasSize.height}`);
    console.log(`   画布中心: (${initialInfo.canvasCenter.x.toFixed(1)}, ${initialInfo.canvasCenter.y.toFixed(1)})`);
    console.log(`   形状中心: (${initialInfo.shapeCenter.x.toFixed(1)}, ${initialInfo.shapeCenter.y.toFixed(1)})`);
    console.log(`   形状尺寸: ${initialInfo.shapeSize.width.toFixed(1)}x${initialInfo.shapeSize.height.toFixed(1)}`);
    
    // 检查初始居中情况
    const initialCenteringErrorX = Math.abs(initialInfo.shapeCenter.x - initialInfo.canvasCenter.x);
    const initialCenteringErrorY = Math.abs(initialInfo.shapeCenter.y - initialInfo.canvasCenter.y);
    console.log(`   居中误差: X=${initialCenteringErrorX.toFixed(1)}px, Y=${initialCenteringErrorY.toFixed(1)}px`);
    
    // 步骤4: 切换到1920x1080
    console.log('🔄 步骤4: 切换分辨率到 1920x1080');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(3000); // 等待适配完成
    
    // 步骤5: 检查适配后的形状信息
    console.log('🔍 步骤5: 检查适配后的形状信息');
    const adaptedInfo = await getShapeInfo(page);
    if (!adaptedInfo) {
      throw new Error('无法获取适配后形状信息');
    }
    
    console.log('📋 1920x1080 适配后形状信息:');
    console.log(`   画布尺寸: ${adaptedInfo.canvasSize.width}x${adaptedInfo.canvasSize.height}`);
    console.log(`   画布中心: (${adaptedInfo.canvasCenter.x.toFixed(1)}, ${adaptedInfo.canvasCenter.y.toFixed(1)})`);
    console.log(`   形状中心: (${adaptedInfo.shapeCenter.x.toFixed(1)}, ${adaptedInfo.shapeCenter.y.toFixed(1)})`);
    console.log(`   形状尺寸: ${adaptedInfo.shapeSize.width.toFixed(1)}x${adaptedInfo.shapeSize.height.toFixed(1)}`);
    
    // 步骤6: 验证适配结果
    console.log('✅ 步骤6: 验证适配结果');
    
    // 6.1 检查居中精度
    const finalCenteringErrorX = Math.abs(adaptedInfo.shapeCenter.x - adaptedInfo.canvasCenter.x);
    const finalCenteringErrorY = Math.abs(adaptedInfo.shapeCenter.y - adaptedInfo.canvasCenter.y);
    console.log(`   适配后居中误差: X=${finalCenteringErrorX.toFixed(1)}px, Y=${finalCenteringErrorY.toFixed(1)}px`);
    
    const CENTERING_TOLERANCE = 10; // 10px容差
    const isCentered = finalCenteringErrorX <= CENTERING_TOLERANCE && finalCenteringErrorY <= CENTERING_TOLERANCE;
    
    if (isCentered) {
      console.log(`   ✅ 居中测试 PASS - 误差在${CENTERING_TOLERANCE}px容差范围内`);
    } else {
      console.log(`   ❌ 居中测试 FAIL - 误差超过${CENTERING_TOLERANCE}px容差`);
    }
    
    // 6.2 检查比例保持
    const initialAspectRatio = initialInfo.shapeSize.width / initialInfo.shapeSize.height;
    const adaptedAspectRatio = adaptedInfo.shapeSize.width / adaptedInfo.shapeSize.height;
    const aspectRatioError = Math.abs(adaptedAspectRatio - initialAspectRatio) / initialAspectRatio;
    
    console.log(`   初始宽高比: ${initialAspectRatio.toFixed(3)}`);
    console.log(`   适配后宽高比: ${adaptedAspectRatio.toFixed(3)}`);
    console.log(`   宽高比误差: ${(aspectRatioError * 100).toFixed(2)}%`);
    
    const ASPECT_RATIO_TOLERANCE = 0.05; // 5%容差
    const isProportionMaintained = aspectRatioError <= ASPECT_RATIO_TOLERANCE;
    
    if (isProportionMaintained) {
      console.log(`   ✅ 比例测试 PASS - 宽高比误差在${(ASPECT_RATIO_TOLERANCE * 100)}%容差范围内`);
    } else {
      console.log(`   ❌ 比例测试 FAIL - 宽高比误差超过${(ASPECT_RATIO_TOLERANCE * 100)}%容差`);
    }
    
    // 6.3 检查形状是否在画布边界内
    const BOUNDARY_MARGIN = 20; // 20px边界边距
    const isWithinBounds = 
      adaptedInfo.shapeBounds.minX >= BOUNDARY_MARGIN &&
      adaptedInfo.shapeBounds.minY >= BOUNDARY_MARGIN &&
      adaptedInfo.shapeBounds.maxX <= (adaptedInfo.canvasSize.width - BOUNDARY_MARGIN) &&
      adaptedInfo.shapeBounds.maxY <= (adaptedInfo.canvasSize.height - BOUNDARY_MARGIN);
    
    if (isWithinBounds) {
      console.log(`   ✅ 边界测试 PASS - 形状在画布边界内`);
    } else {
      console.log(`   ❌ 边界测试 FAIL - 形状超出画布边界`);
      console.log(`     形状边界: (${adaptedInfo.shapeBounds.minX.toFixed(1)}, ${adaptedInfo.shapeBounds.minY.toFixed(1)}) 到 (${adaptedInfo.shapeBounds.maxX.toFixed(1)}, ${adaptedInfo.shapeBounds.maxY.toFixed(1)})`);
      console.log(`     画布边界: (${BOUNDARY_MARGIN}, ${BOUNDARY_MARGIN}) 到 (${adaptedInfo.canvasSize.width - BOUNDARY_MARGIN}, ${adaptedInfo.canvasSize.height - BOUNDARY_MARGIN})`);
    }
    
    // 步骤7: 最终评估
    console.log('🏁 步骤7: 最终评估');
    const allTestsPassed = isCentered && isProportionMaintained && isWithinBounds;
    
    if (allTestsPassed) {
      console.log('🎉 简单桌面端适配测试 PASS - 1366x768 → 1920x1080 适配成功！');
      console.log('   ✅ 形状正确居中');
      console.log('   ✅ 比例保持一致');
      console.log('   ✅ 边界安全');
    } else {
      console.log('❌ 简单桌面端适配测试 FAIL - 需要修复适配问题');
      if (!isCentered) console.log('   ❌ 居中问题');
      if (!isProportionMaintained) console.log('   ❌ 比例问题');
      if (!isWithinBounds) console.log('   ❌ 边界问题');
    }
    
    // 保存截图
    try {
      await page.screenshot({ path: 'e2e/screenshots/simple-desktop-adaptation-1920x1080.png' });
      console.log('📸 适配后截图已保存');
    } catch (e) {
      console.log('⚠️ 截图保存失败');
    }
    
    console.log('🏁 简单桌面端适配测试完成！');
    
    // 断言测试结果
    expect(allTestsPassed).toBe(true);
  });
});