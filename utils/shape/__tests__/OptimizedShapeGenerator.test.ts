/**
 * OptimizedShapeGenerator.test.ts
 * 优化形状生成器的完整测试套件
 * 
 * 测试目标：
 * 1. 验证性能优化效果
 * 2. 确保功能正确性
 * 3. 测试缓存机制
 * 4. 边界条件处理
 */

import { OptimizedShapeGenerator } from '../OptimizedShapeGenerator';
import { ShapeType } from '@/types/puzzleTypes';

describe('OptimizedShapeGenerator - 性能优化测试', () => {
  beforeEach(() => {
    // 每个测试前清空缓存
    OptimizedShapeGenerator.clearCache();
  });

  describe('基础功能测试', () => {
    test('应该生成多边形形状', () => {
      const canvasSize = { width: 800, height: 600 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      
      expect(shape).toBeDefined();
      expect(shape.length).toBeGreaterThan(0);
      expect(shape.length).toBeLessThanOrEqual(13); // 5 + 8 = 最大13个点
      
      // 验证所有点都有正确的属性
      shape.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('isOriginal', true);
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
      });
    });

    test('应该生成云朵形状', () => {
      const canvasSize = { width: 800, height: 600 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      
      expect(shape).toBeDefined();
      expect(shape.length).toBe(200); // 云朵形状固定200个点
      
      // 验证形状的平滑性（相邻点距离不应该太大）
      for (let i = 1; i < shape.length; i++) {
        const distance = Math.sqrt(
          Math.pow(shape[i].x - shape[i-1].x, 2) + 
          Math.pow(shape[i].y - shape[i-1].y, 2)
        );
        expect(distance).toBeLessThan(50); // 相邻点距离应该合理
      }
    });

    test('应该生成锯齿形状', () => {
      const canvasSize = { width: 800, height: 600 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Jagged, canvasSize);
      
      expect(shape).toBeDefined();
      expect(shape.length).toBe(200); // 锯齿形状固定200个点
      
      // 验证锯齿的随机性（半径应该有变化）
      const radii = shape.map(point => 
        Math.sqrt(Math.pow(point.x - 400, 2) + Math.pow(point.y - 300, 2))
      );
      const minRadius = Math.min(...radii);
      const maxRadius = Math.max(...radii);
      expect(maxRadius - minRadius).toBeGreaterThan(10); // 应该有明显的半径变化
    });

    test('应该处理未知形状类型', () => {
      const canvasSize = { width: 800, height: 600 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape('unknown' as ShapeType, canvasSize);
      
      expect(shape).toBeDefined();
      expect(shape.length).toBeGreaterThan(0);
      // 未知类型应该默认生成多边形
    });
  });

  describe('随机性测试', () => {
    test('每次生成的形状应该不同（随机性验证）', () => {
      const canvasSize = { width: 800, height: 600 };
      
      // 生成多个相同类型的形状
      const shape1 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      const shape2 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      const shape3 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      
      // 形状应该不完全相同（由于随机性）
      expect(shape1).not.toEqual(shape2);
      expect(shape2).not.toEqual(shape3);
      expect(shape1).not.toEqual(shape3);
    });

    test('云朵形状每次生成应该有不同的频率和半径', () => {
      const canvasSize = { width: 800, height: 600 };
      
      const shape1 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      const shape2 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      
      // 计算形状的"指纹"（基于前几个点的位置）
      const getShapeFingerprint = (shape: any[]) => 
        shape.slice(0, 5).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|');
      
      const fingerprint1 = getShapeFingerprint(shape1);
      const fingerprint2 = getShapeFingerprint(shape2);
      
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    test('锯齿形状每次生成应该有不同的半径分布', () => {
      const canvasSize = { width: 800, height: 600 };
      
      const shape1 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Jagged, canvasSize);
      const shape2 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Jagged, canvasSize);
      
      // 计算半径分布
      const getRadiusDistribution = (shape: any[]) => {
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;
        return shape.slice(0, 10).map(p => 
          Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
        );
      };
      
      const radii1 = getRadiusDistribution(shape1);
      const radii2 = getRadiusDistribution(shape2);
      
      // 半径分布应该不同
      expect(radii1).not.toEqual(radii2);
    });

    test('性能应该保持在合理范围内', () => {
      const canvasSize = { width: 800, height: 600 };
      
      // 测试优化版本的性能
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      }
      const optimizedTime = performance.now() - startTime;
      
      // 每次生成都是新的，但仍应保持合理性能
      expect(optimizedTime).toBeLessThan(500); // 应该在500ms内完成10次调用
    });
  });

  describe('画布适配测试', () => {
    test('应该正确适配不同画布尺寸', () => {
      const smallCanvas = { width: 400, height: 300 };
      const largeCanvas = { width: 1600, height: 1200 };
      
      const smallShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, smallCanvas);
      const largeShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, largeCanvas);
      
      // 计算形状的边界
      const getShapeBounds = (shape: any[]) => {
        const xs = shape.map(p => p.x);
        const ys = shape.map(p => p.y);
        return {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys)
        };
      };
      
      const smallBounds = getShapeBounds(smallShape);
      const largeBounds = getShapeBounds(largeShape);
      
      // 大画布的形状应该更大
      const smallSize = Math.max(smallBounds.maxX - smallBounds.minX, smallBounds.maxY - smallBounds.minY);
      const largeSize = Math.max(largeBounds.maxX - largeBounds.minX, largeBounds.maxY - largeBounds.minY);
      
      expect(largeSize).toBeGreaterThan(smallSize);
    });

    test('形状应该居中在画布中', () => {
      const canvasSize = { width: 800, height: 600 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      
      // 计算形状中心
      const centerX = shape.reduce((sum, p) => sum + p.x, 0) / shape.length;
      const centerY = shape.reduce((sum, p) => sum + p.y, 0) / shape.length;
      
      // 形状中心应该接近画布中心
      expect(Math.abs(centerX - 400)).toBeLessThan(50);
      expect(Math.abs(centerY - 300)).toBeLessThan(50);
    });

    test('形状大小应该适合画布', () => {
      const canvasSize = { width: 800, height: 600 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      
      // 计算形状边界
      const xs = shape.map(p => p.x);
      const ys = shape.map(p => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      
      // 形状大小应该是画布最小维度的40%左右
      const expectedSize = Math.min(canvasSize.width, canvasSize.height) * 0.4;
      const actualSize = Math.max(width, height);
      
      expect(Math.abs(actualSize - expectedSize)).toBeLessThan(expectedSize * 0.1); // 10%误差范围
    });
  });

  describe('边界条件测试', () => {
    test('应该处理极小画布', () => {
      const tinyCanvas = { width: 10, height: 10 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, tinyCanvas);
      
      expect(shape).toBeDefined();
      expect(shape.length).toBeGreaterThan(0);
      
      // 所有点都应该在画布范围内
      shape.forEach(point => {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(10);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(10);
      });
    });

    test('应该处理极大画布', () => {
      const hugeCanvas = { width: 10000, height: 10000 };
      const shape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, hugeCanvas);
      
      expect(shape).toBeDefined();
      expect(shape.length).toBe(200);
      
      // 形状应该仍然居中
      const centerX = shape.reduce((sum, p) => sum + p.x, 0) / shape.length;
      const centerY = shape.reduce((sum, p) => sum + p.y, 0) / shape.length;
      
      expect(Math.abs(centerX - 5000)).toBeLessThan(500);
      expect(Math.abs(centerY - 5000)).toBeLessThan(500);
    });

    test('应该处理非正方形画布', () => {
      const wideCanvas = { width: 1600, height: 400 };
      const tallCanvas = { width: 400, height: 1600 };
      
      const wideShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, wideCanvas);
      const tallShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, tallCanvas);
      
      expect(wideShape).toBeDefined();
      expect(tallShape).toBeDefined();
      
      // 两种形状的大小应该相同（基于最小维度）
      const getShapeSize = (shape: any[]) => {
        const xs = shape.map(p => p.x);
        const ys = shape.map(p => p.y);
        return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      };
      
      const wideSize = getShapeSize(wideShape);
      const tallSize = getShapeSize(tallShape);
      
      expect(Math.abs(wideSize - tallSize)).toBeLessThan(20); // 应该大小相近
    });
  });

  describe('兼容性测试', () => {
    test('应该保持与原始实现的兼容性', () => {
      const canvasSize = { width: 800, height: 600 };
      
      // 测试所有形状类型都能正常生成
      const polygonShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      const cloudShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      const jaggedShape = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Jagged, canvasSize);
      
      expect(polygonShape.length).toBeGreaterThan(4);
      expect(cloudShape.length).toBe(200);
      expect(jaggedShape.length).toBe(200);
    });

    test('缓存统计功能应该返回空状态', () => {
      const stats = OptimizedShapeGenerator.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
      expect(stats.size).toBe(0); // 缓存已禁用，应该始终为0
    });
  });
});

describe('OptimizedShapeGenerator - 回归测试', () => {
  test('应该与原始ShapeGenerator生成相似的形状结构', () => {
    const canvasSize = { width: 800, height: 600 };
    
    // 测试所有形状类型
    const shapeTypes = [ShapeType.Polygon, ShapeType.Cloud, ShapeType.Jagged];
    
    shapeTypes.forEach(shapeType => {
      const shape = OptimizedShapeGenerator.generateOptimizedShape(shapeType, canvasSize);
      
      // 验证基本结构
      expect(shape).toBeDefined();
      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBeGreaterThan(0);
      
      // 验证点的结构
      shape.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('isOriginal');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.isOriginal).toBe(true);
      });
    });
  });
});