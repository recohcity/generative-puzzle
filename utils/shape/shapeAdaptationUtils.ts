import { Point } from '@/types/puzzleTypes';
// 已删除MemoryManager模块，移除导入

/**
 * 形状适配工具函数
 * 提供形状坐标的归一化、反归一化和适配功能
 * 
 * 新增记忆适配模式：
 * - 支持基于记忆系统的智能适配
 * - 自动回退到传统适配方法
 * - 保持向后兼容性
 */

export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * 适配选项接口
 */
export interface AdaptationOptions {
  maxRetries?: number;
  safetyMargin?: number;
  enforceAspectRatio?: boolean;
  debug?: boolean;
  forceAdapt?: boolean;
  useMemorySystem?: boolean; // 新增：是否使用记忆系统（已禁用）
  shapeMemoryId?: string; // 新增：形状记忆ID
}

/**
 * 基于记忆系统的形状适配（异步版本）
 * @param memoryManager 记忆管理器实例
 * @param shapeMemoryId 形状记忆ID
 * @param targetSize 目标画布尺寸
 * @param options 适配选项
 * @returns 适配后的形状点集
 */
export async function adaptShapeWithMemory(
  // memoryManager: MemoryManager, // 已删除
  shapeMemoryId: string,
  targetSize: CanvasSize,
  options: AdaptationOptions = {}
): Promise<Point[]> {
  try {
    const { debug = false } = options;

    if (debug) {
      // 开始适配形状
    }

    // 简化版本：返回空数组（因为没有originalShape参数）
    const adaptedShape = { points: [], adaptationMetrics: {} };

    if (debug) {
      // 适配完成
    }

    return adaptedShape.points;
  } catch (error) {
    console.error('[记忆适配] 适配失败:', error);
    throw error;
  }
}

/**
 * 将形状从一个画布尺寸适配到另一个画布尺寸
 * 
 * 注意：此函数已被统一适配引擎替代，保留此函数是为了向后兼容
 * 推荐使用 adaptShapeUnified 函数，它会自动使用统一适配引擎
 * 
 * @param originalShape 原始形状点集
 * @param oldSize 原始画布尺寸
 * @param newSize 新画布尺寸
 * @param options 适配选项
 * @returns 适配后的形状点集
 * @deprecated 使用 adaptShapeUnified 替代
 */
export function adaptShapeToCanvas(
  originalShape: Point[],
  oldSize: CanvasSize,
  newSize: CanvasSize,
  options: AdaptationOptions = {}
): Point[] {
  try {
    const { debug = false } = options;

    if (debug) {
      // 此函数已被弃用，正在使用统一适配引擎替代
    }

    // 基本输入验证
    if (!originalShape || !Array.isArray(originalShape) || originalShape.length === 0) {
      console.warn('adaptShapeToCanvas: 形状数据无效');
      return [];
    }

    if (!oldSize || !newSize ||
      oldSize.width <= 0 || oldSize.height <= 0 ||
      newSize.width <= 0 || newSize.height <= 0) {
      console.warn('adaptShapeToCanvas: 画布尺寸无效');
      return originalShape;
    }

    // 使用新的全局统一适配引擎
    try {
      const { AdaptationEngine } = require('../../core/AdaptationEngine');
      const adaptationEngine = AdaptationEngine.getInstance();

      const result = adaptationEngine.adaptShape(
        originalShape,
        oldSize,
        newSize
      );

      if (result.success && result.data) {
        if (debug) {
          // 全局适配引擎适配成功
        }
        return result.data;
      } else {
        console.error('[adaptShapeToCanvas] 统一适配引擎适配失败:', result.error);
        return originalShape;
      }
    } catch (error) {
      console.error('[adaptShapeToCanvas] 统一适配引擎异常:', error);
      return originalShape;
    }
  } catch (error) {
    console.error('adaptShapeToCanvas: 发生未预期的错误:', error);
    return originalShape;
  }
}

/**
 * 将形状居中到指定画布尺寸
 * @param shape 形状点集
 * @param canvasSize 画布尺寸
 * @param options 居中选项
 * @returns 居中后的形状点集
 */
export function centerShapeInCanvas(
  shape: Point[],
  canvasSize: CanvasSize,
  options: { debug?: boolean, forceExactCenter?: boolean } = {}
): Point[] {
  if (!shape || shape.length === 0) {
    return shape;
  }

  try {
    const { debug = false, forceExactCenter = true } = options;

    // 计算形状的边界框
    const bounds = shape.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    // 计算形状当前的中心点
    const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
    const shapeCenterY = (bounds.minY + bounds.maxY) / 2;

    // 计算画布中心点
    const canvasCenterX = canvasSize.width / 2;
    const canvasCenterY = canvasSize.height / 2;

    // 计算偏移量
    const offsetX = canvasCenterX - shapeCenterX;
    const offsetY = canvasCenterY - shapeCenterY;

    if (debug) {
      console.log(`居中计算: 画布尺寸=${canvasSize.width}x${canvasSize.height}, 画布中心=(${canvasCenterX}, ${canvasCenterY})`);
      console.log(`居中计算: 形状边界=(${bounds.minX}, ${bounds.minY}, ${bounds.maxX}, ${bounds.maxY}), 形状中心=(${shapeCenterX}, ${shapeCenterY})`);
      console.log(`居中计算: 偏移量=(${offsetX}, ${offsetY})`);
    }

    // 确保偏移量是整数，避免小数点导致的不精确居中
    const finalOffsetX = forceExactCenter ? Math.round(offsetX) : offsetX;
    const finalOffsetY = forceExactCenter ? Math.round(offsetY) : offsetY;

    // 应用偏移
    return shape.map(point => ({
      ...point,
      x: point.x + finalOffsetX,
      y: point.y + finalOffsetY,
    }));

  } catch (error) {
    console.error('centerShapeInCanvas: 居中失败:', error);
    return shape;
  }
}

/**
 * 缩放形状到指定尺寸，保持宽高比
 * @param shape 形状点集
 * @param targetSize 目标尺寸（形状的最大宽度或高度）
 * @param canvasSize 画布尺寸（用于居中）
 * @returns 缩放并居中后的形状点集
 */
export function scaleShapeToSize(
  shape: Point[],
  targetSize: number,
  canvasSize: CanvasSize
): Point[] {
  if (!shape || shape.length === 0) {
    return shape;
  }

  try {
    // 计算形状的边界框
    const bounds = shape.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    // 计算当前形状的尺寸
    const currentWidth = bounds.maxX - bounds.minX;
    const currentHeight = bounds.maxY - bounds.minY;
    const currentMaxSize = Math.max(currentWidth, currentHeight);

    if (currentMaxSize <= 0) {
      return shape;
    }

    // 计算缩放比例
    const scale = targetSize / currentMaxSize;

    // 计算形状当前的中心点
    const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
    const shapeCenterY = (bounds.minY + bounds.maxY) / 2;

    // 计算画布中心点
    const canvasCenterX = canvasSize.width / 2;
    const canvasCenterY = canvasSize.height / 2;

    // 缩放并居中
    return shape.map(point => {
      // 相对于形状中心的坐标
      const relativeX = point.x - shapeCenterX;
      const relativeY = point.y - shapeCenterY;

      // 应用缩放
      const scaledX = relativeX * scale;
      const scaledY = relativeY * scale;

      // 重新定位到画布中心
      return {
        ...point,
        x: canvasCenterX + scaledX,
        y: canvasCenterY + scaledY,
      };
    });

  } catch (error) {
    console.error('scaleShapeToSize: 缩放失败:', error);
    return shape;
  }
}

/**
 * 检查形状是否在画布边界内
 * @param shape 形状点集
 * @param canvasSize 画布尺寸
 * @param margin 边距（可选）
 * @returns 是否在边界内
 */
export function isShapeInBounds(
  shape: Point[],
  canvasSize: CanvasSize,
  margin: number = 0
): boolean {
  if (!shape || shape.length === 0) {
    return true;
  }

  try {
    const bounds = shape.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    return bounds.minX >= margin &&
      bounds.maxX <= canvasSize.width - margin &&
      bounds.minY >= margin &&
      bounds.maxY <= canvasSize.height - margin;

  } catch (error) {
    console.error('isShapeInBounds: 边界检查失败:', error);
    return false;
  }
}
/**
 * 
统一形状适配函数 - 自动选择最佳适配方法
 * @param originalShape 原始形状点集
 * @param oldSize 原始画布尺寸
 * @param newSize 新画布尺寸
 * @param options 适配选项
 * @returns 适配后的形状点集（Promise）
 */
export async function adaptShapeUnified(
  originalShape: Point[],
  oldSize: CanvasSize,
  newSize: CanvasSize,
  options: AdaptationOptions & {
    // memoryManager?: MemoryManager; // 已删除
    shapeMemoryId?: string;
    createMemoryIfNeeded?: boolean;
  } = {}
): Promise<Point[]> {
  const {
    debug = false,
    // memoryManager, // 已删除
    shapeMemoryId,
    createMemoryIfNeeded = true,
    ...restOptions
  } = options;

  try {
    // 记忆系统已禁用，直接使用简化适配

    // Step3清理：移除对传统适配方法的回退，直接使用统一适配引擎
    if (debug) {
      // 传统适配方法已被移除，使用统一适配引擎
    }

    // 🎯 监督指令合规：使用SimpleAdapter替换复杂适配引擎
    try {
      const { adaptAllElements } = await import('../SimpleAdapter');
      const adaptedShape = adaptAllElements(originalShape, oldSize, newSize);
      
      if (debug) {
        // SimpleAdapter适配成功
      }
      
      return adaptedShape;
    } catch (error) {
      console.error('[统一适配] SimpleAdapter适配异常:', error);
      return originalShape; // 异常时返回原始形状
    }

  } catch (error) {
    console.error('[统一适配] 适配失败:', error);
    throw error;
  }
}