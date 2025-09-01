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

    it('应该测试所有可能的分支组合', () => {
      // 测试所有可能的模式转换组合
      const allTransitions = [
        { oldCount: 1, newCount: 1 }, // always -> always (same)
        { oldCount: 1, newCount: 4 }, // always -> conditional
        { oldCount: 4, newCount: 1 }, // conditional -> always
        { oldCount: 4, newCount: 8 }, // conditional -> conditional (same)
      ];
      
      const result = processCutCountChanges(allTransitions);
      
      expect(result.modeChanges).toEqual([
        { oldMode: 'always', newMode: 'always' },
        { oldMode: 'always', newMode: 'conditional' },
        { oldMode: 'conditional', newMode: 'always' },
        { oldMode: 'conditional', newMode: 'conditional' }
      ]);
      
      expect(result.transitionEffects).toEqual(['none', 'hide', 'show', 'none']);
      expect(result.shouldClearAll).toBe(true); // 因为有模式变更
    });

    it('应该正确处理边界值和异常输入', () => {
      const edgeCases = [
        { oldCount: 0, newCount: 1 },
        { oldCount: 3, newCount: 4 }, // 关键边界
        { oldCount: NaN, newCount: 1 },
        { oldCount: Infinity, newCount: -Infinity }
      ];
      
      expect(() => processCutCountChanges(edgeCases)).not.toThrow();
      const result = processCutCountChanges(edgeCases);
      
      expect(result.modeChanges).toHaveLength(4);
      expect(result.transitionEffects).toHaveLength(4);
      expect(typeof result.shouldClearAll).toBe('boolean');
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

    it('应该确保实现对象的所有属性都被访问', () => {
      // 确保对象的每个属性都被测试覆盖
      const impl = AngleDisplayModeUpdaterImpl;
      
      // 测试所有方法的存在性和类型
      expect(impl.updateModeOnCutCountChange).toBe(updateModeOnCutCountChange);
      expect(impl.createModeUpdateAction).toBe(createModeUpdateAction);
      expect(impl.shouldClearTemporaryDisplay).toBe(shouldClearTemporaryDisplay);
      expect(impl.getTransitionEffect).toBe(getTransitionEffect);
      
      // 验证对象结构完整性
      const expectedKeys = ['updateModeOnCutCountChange', 'createModeUpdateAction', 'shouldClearTemporaryDisplay', 'getTransitionEffect'];
      const actualKeys = Object.keys(impl);
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });

    it('应该测试实现对象的所有方法调用', () => {
      // 通过实现对象调用所有方法，确保覆盖率
      const testCases = [
        { cutCount: 1, expected: 'always' },
        { cutCount: 4, expected: 'conditional' },
        { cutCount: 8, expected: 'conditional' }
      ];

      testCases.forEach(({ cutCount, expected }) => {
        // 通过实现对象调用方法
        const result = AngleDisplayModeUpdaterImpl.updateModeOnCutCountChange(cutCount);
        expect(result).toBe(expected);
        
        const action = AngleDisplayModeUpdaterImpl.createModeUpdateAction(cutCount);
        expect(action.type).toBe('UPDATE_ANGLE_DISPLAY_MODE');
        expect((action as any).payload.cutCount).toBe(cutCount);
      });

      // 测试其他方法
      expect(AngleDisplayModeUpdaterImpl.shouldClearTemporaryDisplay(3, 4)).toBe(true);
      expect(AngleDisplayModeUpdaterImpl.shouldClearTemporaryDisplay(1, 2)).toBe(false);
      
      expect(AngleDisplayModeUpdaterImpl.getTransitionEffect('always', 'conditional')).toBe('hide');
      expect(AngleDisplayModeUpdaterImpl.getTransitionEffect('conditional', 'always')).toBe('show');
      expect(AngleDisplayModeUpdaterImpl.getTransitionEffect('always', 'always')).toBe('none');
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

  describe('边界条件和分支覆盖增强测试', () => {
    it('应该覆盖getTransitionEffect的所有分支路径', () => {
      // 测试所有正常的分支
      expect(getTransitionEffect('always', 'always')).toBe('none');
      expect(getTransitionEffect('conditional', 'conditional')).toBe('none');
      expect(getTransitionEffect('conditional', 'always')).toBe('show');
      expect(getTransitionEffect('always', 'conditional')).toBe('hide');

      // 尝试触发理论上不可达的分支（通过类型断言）
      // 虽然TypeScript类型系统限制了输入，但在运行时可能存在其他值
      const invalidMode1 = 'invalid' as 'always' | 'conditional';
      const invalidMode2 = 'unknown' as 'always' | 'conditional';
      
      // 这些调用应该触发最后的return 'none'分支
      expect(getTransitionEffect(invalidMode1, 'always')).toBe('none');
      expect(getTransitionEffect('always', invalidMode2)).toBe('none');
      expect(getTransitionEffect(invalidMode1, invalidMode2)).toBe('none');
    });

    it('应该测试所有可能的模式组合边界情况', () => {
      // 测试所有可能的模式组合
      const modes: ('always' | 'conditional')[] = ['always', 'conditional'];
      const allCombinations: Array<{
        oldMode: 'always' | 'conditional';
        newMode: 'always' | 'conditional';
        expected: 'none' | 'show' | 'hide';
      }> = [
        { oldMode: 'always', newMode: 'always', expected: 'none' },
        { oldMode: 'always', newMode: 'conditional', expected: 'hide' },
        { oldMode: 'conditional', newMode: 'always', expected: 'show' },
        { oldMode: 'conditional', newMode: 'conditional', expected: 'none' },
      ];

      allCombinations.forEach(({ oldMode, newMode, expected }) => {
        const result = getTransitionEffect(oldMode, newMode);
        expect(result).toBe(expected);
      });
    });

    it('应该测试updateModeOnCutCountChange的所有边界分支', () => {
      // 测试边界值周围的所有情况
      const boundaryTests = [
        { cutCount: 3, expected: 'always' },
        { cutCount: 3.0, expected: 'always' },
        { cutCount: 3.000000000000001, expected: 'conditional' },
        { cutCount: 2.999999999999999, expected: 'always' },
        { cutCount: 4, expected: 'conditional' },
        { cutCount: 4.0, expected: 'conditional' },
      ];

      boundaryTests.forEach(({ cutCount, expected }) => {
        const result = updateModeOnCutCountChange(cutCount);
        expect(result).toBe(expected);
      });
    });

    it('应该测试shouldClearTemporaryDisplay的所有分支组合', () => {
      // 测试所有可能导致模式变化的边界组合
      const transitionTests = [
        // 跨越边界的变化
        { oldCount: 3, newCount: 4, shouldClear: true },
        { oldCount: 4, newCount: 3, shouldClear: true },
        
        // 不跨越边界的变化
        { oldCount: 2, newCount: 3, shouldClear: false },
        { oldCount: 3, newCount: 2, shouldClear: false },
        { oldCount: 4, newCount: 5, shouldClear: false },
        { oldCount: 5, newCount: 4, shouldClear: false },
        
        // 相同值
        { oldCount: 3, newCount: 3, shouldClear: false },
        { oldCount: 4, newCount: 4, shouldClear: false },
        
        // 极端值
        { oldCount: 0, newCount: 100, shouldClear: true }, // always -> conditional
        { oldCount: -100, newCount: 100, shouldClear: true }, // always -> conditional
        { oldCount: 100, newCount: 0, shouldClear: true }, // conditional -> always
      ];

      transitionTests.forEach(({ oldCount, newCount, shouldClear }) => {
        const result = shouldClearTemporaryDisplay(oldCount, newCount);
        expect(result).toBe(shouldClear);
      });
    });

    it('应该测试processCutCountChanges的所有分支路径', () => {
      // 测试空数组的分支
      const emptyResult = processCutCountChanges([]);
      expect(emptyResult.modeChanges).toEqual([]);
      expect(emptyResult.shouldClearAll).toBe(false);
      expect(emptyResult.transitionEffects).toEqual([]);

      // 测试单个元素的分支
      const singleResult = processCutCountChanges([{ oldCount: 3, newCount: 4 }]);
      expect(singleResult.modeChanges).toHaveLength(1);
      expect(singleResult.shouldClearAll).toBe(true);
      expect(singleResult.transitionEffects).toHaveLength(1);

      // 测试多个元素但无需清除的分支
      const noClearResult = processCutCountChanges([
        { oldCount: 1, newCount: 2 }, // always -> always
        { oldCount: 5, newCount: 6 }  // conditional -> conditional
      ]);
      expect(noClearResult.shouldClearAll).toBe(false);

      // 测试多个元素且需要清除的分支
      const needClearResult = processCutCountChanges([
        { oldCount: 1, newCount: 2 }, // always -> always
        { oldCount: 3, newCount: 4 }  // always -> conditional (需要清除)
      ]);
      expect(needClearResult.shouldClearAll).toBe(true);
    });

    it('应该测试validateCutCount的所有分支路径', () => {
      // 测试所有可能的分支
      const validationTests = [
        // 有效范围内的整数
        { cutCount: 1, expected: true },
        { cutCount: 8, expected: true },
        { cutCount: 5, expected: true },
        
        // 边界值
        { cutCount: 0, expected: false }, // < 1
        { cutCount: 9, expected: false }, // > 8
        
        // 非整数
        { cutCount: 1.5, expected: false },
        { cutCount: 7.9, expected: false },
        
        // 特殊数值
        { cutCount: NaN, expected: false },
        { cutCount: Infinity, expected: false },
        { cutCount: -Infinity, expected: false },
        
        // 负数
        { cutCount: -1, expected: false },
        { cutCount: -5, expected: false },
      ];

      validationTests.forEach(({ cutCount, expected }) => {
        const result = validateCutCount(cutCount);
        expect(result).toBe(expected);
      });
    });

    it('应该测试getCutCountDifficultyLevel的所有分支路径', () => {
      // 测试所有难度级别的分支
      const difficultyTests = [
        // 简单 (<=2)
        { cutCount: 1, expected: '简单' },
        { cutCount: 2, expected: '简单' },
        { cutCount: 0, expected: '简单' },
        { cutCount: -1, expected: '简单' },
        
        // 中等 (3-4)
        { cutCount: 3, expected: '中等' },
        { cutCount: 4, expected: '中等' },
        
        // 困难 (5-6)
        { cutCount: 5, expected: '困难' },
        { cutCount: 6, expected: '困难' },
        
        // 极难 (>=7)
        { cutCount: 7, expected: '极难' },
        { cutCount: 8, expected: '极难' },
        { cutCount: 100, expected: '极难' },
        { cutCount: Infinity, expected: '极难' },
      ];

      difficultyTests.forEach(({ cutCount, expected }) => {
        const result = getCutCountDifficultyLevel(cutCount);
        expect(result).toBe(expected);
      });
    });

    it('应该测试createCutCountUpdateActions的所有分支', () => {
      // 测试不同输入值的分支
      const actionTests = [1, 2, 5, 8, 0, -1, 100, NaN, Infinity];
      
      actionTests.forEach(cutCount => {
        const actions = createCutCountUpdateActions(cutCount);
        expect(actions).toHaveLength(1);
        expect(actions[0].type).toBe('SET_CUT_COUNT');
        expect((actions[0] as any).payload).toBe(cutCount);
      });
    });

    it('应该测试createModeUpdateAction的所有分支', () => {
      // 测试不同输入值的分支
      const actionTests = [1, 2, 5, 8, 0, -1, 100, NaN, Infinity];
      
      actionTests.forEach(cutCount => {
        const action = createModeUpdateAction(cutCount);
        expect(action.type).toBe('UPDATE_ANGLE_DISPLAY_MODE');
        expect((action as any).payload.cutCount).toBe(cutCount);
      });
    });
  });

  describe('异常输入和错误处理分支测试', () => {
    it('应该处理getTransitionEffect的异常输入', () => {
      // 测试undefined和null输入
      expect(() => {
        getTransitionEffect(undefined as any, 'always');
      }).not.toThrow();
      
      expect(() => {
        getTransitionEffect('always', null as any);
      }).not.toThrow();
      
      expect(() => {
        getTransitionEffect(null as any, undefined as any);
      }).not.toThrow();

      // 测试空字符串和其他类型
      expect(() => {
        getTransitionEffect('' as any, 'always');
      }).not.toThrow();
      
      expect(() => {
        getTransitionEffect('always', 123 as any);
      }).not.toThrow();
    });

    it('应该处理所有函数的异常输入组合', () => {
      const abnormalInputs = [NaN, Infinity, -Infinity, null, undefined, '', 'string', [], {}, true, false];
      
      abnormalInputs.forEach(input => {
        // 测试所有函数都能处理异常输入
        expect(() => updateModeOnCutCountChange(input as any)).not.toThrow();
        expect(() => createModeUpdateAction(input as any)).not.toThrow();
        expect(() => validateCutCount(input as any)).not.toThrow();
        expect(() => getCutCountDifficultyLevel(input as any)).not.toThrow();
        expect(() => createCutCountUpdateActions(input as any)).not.toThrow();
        
        // 测试双参数函数
        expect(() => shouldClearTemporaryDisplay(input as any, 1)).not.toThrow();
        expect(() => shouldClearTemporaryDisplay(1, input as any)).not.toThrow();
        expect(() => shouldClearTemporaryDisplay(input as any, input as any)).not.toThrow();
        
        expect(() => getTransitionEffect(input as any, 'always')).not.toThrow();
        expect(() => getTransitionEffect('always', input as any)).not.toThrow();
        expect(() => getTransitionEffect(input as any, input as any)).not.toThrow();
      });
    });

    it('应该处理processCutCountChanges的异常输入', () => {
      // 测试包含异常值的数组
      const abnormalChanges = [
        { oldCount: NaN, newCount: 1 },
        { oldCount: 1, newCount: NaN },
        { oldCount: Infinity, newCount: -Infinity },
        { oldCount: null as any, newCount: undefined as any },
        { oldCount: 'string' as any, newCount: [] as any },
      ];

      expect(() => {
        const result = processCutCountChanges(abnormalChanges);
        expect(result.modeChanges).toHaveLength(abnormalChanges.length);
        expect(result.transitionEffects).toHaveLength(abnormalChanges.length);
        expect(typeof result.shouldClearAll).toBe('boolean');
      }).not.toThrow();

      // 测试null和undefined数组
      expect(() => processCutCountChanges(null as any)).toThrow();
      expect(() => processCutCountChanges(undefined as any)).toThrow();
    });
  });

  describe('接口实现完整性分支测试', () => {
    it('应该确保AngleDisplayModeUpdaterImpl的所有分支都被覆盖', () => {
      const impl = AngleDisplayModeUpdaterImpl;
      
      // 测试所有方法的所有分支
      const testCases = [
        { oldMode: 'always' as const, newMode: 'always' as const },
        { oldMode: 'always' as const, newMode: 'conditional' as const },
        { oldMode: 'conditional' as const, newMode: 'always' as const },
        { oldMode: 'conditional' as const, newMode: 'conditional' as const },
      ];

      testCases.forEach(({ oldMode, newMode }) => {
        // 通过接口调用所有方法
        expect(() => {
          impl.updateModeOnCutCountChange(1);
          impl.updateModeOnCutCountChange(5);
          impl.createModeUpdateAction(3);
          impl.shouldClearTemporaryDisplay(3, 4);
          impl.shouldClearTemporaryDisplay(1, 2);
          impl.getTransitionEffect(oldMode, newMode);
        }).not.toThrow();
      });

      // 测试接口方法的异常输入处理
      expect(() => {
        impl.updateModeOnCutCountChange(NaN);
        impl.createModeUpdateAction(Infinity);
        impl.shouldClearTemporaryDisplay(null as any, undefined as any);
        impl.getTransitionEffect('invalid' as any, 'unknown' as any);
      }).not.toThrow();
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

    it('边界条件测试应该保持性能', () => {
      const startTime = performance.now();
      
      // 执行大量边界条件测试
      for (let i = 0; i < 1000; i++) {
        getTransitionEffect('invalid' as any, 'unknown' as any);
        updateModeOnCutCountChange(NaN);
        shouldClearTemporaryDisplay(Infinity, -Infinity);
        validateCutCount(undefined as any);
        getCutCountDifficultyLevel(null as any);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 边界条件测试性能应该在合理范围内
      expect(executionTime).toBeLessThan(50);
    });
  });
});