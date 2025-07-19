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
 * @param originalShape 原始形状点集
 * @param oldSize 原始画布尺寸
 * @param newSize 新画布尺寸
 * @param options 适配选项
 * @returns 适配后的形状点集
 */
export function adaptShapeToCanvas(
  originalShape: Point[], 
  oldSize: CanvasSize, 
  newSize: CanvasSize,
  options: AdaptationOptions = {}
): Point[] {
  try {
    // 默认选项
    const {
      maxRetries = 3,
      safetyMargin = 10,
      enforceAspectRatio = true,
      debug = false,
      forceAdapt = false,
      useMemorySystem = false,
      memoryManager,
      shapeMemoryId
    } = options;
    
    // 如果启用记忆系统且提供了必要参数，尝试使用记忆适配
    if (useMemorySystem && memoryManager && shapeMemoryId) {
      try {
        if (debug) {
          console.log('[混合适配] 尝试使用记忆系统适配');
        }
        
        // 注意：这里需要处理异步调用，但当前函数是同步的
        // 在实际使用中，建议直接使用 adaptShapeWithMemory 函数
        console.warn('[混合适配] 记忆系统需要异步调用，建议直接使用 adaptShapeWithMemory 函数');
      } catch (memoryError) {
        if (debug) {
          console.log('[混合适配] 记忆系统失败，回退到传统方法:', memoryError);
        }
      }
    }
    
    // 输入验证 - 增强版
    if (!originalShape) {
      console.warn('adaptShapeToCanvas: 形状数据为null或undefined');
      return [];
    }
    
    if (!Array.isArray(originalShape)) {
      console.warn('adaptShapeToCanvas: 形状数据不是数组');
      return [];
    }
    
    if (originalShape.length === 0) {
      console.warn('adaptShapeToCanvas: 形状数据为空数组');
      return [];
    }
    
    if (!oldSize) {
      console.warn('adaptShapeToCanvas: 原始画布尺寸为null或undefined');
      return originalShape;
    }
    
    if (!newSize) {
      console.warn('adaptShapeToCanvas: 新画布尺寸为null或undefined');
      return originalShape;
    }
    
    if (typeof oldSize.width !== 'number' || typeof oldSize.height !== 'number') {
      console.warn('adaptShapeToCanvas: 原始画布尺寸不是数字');
      return originalShape;
    }
    
    if (typeof newSize.width !== 'number' || typeof newSize.height !== 'number') {
      console.warn('adaptShapeToCanvas: 新画布尺寸不是数字');
      return originalShape;
    }
    
    if (oldSize.width <= 0 || oldSize.height <= 0) {
      console.warn('adaptShapeToCanvas: 原始画布尺寸必须大于0');
      return originalShape;
    }
    
    if (newSize.width <= 0 || newSize.height <= 0) {
      console.warn('adaptShapeToCanvas: 新画布尺寸必须大于0');
      return originalShape;
    }
    
    // 如果尺寸相同且不强制适配，则跳过适配
    if (oldSize.width === newSize.width && oldSize.height === newSize.height && !forceAdapt) {
      if (debug) console.log('adaptShapeToCanvas: 画布尺寸相同，跳过适配');
      return originalShape;
    }
    
    if (debug) {
      if (oldSize.width === newSize.width && oldSize.height === newSize.height) {
        console.log('adaptShapeToCanvas: 画布尺寸相同，但强制执行适配');
      } else {
        console.log(`adaptShapeToCanvas: 画布尺寸从 ${oldSize.width}x${oldSize.height} 变为 ${newSize.width}x${newSize.height}`);
      }
    }
    
    // 验证所有点都有有效的x和y坐标
    const hasInvalidPoints = originalShape.some(point => 
      typeof point.x !== 'number' || 
      typeof point.y !== 'number' || 
      !isFinite(point.x) || 
      !isFinite(point.y)
    );
    
    if (hasInvalidPoints) {
      console.warn('adaptShapeToCanvas: 形状包含无效的点坐标');
      return originalShape;
    }

    // 重试机制
    let retryCount = 0;
    let adaptedShape = originalShape;
    let success = false;

    while (!success && retryCount < maxRetries) {
      try {
        // 🎯 新的精确适配算法
        // 步骤1: 计算形状的当前边界和中心
        const shapeBounds = originalShape.reduce(
          (acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            maxX: Math.max(acc.maxX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
        );
        
        // 步骤2: 计算形状的当前尺寸和中心点
        const currentWidth = shapeBounds.maxX - shapeBounds.minX;
        const currentHeight = shapeBounds.maxY - shapeBounds.minY;
        const currentDiameter = Math.max(currentWidth, currentHeight);
        const currentCenterX = (shapeBounds.minX + shapeBounds.maxX) / 2;
        const currentCenterY = (shapeBounds.minY + shapeBounds.maxY) / 2;
        
        // 步骤3: 计算目标画布的参数
        const targetCanvasMinEdge = Math.min(newSize.width, newSize.height);
        const targetDiameter = targetCanvasMinEdge * 0.3; // 30%比例
        const targetCenterX = newSize.width / 2;
        const targetCenterY = newSize.height / 2;
        
        // 步骤4: 计算精确的缩放比例
        let scale = 1;
        if (currentDiameter > 0) {
          scale = targetDiameter / currentDiameter;
        } else {
          // 如果无法计算当前直径，使用默认缩放
          scale = targetDiameter / 100; // 假设默认形状直径为100
        }
        
        // 验证缩放比例的有效性
        if (!isFinite(scale) || scale <= 0) {
          throw new Error(`无效的缩放比例: ${scale}`);
        }
        
        if (debug) {
          console.log(`🎯 精确适配计算:`);
          console.log(`  形状边界: (${shapeBounds.minX.toFixed(1)}, ${shapeBounds.minY.toFixed(1)}) - (${shapeBounds.maxX.toFixed(1)}, ${shapeBounds.maxY.toFixed(1)})`);
          console.log(`  当前尺寸: ${currentWidth.toFixed(1)} x ${currentHeight.toFixed(1)}`);
          console.log(`  当前直径: ${currentDiameter.toFixed(1)}px`);
          console.log(`  当前中心: (${currentCenterX.toFixed(1)}, ${currentCenterY.toFixed(1)})`);
          console.log(`  目标画布: ${newSize.width}x${newSize.height}`);
          console.log(`  目标直径: ${targetDiameter.toFixed(1)}px (${targetCanvasMinEdge} * 30%)`);
          console.log(`  目标中心: (${targetCenterX.toFixed(1)}, ${targetCenterY.toFixed(1)})`);
          console.log(`  缩放比例: ${scale.toFixed(4)}`);
        }
        
        if (debug) {
          console.log(`适配参数: 旧尺寸=${oldSize.width}x${oldSize.height}, 新尺寸=${newSize.width}x${newSize.height}`);
          console.log(`缩放比例: X=${scaleX}, Y=${scaleY}, 最终=${scale}`);
          console.log(`中心点: 旧=(${oldCenterX}, ${oldCenterY}), 新=(${newCenterX}, ${newCenterY})`);
        }
        
        // 步骤5: 精确变换所有形状点
        adaptedShape = originalShape.map((point: Point, index: number) => {
          // 检查原始点坐标是否有效
          if (!isFinite(point.x) || !isFinite(point.y)) {
            throw new Error(`点 #${index} 坐标无效: (${point.x}, ${point.y})`);
          }
          
          // 🎯 新的变换算法：
          // 1. 计算点相对于形状中心的位置
          const relativeX = point.x - currentCenterX;
          const relativeY = point.y - currentCenterY;
          
          // 2. 应用缩放
          const scaledX = relativeX * scale;
          const scaledY = relativeY * scale;
          
          // 3. 重新定位到目标画布中心
          const newX = targetCenterX + scaledX;
          const newY = targetCenterY + scaledY;
          
          // 检查新坐标是否有效
          if (!isFinite(newX) || !isFinite(newY)) {
            throw new Error(`计算出的新坐标无效: 点 #${index}, (${newX}, ${newY})`);
          }
          
          if (debug && index === 0) {
            console.log(`  点变换示例 (点#${index}):`);
            console.log(`    原始坐标: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
            console.log(`    相对位置: (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)})`);
            console.log(`    缩放后: (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})`);
            console.log(`    最终坐标: (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
          }
          
          return {
            ...point,
            x: newX,
            y: newY,
          };
        });

        // 验证适配后的形状是否有效
        const hasValidPoints = adaptedShape.every(point => 
          isFinite(point.x) && isFinite(point.y)
        );
        
        if (!hasValidPoints) {
          throw new Error('适配后的形状包含无效坐标');
        }
        
        // 步骤6: 验证适配结果
        const finalBounds = adaptedShape.reduce(
          (acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            maxX: Math.max(acc.maxX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
        );
        
        const finalWidth = finalBounds.maxX - finalBounds.minX;
        const finalHeight = finalBounds.maxY - finalBounds.minY;
        const finalDiameter = Math.max(finalWidth, finalHeight);
        const finalCenterX = (finalBounds.minX + finalBounds.maxX) / 2;
        const finalCenterY = (finalBounds.minY + finalBounds.maxY) / 2;
        const actualRatio = finalDiameter / targetCanvasMinEdge;
        
        // 检查是否在安全边界内
        const isInBounds = 
          finalBounds.minX >= safetyMargin &&
          finalBounds.maxX <= newSize.width - safetyMargin &&
          finalBounds.minY >= safetyMargin &&
          finalBounds.maxY <= newSize.height - safetyMargin;
        
        // 检查尺寸比例是否接近目标（允许5%误差）
        const ratioError = Math.abs(actualRatio - 0.3);
        const isCorrectSize = ratioError <= 0.05;
        
        // 检查是否居中（允许2像素误差）
        const centerOffsetX = Math.abs(finalCenterX - targetCenterX);
        const centerOffsetY = Math.abs(finalCenterY - targetCenterY);
        const isCentered = centerOffsetX <= 2 && centerOffsetY <= 2;
        
        if (debug) {
          console.log(`🔍 适配结果验证:`);
          console.log(`  最终边界: (${finalBounds.minX.toFixed(1)}, ${finalBounds.minY.toFixed(1)}) - (${finalBounds.maxX.toFixed(1)}, ${finalBounds.maxY.toFixed(1)})`);
          console.log(`  最终尺寸: ${finalWidth.toFixed(1)} x ${finalHeight.toFixed(1)}`);
          console.log(`  最终直径: ${finalDiameter.toFixed(1)}px`);
          console.log(`  最终中心: (${finalCenterX.toFixed(1)}, ${finalCenterY.toFixed(1)})`);
          console.log(`  实际比例: ${(actualRatio * 100).toFixed(1)}% (目标: 30%)`);
          console.log(`  中心偏移: (${centerOffsetX.toFixed(1)}, ${centerOffsetY.toFixed(1)})`);
          console.log(`  边界检查: ${isInBounds ? '✅' : '❌'}`);
          console.log(`  尺寸检查: ${isCorrectSize ? '✅' : '❌'} (误差: ${(ratioError * 100).toFixed(1)}%)`);
          console.log(`  居中检查: ${isCentered ? '✅' : '❌'}`);
        }
        
        if (!isInBounds) {
          throw new Error(`形状超出画布边界: 边界=(${finalBounds.minX.toFixed(1)}, ${finalBounds.minY.toFixed(1)}, ${finalBounds.maxX.toFixed(1)}, ${finalBounds.maxY.toFixed(1)}), 画布=${newSize.width}x${newSize.height}`);
        }
        
        if (!isCorrectSize && retryCount === 0) {
          throw new Error(`形状尺寸不正确: 实际比例=${(actualRatio * 100).toFixed(1)}%, 目标=30%, 误差=${(ratioError * 100).toFixed(1)}%`);
        }
        
        // 如果一切正常，标记成功
        success = true;
        
      } catch (error) {
        console.error(`adaptShapeToCanvas: 重试 #${retryCount + 1} 失败:`, error);
        retryCount++;
        
        // 调整策略，尝试不同的适配方法
        if (retryCount === 1) {
          // 第一次失败，尝试不保持宽高比
          options.enforceAspectRatio = false;
        } else if (retryCount === 2) {
          // 第二次失败，尝试使用更大的安全边距
          options.safetyMargin = Math.max(safetyMargin * 2, 20);
        }
      }
    }

    if (!success) {
      console.error('adaptShapeToCanvas: 所有重试都失败，返回原始形状');
      return originalShape;
    }

    if (debug) {
      console.log(`形状适配成功: ${originalShape.length}个点从 ${oldSize.width}x${oldSize.height} 适配到 ${newSize.width}x${newSize.height}`);
    }

    return adaptedShape;
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
            console.log('[统一适配] 创建记忆失败，使用传统方法:', createError);
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
            console.log('[统一适配] 创建记忆失败，使用传统方法:', createError);
          }
          currentMemoryId = null; // 重置ID，使用传统方法
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
            console.log('[统一适配] 记忆适配失败，回退到传统方法:', memoryError);
          }
        }
      }
    }
    
    // 回退到传统适配方法
    if (debug) {
      console.log('[统一适配] 使用传统适配方法');
    }
    
    return adaptShapeToCanvas(originalShape, oldSize, newSize, {
      debug,
      ...restOptions
    });
    
  } catch (error) {
    console.error('[统一适配] 适配失败:', error);
    throw error;
  }
}