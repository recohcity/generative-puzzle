import { test, expect, Page } from '@playwright/test';

test.describe('页面标题和元数据翻译测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');
  });

  test('页面标题应正确翻译', async ({ page }) => {
    // 验证默认中文标题
    await expect(page).toHaveTitle('生成式拼图游戏');
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 等待翻译加载完成
    await page.waitForTimeout(500);
    
    // 验证英文标题
    await expect(page).toHaveTitle('Generative Puzzle Game');
    
    // 切换回中文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-zh-CN').click();
    
    // 等待翻译加载完成
    await page.waitForTimeout(500);
    
    // 验证中文标题恢复
    await expect(page).toHaveTitle('生成式拼图游戏');
  });

  test('HTML lang属性应随语言切换更新', async ({ page }) => {
    // 验证默认lang属性
    const initialLang = await page.getAttribute('html', 'lang');
    expect(initialLang).toBe('zh-CN');
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 等待更新
    await page.waitForTimeout(500);
    
    // 验证lang属性更新
    const englishLang = await page.getAttribute('html', 'lang');
    expect(englishLang).toBe('en');
  });

  test('页面刷新后标题应保持选择的语言', async ({ page }) => {
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证英文标题
    await expect(page).toHaveTitle('Generative Puzzle Game');
    
    // 刷新页面
    await page.reload();
    await page.waitForSelector('canvas#puzzle-canvas');
    
    // 等待翻译系统初始化
    await page.waitForTimeout(1000);
    
    // 验证标题保持英文
    await expect(page).toHaveTitle('Generative Puzzle Game');
    
    // 验证界面也保持英文
    await expect(page.getByText('Generative Puzzle Game')).toBeVisible();
  });

  test('浏览器标签页标题应与界面标题一致', async ({ page }) => {
    // 验证中文状态下的一致性
    await expect(page).toHaveTitle('生成式拼图游戏');
    await expect(page.getByText('生成式拼图游戏')).toBeVisible();
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 等待更新
    await page.waitForTimeout(500);
    
    // 验证英文状态下的一致性
    await expect(page).toHaveTitle('Generative Puzzle Game');
    await expect(page.getByText('Generative Puzzle Game')).toBeVisible();
  });
});