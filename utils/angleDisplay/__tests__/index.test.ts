/**
 * index.ts 导出测试
 * 测试角度显示模块的所有导出功能
 */

import * as AngleDisplayModule from '../index';

describe('AngleDisplay Module Exports', () => {
  describe('AngleDisplayController 导出测试', () => {
    it('应该正确导出 AngleDisplayController 相关功能', () => {
      expect(AngleDisplayModule.AngleDisplayControllerImpl).toBeDefined();
      expect(typeof AngleDisplayModule.AngleDisplayControllerImpl).toBe('object');
      
      expect(AngleDisplayModule.shouldShowAngle).toBeDefined();
      expect(typeof AngleDisplayModule.shouldShowAngle).toBe('function');
      
      expect(AngleDisplayModule.getAngleDisplayMode).toBeDefined();
      expect(typeof AngleDisplayModule.getAngleDisplayMode).toBe('function');
      
      expect(AngleDisplayModule.isHintTemporaryDisplay).toBeDefined();
      expect(typeof AngleDisplayModule.isHintTemporaryDisplay).toBe('function');
      
      expect(AngleDisplayModule.updateDisplayRule).toBeDefined();
      expect(typeof AngleDisplayModule.updateDisplayRule).toBe('function');
    });

    it('应该正确导出默认 AngleDisplayController', () => {
      expect(AngleDisplayModule.AngleDisplayControllerDefault).toBeDefined();
      expect(typeof AngleDisplayModule.AngleDisplayControllerDefault).toBe('object');
    });
  });

  describe('AngleVisibilityManager 导出测试', () => {
    it('应该正确导出 AngleVisibilityManager 相关功能', () => {
      expect(AngleDisplayModule.AngleVisibilityManagerImpl).toBeDefined();
      expect(typeof AngleDisplayModule.AngleVisibilityManagerImpl).toBe('object');
      
      expect(AngleDisplayModule.AngleDisplayState).toBeDefined();
      expect(typeof AngleDisplayModule.AngleDisplayState).toBe('object');
      
      expect(AngleDisplayModule.getAngleDisplayState).toBeDefined();
      expect(typeof AngleDisplayModule.getAngleDisplayState).toBe('function');
      
      expect(AngleDisplayModule.updateVisibilityRule).toBeDefined();
      expect(typeof AngleDisplayModule.updateVisibilityRule).toBe('function');
      
      expect(AngleDisplayModule.setTemporaryVisible).toBeDefined();
      expect(typeof AngleDisplayModule.setTemporaryVisible).toBe('function');
    });

    it('应该正确导出默认 AngleVisibilityManager', () => {
      expect(AngleDisplayModule.AngleVisibilityManagerDefault).toBeDefined();
      expect(typeof AngleDisplayModule.AngleVisibilityManagerDefault).toBe('object');
    });
  });

  describe('HintEnhancedDisplay 导出测试', () => {
    it('应该正确导出 HintEnhancedDisplay 相关功能', () => {
      expect(AngleDisplayModule.HintEnhancedDisplayImpl).toBeDefined();
      expect(typeof AngleDisplayModule.HintEnhancedDisplayImpl).toBe('object');
      
      expect(AngleDisplayModule.activateHintWithAngle).toBeDefined();
      expect(typeof AngleDisplayModule.activateHintWithAngle).toBe('function');
      
      expect(AngleDisplayModule.deactivateHintWithAngle).toBeDefined();
      expect(typeof AngleDisplayModule.deactivateHintWithAngle).toBe('function');
      
      expect(AngleDisplayModule.isAngleTemporaryVisible).toBeDefined();
      expect(typeof AngleDisplayModule.isAngleTemporaryVisible).toBe('function');
      
      expect(AngleDisplayModule.getHintDuration).toBeDefined();
      expect(typeof AngleDisplayModule.getHintDuration).toBe('function');
      
      expect(AngleDisplayModule.needsAngleEnhancement).toBeDefined();
      expect(typeof AngleDisplayModule.needsAngleEnhancement).toBe('function');
    });

    it('应该正确导出默认 HintEnhancedDisplay', () => {
      expect(AngleDisplayModule.HintEnhancedDisplayDefault).toBeDefined();
      expect(typeof AngleDisplayModule.HintEnhancedDisplayDefault).toBe('object');
    });
  });

  describe('AngleDisplayService 导出测试', () => {
    it('应该正确导出 AngleDisplayService 相关功能', () => {
      expect(AngleDisplayModule.angleDisplayService).toBeDefined();
      expect(typeof AngleDisplayModule.angleDisplayService).toBe('object');
      
      expect(AngleDisplayModule.shouldShowAngleService).toBeDefined();
      expect(typeof AngleDisplayModule.shouldShowAngleService).toBe('function');
      
      expect(AngleDisplayModule.getDisplayModeService).toBeDefined();
      expect(typeof AngleDisplayModule.getDisplayModeService).toBe('function');
      
      expect(AngleDisplayModule.getDisplayStateService).toBeDefined();
      expect(typeof AngleDisplayModule.getDisplayStateService).toBe('function');
      
      expect(AngleDisplayModule.activateHintDisplay).toBeDefined();
      expect(typeof AngleDisplayModule.activateHintDisplay).toBe('function');
      
      expect(AngleDisplayModule.needsHintEnhancement).toBeDefined();
      expect(typeof AngleDisplayModule.needsHintEnhancement).toBe('function');
      
      expect(AngleDisplayModule.isTemporaryDisplay).toBeDefined();
      expect(typeof AngleDisplayModule.isTemporaryDisplay).toBe('function');
    });

    it('应该正确导出默认 AngleDisplayService', () => {
      expect(AngleDisplayModule.AngleDisplayServiceDefault).toBeDefined();
      expect(typeof AngleDisplayModule.AngleDisplayServiceDefault).toBe('object');
    });
  });

  describe('AngleDisplayModeUpdater 导出测试', () => {
    it('应该正确导出 AngleDisplayModeUpdater 相关功能', () => {
      expect(AngleDisplayModule.AngleDisplayModeUpdaterImpl).toBeDefined();
      expect(typeof AngleDisplayModule.AngleDisplayModeUpdaterImpl).toBe('object');
      
      expect(AngleDisplayModule.updateModeOnCutCountChange).toBeDefined();
      expect(typeof AngleDisplayModule.updateModeOnCutCountChange).toBe('function');
      
      expect(AngleDisplayModule.createModeUpdateAction).toBeDefined();
      expect(typeof AngleDisplayModule.createModeUpdateAction).toBe('function');
      
      expect(AngleDisplayModule.shouldClearTemporaryDisplay).toBeDefined();
      expect(typeof AngleDisplayModule.shouldClearTemporaryDisplay).toBe('function');
      
      expect(AngleDisplayModule.getTransitionEffect).toBeDefined();
      expect(typeof AngleDisplayModule.getTransitionEffect).toBe('function');
      
      expect(AngleDisplayModule.processCutCountChanges).toBeDefined();
      expect(typeof AngleDisplayModule.processCutCountChanges).toBe('function');
      
      expect(AngleDisplayModule.createCutCountUpdateActions).toBeDefined();
      expect(typeof AngleDisplayModule.createCutCountUpdateActions).toBe('function');
      
      expect(AngleDisplayModule.validateCutCount).toBeDefined();
      expect(typeof AngleDisplayModule.validateCutCount).toBe('function');
      
      expect(AngleDisplayModule.getCutCountDifficultyLevel).toBeDefined();
      expect(typeof AngleDisplayModule.getCutCountDifficultyLevel).toBe('function');
    });

    it('应该正确导出默认 AngleDisplayModeUpdater', () => {
      expect(AngleDisplayModule.AngleDisplayModeUpdaterDefault).toBeDefined();
      expect(typeof AngleDisplayModule.AngleDisplayModeUpdaterDefault).toBe('object');
    });
  });

  describe('useAngleDisplay Hook 导出测试', () => {
    it('应该正确导出 useAngleDisplay Hook', () => {
      expect(AngleDisplayModule.useAngleDisplay).toBeDefined();
      expect(typeof AngleDisplayModule.useAngleDisplay).toBe('function');
    });

    it('应该正确导出默认 useAngleDisplay', () => {
      expect(AngleDisplayModule.useAngleDisplayDefault).toBeDefined();
      expect(typeof AngleDisplayModule.useAngleDisplayDefault).toBe('function');
    });
  });

  describe('功能性测试', () => {
    it('导出的函数应该能正常工作', () => {
      // 测试一些基本功能
      expect(() => {
        AngleDisplayModule.shouldShowAngle(1, 1, false);
      }).not.toThrow();

      expect(() => {
        AngleDisplayModule.getAngleDisplayMode(3);
      }).not.toThrow();

      expect(() => {
        AngleDisplayModule.updateModeOnCutCountChange(5);
      }).not.toThrow();

      expect(() => {
        AngleDisplayModule.validateCutCount(4);
      }).not.toThrow();

      expect(() => {
        AngleDisplayModule.getCutCountDifficultyLevel(6);
      }).not.toThrow();
    });

    it('导出的对象应该有正确的方法', () => {
      // 测试实现对象的方法
      expect(typeof AngleDisplayModule.AngleDisplayControllerImpl.shouldShowAngle).toBe('function');
      expect(typeof AngleDisplayModule.AngleDisplayControllerImpl.getDisplayMode).toBe('function');
      
      expect(typeof AngleDisplayModule.AngleVisibilityManagerImpl.getAngleDisplayState).toBe('function');
      expect(typeof AngleDisplayModule.AngleVisibilityManagerImpl.updateVisibilityRule).toBe('function');
      
      expect(typeof AngleDisplayModule.AngleDisplayModeUpdaterImpl.updateModeOnCutCountChange).toBe('function');
      expect(typeof AngleDisplayModule.AngleDisplayModeUpdaterImpl.createModeUpdateAction).toBe('function');
      
      expect(typeof AngleDisplayModule.angleDisplayService.shouldShowAngle).toBe('function');
      expect(typeof AngleDisplayModule.angleDisplayService.getDisplayMode).toBe('function');
    });

    it('导出的枚举应该有正确的值', () => {
      expect(AngleDisplayModule.AngleDisplayState.ALWAYS_VISIBLE).toBe('always');
      expect(AngleDisplayModule.AngleDisplayState.HIDDEN).toBe('hidden');
      expect(AngleDisplayModule.AngleDisplayState.TEMPORARY_VISIBLE).toBe('temporary');
    });
  });

  describe('导出一致性测试', () => {
    it('默认导出应该与命名导出一致', () => {
      expect(AngleDisplayModule.AngleDisplayControllerDefault).toBe(AngleDisplayModule.AngleDisplayControllerImpl);
      expect(AngleDisplayModule.AngleVisibilityManagerDefault).toBe(AngleDisplayModule.AngleVisibilityManagerImpl);
      expect(AngleDisplayModule.HintEnhancedDisplayDefault).toBe(AngleDisplayModule.HintEnhancedDisplayImpl);
      expect(AngleDisplayModule.AngleDisplayServiceDefault).toBe(AngleDisplayModule.angleDisplayService);
      expect(AngleDisplayModule.AngleDisplayModeUpdaterDefault).toBe(AngleDisplayModule.AngleDisplayModeUpdaterImpl);
      expect(AngleDisplayModule.useAngleDisplayDefault).toBe(AngleDisplayModule.useAngleDisplay);
    });

    it('所有导出都应该是唯一的', () => {
      const exports = Object.keys(AngleDisplayModule);
      const uniqueExports = new Set(exports);
      expect(exports.length).toBe(uniqueExports.size);
    });
  });

  describe('类型导出测试', () => {
    it('应该能够使用导出的类型', () => {
      // 这些测试主要是编译时检查，如果能编译通过就说明类型导出正确
      const controller: AngleDisplayModule.AngleDisplayController = AngleDisplayModule.AngleDisplayControllerImpl;
      expect(controller).toBeDefined();

      const visibilityManager: AngleDisplayModule.AngleVisibilityManager = AngleDisplayModule.AngleVisibilityManagerImpl;
      expect(visibilityManager).toBeDefined();

      const hintDisplay: AngleDisplayModule.HintEnhancedDisplay = AngleDisplayModule.HintEnhancedDisplayImpl;
      expect(hintDisplay).toBeDefined();

      const service: AngleDisplayModule.AngleDisplayService = AngleDisplayModule.angleDisplayService;
      expect(service).toBeDefined();

      const modeUpdater: AngleDisplayModule.AngleDisplayModeUpdater = AngleDisplayModule.AngleDisplayModeUpdaterImpl;
      expect(modeUpdater).toBeDefined();
    });
  });

  describe('模块完整性测试', () => {
    it('应该导出所有预期的功能', () => {
      const expectedExports = [
        // AngleDisplayController
        'AngleDisplayControllerImpl',
        'shouldShowAngle',
        'getAngleDisplayMode', 
        'isHintTemporaryDisplay',
        'updateDisplayRule',
        'AngleDisplayControllerDefault',
        
        // AngleVisibilityManager
        'AngleVisibilityManagerImpl',
        'AngleDisplayState',
        'getAngleDisplayState',
        'updateVisibilityRule',
        'setTemporaryVisible',
        'AngleVisibilityManagerDefault',
        
        // HintEnhancedDisplay
        'HintEnhancedDisplayImpl',
        'activateHintWithAngle',
        'deactivateHintWithAngle',
        'isAngleTemporaryVisible',
        'getHintDuration',
        'needsAngleEnhancement',
        'HintEnhancedDisplayDefault',
        
        // AngleDisplayService
        'angleDisplayService',
        'shouldShowAngleService',
        'getDisplayModeService',
        'getDisplayStateService',
        'activateHintDisplay',
        'needsHintEnhancement',
        'isTemporaryDisplay',
        'AngleDisplayServiceDefault',
        
        // AngleDisplayModeUpdater
        'AngleDisplayModeUpdaterImpl',
        'updateModeOnCutCountChange',
        'createModeUpdateAction',
        'shouldClearTemporaryDisplay',
        'getTransitionEffect',
        'processCutCountChanges',
        'createCutCountUpdateActions',
        'validateCutCount',
        'getCutCountDifficultyLevel',
        'AngleDisplayModeUpdaterDefault',
        
        // useAngleDisplay
        'useAngleDisplay',
        'useAngleDisplayDefault'
      ];

      expectedExports.forEach(exportName => {
        expect(AngleDisplayModule).toHaveProperty(exportName);
        expect(AngleDisplayModule[exportName as keyof typeof AngleDisplayModule]).toBeDefined();
      });
    });

    it('不应该有意外的导出', () => {
      const actualExports = Object.keys(AngleDisplayModule);
      
      // 验证导出数量为39个（根据实际测试结果）
      expect(actualExports.length).toBe(39);
      
      // 验证所有导出都是预期的类型
      actualExports.forEach(exportName => {
        const exportValue = AngleDisplayModule[exportName as keyof typeof AngleDisplayModule];
        expect(exportValue).toBeDefined();
        expect(typeof exportValue).toMatch(/^(function|object)$/);
      });
    });
  });

  describe('性能测试', () => {
    it('模块导入应该快速完成', () => {
      const startTime = performance.now();
      
      // 重新导入模块（虽然已经缓存，但可以测试导出的性能）
      const testImport = () => {
        const {
          shouldShowAngle,
          getAngleDisplayMode,
          updateModeOnCutCountChange,
          angleDisplayService,
          useAngleDisplay
        } = AngleDisplayModule;
        
        return {
          shouldShowAngle,
          getAngleDisplayMode,
          updateModeOnCutCountChange,
          angleDisplayService,
          useAngleDisplay
        };
      };
      
      const result = testImport();
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // 应该在10ms内完成
    });

    it('大量导出访问应该保持性能', () => {
      const startTime = performance.now();
      
      // 访问所有导出1000次
      for (let i = 0; i < 1000; i++) {
        const _ = AngleDisplayModule.shouldShowAngle;
        const __ = AngleDisplayModule.getAngleDisplayMode;
        const ___ = AngleDisplayModule.angleDisplayService;
        const ____ = AngleDisplayModule.useAngleDisplay;
        const _____ = AngleDisplayModule.AngleDisplayState;
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // 应该在50ms内完成
    });
  });
});