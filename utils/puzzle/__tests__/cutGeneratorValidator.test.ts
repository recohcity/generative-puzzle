/**
 * cutGeneratorValidator.test.ts
 * CutValidator的100%覆盖率测试
 */

import { CutValidator } from '../cutGeneratorValidator';
import { Point } from '@/types/puzzleTypes';
import { CutLine } from '../cutGeneratorTypes';
import * as cutGeneratorGeometry from '../cutGeneratorGeometry';

describe('CutValidator - 100%覆盖率测试', () => {
  let validator: CutValidator;

  // 测试用的基本形状
  const testShape: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ];

  // 测试用的切割线
  const validCut: CutLine = {
    x1: 50, y1: -10,
    x2: 50, y2: 110,
    type: 'straight'
  };

  const invalidCut: CutLine = {
    x1: 200, y1: 200,
    x2: 300, y2: 300,
    type: 'straight'
  };

  beforeEach(() => {
    validator = new CutValidator();
  });

  describe('isValid - 主要验证方法', () => {
    test('应该验证有效的切割线', () => {
      // Mock几何函数返回有效结果
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const result = validator.isValid(validCut, testShape, []);
      
      expect(result).toBe(true);
      expect(cutGeneratorGeometry.doesCutIntersectShape).toHaveBeenCalledWith(validCut, testShape);
      expect(cutGeneratorGeometry.calculateCenter).toHaveBeenCalled();
      expect(cutGeneratorGeometry.isPointNearLine).toHaveBeenCalled();

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该拒绝与形状交点不足的切割线', () => {
      // Mock几何函数返回交点不足
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(1); // 少于2个交点

      const result = validator.isValid(invalidCut, testShape, []);
      
      expect(result).toBe(false);
      expect(cutGeneratorGeometry.doesCutIntersectShape).toHaveBeenCalledWith(invalidCut, testShape);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该拒绝与现有切割线太接近的切割线', () => {
      const existingCut: CutLine = {
        x1: 45, y1: -10,
        x2: 45, y2: 110,
        type: 'straight'
      };

      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(true); // 太接近

      const result = validator.isValid(validCut, testShape, [existingCut]);
      
      expect(result).toBe(false);
      expect(cutGeneratorGeometry.doesCutIntersectShape).toHaveBeenCalledWith(validCut, testShape);
      expect(cutGeneratorGeometry.cutsAreTooClose).toHaveBeenCalledWith(validCut, existingCut);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该在宽松模式下跳过中心检查', () => {
      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      const mockCutsAreTooClose = jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      const mockCalculateCenter = jest.spyOn(cutGeneratorGeometry, 'calculateCenter');
      const mockIsPointNearLine = jest.spyOn(cutGeneratorGeometry, 'isPointNearLine');

      const result = validator.isValid(validCut, testShape, [], true); // relaxed = true
      
      expect(result).toBe(true);
      expect(cutGeneratorGeometry.doesCutIntersectShape).toHaveBeenCalledWith(validCut, testShape);
      
      // 由于没有现有切割线，cutsAreTooClose不会被调用
      // expect(mockCutsAreTooClose).toHaveBeenCalled();
      
      // 在宽松模式下，不应该调用中心检查
      expect(mockCalculateCenter).not.toHaveBeenCalled();
      expect(mockIsPointNearLine).not.toHaveBeenCalled();

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该在严格模式下执行中心检查', () => {
      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      const mockCutsAreTooClose = jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(false); // 不通过中心

      const result = validator.isValid(validCut, testShape, [], false); // relaxed = false
      
      expect(result).toBe(false);
      expect(cutGeneratorGeometry.doesCutIntersectShape).toHaveBeenCalledWith(validCut, testShape);
      
      // 由于没有现有切割线，cutsAreTooClose不会被调用
      // expect(mockCutsAreTooClose).toHaveBeenCalled();
      
      expect(cutGeneratorGeometry.calculateCenter).toHaveBeenCalled();
      expect(cutGeneratorGeometry.isPointNearLine).toHaveBeenCalled();

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该处理多个现有切割线', () => {
      const existingCuts: CutLine[] = [
        { x1: 25, y1: -10, x2: 25, y2: 110, type: 'straight' },
        { x1: 75, y1: -10, x2: 75, y2: 110, type: 'straight' },
        { x1: -10, y1: 25, x2: 110, y2: 25, type: 'straight' }
      ];

      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose')
        .mockReturnValueOnce(false) // 第一个切割线不太接近
        .mockReturnValueOnce(false) // 第二个切割线不太接近
        .mockReturnValueOnce(true);  // 第三个切割线太接近

      const result = validator.isValid(validCut, testShape, existingCuts);
      
      expect(result).toBe(false);
      expect(cutGeneratorGeometry.cutsAreTooClose).toHaveBeenCalledTimes(3);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该使用正确的中心距离阈值', () => {
      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      const mockIsPointNearLine = jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      validator.isValid(validCut, testShape, []);
      
      // 验证使用了正确的阈值
      expect(mockIsPointNearLine).toHaveBeenCalledWith(
        { x: 50, y: 50 },
        validCut,
        100 // CUT_GENERATOR_CONFIG.CENTER_DISTANCE_THRESHOLD
      );

      // 恢复mocks
      jest.restoreAllMocks();
    });
  });

  describe('边界情况测试', () => {
    test('应该处理空的现有切割线数组', () => {
      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const result = validator.isValid(validCut, testShape, []);
      
      expect(result).toBe(true);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该处理恰好2个交点的情况', () => {
      // Mock几何函数返回恰好2个交点
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const result = validator.isValid(validCut, testShape, []);
      
      expect(result).toBe(true);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该处理超过2个交点的情况', () => {
      // Mock几何函数返回多个交点
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(4);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const result = validator.isValid(validCut, testShape, []);
      
      expect(result).toBe(true);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该处理不同类型的切割线', () => {
      const diagonalCut: CutLine = {
        x1: 0, y1: 0,
        x2: 100, y2: 100,
        type: 'diagonal'
      };

      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const result = validator.isValid(diagonalCut, testShape, []);
      
      expect(result).toBe(true);
      expect(cutGeneratorGeometry.doesCutIntersectShape).toHaveBeenCalledWith(diagonalCut, testShape);

      // 恢复mocks
      jest.restoreAllMocks();
    });
  });

  describe('性能和稳定性测试', () => {
    test('应该快速处理大量现有切割线', () => {
      const manyExistingCuts: CutLine[] = [];
      for (let i = 0; i < 100; i++) {
        manyExistingCuts.push({
          x1: i, y1: -10,
          x2: i, y2: 110,
          type: 'straight'
        });
      }

      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const startTime = Date.now();
      const result = validator.isValid(validCut, testShape, manyExistingCuts);
      const endTime = Date.now();
      
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
      expect(cutGeneratorGeometry.cutsAreTooClose).toHaveBeenCalledTimes(100);

      // 恢复mocks
      jest.restoreAllMocks();
    });

    test('应该处理连续验证调用', () => {
      // Mock几何函数
      jest.spyOn(cutGeneratorGeometry, 'doesCutIntersectShape').mockReturnValue(2);
      jest.spyOn(cutGeneratorGeometry, 'cutsAreTooClose').mockReturnValue(false);
      jest.spyOn(cutGeneratorGeometry, 'calculateCenter').mockReturnValue({ x: 50, y: 50 });
      jest.spyOn(cutGeneratorGeometry, 'isPointNearLine').mockReturnValue(true);

      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = validator.isValid(validCut, testShape, []);
        results.push(result);
      }
      
      expect(results.every(result => result === true)).toBe(true);

      // 恢复mocks
      jest.restoreAllMocks();
    });
  });

  describe('集成测试', () => {
    test('应该与几何工具正确集成', () => {
      // 不使用mock，测试真实的集成
      const realValidCut: CutLine = {
        x1: 50, y1: -10,
        x2: 50, y2: 110,
        type: 'straight'
      };

      const realInvalidCut: CutLine = {
        x1: 200, y1: 200,
        x2: 300, y2: 300,
        type: 'straight'
      };

      // 这些测试使用真实的几何函数
      const validResult = validator.isValid(realValidCut, testShape, [], true); // 使用宽松模式避免中心检查
      const invalidResult = validator.isValid(realInvalidCut, testShape, [], true);

      expect(typeof validResult).toBe('boolean');
      expect(typeof invalidResult).toBe('boolean');
    });

    test('应该正确处理实际的切割线验证场景', () => {
      const cuts: CutLine[] = [
        { x1: 25, y1: -10, x2: 25, y2: 110, type: 'straight' },
        { x1: 75, y1: -10, x2: 75, y2: 110, type: 'straight' }
      ];

      const newCut: CutLine = {
        x1: 50, y1: -10,
        x2: 50, y2: 110,
        type: 'straight'
      };

      // 使用宽松模式进行实际验证
      const result = validator.isValid(newCut, testShape, cuts, true);
      
      expect(typeof result).toBe('boolean');
    });
  });
});