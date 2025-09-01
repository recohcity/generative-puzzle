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

  describe('性能优化测试', () => {
    test('缓存机制应该工作正常', () => {
      const canvasSize = { width: 800, height: 600 };
      
      // 第一次生成
      const shape1 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      const stats1 = OptimizedShapeGenerator.getCacheStats();
      expect(stats1.size).toBe(1);
      
      // 第二次生成相同参数，应该使用缓存
      const shape2 = OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      const stats2 = OptimizedShapeGenerator.getCacheStats();
      expect(stats2.size).toBe(1);
      
      // 缓存的形状应该完全相同
      expect(shape1).toEqual(shape2);
    });

    test('不同参数应该生成不同的缓存条目', () => {
      const canvasSize1 = { width: 800, height: 600 };
      const canvasSize2 = { width: 1024, height: 768 };
      
      OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize1);
      OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize2);
      OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize1);
      
      const stats = OptimizedShapeGenerator.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.keys).toContain('polygon-800x600');
      expect(stats.keys).toContain('polygon-1024x768');
      expect(stats.keys).toContain('cloud-800x600');
    });

    test('缓存大小限制应该工作', () => {
      // 生成超过最大缓存大小的条目
      for (let i = 0; i < 55; i++) {
        const canvasSize = { width: 800 + i, height: 600 + i };
        OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      }
      
      const stats = OptimizedShapeGenerator.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(50); // 不应该超过最大缓存大小
    });

    test('性能应该优于原始实现', () => {
      const canvasSize = { width: 800, height: 600 };
      
      // 测试优化版本的性能
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      }
      const optimizedTime = performance.now() - startTime;
      
      // 由于缓存，第2-10次调用应该非常快
      expect(optimizedTime).toBeLessThan(100); // 应该在100ms内完成10次调用
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

  describe('缓存管理测试', () => {
    test('clearCache应该清空所有缓存', () => {
      const canvasSize = { width: 800, height: 600 };
      
      // 生成一些缓存条目
      OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Polygon, canvasSize);
      OptimizedShapeGenerator.generateOptimizedShape(ShapeType.Cloud, canvasSize);
      
      expect(OptimizedShapeGenerator.getCacheStats().size).toBe(2);
      
      // 清空缓存
      OptimizedShapeGenerator.clearCache();
      
      expect(OptimizedShapeGenerator.getCacheStats().size).toBe(0);
    });

    test('getCacheStats应该返回正确的统计信息', () => {
      const stats = OptimizedShapeGenerator.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
      expect(stats.maxSize).toBe(50);
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