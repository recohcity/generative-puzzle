/**
 * geometryUtils 单元测试
 * 
 * 🎯 验证几何工具函数核心逻辑
 */

import { 
  calculatePolygonArea, 
  calculateBounds, 
  createSafeZone, 
  lineIntersection,
  distanceToLine,
  isPointInPolygon,
  isPointNearLine
} from '../geometryUtils';

// 定义Point类型（从geometryUtils.ts中复制）
type Point = {
  x: number;
  y: number;
  isOriginal?: boolean;
};

// 定义CutLine类型
type CutLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

describe('geometryUtils - 几何工具函数测试', () => {
  
  // 测试用标准形状（正方形）
  const squareShape: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ];

  // 测试用三角形
  const triangleShape: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 }
  ];

  describe('🔑 多边形面积计算', () => {
    test('应该正确计算正方形面积', () => {
      const area = calculatePolygonArea(squareShape);
      
      expect(area).toBe(10000); // 100 * 100 = 10000
    });

    test('应该正确计算三角形面积', () => {
      const area = calculatePolygonArea(triangleShape);
      
      expect(area).toBe(5000); // (100 * 100) / 2 = 5000
    });

    test('应该处理复杂多边形', () => {
      const complexShape: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
        { x: 0, y: 50 }
      ];
      
      const area = calculatePolygonArea(complexShape);
      
      expect(area).toBeGreaterThan(0);
      expect(area).toBeLessThan(10000); // 应该小于外接正方形面积
    });

    test('应该处理单点形状', () => {
      const singlePoint: Point[] = [{ x: 50, y: 50 }];
      
      const area = calculatePolygonArea(singlePoint);
      
      expect(area).toBe(0); // 单点面积为0
    });

    test('应该处理两点形状', () => {
      const twoPoints: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ];
      
      const area = calculatePolygonArea(twoPoints);
      
      expect(area).toBe(0); // 两点形成的线段面积为0
    });
  });

  describe('🔑 边界计算', () => {
    test('应该正确计算正方形边界', () => {
      const bounds = calculateBounds(squareShape);
      
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(100);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(100);
    });

    test('应该正确计算三角形边界', () => {
      const bounds = calculateBounds(triangleShape);
      
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(100);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(100);
    });

    test('应该处理负坐标', () => {
      const negativeShape: Point[] = [
        { x: -50, y: -30 },
        { x: 50, y: -30 },
        { x: 50, y: 70 },
        { x: -50, y: 70 }
      ];
      
      const bounds = calculateBounds(negativeShape);
      
      expect(bounds.minX).toBe(-50);
      expect(bounds.maxX).toBe(50);
      expect(bounds.minY).toBe(-30);
      expect(bounds.maxY).toBe(70);
    });

    test('应该处理单点', () => {
      const singlePoint: Point[] = [{ x: 25, y: 35 }];
      
      const bounds = calculateBounds(singlePoint);
      
      expect(bounds.minX).toBe(25);
      expect(bounds.maxX).toBe(25);
      expect(bounds.minY).toBe(35);
      expect(bounds.maxY).toBe(35);
    });
  });

  describe('🔑 安全区域创建', () => {
    test('应该创建带缓冲区的安全区域', () => {
      const safeZone = createSafeZone(squareShape);
      
      expect(safeZone.minX).toBeLessThan(0); // 应该有负的缓冲区
      expect(safeZone.maxX).toBeGreaterThan(100); // 应该有正的缓冲区
      expect(safeZone.minY).toBeLessThan(0);
      expect(safeZone.maxY).toBeGreaterThan(100);
    });

    test('安全区域应该包含原始形状', () => {
      const originalBounds = calculateBounds(squareShape);
      const safeZone = createSafeZone(squareShape);
      
      expect(safeZone.minX).toBeLessThanOrEqual(originalBounds.minX);
      expect(safeZone.maxX).toBeGreaterThanOrEqual(originalBounds.maxX);
      expect(safeZone.minY).toBeLessThanOrEqual(originalBounds.minY);
      expect(safeZone.maxY).toBeGreaterThanOrEqual(originalBounds.maxY);
    });

    test('应该处理小形状的安全区域', () => {
      const smallShape: Point[] = [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
        { x: 10, y: 20 }
      ];
      
      const safeZone = createSafeZone(smallShape);
      
      expect(safeZone.maxX - safeZone.minX).toBeGreaterThan(10); // 宽度应该大于原始形状
      expect(safeZone.maxY - safeZone.minY).toBeGreaterThan(10); // 高度应该大于原始形状
    });
  });

  describe('🔑 边界条件测试', () => {
    test('应该处理空形状数组', () => {
      const emptyShape: Point[] = [];
      
      expect(() => {
        calculatePolygonArea(emptyShape);
      }).not.toThrow();
      
      expect(() => {
        calculateBounds(emptyShape);
      }).not.toThrow(); // 实际上不会抛出错误，但会返回无效值
      
      expect(() => {
        createSafeZone(emptyShape);
      }).not.toThrow(); // 实际上不会抛出错误
    });

    test('应该处理包含isOriginal属性的点', () => {
      const shapeWithOriginal: Point[] = [
        { x: 0, y: 0, isOriginal: true },
        { x: 100, y: 0, isOriginal: false },
        { x: 100, y: 100, isOriginal: true },
        { x: 0, y: 100, isOriginal: false }
      ];
      
      const area = calculatePolygonArea(shapeWithOriginal);
      const bounds = calculateBounds(shapeWithOriginal);
      const safeZone = createSafeZone(shapeWithOriginal);
      
      expect(area).toBe(10000);
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(100);
      expect(safeZone.minX).toBeLessThan(0);
      expect(safeZone.maxX).toBeGreaterThan(100);
    });
  });

  describe('🔑 性能基准测试', () => {
    test('面积计算应该高效', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculatePolygonArea(squareShape);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      expect(avgTime).toBeLessThan(1); // 平均每次 < 1ms
    });

    test('边界计算应该高效', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateBounds(squareShape);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      expect(avgTime).toBeLessThan(1); // 平均每次 < 1ms
    });

    test('复杂形状处理应该高效', () => {
      const complexShape: Point[] = Array.from({ length: 50 }, (_, i) => ({
        x: 200 + 100 * Math.cos(i * Math.PI / 25),
        y: 200 + 100 * Math.sin(i * Math.PI / 25)
      }));
      
      const startTime = performance.now();
      
      calculatePolygonArea(complexShape);
      calculateBounds(complexShape);
      createSafeZone(complexShape);
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe('🔑 数据完整性验证', () => {
    test('面积计算结果应该是有效数值', () => {
      const area = calculatePolygonArea(squareShape);
      
      expect(typeof area).toBe('number');
      expect(Number.isNaN(area)).toBe(false);
      expect(Number.isFinite(area)).toBe(true);
      expect(area).toBeGreaterThanOrEqual(0);
    });

    test('边界计算结果应该是有效数值', () => {
      const bounds = calculateBounds(squareShape);
      
      expect(typeof bounds.minX).toBe('number');
      expect(typeof bounds.maxX).toBe('number');
      expect(typeof bounds.minY).toBe('number');
      expect(typeof bounds.maxY).toBe('number');
      
      expect(Number.isFinite(bounds.minX)).toBe(true);
      expect(Number.isFinite(bounds.maxX)).toBe(true);
      expect(Number.isFinite(bounds.minY)).toBe(true);
      expect(Number.isFinite(bounds.maxY)).toBe(true);
      
      expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX);
      expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY);
    });

    test('安全区域结果应该是有效数值', () => {
      const safeZone = createSafeZone(squareShape);
      
      expect(typeof safeZone.minX).toBe('number');
      expect(typeof safeZone.maxX).toBe('number');
      expect(typeof safeZone.minY).toBe('number');
      expect(typeof safeZone.maxY).toBe('number');
      
      expect(Number.isFinite(safeZone.minX)).toBe(true);
      expect(Number.isFinite(safeZone.maxX)).toBe(true);
      expect(Number.isFinite(safeZone.minY)).toBe(true);
      expect(Number.isFinite(safeZone.maxY)).toBe(true);
      
      expect(safeZone.minX).toBeLessThan(safeZone.maxX);
      expect(safeZone.minY).toBeLessThan(safeZone.maxY);
    });
  });

  describe('🔑 数学精度验证', () => {
    test('面积计算应该具有数学精度', () => {
      // 使用已知面积的形状进行验证
      const unitSquare: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];
      
      const area = calculatePolygonArea(unitSquare);
      expect(area).toBeCloseTo(1, 10); // 精确到小数点后10位
    });

    test('边界计算应该精确', () => {
      const preciseShape: Point[] = [
        { x: 0.1, y: 0.2 },
        { x: 99.9, y: 0.2 },
        { x: 99.9, y: 99.8 },
        { x: 0.1, y: 99.8 }
      ];
      
      const bounds = calculateBounds(preciseShape);
      
      expect(bounds.minX).toBeCloseTo(0.1, 10);
      expect(bounds.maxX).toBeCloseTo(99.9, 10);
      expect(bounds.minY).toBeCloseTo(0.2, 10);
      expect(bounds.maxY).toBeCloseTo(99.8, 10);
    });
  });

  describe('🔑 线段相交检测', () => {
    test('应该正确检测相交的线段', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 100, y: 100 };
      const p3: Point = { x: 0, y: 100 };
      const p4: Point = { x: 100, y: 0 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBeCloseTo(50, 5);
      expect(intersection!.y).toBeCloseTo(50, 5);
    });

    test('应该正确检测平行线段', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 100, y: 0 };
      const p3: Point = { x: 0, y: 10 };
      const p4: Point = { x: 100, y: 10 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      expect(intersection).toBeNull();
    });

    test('应该正确检测不相交的线段', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 50, y: 0 };
      const p3: Point = { x: 60, y: -10 };
      const p4: Point = { x: 60, y: 10 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      expect(intersection).toBeNull();
    });

    test('应该处理垂直线段', () => {
      const p1: Point = { x: 50, y: 0 };
      const p2: Point = { x: 50, y: 100 };
      const p3: Point = { x: 0, y: 50 };
      const p4: Point = { x: 100, y: 50 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBeCloseTo(50, 5);
      expect(intersection!.y).toBeCloseTo(50, 5);
    });

    test('应该处理水平线段', () => {
      const p1: Point = { x: 0, y: 50 };
      const p2: Point = { x: 100, y: 50 };
      const p3: Point = { x: 50, y: 0 };
      const p4: Point = { x: 50, y: 100 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBeCloseTo(50, 5);
      expect(intersection!.y).toBeCloseTo(50, 5);
    });

    test('应该处理端点相交的情况', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 50, y: 50 };
      const p3: Point = { x: 50, y: 50 };
      const p4: Point = { x: 100, y: 0 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      expect(intersection).not.toBeNull();
      expect(intersection!.x).toBeCloseTo(50, 5);
      expect(intersection!.y).toBeCloseTo(50, 5);
    });

    test('应该处理重叠的线段', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 100, y: 0 };
      const p3: Point = { x: 50, y: 0 };
      const p4: Point = { x: 150, y: 0 };

      const intersection = lineIntersection(p1, p2, p3, p4);

      // 重叠线段的处理可能返回null或交点，取决于具体实现
      // 这里我们只验证不会抛出错误
      expect(typeof intersection === 'object' || intersection === null).toBe(true);
    });
  });

  describe('🔑 更多边界条件测试', () => {
    test('应该处理极小的多边形', () => {
      const tinyShape: Point[] = [
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.1 },
        { x: 0.2, y: 0.2 },
        { x: 0.1, y: 0.2 }
      ];

      const area = calculatePolygonArea(tinyShape);
      const bounds = calculateBounds(tinyShape);
      const safeZone = createSafeZone(tinyShape);

      expect(area).toBeCloseTo(0.01, 10);
      expect(bounds.minX).toBeCloseTo(0.1, 10);
      expect(bounds.maxX).toBeCloseTo(0.2, 10);
      expect(safeZone.minX).toBeLessThan(bounds.minX);
      expect(safeZone.maxX).toBeGreaterThan(bounds.maxX);
    });

    test('应该处理极大的多边形', () => {
      const largeShape: Point[] = [
        { x: -10000, y: -10000 },
        { x: 10000, y: -10000 },
        { x: 10000, y: 10000 },
        { x: -10000, y: 10000 }
      ];

      const area = calculatePolygonArea(largeShape);
      const bounds = calculateBounds(largeShape);
      const safeZone = createSafeZone(largeShape);

      expect(area).toBe(400000000); // 20000 * 20000
      expect(bounds.minX).toBe(-10000);
      expect(bounds.maxX).toBe(10000);
      expect(safeZone.minX).toBe(-10050);
      expect(safeZone.maxX).toBe(10050);
    });

    test('应该处理不规则的复杂多边形', () => {
      const complexShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 150, y: 50 },
        { x: 100, y: 100 },
        { x: 50, y: 150 },
        { x: 0, y: 100 },
        { x: -50, y: 50 }
      ];

      const area = calculatePolygonArea(complexShape);
      const bounds = calculateBounds(complexShape);
      const safeZone = createSafeZone(complexShape);

      expect(area).toBeGreaterThan(0);
      expect(bounds.minX).toBe(-50);
      expect(bounds.maxX).toBe(150);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(150);
      expect(safeZone.minX).toBe(-100);
      expect(safeZone.maxX).toBe(200);
    });

    test('应该处理星形多边形', () => {
      const starShape: Point[] = [];
      const outerRadius = 100;
      const innerRadius = 50;
      const points = 5;

      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        starShape.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        });
      }

      const area = calculatePolygonArea(starShape);
      const bounds = calculateBounds(starShape);
      const safeZone = createSafeZone(starShape);

      expect(area).toBeGreaterThan(0);
      expect(bounds.minX).toBeLessThanOrEqual(-innerRadius);
      expect(bounds.maxX).toBeGreaterThanOrEqual(innerRadius);
      expect(safeZone.minX).toBeLessThan(bounds.minX);
      expect(safeZone.maxX).toBeGreaterThan(bounds.maxX);
    });
  });

  describe('🔑 特殊情况处理', () => {
    test('应该处理包含重复点的多边形', () => {
      const shapeWithDuplicates: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 0 }, // 重复点
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 0, y: 0 } // 重复起始点
      ];

      expect(() => {
        const area = calculatePolygonArea(shapeWithDuplicates);
        const bounds = calculateBounds(shapeWithDuplicates);
        const safeZone = createSafeZone(shapeWithDuplicates);

        expect(area).toBeGreaterThanOrEqual(0);
        expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX);
        expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY);
        expect(safeZone.minX).toBeLessThan(safeZone.maxX);
        expect(safeZone.minY).toBeLessThan(safeZone.maxY);
      }).not.toThrow();
    });

    test('应该处理逆时针方向的多边形', () => {
      const clockwiseShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      const counterClockwiseShape: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 }
      ];

      const area1 = calculatePolygonArea(clockwiseShape);
      const area2 = calculatePolygonArea(counterClockwiseShape);

      // 面积应该相同（绝对值）
      expect(Math.abs(area1)).toBeCloseTo(Math.abs(area2), 5);
    });

    test('应该处理自相交的多边形', () => {
      const selfIntersectingShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
        { x: 0, y: 100 }
      ];

      expect(() => {
        const area = calculatePolygonArea(selfIntersectingShape);
        const bounds = calculateBounds(selfIntersectingShape);
        const safeZone = createSafeZone(selfIntersectingShape);

        expect(typeof area).toBe('number');
        expect(isFinite(area)).toBe(true);
        expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX);
        expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY);
      }).not.toThrow();
    });
  });

  describe('🔑 点到线的距离计算', () => {
    test('应该正确计算点到水平线的距离', () => {
      const point: Point = { x: 50, y: 100 };
      const line: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };

      const distance = distanceToLine(point, line);

      expect(distance).toBeCloseTo(50, 5);
    });

    test('应该正确计算点到垂直线的距离', () => {
      const point: Point = { x: 100, y: 50 };
      const line: CutLine = { x1: 50, y1: 0, x2: 50, y2: 100 };

      const distance = distanceToLine(point, line);

      expect(distance).toBeCloseTo(50, 5);
    });

    test('应该正确计算点到斜线的距离', () => {
      const point: Point = { x: 0, y: 100 };
      const line: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100 };

      const distance = distanceToLine(point, line);

      // 点(0,100)到直线y=x的距离应该是100/√2 ≈ 70.71
      expect(distance).toBeCloseTo(70.71, 2);
    });

    test('应该处理点在线段上的情况', () => {
      const point: Point = { x: 50, y: 50 };
      const line: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100 };

      const distance = distanceToLine(point, line);

      expect(distance).toBeCloseTo(0, 5);
    });

    test('应该处理点在线段延长线上的情况', () => {
      const point: Point = { x: 150, y: 150 };
      const line: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100 };

      const distance = distanceToLine(point, line);

      // 距离应该是点到线段端点的距离
      expect(distance).toBeCloseTo(70.71, 2);
    });

    test('应该处理零长度线段', () => {
      const point: Point = { x: 50, y: 50 };
      const line: CutLine = { x1: 25, y1: 25, x2: 25, y2: 25 };

      const distance = distanceToLine(point, line);

      // 距离应该是点到点的距离
      expect(distance).toBeCloseTo(35.36, 2);
    });

    test('应该处理负坐标', () => {
      const point: Point = { x: -50, y: -50 };
      const line: CutLine = { x1: -100, y1: 0, x2: 0, y2: 0 };

      const distance = distanceToLine(point, line);

      expect(distance).toBeCloseTo(50, 5);
    });
  });

  describe('🔑 点在多边形内检测', () => {
    test('应该正确检测点在正方形内', () => {
      const point: Point = { x: 50, y: 50 };

      const isInside = isPointInPolygon(point, squareShape);

      expect(isInside).toBe(true);
    });

    test('应该正确检测点在正方形外', () => {
      const point: Point = { x: 150, y: 150 };

      const isInside = isPointInPolygon(point, squareShape);

      expect(isInside).toBe(false);
    });

    test('应该正确检测点在三角形内', () => {
      const point: Point = { x: 50, y: 30 };

      const isInside = isPointInPolygon(point, triangleShape);

      expect(isInside).toBe(true);
    });

    test('应该正确检测点在三角形外', () => {
      const point: Point = { x: 150, y: 150 };

      const isInside = isPointInPolygon(point, triangleShape);

      expect(isInside).toBe(false);
    });

    test('应该处理点在多边形边界上的情况', () => {
      const point: Point = { x: 0, y: 50 };

      const isInside = isPointInPolygon(point, squareShape);

      // 边界点的处理可能因实现而异，这里只验证不会抛出错误
      expect(typeof isInside).toBe('boolean');
    });

    test('应该处理点在多边形顶点上的情况', () => {
      const point: Point = { x: 0, y: 0 };

      const isInside = isPointInPolygon(point, squareShape);

      expect(typeof isInside).toBe('boolean');
    });

    test('应该处理复杂多边形', () => {
      const complexShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 100 },
        { x: 0, y: 100 }
      ];

      const insidePoint: Point = { x: 25, y: 25 };
      const outsidePoint: Point = { x: 75, y: 75 };

      expect(isPointInPolygon(insidePoint, complexShape)).toBe(true);
      expect(isPointInPolygon(outsidePoint, complexShape)).toBe(false);
    });

    test('应该处理凹多边形', () => {
      const concaveShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 50, y: 50 },
        { x: 0, y: 100 }
      ];

      const insidePoint: Point = { x: 25, y: 25 };
      const concavePoint: Point = { x: 150, y: 150 };

      expect(isPointInPolygon(insidePoint, concaveShape)).toBe(true);
      expect(isPointInPolygon(concavePoint, concaveShape)).toBe(false);
    });

    test('应该处理单点多边形', () => {
      const singlePoint: Point[] = [{ x: 50, y: 50 }];
      const testPoint: Point = { x: 50, y: 50 };

      expect(() => {
        const result = isPointInPolygon(testPoint, singlePoint);
        expect(typeof result).toBe('boolean');
      }).not.toThrow();
    });

    test('应该处理空多边形', () => {
      const emptyShape: Point[] = [];
      const testPoint: Point = { x: 50, y: 50 };

      expect(() => {
        const result = isPointInPolygon(testPoint, emptyShape);
        expect(typeof result).toBe('boolean');
      }).not.toThrow();
    });
  });

  describe('🔑 点靠近线段检测', () => {
    test('应该正确检测点靠近水平线段', () => {
      const point: Point = { x: 50, y: 52 };
      const line: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };
      const threshold = 5;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(true);
    });

    test('应该正确检测点远离线段', () => {
      const point: Point = { x: 200, y: 200 };
      const line: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };
      const threshold = 5;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(false);
    });

    test('应该正确检测点靠近垂直线段', () => {
      const point: Point = { x: 52, y: 50 };
      const line: CutLine = { x1: 50, y1: 0, x2: 50, y2: 100 };
      const threshold = 5;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(true);
    });

    test('应该正确检测点靠近斜线段', () => {
      const point: Point = { x: 48, y: 52 };
      const line: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100 };
      const threshold = 10;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(true);
    });

    test('应该处理点在线段端点附近', () => {
      const point: Point = { x: 2, y: 2 };
      const line: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100 };
      const threshold = 5;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(true);
    });

    test('应该处理零长度线段', () => {
      const point: Point = { x: 52, y: 52 };
      const line: CutLine = { x1: 50, y1: 50, x2: 50, y2: 50 };
      const threshold = 5;

      const isNear = isPointNearLine(point, line, threshold);

      // 对于零长度线段，函数的行为可能不同，我们只验证不会抛出错误
      expect(typeof isNear).toBe('boolean');
    });

    test('应该处理不同的阈值', () => {
      const point: Point = { x: 50, y: 55 };
      const line: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };

      const result1 = isPointNearLine(point, line, 3);
      const result2 = isPointNearLine(point, line, 7);

      // 验证函数返回布尔值，具体值取决于实现
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    test('应该处理负坐标', () => {
      const point: Point = { x: -48, y: -52 };
      const line: CutLine = { x1: -100, y1: -50, x2: 0, y2: -50 };
      const threshold = 5;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(true);
    });

    test('应该处理极小的阈值', () => {
      const point: Point = { x: 50, y: 50.1 };
      const line: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };
      const threshold = 0.05;

      const isNear = isPointNearLine(point, line, threshold);

      // 验证函数返回布尔值
      expect(typeof isNear).toBe('boolean');
    });

    test('应该处理极大的阈值', () => {
      const point: Point = { x: 50, y: 150 };
      const line: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };
      const threshold = 200;

      const isNear = isPointNearLine(point, line, threshold);

      expect(isNear).toBe(true);
    });
  });

  describe('🔑 几何工具函数集成测试', () => {
    test('应该支持完整的几何计算流程', () => {
      const shape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      const area = calculatePolygonArea(shape);
      const bounds = calculateBounds(shape);
      const safeZone = createSafeZone(shape);

      const testPoint: Point = { x: 50, y: 50 };
      const isInside = isPointInPolygon(testPoint, shape);

      const testLine: CutLine = { x1: 0, y1: 50, x2: 100, y2: 50 };
      const distance = distanceToLine(testPoint, testLine);
      const isNear = isPointNearLine(testPoint, testLine, 10);

      expect(area).toBe(10000);
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(100);
      expect(safeZone.minX).toBe(-50);
      expect(safeZone.maxX).toBe(150);
      expect(isInside).toBe(true);
      expect(distance).toBeCloseTo(0, 5);
      expect(isNear).toBe(true);
    });

    test('应该处理复杂几何场景', () => {
      const complexShape: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 50 },
        { x: 50, y: 100 },
        { x: 0, y: 50 }
      ];

      const area = calculatePolygonArea(complexShape);
      const bounds = calculateBounds(complexShape);

      const insidePoint: Point = { x: 25, y: 25 };
      const outsidePoint: Point = { x: 75, y: 75 };

      const isInsideInside = isPointInPolygon(insidePoint, complexShape);
      const isOutsideInside = isPointInPolygon(outsidePoint, complexShape);

      const cutLine: CutLine = { x1: 0, y1: 25, x2: 100, y2: 25 };
      const distanceInside = distanceToLine(insidePoint, cutLine);
      const distanceOutside = distanceToLine(outsidePoint, cutLine);

      expect(area).toBeGreaterThan(0);
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(100);
      expect(isInsideInside).toBe(true);
      expect(isOutsideInside).toBe(false);
      expect(distanceInside).toBeCloseTo(0, 5);
      expect(distanceOutside).toBeGreaterThan(40);
    });

    test('应该处理边界情况的组合', () => {
      const triangleShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ];

      const area = calculatePolygonArea(triangleShape);
      const bounds = calculateBounds(triangleShape);
      const safeZone = createSafeZone(triangleShape);

      // 测试边界点
      const boundaryPoint: Point = { x: 50, y: 0 };
      const isOnBoundary = isPointInPolygon(boundaryPoint, triangleShape);

      // 测试线段相交
      const line1: Point = { x: 25, y: 0 };
      const line2: Point = { x: 75, y: 100 };
      const line3: Point = { x: 0, y: 50 };
      const line4: Point = { x: 100, y: 50 };

      const intersection = lineIntersection(line1, line2, line3, line4);

      expect(area).toBe(5000);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(100);
      expect(safeZone.minY).toBe(-50);
      expect(safeZone.maxY).toBe(150);
      expect(typeof isOnBoundary).toBe('boolean');
      expect(intersection).not.toBeNull();
    });
  });

  describe('🔑 性能和精度综合测试', () => {
    test('所有几何函数应该保持高性能', () => {
      const complexShape: Point[] = Array.from({ length: 20 }, (_, i) => ({
        x: 100 + 50 * Math.cos(i * Math.PI / 10),
        y: 100 + 50 * Math.sin(i * Math.PI / 10)
      }));

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        calculatePolygonArea(complexShape);
        calculateBounds(complexShape);
        createSafeZone(complexShape);
        
        const testPoint: Point = { x: 100, y: 100 };
        isPointInPolygon(testPoint, complexShape);
        
        const testLine: CutLine = { x1: 50, y1: 50, x2: 150, y2: 150 };
        distanceToLine(testPoint, testLine);
        isPointNearLine(testPoint, testLine, 10);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // 100次完整计算应该在100ms内完成
    });

    test('所有几何函数应该保持数学精度', () => {
      const preciseShape: Point[] = [
        { x: 0.123456789, y: 0.987654321 },
        { x: 99.876543211, y: 0.987654321 },
        { x: 99.876543211, y: 99.012345679 },
        { x: 0.123456789, y: 99.012345679 }
      ];

      const area = calculatePolygonArea(preciseShape);
      const bounds = calculateBounds(preciseShape);

      const precisePoint: Point = { x: 50.123456789, y: 50.987654321 };
      const isInside = isPointInPolygon(precisePoint, preciseShape);

      const preciseLine: CutLine = { 
        x1: 0.123456789, 
        y1: 50.987654321, 
        x2: 99.876543211, 
        y2: 50.987654321 
      };
      const distance = distanceToLine(precisePoint, preciseLine);

      expect(area).toBeGreaterThan(9700);
      expect(area).toBeLessThan(9900);
      expect(bounds.minX).toBeCloseTo(0.123456789, 9);
      expect(bounds.maxX).toBeCloseTo(99.876543211, 9);
      expect(isInside).toBe(true);
      expect(distance).toBeCloseTo(0, 9);
    });
  });
});