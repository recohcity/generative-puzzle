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
  points?: Array<{ x: number; y: number; [key: string]: unknown }>;
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
 * 🎯 以画布中心为原点的缩放 - 修复偏移问题
 * 确保缩放时形状始终保持居中
 */
function scaleFromCanvasCenter<T extends Scalable>(
  elements: T[],
  fromSize: Size,
  toSize: Size
): T[] {
  if (elements.length === 0) return elements;

  // 🔑 关键：画布是正方形，缩放因子基于边长
  const fromCanvasSize = Math.min(fromSize.width, fromSize.height);
  const toCanvasSize = Math.min(toSize.width, toSize.height);
  const scale = toCanvasSize / fromCanvasSize;

  // 🔑 关键修复：计算旧画布和新画布的中心点
  const fromCenterX = fromSize.width / 2;
  const fromCenterY = fromSize.height / 2;
  const toCenterX = toSize.width / 2;
  const toCenterY = toSize.height / 2;

  // 缩放参数计算完成

  // 🔑 正确的缩放公式：以画布中心为原点缩放
  return elements.map((element, index) => {
    // 计算相对于旧画布中心的偏移
    const offsetX = element.x - fromCenterX;
    const offsetY = element.y - fromCenterY;

    // 缩放偏移量，然后重新定位到新画布中心
    const newX = toCenterX + offsetX * scale;
    const newY = toCenterY + offsetY * scale;

    // 元素变换计算完成

    const newPoints = element.points?.map(point => {
      const pointOffsetX = point.x - fromCenterX;
      const pointOffsetY = point.y - fromCenterY;
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