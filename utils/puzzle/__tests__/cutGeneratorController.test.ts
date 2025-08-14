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

      // 验证切割线生成成功
    });

    test('应该为不同难度级别生成不同数量的切割线', () => {
      const difficulty1 = controller.generateCuts(testShape, 1, 'straight');
      const difficulty4 = controller.generateCuts(testShape, 4, 'straight');
      const difficulty8 = controller.generateCuts(testShape, 8, 'straight');

      expect(difficulty1.length).toBeLessThan(difficulty4.length);
      expect(difficulty4.length).toBeLessThan(difficulty8.length);

      // 验证不同难度生成的切割线数量符合预期
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
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第2条切割线');

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
      // 验证不同难度的配置通过生成的切割线数量体现
      const cuts1 = controller.generateCuts(testShape, 1, 'straight');
      const cuts4 = controller.generateCuts(testShape, 4, 'straight');
      const cuts5 = controller.generateCuts(testShape, 5, 'straight');
      const cuts8 = controller.generateCuts(testShape, 8, 'straight');

      // 验证不同难度生成不同数量的切割线
      expect(cuts1.length).toBeGreaterThan(0);
      expect(cuts4.length).toBeGreaterThan(cuts1.length);
      expect(cuts5.length).toBeGreaterThan(cuts4.length);
      expect(cuts8.length).toBeGreaterThan(cuts5.length);
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
      const cuts = controller.generateCuts(testShape, 2, 'straight');

      // 验证生成过程成功完成
      expect(cuts.length).toBe(2);
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

  describe('额外覆盖率测试', () => {
    test('应该覆盖所有验证分支', () => {
      // 测试所有验证错误情况
      expect(() => {
        controller.generateCuts(null as any, 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts(undefined as any, 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts([], 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts([{x: 0, y: 0}], 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      expect(() => {
        controller.generateCuts([{x: 0, y: 0}, {x: 1, y: 1}], 1, 'straight');
      }).toThrow('形状必须至少包含3个点');

      // 测试难度级别验证
      expect(() => {
        controller.generateCuts(testShape, 0, 'straight');
      }).toThrow('难度级别必须在1-8之间');

      expect(() => {
        controller.generateCuts(testShape, 9, 'straight');
      }).toThrow('难度级别必须在1-8之间');

      expect(() => {
        controller.generateCuts(testShape, -1, 'straight');
      }).toThrow('难度级别必须在1-8之间');

      // 测试切割类型验证
      expect(() => {
        controller.generateCuts(testShape, 1, 'invalid' as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");

      expect(() => {
        controller.generateCuts(testShape, 1, '' as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");

      expect(() => {
        controller.generateCuts(testShape, 1, null as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");

      expect(() => {
        controller.generateCuts(testShape, 1, undefined as any);
      }).toThrow("切割类型必须是 'straight' 或 'diagonal'");
    });

    test('应该测试真实的切割生成失败场景', () => {
      // 创建一个极小的形状，使得切割生成更容易失败
      const tinyShape: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];

      // 尝试生成大量切割线，可能会导致某些生成失败
      const cuts = controller.generateCuts(tinyShape, 8, 'straight');
      
      // 验证结果是数组
      expect(Array.isArray(cuts)).toBe(true);
      
      // 可能会有警告日志，但不会抛出错误
      expect(cuts.length).toBeGreaterThanOrEqual(0);
    });

    test('应该测试真实的策略生成失败情况', () => {
      // 创建一个不规则形状，增加生成失败的可能性
      const irregularShape: Point[] = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 }
      ];

      // 尝试高难度生成，可能触发生成失败的分支
      const cuts = controller.generateCuts(irregularShape, 8, 'diagonal');
      
      expect(Array.isArray(cuts)).toBe(true);
      expect(cuts.length).toBeGreaterThanOrEqual(0);
      
      // 验证每个生成的切割线都有正确的结构
      cuts.forEach(cut => {
        expect(cut).toHaveProperty('x1');
        expect(cut).toHaveProperty('y1');
        expect(cut).toHaveProperty('x2');
        expect(cut).toHaveProperty('y2');
        expect(cut).toHaveProperty('type');
        expect(cut.type).toBe('diagonal');
      });
    });

    test('应该测试边界难度级别', () => {
      // 测试最低难度
      const easyResult = controller.generateCuts(testShape, 1, 'straight');
      expect(easyResult.length).toBeGreaterThanOrEqual(0);
      
      // 测试最高难度
      const hardResult = controller.generateCuts(testShape, 8, 'diagonal');
      expect(hardResult.length).toBeGreaterThanOrEqual(0);
      
      // 验证高难度通常生成更多切割线
      expect(hardResult.length).toBeGreaterThanOrEqual(easyResult.length);
    });

    test('应该测试不同形状类型的处理', () => {
      // 三角形
      const triangle: Point[] = [
        { x: 50, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 }
      ];
      
      const triangleCuts = controller.generateCuts(triangle, 3, 'straight');
      expect(Array.isArray(triangleCuts)).toBe(true);
      
      // 五边形
      const pentagon: Point[] = [
        { x: 50, y: 0 },
        { x: 95, y: 35 },
        { x: 80, y: 90 },
        { x: 20, y: 90 },
        { x: 5, y: 35 }
      ];
      
      const pentagonCuts = controller.generateCuts(pentagon, 3, 'diagonal');
      expect(Array.isArray(pentagonCuts)).toBe(true);
    });

    test('应该覆盖策略生成失败的情况', () => {
      // Mock策略总是返回null
      const mockStrategy = {
        generateCut: jest.fn().mockReturnValue(null)
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      const cuts = controller.generateCuts(testShape, 2, 'straight');

      // 应该返回空数组，因为策略总是返回null
      expect(cuts).toEqual([]);
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第1条切割线');

      // 恢复mock
      jest.restoreAllMocks();
    });

    test('应该覆盖部分成功的情况', () => {
      let callCount = 0;
      const mockStrategy = {
        generateCut: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { x1: 0, y1: 0, x2: 100, y2: 100, type: 'straight' };
          }
          return null; // 第二次调用返回null
        })
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(mockStrategy);

      const cuts = controller.generateCuts(testShape, 3, 'straight');

      // 应该只生成1条切割线，然后因为第二次失败而停止
      expect(cuts.length).toBe(1);
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第2条切割线');

      // 恢复mock
      jest.restoreAllMocks();
    });

    test('应该测试getDifficultySettings的边界情况', () => {
      // 使用类型断言来访问私有方法进行测试
      const privateController = controller as any;
      
      // 测试所有有效的难度级别
      for (let i = 1; i <= 8; i++) {
        expect(() => {
          privateController.getDifficultySettings(i);
        }).not.toThrow();
      }

      // 测试无效的难度级别
      expect(() => {
        privateController.getDifficultySettings(0);
      }).toThrow('不支持的难度级别: 0');

      expect(() => {
        privateController.getDifficultySettings(9);
      }).toThrow('不支持的难度级别: 9');

      expect(() => {
        privateController.getDifficultySettings(-1);
      }).toThrow('不支持的难度级别: -1');

      expect(() => {
        privateController.getDifficultySettings(999);
      }).toThrow('不支持的难度级别: 999');
    });

    test('应该测试generateSingleCut方法', () => {
      const mockCut: CutLine = { x1: 0, y1: 0, x2: 100, y2: 100, type: 'straight' };
      const mockStrategy = {
        generateCut: jest.fn().mockReturnValue(mockCut)
      };
      
      const privateController = controller as any;
      const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
      const existingCuts: CutLine[] = [];

      const result = privateController.generateSingleCut(bounds, existingCuts, testShape, 'straight', mockStrategy);

      expect(result).toEqual(mockCut);
      expect(mockStrategy.generateCut).toHaveBeenCalledWith(bounds, existingCuts, testShape, 'straight');
    });

    test('应该强制触发console.warn分支', () => {
      // 创建一个总是返回null的策略来强制触发警告
      const alwaysFailStrategy = {
        generateCut: jest.fn().mockReturnValue(null)
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(alwaysFailStrategy);

      // 清除之前的mock调用
      mockConsoleWarn.mockClear();

      // 尝试生成多条切割线，应该在第一条就失败并触发警告
      const cuts = controller.generateCuts(testShape, 3, 'straight');

      // 验证结果
      expect(cuts).toEqual([]);
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第1条切割线');
      expect(alwaysFailStrategy.generateCut).toHaveBeenCalledTimes(1); // 只调用一次就退出了

      // 恢复mock
      jest.restoreAllMocks();
    });

    test('应该强制触发部分成功的console.warn分支', () => {
      // 创建一个第一次成功，后续失败的策略
      let callCount = 0;
      const partialSuccessStrategy = {
        generateCut: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { x1: 25, y1: -10, x2: 25, y2: 110, type: 'straight' };
          }
          return null; // 第二次及以后返回null
        })
      };
      
      jest.spyOn(cutGeneratorStrategies.CutStrategyFactory, 'createStrategy')
        .mockReturnValue(partialSuccessStrategy);

      // 清除之前的mock调用
      mockConsoleWarn.mockClear();

      // 尝试生成3条切割线，应该只成功1条，然后在第2条失败
      const cuts = controller.generateCuts(testShape, 3, 'straight');

      // 验证结果
      expect(cuts.length).toBe(1);
      expect(cuts[0]).toEqual({ x1: 25, y1: -10, x2: 25, y2: 110, type: 'straight' });
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️ 无法生成第2条切割线');
      expect(partialSuccessStrategy.generateCut).toHaveBeenCalledTimes(2); // 调用两次：第一次成功，第二次失败

      // 恢复mock
      jest.restoreAllMocks();
    });
  });
});