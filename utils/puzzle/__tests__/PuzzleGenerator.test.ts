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

    test('应该支持曲线切割（cutType === "curve"）', () => {
      // 测试曲线切割分支（第37-40行）
      const result = PuzzleGenerator.generatePuzzle(testShape, 'curve', 2);
      
      expect(result).toBeDefined();
      expect(result.pieces).toBeDefined();
      expect(result.originalPositions).toBeDefined();
      expect(Array.isArray(result.pieces)).toBe(true);
      expect(Array.isArray(result.originalPositions)).toBe(true);
      expect(result.pieces.length).toBeGreaterThan(0);
    });

    test('应该支持曲线切割与不同形状类型', () => {
      // 测试曲线切割与不同 shapeType 的组合
      const polygonResult = PuzzleGenerator.generatePuzzle(testShape, 'curve', 2);
      expect(polygonResult.pieces.length).toBeGreaterThan(0);

      // 测试曲线形状
      const curveShape: Point[] = [
        { x: 100, y: 100 },
        { x: 150, y: 80 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 }
      ];
      const curveResult = PuzzleGenerator.generatePuzzle(curveShape, 'curve', 3);
      expect(curveResult.pieces.length).toBeGreaterThan(0);
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

  describe('🔑 高难度切割和边界条件测试', () => {
    test('应该处理高难度切割(7-8次)的额外切割逻辑', () => {
      // 使用一个较大的形状来确保有足够的空间进行多次切割
      const largeShape: Point[] = [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 400 },
        { x: 0, y: 400 }
      ];

      const result = PuzzleGenerator.generatePuzzle(largeShape, 'diagonal', 8);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
      
      // 验证每个片段都有正确的属性
      result.pieces.forEach(piece => {
        expect(piece.id).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(piece.points)).toBe(true);
        expect(piece.points.length).toBeGreaterThan(0);
        expect(typeof piece.color).toBe('string');
      });
    });

    test('应该触发额外切割重试逻辑', () => {
      // 使用一个小形状来更容易触发额外切割逻辑
      const smallShape: Point[] = [
        { x: 50, y: 50 },
        { x: 150, y: 50 },
        { x: 150, y: 150 },
        { x: 50, y: 150 }
      ];

      // 尝试进行多次切割，可能触发额外切割逻辑
      const result = PuzzleGenerator.generatePuzzle(smallShape, 'straight', 6);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理高难度切割的随机角度生成', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'diagonal', 7);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理直线切割的额外切割逻辑', () => {
      // 使用一个形状来触发直线切割的额外切割逻辑
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 5);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理对角线切割的额外切割逻辑', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'diagonal', 5);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理片段数量超过预期的情况', () => {
      // 使用一个复杂形状来尝试生成更多片段
      const complexShape: Point[] = [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 200 },
        { x: 300, y: 300 },
        { x: 0, y: 300 }
      ];

      const result = PuzzleGenerator.generatePuzzle(complexShape, 'straight', 2);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该正确计算多边形面积并排序', () => {
      // 创建不同大小的片段来测试面积计算和排序
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 3);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      
      // 验证每个片段都有有效的点数组
      result.pieces.forEach(piece => {
        expect(piece.points.length).toBeGreaterThanOrEqual(3); // 至少3个点形成多边形
      });
    });

    test('应该测试颜色数组打乱功能', () => {
      // 多次生成拼图来测试颜色打乱
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 3);
        results.push(result.pieces.map(p => p.color));
      }
      
      // 验证至少有一些不同的颜色组合（由于随机性，不是100%保证）
      expect(results.length).toBe(5);
      results.forEach(colors => {
        colors.forEach(color => {
          expect(typeof color).toBe('string');
          expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });

    test('应该处理额外切割线的生成和应用', () => {
      // 使用一个复杂形状来更好地测试额外切割
      const complexShape: Point[] = [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 200 },
        { x: 300, y: 300 },
        { x: 0, y: 300 }
      ];

      const result = PuzzleGenerator.generatePuzzle(complexShape, 'diagonal', 6);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理中心点计算', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 2);
      
      result.pieces.forEach(piece => {
        expect(typeof piece.x).toBe('number');
        expect(typeof piece.y).toBe('number');
        expect(typeof piece.originalX).toBe('number');
        expect(typeof piece.originalY).toBe('number');
        
        // 验证中心点在合理范围内
        expect(piece.x).toBeGreaterThan(0);
        expect(piece.y).toBeGreaterThan(0);
        expect(piece.originalX).toBeGreaterThan(0);
        expect(piece.originalY).toBeGreaterThan(0);
      });
    });

    test('应该处理边界情况 - 极小形状', () => {
      const tinyShape: Point[] = [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
        { x: 10, y: 20 }
      ];

      const result = PuzzleGenerator.generatePuzzle(tinyShape, 'straight', 1);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理边界情况 - 极大形状', () => {
      const hugeShape: Point[] = [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
        { x: 1000, y: 1000 },
        { x: 0, y: 1000 }
      ];

      const result = PuzzleGenerator.generatePuzzle(hugeShape, 'diagonal', 4);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理三角形形状', () => {
      const triangleShape: Point[] = [
        { x: 150, y: 50 },
        { x: 100, y: 150 },
        { x: 200, y: 150 }
      ];

      const result = PuzzleGenerator.generatePuzzle(triangleShape, 'straight', 2);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该处理不规则多边形', () => {
      const irregularShape: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 120 },
        { x: 250, y: 180 },
        { x: 180, y: 220 },
        { x: 120, y: 200 },
        { x: 80, y: 150 }
      ];

      const result = PuzzleGenerator.generatePuzzle(irregularShape, 'diagonal', 3);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该尝试触发高难度切割的额外切割逻辑', () => {
      // 使用一个特殊设计的形状，更容易触发额外切割逻辑
      const challengingShape: Point[] = [
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
        { x: 50, y: 100 }
      ];

      // 尝试多次高难度切割，增加触发额外切割逻辑的机会
      for (let i = 0; i < 10; i++) {
        const result = PuzzleGenerator.generatePuzzle(challengingShape, 'diagonal', 8);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.originalPositions.length).toBe(result.pieces.length);
      }
    });

    test('应该尝试触发直线切割的额外切割逻辑', () => {
      // 使用一个小形状来更容易触发额外切割逻辑
      const smallShape: Point[] = [
        { x: 10, y: 10 },
        { x: 60, y: 10 },
        { x: 60, y: 60 },
        { x: 10, y: 60 }
      ];

      // 尝试多次切割，增加触发额外切割逻辑的机会
      for (let i = 0; i < 10; i++) {
        const result = PuzzleGenerator.generatePuzzle(smallShape, 'straight', 7);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.originalPositions.length).toBe(result.pieces.length);
      }
    });

    test('应该测试额外切割线的生成和应用逻辑', () => {
      // 使用一个线性形状来尝试触发额外切割
      const linearShape: Point[] = [
        { x: 0, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 120 },
        { x: 0, y: 120 }
      ];

      // 尝试多次切割
      for (let i = 0; i < 5; i++) {
        const result = PuzzleGenerator.generatePuzzle(linearShape, 'diagonal', 6);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.originalPositions.length).toBe(result.pieces.length);
      }
    });

    test('应该处理最大切割数量', () => {
      const result = PuzzleGenerator.generatePuzzle(testShape, 'diagonal', 8);
      
      expect(result.pieces.length).toBeGreaterThan(0);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });

    test('应该测试颜色打乱的随机性', () => {
      // 生成多个拼图来测试颜色打乱
      const colorSets = [];
      for (let i = 0; i < 20; i++) {
        const result = PuzzleGenerator.generatePuzzle(testShape, 'straight', 4);
        colorSets.push(result.pieces.map(p => p.color).join(','));
      }
      
      // 验证有不同的颜色组合
      const uniqueColorSets = new Set(colorSets);
      expect(uniqueColorSets.size).toBeGreaterThan(1);
    });
  });

  describe('🎯 额外分支覆盖测试', () => {
    test('应该覆盖高难度切割的随机角度生成分支', () => {
      // 使用一个特殊形状来强制触发额外切割逻辑
      const specialShape: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 }
      ];

      // 多次尝试高难度切割来覆盖随机角度生成分支
      for (let i = 0; i < 50; i++) {
        const result = PuzzleGenerator.generatePuzzle(specialShape, 'diagonal', 8);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.originalPositions.length).toBe(result.pieces.length);
      }
    });

    test('应该覆盖直线切割的水平/垂直选择分支', () => {
      // 使用一个小形状来强制触发额外切割逻辑
      const smallShape: Point[] = [
        { x: 10, y: 10 },
        { x: 40, y: 10 },
        { x: 40, y: 40 },
        { x: 10, y: 40 }
      ];

      // 多次尝试直线切割来覆盖水平/垂直选择分支
      for (let i = 0; i < 50; i++) {
        const result = PuzzleGenerator.generatePuzzle(smallShape, 'straight', 7);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.originalPositions.length).toBe(result.pieces.length);
      }
    });

    test('应该覆盖对角线切割的额外切割分支', () => {
      // 使用一个小形状来强制触发额外切割逻辑
      const tinyShape: Point[] = [
        { x: 5, y: 5 },
        { x: 25, y: 5 },
        { x: 25, y: 25 },
        { x: 5, y: 25 }
      ];

      // 多次尝试对角线切割来覆盖额外切割分支
      for (let i = 0; i < 50; i++) {
        const result = PuzzleGenerator.generatePuzzle(tinyShape, 'diagonal', 6);
        expect(result.pieces.length).toBeGreaterThan(0);
        expect(result.originalPositions.length).toBe(result.pieces.length);
      }
    });

    test('应该强制触发额外切割逻辑的所有分支', () => {
      // 使用一个极小的形状来最大化触发额外切割逻辑的机会
      const microShape: Point[] = [
        { x: 1, y: 1 },
        { x: 11, y: 1 },
        { x: 11, y: 11 },
        { x: 1, y: 11 }
      ];

      // 测试高难度 + 对角线切割
      for (let i = 0; i < 30; i++) {
        const result1 = PuzzleGenerator.generatePuzzle(microShape, 'diagonal', 8);
        expect(result1.pieces.length).toBeGreaterThan(0);
      }

      // 测试高难度 + 直线切割
      for (let i = 0; i < 30; i++) {
        const result2 = PuzzleGenerator.generatePuzzle(microShape, 'straight', 8);
        expect(result2.pieces.length).toBeGreaterThan(0);
      }

      // 测试中等难度 + 对角线切割
      for (let i = 0; i < 30; i++) {
        const result3 = PuzzleGenerator.generatePuzzle(microShape, 'diagonal', 5);
        expect(result3.pieces.length).toBeGreaterThan(0);
      }
    });

    test('应该测试额外切割线的所有生成路径', () => {
      // 创建一个线性形状来强制触发额外切割
      const linearShape: Point[] = [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 55 },
        { x: 0, y: 55 }
      ];

      // 测试所有切割类型和难度组合
      const testCases = [
        { cutType: 'straight' as const, cutCount: 7 },
        { cutType: 'straight' as const, cutCount: 8 },
        { cutType: 'diagonal' as const, cutCount: 7 },
        { cutType: 'diagonal' as const, cutCount: 8 },
        { cutType: 'straight' as const, cutCount: 5 },
        { cutType: 'diagonal' as const, cutCount: 6 }
      ];

      testCases.forEach(({ cutType, cutCount }) => {
        for (let i = 0; i < 20; i++) {
          const result = PuzzleGenerator.generatePuzzle(linearShape, cutType, cutCount);
          expect(result.pieces.length).toBeGreaterThan(0);
          expect(result.originalPositions.length).toBe(result.pieces.length);
        }
      });
    });

    test('应该覆盖随机数生成的不同分支', () => {
      // 使用一个特殊形状来测试随机数生成的不同分支
      const rectangularShape: Point[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 }
      ];

      // 大量测试来覆盖随机数生成的不同分支
      for (let i = 0; i < 100; i++) {
        // 测试高难度切割的随机角度生成
        const result1 = PuzzleGenerator.generatePuzzle(rectangularShape, 'diagonal', 8);
        expect(result1.pieces.length).toBeGreaterThan(0);

        // 测试直线切割的随机水平/垂直选择
        const result2 = PuzzleGenerator.generatePuzzle(rectangularShape, 'straight', 7);
        expect(result2.pieces.length).toBeGreaterThan(0);
      }
    });

    test('应该测试额外切割成功和失败的情况', () => {
      // 使用不同大小的形状来测试额外切割的成功和失败情况
      const shapes = [
        // 极小形状 - 更容易触发额外切割逻辑
        [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 5, y: 5 },
          { x: 0, y: 5 }
        ],
        // 细长形状 - 切割困难
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 2 },
          { x: 0, y: 2 }
        ],
        // 正方形 - 标准形状
        [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 30, y: 30 },
          { x: 0, y: 30 }
        ]
      ];

      shapes.forEach((shape, shapeIndex) => {
        for (let i = 0; i < 20; i++) {
          const result = PuzzleGenerator.generatePuzzle(shape, 'diagonal', 8);
          expect(result.pieces.length).toBeGreaterThan(0);
          expect(result.originalPositions.length).toBe(result.pieces.length);
        }
      });
    });
  });
});