/**
 * helper 单元测试
 * 
 * 🎯 验证辅助工具函数核心逻辑
 */

import { calculateCenter } from '../helper';

// 定义Point类型（从helper.ts中复制）
type Point = {
  x: number;
  y: number;
  isOriginal?: boolean;
};

describe('helper - 辅助工具函数测试', () => {
  
  describe('🔑 calculateCenter 函数测试', () => {
    test('应该正确计算正方形的中心点', () => {
      const squarePoints: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      const center = calculateCenter(squarePoints);

      expect(center.x).toBeCloseTo(50, 10);
      expect(center.y).toBeCloseTo(50, 10);
    });

    test('应该正确计算三角形的中心点', () => {
      const trianglePoints: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ];

      const center = calculateCenter(trianglePoints);

      expect(center.x).toBeCloseTo(50, 10);
      expect(center.y).toBeCloseTo(33.333333, 5);
    });

    test('应该正确计算单点的中心', () => {
      const singlePoint: Point[] = [
        { x: 25, y: 35 }
      ];

      const center = calculateCenter(singlePoint);

      expect(center.x).toBe(25);
      expect(center.y).toBe(35);
    });

    test('应该正确计算两点的中心', () => {
      const twoPoints: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 200 }
      ];

      const center = calculateCenter(twoPoints);

      expect(center.x).toBe(50);
      expect(center.y).toBe(100);
    });

    test('应该处理包含isOriginal属性的点', () => {
      const pointsWithOriginal: Point[] = [
        { x: 0, y: 0, isOriginal: true },
        { x: 100, y: 0, isOriginal: false },
        { x: 100, y: 100, isOriginal: true },
        { x: 0, y: 100, isOriginal: false }
      ];

      const center = calculateCenter(pointsWithOriginal);

      expect(center.x).toBeCloseTo(50, 10);
      expect(center.y).toBeCloseTo(50, 10);
    });

    test('应该处理负坐标的点', () => {
      const negativePoints: Point[] = [
        { x: -50, y: -30 },
        { x: 50, y: -30 },
        { x: 50, y: 70 },
        { x: -50, y: 70 }
      ];

      const center = calculateCenter(negativePoints);

      expect(center.x).toBeCloseTo(0, 10);
      expect(center.y).toBeCloseTo(20, 10);
    });

    test('应该处理浮点坐标的点', () => {
      const floatPoints: Point[] = [
        { x: 0.1, y: 0.2 },
        { x: 99.9, y: 0.2 },
        { x: 99.9, y: 99.8 },
        { x: 0.1, y: 99.8 }
      ];

      const center = calculateCenter(floatPoints);

      expect(center.x).toBeCloseTo(50, 10);
      expect(center.y).toBeCloseTo(50, 10);
    });

    test('应该处理不规则多边形', () => {
      const irregularPoints: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 150, y: 50 },
        { x: 100, y: 100 },
        { x: 50, y: 150 },
        { x: 0, y: 100 },
        { x: -50, y: 50 }
      ];

      const center = calculateCenter(irregularPoints);

      expect(typeof center.x).toBe('number');
      expect(typeof center.y).toBe('number');
      expect(Number.isFinite(center.x)).toBe(true);
      expect(Number.isFinite(center.y)).toBe(true);
    });

    test('应该处理圆形点集', () => {
      const circlePoints: Point[] = [];
      const radius = 50;
      const centerX = 100;
      const centerY = 100;
      const pointCount = 8;

      for (let i = 0; i < pointCount; i++) {
        const angle = (i * 2 * Math.PI) / pointCount;
        circlePoints.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      }

      const center = calculateCenter(circlePoints);

      expect(center.x).toBeCloseTo(centerX, 5);
      expect(center.y).toBeCloseTo(centerY, 5);
    });
  });

  describe('🔑 边界条件测试', () => {
    test('应该处理空数组', () => {
      const emptyPoints: Point[] = [];

      const center = calculateCenter(emptyPoints);
      // 空数组会返回初始值 {x: 0, y: 0}
      expect(center.x).toBe(0);
      expect(center.y).toBe(0);
    });

    test('应该处理包含无效坐标的点', () => {
      const invalidPoints: Point[] = [
        { x: NaN, y: 100 },
        { x: 200, y: Infinity },
        { x: 150, y: -Infinity },
        { x: 100, y: 200 }
      ];

      expect(() => {
        const center = calculateCenter(invalidPoints);
        // 结果可能包含NaN或Infinity，但不应该抛出错误
        expect(typeof center.x).toBe('number');
        expect(typeof center.y).toBe('number');
      }).not.toThrow();
    });

    test('应该处理极大坐标值', () => {
      const extremePoints: Point[] = [
        { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER },
        { x: Number.MIN_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER }
      ];

      expect(() => {
        const center = calculateCenter(extremePoints);
        expect(typeof center.x).toBe('number');
        expect(typeof center.y).toBe('number');
      }).not.toThrow();
    });

    test('应该处理极小坐标值', () => {
      const tinyPoints: Point[] = [
        { x: Number.EPSILON, y: Number.EPSILON },
        { x: -Number.EPSILON, y: -Number.EPSILON }
      ];

      const center = calculateCenter(tinyPoints);

      expect(center.x).toBeCloseTo(0, 15);
      expect(center.y).toBeCloseTo(0, 15);
    });
  });

  describe('🔑 性能基准测试', () => {
    test('计算中心点应该高效', () => {
      const largePointSet: Point[] = Array.from({ length: 1000 }, (_, i) => ({
        x: Math.random() * 1000,
        y: Math.random() * 1000
      }));

      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        calculateCenter(largePointSet);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      expect(avgTime).toBeLessThan(10); // 平均每次 < 10ms
    });

    test('应该能处理大量点的计算', () => {
      const massivePointSet: Point[] = Array.from({ length: 10000 }, (_, i) => ({
        x: i % 100,
        y: Math.floor(i / 100)
      }));

      const startTime = performance.now();
      const center = calculateCenter(massivePointSet);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // < 50ms
      expect(typeof center.x).toBe('number');
      expect(typeof center.y).toBe('number');
    });
  });

  describe('🔑 数学精度验证', () => {
    test('计算结果应该具有数学精度', () => {
      const precisePoints: Point[] = [
        { x: 1/3, y: 1/7 },
        { x: 2/3, y: 2/7 },
        { x: 1, y: 3/7 }
      ];

      const center = calculateCenter(precisePoints);

      expect(center.x).toBeCloseTo((1/3 + 2/3 + 1) / 3, 15);
      expect(center.y).toBeCloseTo((1/7 + 2/7 + 3/7) / 3, 15);
    });

    test('应该保持计算的对称性', () => {
      const symmetricPoints: Point[] = [
        { x: -100, y: -100 },
        { x: 100, y: -100 },
        { x: 100, y: 100 },
        { x: -100, y: 100 }
      ];

      const center = calculateCenter(symmetricPoints);

      expect(center.x).toBeCloseTo(0, 15);
      expect(center.y).toBeCloseTo(0, 15);
    });
  });

  describe('🔑 数据完整性验证', () => {
    test('返回的中心点应该包含正确的属性', () => {
      const testPoints: Point[] = [
        { x: 10, y: 20 },
        { x: 30, y: 40 }
      ];

      const center = calculateCenter(testPoints);

      expect(center).toHaveProperty('x');
      expect(center).toHaveProperty('y');
      expect(typeof center.x).toBe('number');
      expect(typeof center.y).toBe('number');
    });

    test('不应该修改输入的点数组', () => {
      const originalPoints: Point[] = [
        { x: 10, y: 20, isOriginal: true },
        { x: 30, y: 40, isOriginal: false }
      ];
      const pointsCopy = JSON.parse(JSON.stringify(originalPoints));

      calculateCenter(originalPoints);

      expect(originalPoints).toEqual(pointsCopy);
    });

    test('应该处理只读的点数组', () => {
      const readonlyPoints: readonly Point[] = [
        { x: 10, y: 20 },
        { x: 30, y: 40 }
      ] as const;

      expect(() => {
        const center = calculateCenter(readonlyPoints as Point[]);
        expect(center.x).toBe(20);
        expect(center.y).toBe(30);
      }).not.toThrow();
    });
  });

  describe('🔑 实际应用场景验证', () => {
    test('应该正确计算拼图片段的中心', () => {
      // 模拟一个拼图片段的点集
      const puzzlePiecePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 120, y: 95, isOriginal: false },
        { x: 140, y: 100, isOriginal: true },
        { x: 145, y: 120, isOriginal: false },
        { x: 140, y: 140, isOriginal: true },
        { x: 120, y: 145, isOriginal: false },
        { x: 100, y: 140, isOriginal: true },
        { x: 95, y: 120, isOriginal: false }
      ];

      const center = calculateCenter(puzzlePiecePoints);

      expect(center.x).toBeCloseTo(120, 5);
      expect(center.y).toBeCloseTo(120, 5);
    });

    test('应该支持动态形状的中心计算', () => {
      // 模拟形状在动画过程中的变化
      const basePoints: Point[] = [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 150 },
        { x: 50, y: 150 }
      ];

      // 应用变换（缩放和平移）
      const transformedPoints = basePoints.map(point => ({
        x: point.x * 1.5 + 25,
        y: point.y * 1.5 + 25
      }));

      const originalCenter = calculateCenter(basePoints);
      const transformedCenter = calculateCenter(transformedPoints);

      // 验证变换后的中心点关系
      expect(transformedCenter.x).toBeCloseTo(originalCenter.x * 1.5 + 25, 10);
      expect(transformedCenter.y).toBeCloseTo(originalCenter.y * 1.5 + 25, 10);
    });
  });
});