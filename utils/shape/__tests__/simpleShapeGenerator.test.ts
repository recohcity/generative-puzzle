/**
 * simpleShapeGenerator 单元测试
 */

import { generateSimpleShape } from '../simpleShapeGenerator';

describe('simpleShapeGenerator', () => {
  describe('generateSimpleShape', () => {
    test('应该生成一个正方形', () => {
      const shape = generateSimpleShape();
      
      expect(shape).toBeDefined();
      expect(Array.isArray(shape)).toBe(true);
      expect(shape.length).toBe(4);
      
      // 验证每个点都有x和y坐标
      shape.forEach(point => {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
      });
    });

    test('应该生成固定尺寸的形状', () => {
      const shape1 = generateSimpleShape();
      const shape2 = generateSimpleShape();
      
      // 两次调用应该生成相同的形状
      expect(shape1).toEqual(shape2);
    });

    test('应该生成以(320, 320)为中心的正方形', () => {
      const shape = generateSimpleShape();
      
      // 计算中心点
      const centerX = shape.reduce((sum, point) => sum + point.x, 0) / shape.length;
      const centerY = shape.reduce((sum, point) => sum + point.y, 0) / shape.length;
      
      expect(centerX).toBe(320);
      expect(centerY).toBe(320);
    });

    test('应该生成200x200尺寸的正方形', () => {
      const shape = generateSimpleShape();
      
      const minX = Math.min(...shape.map(p => p.x));
      const maxX = Math.max(...shape.map(p => p.x));
      const minY = Math.min(...shape.map(p => p.y));
      const maxY = Math.max(...shape.map(p => p.y));
      
      expect(maxX - minX).toBe(200);
      expect(maxY - minY).toBe(200);
    });
  });
});