/**
 * PuzzleGenerator 分支/边界覆盖增强测试
 */

import type { Point } from '@/types/puzzleTypes';

// 为隔离模块加载使用的辅助函数
const squareShape: Point[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
];

// 生成一个简单三角形片段
const tri = (ox: number, oy: number): Point[] => [
  { x: ox, y: oy },
  { x: ox + 10, y: oy },
  { x: ox + 5, y: oy + 8 }
];

// 生成一个简单四边形片段
const quad = (ox: number, oy: number): Point[] => [
  { x: ox, y: oy },
  { x: ox + 10, y: oy },
  { x: ox + 10, y: oy + 10 },
  { x: ox, y: oy + 10 }
];

describe('PuzzleGenerator - 分支覆盖增强', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('补偿逻辑：额外切割无法提升片段数量（保持原数量）', () => {
    jest.isolateModules(() => {
      // 固定切割线为3条，确保触发补偿逻辑条件 splitPieces.length < cuts.length
      jest.doMock('@/utils/puzzle/cutGenerators', () => ({
        generateCuts: jest.fn(() => ([
          { x1: 0, y1: 0, x2: 100, y2: 0, type: 'straight' as const },
          { x1: 0, y1: 0, x2: 0, y2: 100, type: 'straight' as const },
          { x1: 100, y1: 0, x2: 100, y2: 100, type: 'straight' as const }
        ]))
      }));

      // 初始仅1个片段，后续额外切割仍然返回1个片段，模拟“未提升”的路径
      let callCount = 0;
      jest.doMock('@/utils/puzzle/puzzleUtils', () => ({
        splitPolygon: jest.fn((_shape: Point[], _cuts: any[]) => {
          callCount++;
          // 无论是初始还是额外切割调用，都返回1个三角形片段
          return [tri(0, 0)];
        })
      }));

      // 动态导入以使用上面的 mock
      const { PuzzleGenerator } = require('../PuzzleGenerator');

      const result = PuzzleGenerator.generatePuzzle(squareShape, 'straight', 3);
      expect(result.pieces.length).toBe(1); // 补偿尝试未能提升
      expect(result.originalPositions.length).toBe(1);
      expect(result.pieces[0].points.length).toBeGreaterThanOrEqual(3);
    });
  });

  test('补偿逻辑：额外切割成功提升片段数量（从1提升为5）', () => {
    jest.isolateModules(() => {
      jest.doMock('@/utils/puzzle/cutGenerators', () => ({
        generateCuts: jest.fn(() => ([
          { x1: 0, y1: 0, x2: 100, y2: 0, type: 'diagonal' as const },
          { x1: 0, y1: 0, x2: 0, y2: 100, type: 'diagonal' as const },
          { x1: 100, y1: 0, x2: 100, y2: 100, type: 'diagonal' as const }
        ]))
      }));

      let callCount = 0;
      jest.doMock('@/utils/puzzle/puzzleUtils', () => ({
        splitPolygon: jest.fn((_shape: Point[], _cuts: any[]) => {
          callCount++;
          if (callCount === 1) {
            // 初次切割结果：1个片段
            return [tri(0, 0)];
          }
          // 额外切割：返回5个片段
          return [tri(0, 0), tri(12, 0), quad(0, 12), quad(12, 12), quad(24, 0)];
        })
      }));

      const { PuzzleGenerator } = require('../PuzzleGenerator');

      const result = PuzzleGenerator.generatePuzzle(squareShape, 'diagonal', 3);
      expect(result.pieces.length).toBe(5);
      expect(result.originalPositions.length).toBe(5);
      // 校验颜色与坐标已正确赋值
      result.pieces.forEach((p: { color: string; x: number; y: number }) => {
        expect(typeof p.color).toBe('string');
        expect(typeof p.x).toBe('number');
        expect(typeof p.y).toBe('number');
      });
    });
  });

  test('补偿逻辑：高难度对角线，多次重试后成功', () => {
    jest.isolateModules(() => {
      // 8条切割线，确保进入补偿逻辑并具备高难度重试上限=5
      jest.doMock('@/utils/puzzle/cutGenerators', () => ({
        generateCuts: jest.fn(() => Array.from({ length: 8 }, (_, i) => ({
          x1: 0, y1: i * 10, x2: 100, y2: i * 10, type: 'diagonal' as const
        })))
      }));

      // 模拟 splitPolygon 调用序列：1 -> 2 -> 3 -> 9（最终超过cuts，退出循环）
      const returns = [[tri(0, 0)], [tri(0, 0), tri(12, 0)], [tri(0, 0), tri(12, 0), tri(24, 0)],
        [tri(0, 0), tri(12, 0), tri(24, 0), tri(36, 0), tri(48,0), tri(60,0), tri(72,0), tri(84,0), tri(96,0)]];
      let idx = 0;
      jest.doMock('@/utils/puzzle/puzzleUtils', () => ({
        splitPolygon: jest.fn((_shape: Point[], _cuts: any[]) => {
          const out = returns[Math.min(idx, returns.length - 1)];
          idx++;
          return out;
        })
      }));

      const { PuzzleGenerator } = require('../PuzzleGenerator');
      const result = PuzzleGenerator.generatePuzzle(squareShape, 'diagonal', 8);
      expect(result.pieces.length).toBeGreaterThanOrEqual(4);
      expect(result.originalPositions.length).toBe(result.pieces.length);
    });
  });

  test('补偿逻辑：低难度直线，多次重试并触发水平/垂直分支', () => {
    jest.isolateModules(() => {
      // 5条切割线，低难度 maxRetryCount=3
      jest.doMock('@/utils/puzzle/cutGenerators', () => ({
        generateCuts: jest.fn(() => Array.from({ length: 5 }, (_, i) => ({
          x1: 0, y1: i * 15, x2: 100, y2: i * 15, type: 'straight' as const
        })))
      }));

      // 调用次序：1 -> 2 -> 2 -> 6（最终超过cuts，退出）
      const returns = [[tri(0, 0)], [tri(0, 0), tri(12, 0)], [tri(0, 0), tri(12, 0)],
        [tri(0, 0), tri(12, 0), tri(24, 0), tri(36, 0), tri(48,0), tri(60,0)]];
      let idx = 0;
      jest.doMock('@/utils/puzzle/puzzleUtils', () => ({
        splitPolygon: jest.fn((_shape: Point[], _cuts: any[]) => {
          const out = returns[Math.min(idx, returns.length - 1)];
          idx++;
          return out;
        })
      }));

      // 固定随机序列：<0.5 和 >0.5 交替，触发直线切割的 isVertical 分支
      const randomSpy = jest.spyOn(Math, 'random');
      const seq = [0.4, 0.6, 0.49, 0.51, 0.3, 0.7, 0.45, 0.55, 0.2, 0.8];
      let ridx = 0;
      randomSpy.mockImplementation(() => seq[(ridx++) % seq.length]);

      const { PuzzleGenerator } = require('../PuzzleGenerator');
      const result = PuzzleGenerator.generatePuzzle(squareShape, 'straight', 5);
      expect(result.pieces.length).toBeGreaterThanOrEqual(2);
      expect(result.originalPositions.length).toBe(result.pieces.length);

      randomSpy.mockRestore();
    });
  });

  test('私有方法 calculatePolygonArea 覆盖：三角形/矩形/负坐标多边形', () => {
    // 直接访问私有静态方法（测试用）
    const PG: any = require('../PuzzleGenerator');

    // 直角三角形 (0,0)-(4,0)-(0,3)，面积 = 6
    const triArea = PG.PuzzleGenerator['calculatePolygonArea']([
      { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }
    ] as Point[]);
    expect(triArea).toBe(6);

    // 矩形 (4x3)，面积 = 12
    const rectArea = PG.PuzzleGenerator['calculatePolygonArea']([
      { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }
    ] as Point[]);
    expect(rectArea).toBe(12);

    // 含负坐标的正方形 (边长2)，面积 = 4
    const negArea = PG.PuzzleGenerator['calculatePolygonArea']([
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }
    ] as Point[]);
    expect(negArea).toBe(4);
  });
});

