/**
 * 角度显示服务
 * 提供完整的角度显示控制功能，整合所有相关工具
 */

import { shouldShowAngle, getAngleDisplayMode, isHintTemporaryDisplay } from './AngleDisplayController';
import { getAngleDisplayState, AngleDisplayState } from './AngleVisibilityManager';
import { activateHintWithAngle, getHintDuration, needsAngleEnhancement } from './HintEnhancedDisplay';

export interface AngleDisplayService {
  // 核心显示逻辑
  shouldShowAngle(cutCount: number, pieceId: number | null, showHint: boolean): boolean;
  getDisplayMode(cutCount: number): 'always' | 'conditional';
  getDisplayState(pieceId: number | null, cutCount: number, showHint: boolean): AngleDisplayState;

  // 提示功能集成
  activateHintDisplay(pieceId: number, cutCount: number): { shouldActivate: boolean };
  needsHintEnhancement(cutCount: number): boolean;

  // 状态检查
  isTemporaryDisplay(cutCount: number, showHint: boolean): boolean;
}

/**
 * 角度显示服务实现类
 */
class AngleDisplayServiceImpl implements AngleDisplayService {

  // 核心显示逻辑
  shouldShowAngle(cutCount: number, pieceId: number | null, showHint: boolean): boolean {
    return shouldShowAngle(cutCount, pieceId, showHint);
  }

  getDisplayMode(cutCount: number): 'always' | 'conditional' {
    return getAngleDisplayMode(cutCount);
  }

  getDisplayState(pieceId: number | null, cutCount: number, showHint: boolean): AngleDisplayState {
    return getAngleDisplayState(pieceId, cutCount, showHint);
  }

  // 提示功能集成
  activateHintDisplay(pieceId: number, cutCount: number): { shouldActivate: boolean } {
    const result = activateHintWithAngle(pieceId, cutCount);
    return {
      shouldActivate: result.shouldShowAngle
    };
  }

  needsHintEnhancement(cutCount: number): boolean {
    return needsAngleEnhancement(cutCount);
  }

  // 状态检查
  isTemporaryDisplay(cutCount: number, showHint: boolean): boolean {
    return isHintTemporaryDisplay(cutCount, showHint);
  }
}

// 创建单例实例
export const angleDisplayService = new AngleDisplayServiceImpl();

// 导出便捷函数
export const {
  shouldShowAngle: shouldShowAngleService,
  getDisplayMode: getDisplayModeService,
  getDisplayState: getDisplayStateService,
  activateHintDisplay,
  needsHintEnhancement,
  isTemporaryDisplay
} = angleDisplayService;

export default angleDisplayService;