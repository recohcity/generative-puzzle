/**
 * BezierCurve 单元测试
 * 测试贝塞尔曲线类和曲线生成函数
 */

import { BezierCurve, createOptimizedCurve, createRadialCurve, createOptimizedCurveWithAngle, Bounds } from '../BezierCurve';
import { Point } from '@/types/puzzleTypes';

describe('BezierCurve', () => {
  describe('BezierCurve 类', () => {
    it('应该正确创建 BezierCurve 实例', () => {
      const p0: Point = { x: 0, y: 0 };
      const p1: Point = { x: 50, y: 50 };
      const p2: Point = { x: 100, y: 0 };

      const curve = new BezierCurve(p0, p1, p2);

      expect(curve.p0).toEqual(p0);
      expect(curve.p1).toEqual(p1);
      expect(curve.p2).toEqual(p2);
    });

    it('应该正确计算曲线上 t=0 的点', () => {
      const p0: Point = { x: 0, y: 0 };
      const p1: Point = { x: 50, y: 50 };
      const p2: Point = { x: 100, y: 0 };

      const curve = new BezierCurve(p0, p1, p2);
      const point = curve.getPoint(0);

      expect(point.x).toBeCloseTo(p0.x, 5);
      expect(point.y).toBeCloseTo(p0.y, 5);
    });

    it('应该正确计算曲线上 t=1 的点', () => {
      const p0: Point = { x: 0, y: 0 };
      const p1: Point = { x: 50, y: 50 };
      const p2: Point = { x: 100, y: 0 };

      const curve = new BezierCurve(p0, p1, p2);
      const point = curve.getPoint(1);

      expect(point.x).toBeCloseTo(p2.x, 5);
      expect(point.y).toBeCloseTo(p2.y, 5);
    });

    it('应该正确计算曲线上 t=0.5 的点', () => {
      const p0: Point = { x: 0, y: 0 };
      const p1: Point = { x: 50, y: 100 };
      const p2: Point = { x: 100, y: 0 };

      const curve = new BezierCurve(p0, p1, p2);
      const point = curve.getPoint(0.5);

      // 在 t=0.5 时，应该是中点附近
      expect(point.x).toBeCloseTo(50, 5);
      expect(point.y).toBeGreaterThan(0);
    });

    it('应该正确获取曲线上的点序列', () => {
      const p0: Point = { x: 0, y: 0 };
      const p1: Point = { x: 50, y: 50 };
      const p2: Point = { x: 100, y: 0 };

      const curve = new BezierCurve(p0, p1, p2);
      const points = curve.getPoints(10);

      expect(points.length).toBe(11); // segments + 1
      expect(points[0]).toEqual(curve.getPoint(0));
      expect(points[points.length - 1]).toEqual(curve.getPoint(1));
    });

    it('应该使用默认分段数 100', () => {
      const p0: Point = { x: 0, y: 0 };
      const p1: Point = { x: 50, y: 50 };
      const p2: Point = { x: 100, y: 0 };

      const curve = new BezierCurve(p0, p1, p2);
      const points = curve.getPoints();

      expect(points.length).toBe(101); // 默认 100 segments + 1
    });
  });

  describe('createOptimizedCurve', () => {
    const bounds: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100
    };

    it('应该创建优化的曲线（无 shapeCenter）', () => {
      const curve = createOptimizedCurve(bounds);

      expect(curve).toBeInstanceOf(BezierCurve);
      expect(curve.p0).toBeDefined();
      expect(curve.p1).toBeDefined();
      expect(curve.p2).toBeDefined();
    });

    it('应该创建优化的曲线（有 shapeCenter）', () => {
      const shapeCenter: Point = { x: 50, y: 50 };
      const curve = createOptimizedCurve(bounds, shapeCenter);

      expect(curve).toBeInstanceOf(BezierCurve);
      expect(curve.p0).toBeDefined();
      expect(curve.p1).toBeDefined();
      expect(curve.p2).toBeDefined();
    });

    it('应该使用指定的 count 参数', () => {
      const curve = createOptimizedCurve(bounds, undefined, 5);

      expect(curve).toBeInstanceOf(BezierCurve);
    });

    it('应该创建贯穿形状的曲线', () => {
      const curve = createOptimizedCurve(bounds);

      // 验证起点和终点都在边界外
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      const extension = Math.max(width, height) * 0.5;
      const minDist = Math.max(width, height) * 0.8;

      // 起点和终点应该在外围
      const dist0 = Math.hypot(
        curve.p0.x - (bounds.minX + width / 2),
        curve.p0.y - (bounds.minY + height / 2)
      );
      const dist2 = Math.hypot(
        curve.p2.x - (bounds.minX + width / 2),
        curve.p2.y - (bounds.minY + height / 2)
      );

      expect(dist0).toBeGreaterThanOrEqual(minDist);
      expect(dist2).toBeGreaterThanOrEqual(minDist);
    });

    it('应该创建具有明显弧度的曲线', () => {
      const curve = createOptimizedCurve(bounds);

      // 控制点应该不在起点和终点的直线上
      const dx = curve.p2.x - curve.p0.x;
      const dy = curve.p2.y - curve.p0.y;
      const midX = (curve.p0.x + curve.p2.x) / 2;
      const midY = (curve.p0.y + curve.p2.y) / 2;

      // 控制点应该偏离中点
      const offsetX = curve.p1.x - midX;
      const offsetY = curve.p1.y - midY;

      expect(Math.abs(offsetX) + Math.abs(offsetY)).toBeGreaterThan(0);
    });

    it('应该使用 shapeCenter 作为参考点', () => {
      const shapeCenter: Point = { x: 30, y: 70 };
      const curve = createOptimizedCurve(bounds, shapeCenter);

      // 验证曲线围绕 shapeCenter 生成
      expect(curve.p0).toBeDefined();
      expect(curve.p1).toBeDefined();
      expect(curve.p2).toBeDefined();
    });

    it('应该处理不同大小的边界框', () => {
      const smallBounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 50,
        maxY: 50
      };

      const largeBounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 200,
        maxY: 200
      };

      const smallCurve = createOptimizedCurve(smallBounds);
      const largeCurve = createOptimizedCurve(largeBounds);

      expect(smallCurve).toBeInstanceOf(BezierCurve);
      expect(largeCurve).toBeInstanceOf(BezierCurve);
    });

    it('应该处理矩形边界框', () => {
      const rectBounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 200,
        maxY: 100
      };

      const curve = createOptimizedCurve(rectBounds);

      expect(curve).toBeInstanceOf(BezierCurve);
      expect(curve.p0).toBeDefined();
      expect(curve.p1).toBeDefined();
      expect(curve.p2).toBeDefined();
    });
  });

  describe('createRadialCurve', () => {
    const bounds: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100
    };

    const startPoint: Point = { x: 50, y: 50 };
    const angle = Math.PI / 4; // 45度

    it('应该创建径向曲线', () => {
      const curve = createRadialCurve(bounds, startPoint, angle);

      expect(curve).toBeInstanceOf(BezierCurve);
      expect(curve.p0).toEqual(startPoint);
      expect(curve.p1).toBeDefined();
      expect(curve.p2).toBeDefined();
    });

    it('应该使用指定的起点', () => {
      const customStart: Point = { x: 30, y: 70 };
      const curve = createRadialCurve(bounds, customStart, angle);

      expect(curve.p0).toEqual(customStart);
    });

    it('应该使用指定的角度', () => {
      const curve = createRadialCurve(bounds, startPoint, angle);

      // 控制点应该在角度方向上
      const dx = curve.p1.x - curve.p0.x;
      const dy = curve.p1.y - curve.p0.y;
      const actualAngle = Math.atan2(dy, dx);

      expect(actualAngle).toBeCloseTo(angle, 1);
    });

    it('应该创建延伸到边界外的曲线', () => {
      const curve = createRadialCurve(bounds, startPoint, angle);

      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      const radius = Math.max(width, height) * 2.0;

      // 终点应该在半径范围内
      const dist = Math.hypot(curve.p2.x - startPoint.x, curve.p2.y - startPoint.y);
      expect(dist).toBeCloseTo(radius, 1);
    });

    it('应该使用默认 hubRadius = 0', () => {
      const curve = createRadialCurve(bounds, startPoint, angle);

      expect(curve.p0).toEqual(startPoint);
    });

    it('应该忽略 hubRadius 参数', () => {
      const curve = createRadialCurve(bounds, startPoint, angle, 10);

      // hubRadius 被忽略，起点仍然是 startPoint
      expect(curve.p0).toEqual(startPoint);
    });

    it('应该创建顺时针弯曲的曲线', () => {
      const curve = createRadialCurve(bounds, startPoint, angle);

      // 终点应该在 angle + swirlAngle 方向上
      const swirlAngle = Math.PI / 6; // 30度
      const expectedAngle = angle + swirlAngle;

      const dx = curve.p2.x - startPoint.x;
      const dy = curve.p2.y - startPoint.y;
      const actualAngle = Math.atan2(dy, dx);

      expect(actualAngle).toBeCloseTo(expectedAngle, 1);
    });

    it('应该处理不同的角度值', () => {
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      angles.forEach(angle => {
        const curve = createRadialCurve(bounds, startPoint, angle);
        expect(curve).toBeInstanceOf(BezierCurve);
        expect(curve.p0).toEqual(startPoint);
      });
    });

    it('应该处理不同的边界框大小', () => {
      const smallBounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 50,
        maxY: 50
      };

      const largeBounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 200,
        maxY: 200
      };

      const smallCurve = createRadialCurve(smallBounds, startPoint, angle);
      const largeCurve = createRadialCurve(largeBounds, startPoint, angle);

      expect(smallCurve).toBeInstanceOf(BezierCurve);
      expect(largeCurve).toBeInstanceOf(BezierCurve);
    });
  });

  describe('createOptimizedCurveWithAngle', () => {
    const bounds: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100
    };

    const shapeCenter: Point = { x: 50, y: 50 };
    const baseAngle = Math.PI / 4;

    it('应该创建带角度的优化曲线', () => {
      const curve = createOptimizedCurveWithAngle(bounds, shapeCenter, baseAngle);

      expect(curve).toBeInstanceOf(BezierCurve);
      expect(curve.p0).toBeDefined();
      expect(curve.p1).toBeDefined();
      expect(curve.p2).toBeDefined();
    });

    it('应该使用 shapeCenter 作为起点', () => {
      const curve = createOptimizedCurveWithAngle(bounds, shapeCenter, baseAngle);

      expect(curve.p0).toEqual(shapeCenter);
    });

    it('应该使用 baseAngle 作为角度', () => {
      const curve = createOptimizedCurveWithAngle(bounds, shapeCenter, baseAngle);

      // 控制点应该在 baseAngle 方向上
      const dx = curve.p1.x - curve.p0.x;
      const dy = curve.p1.y - curve.p0.y;
      const actualAngle = Math.atan2(dy, dx);

      expect(actualAngle).toBeCloseTo(baseAngle, 1);
    });

    it('应该委托给 createRadialCurve', () => {
      const curve1 = createOptimizedCurveWithAngle(bounds, shapeCenter, baseAngle);
      const curve2 = createRadialCurve(bounds, shapeCenter, baseAngle);

      // 两个函数应该产生相同的结果
      expect(curve1.p0).toEqual(curve2.p0);
      expect(curve1.p1.x).toBeCloseTo(curve2.p1.x, 5);
      expect(curve1.p1.y).toBeCloseTo(curve2.p1.y, 5);
      expect(curve1.p2.x).toBeCloseTo(curve2.p2.x, 5);
      expect(curve1.p2.y).toBeCloseTo(curve2.p2.y, 5);
    });

    it('应该处理不同的角度值', () => {
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      angles.forEach(angle => {
        const curve = createOptimizedCurveWithAngle(bounds, shapeCenter, angle);
        expect(curve).toBeInstanceOf(BezierCurve);
        expect(curve.p0).toEqual(shapeCenter);
      });
    });
  });
});

