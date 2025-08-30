/**
 * AngleDisplayModeUpdater 单元测试
 * 测试角度显示模式更新器的所有功能
 */

import {
  updateModeOnCutCountChange,
  createModeUpdateAction,
  shouldClearTemporaryDisplay,
  getTransitionEffect,
  processCutCountChanges,
  createCutCountUpdateActions,
  validateCutCount,
  getCutCountDifficultyLevel,
  AngleDisplayModeUpdaterImpl
} from '../AngleDisplayModeUpdater';
import { GameAction } from '@/types/puzzleTypes';

describe('AngleDisplayModeUpdater', () => {
  describe('updateModeOnCutCountChange 函数测试', () => {
    it('1-3次切割时应该返回 always 模式', () => {
      expect(updateModeOnCutCountChange(1)).toBe('always');
      expect(updateModeOnCutCountChange(2)).toBe('always');
      expect(updateModeOnCutCountChange(3)).toBe('always');
    });

    it('4-8次切割时应该返回 conditional 模式', () => {
      expect(updateModeOnCutCountChange(4)).toBe('conditional');
      expect(updateModeOnCutCountChange(5)).toBe('conditional');
      expect(updateModeOnCutCountChange(6)).toBe('conditional');
      expect(updateModeOnCutCountChange(7)).toBe('conditional');
      expect(updateModeOnCutCountChange(8)).toBe('conditional');
    });

    it('应该正确处理边界值', () => {
      expect(updateModeOnCutCountChange(0)).toBe('always');
      expect(updateModeOnCutCountChange(-1)).toBe('always');
      expect(updateModeOnCutCountChange(100)).toBe('conditional');
    });

    it('应该正确处理异常输入', () => {
      expect(updateModeOnCutCountChange(NaN)).toBe('conditional'); // NaN <= 3 是 false
      expect(updateModeOnCutCountChange(Infinity)).toBe('conditional');
      expect(updateModeOnCutCountChange(-Infinity)).toBe('always');
      expect(updateModeOnCutCountChange(3.5)).toBe('conditional'); // 3.5 > 3
      expect(updateModeOnCutCountChange(2.9)).toBe('always'); // 2.9 <= 3
    });
  });

  describe('createModeUpdateAction 函数测试', () => {
    it('应该创建正确的 GameAction', () => {
      const action = createModeUpdateAction(5);
      expect(action).toEqual({
        type: 'UPDATE_ANGLE_DISPLAY_MODE',
        payload: { cutCount: 5 }
      });
    });

    it('应该为不同的切割次数创建不同的 Action', () => {
      const action1 = createModeUpdateAction(1);
      const action2 = createModeUpdateAction(8);
      
      expect((action1 as any).payload.cutCount).toBe(1);
      expect((action2 as any).payload.cutCount).toBe(8);
      expect(action1.type).toBe(action2.type);
    });

    it('应该正确处理边界值和异常输入', () => {
      expect(() => createModeUpdateAction(0)).not.toThrow();
      expect(() => createModeUpdateAction(-1)).not.toThrow();
      expect(() => createModeUpdateAction(NaN)).not.toThrow();
      expect(() => createModeUpdateAction(Infinity)).not.toThrow();
      
      const nanAction = createModeUpdateAction(NaN);
      expect(nanAction.type).toBe('UPDATE_ANGLE_DISPLAY_MODE');
      expect(Number.isNaN((nanAction as any).payload.cutCount)).toBe(true);
    });
  });

  describe('shouldClearTemporaryDisplay 函数测试', () => {
    it('模式不变时不应该清除临时显示', () => {
      // always -> always
      expect(shouldClearTemporaryDisplay(1, 2)).toBe(false);
      expect(shouldClearTemporaryDisplay(2, 3)).toBe(false);
      
      // conditional -> conditional
      expect(shouldClearTemporaryDisplay(4, 5)).toBe(false);
      expect(shouldClearTemporaryDisplay(7, 8)).toBe(false);
    });

    it('模式改变时应该清除临时显示', () => {
      // always -> conditional
      expect(shouldClearTemporaryDisplay(3, 4)).toBe(true);
      expect(shouldClearTemporaryDisplay(2, 5)).toBe(true);
      expect(shouldClearTemporaryDisplay(1, 8)).toBe(true);
      
      // conditional -> always
      expect(shouldClearTemporaryDisplay(4, 3)).toBe(true);
      expect(shouldClearTemporaryDisplay(5, 2)).toBe(true);
      expect(shouldClearTemporaryDisplay(8, 1)).toBe(true);
    });

    it('应该正确处理边界值', () => {
      expect(shouldClearTemporaryDisplay(3, 4)).toBe(true); // 边界切换
      expect(shouldClearTemporaryDisplay(4, 3)).toBe(true); // 边界切换
      expect(shouldClearTemporaryDisplay(0, 1)).toBe(false); // 都是 always
      expect(shouldClearTemporaryDisplay(100, 200)).toBe(false); // 都是 conditional
    });

    it('应该正确处理异常输入', () => {
      expect(() => shouldClearTemporaryDisplay(NaN, 1)).not.toThrow();
      expect(() => shouldClearTemporaryDisplay(1, NaN)).not.toThrow();
      expect(() => shouldClearTemporaryDisplay(NaN, NaN)).not.toThrow();
      
      // NaN 的比较结果是 false，所以 NaN <= 3 是 false，模式是 conditional
      expect(shouldClearTemporaryDisplay(NaN, 1)).toBe(true); // conditional -> always
      expect(shouldClearTemporaryDisplay(1, NaN)).toBe(true); // always -> conditional
      expect(shouldClearTemporaryDisplay(NaN, NaN)).toBe(false); // conditional -> conditional
    });
  });

  describe('getTransitionEffect 函数测试', () => {
    it('相同模式时应该返回 none', () => {
      expect(getTransitionEffect('always', 'always')).toBe('none');
      expect(getTransitionEffect('conditional', 'conditional')).toBe('none');
    });

    it('从 conditional 到 always 应该返回 show', () => {
      expect(getTransitionEffect('conditional', 'always')).toBe('show');
    });

    it('从 always 到 conditional 应该返回 hide', () => {
      expect(getTransitionEffect('always', 'conditional')).toBe('hide');
    });
  });

  describe('processCutCountChanges 函数测试', () => {
    it('应该正确处理单个变更', () => {
      const changes = [{ oldCount: 3, newCount: 4 }];
      const result = processCutCountChanges(changes);
      
      expect(result.modeChanges).toEqual([
        { oldMode: 'always', newMode: 'conditional' }
      ]);
      expect(result.shouldClearAll).toBe(true);
      expect(result.transitionEffects).toEqual(['hide']);
    });

    it('应该正确处理多个变更', () => {
      const changes = [
        { oldCount: 1, newCount: 2 }, // always -> always
        { oldCount: 4, newCount: 5 }, // conditional -> conditional
        { oldCount: 3, newCount: 4 }  // always -> conditional
      ];
      const result = processCutCountChanges(changes);
      
      expect(result.modeChanges).toEqual([
        { oldMode: 'always', newMode: 'always' },
        { oldMode: 'conditional', newMode: 'conditional' },
        { oldMode: 'always', newMode: 'conditional' }
      ]);
      expect(result.shouldClearAll).toBe(true); // 因为有一个需要清除
      expect(result.transitionEffects).toEqual(['none', 'none', 'hide']);
    });

    it('应该正确处理没有模式变更的情况', () => {
      const changes = [
        { oldCount: 1, newCount: 2 }, // always -> always
        { oldCount: 5, newCount: 6 }  // conditional -> conditional
      ];
      const result = processCutCountChanges(changes);
      
      expect(result.shouldClearAll).toBe(false);
      expect(result.transitionEffects).toEqual(['none', 'none']);
    });

    it('应该正确处理空数组', () => {
      const result = processCutCountChanges([]);
      
      expect(result.modeChanges).toEqual([]);
      expect(result.shouldClearAll).toBe(false);
      expect(result.transitionEffects).toEqual([]);
    });
  });

  describe('createCutCountUpdateActions 函数测试', () => {
    it('应该创建正确的 Action 序列', () => {
      const actions = createCutCountUpdateActions(5);
      
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: 'SET_CUT_COUNT',
        payload: 5
      });
    });

    it('应该为不同的切割次数创建不同的 Action', () => {
      const actions1 = createCutCountUpdateActions(1);
      const actions2 = createCutCountUpdateActions(8);
      
      expect((actions1[0] as any).payload).toBe(1);
      expect((actions2[0] as any).payload).toBe(8);
    });
  });

  describe('validateCutCount 函数测试', () => {
    it('应该验证有效的切割次数', () => {
      expect(validateCutCount(1)).toBe(true);
      expect(validateCutCount(2)).toBe(true);
      expect(validateCutCount(5)).toBe(true);
      expect(validateCutCount(8)).toBe(true);
    });

    it('应该拒绝无效的切割次数', () => {
      expect(validateCutCount(0)).toBe(false);
      expect(validateCutCount(-1)).toBe(false);
      expect(validateCutCount(9)).toBe(false);
      expect(validateCutCount(100)).toBe(false);
    });

    it('应该拒绝非整数', () => {
      expect(validateCutCount(1.5)).toBe(false);
      expect(validateCutCount(3.14)).toBe(false);
      expect(validateCutCount(NaN)).toBe(false);
      expect(validateCutCount(Infinity)).toBe(false);
      expect(validateCutCount(-Infinity)).toBe(false);
    });
  });

  describe('getCutCountDifficultyLevel 函数测试', () => {
    it('应该返回正确的难度级别', () => {
      expect(getCutCountDifficultyLevel(1)).toBe('简单');
      expect(getCutCountDifficultyLevel(2)).toBe('简单');
      
      expect(getCutCountDifficultyLevel(3)).toBe('中等');
      expect(getCutCountDifficultyLevel(4)).toBe('中等');
      
      expect(getCutCountDifficultyLevel(5)).toBe('困难');
      expect(getCutCountDifficultyLevel(6)).toBe('困难');
      
      expect(getCutCountDifficultyLevel(7)).toBe('极难');
      expect(getCutCountDifficultyLevel(8)).toBe('极难');
    });

    it('应该正确处理边界值', () => {
      expect(getCutCountDifficultyLevel(0)).toBe('简单');
      expect(getCutCountDifficultyLevel(-1)).toBe('简单');
      expect(getCutCountDifficultyLevel(100)).toBe('极难');
    });
  });

  describe('AngleDisplayModeUpdaterImpl 接口实现测试', () => {
    it('应该正确实现接口', () => {
      expect(AngleDisplayModeUpdaterImpl).toBeDefined();
      expect(typeof AngleDisplayModeUpdaterImpl.updateModeOnCutCountChange).toBe('function');
      expect(typeof AngleDisplayModeUpdaterImpl.createModeUpdateAction).toBe('function');
      expect(typeof AngleDisplayModeUpdaterImpl.shouldClearTemporaryDisplay).toBe('function');
      expect(typeof AngleDisplayModeUpdaterImpl.getTransitionEffect).toBe('function');
    });

    it('接口方法应该与独立函数返回相同结果', () => {
      expect(AngleDisplayModeUpdaterImpl.updateModeOnCutCountChange(5))
        .toBe(updateModeOnCutCountChange(5));
      
      expect(AngleDisplayModeUpdaterImpl.createModeUpdateAction(3))
        .toEqual(createModeUpdateAction(3));
      
      expect(AngleDisplayModeUpdaterImpl.shouldClearTemporaryDisplay(3, 4))
        .toBe(shouldClearTemporaryDisplay(3, 4));
      
      expect(AngleDisplayModeUpdaterImpl.getTransitionEffect('always', 'conditional'))
        .toBe(getTransitionEffect('always', 'conditional'));
    });

    it('应该正确处理错误输入', () => {
      expect(() => AngleDisplayModeUpdaterImpl.updateModeOnCutCountChange(NaN)).not.toThrow();
      expect(() => AngleDisplayModeUpdaterImpl.createModeUpdateAction(NaN)).not.toThrow();
      expect(() => AngleDisplayModeUpdaterImpl.shouldClearTemporaryDisplay(NaN, 1)).not.toThrow();
      expect(() => AngleDisplayModeUpdaterImpl.getTransitionEffect('always', 'conditional')).not.toThrow();
    });
  });

  describe('集成测试', () => {
    it('应该保持各个方法之间的逻辑一致性', () => {
      const testCases = [
        { oldCount: 1, newCount: 2 },
        { oldCount: 3, newCount: 4 },
        { oldCount: 5, newCount: 3 },
        { oldCount: 8, newCount: 1 },
      ];

      testCases.forEach(({ oldCount, newCount }) => {
        const oldMode = updateModeOnCutCountChange(oldCount);
        const newMode = updateModeOnCutCountChange(newCount);
        const shouldClear = shouldClearTemporaryDisplay(oldCount, newCount);
        const transitionEffect = getTransitionEffect(oldMode, newMode);
        const updateAction = createModeUpdateAction(newCount);

        // 验证逻辑一致性
        if (oldMode === newMode) {
          expect(shouldClear).toBe(false);
          expect(transitionEffect).toBe('none');
        } else {
          expect(shouldClear).toBe(true);
          expect(transitionEffect).not.toBe('none');
        }

        // 验证 Action 创建的一致性
        expect(updateAction.type).toBe('UPDATE_ANGLE_DISPLAY_MODE');
        expect((updateAction as any).payload.cutCount).toBe(newCount);
      });
    });

    it('批量处理应该与单个处理保持一致', () => {
      const changes = [
        { oldCount: 1, newCount: 4 },
        { oldCount: 5, newCount: 2 },
        { oldCount: 3, newCount: 6 }
      ];

      const batchResult = processCutCountChanges(changes);

      changes.forEach((change, index) => {
        const oldMode = updateModeOnCutCountChange(change.oldCount);
        const newMode = updateModeOnCutCountChange(change.newCount);
        const shouldClear = shouldClearTemporaryDisplay(change.oldCount, change.newCount);
        const transitionEffect = getTransitionEffect(oldMode, newMode);

        expect(batchResult.modeChanges[index]).toEqual({ oldMode, newMode });
        expect(batchResult.transitionEffects[index]).toBe(transitionEffect);
      });

      // 验证 shouldClearAll 逻辑
      const anyShouldClear = changes.some(({ oldCount, newCount }) => 
        shouldClearTemporaryDisplay(oldCount, newCount)
      );
      expect(batchResult.shouldClearAll).toBe(anyShouldClear);
    });
  });

  describe('性能测试', () => {
    it('应该在大量调用下保持性能', () => {
      const startTime = performance.now();
      
      // 执行大量调用
      for (let i = 0; i < 10000; i++) {
        updateModeOnCutCountChange(i % 10);
        createModeUpdateAction(i % 8 + 1);
        shouldClearTemporaryDisplay(i % 8 + 1, (i + 1) % 8 + 1);
        getTransitionEffect(i % 2 === 0 ? 'always' : 'conditional', i % 3 === 0 ? 'always' : 'conditional');
        validateCutCount(i % 10);
        getCutCountDifficultyLevel(i % 8 + 1);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 性能应该在合理范围内（100ms内完成10000次调用）
      expect(executionTime).toBeLessThan(100);
    });

    it('批量处理应该高效处理大量数据', () => {
      const largeChanges = Array.from({ length: 1000 }, (_, i) => ({
        oldCount: (i % 8) + 1,
        newCount: ((i + 1) % 8) + 1
      }));

      const startTime = performance.now();
      const result = processCutCountChanges(largeChanges);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.modeChanges).toHaveLength(1000);
      expect(result.transitionEffects).toHaveLength(1000);
      expect(executionTime).toBeLessThan(50); // 50ms内完成1000个变更的处理
    });
  });
});