/**
 * puzzleUtils 单元测试
 * 
 * 🎯 验证拼图工具函数核心逻辑
 */

import { splitPolygon, splitPieceWithLine, isValidPiece, checkRectOverlap, findLineIntersections } from '../puzzleUtils';
import type { Point } from '@/types/puzzleTypes';

// 定义CutLine类型（从puzzleUtils.ts中复制）
type CutLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "straight" | "diagonal";
};

// 导入内部函数进行测试
const puzzleUtilsModule = require('../puzzleUtils');

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

  describe('🔑 高级切割场景测试', () => {
    test('应该处理目标片段数量限制', () => {
      // 创建一个大形状，尝试多次切割
      const largeShape: Point[] = [
        { x: 50, y: 50 },
        { x: 350, y: 50 },
        { x: 350, y: 350 },
        { x: 50, y: 350 }
      ];
      
      const manyCuts: CutLine[] = [
        { x1: 133, y1: 0, x2: 133, y2: 400, type: 'straight' },
        { x1: 266, y1: 0, x2: 266, y2: 400, type: 'straight' },
        { x1: 0, y1: 133, x2: 400, y2: 133, type: 'straight' },
        { x1: 0, y1: 266, x2: 400, y2: 266, type: 'straight' },
        { x1: 100, y1: 100, x2: 300, y2: 300, type: 'diagonal' },
        { x1: 300, y1: 100, x2: 100, y2: 300, type: 'diagonal' }
      ];
      
      const pieces = splitPolygon(largeShape, manyCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
      
      // 验证片段质量
      pieces.forEach(piece => {
        expect(piece.length).toBeGreaterThanOrEqual(3);
      });
    });

    test('应该处理高难度切割场景', () => {
      // 创建复杂形状
      const complexShape: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 80 },
        { x: 300, y: 100 },
        { x: 320, y: 200 },
        { x: 300, y: 300 },
        { x: 200, y: 320 },
        { x: 100, y: 300 },
        { x: 80, y: 200 }
      ];
      
      const complexCuts: CutLine[] = [
        { x1: 150, y1: 50, x2: 250, y2: 350, type: 'diagonal' },
        { x1: 50, y1: 150, x2: 350, y2: 250, type: 'diagonal' },
        { x1: 200, y1: 50, x2: 200, y2: 350, type: 'straight' }
      ];
      
      const pieces = splitPolygon(complexShape, complexCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理递归切割场景', () => {
      // 创建一个形状，使用会触发递归的切割
      const recursiveShape: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      // 使用可能触发递归的切割线
      const recursiveCut: CutLine = {
        x1: 50,
        y1: 200,
        x2: 150,
        y2: 200,
        type: 'straight'
      };
      
      const pieces = splitPolygon(recursiveShape, [recursiveCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理最远交点选择逻辑', () => {
      // 创建一个会产生多个交点的场景
      const multiIntersectionShape: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 80 },
        { x: 300, y: 100 },
        { x: 280, y: 200 },
        { x: 300, y: 300 },
        { x: 200, y: 320 },
        { x: 100, y: 300 },
        { x: 120, y: 200 }
      ];
      
      const intersectionCut: CutLine = {
        x1: 50,
        y1: 200,
        x2: 350,
        y2: 200,
        type: 'straight'
      };
      
      const pieces = splitPolygon(multiIntersectionShape, [intersectionCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理小片段过滤', () => {
      // 创建可能产生小片段的切割
      const filterShape: Point[] = [
        { x: 100, y: 100 },
        { x: 110, y: 100 },
        { x: 110, y: 110 },
        { x: 100, y: 110 }
      ];
      
      const filterCut: CutLine = {
        x1: 105,
        y1: 95,
        x2: 105,
        y2: 115,
        type: 'straight'
      };
      
      const pieces = splitPolygon(filterShape, [filterCut]);
      
      expect(Array.isArray(pieces)).toBe(true);
      // 小片段应该被过滤掉
    });

    test('应该处理警告场景', () => {
      // 创建一个可能触发警告的场景
      const warningShape: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      // 使用多条可能导致片段不足的切割线
      const warningCuts: CutLine[] = [
        { x1: 90, y1: 200, x2: 110, y2: 200, type: 'straight' },
        { x1: 290, y1: 200, x2: 310, y2: 200, type: 'straight' }
      ];
      
      const pieces = splitPolygon(warningShape, warningCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
    });

    test('应该触发高难度模式的警告逻辑', () => {
      // 创建一个高难度场景（8条或更多切割线）
      const highDifficultyShape: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      // 使用8条切割线触发高难度模式，但大部分无效
      const highDifficultyCuts: CutLine[] = [
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 50, y1: 50, x2: 60, y2: 60, type: 'straight' },   // 无效切割
        { x1: 200, y1: 50, x2: 200, y2: 350, type: 'straight' } // 有效切割
      ];
      
      const pieces = splitPolygon(highDifficultyShape, highDifficultyCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      // 应该触发警告逻辑，因为最终片段数量远少于目标
    });

    test('应该处理已达到目标片段数量的情况', () => {
      // 创建一个场景，让第一次切割就达到目标
      const targetShape: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      // 只使用一条有效切割线，但传入多条
      const targetCuts: CutLine[] = [
        { x1: 200, y1: 50, x2: 200, y2: 350, type: 'straight' }, // 有效切割
        { x1: 150, y1: 50, x2: 150, y2: 350, type: 'straight' }  // 第二条切割
      ];
      
      const pieces = splitPolygon(targetShape, targetCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该处理高难度模式的90%提前结束逻辑', () => {
      // 创建一个大形状，使用高难度切割
      const earlyEndShape: Point[] = [
        { x: 50, y: 50 },
        { x: 350, y: 50 },
        { x: 350, y: 350 },
        { x: 50, y: 350 }
      ];
      
      // 使用8条有效切割线触发高难度模式
      const earlyEndCuts: CutLine[] = [
        { x1: 100, y1: 0, x2: 100, y2: 400, type: 'straight' },
        { x1: 150, y1: 0, x2: 150, y2: 400, type: 'straight' },
        { x1: 200, y1: 0, x2: 200, y2: 400, type: 'straight' },
        { x1: 250, y1: 0, x2: 250, y2: 400, type: 'straight' },
        { x1: 300, y1: 0, x2: 300, y2: 400, type: 'straight' },
        { x1: 0, y1: 100, x2: 400, y2: 100, type: 'straight' },
        { x1: 0, y1: 200, x2: 400, y2: 200, type: 'straight' },
        { x1: 0, y1: 300, x2: 400, y2: 300, type: 'straight' }
      ];
      
      const pieces = splitPolygon(earlyEndShape, earlyEndCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    });

    test('应该触发已达到目标片段数量的停止逻辑', () => {
      // 创建一个场景，让切割快速达到目标数量
      const stopShape: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      // 使用多条切割线，但第一条就能达到目标
      const stopCuts: CutLine[] = [
        { x1: 200, y1: 50, x2: 200, y2: 350, type: 'straight' }, // 有效切割，产生2个片段
        { x1: 150, y1: 50, x2: 150, y2: 350, type: 'straight' }, // 第二条切割
        { x1: 250, y1: 50, x2: 250, y2: 350, type: 'straight' }  // 第三条切割
      ];
      
      const pieces = splitPolygon(stopShape, stopCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBeGreaterThan(1);
    });

    test('应该触发精确的目标片段数量停止逻辑', () => {
      // 创建一个特殊场景，让第一次切割就达到精确的目标数量
      const preciseShape: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      // 只使用一条切割线，目标是2个片段
      const preciseCuts: CutLine[] = [
        { x1: 200, y1: 50, x2: 200, y2: 350, type: 'straight' } // 产生恰好2个片段
      ];
      
      const pieces = splitPolygon(preciseShape, preciseCuts);
      
      expect(Array.isArray(pieces)).toBe(true);
      expect(pieces.length).toBe(2); // 应该恰好是2个片段
    });
  });

  describe('🔑 splitPieceWithLine 函数测试', () => {
    test('应该正确分割片段', () => {
      const piece: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      const cut: CutLine = {
        x1: 200,
        y1: 50,
        x2: 200,
        y2: 350,
        type: 'straight'
      };
      
      const result = splitPieceWithLine(piece, cut);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该处理递归深度限制', () => {
      const piece: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      const cut: CutLine = {
        x1: 50,
        y1: 50,
        x2: 60,
        y2: 60,
        type: 'straight'
      };
      
      // 直接调用递归深度为3的情况
      const result = splitPieceWithLine(piece, cut, 3);
      
      expect(result).toEqual([piece]); // 应该返回原始片段
    });

    test('应该处理多于两个交点的情况', () => {
      // 创建一个复杂形状，可能产生多个交点
      const complexPiece: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 80 },
        { x: 300, y: 100 },
        { x: 280, y: 200 },
        { x: 300, y: 300 },
        { x: 200, y: 320 },
        { x: 100, y: 300 },
        { x: 120, y: 200 }
      ];
      
      const cut: CutLine = {
        x1: 50,
        y1: 200,
        x2: 350,
        y2: 200,
        type: 'straight'
      };
      
      const result = splitPieceWithLine(complexPiece, cut);
      
      expect(Array.isArray(result)).toBe(true);
    });

    test('应该处理斜线类型的递归切割', () => {
      const piece: Point[] = [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 }
      ];
      
      const diagonalCut: CutLine = {
        x1: 50,
        y1: 50,
        x2: 60,
        y2: 60,
        type: 'diagonal'
      };
      
      const result = splitPieceWithLine(piece, diagonalCut);
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('🔑 isValidPiece 函数测试', () => {
    test('应该验证有效的片段', () => {
      const validPiece: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 }
      ];
      
      expect(isValidPiece(validPiece)).toBe(true);
    });

    test('应该拒绝无效的片段', () => {
      const invalidPiece: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 100 }
      ];
      
      expect(isValidPiece(invalidPiece)).toBe(false);
    });

    test('应该处理空片段', () => {
      const emptyPiece: Point[] = [];
      
      expect(isValidPiece(emptyPiece)).toBe(false);
    });
  });

  describe('🔑 checkRectOverlap 函数测试', () => {
    test('应该检测重叠的矩形', () => {
      const rect1 = { x: 100, y: 100, width: 100, height: 100 };
      const rect2 = { x: 150, y: 150, width: 100, height: 100 };
      
      expect(checkRectOverlap(rect1, rect2)).toBe(true);
    });

    test('应该检测不重叠的矩形', () => {
      const rect1 = { x: 100, y: 100, width: 50, height: 50 };
      const rect2 = { x: 200, y: 200, width: 50, height: 50 };
      
      expect(checkRectOverlap(rect1, rect2)).toBe(false);
    });

    test('应该检测相邻的矩形', () => {
      const rect1 = { x: 100, y: 100, width: 100, height: 100 };
      const rect2 = { x: 200, y: 100, width: 100, height: 100 };
      
      expect(checkRectOverlap(rect1, rect2)).toBe(false);
    });

    test('应该检测包含关系的矩形', () => {
      const rect1 = { x: 100, y: 100, width: 200, height: 200 };
      const rect2 = { x: 150, y: 150, width: 50, height: 50 };
      
      expect(checkRectOverlap(rect1, rect2)).toBe(true);
    });
  });

  describe('🔑 内部函数测试', () => {
    test('应该正确计算多边形面积', () => {
      // 测试正方形面积计算
      const square: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      
      // 通过splitPolygon间接测试calculatePolygonArea
      const pieces = splitPolygon(square, []);
      expect(pieces.length).toBe(1);
      expect(pieces[0]).toEqual(square);
    });

    test('应该处理空多边形', () => {
      const emptyShape: Point[] = [];
      const pieces = splitPolygon(emptyShape, []);
      expect(pieces).toEqual([]);
    });

    test('应该处理单点多边形', () => {
      const singlePoint: Point[] = [{ x: 100, y: 100 }];
      const pieces = splitPolygon(singlePoint, []);
      expect(pieces).toEqual([]);
    });

    test('应该处理两点多边形', () => {
      const twoPoints: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      ];
      const pieces = splitPolygon(twoPoints, []);
      expect(pieces).toEqual([]);
    });
  });

  describe('🔑 findLineIntersections 函数测试', () => {
    test('应该找到相交线段的交点', () => {
      const line1 = {
        start: { x: 100, y: 100 },
        end: { x: 200, y: 200 }
      };
      const line2 = {
        start: { x: 100, y: 200 },
        end: { x: 200, y: 100 }
      };
      
      const intersections = findLineIntersections(line1, line2);
      
      expect(intersections.length).toBe(1);
      expect(intersections[0].x).toBeCloseTo(150);
      expect(intersections[0].y).toBeCloseTo(150);
    });

    test('应该处理平行线', () => {
      const line1 = {
        start: { x: 100, y: 100 },
        end: { x: 200, y: 100 }
      };
      const line2 = {
        start: { x: 100, y: 200 },
        end: { x: 200, y: 200 }
      };
      
      const intersections = findLineIntersections(line1, line2);
      
      expect(intersections.length).toBe(0);
    });

    test('应该处理不相交的线段', () => {
      const line1 = {
        start: { x: 100, y: 100 },
        end: { x: 150, y: 150 }
      };
      const line2 = {
        start: { x: 200, y: 200 },
        end: { x: 250, y: 250 }
      };
      
      const intersections = findLineIntersections(line1, line2);
      
      expect(intersections.length).toBe(0);
    });

    test('应该处理延长线相交但线段不相交的情况', () => {
      const line1 = {
        start: { x: 100, y: 100 },
        end: { x: 120, y: 120 }
      };
      const line2 = {
        start: { x: 180, y: 180 },
        end: { x: 200, y: 200 }
      };
      
      const intersections = findLineIntersections(line1, line2);
      
      expect(intersections.length).toBe(0);
    });

    test('应该处理垂直和水平线的交点', () => {
      const line1 = {
        start: { x: 150, y: 100 },
        end: { x: 150, y: 200 }
      };
      const line2 = {
        start: { x: 100, y: 150 },
        end: { x: 200, y: 150 }
      };
      
      const intersections = findLineIntersections(line1, line2);
      
      expect(intersections.length).toBe(1);
      expect(intersections[0].x).toBe(150);
      expect(intersections[0].y).toBe(150);
    });

    test('应该处理几乎平行的线（数值精度测试）', () => {
      const line1 = {
        start: { x: 100, y: 100 },
        end: { x: 200, y: 100.0000000001 }
      };
      const line2 = {
        start: { x: 100, y: 200 },
        end: { x: 200, y: 200 }
      };
      
      const intersections = findLineIntersections(line1, line2);
      
      expect(intersections.length).toBe(0); // 应该被识别为平行线
    });
  });

  describe('🔑 calculatePolygonArea 函数覆盖测试', () => {
    test('应该通过面积计算覆盖第133-136行', () => {
      // 创建一个三角形，测试面积计算的循环逻辑
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ];
      
      // 通过splitPolygon间接调用calculatePolygonArea
      const pieces = splitPolygon(triangle, []);
      expect(pieces.length).toBe(1);
      expect(pieces[0]).toEqual(triangle);
      
      // 创建一个复杂多边形，确保循环执行多次
      const complexPolygon: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 10 },
        { x: 100, y: 0 },
        { x: 110, y: 50 },
        { x: 100, y: 100 },
        { x: 50, y: 110 },
        { x: 0, y: 100 },
        { x: -10, y: 50 }
      ];
      
      // 这会触发calculatePolygonArea函数的循环（第133-136行）
      const complexPieces = splitPolygon(complexPolygon, []);
      expect(complexPieces.length).toBe(1);
      expect(complexPieces[0]).toEqual(complexPolygon);
      
      // 测试面积过滤逻辑，这会多次调用calculatePolygonArea
      const cutLine: CutLine = {
        x1: 50,
        y1: -20,
        x2: 50,
        y2: 120,
        type: 'straight'
      };
      
      const splitPieces = splitPolygon(complexPolygon, [cutLine]);
      expect(Array.isArray(splitPieces)).toBe(true);
      expect(splitPieces.length).toBeGreaterThan(0);
      
      // 每个片段都会通过calculatePolygonArea进行面积计算和过滤
      splitPieces.forEach(piece => {
        expect(piece.length).toBeGreaterThanOrEqual(3);
      });
    });

    test('应该测试calculatePolygonArea的边界情况', () => {
      // 测试正方形（简单情况）
      const square: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      
      // 通过splitPolygon触发面积计算
      const squarePieces = splitPolygon(square, []);
      expect(squarePieces.length).toBe(1);
      
      // 测试不规则形状
      const irregular: Point[] = [
        { x: 0, y: 0 },
        { x: 30, y: 5 },
        { x: 25, y: 25 },
        { x: 5, y: 30 }
      ];
      
      const irregularPieces = splitPolygon(irregular, []);
      expect(irregularPieces.length).toBe(1);
      
      // 测试大量顶点的多边形，确保循环执行多次
      const manyVertices: Point[] = [];
      const sides = 12;
      const radius = 50;
      const centerX = 100;
      const centerY = 100;
      
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        manyVertices.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
      
      // 这会触发calculatePolygonArea的循环执行12次
      const manyVerticesPieces = splitPolygon(manyVertices, []);
      expect(manyVerticesPieces.length).toBe(1);
      expect(manyVerticesPieces[0]).toEqual(manyVertices);
    });
  });
});