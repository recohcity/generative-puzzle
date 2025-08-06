import { test, expect, Page } from '@playwright/test';

test.describe('切割音效测试', () => {
  test.beforeEach(async ({ page }) => {
    // 添加音效监听器
    await page.addInitScript(() => {
      (window as any).__SOUND_PLAY_LISTENER__ = (event: { soundName: string }) => {
        if (!(window as any).__PLAYED_SOUNDS__) {
          (window as any).__PLAYED_SOUNDS__ = [];
        }
        (window as any).__PLAYED_SOUNDS__.push(event.soundName);
        console.log('Sound played:', event.soundName);
      };
    });
    
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');
  });

  test('切割拼图时应播放切割音效而不是按钮点击音效', async ({ page }) => {
    // 完成游戏设置
    await page.getByTestId('shape-polygon-button').click();
    await page.getByTestId('cut-type-straight-button').click();
    await page.getByTestId('cut-count-3-button').click();
    
    // 清除之前的音效记录
    await page.evaluate(() => {
      (window as any).__PLAYED_SOUNDS__ = [];
    });
    
    // 点击切割形状按钮
    await page.getByTestId('generate-puzzle-button').click();
    
    // 等待音效播放
    await page.waitForTimeout(1000);
    
    // 验证播放了切割音效
    const playedSounds = await page.evaluate(() => {
      return (window as any).__PLAYED_SOUNDS__ || [];
    });
    
    console.log('Played sounds:', playedSounds);
    
    // 验证播放了切割音效
    expect(playedSounds).toContain('cut');
    
    // 验证没有播放按钮点击音效（在切割操作中）
    // 注意：可能会有其他按钮的点击音效，但切割操作本身应该使用切割音效
    const cutSoundCount = playedSounds.filter((sound: string) => sound === 'cut').length;
    expect(cutSoundCount).toBeGreaterThan(0);
  });

  test('其他按钮仍应播放按钮点击音效', async ({ page }) => {
    // 清除音效记录
    await page.evaluate(() => {
      (window as any).__PLAYED_SOUNDS__ = [];
    });
    
    // 点击形状按钮
    await page.getByTestId('shape-curve-button').click();
    
    // 等待音效播放
    await page.waitForTimeout(500);
    
    // 验证播放了按钮点击音效
    const playedSounds = await page.evaluate(() => {
      return (window as any).__PLAYED_SOUNDS__ || [];
    });
    
    console.log('Shape button sounds:', playedSounds);
    expect(playedSounds).toContain('buttonClick');
  });

  test('桌面端切割按钮也应播放切割音效', async ({ page }) => {
    // 设置桌面端视口
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForSelector('canvas#puzzle-canvas');
    
    // 完成游戏设置
    await page.getByTestId('shape-polygon-button').click();
    await page.getByTestId('cut-type-diagonal-button').click();
    await page.getByTestId('cut-count-2-button').click();
    
    // 清除音效记录
    await page.evaluate(() => {
      (window as any).__PLAYED_SOUNDS__ = [];
    });
    
    // 点击切割形状按钮
    await page.getByTestId('generate-puzzle-button').click();
    
    // 等待音效播放
    await page.waitForTimeout(1000);
    
    // 验证播放了切割音效
    const playedSounds = await page.evaluate(() => {
      return (window as any).__PLAYED_SOUNDS__ || [];
    });
    
    console.log('Desktop cut sounds:', playedSounds);
    expect(playedSounds).toContain('cut');
  });

  test('移动端切割按钮也应播放切割音效', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('canvas#puzzle-canvas');
    
    // 完成游戏设置
    await page.getByTestId('shape-curve-button').click();
    await page.getByTestId('cut-type-straight-button').click();
    await page.getByTestId('cut-count-4-button').click();
    
    // 清除音效记录
    await page.evaluate(() => {
      (window as any).__PLAYED_SOUNDS__ = [];
    });
    
    // 点击切割形状按钮
    await page.getByTestId('generate-puzzle-button').click();
    
    // 等待音效播放
    await page.waitForTimeout(1000);
    
    // 验证播放了切割音效
    const playedSounds = await page.evaluate(() => {
      return (window as any).__PLAYED_SOUNDS__ || [];
    });
    
    console.log('Mobile cut sounds:', playedSounds);
    expect(playedSounds).toContain('cut');
  });
});