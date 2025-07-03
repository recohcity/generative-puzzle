import { test, expect } from '@playwright/test';

test.describe('Responsive Adaptation Tests', () => {
  test('should adapt puzzle pieces correctly on viewport resize', async ({ page }) => {
    // 1. Initial Setup
    await page.goto('/');
    await expect(page.locator('#puzzle-canvas')).toBeVisible();

    // Generate a simple puzzle
    await page.evaluate(() => window.testAPI.generateShape('polygon'));
    await page.evaluate(() => window.testAPI.generatePuzzle(4)); // 4 cuts = 5 pieces
    await page.evaluate(() => window.testAPI.scatterPuzzle());
    await page.waitForTimeout(500); // Wait for scatter animation

    // 2. Move pieces to specific locations
    // Move piece 1 to a known location (uncompleted)
    await page.evaluate(() => window.testAPI.movePiece(1, 200, 300));
    // Complete piece 2
    await page.evaluate(() => window.testAPI.snapPiece(2));
    
    await page.waitForTimeout(200); // allow state to update

    // 3. Record Initial State
    const initialViewport = page.viewportSize();
    if (!initialViewport) throw new Error('Could not get viewport size');

    const initialState = await page.evaluate(() => ({
        piece1: window.testAPI.getPieceCenter(1),
        piece2: window.testAPI.getPieceCenter(2),
    }));

    const piece1InitialRelativePos = {
        x: initialState.piece1.x / initialViewport.width,
        y: initialState.piece1.y / initialViewport.height,
    };
    
    // 4. Resize the viewport
    const newViewport = { width: 800, height: 600 };
    await page.setViewportSize(newViewport);
    await page.waitForTimeout(500); // Wait for adaptation logic and re-render

    // 5. Record New State and Assert
    const finalState = await page.evaluate(() => ({
        piece1: window.testAPI.getPieceCenter(1),
        piece2: window.testAPI.getPieceCenter(2),
        targetForPiece2: window.testAPI.getPieceTargetCenter(2)
    }));
    
    // Assertion for the uncompleted piece (piece 1)
    const piece1FinalRelativePos = {
        x: finalState.piece1.x / newViewport.width,
        y: finalState.piece1.y / newViewport.height,
    };

    expect(piece1FinalRelativePos.x).toBeCloseTo(piece1InitialRelativePos.x, 2);
    expect(piece1FinalRelativePos.y).toBeCloseTo(piece1InitialRelativePos.y, 2);

    // Assertion for the completed piece (piece 2)
    // It should be at its new target position
    expect(finalState.piece2.x).toBeCloseTo(finalState.targetForPiece2.x, 1);
    expect(finalState.piece2.y).toBeCloseTo(finalState.targetForPiece2.y, 1);
  });
}); 

test('smoke', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
});