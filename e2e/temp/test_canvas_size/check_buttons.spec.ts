import { test, expect } from '@playwright/test';

test('检查页面上的按钮', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // 等待页面加载
  await page.waitForTimeout(3000);
  
  // 获取所有按钮
  const buttons = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    return allButtons.map(btn => ({
      text: btn.textContent?.trim(),
      id: btn.id,
      className: btn.className,
      disabled: btn.disabled
    }));
  });
  
  console.log('页面上的所有按钮:', JSON.stringify(buttons, null, 2));
  
  // 检查是否有包含"拼图"的按钮
  const puzzleButtons = buttons.filter(btn => 
    btn.text?.includes('拼图') || btn.text?.includes('puzzle') || btn.text?.includes('生成')
  );
  
  console.log('包含拼图相关文字的按钮:', JSON.stringify(puzzleButtons, null, 2));
  
  // 截图看看页面状态
  await page.screenshot({ path: 'test-results/page-buttons.png', fullPage: true });
});