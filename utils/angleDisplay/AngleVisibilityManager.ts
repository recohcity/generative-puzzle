/**
 * 角度可见性管理器
 * 统一管理角度显示的可见性逻辑
 */

export enum AngleDisplayState {
  ALWAYS_VISIBLE = 'always',
  HIDDEN = 'hidden',
  TEMPORARY_VISIBLE = 'temporary'
}

export interface AngleVisibilityManager {
  getAngleDisplayState(pieceId: number | null, cutCount: number, showHint: boolean): AngleDisplayState;
  updateVisibilityRule(cutCount: number): 'always' | 'conditional';
  setTemporaryVisible(pieceId: number, duration: number): { pieceId: number; duration: number };
}

/**
 * 获取角度显示状态
 * @param pieceId 拼图片段ID
 * @param cutCount 切割次数
 * @param showHint 是否显示提示
 * @returns 角度显示状态
 */
export const getAngleDisplayState = (
  pieceId: number | null,
  cutCount: number,
  showHint: boolean
): AngleDisplayState => {
  // 如果没有选中拼图，返回隐藏状态
  if (pieceId === null) {
    return AngleDisplayState.HIDDEN;
  }
  
  // 1-3次切割：始终显示
  if (cutCount <= 3) {
    return AngleDisplayState.ALWAYS_VISIBLE;
  }
  
  // 4-8次切割：检查是否显示提示
  if (showHint) {
    return AngleDisplayState.TEMPORARY_VISIBLE;
  }
  
  // 默认隐藏
  return AngleDisplayState.HIDDEN;
};

/**
 * 更新可见性规则
 * @param cutCount 切割次数
 * @returns 新的显示模式
 */
export const updateVisibilityRule = (cutCount: number): 'always' | 'conditional' => {
  return cutCount <= 3 ? 'always' : 'conditional';
};

/**
 * 设置临时可见
 * @param pieceId 拼图片段ID
 * @param duration 持续时间（毫秒）
 * @returns 设置参数
 */
export const setTemporaryVisible = (
  pieceId: number, 
  duration: number = 3000
): { pieceId: number; duration: number } => {
  return { pieceId, duration };
};

/**
 * 角度可见性管理器实现
 */
export const AngleVisibilityManagerImpl: AngleVisibilityManager = {
  getAngleDisplayState,
  updateVisibilityRule,
  setTemporaryVisible
};

export default AngleVisibilityManagerImpl;