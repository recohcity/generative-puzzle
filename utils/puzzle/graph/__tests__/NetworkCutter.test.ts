import { NetworkCutter } from '../NetworkCutter';
import { Point } from '@/types/puzzleTypes';
import { BezierCurve } from '../BezierCurve';

describe('NetworkCutter', () => {
    // Helper to create a square shape
    const createSquare = (size: number): Point[] => [
        { x: 0, y: 0 },
        { x: size, y: 0 },
        { x: size, y: size },
        { x: 0, y: size }
    ];

    test('should return original shape if no curves provided', () => {
        const square = createSquare(100);
        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, []);
        expect(result.shapes.length).toBe(1);
        // Expect points to have isOriginal: false
        expect(result.shapes[0]).toEqual(square.map(p => ({ ...p, isOriginal: false })));
    });

    test('should cut square with two crossing lines', () => {
        const square = createSquare(100);
        const curves = [
            // Horizontal mid line
            new BezierCurve({ x: -10, y: 50 }, { x: 50, y: 50 }, { x: 110, y: 50 }),
            // Vertical mid line
            new BezierCurve({ x: 50, y: -10 }, { x: 50, y: 50 }, { x: 50, y: 110 })
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);

        // Should result in 4 pieces
        expect(result.shapes.length).toBe(4);

        // Total area should match original (100*100 = 10000)
        const totalArea = result.shapes.reduce((sum, shape) => sum + Math.abs(NetworkCutter.getSignedArea(shape)), 0);
        expect(totalArea).toBeCloseTo(10000, 1);
    });

    test('generate() should use anchor system to ensure cuts', () => {
        const square = createSquare(100);
        // Request 5 cuts. With anchor system, we expect significant cutting.
        const shapes = NetworkCutter.generate(square, 5);

        // Should have more than 1 piece (meaning some cuts happened)
        expect(shapes.length).toBeGreaterThan(1);

        // Check for valid polygons
        shapes.forEach(shape => {
            expect(shape.length).toBeGreaterThanOrEqual(3);
        });
    });

    test('should discretize shape for "curve" shapeType', () => {
        const square = createSquare(100);
        // Using count=0 to only see the effect of discretization/shape mirroring
        const shapes = NetworkCutter.generate(square, 0, "curve");

        // Discretization should result in many more points than the original 4
        expect(shapes[0].length).toBeGreaterThan(4);

        // Total area for a 100x100 square with midpoint-based curves is expected to be
        // smaller than 10000 (around 8325 based on previous run)
        const area = Math.abs(NetworkCutter.getSignedArea(shapes[0]));
        expect(area).toBeGreaterThan(8000);
        expect(area).toBeLessThan(9000);
    });
});
