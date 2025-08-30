/**
 * 角度显示控制器
 * 根据切割次数和临时显示状态控制角度信息的可见性
 */

export interface AngleDisplayController {
  shouldShowAngle(cutCount: number, pieceId: number | null, showHint: boolean): boolean;
  getDisplayMode(cutCount: number): 'always' | 'conditional';
  isHintTemporaryDisplay(cutCount: number, showHint: boolean): boolean;
}

/**
 * 判断是否应该显示角度
 * @param cutCount 切割次数
 * @param pieceId 拼图片段ID
 * @param temporaryVisible 临时显示角度的拼图ID集合
 * @returns 是否应该显示角度
 */
export const shouldShowAngle = (
  cutCount: number, 
  pieceId: number | null, 
  showHint: boolean
): boolean => {
  // 如果没有选中拼图，不显示角度
  if (pieceId === null) {
    return false;
  }
  
  // 1-3次切割：始终显示
  if (cutCount <= 3) {
    return true;
  }
  
  // 4-8次切割：只有在显示提示时才显示角度
  return showHint;
};

/**
 * 获取角度显示模式
 * @param cutCount 切割次数
 * @returns 显示模式
 */
export const getAngleDisplayMode = (cutCount: number): 'always' | 'conditional' => {
  return cutCount <= 3 ? 'always' : 'conditional';
};

/**
 * 判断是否为提示临时显示
 * @param cutCount 切割次数
 * @param showHint 是否显示提示
 * @returns 是否为临时显示
 */
export const isHintTemporaryDisplay = (
  cutCount: number, 
  showHint: boolean
): boolean => {
  // 只有在4-8次切割且显示提示时才是临时显示
  return cutCount > 3 && showHint;
};

/**
 * 更新角度显示规则
 * @param cutCount 切割次数
 * @returns 新的显示模式
 */
export const updateDisplayRule = (cutCount: number): 'always' | 'conditional' => {
  return getAngleDisplayMode(cutCount);
};

/**
 * 角度显示控制器实现
 */
export const AngleDisplayControllerImpl: AngleDisplayController = {
  shouldShowAngle,
  getDisplayMode: getAngleDisplayMode,
  isHintTemporaryDisplay
};

export default AngleDisplayControllerImpl;