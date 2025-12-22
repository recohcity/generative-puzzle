import { test, expect } from '@playwright/test';

test('Geometric Integrity Check - Curve Cutting', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas#puzzle-canvas');

    // 1. Generate Cloud Shape
    await page.getByTestId('shape-curve-button').click();

    // 2. Select Curve Cutting and Generate
    await page.getByTestId('cut-type-curve-button').click();
    await page.getByTestId('cut-count-8-button').click();
    await page.getByTestId('generate-puzzle-button').click();

    // Wait for puzzle to be generated in state
    await page.waitForFunction(() => (window as any).__gameStateForTests__.puzzle !== null);

    // 3. Perform Geometric Verification
    const integrityResults = await page.evaluate(() => {
        const state = (window as any).__gameStateForTests__;
        const originalShape = state.originalShape;
        const shapeType = state.shapeType;
        const pieces = state.puzzle;

        // Discretization logic (must match NetworkCutter)
        function discretize(shape: { x: number, y: number }[]) {
            if (shape.length < 3) return shape;
            const result: { x: number, y: number }[] = [];
            const STEPS = 40;
            for (let i = 0; i < shape.length; i++) {
                const p0 = shape[i];
                const p1 = shape[(i + 1) % shape.length];
                const p2 = shape[(i + 2) % shape.length];
                const startX = (p0.x + p1.x) / 2;
                const startY = (p0.y + p1.y) / 2;
                const endX = (p1.x + p2.x) / 2;
                const endY = (p1.y + p2.y) / 2;
                for (let t = 0; t <= STEPS; t++) {
                    if (t === STEPS && i < shape.length - 1) continue;
                    const ratio = t / STEPS;
                    const inv = 1 - ratio;
                    const x = inv * inv * startX + 2 * inv * ratio * p1.x + ratio * ratio * endX;
                    const y = inv * inv * startY + 2 * inv * ratio * p1.y + ratio * ratio * endY;
                    result.push({ x, y });
                }
            }
            return result;
        }

        const actualShape = (shapeType !== 'polygon')
            ? discretize(originalShape)
            : originalShape;

        // Point in Polygon algorithm
        function isPointInPolygon(point: { x: number, y: number }, polygon: { x: number, y: number }[]) {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i].x, yi = polygon[i].y;
                const xj = polygon[j].x, yj = polygon[j].y;
                const intersect = ((yi > point.y) !== (yj > point.y)) &&
                    (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }

        const spills = [];
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i];
            const piecePoints = piece.points;

            for (let j = 0; j < piecePoints.length; j++) {
                const p1 = piecePoints[j];
                const p2 = piecePoints[(j + 1) % piecePoints.length];
                const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

                const isInside = isPointInPolygon(mid, actualShape);
                if (!isInside) {
                    let minDist = Infinity;
                    for (let k = 0; k < actualShape.length; k++) {
                        const b1 = actualShape[k];
                        const d = Math.hypot(mid.x - b1.x, mid.y - b1.y);
                        if (d < minDist) minDist = d;
                    }
                    if (minDist > 1.0) {
                        spills.push({ pieceIndex: i, edgeIndex: j, midPoint: mid, dist: minDist });
                    }
                }
            }
        }

        return {
            totalPieces: pieces.length,
            spillCount: spills.length,
            spills: spills.slice(0, 10) // Only return first 10 for log brevity
        };
    });

    console.log('Integrity Verification Results:', integrityResults);

    expect(integrityResults.spillCount).toBe(0);
});
