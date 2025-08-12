/**
 * simplePuzzleGenerator 单元测试
 */

import { generateSimplePuzzle } from '../simplePuzzleGenerator';
import type { Point } from '@/types/puzzleTypes';

describe('simplePuzzleGenerator', () => {
  // 测试用的简单正方形
  const testShape: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 }
  ];

  describe('generateSimplePuzzle', () => {
    test('应该生成拼图片段', () => {
      const result = generateSimplePuzzle(testShape, 'straight', 1);
      
      expect(result).toBeDefined();
      expect(result.pieces).toBeDefined();
      expect(result.originalPositions).toBeDefined();
      expect(Array.isArray(result.pieces)).toBe(true);
      expect(Array.isArray(result.originalPositions)).toBe(true);
    });

    test('应该为每个片段生成正确的属性', () => {
      const result = generateSimplePuzzle(testShape, 'straight', 1);
      
      result.pieces.forEach((piece, index) => {
        expect(piece.id).toBe(index);
        expect(Array.isArray(piece.points)).toBe(true);
        expect(Array.isArray(piece.originalPoints)).toBe(true);
        expect(typeof piece.rotation).toBe('number');
        expect(typeof piece.originalRotation).toBe('number');
        expect(typeof piece.x).toBe('number');
        expect(typeof piece.y).toBe('number');
        expect(typeof piece.originalX).toBe('number');
        expect(typeof piece.originalY).toBe('number');
        expect(typeof piece.isCompleted).toBe('boolean');
        expect(typeof piece.color).toBe('string');
      });
    });

    test('应该支持直线切割', () => {
      const result = generateSimplePuzzle(testShape, 'straight', 2);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该支持对角线切割', () => {
      const result = generateSimplePuzzle(testShape, 'diagonal', 2);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该为不同片段生成不同颜色', () => {
      const result = generateSimplePuzzle(testShape, 'straight', 2);
      
      if (result.pieces.length > 1) {
        const colors = result.pieces.map(piece => piece.color);
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBeGreaterThan(1);
      }
    });

    test('应该复制原始位置', () => {
      const result = generateSimplePuzzle(testShape, 'straight', 1);
      
      expect(result.originalPositions).toEqual(result.pieces);
    });

    test('应该处理最小切割的情况', () => {
      const result = generateSimplePuzzle(testShape, 'straight', 1);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });
  });
});