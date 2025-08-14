/**
 * ShapeGenerator 单元测试
 * 测试完整的形状生成功能
 */

import { ShapeGenerator } from '../ShapeGenerator';
import { ShapeType } from '@/types/puzzleTypes';

describe('ShapeGenerator - 完整功能测试', () => {
  describe('generateShape', () => {
    test('应该生成多边形', () => {
      const shape = ShapeGenerator.generateShape(ShapeType.Polygon);
      
      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBeGreaterThan(4); // 至少5个点
      expect(shape.length).toBeLessThanOrEqual(13); // 最多13个点
      
      // 验证每个点的结构
      shape.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.isOriginal).toBe(true);
      });
    });

    test('应该生成云朵形状', () => {
      const shape = ShapeGenerator.generateShape(ShapeType.Cloud);
      
      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBe(200); // 云朵固定200个点
      
      // 验证点的结构
      shape.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.isOriginal).toBe(true);
      });
    });

    test('应该生成锯齿形状', () => {
      const shape = ShapeGenerator.generateShape(ShapeType.Jagged);
      
      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBe(200); // 锯齿固定200个点
      
      // 验证点的结构
      shape.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.isOriginal).toBe(true);
      });
    });

    test('每次生成的形状应该不同（随机性测试）', () => {
      const shape1 = ShapeGenerator.generateShape(ShapeType.Polygon);
      const shape2 = ShapeGenerator.generateShape(ShapeType.Polygon);
      
      // 形状应该不完全相同（由于随机性）
      const isDifferent = shape1.some((point, index) => 
        shape2[index] && (point.x !== shape2[index].x || point.y !== shape2[index].y)
      ) || shape1.length !== shape2.length;
      
      expect(isDifferent).toBe(true);
    });

    test('云朵形状应该有平滑的曲线特征', () => {
      const shape = ShapeGenerator.generateShape(ShapeType.Cloud);
      
      // 验证形状是围绕中心点生成的
      const centerX = 500; // STANDARD_SIZE / 2
      const centerY = 500;
      
      const avgX = shape.reduce((sum, p) => sum + p.x, 0) / shape.length;
      const avgY = shape.reduce((sum, p) => sum + p.y, 0) / shape.length;
      
      // 中心点应该接近预期中心
      expect(Math.abs(avgX - centerX)).toBeLessThan(50);
      expect(Math.abs(avgY - centerY)).toBeLessThan(50);
    });

    test('应该支持字符串形式的形状类型', () => {
      // 测试字符串形式的polygon
      const polygonShape = ShapeGenerator.generateShape('polygon' as ShapeType);
      expect(Array.isArray(polygonShape)).toBe(true);
      expect(polygonShape.length).toBeGreaterThan(4);
      
      // 测试字符串形式的cloud
      const cloudShape = ShapeGenerator.generateShape('cloud' as ShapeType);
      expect(Array.isArray(cloudShape)).toBe(true);
      expect(cloudShape.length).toBe(200);
      
      // 测试字符串形式的jagged
      const jaggedShape = ShapeGenerator.generateShape('jagged' as ShapeType);
      expect(Array.isArray(jaggedShape)).toBe(true);
      expect(jaggedShape.length).toBe(200);
    });

    test('应该处理无效的形状类型（default分支）', () => {
      // 测试无效的形状类型，应该回退到多边形
      const invalidShape = ShapeGenerator.generateShape('invalid' as ShapeType);
      
      expect(Array.isArray(invalidShape)).toBe(true);
      expect(invalidShape.length).toBeGreaterThan(4); // 应该生成多边形
      expect(invalidShape.length).toBeLessThanOrEqual(13);
      
      // 验证每个点的结构
      invalidShape.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.isOriginal).toBe(true);
      });
    });

    test('应该处理undefined形状类型', () => {
      // 测试undefined，应该回退到多边形
      const undefinedShape = ShapeGenerator.generateShape(undefined as any);
      
      expect(Array.isArray(undefinedShape)).toBe(true);
      expect(undefinedShape.length).toBeGreaterThan(4); // 应该生成多边形
      expect(undefinedShape.length).toBeLessThanOrEqual(13);
    });

    test('应该处理null形状类型', () => {
      // 测试null，应该回退到多边形
      const nullShape = ShapeGenerator.generateShape(null as any);
      
      expect(Array.isArray(nullShape)).toBe(true);
      expect(nullShape.length).toBeGreaterThan(4); // 应该生成多边形
      expect(nullShape.length).toBeLessThanOrEqual(13);
    });

    test('所有形状都应该在标准尺寸范围内', () => {
      const shapes = [
        ShapeGenerator.generateShape(ShapeType.Polygon),
        ShapeGenerator.generateShape(ShapeType.Cloud),
        ShapeGenerator.generateShape(ShapeType.Jagged)
      ];

      shapes.forEach(shape => {
        shape.forEach(point => {
          // 所有点都应该在合理的范围内（考虑到半径最大为150）
          expect(point.x).toBeGreaterThan(300); // 500 - 200的安全边距
          expect(point.x).toBeLessThan(700);    // 500 + 200的安全边距
          expect(point.y).toBeGreaterThan(300);
          expect(point.y).toBeLessThan(700);
        });
      });
    });

    test('多边形应该有不同的点数', () => {
      // 生成多个多边形，验证点数的随机性
      const shapes = Array.from({ length: 10 }, () => 
        ShapeGenerator.generateShape(ShapeType.Polygon)
      );

      const pointCounts = shapes.map(shape => shape.length);
      const uniqueCounts = new Set(pointCounts);

      // 应该有不同的点数（由于随机性）
      expect(uniqueCounts.size).toBeGreaterThan(1);
      
      // 所有点数都应该在5-13范围内
      pointCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(5);
        expect(count).toBeLessThanOrEqual(13);
      });
    });

    test('云朵和锯齿形状应该有不同的半径变化', () => {
      const cloudShape = ShapeGenerator.generateShape(ShapeType.Cloud);
      const jaggedShape = ShapeGenerator.generateShape(ShapeType.Jagged);

      // 计算到中心点的距离
      const centerX = 500;
      const centerY = 500;

      const cloudDistances = cloudShape.map(point => 
        Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2)
      );

      const jaggedDistances = jaggedShape.map(point => 
        Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2)
      );

      // 验证距离都在合理范围内
      [...cloudDistances, ...jaggedDistances].forEach(distance => {
        expect(distance).toBeGreaterThan(100); // 最小半径约120
        expect(distance).toBeLessThan(200);    // 最大半径约150，加上一些容差
      });
    });
  });
});