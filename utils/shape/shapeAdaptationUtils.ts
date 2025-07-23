import { Point } from '@/types/puzzleTypes';
import { MemoryManager } from '@/utils/memory/MemoryManager';

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
  useMemorySystem?: boolean; // 新增：是否使用记忆系统
  memoryManager?: MemoryManager; // 新增：记忆管理器实例
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
  memoryManager: MemoryManager,
  shapeMemoryId: string,
  targetSize: CanvasSize,
  options: AdaptationOptions = {}
): Promise<Point[]> {
  try {
    const { debug = false } = options;
    
    if (debug) {
      console.log(`[记忆适配] 开始适配形状: ${shapeMemoryId} -> ${targetSize.width}x${targetSize.height}`);
    }
    
    const adaptedShape = await memoryManager.adaptShapeToCanvas(shapeMemoryId, targetSize);
    
    if (debug) {
      console.log(`[记忆适配] 适配完成:`, {
        pointsCount: adaptedShape.points.length,
        metrics: adaptedShape.adaptationMetrics
      });
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
      console.log('[adaptShapeToCanvas] 此函数已被弃用，正在使用统一适配引擎替代');
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
    
    // 使用统一适配引擎
    try {
      const { unifiedAdaptationEngine } = require('../adaptation/UnifiedAdaptationEngine');
      
      const adaptationConfig = {
        type: 'shape',
        originalData: originalShape,
        originalCanvasSize: oldSize,
        targetCanvasSize: newSize,
        options: {
          debugMode: debug,
          ...options
        }
      };
      
      const result = unifiedAdaptationEngine.adapt(adaptationConfig);
      
      if (result.success) {
        if (debug) {
          console.log('[adaptShapeToCanvas] 统一适配引擎适配成功');
        }
        return result.adaptedData;
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
    memoryManager?: MemoryManager;
    shapeMemoryId?: string;
    createMemoryIfNeeded?: boolean;
  } = {}
): Promise<Point[]> {
  const {
    debug = false,
    memoryManager,
    shapeMemoryId,
    createMemoryIfNeeded = true,
    ...restOptions
  } = options;

  try {
    // 尝试使用记忆系统
    if (memoryManager) {
      let currentMemoryId = shapeMemoryId;
      
      // 如果没有记忆ID但需要创建，先创建记忆
      if (!currentMemoryId && createMemoryIfNeeded && originalShape.length > 0) {
        try {
          if (debug) {
            console.log('[统一适配] 创建形状记忆');
          }
          
          // 使用提供的ID或生成新的ID
          const memoryId = shapeMemoryId || `unified_${Date.now()}`;
          currentMemoryId = await memoryManager.createShapeMemory(
            originalShape,
            oldSize,
            memoryId
          );
          
          if (debug) {
            console.log('[统一适配] 形状记忆创建成功:', currentMemoryId);
          }
        } catch (createError) {
          if (debug) {
            console.log('[统一适配] 创建记忆失败，使用统一适配引擎:', createError);
          }
        }
      }
      
      // 如果提供了记忆ID但记忆不存在，且允许创建，则创建记忆
      if (currentMemoryId && createMemoryIfNeeded && originalShape.length > 0) {
        try {
          // 检查记忆是否存在
          const memoryStatus = memoryManager.getMemoryStatus(currentMemoryId);
          if (!memoryStatus) {
            if (debug) {
              console.log('[统一适配] 记忆不存在，创建新记忆:', currentMemoryId);
            }
            
            await memoryManager.createShapeMemory(
              originalShape,
              oldSize,
              currentMemoryId
            );
            
            if (debug) {
              console.log('[统一适配] 记忆创建成功:', currentMemoryId);
            }
          }
        } catch (createError) {
          if (debug) {
            console.log('[统一适配] 创建记忆失败，使用统一适配引擎:', createError);
          }
          currentMemoryId = null; // 重置ID，使用统一适配引擎
        }
      }
      
      // 如果有记忆ID，尝试使用记忆适配
      if (currentMemoryId) {
        try {
          const adaptedPoints = await adaptShapeWithMemory(
            memoryManager,
            currentMemoryId,
            newSize,
            { debug, ...restOptions }
          );
          
          if (debug) {
            console.log('[统一适配] 记忆适配成功');
          }
          
          return adaptedPoints;
        } catch (memoryError) {
          if (debug) {
            console.log('[统一适配] 记忆适配失败，使用统一适配引擎:', memoryError);
          }
        }
      }
    }
    
    // Step3清理：移除对传统适配方法的回退，直接使用统一适配引擎
    if (debug) {
      console.log('[统一适配] 传统适配方法已被移除，使用统一适配引擎');
    }
    
    // 使用统一适配引擎
    const adaptationConfig = {
      type: 'shape',
      originalData: originalShape,
      originalCanvasSize: oldSize,
      targetCanvasSize: newSize,
      options: {
        debugMode: debug,
        ...restOptions
      }
    };
    
    try {
      // 导入统一适配引擎
      const { unifiedAdaptationEngine } = require('../adaptation/UnifiedAdaptationEngine');
      const result = unifiedAdaptationEngine.adapt(adaptationConfig);
      
      if (result.success) {
        return result.adaptedData;
      } else {
        console.error('[统一适配] 统一适配引擎失败:', result.error);
        return originalShape; // 失败时返回原始形状
      }
    } catch (error) {
      console.error('[统一适配] 统一适配引擎异常:', error);
      return originalShape; // 异常时返回原始形状
    }
    
  } catch (error) {
    console.error('[统一适配] 适配失败:', error);
    throw error;
  }
}