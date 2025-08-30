/**
 * SimpleAdapter - 统一适配器
 * 极简跨设备适配实现
 */

// 基础类型定义
interface Size {
  width: number;
  height: number;
}

interface Scalable {
  x: number;
  y: number;
  points?: Array<{ x: number; y: number;[key: string]: unknown }>;
  originalX?: number;
  originalY?: number;
  rotation?: number;
  originalRotation?: number;
  color?: string;
  isCompleted?: boolean;
  [key: string]: unknown; // 保持其他属性不变，使用unknown替代any
}

// Point接口已在其他地方定义，移除重复定义

/**
 * 🎯 以画布中心为原点的缩放算法 - 核心适配引擎
 * 
 * 算法原理：
 * 1. 计算缩放比例：基于画布最小边长确保形状不变形
 * 2. 中心点对齐：将所有元素相对于旧画布中心的偏移量按比例缩放
 * 3. 重新定位：将缩放后的偏移量应用到新画布中心
 * 
 * 这种方法确保：
 * - 形状在缩放后保持居中
 * - 相对位置关系不变
 * - 避免因画布尺寸变化导致的偏移问题
 * 
 * @param elements 需要适配的元素数组
 * @param fromSize 原始画布尺寸
 * @param toSize 目标画布尺寸
 * @returns 适配后的元素数组
 */
function scaleFromCanvasCenter<T extends Scalable>(
  elements: T[],
  fromSize: Size,
  toSize: Size
): T[] {
  if (elements.length === 0) return elements;

  // 🔑 步骤1：计算缩放比例
  // 使用最小边长确保形状在任何画布比例下都不会变形
  const fromCanvasSize = Math.min(fromSize.width, fromSize.height);
  const toCanvasSize = Math.min(toSize.width, toSize.height);
  const scale = toCanvasSize / fromCanvasSize;

  // 🔑 步骤2：计算画布中心点坐标
  // 这些中心点将作为缩放的参考原点
  const fromCenterX = fromSize.width / 2;
  const fromCenterY = fromSize.height / 2;
  const toCenterX = toSize.width / 2;
  const toCenterY = toSize.height / 2;

  // 🔑 步骤3：对每个元素应用中心缩放变换
  return elements.map((element, index) => {
    // 3.1 计算元素相对于旧画布中心的偏移量
    // 这个偏移量表示元素距离画布中心的相对位置
    const offsetX = element.x - fromCenterX;
    const offsetY = element.y - fromCenterY;

    // 3.2 应用缩放变换并重新定位到新画布中心
    // 公式：新位置 = 新中心 + (旧偏移 × 缩放比例)
    const newX = toCenterX + offsetX * scale;
    const newY = toCenterY + offsetY * scale;

    // 3.3 对元素的所有点应用相同的缩放变换
    // 确保形状的每个顶点都按相同比例和中心进行缩放
    const newPoints = element.points?.map(point => {
      // 计算点相对于旧画布中心的偏移
      const pointOffsetX = point.x - fromCenterX;
      const pointOffsetY = point.y - fromCenterY;

      // 应用缩放并重新定位到新画布中心
      return {
        ...point,
        x: toCenterX + pointOffsetX * scale,
        y: toCenterY + pointOffsetY * scale
      };
    });

    return {
      ...element,
      x: newX,
      y: newY,
      points: newPoints,
      originalX: newX,
      originalY: newY
    };
  });
}

/**
 * 🎯 主适配函数 - 以画布中心为原点缩放
 */
function adaptAllElements<T extends Scalable>(
  elements: T[],
  fromSize: Size,
  toSize: Size
): T[] {
  // 尺寸无变化时跳过适配
  if (fromSize.width === toSize.width && fromSize.height === toSize.height) {
    return elements;
  }

  return scaleFromCanvasCenter(elements, fromSize, toSize);
}

/**
 * 单元素适配函数
 */
function scaleElement<T extends Scalable>(
  element: T,
  fromSize: Size,
  toSize: Size
): T {
  return adaptAllElements([element], fromSize, toSize)[0] || element;
}

// 导出核心函数
export { scaleElement, adaptAllElements };
export type { Size, Scalable };