/**
 * 角度显示模式更新器
 * 处理切割次数变更时的角度显示模式更新逻辑
 */

import { GameAction } from '@/types/puzzleTypes';

export interface AngleDisplayModeUpdater {
  updateModeOnCutCountChange(cutCount: number): 'always' | 'conditional';
  createModeUpdateAction(cutCount: number): GameAction;
  shouldClearTemporaryDisplay(oldCutCount: number, newCutCount: number): boolean;
  getTransitionEffect(oldMode: 'always' | 'conditional', newMode: 'always' | 'conditional'): 'none' | 'show' | 'hide';
}

/**
 * 根据切割次数更新角度显示模式
 * @param cutCount 新的切割次数
 * @returns 新的显示模式
 */
export const updateModeOnCutCountChange = (cutCount: number): 'always' | 'conditional' => {
  return cutCount <= 3 ? 'always' : 'conditional';
};

/**
 * 创建模式更新Action
 * @param cutCount 切割次数
 * @returns GameAction
 */
export const createModeUpdateAction = (cutCount: number): GameAction => {
  return {
    type: 'UPDATE_ANGLE_DISPLAY_MODE',
    payload: { cutCount }
  };
};

/**
 * 判断是否应该清除临时显示状态
 * @param oldCutCount 旧的切割次数
 * @param newCutCount 新的切割次数
 * @returns 是否应该清除
 */
export const shouldClearTemporaryDisplay = (oldCutCount: number, newCutCount: number): boolean => {
  const oldMode = updateModeOnCutCountChange(oldCutCount);
  const newMode = updateModeOnCutCountChange(newCutCount);
  
  // 模式发生变化时清除临时显示状态
  return oldMode !== newMode;
};

/**
 * 获取过渡效果类型
 * @param oldMode 旧的显示模式
 * @param newMode 新的显示模式
 * @returns 过渡效果类型
 */
export const getTransitionEffect = (
  oldMode: 'always' | 'conditional', 
  newMode: 'always' | 'conditional'
): 'none' | 'show' | 'hide' => {
  if (oldMode === newMode) {
    return 'none';
  }
  
  if (oldMode === 'conditional' && newMode === 'always') {
    return 'show'; // 从条件显示切换到始终显示
  }
  
  if (oldMode === 'always' && newMode === 'conditional') {
    return 'hide'; // 从始终显示切换到条件显示
  }
  
  return 'none';
};

/**
 * 批量处理切割次数变更
 * @param cutCountChanges 切割次数变更数组
 * @returns 处理结果
 */
export const processCutCountChanges = (
  cutCountChanges: { oldCount: number; newCount: number }[]
): {
  modeChanges: { oldMode: 'always' | 'conditional'; newMode: 'always' | 'conditional' }[];
  shouldClearAll: boolean;
  transitionEffects: ('none' | 'show' | 'hide')[];
} => {
  const modeChanges = cutCountChanges.map(({ oldCount, newCount }) => ({
    oldMode: updateModeOnCutCountChange(oldCount),
    newMode: updateModeOnCutCountChange(newCount)
  }));
  
  const shouldClearAll = cutCountChanges.some(({ oldCount, newCount }) => 
    shouldClearTemporaryDisplay(oldCount, newCount)
  );
  
  const transitionEffects = modeChanges.map(({ oldMode, newMode }) => 
    getTransitionEffect(oldMode, newMode)
  );
  
  return {
    modeChanges,
    shouldClearAll,
    transitionEffects
  };
};

/**
 * 创建完整的切割次数更新Action序列
 * @param newCutCount 新的切割次数
 * @returns Action数组
 */
export const createCutCountUpdateActions = (newCutCount: number): GameAction[] => {
  const actions: GameAction[] = [];
  
  // 1. 更新切割次数（这会自动触发角度显示模式更新）
  actions.push({
    type: 'SET_CUT_COUNT',
    payload: newCutCount
  });
  
  return actions;
};

/**
 * 验证切割次数的有效性
 * @param cutCount 切割次数
 * @returns 是否有效
 */
export const validateCutCount = (cutCount: number): boolean => {
  return Number.isInteger(cutCount) && cutCount >= 1 && cutCount <= 8;
};

/**
 * 获取切割次数对应的难度级别
 * @param cutCount 切割次数
 * @returns 难度级别描述
 */
export const getCutCountDifficultyLevel = (cutCount: number): string => {
  if (cutCount <= 2) return '简单';
  if (cutCount <= 4) return '中等';
  if (cutCount <= 6) return '困难';
  return '极难';
};

/**
 * 角度显示模式更新器实现
 */
export const AngleDisplayModeUpdaterImpl: AngleDisplayModeUpdater = {
  updateModeOnCutCountChange,
  createModeUpdateAction,
  shouldClearTemporaryDisplay,
  getTransitionEffect
};

export default AngleDisplayModeUpdaterImpl;