import { test, expect } from '@playwright/test';

test.describe('用户体验全流程自动化测试-桌面端', () => {
  let performanceStats: any = {};

  test('云朵形状-斜线切割8次-全流程', async ({ page }) => {
    // 第1步：访问页面，统计加载时长
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas.relative.cursor-pointer');
    // Navigation Timing API（兼容性处理）
    const navTiming = await page.evaluate(() => {
      if (performance.timing && performance.timing.loadEventEnd && performance.timing.navigationStart) {
        return performance.timing.loadEventEnd - performance.timing.navigationStart;
      }
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? nav.loadEventEnd - nav.startTime : undefined;
    });
    performanceStats['加载时长'] = navTiming;

    // 第2步：选择云朵形状
    await page.getByRole('button', { name: /云朵形状|云朵/ }).click();

    // 第3步：生成形状
    const shapeStart = Date.now();
    await page.getByRole('button', { name: /生成形状|重新生成形状/ }).click();
    await page.waitForFunction(() => {
      const s = (window as any).__gameStateForTests__;
      return s && Array.isArray(s.originalShape) && s.originalShape.length > 0;
    });
    const shapeEnd = Date.now();
    performanceStats['形状生成时长'] = shapeEnd - shapeStart;

    // 第4步：选择斜线切割
    await page.getByText('斜线').click();

    // 第5步：选择切割次数8
    await page.getByRole('button', { name: '8' }).click();

    // 第6步：切割形状
    const cutStart = Date.now();
    await page.getByRole('button', { name: /切割形状|重新切割形状/ }).click();
    await page.waitForFunction(() => {
      const s = (window as any).__gameStateForTests__;
      return s && Array.isArray(s.puzzle) && s.puzzle.length > 0;
    });
    const cutEnd = Date.now();
    const puzzleCount = await page.evaluate(() => (window as any).__gameStateForTests__.puzzle.length);
    performanceStats['切割形状时长'] = cutEnd - cutStart;
    performanceStats['拼图数量'] = puzzleCount;

    // 第7步：散开拼图
    const scatterStart = Date.now();
    await page.waitForFunction(() => {
      const s = (window as any).__gameStateForTests__;
      return s && Array.isArray(s.puzzle) && s.puzzle.length > 0 && Array.isArray(s.originalPositions) && s.originalPositions.length > 0;
    });
    const scatterBtn = page.getByRole('button', { name: '散开拼图' });
    await expect(scatterBtn).toBeVisible();
    await expect(scatterBtn).toBeEnabled();
    await scatterBtn.click();
    let scatterTriggered = await page.evaluate(() => {
      const s = (window as any).__gameStateForTests__;
      return s && s.isScattered;
    });
    console.log('点击后isScattered:', scatterTriggered);
    if (!scatterTriggered) {
      await scatterBtn.click({ force: true });
      scatterTriggered = await page.evaluate(() => {
        const s = (window as any).__gameStateForTests__;
        return s && s.isScattered;
      });
      console.log('force click后isScattered:', scatterTriggered);
    }
    if (!scatterTriggered) {
      await scatterBtn.dispatchEvent('click');
      scatterTriggered = await page.evaluate(() => {
        const s = (window as any).__gameStateForTests__;
        return s && s.isScattered;
      });
      console.log('dispatchEvent后isScattered:', scatterTriggered);
    }
    await page.waitForFunction(() => {
      const s = (window as any).__gameStateForTests__;
      return s && s.isScattered === true;
    });
    try {
      await page.waitForFunction(
        (expectedCount) => {
          const s = (window as any).__gameStateForTests__;
          return s && Array.isArray(s.puzzle) && s.puzzle.length === expectedCount;
        },
        [puzzleCount],
        { timeout: 30000 }
      );
    } catch (e) {
      const debugState = await page.evaluate((expectedCount) => {
        const s = (window as any).__gameStateForTests__;
        return {
          isScattered: s?.isScattered,
          puzzleLength: s?.puzzle?.length,
          expectedCount,
          completedPieces: s?.completedPieces,
          originalPositions: s?.originalPositions?.length,
          isCompleted: s?.isCompleted,
          keys: s ? Object.keys(s) : [],
        };
      }, puzzleCount);
      console.log('等待超时时的状态:', debugState);
      await page.screenshot({ path: 'scatter-wait-timeout.png' });
      throw new Error('等待拼图散开超时，已截图 scatter-wait-timeout.png');
    }
    const scatterEnd = Date.now();
    performanceStats['拼图散开时长'] = scatterEnd - scatterStart;

    // 第8步：交互拼图（所有拼图块，模拟提示、旋转、拖拽）
    let totalInteractionTime = 0;
    let totalRotateCount = 0;
    let totalHintCount = 0;
    for (let i = 0; i < puzzleCount; i++) {
      const interactStart = Date.now();
      // 选中拼图（假设拼图块中心点可通过 originalPositions 获取）
      const target = await page.evaluate((idx) => {
        const pos = (window as any).__gameStateForTests__.originalPositions[idx];
        return { x: pos.x, y: pos.y };
      }, i);
      // 鼠标点击拼图中心
      await page.mouse.click(target.x, target.y);
      // 点击提示按钮
      await page.getByRole('button', { name: /提示/ }).click();
      totalHintCount++;
      // 旋转到0度
      const getRotation = async () => await page.evaluate((idx) => (window as any).__gameStateForTests__.puzzle[idx].rotation, i);
      let rotation = await getRotation();
      let rotateCount = 0;
      while (rotation % 360 !== 0) {
        if (rotation > 0) {
          await page.getByRole('button', { name: /逆时针|左旋/ }).click();
        } else {
          await page.getByRole('button', { name: /顺时针|右旋/ }).click();
        }
        rotateCount++;
        await page.waitForTimeout(100);
        rotation = await getRotation();
        if (rotateCount > 24) break;
      }
      totalRotateCount += rotateCount;
      // 拖拽到目标位置（用 dragTo）
      const canvas = page.locator('canvas.relative.cursor-pointer');
      const { centerX, centerY } = await canvas.evaluate((el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        return { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
      });
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 8 });
      await page.mouse.up();
      const interactEnd = Date.now();
      performanceStats[`拼图${i + 1}交互时长`] = interactEnd - interactStart;
      totalInteractionTime += interactEnd - interactStart;
    }
    performanceStats['交互时长'] = totalInteractionTime;
    performanceStats['旋转次数'] = totalRotateCount;
    performanceStats['提示次数'] = totalHintCount;
    performanceStats['切割次数'] = 8;

    // 第9步：拼图完成效果显示
    await page.waitForFunction(() => (window as any).__gameStateForTests__.isCompleted === true);
    expect(await page.evaluate(() => (window as any).__gameStateForTests__.isCompleted)).toBe(true);

    // 第10步：重新开始
    await page.getByRole('button', { name: /重新开始/ }).click();
    await page.waitForFunction(() => {
      const s = (window as any).__gameStateForTests__;
      return s && (!s.puzzle || s.puzzle.length === 0);
    });

    // 性能统计：FPS和内存
    const fps = await page.evaluate(() => (window as any).fpsData || []);
    performanceStats['FPS'] = fps;
    const memory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      }
      return -1;
    });
    performanceStats['内存(MB)'] = memory;

    // 输出性能统计
    console.log('【性能统计】', performanceStats);
    await test.info().attach('performance-stats', {
      body: JSON.stringify(performanceStats, null, 2),
      contentType: 'application/json',
    });
  });
}); 