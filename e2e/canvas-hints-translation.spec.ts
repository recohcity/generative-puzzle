import { test, expect, Page } from '@playwright/test';

test.describe('画布提示信息翻译测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');
  });

  test('画布提示信息应正确翻译 - 中文', async ({ page }) => {
    // 验证初始提示
    await expect(page.getByText('请点击生成你喜欢的形状')).toBeVisible();
    
    // 点击形状按钮
    await page.getByTestId('shape-curve-button').click();
    await expect(page.getByText('请选择切割类型')).toBeVisible();
    
    // 选择切割类型
    await page.getByTestId('cut-type-straight-button').click();
    await expect(page.getByText('请切割形状')).toBeVisible();
    
    // 选择切割次数并切割
    await page.getByTestId('cut-count-3-button').click();
    await page.getByTestId('generate-puzzle-button').click();
    await expect(page.getByText('请散开拼图，开始游戏')).toBeVisible();
    
    // 散开拼图
    await page.getByTestId('scatter-puzzle-button').click();
    await page.waitForTimeout(2000);
    
    // 验证进度提示
    await expect(page.getByText(/0 \/ \d+ 块拼图已完成/)).toBeVisible();
  });

  test('画布提示信息应正确翻译 - 英文', async ({ page }) => {
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证初始提示
    await expect(page.getByText('Please click to generate your favorite shape')).toBeVisible();
    
    // 点击形状按钮
    await page.getByTestId('shape-curve-button').click();
    await expect(page.getByText('Please select cut type')).toBeVisible();
    
    // 选择切割类型
    await page.getByTestId('cut-type-straight-button').click();
    await expect(page.getByText('Please cut the shape')).toBeVisible();
    
    // 选择切割次数并切割
    await page.getByTestId('cut-count-3-button').click();
    await page.getByTestId('generate-puzzle-button').click();
    await expect(page.getByText('Please scatter the puzzle to start the game')).toBeVisible();
    
    // 散开拼图
    await page.getByTestId('scatter-puzzle-button').click();
    await page.waitForTimeout(2000);
    
    // 验证进度提示
    await expect(page.getByText(/0 \/ \d+ pieces completed/)).toBeVisible();
  });

  test('桌面端控制面板标题应正确翻译', async ({ page }) => {
    // 设置桌面端视口
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForSelector('canvas#puzzle-canvas');
    
    // 验证中文标题
    await expect(page.getByText('生成拼图')).toBeVisible();
    
    // 完成游戏设置以显示游戏控制标题
    await page.getByTestId('shape-polygon-button').click();
    await page.getByTestId('cut-type-diagonal-button').click();
    await page.getByTestId('cut-count-2-button').click();
    await page.getByTestId('generate-puzzle-button').click();
    await page.getByTestId('scatter-puzzle-button').click();
    await page.waitForTimeout(2000);
    
    // 验证游戏控制标题
    await expect(page.getByText('游戏控制')).toBeVisible();
    
    // 切换到英文
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证英文标题
    await expect(page.getByText('Generate Puzzle')).toBeVisible();
    await expect(page.getByText('Game Controls')).toBeVisible();
  });

  test('语言切换后画布提示应立即更新', async ({ page }) => {
    // 进入游戏中间状态
    await page.getByTestId('shape-curve-button').click();
    await expect(page.getByText('请选择切割类型')).toBeVisible();
    
    // 切换语言
    await page.getByTestId('language-switcher-button').click();
    await page.getByTestId('language-option-en').click();
    
    // 验证提示立即更新为英文
    await expect(page.getByText('Please select cut type')).toBeVisible();
    await expect(page.getByText('请选择切割类型')).not.toBeVisible();
  });
});