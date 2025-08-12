/**
 * cutGeneratorTypes.test.ts
 * 类型定义测试 - 验证类型的正确性和使用
 */

import {
  Bounds,
  CutLine,
  CutType,
  CutGenerationContext,
  CutGenerationResult,
  CutGenerationStrategy,
  CutValidator,
  GeometryUtils
} from '../cutGeneratorTypes';
import { Point } from '@/types/puzzleTypes';

describe('cutGeneratorTypes - 类型定义测试', () => {
  describe('Bounds类型', () => {
    test('Bounds类型结构验证', () => {
      const bounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100
      };
      
      expect(typeof bounds.minX).toBe('number');
      expect(typeof bounds.minY).toBe('number');
      expect(typeof bounds.maxX).toBe('number');
      expect(typeof bounds.maxY).toBe('number');
      
      // 验证边界的逻辑性
      expect(bounds.maxX).toBeGreaterThanOrEqual(bounds.minX);
      expect(bounds.maxY).toBeGreaterThanOrEqual(bounds.minY);
    });

    test('Bounds类型边界条件', () => {
      // 零大小边界
      const zeroBounds: Bounds = {
        minX: 50,
        minY: 50,
        maxX: 50,
        maxY: 50
      };
      expect(zeroBounds.maxX - zeroBounds.minX).toBe(0);
      expect(zeroBounds.maxY - zeroBounds.minY).toBe(0);

      // 负坐标边界
      const negativeBounds: Bounds = {
        minX: -100,
        minY: -100,
        maxX: 100,
        maxY: 100
      };
      expect(negativeBounds.minX).toBeLessThan(0);
      expect(negativeBounds.maxX).toBeGreaterThan(0);
    });
  });

  describe('CutLine类型', () => {
    test('CutLine类型结构验证', () => {
      const straightCut: CutLine = {
        x1: 0,
        y1: 50,
        x2: 100,
        y2: 50,
        type: 'straight'
      };
      
      expect(typeof straightCut.x1).toBe('number');
      expect(typeof straightCut.y1).toBe('number');
      expect(typeof straightCut.x2).toBe('number');
      expect(typeof straightCut.y2).toBe('number');
      expect(straightCut.type).toBe('straight');
      
      const diagonalCut: CutLine = {
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        type: 'diagonal'
      };
      
      expect(diagonalCut.type).toBe('diagonal');
    });

    test('CutLine类型约束验证', () => {
      // 验证type字段只能是指定值
      const validTypes: CutType[] = ['straight', 'diagonal'];
      
      validTypes.forEach(type => {
        const cut: CutLine = {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          type: type
        };
        expect(['straight', 'diagonal']).toContain(cut.type);
      });
    });

    test('CutLine几何特征验证', () => {
      // 水平直线
      const horizontalCut: CutLine = {
        x1: 0,
        y1: 50,
        x2: 100,
        y2: 50,
        type: 'straight'
      };
      expect(horizontalCut.y1).toBe(horizontalCut.y2);

      // 垂直直线
      const verticalCut: CutLine = {
        x1: 50,
        y1: 0,
        x2: 50,
        y2: 100,
        type: 'straight'
      };
      expect(verticalCut.x1).toBe(verticalCut.x2);

      // 对角线
      const diagonalCut: CutLine = {
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        type: 'diagonal'
      };
      expect(diagonalCut.x1).not.toBe(diagonalCut.x2);
      expect(diagonalCut.y1).not.toBe(diagonalCut.y2);
    });
  });

  describe('CutType类型', () => {
    test('CutType联合类型验证', () => {
      const straightType: CutType = 'straight';
      const diagonalType: CutType = 'diagonal';
      
      expect(straightType).toBe('straight');
      expect(diagonalType).toBe('diagonal');
      
      // 验证类型约束
      const validTypes: CutType[] = ['straight', 'diagonal'];
      expect(validTypes).toContain(straightType);
      expect(validTypes).toContain(diagonalType);
    });
  });

  describe('CutGenerationContext接口', () => {
    test('CutGenerationContext结构验证', () => {
      const testShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      const context: CutGenerationContext = {
        bounds: {
          minX: 0,
          minY: 0,
          maxX: 100,
          maxY: 100
        },
        shape: testShape,
        existingCuts: [],
        difficulty: 1,
        cutType: 'straight',
        attempts: 0
      };

      expect(typeof context.bounds).toBe('object');
      expect(Array.isArray(context.shape)).toBe(true);
      expect(Array.isArray(context.existingCuts)).toBe(true);
      expect(typeof context.difficulty).toBe('number');
      expect(typeof context.cutType).toBe('string');
      expect(typeof context.attempts).toBe('number');
    });

    test('CutGenerationContext不同配置', () => {
      const testShape: Point[] = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 200 },
        { x: 0, y: 200 }
      ];

      const existingCuts: CutLine[] = [
        { x1: 100, y1: 0, x2: 100, y2: 200, type: 'straight' }
      ];

      const complexContext: CutGenerationContext = {
        bounds: {
          minX: 0,
          minY: 0,
          maxX: 200,
          maxY: 200
        },
        shape: testShape,
        existingCuts: existingCuts,
        difficulty: 3,
        cutType: 'diagonal',
        attempts: 5
      };

      expect(complexContext.existingCuts.length).toBe(1);
      expect(complexContext.difficulty).toBe(3);
      expect(complexContext.cutType).toBe('diagonal');
      expect(complexContext.attempts).toBe(5);
    });
  });

  describe('CutGenerationResult接口', () => {
    test('CutGenerationResult成功结果', () => {
      const successResult: CutGenerationResult = {
        cut: {
          x1: 0,
          y1: 50,
          x2: 100,
          y2: 50,
          type: 'straight'
        },
        success: true,
        attempts: 1,
        strategy: 'straightLine'
      };

      expect(successResult.cut).not.toBeNull();
      expect(successResult.success).toBe(true);
      expect(typeof successResult.attempts).toBe('number');
      expect(typeof successResult.strategy).toBe('string');
    });

    test('CutGenerationResult失败结果', () => {
      const failureResult: CutGenerationResult = {
        cut: null,
        success: false,
        attempts: 10,
        strategy: 'fallback'
      };

      expect(failureResult.cut).toBeNull();
      expect(failureResult.success).toBe(false);
      expect(failureResult.attempts).toBe(10);
      expect(failureResult.strategy).toBe('fallback');
    });
  });

  describe('CutGenerationStrategy接口', () => {
    test('CutGenerationStrategy实现验证', () => {
      // 创建一个测试策略实现
      const testStrategy: CutGenerationStrategy = {
        name: 'testStrategy',
        canHandle: (context: CutGenerationContext) => {
          return context.cutType === 'straight' && context.difficulty <= 2;
        },
        generateCut: (context: CutGenerationContext) => {
          if (context.cutType === 'straight') {
            return {
              cut: {
                x1: context.bounds.minX,
                y1: (context.bounds.minY + context.bounds.maxY) / 2,
                x2: context.bounds.maxX,
                y2: (context.bounds.minY + context.bounds.maxY) / 2,
                type: 'straight'
              },
              success: true,
              attempts: 1,
              strategy: 'testStrategy'
            };
          }
          return {
            cut: null,
            success: false,
            attempts: 1,
            strategy: 'testStrategy'
          };
        }
      };

      expect(typeof testStrategy.name).toBe('string');
      expect(typeof testStrategy.canHandle).toBe('function');
      expect(typeof testStrategy.generateCut).toBe('function');

      // 测试策略功能
      const context: CutGenerationContext = {
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
        shape: [],
        existingCuts: [],
        difficulty: 1,
        cutType: 'straight',
        attempts: 0
      };

      expect(testStrategy.canHandle(context)).toBe(true);
      
      const result = testStrategy.generateCut(context);
      expect(result.success).toBe(true);
      expect(result.cut).not.toBeNull();
      expect(result.strategy).toBe('testStrategy');
    });
  });

  describe('CutValidator接口', () => {
    test('CutValidator实现验证', () => {
      // 创建一个测试验证器实现
      const testValidator: CutValidator = {
        validate: (cut: CutLine, context: CutGenerationContext, relaxed?: boolean) => {
          // 基本验证：切割线必须有不同的起点和终点
          if (cut.x1 === cut.x2 && cut.y1 === cut.y2) {
            return false;
          }
          
          // 如果是宽松模式，跳过额外检查
          if (relaxed) {
            return true;
          }
          
          // 严格模式：检查切割线是否在边界内
          const withinBounds = 
            cut.x1 >= context.bounds.minX && cut.x1 <= context.bounds.maxX &&
            cut.y1 >= context.bounds.minY && cut.y1 <= context.bounds.maxY &&
            cut.x2 >= context.bounds.minX && cut.x2 <= context.bounds.maxX &&
            cut.y2 >= context.bounds.minY && cut.y2 <= context.bounds.maxY;
          
          return withinBounds;
        }
      };

      expect(typeof testValidator.validate).toBe('function');

      // 测试验证器功能
      const context: CutGenerationContext = {
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
        shape: [],
        existingCuts: [],
        difficulty: 1,
        cutType: 'straight',
        attempts: 0
      };

      // 有效切割线
      const validCut: CutLine = {
        x1: 0,
        y1: 50,
        x2: 100,
        y2: 50,
        type: 'straight'
      };
      expect(testValidator.validate(validCut, context)).toBe(true);
      expect(testValidator.validate(validCut, context, true)).toBe(true);

      // 无效切割线（起点终点相同）
      const invalidCut: CutLine = {
        x1: 50,
        y1: 50,
        x2: 50,
        y2: 50,
        type: 'straight'
      };
      expect(testValidator.validate(invalidCut, context)).toBe(false);
      expect(testValidator.validate(invalidCut, context, true)).toBe(false);

      // 超出边界的切割线
      const outOfBoundsCut: CutLine = {
        x1: -10,
        y1: 50,
        x2: 110,
        y2: 50,
        type: 'straight'
      };
      expect(testValidator.validate(outOfBoundsCut, context)).toBe(false);
      expect(testValidator.validate(outOfBoundsCut, context, true)).toBe(true); // 宽松模式通过
    });
  });

  describe('GeometryUtils接口', () => {
    test('GeometryUtils接口结构验证', () => {
      // 创建一个测试几何工具实现
      const testGeometryUtils: GeometryUtils = {
        calculateBounds: (points: Point[]) => {
          if (points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
          }
          const xs = points.map(p => p.x);
          const ys = points.map(p => p.y);
          return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
          };
        },
        lineIntersection: (p1: Point, p2: Point, p3: Point, p4: Point) => {
          // 简化的线段交点计算
          const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
          const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
          
          const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
          if (denom === 0) return null;
          
          const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
          if (ua < 0 || ua > 1) return null;
          
          return {
            x: x1 + ua * (x2 - x1),
            y: y1 + ua * (y2 - y1)
          };
        },
        isPointNearLine: (point: Point, line: CutLine, threshold: number) => {
          const d1 = Math.hypot(line.x1 - point.x, line.y1 - point.y);
          const d2 = Math.hypot(line.x2 - point.x, line.y2 - point.y);
          return Math.min(d1, d2) <= threshold;
        },
        doesCutIntersectShape: (cut: CutLine, shape: Point[]) => {
          // 简化实现：返回固定值用于测试
          return shape.length > 0 ? 2 : 0;
        },
        cutsAreTooClose: (cut1: CutLine, cut2: CutLine, minDistance: number) => {
          const d1 = Math.hypot(cut1.x1 - cut2.x1, cut1.y1 - cut2.y1);
          const d2 = Math.hypot(cut1.x2 - cut2.x2, cut1.y2 - cut2.y2);
          return Math.min(d1, d2) < minDistance;
        }
      };

      // 验证接口方法存在
      expect(typeof testGeometryUtils.calculateBounds).toBe('function');
      expect(typeof testGeometryUtils.lineIntersection).toBe('function');
      expect(typeof testGeometryUtils.isPointNearLine).toBe('function');
      expect(typeof testGeometryUtils.doesCutIntersectShape).toBe('function');
      expect(typeof testGeometryUtils.cutsAreTooClose).toBe('function');

      // 测试方法功能
      const testPoints: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ];
      
      const bounds = testGeometryUtils.calculateBounds(testPoints);
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(100);

      const intersection = testGeometryUtils.lineIntersection(
        { x: 0, y: 0 }, { x: 100, y: 100 },
        { x: 0, y: 100 }, { x: 100, y: 0 }
      );
      expect(intersection).not.toBeNull();
      if (intersection) {
        expect(intersection.x).toBe(50);
        expect(intersection.y).toBe(50);
      }
    });
  });

  describe('类型组合使用测试', () => {
    test('完整工作流类型验证', () => {
      // 模拟完整的切割生成工作流
      const shape: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      const bounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100
      };

      const context: CutGenerationContext = {
        bounds,
        shape,
        existingCuts: [],
        difficulty: 2,
        cutType: 'straight',
        attempts: 0
      };

      const generatedCut: CutLine = {
        x1: 0,
        y1: 50,
        x2: 100,
        y2: 50,
        type: 'straight'
      };

      const result: CutGenerationResult = {
        cut: generatedCut,
        success: true,
        attempts: 1,
        strategy: 'centerLine'
      };

      // 验证整个工作流的类型一致性
      expect(context.bounds).toEqual(bounds);
      expect(context.shape).toEqual(shape);
      expect(result.cut).toEqual(generatedCut);
      expect(result.success).toBe(true);
    });

    test('类型安全性验证', () => {
      // 验证类型系统能够捕获错误
      const cutTypes: CutType[] = ['straight', 'diagonal'];
      
      cutTypes.forEach(type => {
        const cut: CutLine = {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          type: type
        };
        
        expect(['straight', 'diagonal']).toContain(cut.type);
      });
    });
  });
});