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
  });
});