import { test, expect } from '@playwright/test';

test('Debug NaN calculation in adaptation engine', async ({ page }) => {
  // 监听所有控制台消息
  const allMessages: { type: string, text: string }[] = [];
  
  page.on('console', msg => {
    allMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // 导航到游戏页面
  await page.goto('/');
  
  // 等待页面加载完成
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // 生成形状和拼图
  await page.evaluate(() => {
    if (window.testAPI) {
      window.testAPI.generateShape('circle');
    }
  });
  
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    if (window.testAPI) {
      window.testAPI.generatePuzzle(4);
    }
  });
  
  await page.waitForTimeout(1000);
  
  // 散开拼图
  const scatterButton = page.locator('button:has-text("散开")');
  await expect(scatterButton).toBeVisible();
  await scatterButton.click();
  
  await page.waitForTimeout(1000);
  
  // 清空之前的消息
  allMessages.length = 0;
  
  // 调整窗口大小
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // 等待适配完成
  await page.waitForTimeout(2000);
  
  // 输出所有相关的错误消息
  console.log('=== 所有控制台消息 ===');
  allMessages.forEach((msg, index) => {
    if (msg.text.includes('UnifiedAdaptationEngine') || 
        msg.text.includes('坐标计算结果无效') ||
        msg.text.includes('NaN')) {
      console.log(`${msg.type.toUpperCase()} ${index + 1}:`, msg.text);
    }
  });
  
  // 查找包含详细计算信息的错误
  const detailedErrors = allMessages.filter(msg => 
    msg.text.includes('坐标计算结果无效') && msg.text.includes('calculations')
  );
  
  console.log('=== 详细计算错误 ===');
  detailedErrors.forEach((error, index) => {
    console.log(`详细错误 ${index + 1}:`, error.text);
  });
  
  if (detailedErrors.length === 0) {
    console.log('❌ 没有找到详细的计算错误信息');
    
    // 输出所有错误类型的消息
    const errorMessages = allMessages.filter(msg => msg.type === 'error');
    console.log('所有错误消息:');
    errorMessages.forEach((error, index) => {
      console.log(`错误 ${index + 1}:`, error.text);
    });
  }
});