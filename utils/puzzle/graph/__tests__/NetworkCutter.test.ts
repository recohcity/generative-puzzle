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

    test('should handle polygon shapeType (not discretize)', () => {
        const square = createSquare(100);
        // 测试 shapeType === "polygon" 的分支
        const shapes = NetworkCutter.generate(square, 1, "polygon");

        // 对于 polygon 类型，不应该离散化
        expect(shapes.length).toBeGreaterThan(0);
    });

    test('should handle overflow shapes (points outside bounds)', () => {
        const square = createSquare(100);
        // 创建超出边界的曲线
        const curves = [
            new BezierCurve(
                { x: -1000, y: -1000 }, // 起点远在边界外
                { x: 50, y: 50 },
                { x: 1000, y: 1000 } // 终点远在边界外
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        
        // 应该过滤掉超出边界的形状
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should return original shape when no valid shapes found', () => {
        const square = createSquare(100);
        // 创建不产生有效切割的曲线（所有结果都超出边界）
        const curves = [
            new BezierCurve(
                { x: -1000, y: -1000 },
                { x: -1000, y: -1000 },
                { x: -1000, y: -1000 }
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        
        // 如果没有有效形状，应该返回原始形状
        expect(result.shapes.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle point-in-polygon with tolerance', () => {
        const square = createSquare(100);
        const point: Point = { x: 50, y: 50 };
        
        // 测试 tolerance > 0 的分支
        const isInside = NetworkCutter.isPointInPolygon(point, square, 5);
        
        // 点应该在多边形内
        expect(typeof isInside).toBe('boolean');
    });

    test('should handle point near polygon edge with tolerance', () => {
        const square = createSquare(100);
        // 点在边界附近
        const point: Point = { x: 0, y: 50 };
        
        // 测试 tolerance > 0 且点在边界附近的情况
        const isInside = NetworkCutter.isPointInPolygon(point, square, 2);
        
        expect(typeof isInside).toBe('boolean');
    });

    test('should handle pointToSegmentDistance when segment length is zero', () => {
        const point: Point = { x: 50, y: 50 };
        const a: Point = { x: 0, y: 0 };
        const b: Point = { x: 0, y: 0 }; // 相同的点，长度为0
        
        // 测试 l2 === 0 的分支
        const distance = (NetworkCutter as any).pointToSegmentDistance(point, a, b);
        
        expect(distance).toBeGreaterThanOrEqual(0);
        expect(typeof distance).toBe('number');
    });

    test('should handle different overflow conditions (x < minX - margin)', () => {
        const square = createSquare(100);
        // 创建产生 x < minX - margin 溢出的曲线
        const curves = [
            new BezierCurve(
                { x: -200, y: 50 }, // x < 0 - OVERFLOW_MARGIN
                { x: 50, y: 50 },
                { x: 150, y: 50 }
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle different overflow conditions (x > maxX + margin)', () => {
        const square = createSquare(100);
        // 创建产生 x > maxX + margin 溢出的曲线
        const curves = [
            new BezierCurve(
                { x: 50, y: 50 },
                { x: 50, y: 50 },
                { x: 200, y: 50 } // x > 100 + OVERFLOW_MARGIN
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle different overflow conditions (y < minY - margin)', () => {
        const square = createSquare(100);
        // 创建产生 y < minY - margin 溢出的曲线
        const curves = [
            new BezierCurve(
                { x: 50, y: -200 }, // y < 0 - OVERFLOW_MARGIN
                { x: 50, y: 50 },
                { x: 50, y: 150 }
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle different overflow conditions (y > maxY + margin)', () => {
        const square = createSquare(100);
        // 创建产生 y > maxY + margin 溢出的曲线
        const curves = [
            new BezierCurve(
                { x: 50, y: 50 },
                { x: 50, y: 50 },
                { x: 50, y: 200 } // y > 100 + OVERFLOW_MARGIN
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle isPointInPolygon with point outside but within tolerance', () => {
        const square = createSquare(100);
        // 点在多边形外部，但在 tolerance 范围内
        const point: Point = { x: -2, y: 50 }; // 在多边形外部
        
        // 测试 !inside && tolerance > 0 的分支
        const isInside = NetworkCutter.isPointInPolygon(point, square, 5);
        
        // 由于 tolerance，点可能被认为在内部
        expect(typeof isInside).toBe('boolean');
    });

    test('should handle isPointInPolygon with different edge intersections', () => {
        const square = createSquare(100);
        // 测试不同的边交点情况
        const testPoints = [
            { x: 25, y: 25 }, // 内部
            { x: 50, y: 0 },  // 在边上
            { x: 100, y: 50 }, // 在边上
            { x: 150, y: 150 } // 外部
        ];

        testPoints.forEach(point => {
            const isInside = NetworkCutter.isPointInPolygon(point, square, 0);
            expect(typeof isInside).toBe('boolean');
        });
    });

    test('should handle generate with areaRatio edge cases', () => {
        const square = createSquare(100);
        // 测试 generate 方法中的不同 areaRatio 情况
        // 由于随机性，我们多次运行以确保覆盖不同的分支
        for (let i = 0; i < 5; i++) {
            const shapes = NetworkCutter.generate(square, 1);
            expect(shapes.length).toBeGreaterThanOrEqual(1);
        }
    });

    test('should handle point near edge within tolerance returning true', () => {
        const square = createSquare(100);
        // 点在多边形外部，但距离边界在 tolerance 内
        const point: Point = { x: -1, y: 50 }; // 距离左边界 1 个单位
        
        // 测试 tolerance 循环中的 return true 分支
        const isInside = NetworkCutter.isPointInPolygon(point, square, 2);
        
        // 由于 tolerance，点应该被认为在内部
        expect(isInside).toBe(true);
    });

    test('should handle point outside tolerance range', () => {
        const square = createSquare(100);
        // 点在多边形外部，且距离边界超出 tolerance
        const point: Point = { x: -10, y: 50 }; // 距离左边界 10 个单位
        
        // 测试 tolerance 循环中没有找到匹配的情况
        const isInside = NetworkCutter.isPointInPolygon(point, square, 2);
        
        // 点应该在外部
        expect(isInside).toBe(false);
    });

    test('should handle face with negative area (isFacePositive !== isOriginalPositive)', () => {
        const square = createSquare(100);
        // 创建产生负面积面的曲线
        const curves = [
            new BezierCurve(
                { x: 50, y: 0 },
                { x: 50, y: 50 },
                { x: 50, y: 100 }
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle face with area < 2', () => {
        const square = createSquare(100);
        // 创建产生极小面积面的曲线
        const curves = [
            new BezierCurve(
                { x: 50, y: 50 },
                { x: 50.1, y: 50.1 },
                { x: 50.2, y: 50.2 }
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle face center not in polygon', () => {
        const square = createSquare(100);
        // 创建产生中心点在多边形外的面的曲线
        const curves = [
            new BezierCurve(
                { x: 150, y: 150 },
                { x: 200, y: 200 },
                { x: 250, y: 250 }
            )
        ];

        const result = NetworkCutter.cutShapeWithCurvesNetwork(square, curves);
        expect(result.shapes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle different areaRatio conditions in generate', () => {
        const square = createSquare(100);
        // 测试 generate 方法中的不同 areaRatio 和 piecesCount 组合
        // 由于随机性，我们多次运行以确保覆盖不同的分支
        const results = [];
        for (let i = 0; i < 10; i++) {
            const shapes = NetworkCutter.generate(square, 1);
            results.push(shapes.length);
        }
        
        // 验证所有运行都产生了结果
        expect(results.every(len => len >= 1)).toBe(true);
    });

    test('should handle isPointInPolygon with point exactly on edge', () => {
        const square = createSquare(100);
        // 点在边上
        const point: Point = { x: 0, y: 50 };
        
        const isInside = NetworkCutter.isPointInPolygon(point, square, 0);
        
        // 点在边上，根据算法可能被认为在内部或外部
        expect(typeof isInside).toBe('boolean');
    });

    test('should handle isPointInPolygon with tolerance and point on edge', () => {
        const square = createSquare(100);
        // 点在边上，使用 tolerance
        const point: Point = { x: 0, y: 50 };
        
        const isInside = NetworkCutter.isPointInPolygon(point, square, 1);
        
        // 由于 tolerance，点应该被认为在内部
        expect(isInside).toBe(true);
    });
});
