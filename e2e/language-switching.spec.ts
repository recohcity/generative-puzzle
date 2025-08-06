import { test, expect, Page } from '@playwright/test';

test.describe('语言切换功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');
  });

  test('默认语言应为简体中文', async ({ page }) => {
    // 验证默认显示中文标题
    await expect(page.getByText('生成式拼图游戏')).toBeVisible();
    
    // 验证中文提示文本
    await expect(page.getByText('请点击生成你喜欢的形状')).toBeVisible();
    
    // 验证页面标题
    await expect(page).toHaveTitle('生成式拼图游戏');
  });

  test('语言切换器应正常工作', async ({ page }) => {
    // 点击语言切换器
    await page.getByTestId('language-switcher-button').click();
    
    // 验证下拉菜单显示
    await expect(page.getByTestId('language-option-zh-CN')).toBeVisible();
    await expect(page.getByTestId('language-option-en')).toBeVisible();
    
    // 切换到英文
    await page.getByTestId('language-option-en').click();
    
    // 验证界面已切换为英文
    await expect(page.getByText('Generative Puzzle Game')).toBeVisible();
    await expect(page.getByText('Please click to generate your favorite shape')).toBeVisible();
    
    // 验证页面标题也已切换
    await expect(page).toHaveTitle('Generative Puzzle Game');
  });

  test('语言设置应持久化', async ({ page }) => {
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 刷新页面
    await page.reload();
    await page.waitForSelector('canvas#puzzle-canvas');
    
    // 验证语言设置被保持
    await expect(page.getByText('Generative Puzzle Game')).toBeVisible();
    await expect(page).toHaveTitle('Generative Puzzle Game');
  });

  test('形状按钮文本应正确翻译', async ({ page }) => {
    // 验证中文形状按钮
    await expect(page.getByTestId('shape-polygon-button')).toContainText('多边形');
    await expect(page.getByTestId('shape-curve-button')).toContainText('云朵形状');
    await expect(page.getByTestId('shape-irregular-button')).toContainText('锯齿形状');
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证英文形状按钮
    await expect(page.getByTestId('shape-polygon-button')).toContainText('Polygon');
    await expect(page.getByTestId('shape-curve-button')).toContainText('Cloud Shape');
    await expect(page.getByTestId('shape-irregular-button')).toContainText('Jagged Shape');
  });

  test('游戏流程中的翻译应正确', async ({ page }) => {
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 点击形状按钮
    await page.getByTestId('shape-curve-button').click();
    await expect(page.getByText('Please select cut type')).toBeVisible();
    
    // 选择切割类型
    await page.getByTestId('cut-type-diagonal-button').click();
    await expect(page.getByText('Please cut the shape')).toBeVisible();
    
    // 选择切割次数
    await page.getByTestId('cut-count-4-button').click();
    
    // 验证切割按钮文本
    await expect(page.getByTestId('generate-puzzle-button')).toContainText('Cut Shape');
    
    // 切割形状
    await page.getByTestId('generate-puzzle-button').click();
    await expect(page.getByText('Please scatter the puzzle to start the game')).toBeVisible();
    
    // 散开拼图
    await page.getByTestId('scatter-puzzle-button').click();
    
    // 等待拼图散开，验证进度提示
    await page.waitForTimeout(2000);
    await expect(page.getByText(/\d+ \/ \d+ pieces completed/)).toBeVisible();
  });

  test('移动端Tab标签应正确翻译', async ({ page }) => {
    // 模拟移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('canvas#puzzle-canvas');
    
    // 验证中文Tab标签
    await expect(page.getByTestId('tab-shape-button')).toContainText('形状');
    await expect(page.getByTestId('tab-puzzle-button')).toContainText('类型');
    await expect(page.getByTestId('tab-cut-button')).toContainText('次数');
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证英文Tab标签
    await expect(page.getByTestId('tab-shape-button')).toContainText('Shape');
    await expect(page.getByTestId('tab-puzzle-button')).toContainText('Type');
    await expect(page.getByTestId('tab-cut-button')).toContainText('Count');
  });

  test('控制按钮应正确翻译', async ({ page }) => {
    // 先完成游戏设置以显示控制按钮
    await page.getByTestId('shape-curve-button').click();
    await page.getByTestId('cut-type-straight-button').click();
    await page.getByTestId('cut-count-3-button').click();
    await page.getByTestId('generate-puzzle-button').click();
    await page.getByTestId('scatter-puzzle-button').click();
    
    // 等待拼图散开
    await page.waitForTimeout(2000);
    
    // 验证中文控制按钮
    await expect(page.getByTestId('hint-button')).toContainText('提示');
    await expect(page.getByTestId('rotate-left-button')).toContainText('左转');
    await expect(page.getByTestId('rotate-right-button')).toContainText('右转');
    await expect(page.getByTestId('restart-button')).toContainText('重新开始');
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证英文控制按钮
    await expect(page.getByTestId('hint-button')).toContainText('Hint');
    await expect(page.getByTestId('rotate-left-button')).toContainText('Rotate Left');
    await expect(page.getByTestId('rotate-right-button')).toContainText('Rotate Right');
    await expect(page.getByTestId('restart-button')).toContainText('Restart');
  });
});