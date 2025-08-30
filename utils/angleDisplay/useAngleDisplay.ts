/**
 * 角度显示Hook
 * 为React组件提供角度显示功能的便捷接口
 */

import { useCallback, useContext } from 'react';
import { GameContext } from '@/contexts/GameContext';
import { angleDisplayService } from './AngleDisplayService';
import { AngleDisplayState } from './AngleVisibilityManager';

export interface UseAngleDisplayReturn {
  // 状态查询
  shouldShowAngle: (pieceId: number | null) => boolean;
  getDisplayMode: () => 'always' | 'conditional';
  getDisplayState: (pieceId: number | null) => AngleDisplayState;
  isTemporaryDisplay: () => boolean;
  
  // 提示功能集成
  needsHintEnhancement: () => boolean;
  
  // 状态信息
  cutCount: number;
  angleDisplayMode: 'always' | 'conditional';
  showHint: boolean;
}

/**
 * 角度显示Hook
 * @returns 角度显示功能接口
 */
export const useAngleDisplay = (): UseAngleDisplayReturn => {
  const context = useContext(GameContext);
  
  if (!context) {
    throw new Error('useAngleDisplay must be used within a GameProvider');
  }
  
  const { state, dispatch } = context;
  const { cutCount, angleDisplayMode, showHint } = state;
  
  // 状态查询函数
  const shouldShowAngle = useCallback((pieceId: number | null): boolean => {
    return angleDisplayService.shouldShowAngle(cutCount, pieceId, showHint);
  }, [cutCount, showHint]);
  
  const getDisplayMode = useCallback((): 'always' | 'conditional' => {
    return angleDisplayService.getDisplayMode(cutCount);
  }, [cutCount]);
  
  const getDisplayState = useCallback((pieceId: number | null): AngleDisplayState => {
    return angleDisplayService.getDisplayState(pieceId, cutCount, showHint);
  }, [cutCount, showHint]);
  
  const isTemporaryDisplay = useCallback((): boolean => {
    return angleDisplayService.isTemporaryDisplay(cutCount, showHint);
  }, [cutCount, showHint]);
  
  // 提示功能集成 - 复用现有的提示系统
  // 角度显示会跟随showHint状态，不需要单独的激活函数
  
  const needsHintEnhancement = useCallback((): boolean => {
    return angleDisplayService.needsHintEnhancement(cutCount);
  }, [cutCount]);
  
  return {
    // 状态查询
    shouldShowAngle,
    getDisplayMode,
    getDisplayState,
    isTemporaryDisplay,
    
    // 提示功能集成
    needsHintEnhancement,
    
    // 状态信息
    cutCount,
    angleDisplayMode,
    showHint
  };
};

export default useAngleDisplay;