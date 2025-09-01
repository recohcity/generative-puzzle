import {
  shouldShowAngle,
  getAngleDisplayMode,
  isHintTemporaryDisplay,
  updateDisplayRule,
  AngleDisplayControllerImpl,
  AngleDisplayController
} from '../AngleDisplayController';

describe('AngleDisplayController', () => {
  describe('shouldShowAngle 函数测试', () => {
    it('当 pieceId 为 null 时应该返回 false', () => {
      expect(shouldShowAngle(1, null, false)).toBe(false);
      expect(shouldShowAngle(5, null, true)).toBe(false);
    });

    it('1-3次切割时应该始终显示角度', () => {
      expect(shouldShowAngle(1, 1, false)).toBe(true);
      expect(shouldShowAngle(2, 1, false)).toBe(true);
      expect(shouldShowAngle(3, 1, false)).toBe(true);
    });

    it('4-8次切割时只有在显示提示时才显示角度', () => {
      expect(shouldShowAngle(4, 1, false)).toBe(false);
      expect(shouldShowAngle(4, 1, true)).toBe(true);
      expect(shouldShowAngle(8, 1, false)).toBe(false);
      expect(shouldShowAngle(8, 1, true)).toBe(true);
    });
  });

  describe('getAngleDisplayMode 函数测试', () => {
    it('1-3次切割时应该返回 always 模式', () => {
      expect(getAngleDisplayMode(1)).toBe('always');
      expect(getAngleDisplayMode(3)).toBe('always');
    });

    it('4-8次切割时应该返回 conditional 模式', () => {
      expect(getAngleDisplayMode(4)).toBe('conditional');
      expect(getAngleDisplayMode(8)).toBe('conditional');
    });
  });

  describe('isHintTemporaryDisplay 函数测试', () => {
    it('1-3次切割时不是临时显示', () => {
      expect(isHintTemporaryDisplay(1, true)).toBe(false);
      expect(isHintTemporaryDisplay(3, true)).toBe(false);
    });

    it('4-8次切割且显示提示时是临时显示', () => {
      expect(isHintTemporaryDisplay(4, true)).toBe(true);
      expect(isHintTemporaryDisplay(8, true)).toBe(true);
    });
  });

  describe('updateDisplayRule 函数测试', () => {
    it('应该返回与 getAngleDisplayMode 相同的结果', () => {
      expect(updateDisplayRule(1)).toBe('always');
      expect(updateDisplayRule(3)).toBe('always');
      expect(updateDisplayRule(4)).toBe('conditional');
      expect(updateDisplayRule(8)).toBe('conditional');
    });

    it('应该与 getAngleDisplayMode 保持一致', () => {
      const testCases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, -1, NaN, Infinity, -Infinity];
      
      testCases.forEach(cutCount => {
        expect(updateDisplayRule(cutCount)).toBe(getAngleDisplayMode(cutCount));
      });
    });

    it('应该正确处理边界值和异常输入', () => {
      expect(updateDisplayRule(0)).toBe('always');
      expect(updateDisplayRule(-1)).toBe('always');
      expect(updateDisplayRule(3.5)).toBe('conditional');
      expect(updateDisplayRule(2.9)).toBe('always');
      expect(updateDisplayRule(NaN)).toBe('conditional');
      expect(updateDisplayRule(Infinity)).toBe('conditional');
      expect(updateDisplayRule(-Infinity)).toBe('always');
    });
  });

  describe('AngleDisplayControllerImpl 接口实现测试', () => {
    it('应该正确实现接口', () => {
      expect(AngleDisplayControllerImpl).toBeDefined();
      expect(typeof AngleDisplayControllerImpl.shouldShowAngle).toBe('function');
      expect(typeof AngleDisplayControllerImpl.getDisplayMode).toBe('function');
      expect(typeof AngleDisplayControllerImpl.isHintTemporaryDisplay).toBe('function');
    });

    it('控制器方法应该与独立函数返回相同结果', () => {
      expect(AngleDisplayControllerImpl.shouldShowAngle(1, 1, false))
        .toBe(shouldShowAngle(1, 1, false));
      expect(AngleDisplayControllerImpl.getDisplayMode(5))
        .toBe(getAngleDisplayMode(5));
      expect(AngleDisplayControllerImpl.isHintTemporaryDisplay(4, true))
        .toBe(isHintTemporaryDisplay(4, true));
    });

    it('应该正确处理错误输入', () => {
      expect(() => AngleDisplayControllerImpl.shouldShowAngle(NaN, 1, false)).not.toThrow();
      expect(() => AngleDisplayControllerImpl.getDisplayMode(NaN)).not.toThrow();
      expect(() => AngleDisplayControllerImpl.isHintTemporaryDisplay(NaN, true)).not.toThrow();
    });
  });

  describe('边界值和异常情况测试', () => {
    it('应该正确处理边界值', () => {
      // 切割次数边界值
      expect(shouldShowAngle(0, 1, false)).toBe(true);
      expect(shouldShowAngle(3, 1, false)).toBe(true);
      expect(shouldShowAngle(4, 1, false)).toBe(false);
      expect(shouldShowAngle(-1, 1, false)).toBe(true);
      expect(shouldShowAngle(100, 1, false)).toBe(false);
      expect(shouldShowAngle(100, 1, true)).toBe(true);

      // pieceId 边界值
      expect(shouldShowAngle(1, 0, false)).toBe(true);
      expect(shouldShowAngle(1, -1, false)).toBe(true);
    });

    it('应该正确处理异常输入', () => {
      // NaN 处理
      expect(shouldShowAngle(NaN, 1, false)).toBe(false);
      expect(shouldShowAngle(NaN, 1, true)).toBe(true);
      expect(getAngleDisplayMode(NaN)).toBe('conditional');
      expect(isHintTemporaryDisplay(NaN, true)).toBe(false);

      // Infinity 处理
      expect(shouldShowAngle(Infinity, 1, false)).toBe(false);
      expect(shouldShowAngle(Infinity, 1, true)).toBe(true);
      expect(getAngleDisplayMode(Infinity)).toBe('conditional');
      expect(isHintTemporaryDisplay(Infinity, true)).toBe(true);

      // -Infinity 处理
      expect(shouldShowAngle(-Infinity, 1, false)).toBe(true);
      expect(getAngleDisplayMode(-Infinity)).toBe('always');
      expect(isHintTemporaryDisplay(-Infinity, true)).toBe(false);

      // 小数处理
      expect(shouldShowAngle(3.5, 1, false)).toBe(false);
      expect(shouldShowAngle(2.9, 1, false)).toBe(true);
      expect(getAngleDisplayMode(3.1)).toBe('conditional');
      expect(getAngleDisplayMode(2.9)).toBe('always');
    });
  });

  describe('集成测试', () => {
    it('控制器方法应该与独立函数保持一致', () => {
      const testCases = [
        { cutCount: 1, pieceId: 1, showHint: false },
        { cutCount: 3, pieceId: 2, showHint: true },
        { cutCount: 5, pieceId: null, showHint: false },
        { cutCount: 8, pieceId: 4, showHint: true },
        { cutCount: 0, pieceId: 0, showHint: false },
        { cutCount: -1, pieceId: -1, showHint: true },
      ];

      testCases.forEach(({ cutCount, pieceId, showHint }) => {
        expect(AngleDisplayControllerImpl.shouldShowAngle(cutCount, pieceId, showHint))
          .toBe(shouldShowAngle(cutCount, pieceId, showHint));
        
        expect(AngleDisplayControllerImpl.getDisplayMode(cutCount))
          .toBe(getAngleDisplayMode(cutCount));
        
        expect(AngleDisplayControllerImpl.isHintTemporaryDisplay(cutCount, showHint))
          .toBe(isHintTemporaryDisplay(cutCount, showHint));
      });
    });

    it('应该保持逻辑一致性', () => {
      const testCases = [
        { cutCount: 1, pieceId: 1, showHint: false },
        { cutCount: 3, pieceId: 2, showHint: true },
        { cutCount: 5, pieceId: 3, showHint: false },
        { cutCount: 8, pieceId: 4, showHint: true },
      ];

      testCases.forEach(({ cutCount, pieceId, showHint }) => {
        const shouldShow = AngleDisplayControllerImpl.shouldShowAngle(cutCount, pieceId, showHint);
        const displayMode = AngleDisplayControllerImpl.getDisplayMode(cutCount);
        const isTemporary = AngleDisplayControllerImpl.isHintTemporaryDisplay(cutCount, showHint);

        // 验证逻辑一致性
        if (cutCount <= 3) {
          expect(displayMode).toBe('always');
          expect(isTemporary).toBe(false);
          if (pieceId !== null) {
            expect(shouldShow).toBe(true);
          }
        } else {
          expect(displayMode).toBe('conditional');
          if (pieceId !== null) {
            if (showHint) {
              expect(shouldShow).toBe(true);
              expect(isTemporary).toBe(true);
            } else {
              expect(shouldShow).toBe(false);
              expect(isTemporary).toBe(false);
            }
          }
        }
      });
    });
  });

  describe('性能测试', () => {
    it('应该在大量调用下保持性能', () => {
      const startTime = performance.now();
      
      // 执行大量调用
      for (let i = 0; i < 10000; i++) {
        shouldShowAngle(i % 10, i % 5 === 0 ? null : i, i % 2 === 0);
        getAngleDisplayMode(i % 10);
        isHintTemporaryDisplay(i % 10, i % 2 === 0);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 性能应该在合理范围内（100ms内完成10000次调用）
      expect(executionTime).toBeLessThan(100);
    });
  });});
