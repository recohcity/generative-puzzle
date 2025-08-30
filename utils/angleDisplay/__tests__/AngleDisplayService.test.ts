/**
 * AngleDisplayService 单元测试
 * 测试角度显示服务的所有核心功能
 */

import { angleDisplayService, AngleDisplayService } from '../AngleDisplayService';
import { AngleDisplayState } from '../AngleVisibilityManager';

describe('AngleDisplayService', () => {
  let service: AngleDisplayService;

  beforeEach(() => {
    service = angleDisplayService;
  });

  describe('核心显示逻辑测试', () => {
    describe('shouldShowAngle', () => {
      it('当 pieceId 为 null 时应该返回 false', () => {
        expect(service.shouldShowAngle(1, null, false)).toBe(false);
        expect(service.shouldShowAngle(5, null, true)).toBe(false);
      });

      it('1-3次切割时应该始终显示角度', () => {
        expect(service.shouldShowAngle(1, 1, false)).toBe(true);
        expect(service.shouldShowAngle(2, 1, false)).toBe(true);
        expect(service.shouldShowAngle(3, 1, false)).toBe(true);
        expect(service.shouldShowAngle(1, 1, true)).toBe(true);
        expect(service.shouldShowAngle(2, 1, true)).toBe(true);
        expect(service.shouldShowAngle(3, 1, true)).toBe(true);
      });

      it('4-8次切割时只有在显示提示时才显示角度', () => {
        expect(service.shouldShowAngle(4, 1, false)).toBe(false);
        expect(service.shouldShowAngle(5, 1, false)).toBe(false);
        expect(service.shouldShowAngle(6, 1, false)).toBe(false);
        expect(service.shouldShowAngle(7, 1, false)).toBe(false);
        expect(service.shouldShowAngle(8, 1, false)).toBe(false);

        expect(service.shouldShowAngle(4, 1, true)).toBe(true);
        expect(service.shouldShowAngle(5, 1, true)).toBe(true);
        expect(service.shouldShowAngle(6, 1, true)).toBe(true);
        expect(service.shouldShowAngle(7, 1, true)).toBe(true);
        expect(service.shouldShowAngle(8, 1, true)).toBe(true);
      });
    });

    describe('getDisplayMode', () => {
      it('1-3次切割时应该返回 always 模式', () => {
        expect(service.getDisplayMode(1)).toBe('always');
        expect(service.getDisplayMode(2)).toBe('always');
        expect(service.getDisplayMode(3)).toBe('always');
      });

      it('4-8次切割时应该返回 conditional 模式', () => {
        expect(service.getDisplayMode(4)).toBe('conditional');
        expect(service.getDisplayMode(5)).toBe('conditional');
        expect(service.getDisplayMode(6)).toBe('conditional');
        expect(service.getDisplayMode(7)).toBe('conditional');
        expect(service.getDisplayMode(8)).toBe('conditional');
      });
    });

    describe('getDisplayState', () => {
      it('当 pieceId 为 null 时应该返回 HIDDEN 状态', () => {
        expect(service.getDisplayState(null, 1, false)).toBe(AngleDisplayState.HIDDEN);
        expect(service.getDisplayState(null, 5, true)).toBe(AngleDisplayState.HIDDEN);
      });

      it('1-3次切割时应该返回 ALWAYS_VISIBLE 状态', () => {
        expect(service.getDisplayState(1, 1, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.getDisplayState(1, 2, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.getDisplayState(1, 3, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.getDisplayState(1, 1, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.getDisplayState(1, 2, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.getDisplayState(1, 3, true)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
      });

      it('4-8次切割且显示提示时应该返回 TEMPORARY_VISIBLE 状态', () => {
        expect(service.getDisplayState(1, 4, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
        expect(service.getDisplayState(1, 5, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
        expect(service.getDisplayState(1, 6, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
        expect(service.getDisplayState(1, 7, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
        expect(service.getDisplayState(1, 8, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      });

      it('4-8次切割且不显示提示时应该返回 HIDDEN 状态', () => {
        expect(service.getDisplayState(1, 4, false)).toBe(AngleDisplayState.HIDDEN);
        expect(service.getDisplayState(1, 5, false)).toBe(AngleDisplayState.HIDDEN);
        expect(service.getDisplayState(1, 6, false)).toBe(AngleDisplayState.HIDDEN);
        expect(service.getDisplayState(1, 7, false)).toBe(AngleDisplayState.HIDDEN);
        expect(service.getDisplayState(1, 8, false)).toBe(AngleDisplayState.HIDDEN);
      });
    });
  });

  describe('提示功能集成测试', () => {
    describe('activateHintDisplay', () => {
      it('1-3次切割时不需要激活提示显示', () => {
        expect(service.activateHintDisplay(1, 1)).toEqual({ shouldActivate: false });
        expect(service.activateHintDisplay(1, 2)).toEqual({ shouldActivate: false });
        expect(service.activateHintDisplay(1, 3)).toEqual({ shouldActivate: false });
      });

      it('4-8次切割时需要激活提示显示', () => {
        expect(service.activateHintDisplay(1, 4)).toEqual({ shouldActivate: true });
        expect(service.activateHintDisplay(1, 5)).toEqual({ shouldActivate: true });
        expect(service.activateHintDisplay(1, 6)).toEqual({ shouldActivate: true });
        expect(service.activateHintDisplay(1, 7)).toEqual({ shouldActivate: true });
        expect(service.activateHintDisplay(1, 8)).toEqual({ shouldActivate: true });
      });
    });

    describe('needsHintEnhancement', () => {
      it('1-3次切割时不需要提示增强', () => {
        expect(service.needsHintEnhancement(1)).toBe(false);
        expect(service.needsHintEnhancement(2)).toBe(false);
        expect(service.needsHintEnhancement(3)).toBe(false);
      });

      it('4-8次切割时需要提示增强', () => {
        expect(service.needsHintEnhancement(4)).toBe(true);
        expect(service.needsHintEnhancement(5)).toBe(true);
        expect(service.needsHintEnhancement(6)).toBe(true);
        expect(service.needsHintEnhancement(7)).toBe(true);
        expect(service.needsHintEnhancement(8)).toBe(true);
      });
    });
  });

  describe('状态检查测试', () => {
    describe('isTemporaryDisplay', () => {
      it('1-3次切割时不是临时显示', () => {
        expect(service.isTemporaryDisplay(1, false)).toBe(false);
        expect(service.isTemporaryDisplay(2, false)).toBe(false);
        expect(service.isTemporaryDisplay(3, false)).toBe(false);
        expect(service.isTemporaryDisplay(1, true)).toBe(false);
        expect(service.isTemporaryDisplay(2, true)).toBe(false);
        expect(service.isTemporaryDisplay(3, true)).toBe(false);
      });

      it('4-8次切割且不显示提示时不是临时显示', () => {
        expect(service.isTemporaryDisplay(4, false)).toBe(false);
        expect(service.isTemporaryDisplay(5, false)).toBe(false);
        expect(service.isTemporaryDisplay(6, false)).toBe(false);
        expect(service.isTemporaryDisplay(7, false)).toBe(false);
        expect(service.isTemporaryDisplay(8, false)).toBe(false);
      });

      it('4-8次切割且显示提示时是临时显示', () => {
        expect(service.isTemporaryDisplay(4, true)).toBe(true);
        expect(service.isTemporaryDisplay(5, true)).toBe(true);
        expect(service.isTemporaryDisplay(6, true)).toBe(true);
        expect(service.isTemporaryDisplay(7, true)).toBe(true);
        expect(service.isTemporaryDisplay(8, true)).toBe(true);
      });
    });
  });

  describe('边界值和异常情况测试', () => {
    describe('边界值测试', () => {
      it('应该正确处理切割次数为 0 的情况', () => {
        expect(service.shouldShowAngle(0, 1, false)).toBe(true);
        expect(service.getDisplayMode(0)).toBe('always');
        expect(service.getDisplayState(1, 0, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.needsHintEnhancement(0)).toBe(false);
        expect(service.isTemporaryDisplay(0, false)).toBe(false);
      });

      it('应该正确处理切割次数为负数的情况', () => {
        expect(service.shouldShowAngle(-1, 1, false)).toBe(true);
        expect(service.getDisplayMode(-1)).toBe('always');
        expect(service.getDisplayState(1, -1, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.needsHintEnhancement(-1)).toBe(false);
        expect(service.isTemporaryDisplay(-1, false)).toBe(false);
      });

      it('应该正确处理非常大的切割次数', () => {
        const largeCutCount = 100;
        expect(service.shouldShowAngle(largeCutCount, 1, false)).toBe(false);
        expect(service.shouldShowAngle(largeCutCount, 1, true)).toBe(true);
        expect(service.getDisplayMode(largeCutCount)).toBe('conditional');
        expect(service.getDisplayState(1, largeCutCount, false)).toBe(AngleDisplayState.HIDDEN);
        expect(service.getDisplayState(1, largeCutCount, true)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
        expect(service.needsHintEnhancement(largeCutCount)).toBe(true);
        expect(service.isTemporaryDisplay(largeCutCount, true)).toBe(true);
      });

      it('应该正确处理 pieceId 为 0 的情况', () => {
        expect(service.shouldShowAngle(1, 0, false)).toBe(true);
        expect(service.getDisplayState(0, 1, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.activateHintDisplay(0, 4)).toEqual({ shouldActivate: true });
      });

      it('应该正确处理负数 pieceId 的情况', () => {
        expect(service.shouldShowAngle(1, -1, false)).toBe(true);
        expect(service.getDisplayState(-1, 1, false)).toBe(AngleDisplayState.ALWAYS_VISIBLE);
        expect(service.activateHintDisplay(-1, 4)).toEqual({ shouldActivate: true });
      });
    });

    describe('异常情况测试', () => {
      it('应该正确处理 NaN 切割次数', () => {
        const nanCutCount = NaN;
        // NaN 在比较中会返回 false，所以 NaN <= 3 是 false，NaN > 3 也是 false
        // shouldShowAngle: 跳过 cutCount <= 3，直接返回 showHint 的值
        expect(service.shouldShowAngle(nanCutCount, 1, false)).toBe(false);
        expect(service.shouldShowAngle(nanCutCount, 1, true)).toBe(true);
        // getDisplayMode: NaN <= 3 是 false，所以返回 'conditional'
        expect(service.getDisplayMode(nanCutCount)).toBe('conditional');
        // needsHintEnhancement: NaN > 3 是 false，所以返回 false
        expect(service.needsHintEnhancement(nanCutCount)).toBe(false);
        // isTemporaryDisplay: NaN > 3 是 false，所以返回 false
        expect(service.isTemporaryDisplay(nanCutCount, true)).toBe(false);
        expect(service.isTemporaryDisplay(nanCutCount, false)).toBe(false);
      });

      it('应该正确处理 Infinity 切割次数', () => {
        const infinityCutCount = Infinity;
        expect(service.shouldShowAngle(infinityCutCount, 1, false)).toBe(false);
        expect(service.shouldShowAngle(infinityCutCount, 1, true)).toBe(true);
        expect(service.getDisplayMode(infinityCutCount)).toBe('conditional');
        expect(service.needsHintEnhancement(infinityCutCount)).toBe(true);
        expect(service.isTemporaryDisplay(infinityCutCount, true)).toBe(true);
      });

      it('应该正确处理 -Infinity 切割次数', () => {
        const negativeInfinityCutCount = -Infinity;
        expect(service.shouldShowAngle(negativeInfinityCutCount, 1, false)).toBe(true);
        expect(service.getDisplayMode(negativeInfinityCutCount)).toBe('always');
        expect(service.needsHintEnhancement(negativeInfinityCutCount)).toBe(false);
        expect(service.isTemporaryDisplay(negativeInfinityCutCount, false)).toBe(false);
      });

      it('应该正确处理小数切割次数', () => {
        expect(service.shouldShowAngle(3.5, 1, false)).toBe(false); // 3.5 > 3
        expect(service.shouldShowAngle(3.5, 1, true)).toBe(true);
        expect(service.getDisplayMode(3.5)).toBe('conditional');
        expect(service.needsHintEnhancement(3.5)).toBe(true);
        
        expect(service.shouldShowAngle(2.9, 1, false)).toBe(true); // 2.9 <= 3
        expect(service.getDisplayMode(2.9)).toBe('always');
        expect(service.needsHintEnhancement(2.9)).toBe(false);
      });
    });

    describe('类型安全测试', () => {
      it('应该正确处理布尔值参数的各种组合', () => {
        // 测试所有布尔值组合
        const booleanValues = [true, false];
        const cutCounts = [1, 5];
        const pieceIds = [1, null];

        booleanValues.forEach(showHint => {
          cutCounts.forEach(cutCount => {
            pieceIds.forEach(pieceId => {
              // 这些调用不应该抛出异常
              expect(() => {
                service.shouldShowAngle(cutCount, pieceId, showHint);
                service.getDisplayState(pieceId, cutCount, showHint);
                service.isTemporaryDisplay(cutCount, showHint);
              }).not.toThrow();
            });
          });
        });
      });
    });
  });

  describe('集成测试', () => {
    it('应该保持各个方法之间的逻辑一致性', () => {
      const testCases = [
        { cutCount: 1, pieceId: 1, showHint: false },
        { cutCount: 3, pieceId: 2, showHint: true },
        { cutCount: 5, pieceId: 3, showHint: false },
        { cutCount: 8, pieceId: 4, showHint: true },
      ];

      testCases.forEach(({ cutCount, pieceId, showHint }) => {
        const shouldShow = service.shouldShowAngle(cutCount, pieceId, showHint);
        const displayMode = service.getDisplayMode(cutCount);
        const displayState = service.getDisplayState(pieceId, cutCount, showHint);
        const isTemporary = service.isTemporaryDisplay(cutCount, showHint);
        const needsEnhancement = service.needsHintEnhancement(cutCount);

        // 验证逻辑一致性
        if (cutCount <= 3) {
          expect(displayMode).toBe('always');
          expect(needsEnhancement).toBe(false);
          expect(isTemporary).toBe(false);
          if (pieceId !== null) {
            expect(shouldShow).toBe(true);
            expect(displayState).toBe(AngleDisplayState.ALWAYS_VISIBLE);
          }
        } else {
          expect(displayMode).toBe('conditional');
          expect(needsEnhancement).toBe(true);
          if (pieceId !== null) {
            if (showHint) {
              expect(shouldShow).toBe(true);
              expect(displayState).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
              expect(isTemporary).toBe(true);
            } else {
              expect(shouldShow).toBe(false);
              expect(displayState).toBe(AngleDisplayState.HIDDEN);
              expect(isTemporary).toBe(false);
            }
          }
        }
      });
    });

    it('activateHintDisplay 的结果应该与 needsHintEnhancement 一致', () => {
      for (let cutCount = 0; cutCount <= 10; cutCount++) {
        const hintResult = service.activateHintDisplay(1, cutCount);
        const needsEnhancement = service.needsHintEnhancement(cutCount);
        
        if (cutCount <= 3) {
          expect(hintResult.shouldActivate).toBe(false);
          expect(needsEnhancement).toBe(false);
        } else {
          expect(hintResult.shouldActivate).toBe(true);
          expect(needsEnhancement).toBe(true);
        }
      }
    });
  });
});