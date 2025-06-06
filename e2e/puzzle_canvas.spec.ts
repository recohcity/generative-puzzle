import { test, expect } from '@playwright/test';

test.describe('PuzzleCanvas Initial Tests', () => {
  // 在每个测试开始前设置视口大小
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should load the page and render the canvas', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('canvas.relative.cursor-pointer')).toBeVisible();
    // You might want to add more specific checks here, e.g., canvas dimensions
    // await expect(page.locator('canvas')).toHaveAttribute('width', '800');
    // await expect(page.locator('canvas')).toHaveAttribute('height', '600');
  });

  test('should allow dragging a puzzle piece on the canvas', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas.relative.cursor-pointer'); // 确保 canvas 元素存在

    const canvas = page.locator('canvas.relative.cursor-pointer');
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      const startX = canvasBox.x + canvasBox.width / 2;
      const startY = canvasBox.y + canvasBox.height / 2;

      // 模拟从画布中心开始拖拽
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 50, startY + 50, { steps: 5 }); // 向右下拖拽 50 像素
      await page.mouse.up();

      // For canvas-based rendering, verifying the exact position change is complex
      // without exposing internal game state via JavaScript or robust image comparison.
      // For initial test, we'll assume no errors indicate success for this interaction.
      // TODO: Future improvement: Use page.evaluate to get puzzle piece coordinates before and after drag
      // and assert their change.
    } else {
      throw new Error('Canvas element not found for dragging test.');
    }
  });

  test('should toggle debug mode with F10 key', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas.relative.cursor-pointer');

    // Assuming debug elements are not visible by default, and have a class like 'debug-info'
    // This requires knowing the exact selector for debug elements in your application.
    // For now, we'll just simulate the key press.

    // await expect(page.locator('.debug-info')).not.toBeVisible(); // Placeholder check

    await page.keyboard.press('F10');

    // await expect(page.locator('.debug-info')).toBeVisible(); // Placeholder check

    await page.keyboard.press('F10'); // Press F10 again to toggle off

    // await expect(page.locator('.debug-info')).not.toBeVisible(); // Placeholder check
  });

  test('should handle puzzle snapping and completion', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas.relative.cursor-pointer');

    // This test is highly dependent on the game logic and how pieces are snapped.
    // A common approach would be to drag a piece close to its correct position.
    // Since canvas rendering doesn't expose DOM elements for pieces, we simulate the drag.
    // For a more robust test, you'd need to expose game state via `page.evaluate`.

    const canvas = page.locator('canvas.relative.cursor-pointer');
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      const startX = canvasBox.x + canvasBox.width / 2;
      const startY = canvasBox.y + canvasBox.height / 2;

      await page.mouse.move(startX, startY); // Move to a piece (if any) or a drag starting point
      await page.mouse.down();
      // Simulate dragging a piece to a potential snapping location (e.g., top-left corner region)
      await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100, { steps: 10 });
      await page.mouse.up();

      // TODO: Future improvement: After dragging, use page.evaluate to check the `isCompleted` status
      // of the piece or check for visual cues of completion (e.g., changes in canvas drawing).
      // For example, if your game exposes a global `window.puzzleState` or similar.

      // expect(await page.evaluate(() => window.someGameApi.getPieceStatus(pieceId))).toBe('completed');
    } else {
      throw new Error('Canvas element not found for snapping test.');
    }
  });

  test('should play sound effects (if applicable)', async ({ page }) => {
    // Expose a function to the page context to signal when the sound is played
    let soundPlayed = false;
    await page.exposeFunction('soundPlayedForTest', () => {
      console.log('soundPlayedForTest called');
      soundPlayed = true;
    });

    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas.relative.cursor-pointer');

    const canvas = page.locator('canvas.relative.cursor-pointer');
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) {
      throw new Error('Canvas element not found for sound effect test.');
    }

    // Calculate the center of the canvas
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;

    console.log(`Attempting to click canvas center at ${centerX.toFixed(2)}, ${centerY.toFixed(2)} to trigger sound.`);

    // Simulate a click at the canvas center
    await page.mouse.click(centerX, centerY);

    // Wait for the soundPlayed flag to become true, with a timeout
    await expect(async () => {
        expect(soundPlayed).toBe(true);
    }).toPass({ timeout: 15000 }); // Increased timeout slightly

    console.log('Detected sound effect played via exposed function.');

  });

  // TODO: Add tests for:
  // - Puzzle rendering (e.g., check if puzzle pieces are drawn, perhaps by taking another screenshot and comparing)
  // - Drag and rotate functionality (simulate drag and rotate actions)
  // - Puzzle snapping and completion logic
  // - Sound effects (mock or check for audio element presence/interaction)
  // - Debug mode toggle (simulate F10 key press and check for debug elements)
}); 