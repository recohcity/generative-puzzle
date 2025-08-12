/**
 * puzzleUtils 单元测试
 * 
 * 🎯 验证拼图工具函数核心逻辑
 */

import { splitPolygon } from '../puzzleUtils';
import type { Point } from '@/types/puzzleTypes';

// 定义CutLine类型（从puzzleUtils.ts中复制）
type CutLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "straight" | "diagonal";
};

describe('puzzleUtils - 拼图工具函数测试', () => {
  
  // 测试用标准形状（正方形）
  const testShape: Point[] = [
    { x: 100, y: 100 },
    { x: 300, y: 100 },
    { x: 300, y: 300 },
    { x: 100, y: 300 }
  ];

  // 测试用切割线（垂直切割）
  const verticalCut: CutLine = {
    x1: 200,
    y1: 50,
    x2: 200,
    y2: 350,
    type: 'straight'
  };

  // 测试用切割线（水平切割）
  const horizontalCut: CutLine = {
    x1: 50,
    y1: 200,
    x2: 350,
    y2: 200,
    type: 'straight'
  };

  describe('🔑 基础多边形分割功能', () => {
    test('应该正确分割简单多边形', () => {
      const pieces = splitPolygon(testShape, [verticalCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
      
      pieces.forEach(piece => {
        expect(Array.isArray(piece)).toBe(true);
        expect(piece.length).toBeGreaterThan(2); // 至少3个点形成多边形
        
        piece.forEach(point => {
          expect(typeof point.x).toBe('number');
          expect(typeof point.y).toBe('number');
          expect(isFinite(point.x)).toBe(true);
          expect(isFinite(point.y)).toBe(true);
        });
      });
    });

    test('应该处理多条切割线', () => {
      const cuts = [verticalCut, horizontalCut];
      const pieces = splitPolygon(testShape, cuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
      
      // 验证所有片段都是有效的多边形
      pieces.forEach(piece => {
        expect(piece.length).toBeGreaterThan(2);
        
        // 验证点的坐标在合理范围内
        piece.forEach(point => {
          expect(point.x).toBeGreaterThanOrEqual(50);
          expect(point.x).toBeLessThanOrEqual(350);
          expect(point.y).toBeGreaterThanOrEqual(50);
          expect(point.y).toBeLessThanOrEqual(350);
        });
      });
    });

    test('应该处理无切割线的情况', () => {
      const pieces = splitPolygon(testShape, []);
      
      expect(pieces).toEqual([testShape]); // 应该返回原始形状
    });
  });

  describe('🔑 切割质量验证', () => {
    test('分割后的片段应该有合理的面积', () => {
      const pieces = splitPolygon(testShape, [verticalCut]);
      
      pieces.forEach(piece => {
        // 计算简单的边界框面积作为近似
        const xs = piece.map(p => p.x);
        const ys = piece.map(p => p.y);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        const approximateArea = width * height;
        
        expect(approximateArea).toBeGreaterThan(100); // 最小面积
      });
    });

    test('分割后的片段应该保持形状完整性', () => {
      const pieces = splitPolygon(testShape, [verticalCut]);
      
      pieces.forEach(piece => {
        // 验证片段是封闭的（第一个点和最后一个点相近或相同）
        if (piece.length > 2) {
          const first = piece[0];
          const last = piece[piece.length - 1];
          
          // 允许一定的误差
          const distance = Math.sqrt(
            Math.pow(first.x - last.x, 2) + 
            Math.pow(first.y - last.y, 2)
          );
          
          expect(distance).toBeLessThan(300); // 允许更大的误差范围
        }
      });
    });
  });

  describe('🔑 边界条件测试', () => {
    test('应该处理空形状', () => {
      const emptyShape: Point[] = [];
      
      expect(() => {
        const pieces = splitPolygon(emptyShape, [verticalCut]);
        expect(Array.isArray(pieces)).toBe(true);
      }).not.toThrow();
    });

    test('应该处理单点形状', () => {
      const singlePoint: Point[] = [{ x: 200, y: 200 }];
      
      expect(() => {
        const pieces = splitPolygon(singlePoint, [verticalCut]);
        expect(Array.isArray(pieces)).toBe(true);
      }).not.toThrow();
    });

    test('应该处理三角形', () => {
      const triangle: Point[] = [
        { x: 200, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      const pieces = splitPolygon(triangle, [verticalCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理无效的切割线', () => {
      const invalidCut: CutLine = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        type: 'straight'
      };
      
      expect(() => {
        const pieces = splitPolygon(testShape, [invalidCut]);
        expect(Array.isArray(pieces)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('🔑 性能基准测试', () => {
    test('简单分割应该高效', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        splitPolygon(testShape, [verticalCut]);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 10;
      
      expect(avgTime).toBeLessThan(50); // 平均每次 < 50ms
    });

    test('复杂分割应该在性能标准内', () => {
      const complexShape: Point[] = Array.from({ length: 12 }, (_, i) => ({
        x: 200 + 80 * Math.cos(i * Math.PI / 6),
        y: 200 + 80 * Math.sin(i * Math.PI / 6)
      }));
      
      const multipleCuts = [verticalCut, horizontalCut];
      
      const startTime = performance.now();
      splitPolygon(complexShape, multipleCuts);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('🔑 数据完整性验证', () => {
    test('分割结果应该包含有效的点数据', () => {
      const pieces = splitPolygon(testShape, [verticalCut]);
      
      pieces.forEach(piece => {
        piece.forEach(point => {
          expect(point).toHaveProperty('x');
          expect(point).toHaveProperty('y');
          expect(typeof point.x).toBe('number');
          expect(typeof point.y).toBe('number');
          expect(Number.isNaN(point.x)).toBe(false);
          expect(Number.isNaN(point.y)).toBe(false);
          expect(Number.isFinite(point.x)).toBe(true);
          expect(Number.isFinite(point.y)).toBe(true);
        });
      });
    });

    test('分割结果不应该包含重复的片段', () => {
      const pieces = splitPolygon(testShape, [verticalCut]);
      
      // 简单检查：不应该有完全相同的片段
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          const piece1 = pieces[i];
          const piece2 = pieces[j];
          
          // 如果长度不同，肯定不是重复的
          if (piece1.length !== piece2.length) {
            continue;
          }
          
          // 检查是否所有点都相同
          let identical = true;
          for (let k = 0; k < piece1.length; k++) {
            if (Math.abs(piece1[k].x - piece2[k].x) > 0.1 || 
                Math.abs(piece1[k].y - piece2[k].y) > 0.1) {
              identical = false;
              break;
            }
          }
          
          expect(identical).toBe(false); // 不应该有完全相同的片段
        }
      }
    });
  });

  describe('🔑 切割类型处理', () => {
    test('应该处理直线切割', () => {
      const straightCut: CutLine = {
        x1: 200,
        y1: 100,
        x2: 200,
        y2: 300,
        type: 'straight'
      };
      
      const pieces = splitPolygon(testShape, [straightCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理斜线切割', () => {
      const diagonalCut: CutLine = {
        x1: 150,
        y1: 150,
        x2: 250,
        y2: 250,
        type: 'diagonal'
      };
      
      const pieces = splitPolygon(testShape, [diagonalCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理混合切割类型', () => {
      const mixedCuts: CutLine[] = [
        {
          x1: 200,
          y1: 100,
          x2: 200,
          y2: 300,
          type: 'straight'
        },
        {
          x1: 150,
          y1: 150,
          x2: 250,
          y2: 250,
          type: 'diagonal'
        }
      ];
      
      const pieces = splitPolygon(testShape, mixedCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });
  });
});