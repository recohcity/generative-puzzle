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
  });
});