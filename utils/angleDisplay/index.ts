/**
 * 角度显示增强功能工具集
 * 导出所有角度显示相关的工具函数和类型
 */

// 角度显示控制器
export type { AngleDisplayController } from './AngleDisplayController';
export {
  AngleDisplayControllerImpl,
  shouldShowAngle,
  getAngleDisplayMode,
  isHintTemporaryDisplay,
  updateDisplayRule
} from './AngleDisplayController';

// 角度可见性管理器
export type { AngleVisibilityManager } from './AngleVisibilityManager';
export {
  AngleVisibilityManagerImpl,
  AngleDisplayState,
  getAngleDisplayState,
  updateVisibilityRule,
  setTemporaryVisible
} from './AngleVisibilityManager';

// 提示增强显示
export type { HintEnhancedDisplay } from './HintEnhancedDisplay';
export {
  HintEnhancedDisplayImpl,
  activateHintWithAngle,
  deactivateHintWithAngle,
  isAngleTemporaryVisible,
  getHintDuration,
  needsAngleEnhancement
} from './HintEnhancedDisplay';



// 角度显示服务
export type { AngleDisplayService } from './AngleDisplayService';
export {
  angleDisplayService,
  shouldShowAngleService,
  getDisplayModeService,
  getDisplayStateService,
  activateHintDisplay,
  needsHintEnhancement,
  isTemporaryDisplay
} from './AngleDisplayService';

// 模式更新器
export type { AngleDisplayModeUpdater } from './AngleDisplayModeUpdater';
export {
  AngleDisplayModeUpdaterImpl,
  updateModeOnCutCountChange,
  createModeUpdateAction,
  shouldClearTemporaryDisplay,
  getTransitionEffect,
  processCutCountChanges,
  createCutCountUpdateActions,
  validateCutCount,
  getCutCountDifficultyLevel
} from './AngleDisplayModeUpdater';

// React Hook
export type { UseAngleDisplayReturn } from './useAngleDisplay';
export { useAngleDisplay } from './useAngleDisplay';

// 默认导出
export { default as AngleDisplayControllerDefault } from './AngleDisplayController';
export { default as AngleVisibilityManagerDefault } from './AngleVisibilityManager';
export { default as HintEnhancedDisplayDefault } from './HintEnhancedDisplay';
export { default as AngleDisplayServiceDefault } from './AngleDisplayService';
export { default as AngleDisplayModeUpdaterDefault } from './AngleDisplayModeUpdater';
export { default as useAngleDisplayDefault } from './useAngleDisplay';