import { test, expect } from '@playwright/test';

test.describe('Language Switcher Icon Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display language switcher with icon only mode', async ({ page }) => {
    // 查找语言切换器按钮
    const languageSwitcher = page.getByTestId('language-switcher-button');
    await expect(languageSwitcher).toBeVisible();

    // 验证按钮显示的是语言代码而不是完整文本
    const buttonText = await languageSwitcher.textContent();
    
    // 应该显示 "中" 或 "EN" 而不是 "简体中文" 或 "English"
    expect(buttonText).toMatch(/^(中|EN)$/);
  });

  test('should show dropdown with icon options when clicked', async ({ page }) => {
    const languageSwitcher = page.getByTestId('language-switcher-button');
    
    // 点击语言切换器
    await languageSwitcher.click();
    
    // 验证下拉菜单出现
    const zhOption = page.getByTestId('language-option-zh-CN');
    const enOption = page.getByTestId('language-option-en');
    
    await expect(zhOption).toBeVisible();
    await expect(enOption).toBeVisible();
    
    // 验证选项显示的是图标而不是完整文本
    const zhText = await zhOption.textContent();
    const enText = await enOption.textContent();
    
    expect(zhText?.trim()).toBe('中');
    expect(enText?.trim()).toBe('EN');
  });

  test('should switch language when option is clicked', async ({ page }) => {
    const languageSwitcher = page.getByTestId('language-switcher-button');
    const initialText = await languageSwitcher.textContent();
    
    // 点击语言切换器
    await languageSwitcher.click();
    
    // 点击另一种语言选项
    if (initialText?.includes('中')) {
      await page.getByTestId('language-option-en').click();
      await expect(languageSwitcher).toContainText('EN');
    } else {
      await page.getByTestId('language-option-zh-CN').click();
      await expect(languageSwitcher).toContainText('中');
    }
    
    // 验证下拉菜单关闭
    await expect(page.getByTestId('language-option-zh-CN')).not.toBeVisible();
  });

  test('should maintain consistent styling with other utility buttons', async ({ page }) => {
    const languageSwitcher = page.getByTestId('language-switcher-button');
    const musicButton = page.getByTestId('toggle-music-button');
    const fullscreenButton = page.getByTestId('toggle-fullscreen-button');
    
    // 获取所有按钮的样式
    const languageStyles = await languageSwitcher.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        borderRadius: computed.borderRadius,
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    const musicStyles = await musicButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        borderRadius: computed.borderRadius,
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // 验证样式一致性
    expect(languageStyles.width).toBe(musicStyles.width);
    expect(languageStyles.height).toBe(musicStyles.height);
    expect(languageStyles.borderRadius).toBe(musicStyles.borderRadius);
    expect(languageStyles.backgroundColor).toBe(musicStyles.backgroundColor);
    expect(languageStyles.color).toBe(musicStyles.color);
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    const languageSwitcher = page.getByTestId('language-switcher-button');
    
    // 打开下拉菜单
    await languageSwitcher.click();
    await expect(page.getByTestId('language-option-zh-CN')).toBeVisible();
    
    // 点击外部区域
    await page.click('body', { position: { x: 100, y: 100 } });
    
    // 验证下拉菜单关闭
    await expect(page.getByTestId('language-option-zh-CN')).not.toBeVisible();
  });
});