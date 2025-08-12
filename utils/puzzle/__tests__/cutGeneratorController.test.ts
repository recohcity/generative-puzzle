/**
 * cutGeneratorController.test.ts
 * CutGeneratorController的100%覆盖率测试
 */

import { CutGeneratorController } from '../cutGeneratorController';
import { Point } from '@/types/puzzleTypes';
import { CutLine } from '../cutGeneratorTypes';
import * as cutGeneratorGeometry from '../cutGeneratorGeometry';
import * as cutGeneratorStrategies from '../cutGeneratorStrategies';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

describe('CutGeneratorController - 100%覆盖率测试', () => {
  let controller: CutGeneratorController;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleWarn: jest.SpyInstance;

  // 测试用的基本形状
  const testShape: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ];

  beforeEach(() => {
    controller = new CutGeneratorController();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('generateCuts - 主要方法测试', () => {
    test('应该成功生成切割线并记录正确的日志', () => {
      const cuts = controller.generateCuts(testShape, 1, 'straight');

      expect(cuts).toBeDefined();
      expect(Array.isArray(cuts)).toBe(true);
      expect(cuts.length).toBeGreaterThan(0);

      // 验证日志调用
      expect(mockConsoleLog).toHaveBeenCalledWith('低难度：尝试生成1条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('难度级别: 1, 中心切割概率: 0.85, 目标切割数: 1');
      expect(mockConsoleLog).toHaveBeenCalledWith('成功生成切割线 1');
      expect(mockConsoleLog).toHaveBeenCalledWith('最终生成了1个切割线');
    });

    test('应该为不同难度级别生成不同数量的切割线', () => {
      const difficulty1 = controller.generateCuts(testShape, 1, 'straight');
      const difficulty4 = controller.generateCuts(testShape, 4, 'straight');
      const difficulty8 = controller.generateCuts(testShape, 8, 'straight');

      expect(difficulty1.length).toBeLessThan(difficulty4.length);
      expect(difficulty4.length).toBeLessThan(difficulty8.length);

      // 验证不同难度的日志
      expect(mockConsoleLog).toHaveBeenCalledWith('低难度：尝试生成1条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('中低难度：尝试生成4条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('最高难度：尝试生成14条切割线');
    });

    test('应该支持直线和对角线切割类型', () => {
      const straightCuts = controller.generateCuts(testShape, 2, 'straight');
      const diagonalCuts = controller.generateCuts(testShape, 2, 'diagonal');

      expect(straightCuts.every(cut => cut.type === 'straight')).toBe(true);
      expect(diagonalCuts.every(cut => cut.type === 'diagonal')).toBe(true);
    });

    test('应该处理策略返回null的情况', () => {
      // Mock策略返回null
      const mockStrategy = {
        generateCut: jest.fn().mockReturnValue(null)
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      const cuts = controller.generateCuts(testShape, 1, 'straight');

      expect(cuts).toEqual([]);
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第1条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('最终生成了0个切割线');

      // 恢复mock
      jest.restoreAllMocks();
    });

    test('应该在部分切割线生成失败时提前退出', () => {
      // Mock策略：第一次成功，第二次失败
      let callCount = 0;
      const mockStrategy = {
        generateCut: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { x1: 0, y1: 0, x2: 100, y2: 100, type: 'straight' };
          }
          return null; // 第二次返回null
        })
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      const cuts = controller.generateCuts(testShape, 2, 'straight'); // 尝试生成2条

      expect(cuts.length).toBe(1); // 只成功生成1条
      expect(mockConsoleLog).toHaveBeenCalledWith('成功生成切割线 1');
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第2条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('最终生成了1个切割线');

      // 恢复mock
      jest.restoreAllMocks();
    });
  });

  describe('validateInputs - 输入验证测试', () => {
    test('应该拒绝无效的形状输入', () => {
      expect(() => {
        controller.generateCuts([], 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts([{ x: 0, y: 0 }, { x: 1, y: 1 }], 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts(null as any, 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts(undefined as any, 1, 'straight');
      }).toThrow('形状必须至少包含3个点');
    });

    test('应该拒绝无效的难度级别', () => {
      expect(() => {
        controller.generateCuts(testShape, 0, 'straight');
      }).toThrow('难度级别必须在1-8之间');

      expect(() => {
        controller.generateCuts(testShape, 9, 'straight');
      }).toThrow('难度级别必须在1-8之间');

      expect(() => {
        controller.generateCuts(testShape, -1, 'straight');
      }).toThrow('难度级别必须在1-8之间');

      expect(() => {
        controller.generateCuts(testShape, 100, 'straight');
      }).toThrow('难度级别必须在1-8之间');
    });

    test('应该拒绝无效的切割类型', () => {
      expect(() => {
        controller.generateCuts(testShape, 1, 'invalid' as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");

      expect(() => {
        controller.generateCuts(testShape, 1, 'curved' as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");

      expect(() => {
        controller.generateCuts(testShape, 1, '' as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");

      expect(() => {
        controller.generateCuts(testShape, 1, null as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");
    });
  });

  describe('getDifficultySettings - 难度配置测试', () => {
    test('应该为所有有效难度级别返回正确配置', () => {
      for (let difficulty = 1; difficulty <= 8; difficulty++) {
        expect(() => {
          controller.generateCuts(testShape, difficulty, 'straight');
        }).not.toThrow();
      }
    });

    test('应该为不同难度级别返回不同的配置', () => {
      // 通过日志验证不同难度的配置
      controller.generateCuts(testShape, 1, 'straight');
      expect(mockConsoleLog).toHaveBeenCalledWith('低难度：尝试生成1条切割线');

      controller.generateCuts(testShape, 4, 'straight');
      expect(mockConsoleLog).toHaveBeenCalledWith('中低难度：尝试生成4条切割线');

      controller.generateCuts(testShape, 5, 'straight');
      expect(mockConsoleLog).toHaveBeenCalledWith('中难度：尝试生成6条切割线');

      controller.generateCuts(testShape, 8, 'straight');
      expect(mockConsoleLog).toHaveBeenCalledWith('最高难度：尝试生成14条切割线');
    });

    test('应该为不支持的难度级别抛出错误', () => {
      // 通过直接访问私有方法来测试错误情况
      // 我们需要通过反射或者其他方式来测试这个分支
      
      // 创建一个临时的控制器实例来测试
      const testController = new CutGeneratorController();
      
      // 使用类型断言来访问私有方法
      const privateController = testController as any;
      
      expect(() => {
        privateController.getDifficultySettings(999); // 不存在的难度级别
      }).toThrow('不支持的难度级别: 999');
      
      expect(() => {
        privateController.getDifficultySettings(-999); // 负数难度级别
      }).toThrow('不支持的难度级别: -999');
    });
  });

  describe('generateSingleCut - 单条切割线生成测试', () => {
    test('应该调用策略的generateCut方法', () => {
      const mockCut: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100, type: 'straight' };
      const mockStrategy = {
        generateCut: jest.fn().mockReturnValue(mockCut)
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      const cuts = controller.generateCuts(testShape, 1, 'straight');

      expect(mockStrategy.generateCut).toHaveBeenCalledWith(
        expect.any(Object), // bounds
        expect.any(Array), // existingCuts (may not be empty due to previous cuts)
        testShape,
        'straight'
      );
      expect(cuts).toEqual([mockCut]);

      // 恢复mock
      jest.restoreAllMocks();
    });

    test('应该传递正确的参数给策略', () => {
      const mockStrategy = {
        generateCut: jest.fn().mockReturnValue({ x1: 0, y1: 0, x2: 100, y2: 100, type: 'diagonal' })
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      controller.generateCuts(testShape, 3, 'diagonal');

      // 验证调用次数和基本参数结构
      expect(mockStrategy.generateCut).toHaveBeenCalledTimes(3); // 难度3应该调用3次
      
      // 验证所有调用都有正确的参数结构
      for (let i = 1; i <= 3; i++) {
        expect(mockStrategy.generateCut).toHaveBeenNthCalledWith(i,
          expect.objectContaining({
            minX: 0, maxX: 100, minY: 0, maxY: 100
          }), // bounds
          expect.any(Array), // existingCuts
          testShape,
          'diagonal'
        );
      }

      // 恢复mock
      jest.restoreAllMocks();
    });
  });

  describe('边界情况和错误处理', () => {
    test('应该处理极小形状', () => {
      const tinyShape: Point[] = [
        { x: 0, y: 0 },
        { x: 0.1, y: 0 },
        { x: 0.1, y: 0.1 },
        { x: 0, y: 0.1 }
      ];

      expect(() => {
        const cuts = controller.generateCuts(tinyShape, 1, 'straight');
        expect(cuts.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    test('应该处理极大形状', () => {
      const hugeShape: Point[] = [
        { x: 0, y: 0 },
        { x: 100000, y: 0 },
        { x: 100000, y: 100000 },
        { x: 0, y: 100000 }
      ];

      expect(() => {
        const cuts = controller.generateCuts(hugeShape, 1, 'straight');
        expect(cuts.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    test('应该处理复杂多边形', () => {
      const complexShape: Point[] = [];
      const sides = 12;
      const radius = 100;
      
      // 创建12边形
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        complexShape.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }

      expect(() => {
        const cuts = controller.generateCuts(complexShape, 3, 'diagonal');
        expect(cuts.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    test('应该处理不规则形状', () => {
      const irregularShape: Point[] = [
        { x: -50, y: 25 },
        { x: 75, y: -10 },
        { x: 120, y: 60 },
        { x: 30, y: 80 },
        { x: -20, y: 90 }
      ];

      expect(() => {
        const cuts = controller.generateCuts(irregularShape, 2, 'straight');
        expect(cuts.length).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });

  describe('性能和稳定性测试', () => {
    test('应该在合理时间内完成生成', () => {
      const startTime = Date.now();
      
      for (let difficulty = 1; difficulty <= 8; difficulty++) {
        controller.generateCuts(testShape, difficulty, 'straight');
        controller.generateCuts(testShape, difficulty, 'diagonal');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 所有难度级别应该在1秒内完成
      expect(duration).toBeLessThan(1000);
    });

    test('应该产生一致的结果结构', () => {
      for (let i = 0; i < 10; i++) {
        const cuts = controller.generateCuts(testShape, 2, 'straight');
        
        expect(Array.isArray(cuts)).toBe(true);
        cuts.forEach(cut => {
          expect(cut).toHaveProperty('x1');
          expect(cut).toHaveProperty('y1');
          expect(cut).toHaveProperty('x2');
          expect(cut).toHaveProperty('y2');
          expect(cut).toHaveProperty('type');
          expect(typeof cut.x1).toBe('number');
          expect(typeof cut.y1).toBe('number');
          expect(typeof cut.x2).toBe('number');
          expect(typeof cut.y2).toBe('number');
          expect(['straight', 'diagonal']).toContain(cut.type);
        });
      }
    });

    test('应该处理连续调用', () => {
      const results = [];
      
      for (let i = 0; i < 20; i++) {
        const cuts = controller.generateCuts(testShape, 3, 'diagonal');
        results.push(cuts.length);
      }
      
      // 所有结果都应该有效
      expect(results.every(length => length >= 0)).toBe(true);
      
      // 大部分结果应该成功生成切割线
      const successfulResults = results.filter(length => length > 0);
      expect(successfulResults.length).toBeGreaterThan(results.length * 0.8);
    });
  });

  describe('日志记录测试', () => {
    test('应该记录完整的生成过程', () => {
      controller.generateCuts(testShape, 2, 'straight');

      // 验证开始日志
      expect(mockConsoleLog).toHaveBeenCalledWith('低难度：尝试生成2条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('难度级别: 2, 中心切割概率: 0.75, 目标切割数: 2');
      
      // 验证成功生成日志
      expect(mockConsoleLog).toHaveBeenCalledWith('成功生成切割线 1');
      expect(mockConsoleLog).toHaveBeenCalledWith('成功生成切割线 2');
      
      // 验证结束日志
      expect(mockConsoleLog).toHaveBeenCalledWith('最终生成了2个切割线');
    });

    test('应该在生成失败时记录警告', () => {
      // Mock策略总是返回null
      const mockStrategy = {
        generateCut: jest.fn().mockReturnValue(null)
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      controller.generateCuts(testShape, 3, 'straight');

      // 验证警告日志
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第1条切割线');
      expect(mockConsoleLog).toHaveBeenCalledWith('最终生成了0个切割线');

      // 恢复mock
      jest.restoreAllMocks();
    });
  });

  describe('集成测试', () => {
    test('应该与所有策略正确集成', () => {
      // 测试简单策略 (难度1-3)
      const simpleCuts = controller.generateCuts(testShape, 1, 'straight');
      expect(simpleCuts.length).toBeGreaterThan(0);

      // 测试中等策略 (难度4-6)
      const mediumCuts = controller.generateCuts(testShape, 5, 'diagonal');
      expect(mediumCuts.length).toBeGreaterThan(0);

      // 测试困难策略 (难度7-8)
      const hardCuts = controller.generateCuts(testShape, 8, 'straight');
      expect(hardCuts.length).toBeGreaterThan(0);
    });

    test('应该与几何工具正确集成', () => {
      // Mock几何工具
      const mockCalculateBounds = jest.spyOn(cutGeneratorGeometry, 'calculateBounds')
        .mockReturnValue({ minX: 0, maxX: 100, minY: 0, maxY: 100 });

      controller.generateCuts(testShape, 1, 'straight');

      expect(mockCalculateBounds).toHaveBeenCalledWith(testShape);

      // 恢复mock
      mockCalculateBounds.mockRestore();
    });
  });
});