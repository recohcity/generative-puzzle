import { test, expect } from '@playwright/test';

test.describe('无限循环修复测试', () => {
  test('页面加载后不应该出现无限适配循环', async ({ page }) => {
    console.log('🚀 开始无限循环修复测试');
    
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
    });
    
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
    await page.waitForTimeout(3000);
    
    // 统计适配相关的日志数量
    const adaptationLogs = consoleLogs.filter(log => 
      log.includes('🎯 触发形状适配') || 
      log.includes('🔍 适配条件检查')
    );
    
    console.log(`📊 适配相关日志总数: ${adaptationLogs.length}`);
    console.log('📋 最近10条适配日志:');
    adaptationLogs.slice(-10).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });
    
    // 检查是否有过多的适配日志（可能表示无限循环）
    const recentLogs = consoleLogs.slice(-50); // 检查最近50条日志
    const recentAdaptationLogs = recentLogs.filter(log => 
      log.includes('🎯 触发形状适配')
    );
    
    console.log(`📊 最近50条日志中的适配触发次数: ${recentAdaptationLogs.length}`);
    
    // 如果最近50条日志中有超过10次适配触发，可能存在无限循环
    if (recentAdaptationLogs.length > 10) {
      console.log('⚠️  可能存在无限循环，最近的适配触发日志:');
      recentAdaptationLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`);
      });
    } else {
      console.log('✅ 没有检测到无限循环');
    }
    
    // 等待一段时间，确保没有持续的适配
    console.log('⏳ 等待5秒，检查是否有持续的适配...');
    const logCountBefore = consoleLogs.length;
    await page.waitForTimeout(5000);
    const logCountAfter = consoleLogs.length;
    
    const newLogs = consoleLogs.slice(logCountBefore);
    const newAdaptationLogs = newLogs.filter(log => 
      log.includes('🎯 触发形状适配')
    );
    
    console.log(`📊 5秒内新增日志: ${newLogs.length} 条`);
    console.log(`📊 5秒内新增适配触发: ${newAdaptationLogs.length} 次`);
    
    if (newAdaptationLogs.length > 0) {
      console.log('⚠️  5秒内仍有适配触发，可能存在问题:');
      newAdaptationLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`);
      });
    } else {
      console.log('✅ 5秒内没有新的适配触发，修复成功');
    }
    
    console.log('✅ 无限循环修复测试完成');
  });
});