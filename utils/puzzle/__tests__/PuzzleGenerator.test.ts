/**
 * PuzzleGenerator 单元测试
 * 测试完整的拼图生成功能
 */

import { PuzzleGenerator } from '../PuzzleGenerator';
import type { Point } from '@/types/puzzleTypes';

describe('PuzzleGenerator - 完整功能测试', () => {
  // 测试用的标准形状
  const testShape: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 }
  ];

  describe('generatePuzzle', () => {
    test('应该生成拼图片段', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 2);
      
      expect(result).toBeDefined();
      expect(result.pieces).toBeDefined();
      expect(result.originalPositions).toBeDefined();
      expect(Array.isArray(result.pieces)).toBe(true);
      expect(Array.isArray(result.originalPositions)).toBe(true);
    });

    test('应该为每个片段生成正确的属性', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 1);
      
      result.pieces.forEach((piece, index) => {
        expect(typeof piece.id).toBe('number');
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
        expect(piece.color).toMatch(/^#[0-9A-F]{6}$/i); // 验证颜色格式
      });
    });

    test('应该支持直线切割', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 2);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该支持对角线切割', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'diagonal', 2);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该为不同片段生成不同颜色', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 3);
      
      if (result.pieces.length > 1) {
        const colors = result.pieces.map(piece => piece.color);
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBeGreaterThan(1);
      }
    });

    test('应该使用暖色调色板', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 2);
      
      // 验证颜色是否来自预期的暖色调色板
      const warmColors = [
        "#FF9F40", "#FF6B6B", "#FFD166", "#F68E5F", "#FFB17A", "#FFE3C1",
        "#FFBB7C", "#FF8A5B", "#FF785A", "#F26419", "#E57373", "#FFCC80",
        "#F08080", "#FFB74D"
      ];
      
      result.pieces.forEach(piece => {
        expect(warmColors).toContain(piece.color);
      });
    });

    test('应该处理高难度切割', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'diagonal', 7);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该复制原始位置', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 1);
      
      expect(result.originalPositions).toEqual(result.pieces);
    });
  });
});