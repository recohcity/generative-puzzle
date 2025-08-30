/**
 * HintEnhancedDisplay 单元测试
 * 测试提示增强显示工具的所有功能
 */

import {
  activateHintWithAngle,
  deactivateHintWithAngle,
  isAngleTemporaryVisible,
  getHintDuration,
  needsAngleEnhancement,
  HintEnhancedDisplayImpl
} from '../HintEnhancedDisplay';

describe('HintEnhancedDisplay', () => {
  describe('activateHintWithAngle 函数测试', () => {
    it('1-3次切割时不需要特殊处理', () => {
      expect(activateHintWithAngle(1, 1)).toEqual({ shouldShowAngle: false, duration: 0 });
      expect(activateHintWithAngle(2, 2)).toEqual({ shouldShowAngle: false, duration: 0 });
      expect(activateHintWithAngle(3, 3)).toEqual({ shouldShowAngle: false, duration: 0 });
    });

    it('4-8次切割时需要临时显示角度', () => {
      expect(activateHintWithAngle(1, 4)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(2, 5)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(3, 6)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(4, 7)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(5, 8)).toEqual({ shouldShowAngle: true, duration: 3000 });
    });

    it('应该正确处理边界值', () => {
      // 切割次数为 0
      expect(activateHintWithAngle(1, 0)).toEqual({ shouldShowAngle: false, duration: 0 });
      
      // 负数切割次数
      expect(activateHintWithAngle(1, -1)).toEqual({ shouldShowAngle: false, duration: 0 });
      
      // 很大的切割次数
      expect(activateHintWithAngle(1, 100)).toEqual({ shouldShowAngle: true, duration: 3000 });
    });

    it('应该正确处理不同的 pieceId', () => {
      expect(activateHintWithAngle(0, 5)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(-1, 5)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(999, 5)).toEqual({ shouldShowAngle: true, duration: 3000 });
    });

    it('应该正确处理异常输入', () => {
      expect(() => activateHintWithAngle(NaN, 5)).not.toThrow();
      expect(() => activateHintWithAngle(1, NaN)).not.toThrow();
      expect(() => activateHintWithAngle(Infinity, Infinity)).not.toThrow();
      
      // NaN 切割次数的处理
      expect(activateHintWithAngle(1, NaN)).toEqual({ shouldShowAngle: true, duration: 3000 });
      
      // Infinity 切割次数的处理
      expect(activateHintWithAngle(1, Infinity)).toEqual({ shouldShowAngle: true, duration: 3000 });
      
      // -Infinity 切割次数的处理
      expect(activateHintWithAngle(1, -Infinity)).toEqual({ shouldShowAngle: false, duration: 0 });
      
      // 小数切割次数的处理
      expect(activateHintWithAngle(1, 3.5)).toEqual({ shouldShowAngle: true, duration: 3000 });
      expect(activateHintWithAngle(1, 2.9)).toEqual({ shouldShowAngle: false, duration: 0 });
    });
  });

  describe('deactivateHintWithAngle 函数测试', () => {
    it('应该返回正确的取消参数', () => {
      expect(deactivateHintWithAngle(1)).toEqual({ pieceId: 1 });
      expect(deactivateHintWithAngle(5)).toEqual({ pieceId: 5 });
      expect(deactivateHintWithAngle(999)).toEqual({ pieceId: 999 });
    });

    it('应该正确处理不同类型的 pieceId', () => {
      expect(deactivateHintWithAngle(0)).toEqual({ pieceId: 0 });
      expect(deactivateHintWithAngle(-1)).toEqual({ pieceId: -1 });
      expect(deactivateHintWithAngle(-999)).toEqual({ pieceId: -999 });
    });

    it('应该正确处理异常输入', () => {
      expect(() => deactivateHintWithAngle(NaN)).not.toThrow();
      expect(() => deactivateHintWithAngle(Infinity)).not.toThrow();
      expect(() => deactivateHintWithAngle(-Infinity)).not.toThrow();
      
      const nanResult = deactivateHintWithAngle(NaN);
      expect(Number.isNaN(nanResult.pieceId)).toBe(true);
      
      expect(deactivateHintWithAngle(Infinity)).toEqual({ pieceId: Infinity });
      expect(deactivateHintWithAngle(-Infinity)).toEqual({ pieceId: -Infinity });
    });
  });

  describe('isAngleTemporaryVisible 函数测试', () => {
    it('应该正确检查临时可见状态', () => {
      const temporaryVisible = new Set([1, 3, 5]);
      
      expect(isAngleTemporaryVisible(1, temporaryVisible)).toBe(true);
      expect(isAngleTemporaryVisible(3, temporaryVisible)).toBe(true);
      expect(isAngleTemporaryVisible(5, temporaryVisible)).toBe(true);
      
      expect(isAngleTemporaryVisible(2, temporaryVisible)).toBe(false);
      expect(isAngleTemporaryVisible(4, temporaryVisible)).toBe(false);
      expect(isAngleTemporaryVisible(6, temporaryVisible)).toBe(false);
    });

    it('应该正确处理空集合', () => {
      const emptySet = new Set<number>();
      
      expect(isAngleTemporaryVisible(1, emptySet)).toBe(false);
      expect(isAngleTemporaryVisible(0, emptySet)).toBe(false);
      expect(isAngleTemporaryVisible(-1, emptySet)).toBe(false);
    });

    it('应该正确处理大集合', () => {
      const largeSet = new Set(Array.from({ length: 1000 }, (_, i) => i));
      
      expect(isAngleTemporaryVisible(0, largeSet)).toBe(true);
      expect(isAngleTemporaryVisible(500, largeSet)).toBe(true);
      expect(isAngleTemporaryVisible(999, largeSet)).toBe(true);
      expect(isAngleTemporaryVisible(1000, largeSet)).toBe(false);
    });

    it('应该正确处理特殊值', () => {
      const specialSet = new Set([0, -1, NaN, Infinity, -Infinity]);
      
      expect(isAngleTemporaryVisible(0, specialSet)).toBe(true);
      expect(isAngleTemporaryVisible(-1, specialSet)).toBe(true);
      expect(isAngleTemporaryVisible(NaN, specialSet)).toBe(true);
      expect(isAngleTemporaryVisible(Infinity, specialSet)).toBe(true);
      expect(isAngleTemporaryVisible(-Infinity, specialSet)).toBe(true);
      
      expect(isAngleTemporaryVisible(1, specialSet)).toBe(false);
    });

    it('应该正确处理异常输入', () => {
      const normalSet = new Set([1, 2, 3]);
      
      expect(() => isAngleTemporaryVisible(NaN, normalSet)).not.toThrow();
      expect(() => isAngleTemporaryVisible(Infinity, normalSet)).not.toThrow();
      expect(() => isAngleTemporaryVisible(-Infinity, normalSet)).not.toThrow();
      
      expect(isAngleTemporaryVisible(NaN, normalSet)).toBe(false);
      expect(isAngleTemporaryVisible(Infinity, normalSet)).toBe(false);
      expect(isAngleTemporaryVisible(-Infinity, normalSet)).toBe(false);
    });
  });

  describe('getHintDuration 函数测试', () => {
    it('1-3次切割时不需要临时显示', () => {
      expect(getHintDuration(1)).toBe(0);
      expect(getHintDuration(2)).toBe(0);
      expect(getHintDuration(3)).toBe(0);
    });

    it('4-5次切割时返回3秒', () => {
      expect(getHintDuration(4)).toBe(3000);
      expect(getHintDuration(5)).toBe(3000);
    });

    it('6-8次切割时返回4秒', () => {
      expect(getHintDuration(6)).toBe(4000);
      expect(getHintDuration(7)).toBe(4000);
      expect(getHintDuration(8)).toBe(4000);
    });

    it('应该正确处理边界值', () => {
      expect(getHintDuration(0)).toBe(0);
      expect(getHintDuration(-1)).toBe(0);
      expect(getHintDuration(100)).toBe(4000); // 大于6的都是4秒
    });

    it('应该正确处理异常输入', () => {
      expect(() => getHintDuration(NaN)).not.toThrow();
      expect(() => getHintDuration(Infinity)).not.toThrow();
      expect(() => getHintDuration(-Infinity)).not.toThrow();
      
      // NaN 的比较结果是 false，所以会走到最后的 else 分支
      expect(getHintDuration(NaN)).toBe(4000);
      
      // Infinity > 5 是 true，所以返回 4000
      expect(getHintDuration(Infinity)).toBe(4000);
      
      // -Infinity <= 3 是 true，所以返回 0
      expect(getHintDuration(-Infinity)).toBe(0);
      
      // 小数处理
      expect(getHintDuration(3.5)).toBe(3000); // 3.5 <= 5 是 true
      expect(getHintDuration(5.5)).toBe(4000); // 5.5 > 5 是 true
      expect(getHintDuration(2.9)).toBe(0);    // 2.9 <= 3 是 true
    });
  });

  describe('needsAngleEnhancement 函数测试', () => {
    it('1-3次切割时不需要增强', () => {
      expect(needsAngleEnhancement(1)).toBe(false);
      expect(needsAngleEnhancement(2)).toBe(false);
      expect(needsAngleEnhancement(3)).toBe(false);
    });

    it('4-8次切割时需要增强', () => {
      expect(needsAngleEnhancement(4)).toBe(true);
      expect(needsAngleEnhancement(5)).toBe(true);
      expect(needsAngleEnhancement(6)).toBe(true);
      expect(needsAngleEnhancement(7)).toBe(true);
      expect(needsAngleEnhancement(8)).toBe(true);
    });

    it('应该正确处理边界值', () => {
      expect(needsAngleEnhancement(0)).toBe(false);
      expect(needsAngleEnhancement(-1)).toBe(false);
      expect(needsAngleEnhancement(100)).toBe(true);
    });

    it('应该正确处理异常输入', () => {
      expect(() => needsAngleEnhancement(NaN)).not.toThrow();
      expect(() => needsAngleEnhancement(Infinity)).not.toThrow();
      expect(() => needsAngleEnhancement(-Infinity)).not.toThrow();
      
      // NaN > 3 是 false
      expect(needsAngleEnhancement(NaN)).toBe(false);
      
      // Infinity > 3 是 true
      expect(needsAngleEnhancement(Infinity)).toBe(true);
      
      // -Infinity > 3 是 false
      expect(needsAngleEnhancement(-Infinity)).toBe(false);
      
      // 小数处理
      expect(needsAngleEnhancement(3.5)).toBe(true);  // 3.5 > 3
      expect(needsAngleEnhancement(2.9)).toBe(false); // 2.9 <= 3
    });
  });

  describe('HintEnhancedDisplayImpl 接口实现测试', () => {
    it('应该正确实现接口', () => {
      expect(HintEnhancedDisplayImpl).toBeDefined();
      expect(typeof HintEnhancedDisplayImpl.activateHintWithAngle).toBe('function');
      expect(typeof HintEnhancedDisplayImpl.deactivateHintWithAngle).toBe('function');
      expect(typeof HintEnhancedDisplayImpl.isAngleTemporaryVisible).toBe('function');
      expect(typeof HintEnhancedDisplayImpl.getHintDuration).toBe('function');
    });

    it('接口方法应该与独立函数返回相同结果', () => {
      // 测试 activateHintWithAngle
      expect(HintEnhancedDisplayImpl.activateHintWithAngle(1, 5))
        .toEqual(activateHintWithAngle(1, 5));
      expect(HintEnhancedDisplayImpl.activateHintWithAngle(2, 2))
        .toEqual(activateHintWithAngle(2, 2));
      
      // 测试 deactivateHintWithAngle
      expect(HintEnhancedDisplayImpl.deactivateHintWithAngle(3))
        .toEqual(deactivateHintWithAngle(3));
      expect(HintEnhancedDisplayImpl.deactivateHintWithAngle(-1))
        .toEqual(deactivateHintWithAngle(-1));
      
      // 测试 isAngleTemporaryVisible
      const testSet = new Set([1, 3, 5]);
      expect(HintEnhancedDisplayImpl.isAngleTemporaryVisible(1, testSet))
        .toBe(isAngleTemporaryVisible(1, testSet));
      expect(HintEnhancedDisplayImpl.isAngleTemporaryVisible(2, testSet))
        .toBe(isAngleTemporaryVisible(2, testSet));
      
      // 测试 getHintDuration
      expect(HintEnhancedDisplayImpl.getHintDuration(4))
        .toBe(getHintDuration(4));
      expect(HintEnhancedDisplayImpl.getHintDuration(7))
        .toBe(getHintDuration(7));
    });

    it('应该正确处理错误输入', () => {
      expect(() => HintEnhancedDisplayImpl.activateHintWithAngle(NaN, NaN)).not.toThrow();
      expect(() => HintEnhancedDisplayImpl.deactivateHintWithAngle(NaN)).not.toThrow();
      expect(() => HintEnhancedDisplayImpl.isAngleTemporaryVisible(NaN, new Set())).not.toThrow();
      expect(() => HintEnhancedDisplayImpl.getHintDuration(NaN)).not.toThrow();
    });
  });

  describe('集成测试', () => {
    it('应该保持各个方法之间的逻辑一致性', () => {
      const testCases = [
        { pieceId: 1, cutCount: 1 },
        { pieceId: 2, cutCount: 3 },
        { pieceId: 3, cutCount: 5 },
        { pieceId: 4, cutCount: 8 },
      ];

      testCases.forEach(({ pieceId, cutCount }) => {
        const activateResult = activateHintWithAngle(pieceId, cutCount);
        const duration = getHintDuration(cutCount);
        const needsEnhancement = needsAngleEnhancement(cutCount);

        // 验证逻辑一致性
        if (cutCount <= 3) {
          expect(activateResult.shouldShowAngle).toBe(false);
          expect(activateResult.duration).toBe(0);
          expect(duration).toBe(0);
          expect(needsEnhancement).toBe(false);
        } else {
          expect(activateResult.shouldShowAngle).toBe(true);
          expect(activateResult.duration).toBe(3000);
          expect(duration).toBeGreaterThan(0);
          expect(needsEnhancement).toBe(true);
        }
      });
    });

    it('临时可见状态管理应该正确工作', () => {
      const pieceId = 3;
      const temporaryVisible = new Set<number>();

      // 初始状态：不可见
      expect(isAngleTemporaryVisible(pieceId, temporaryVisible)).toBe(false);

      // 添加到临时可见集合
      temporaryVisible.add(pieceId);
      expect(isAngleTemporaryVisible(pieceId, temporaryVisible)).toBe(true);

      // 取消提示
      const deactivateResult = deactivateHintWithAngle(pieceId);
      expect(deactivateResult.pieceId).toBe(pieceId);

      // 从集合中移除（模拟实际使用场景）
      temporaryVisible.delete(pieceId);
      expect(isAngleTemporaryVisible(pieceId, temporaryVisible)).toBe(false);
    });

    it('持续时间应该与切割难度匹配', () => {
      const testCases = [
        { cutCount: 1, expectedDuration: 0, description: '简单' },
        { cutCount: 3, expectedDuration: 0, description: '简单' },
        { cutCount: 4, expectedDuration: 3000, description: '中等' },
        { cutCount: 5, expectedDuration: 3000, description: '中等' },
        { cutCount: 6, expectedDuration: 4000, description: '困难' },
        { cutCount: 8, expectedDuration: 4000, description: '困难' },
      ];

      testCases.forEach(({ cutCount, expectedDuration, description }) => {
        const duration = getHintDuration(cutCount);
        const activateResult = activateHintWithAngle(1, cutCount);

        expect(duration).toBe(expectedDuration);
        
        if (cutCount <= 3) {
          expect(activateResult.duration).toBe(0);
        } else {
          expect(activateResult.duration).toBe(3000); // activateHintWithAngle 固定返回3000
        }
      });
    });
  });

  describe('性能测试', () => {
    it('应该在大量调用下保持性能', () => {
      const startTime = performance.now();
      const largeSet = new Set(Array.from({ length: 1000 }, (_, i) => i));
      
      // 执行大量调用
      for (let i = 0; i < 10000; i++) {
        activateHintWithAngle(i % 10, i % 8 + 1);
        deactivateHintWithAngle(i % 10);
        isAngleTemporaryVisible(i % 10, largeSet);
        getHintDuration(i % 8 + 1);
        needsAngleEnhancement(i % 8 + 1);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 性能应该在合理范围内（100ms内完成10000次调用）
      expect(executionTime).toBeLessThan(100);
    });

    it('接口实现应该保持性能', () => {
      const startTime = performance.now();
      const testSet = new Set([1, 2, 3, 4, 5]);
      
      // 执行大量接口调用
      for (let i = 0; i < 5000; i++) {
        HintEnhancedDisplayImpl.activateHintWithAngle(i % 10, i % 8 + 1);
        HintEnhancedDisplayImpl.deactivateHintWithAngle(i % 10);
        HintEnhancedDisplayImpl.isAngleTemporaryVisible(i % 10, testSet);
        HintEnhancedDisplayImpl.getHintDuration(i % 8 + 1);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 性能应该在合理范围内（50ms内完成5000次调用）
      expect(executionTime).toBeLessThan(50);
    });

    it('大集合操作应该保持性能', () => {
      const startTime = performance.now();
      const veryLargeSet = new Set(Array.from({ length: 10000 }, (_, i) => i));
      
      // 执行大量集合查询
      for (let i = 0; i < 1000; i++) {
        isAngleTemporaryVisible(i, veryLargeSet);
        isAngleTemporaryVisible(i + 10000, veryLargeSet); // 不存在的元素
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 大集合操作性能应该在合理范围内（20ms内完成2000次查询）
      expect(executionTime).toBeLessThan(20);
    });
  });
});