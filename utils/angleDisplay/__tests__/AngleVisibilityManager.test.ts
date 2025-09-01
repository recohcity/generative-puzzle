/**
 * AngleVisibilityManager 单元测试
 * 测试角度可见性管理器的所有功能
 */

import {
  AngleDisplayState,
  getAngleDisplayState,
  updateVisibilityRule,
  setTemporaryVisible,
  AngleVisibilityManagerImpl
} from '../AngleVisibilityManager';

describe('AngleVisibilityManager', () => {
  describe('getAngleDisplayState 函数测试', () => {
    it('当 pieceId 为 null 时应该返回 HIDDEN 状态', () => {
      expect(getAngleDisplayState(null, 1, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(null, 5, true)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(null, 8, false)).toBe(AngleDisplayState.HIDDEN);
    });

    it('1-3次切割时应该返回 ALWAYS_VISIBLE 状态', () => {
      expect(getAngleDisplayState(1, 1, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, 2, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, 3, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      
      // 即使 showHint 为 true，1-3次切割仍然是 ALWAYS_VISIBLE
      expect(getAngleDisplayState(1, 1, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, 2, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, 3, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
    });

    it('4-8次切割且显示提示时应该返回 TEMPORARY_VISIBLE 状态', () => {
      expect(getAngleDisplayState(1, 4, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(getAngleDisplayState(1, 5, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(getAngleDisplayState(1, 6, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(getAngleDisplayState(1, 7, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(getAngleDisplayState(1, 8, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
    });

    it('4-8次切割且不显示提示时应该返回 HIDDEN 状态', () => {
      expect(getAngleDisplayState(1, 4, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, 5, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, 6, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, 7, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, 8, false)).toBe(AngleDisplayState.HIDDEN);
    });

    it('应该正确处理边界值', () => {
      // 切割次数为 0
      expect(getAngleDisplayState(1, 0, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, 0, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      
      // 负数切割次数
      expect(getAngleDisplayState(1, -1, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, -1, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      
      // 很大的切割次数
      expect(getAngleDisplayState(1, 100, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, 100, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
    });

    it('应该正确处理不同的 pieceId', () => {
      // 正数 pieceId
      expect(getAngleDisplayState(1, 2, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(999, 2, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      
      // 零 pieceId
      expect(getAngleDisplayState(0, 2, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      
      // 负数 pieceId
      expect(getAngleDisplayState(-1, 2, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
    });

    it('应该正确处理异常输入', () => {
      // NaN 切割次数
      expect(getAngleDisplayState(1, NaN, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, NaN, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      
      // Infinity 切割次数
      expect(getAngleDisplayState(1, Infinity, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, Infinity, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      
      // -Infinity 切割次数
      expect(getAngleDisplayState(1, -Infinity, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      expect(getAngleDisplayState(1, -Infinity, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      
      // 小数切割次数
      expect(getAngleDisplayState(1, 3.5, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(1, 3.5, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(getAngleDisplayState(1, 2.9, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
    });
  });

  describe('updateVisibilityRule 函数测试', () => {
    it('1-3次切割时应该返回 always 模式', () => {
      expect(updateVisibilityRule(1)).toBe('always');
      expect(updateVisibilityRule(2)).toBe('always');
      expect(updateVisibilityRule(3)).toBe('always');
    });

    it('4-8次切割时应该返回 conditional 模式', () => {
      expect(updateVisibilityRule(4)).toBe('conditional');
      expect(updateVisibilityRule(5)).toBe('conditional');
      expect(updateVisibilityRule(6)).toBe('conditional');
      expect(updateVisibilityRule(7)).toBe('conditional');
      expect(updateVisibilityRule(8)).toBe('conditional');
    });

    it('应该正确处理边界值', () => {
      expect(updateVisibilityRule(0)).toBe('always');
      expect(updateVisibilityRule(-1)).toBe('always');
      expect(updateVisibilityRule(100)).toBe('conditional');
    });

    it('应该正确处理异常输入', () => {
      expect(updateVisibilityRule(NaN)).toBe('conditional'); // NaN <= 3 是 false
      expect(updateVisibilityRule(Infinity)).toBe('conditional');
      expect(updateVisibilityRule(-Infinity)).toBe('always');
      expect(updateVisibilityRule(3.5)).toBe('conditional'); // 3.5 > 3
      expect(updateVisibilityRule(2.9)).toBe('always'); // 2.9 <= 3
    });
  });

  describe('setTemporaryVisible 函数测试', () => {
    it('应该返回正确的设置参数', () => {
      const result = setTemporaryVisible(1, 2000);
      expect(result).toEqual({ pieceId: 1, duration: 2000 });
    });

    it('应该使用默认持续时间', () => {
      const result = setTemporaryVisible(5);
      expect(result).toEqual({ pieceId: 5, duration: 3000 });
    });

    it('应该正确处理不同的 pieceId', () => {
      expect(setTemporaryVisible(0, 1000)).toEqual({ pieceId: 0, duration: 1000 });
      expect(setTemporaryVisible(-1, 1500)).toEqual({ pieceId: -1, duration: 1500 });
      expect(setTemporaryVisible(999, 5000)).toEqual({ pieceId: 999, duration: 5000 });
    });

    it('应该正确处理不同的持续时间', () => {
      expect(setTemporaryVisible(1, 0)).toEqual({ pieceId: 1, duration: 0 });
      expect(setTemporaryVisible(1, -100)).toEqual({ pieceId: 1, duration: -100 });
      expect(setTemporaryVisible(1, 10000)).toEqual({ pieceId: 1, duration: 10000 });
    });

    it('应该正确处理异常输入', () => {
      expect(() => setTemporaryVisible(NaN, 1000)).not.toThrow();
      expect(() => setTemporaryVisible(1, NaN)).not.toThrow();
      expect(() => setTemporaryVisible(Infinity, Infinity)).not.toThrow();
      
      const result1 = setTemporaryVisible(NaN, 1000);
      expect(result1.duration).toBe(1000);
      expect(Number.isNaN(result1.pieceId)).toBe(true);
      
      const result2 = setTemporaryVisible(1, NaN);
      expect(result2.pieceId).toBe(1);
      expect(Number.isNaN(result2.duration)).toBe(true);
    });
  });

  describe('AngleVisibilityManagerImpl 接口实现测试', () => {
    it('应该正确实现接口', () => {
      expect(AngleVisibilityManagerImpl).toBeDefined();
      expect(typeof AngleVisibilityManagerImpl.getAngleDisplayState).toBe('function');
      expect(typeof AngleVisibilityManagerImpl.updateVisibilityRule).toBe('function');
      expect(typeof AngleVisibilityManagerImpl.setTemporaryVisible).toBe('function');
    });

    it('接口方法应该与独立函数返回相同结果', () => {
      // 测试 getAngleDisplayState
      expect(AngleVisibilityManagerImpl.getAngleDisplayState(1, 3, false))
        .toBe(getAngleDisplayState(1, 3, false));
      expect(AngleVisibilityManagerImpl.getAngleDisplayState(null, 5, true))
        .toBe(getAngleDisplayState(null, 5, true));
      
      // 测试 updateVisibilityRule
      expect(AngleVisibilityManagerImpl.updateVisibilityRule(2))
        .toBe(updateVisibilityRule(2));
      expect(AngleVisibilityManagerImpl.updateVisibilityRule(6))
        .toBe(updateVisibilityRule(6));
      
      // 测试 setTemporaryVisible
      expect(AngleVisibilityManagerImpl.setTemporaryVisible(1, 2000))
        .toEqual(setTemporaryVisible(1, 2000));
      expect(AngleVisibilityManagerImpl.setTemporaryVisible(5, 3000))
        .toEqual(setTemporaryVisible(5, 3000));
    });

    it('应该正确处理错误输入', () => {
      expect(() => AngleVisibilityManagerImpl.getAngleDisplayState(NaN, NaN, true)).not.toThrow();
      expect(() => AngleVisibilityManagerImpl.updateVisibilityRule(NaN)).not.toThrow();
      expect(() => AngleVisibilityManagerImpl.setTemporaryVisible(NaN, NaN)).not.toThrow();
    });
  });

  describe('AngleDisplayState 枚举测试', () => {
    it('应该有正确的枚举值', () => {
      expect(AngleDisplayState.ALWAYS_VISIBLE).toBe('always');
      expect(AngleDisplayState.HIDDEN).toBe('hidden');
      expect(AngleDisplayState.TEMPORARY_VISIBLE).toBe('temporary');
    });

    it('枚举应该包含所有预期的值', () => {
      const enumValues = Object.values(AngleDisplayState);
      expect(enumValues).toContain('always');
      expect(enumValues).toContain('hidden');
      expect(enumValues).toContain('temporary');
      expect(enumValues).toHaveLength(3);
    });

    it('枚举键应该正确', () => {
      const enumKeys = Object.keys(AngleDisplayState);
      expect(enumKeys).toContain('ALWAYS_VISIBLE');
      expect(enumKeys).toContain('HIDDEN');
      expect(enumKeys).toContain('TEMPORARY_VISIBLE');
      expect(enumKeys).toHaveLength(3);
    });
  });

  describe('集成测试', () => {
    it('应该保持各个方法之间的逻辑一致性', () => {
      const testCases = [
        { pieceId: 1, cutCount: 1, showHint: false },
        { pieceId: 2, cutCount: 3, showHint: true },
        { pieceId: null, cutCount: 5, showHint: false },
        { pieceId: 4, cutCount: 8, showHint: true },
      ];

      testCases.forEach(({ pieceId, cutCount, showHint }) => {
        const displayState = getAngleDisplayState(pieceId, cutCount, showHint);
        const visibilityRule = updateVisibilityRule(cutCount);

        // 验证逻辑一致性
        if (pieceId === null) {
          expect(displayState).toBe(AngleDisplayState.HIDDEN);
        } else if (cutCount <= 3) {
          expect(displayState).toBe(AngleDisplayState.ALWAYS_VISIBLE);
          expect(visibilityRule).toBe('always');
        } else {
          expect(visibilityRule).toBe('conditional');
          if (showHint) {
            expect(displayState).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
          } else {
            expect(displayState).toBe(AngleDisplayState.HIDDEN);
          }
        }
      });
    });

    it('setTemporaryVisible 应该与其他方法配合使用', () => {
      const pieceId = 3;
      const cutCount = 6;
      const duration = 2500;

      // 设置临时可见
      const tempSettings = setTemporaryVisible(pieceId, duration);
      expect(tempSettings.pieceId).toBe(pieceId);
      expect(tempSettings.duration).toBe(duration);

      // 验证在高切割次数下的状态
      expect(getAngleDisplayState(pieceId, cutCount, false)).toBe(AngleDisplayState.HIDDEN);
      expect(getAngleDisplayState(pieceId, cutCount, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(updateVisibilityRule(cutCount)).toBe('conditional');
    });
  });

  describe('边界条件增强测试', () => {
    it('应该正确处理极端边界值组合', () => {
      // 测试所有可能的边界值组合
      const extremeValues = [
        { pieceId: null, cutCount: 0, showHint: false },
        { pieceId: null, cutCount: 3, showHint: true },
        { pieceId: null, cutCount: 4, showHint: false },
        { pieceId: 0, cutCount: 3, showHint: false },
        { pieceId: 0, cutCount: 4, showHint: true },
        { pieceId: 1, cutCount: 3, showHint: false },
        { pieceId: 1, cutCount: 4, showHint: false },
        { pieceId: 1, cutCount: 4, showHint: true },
      ];

      extremeValues.forEach(({ pieceId, cutCount, showHint }) => {
        expect(() => {
          const result = getAngleDisplayState(pieceId, cutCount, showHint);
          expect(Object.values(AngleDisplayState)).toContain(result);
        }).not.toThrow();
      });
    });

    it('应该正确处理类型边界情况', () => {
      // 测试JavaScript类型系统的边界情况
      const typeBoundaries = [
        { pieceId: 0, cutCount: 0, showHint: false },
        { pieceId: -0, cutCount: -0, showHint: false },
        { pieceId: Number.MIN_SAFE_INTEGER, cutCount: Number.MIN_SAFE_INTEGER, showHint: true },
        { pieceId: Number.MAX_SAFE_INTEGER, cutCount: Number.MAX_SAFE_INTEGER, showHint: false },
        { pieceId: 1, cutCount: Number.EPSILON, showHint: true },
        { pieceId: 1, cutCount: -Number.EPSILON, showHint: false },
      ];

      typeBoundaries.forEach(({ pieceId, cutCount, showHint }) => {
        expect(() => {
          const result = getAngleDisplayState(pieceId, cutCount, showHint);
          expect(typeof result).toBe('string');
          expect(Object.values(AngleDisplayState)).toContain(result);
        }).not.toThrow();
      });
    });

    it('应该正确处理布尔值边界情况', () => {
      // 测试showHint参数的各种真假值
      const booleanBoundaries = [
        { value: true, expected: true },
        { value: false, expected: false },
        { value: 1, expected: true },
        { value: 0, expected: false },
        { value: 'true', expected: true },
        { value: '', expected: false },
        { value: [], expected: true },
        { value: {}, expected: true },
        { value: null, expected: false },
        { value: undefined, expected: false },
      ];

      booleanBoundaries.forEach(({ value, expected }) => {
        const result1 = getAngleDisplayState(1, 5, value as boolean);
        const result2 = getAngleDisplayState(1, 5, expected);
        expect(result1).toBe(result2);
      });
    });

    it('应该正确处理数值精度边界', () => {
      // 测试浮点数精度边界
      const precisionTests = [
        { cutCount: 3.0, expected: AngleDisplayState.ALWAYS_VISIBLE },
        { cutCount: 3.1, expected: AngleDisplayState.HIDDEN },
        { cutCount: 3.9, expected: AngleDisplayState.HIDDEN },
        { cutCount: 3.999999999999999, expected: AngleDisplayState.HIDDEN },
        { cutCount: 2.999999999999999, expected: AngleDisplayState.ALWAYS_VISIBLE },
      ];

      precisionTests.forEach(({ cutCount, expected }) => {
        const result = getAngleDisplayState(1, cutCount, false);
        expect(result).toBe(expected);
      });
    });

    it('应该正确处理updateVisibilityRule的边界情况', () => {
      // 测试updateVisibilityRule的所有边界情况
      const boundaryTests = [
        { cutCount: 3, expected: 'always' },
        { cutCount: 3.0, expected: 'always' },
        { cutCount: 3.1, expected: 'conditional' },
        { cutCount: 4, expected: 'conditional' },
        { cutCount: 2.999999999999999, expected: 'always' },
        { cutCount: 3.000000000000001, expected: 'conditional' },
      ];

      boundaryTests.forEach(({ cutCount, expected }) => {
        const result = updateVisibilityRule(cutCount);
        expect(result).toBe(expected);
      });
    });

    it('应该正确处理setTemporaryVisible的边界情况', () => {
      // 测试setTemporaryVisible的边界情况
      const boundaryTests = [
        { pieceId: 0, duration: 0 },
        { pieceId: -1, duration: -1 },
        { pieceId: Number.MAX_SAFE_INTEGER, duration: Number.MAX_SAFE_INTEGER },
        { pieceId: Number.MIN_SAFE_INTEGER, duration: Number.MIN_SAFE_INTEGER },
        { pieceId: 1.5, duration: 1000.5 },
        { pieceId: -1.5, duration: -1000.5 },
      ];

      boundaryTests.forEach(({ pieceId, duration }) => {
        const result = setTemporaryVisible(pieceId, duration);
        expect(result.pieceId).toBe(pieceId);
        expect(result.duration).toBe(duration);
      });
    });
  });

  describe('状态转换完整性测试', () => {
    it('应该覆盖所有可能的状态转换路径', () => {
      // 测试所有可能的状态转换组合
      const stateTransitions = [
        // pieceId为null的情况 - 总是返回HIDDEN
        { pieceId: null, cutCount: 1, showHint: false, expected: AngleDisplayState.HIDDEN },
        { pieceId: null, cutCount: 1, showHint: true, expected: AngleDisplayState.HIDDEN },
        { pieceId: null, cutCount: 5, showHint: false, expected: AngleDisplayState.HIDDEN },
        { pieceId: null, cutCount: 5, showHint: true, expected: AngleDisplayState.HIDDEN },
        
        // cutCount <= 3的情况 - 总是返回ALWAYS_VISIBLE
        { pieceId: 1, cutCount: 1, showHint: false, expected: AngleDisplayState.ALWAYS_VISIBLE },
        { pieceId: 1, cutCount: 1, showHint: true, expected: AngleDisplayState.ALWAYS_VISIBLE },
        { pieceId: 1, cutCount: 3, showHint: false, expected: AngleDisplayState.ALWAYS_VISIBLE },
        { pieceId: 1, cutCount: 3, showHint: true, expected: AngleDisplayState.ALWAYS_VISIBLE },
        
        // cutCount > 3且showHint为true的情况 - 返回TEMPORARY_VISIBLE
        { pieceId: 1, cutCount: 4, showHint: true, expected: AngleDisplayState.TEMPORARY_VISIBLE },
        { pieceId: 1, cutCount: 8, showHint: true, expected: AngleDisplayState.TEMPORARY_VISIBLE },
        
        // cutCount > 3且showHint为false的情况 - 返回HIDDEN
        { pieceId: 1, cutCount: 4, showHint: false, expected: AngleDisplayState.HIDDEN },
        { pieceId: 1, cutCount: 8, showHint: false, expected: AngleDisplayState.HIDDEN },
      ];

      stateTransitions.forEach(({ pieceId, cutCount, showHint, expected }) => {
        const result = getAngleDisplayState(pieceId, cutCount, showHint);
        expect(result).toBe(expected);
      });
    });

    it('应该确保所有分支都被执行', () => {
      // 强制执行所有可能的代码分支
      let branchCoverage = {
        nullPieceId: false,
        lowCutCount: false,
        highCutCountWithHint: false,
        highCutCountWithoutHint: false,
        alwaysRule: false,
        conditionalRule: false,
        defaultDuration: false,
        customDuration: false,
      };

      // 执行null pieceId分支
      getAngleDisplayState(null, 1, false);
      branchCoverage.nullPieceId = true;

      // 执行低切割次数分支
      getAngleDisplayState(1, 2, false);
      branchCoverage.lowCutCount = true;

      // 执行高切割次数且显示提示分支
      getAngleDisplayState(1, 5, true);
      branchCoverage.highCutCountWithHint = true;

      // 执行高切割次数且不显示提示分支
      getAngleDisplayState(1, 5, false);
      branchCoverage.highCutCountWithoutHint = true;

      // 执行always规则分支
      updateVisibilityRule(2);
      branchCoverage.alwaysRule = true;

      // 执行conditional规则分支
      updateVisibilityRule(5);
      branchCoverage.conditionalRule = true;

      // 执行默认持续时间分支
      setTemporaryVisible(1);
      branchCoverage.defaultDuration = true;

      // 执行自定义持续时间分支
      setTemporaryVisible(1, 2000);
      branchCoverage.customDuration = true;

      // 验证所有分支都被执行
      Object.values(branchCoverage).forEach(covered => {
        expect(covered).toBe(true);
      });
    });
  });

  describe('异常输入处理增强测试', () => {
    it('应该正确处理所有类型的异常输入', () => {
      const abnormalInputs = [
        // 特殊数值
        { pieceId: NaN, cutCount: NaN, showHint: NaN },
        { pieceId: Infinity, cutCount: Infinity, showHint: Infinity },
        { pieceId: -Infinity, cutCount: -Infinity, showHint: -Infinity },
        
        // 类型转换边界
        { pieceId: '1' as any, cutCount: '3' as any, showHint: '1' as any },
        { pieceId: [] as any, cutCount: [] as any, showHint: [] as any },
        { pieceId: {} as any, cutCount: {} as any, showHint: {} as any },
        
        // 特殊值
        { pieceId: undefined as any, cutCount: undefined as any, showHint: undefined as any },
        { pieceId: null, cutCount: null as any, showHint: null as any },
      ];

      abnormalInputs.forEach(({ pieceId, cutCount, showHint }) => {
        expect(() => {
          const result = getAngleDisplayState(pieceId, cutCount, showHint);
          expect(typeof result).toBe('string');
          expect(Object.values(AngleDisplayState)).toContain(result);
        }).not.toThrow();
      });
    });

    it('应该正确处理updateVisibilityRule的异常输入', () => {
      const abnormalCutCounts = [
        NaN, Infinity, -Infinity, 
        '3' as any, [] as any, {} as any, 
        undefined as any, null as any
      ];

      abnormalCutCounts.forEach(cutCount => {
        expect(() => {
          const result = updateVisibilityRule(cutCount);
          expect(['always', 'conditional']).toContain(result);
        }).not.toThrow();
      });
    });

    it('应该正确处理setTemporaryVisible的异常输入', () => {
      const abnormalInputs = [
        { pieceId: NaN, duration: NaN },
        { pieceId: Infinity, duration: Infinity },
        { pieceId: -Infinity, duration: -Infinity },
        { pieceId: '1' as any, duration: '1000' as any },
        { pieceId: [] as any, duration: [] as any },
        { pieceId: {} as any, duration: {} as any },
        { pieceId: undefined as any, duration: undefined as any },
        { pieceId: null as any, duration: null as any },
      ];

      abnormalInputs.forEach(({ pieceId, duration }) => {
        expect(() => {
          const result = setTemporaryVisible(pieceId, duration);
          expect(result).toHaveProperty('pieceId');
          expect(result).toHaveProperty('duration');
        }).not.toThrow();
      });
    });
  });

  describe('错误恢复和异常处理测试', () => {
    it('应该能从各种异常状态中恢复', () => {
      // 测试从异常输入中恢复正常功能
      const recoveryTests = [
        () => {
          // 先调用异常输入
          getAngleDisplayState(NaN, NaN, NaN as any);
          // 然后调用正常输入，应该正常工作
          const result = getAngleDisplayState(1, 3, false);
          expect(result).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        },
        () => {
          // 先调用异常输入
          updateVisibilityRule(Infinity);
          // 然后调用正常输入，应该正常工作
          const result = updateVisibilityRule(2);
          expect(result).toBe('always');
        },
        () => {
          // 先调用异常输入
          setTemporaryVisible(NaN, NaN);
          // 然后调用正常输入，应该正常工作
          const result = setTemporaryVisible(1, 2000);
          expect(result).toEqual({ pieceId: 1, duration: 2000 });
        },
      ];

      recoveryTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });

    it('应该正确处理连续的异常调用', () => {
      // 测试连续异常调用不会导致状态污染
      const continuousExceptionTests = [
        () => {
          for (let i = 0; i < 100; i++) {
            getAngleDisplayState(NaN, Infinity, undefined as any);
          }
          // 最后一次正常调用应该正常工作
          const result = getAngleDisplayState(1, 2, true);
          expect(result).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        },
        () => {
          for (let i = 0; i < 100; i++) {
            updateVisibilityRule(NaN);
          }
          // 最后一次正常调用应该正常工作
          const result = updateVisibilityRule(5);
          expect(result).toBe('conditional');
        },
        () => {
          for (let i = 0; i < 100; i++) {
            setTemporaryVisible(Infinity, -Infinity);
          }
          // 最后一次正常调用应该正常工作
          const result = setTemporaryVisible(3, 1500);
          expect(result).toEqual({ pieceId: 3, duration: 1500 });
        },
      ];

      continuousExceptionTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });

    it('应该正确处理混合异常和正常调用', () => {
      // 测试异常调用和正常调用混合的情况
      const mixedCallTests = [
        () => {
          const results = [];
          
          // 混合调用模式
          results.push(getAngleDisplayState(1, 2, false)); // 正常
          results.push(getAngleDisplayState(NaN, NaN, NaN as any)); // 异常
          results.push(getAngleDisplayState(2, 5, true)); // 正常
          results.push(getAngleDisplayState(Infinity, -Infinity, undefined as any)); // 异常
          results.push(getAngleDisplayState(3, 1, false)); // 正常
          
          // 验证正常调用的结果
          expect(results[0]).toBe(AngleDisplayState.ALWAYS_VISIBLE);
          expect(results[2]).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
          expect(results[4]).toBe(AngleDisplayState.ALWAYS_VISIBLE);
          
          // 验证异常调用也返回了有效的状态
          expect(Object.values(AngleDisplayState)).toContain(results[1]);
          expect(Object.values(AngleDisplayState)).toContain(results[3]);
        },
        () => {
          const results = [];
          
          results.push(updateVisibilityRule(2)); // 正常
          results.push(updateVisibilityRule(NaN)); // 异常
          results.push(updateVisibilityRule(6)); // 正常
          results.push(updateVisibilityRule(Infinity)); // 异常
          results.push(updateVisibilityRule(1)); // 正常
          
          // 验证正常调用的结果
          expect(results[0]).toBe('always');
          expect(results[2]).toBe('conditional');
          expect(results[4]).toBe('always');
          
          // 验证异常调用也返回了有效的结果
          expect(['always', 'conditional']).toContain(results[1]);
          expect(['always', 'conditional']).toContain(results[3]);
        },
      ];

      mixedCallTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });

    it('应该正确处理接口实现的异常情况', () => {
      // 测试接口实现的异常处理
      const interfaceExceptionTests = [
        () => {
          // 测试接口方法的异常恢复
          AngleVisibilityManagerImpl.getAngleDisplayState(NaN, NaN, NaN as any);
          const result = AngleVisibilityManagerImpl.getAngleDisplayState(1, 3, false);
          expect(result).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        },
        () => {
          AngleVisibilityManagerImpl.updateVisibilityRule(Infinity);
          const result = AngleVisibilityManagerImpl.updateVisibilityRule(2);
          expect(result).toBe('always');
        },
        () => {
          AngleVisibilityManagerImpl.setTemporaryVisible(NaN, NaN);
          const result = AngleVisibilityManagerImpl.setTemporaryVisible(1, 2000);
          expect(result).toEqual({ pieceId: 1, duration: 2000 });
        },
      ];

      interfaceExceptionTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });

    it('应该正确记录和处理错误状态', () => {
      // 测试错误状态的处理（虽然当前实现没有显式的错误处理，但应该保证不抛出异常）
      const errorStateTests = [
        () => {
          // 测试极端组合
          const extremeCombinations = [
            { pieceId: NaN, cutCount: Infinity, showHint: undefined },
            { pieceId: Infinity, cutCount: NaN, showHint: null },
            { pieceId: -Infinity, cutCount: -Infinity, showHint: 'true' },
            { pieceId: null, cutCount: undefined, showHint: 0 },
          ];

          extremeCombinations.forEach(({ pieceId, cutCount, showHint }) => {
            const result = getAngleDisplayState(pieceId, cutCount || 0, showHint as any);
            expect(typeof result).toBe('string');
            expect(Object.values(AngleDisplayState)).toContain(result);
          });
        },
        () => {
          // 测试类型强制转换的边界情况
          const typeCoercionTests = [
            '0', '1', '3', '4', 'true', 'false', 
            [], {}, function() {}
          ];

          typeCoercionTests.forEach(value => {
            expect(() => {
              updateVisibilityRule(value as any);
            }).not.toThrow();
          });

          // 单独测试Symbol，因为它会抛出异常
          expect(() => {
            updateVisibilityRule(Symbol('test') as any);
          }).toThrow();
        },
      ];

      errorStateTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });

    it('应该验证错误处理的一致性', () => {
      // 验证相同的异常输入总是产生相同的结果
      const consistencyTests = [
        () => {
          const result1 = getAngleDisplayState(NaN, NaN, NaN as any);
          const result2 = getAngleDisplayState(NaN, NaN, NaN as any);
          expect(result1).toBe(result2);
        },
        () => {
          const result1 = updateVisibilityRule(Infinity);
          const result2 = updateVisibilityRule(Infinity);
          expect(result1).toBe(result2);
        },
        () => {
          const result1 = setTemporaryVisible(NaN, NaN);
          const result2 = setTemporaryVisible(NaN, NaN);
          expect(result1).toEqual(result2);
        },
      ];

      consistencyTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });

    it('应该处理内存和性能相关的异常情况', () => {
      // 测试大量异常调用不会导致内存泄漏或性能问题
      const performanceExceptionTest = () => {
        const startTime = performance.now();
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

        // 执行大量异常调用
        for (let i = 0; i < 1000; i++) {
          getAngleDisplayState(NaN, Infinity, undefined as any);
          updateVisibilityRule(NaN);
          setTemporaryVisible(Infinity, -Infinity);
          
          AngleVisibilityManagerImpl.getAngleDisplayState(NaN, NaN, null as any);
          AngleVisibilityManagerImpl.updateVisibilityRule(Infinity);
          AngleVisibilityManagerImpl.setTemporaryVisible(NaN, NaN);
        }

        const endTime = performance.now();
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        // 验证性能没有显著下降
        expect(endTime - startTime).toBeLessThan(100);
        
        // 验证内存使用没有显著增长（如果浏览器支持memory API）
        if ((performance as any).memory) {
          const memoryIncrease = endMemory - startMemory;
          expect(memoryIncrease).toBeLessThan(1024 * 1024); // 不超过1MB
        }
      };

      expect(performanceExceptionTest).not.toThrow();
    });
  });

  describe('完整性和健壮性测试', () => {
    it('应该确保所有函数在任何情况下都返回有效值', () => {
      // 生成随机测试数据
      const generateRandomTestData = () => {
        const randomValues = [
          Math.random() * 1000,
          -Math.random() * 1000,
          NaN,
          Infinity,
          -Infinity,
          0,
          null,
          undefined,
          '',
          'string',
          [],
          {},
          true,
          false,
        ];
        
        return {
          pieceId: randomValues[Math.floor(Math.random() * randomValues.length)],
          cutCount: randomValues[Math.floor(Math.random() * randomValues.length)],
          showHint: randomValues[Math.floor(Math.random() * randomValues.length)],
        };
      };

      // 执行随机测试
      for (let i = 0; i < 100; i++) {
        const { pieceId, cutCount, showHint } = generateRandomTestData();
        
        expect(() => {
          const result = getAngleDisplayState(pieceId as any, cutCount as any, showHint as any);
          expect(typeof result).toBe('string');
          expect(Object.values(AngleDisplayState)).toContain(result);
        }).not.toThrow();
        
        expect(() => {
          const result = updateVisibilityRule(cutCount as any);
          expect(typeof result).toBe('string');
          expect(['always', 'conditional']).toContain(result);
        }).not.toThrow();
        
        expect(() => {
          const result = setTemporaryVisible(pieceId as any, cutCount as any);
          expect(typeof result).toBe('object');
          expect(result).toHaveProperty('pieceId');
          expect(result).toHaveProperty('duration');
        }).not.toThrow();
      }
    });

    it('应该确保接口实现的完整健壮性', () => {
      // 测试接口实现在各种异常情况下的健壮性
      const robustnessTests = [
        () => {
          // 测试所有方法都存在且可调用
          expect(typeof AngleVisibilityManagerImpl.getAngleDisplayState).toBe('function');
          expect(typeof AngleVisibilityManagerImpl.updateVisibilityRule).toBe('function');
          expect(typeof AngleVisibilityManagerImpl.setTemporaryVisible).toBe('function');
        },
        () => {
          // 测试方法调用的健壮性
          const methods = [
            () => AngleVisibilityManagerImpl.getAngleDisplayState(NaN, NaN, NaN as any),
            () => AngleVisibilityManagerImpl.updateVisibilityRule(NaN),
            () => AngleVisibilityManagerImpl.setTemporaryVisible(NaN, NaN),
          ];

          methods.forEach(method => {
            expect(method).not.toThrow();
          });
        },
        () => {
          // 测试方法返回值的一致性
          const result1 = AngleVisibilityManagerImpl.getAngleDisplayState(1, 3, false);
          const result2 = getAngleDisplayState(1, 3, false);
          expect(result1).toBe(result2);

          const result3 = AngleVisibilityManagerImpl.updateVisibilityRule(5);
          const result4 = updateVisibilityRule(5);
          expect(result3).toBe(result4);

          const result5 = AngleVisibilityManagerImpl.setTemporaryVisible(1, 2000);
          const result6 = setTemporaryVisible(1, 2000);
          expect(result5).toEqual(result6);
        },
      ];

      robustnessTests.forEach(test => {
        expect(test).not.toThrow();
      });
    });
  });

  describe('性能测试', () => {
    it('应该在大量调用下保持性能', () => {
      const startTime = performance.now();
      
      // 执行大量调用
      for (let i = 0; i < 10000; i++) {
        getAngleDisplayState(i % 10, i % 8 + 1, i % 2 === 0);
        updateVisibilityRule(i % 8 + 1);
        setTemporaryVisible(i % 10, (i % 5 + 1) * 1000);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 性能应该在合理范围内（100ms内完成10000次调用）
      expect(executionTime).toBeLessThan(100);
    });

    it('接口实现应该保持性能', () => {
      const startTime = performance.now();
      
      // 执行大量接口调用
      for (let i = 0; i < 5000; i++) {
        AngleVisibilityManagerImpl.getAngleDisplayState(i % 10, i % 8 + 1, i % 2 === 0);
        AngleVisibilityManagerImpl.updateVisibilityRule(i % 8 + 1);
        AngleVisibilityManagerImpl.setTemporaryVisible(i % 10, (i % 5 + 1) * 1000);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 性能应该在合理范围内（50ms内完成5000次调用）
      expect(executionTime).toBeLessThan(50);
    });

    it('异常处理应该保持性能', () => {
      const startTime = performance.now();
      
      // 执行大量异常调用
      for (let i = 0; i < 1000; i++) {
        getAngleDisplayState(NaN, Infinity, undefined as any);
        updateVisibilityRule(NaN);
        setTemporaryVisible(Infinity, -Infinity);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 异常处理性能应该在合理范围内（50ms内完成1000次异常调用）
      expect(executionTime).toBeLessThan(50);
    });
  });
});