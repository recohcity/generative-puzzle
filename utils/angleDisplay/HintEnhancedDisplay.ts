/**
 * 提示增强显示工具
 * 管理提示功能的角度显示增强
 */

export interface HintEnhancedDisplay {
  activateHintWithAngle(pieceId: number, cutCount: number): { shouldShowAngle: boolean; duration: number };
  deactivateHintWithAngle(pieceId: number): { pieceId: number };
  isAngleTemporaryVisible(pieceId: number, temporaryVisible: Set<number>): boolean;
  getHintDuration(cutCount: number): number;
}

/**
 * 激活提示并显示角度
 * @param pieceId 拼图片段ID
 * @param cutCount 切割次数
 * @returns 是否应该显示角度和持续时间
 */
export const activateHintWithAngle = (
  pieceId: number, 
  cutCount: number
): { shouldShowAngle: boolean; duration: number } => {
  // 1-3次切割：不需要特殊处理，角度本来就显示
  if (cutCount <= 3) {
    return { shouldShowAngle: false, duration: 0 };
  }
  
  // 4-8次切割：需要临时显示角度
  return { shouldShowAngle: true, duration: 3000 }; // 3秒后隐藏
};

/**
 * 取消提示角度显示
 * @param pieceId 拼图片段ID
 * @returns 取消参数
 */
export const deactivateHintWithAngle = (pieceId: number): { pieceId: number } => {
  return { pieceId };
};

/**
 * 检查角度是否临时可见
 * @param pieceId 拼图片段ID
 * @param temporaryVisible 临时显示角度的拼图ID集合
 * @returns 是否临时可见
 */
export const isAngleTemporaryVisible = (
  pieceId: number, 
  temporaryVisible: Set<number>
): boolean => {
  return temporaryVisible.has(pieceId);
};

/**
 * 获取提示持续时间
 * @param cutCount 切割次数
 * @returns 持续时间（毫秒）
 */
export const getHintDuration = (cutCount: number): number => {
  // 根据难度调整持续时间
  if (cutCount <= 3) {
    return 0; // 不需要临时显示
  } else if (cutCount <= 5) {
    return 3000; // 3秒
  } else {
    return 4000; // 4秒，高难度给更多时间
  }
};

/**
 * 检查是否需要角度增强
 * @param cutCount 切割次数
 * @returns 是否需要增强
 */
export const needsAngleEnhancement = (cutCount: number): boolean => {
  return cutCount > 3;
};

/**
 * 提示增强显示实现
 */
export const HintEnhancedDisplayImpl: HintEnhancedDisplay = {
  activateHintWithAngle,
  deactivateHintWithAngle,
  isAngleTemporaryVisible,
  getHintDuration
};

export default HintEnhancedDisplayImpl;