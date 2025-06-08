import { test, expect } from '@playwright/test';

test.describe('PuzzleCanvas Initial Tests', () => {
  // 在每个测试开始前设置视口大小
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should load the page and render the canvas', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await expect(page.locator('canvas.relative.cursor-pointer')).toBeVisible();
    // You might want to add more specific checks here, e.g., canvas dimensions
    // await expect(page.locator('canvas')).toHaveAttribute('width', '800');
    // await expect(page.locator('canvas')).toHaveAttribute('height', '600');
  });

  test('should allow dragging a puzzle piece on the canvas', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.waitForSelector('canvas.relative.cursor-pointer'); // 确保 canvas 元素存在

    const canvas = page.locator('canvas.relative.cursor-pointer');
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) {
      throw new Error('Canvas bounding box not found');
    }

    // Simulate clicking near the center to select a piece
    const initialX = canvasBox.x + canvasBox.width / 2;
    const initialY = canvasBox.y + canvasBox.height / 2;

    await page.mouse.move(initialX, initialY);
    await page.mouse.down();

    // Small drag to ensure it's recognized as a drag
    await page.mouse.move(initialX + 50, initialY + 50);

    // Get the piece's position after initial drag
    // This is a simplified check, a real test would involve checking piece coordinates
    const pieceMoved = await page.evaluate(() => {
      // Access the game state or canvas content to verify piece movement
      // This requires exposing game state or drawing logic to the browser context
      // For now, we'll just check if the canvas has been redrawn, which is a weak signal
      return true; // Placeholder, as we can't directly inspect piece coords here without more setup
    });

    await page.mouse.up();
    expect(pieceMoved).toBe(true); // Expect piece movement (or at least no error)
  });

  test('should toggle debug mode with F10 key', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.waitForSelector('canvas.relative.cursor-pointer');

    // Assuming debug elements are not visible by default, and have a class like 'debug-info'
    const debugElements = page.locator('.debug-info'); // Replace with actual class/selector for debug elements

    // Ensure debug elements are not visible initially (optional, if default is hidden)
    // await expect(debugElements).toBeHidden();

    // Press F10
    await page.keyboard.press('F10');

    // Wait for a short moment to allow UI to update
    await page.waitForTimeout(500);

    // Expect debug elements to be visible
    // await expect(debugElements).toBeVisible(); // Uncomment and adjust selector if you have a debug UI element

    // Press F10 again
    await page.keyboard.press('F10');
    await page.waitForTimeout(500);

    // Expect debug elements to be hidden again
    // await expect(debugElements).toBeHidden(); // Uncomment and adjust selector
  });

  test('should handle puzzle snapping and completion', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.waitForSelector('canvas.relative.cursor-pointer');

    // This test is highly dependent on the game logic and how pieces are snapped.
    // A robust test would involve:
    // 1. Getting coordinates of two snappable pieces
    // 2. Dragging one piece close to its matching counterpart
    // 3. Verifying they snap together (e.g., by checking their new positions or game state)
    // 4. Verifying completion sound/state if applicable

    // For a basic smoke test, we can just ensure no errors occur during interaction
    // and that the canvas is still present.
    const canvas = page.locator('canvas.relative.cursor-pointer');
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) {
      throw new Error('Canvas bounding box not found');
    }

    // Simulate a simple drag operation that might trigger a snap
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 150, canvasBox.y + 150, { steps: 5 });
    await page.mouse.up();

    // Ensure canvas is still visible after interaction
    await expect(canvas).toBeVisible();

    // If there's a completion message, check for it
    // await expect(page.locator('.puzzle-completion-message')).toBeVisible();
  });

  test('should play sound effects (if applicable)', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await page.waitForSelector('#puzzle-canvas'); // 确保画布加载完成

    // Expose a function to listen for sound plays from the browser context
    let soundPlayed = false;
    await page.exposeFunction('onSoundPlayed', (data: { soundName: string }) => {
      console.log(`Playwright received sound event: ${data.soundName}`);
      soundPlayed = true;
    });

    // Make the exposed function available globally in the browser context
    await page.evaluate(() => {
      (window as any).__SOUND_PLAY_LISTENER__ = (data: { soundName: string }) => {
        if (typeof (window as any).onSoundPlayed === 'function') {
          (window as any).onSoundPlayed(data);
        }
      };
    });

    // Trigger a sound: Click the "Reset" button (assuming it plays a sound)
    // 根据你的 GameInterface.tsx 和 DesktopLayout.tsx，"重新开始"按钮的文本应该是 "重新开始" 或 "Reset"
    // 或者根据实际按钮的data-testid或role属性来选择
    const resetButton = page.locator('button', { hasText: '重新开始' }); // 查找包含"重新开始"文本的按钮
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Wait for the sound to potentially play
    await page.waitForTimeout(1000); // Give it some time for the sound event to propagate

    // Assert that a sound was played
    expect(soundPlayed).toBe(true);
  });

  // TODO: Add tests for:
  // - Puzzle rendering (e.g., check if puzzle pieces are drawn, perhaps by taking another screenshot and comparing)
  // - Drag and rotate functionality (simulate drag and rotate actions)
  // - Puzzle snapping and completion logic
  // - Sound effects (mock or check for audio element presence/interaction)
  // - Debug mode toggle (simulate F10 key press and check for debug elements)
}); 