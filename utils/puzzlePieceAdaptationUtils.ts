/**
 * 拼图块适配工具 - Step3核心模块
 * 
 * 实现未散开拼图块跟随目标形状的同步适配功能
 * 基于Step2的形状适配结果，直接应用相同的变换参数到拼图块
 */

import { Point } from '../types/common';
import { PuzzlePiece } from '../types/puzzleTypes';

/**
 * 形状变换参数接口
 */
export interface ShapeTransformation {
  scale: number; // 统一缩放比例
  offsetX: number; // X轴偏移量
  offsetY: number; // Y轴偏移量
  originalCenter: Point; // 原始中心点
  adaptedCenter: Point; // 适配后中心点
}

/**
 * 拼图块适配结果接口
 */
export interface PuzzlePieceAdaptationResult {
  adaptedPieces: PuzzlePiece[]; // 适配后的拼图块
  adaptationScale: number; // 使用的缩放比例
  adaptationCenter: Point; // 适配中心点
  processingTime: number; // 处理时间（性能监控）
}

/**
 * 计算边界框
 */
function calculateBoundingBox(points: Point[]) {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounding box for empty points array');
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y)
    }),
    { 
      minX: points[0].x, 
      maxX: points[0].x, 
      minY: points[0].y, 
      maxY: points[0].y 
    }
  );
}

/**
 * 计算形状适配的变换参数 - 修复版本
 * 基于画布中心计算变换，避免累积误差
 * 
 * @param originalShape 原始形状点数组
 * @param adaptedShape 适配后形状点数组
 * @param originalCanvasSize 原始画布尺寸
 * @param adaptedCanvasSize 适配后画布尺寸
 * @returns 变换参数对象
 */
export function calculateShapeTransformation(
  originalShape: Point[], 
  adaptedShape: Point[],
  originalCanvasSize?: { width: number; height: number },
  adaptedCanvasSize?: { width: number; height: number }
): ShapeTransformation {
  // 输入验证
  if (!originalShape || originalShape.length === 0) {
    throw new Error('Original shape cannot be empty');
  }
  if (!adaptedShape || adaptedShape.length === 0) {
    throw new Error('Adapted shape cannot be empty');
  }
  if (originalShape.length !== adaptedShape.length) {
    throw new Error('Original and adapted shapes must have the same number of points');
  }

  try {
    // 如果提供了画布尺寸，使用画布中心作为基准点
    let originalCenter: Point;
    let adaptedCenter: Point;
    
    if (originalCanvasSize && adaptedCanvasSize) {
      // 使用画布中心作为变换基准点
      originalCenter = {
        x: originalCanvasSize.width / 2,
        y: originalCanvasSize.height / 2
      };
      adaptedCenter = {
        x: adaptedCanvasSize.width / 2,
        y: adaptedCanvasSize.height / 2
      };
    } else {
      // 回退到形状中心（兼容旧版本）
      const originalBounds = calculateBoundingBox(originalShape);
      originalCenter = {
        x: (originalBounds.minX + originalBounds.maxX) / 2,
        y: (originalBounds.minY + originalBounds.maxY) / 2
      };
      
      const adaptedBounds = calculateBoundingBox(adaptedShape);
      adaptedCenter = {
        x: (adaptedBounds.minX + adaptedBounds.maxX) / 2,
        y: (adaptedBounds.minY + adaptedBounds.maxY) / 2
      };
    }
    
    // 计算缩放比例 - 基于画布尺寸而不是形状边界框
    let scale: number;
    
    if (originalCanvasSize && adaptedCanvasSize) {
      // 基于画布尺寸计算缩放比例，确保与目标形状适配一致
      const originalMinEdge = Math.min(originalCanvasSize.width, originalCanvasSize.height);
      const adaptedMinEdge = Math.min(adaptedCanvasSize.width, adaptedCanvasSize.height);
      scale = adaptedMinEdge / originalMinEdge;
    } else {
      // 回退到基于形状边界框的计算
      const originalBounds = calculateBoundingBox(originalShape);
      const adaptedBounds = calculateBoundingBox(adaptedShape);
      
      const originalWidth = originalBounds.maxX - originalBounds.minX;
      const originalHeight = originalBounds.maxY - originalBounds.minY;
      const adaptedWidth = adaptedBounds.maxX - adaptedBounds.minX;
      const adaptedHeight = adaptedBounds.maxY - adaptedBounds.minY;
      
      const safeOriginalWidth = Math.max(originalWidth, 1e-6);
      const safeOriginalHeight = Math.max(originalHeight, 1e-6);
      
      const scaleX = adaptedWidth / safeOriginalWidth;
      const scaleY = adaptedHeight / safeOriginalHeight;
      scale = Math.min(scaleX, scaleY);
    }
    
    // 验证缩放比例的有效性
    if (!isFinite(scale) || scale <= 0) {
      throw new Error(`Invalid scale calculated: ${scale}`);
    }
    
    return {
      scale,
      offsetX: adaptedCenter.x - originalCenter.x,
      offsetY: adaptedCenter.y - originalCenter.y,
      originalCenter,
      adaptedCenter
    };
  } catch (error) {
    console.error('Error calculating shape transformation:', error);
    throw error;
  }
}

/**
 * 验证变换参数的有效性
 */
export function validateTransformation(transformation: ShapeTransformation): boolean {
  if (!transformation) return false;
  
  // 检查缩放比例
  if (!isFinite(transformation.scale) || transformation.scale <= 0) {
    console.warn('Invalid scale in transformation:', transformation.scale);
    return false;
  }
  
  // 检查偏移量
  if (!isFinite(transformation.offsetX) || !isFinite(transformation.offsetY)) {
    console.warn('Invalid offset in transformation:', transformation.offsetX, transformation.offsetY);
    return false;
  }
  
  // 检查中心点
  if (!transformation.originalCenter || !transformation.adaptedCenter) {
    console.warn('Missing center points in transformation');
    return false;
  }
  
  return true;
}

/**
 * 将变换应用到单个点 - 修复版本
 * 使用画布中心作为统一的变换基准点，避免累积误差
 */
function applyTransformationToPoint(
  point: Point, 
  transformation: ShapeTransformation,
  canvasCenter: Point
): Point {
  // 使用画布中心作为变换基准点，确保与目标形状适配一致
  const relativeX = point.x - canvasCenter.x;
  const relativeY = point.y - canvasCenter.y;
  
  return {
    x: canvasCenter.x + relativeX * transformation.scale,
    y: canvasCenter.y + relativeY * transformation.scale
  } as any; // 使用类型断言解决 isOriginal 属性问题
}

/**
 * 将形状变换应用到拼图块 - 修复版本
 * 使用画布中心作为统一变换基准点，避免累积误差
 * 
 * @param pieces 原始拼图块数组
 * @param transformation 变换参数
 * @param canvasCenter 画布中心点
 * @returns 适配后的拼图块数组
 */
export function adaptPuzzlePiecesToShape(
  pieces: PuzzlePiece[],
  transformation: ShapeTransformation,
  canvasCenter: Point
): PuzzlePiece[] {
  // 输入验证
  if (!pieces || pieces.length === 0) {
    console.warn('No puzzle pieces to adapt');
    return pieces;
  }
  
  if (!validateTransformation(transformation)) {
    console.warn('Invalid transformation parameters, returning original pieces');
    return pieces;
  }

  if (!canvasCenter) {
    console.warn('Canvas center not provided, returning original pieces');
    return pieces;
  }

  const startTime = performance.now();

  try {
    const adaptedPieces = pieces.map(piece => {
      // 适配拼图块的所有点
      const adaptedPoints = piece.points.map(point => 
        applyTransformationToPoint(point, transformation, canvasCenter)
      );
      
      // 适配拼图块的中心位置
      const adaptedCenter = applyTransformationToPoint(
        { x: piece.x, y: piece.y }, 
        transformation,
        canvasCenter
      );
      
      return {
        ...piece,
        points: adaptedPoints,
        x: adaptedCenter.x,
        y: adaptedCenter.y,
        // 保持原始角度，未散开的拼图块不涉及旋转
        rotation: 0,
        originalRotation: 0
      };
    });

    const processingTime = performance.now() - startTime;
    
    // 性能监控
    if (processingTime > 5) {
      console.warn(`Puzzle piece adaptation took ${processingTime.toFixed(2)}ms, which exceeds the 5ms target`);
    }

    console.log(`✅ Adapted ${pieces.length} puzzle pieces in ${processingTime.toFixed(2)}ms using canvas center (${canvasCenter.x}, ${canvasCenter.y})`);
    
    return adaptedPieces;
  } catch (error) {
    console.error('Error adapting puzzle pieces:', error);
    return pieces; // 返回原始数据作为兜底
  }
}

/**
 * 批量适配拼图块（带性能优化）- 修复版本
 * 
 * @param pieces 拼图块数组
 * @param transformation 变换参数
 * @param canvasCenter 画布中心点
 * @returns 适配结果
 */
export function adaptPuzzlePiecesBatch(
  pieces: PuzzlePiece[],
  transformation: ShapeTransformation,
  canvasCenter: Point
): PuzzlePieceAdaptationResult {
  const startTime = performance.now();
  
  const adaptedPieces = adaptPuzzlePiecesToShape(pieces, transformation, canvasCenter);
  
  const processingTime = performance.now() - startTime;
  
  return {
    adaptedPieces,
    adaptationScale: transformation.scale,
    adaptationCenter: transformation.adaptedCenter,
    processingTime
  };
}

/**
 * 安全的拼图块适配函数（带完整错误处理）- 修复版本
 * 基于画布尺寸进行精确适配，避免累积误差
 */
export function safeAdaptPuzzlePieces(
  pieces: PuzzlePiece[],
  originalShape: Point[],
  adaptedShape: Point[],
  originalCanvasSize?: { width: number; height: number },
  adaptedCanvasSize?: { width: number; height: number }
): PuzzlePiece[] {
  try {
    // 计算变换参数，使用画布尺寸信息
    const transformation = calculateShapeTransformation(
      originalShape, 
      adaptedShape,
      originalCanvasSize,
      adaptedCanvasSize
    );
    
    // 计算画布中心点
    const canvasCenter = adaptedCanvasSize ? {
      x: adaptedCanvasSize.width / 2,
      y: adaptedCanvasSize.height / 2
    } : transformation.adaptedCenter;
    
    // 执行适配
    return adaptPuzzlePiecesToShape(pieces, transformation, canvasCenter);
  } catch (error) {
    console.error('Safe puzzle piece adaptation failed:', error);
    return pieces; // 返回原始数据作为兜底
  }
}

/**
 * 基于绝对坐标的拼图块适配函数 - 新增
 * 散开拼图块适配 - 基于散开时的画布尺寸进行适配
 * 保持散开拼图块的相对位置关系，避免窗口调整后的严重偏移
 */
export function adaptScatteredPuzzlePieces(
  scatteredPieces: PuzzlePiece[],
  scatterCanvasSize: { width: number; height: number },
  currentCanvasSize: { width: number; height: number }
): PuzzlePiece[] {
  if (!scatteredPieces || scatteredPieces.length === 0) {
    console.warn('⚠️ 散开拼图适配: 拼图块数组为空');
    return scatteredPieces;
  }

  if (!scatterCanvasSize || scatterCanvasSize.width <= 0 || scatterCanvasSize.height <= 0) {
    console.warn('⚠️ 散开拼图适配: 散开画布尺寸无效', scatterCanvasSize);
    return scatteredPieces;
  }

  try {
    // 计算缩放比例 - 使用独立的X和Y缩放，保持拼图块的相对位置
    const scaleX = currentCanvasSize.width / scatterCanvasSize.width;
    const scaleY = currentCanvasSize.height / scatterCanvasSize.height;
    
    // 对于散开的拼图，我们使用简单的比例缩放，不需要居中偏移
    // 因为散开的拼图块应该保持它们在画布中的相对位置关系

    console.log(`🔧 散开拼图适配参数:`, {
      原始画布: `${scatterCanvasSize.width}x${scatterCanvasSize.height}`,
      当前画布: `${currentCanvasSize.width}x${currentCanvasSize.height}`,
      缩放比例X: scaleX.toFixed(3),
      缩放比例Y: scaleY.toFixed(3)
    });

    // 适配每个散开的拼图块
    const adaptedPieces = scatteredPieces.map((piece, index) => {
      // 适配拼图块中心位置 - 使用独立的X和Y缩放
      const adaptedX = piece.x * scaleX;
      const adaptedY = piece.y * scaleY;

      // 适配所有点的坐标
      const adaptedPoints = piece.points.map(point => {
        return {
          ...point,
          x: point.x * scaleX,
          y: point.y * scaleY
        };
      });

      const adaptedPiece = {
        ...piece,
        x: adaptedX,
        y: adaptedY,
        points: adaptedPoints,
        // 保持旋转角度不变
        rotation: piece.rotation,
        originalRotation: piece.originalRotation
      };

      // 调试信息：记录前几个拼图块的适配详情
      if (index < 3) {
        console.log(`🔧 拼图块${index}适配: (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)}) → (${adaptedX.toFixed(1)}, ${adaptedY.toFixed(1)})`);
      }

      return adaptedPiece;
    });

    console.log(`✅ 散开拼图适配完成: ${adaptedPieces.length} 个拼图块`);
    return adaptedPieces;

  } catch (error) {
    console.error('❌ 散开拼图适配失败:', error);
    return scatteredPieces;
  }
}

/**
 * 直接基于原始拼图块状态和当前画布尺寸计算，避免累积误差
 */
export function adaptPuzzlePiecesAbsolute(
  originalPieces: PuzzlePiece[],
  originalCanvasSize: { width: number; height: number },
  currentCanvasSize: { width: number; height: number }
): PuzzlePiece[] {
  if (!originalPieces || originalPieces.length === 0) {
    return originalPieces;
  }

  try {
    // 计算缩放比例
    const originalMinEdge = Math.min(originalCanvasSize.width, originalCanvasSize.height);
    const currentMinEdge = Math.min(currentCanvasSize.width, currentCanvasSize.height);
    const scale = currentMinEdge / originalMinEdge;

    // 计算画布中心点
    const originalCenter = {
      x: originalCanvasSize.width / 2,
      y: originalCanvasSize.height / 2
    };
    const currentCenter = {
      x: currentCanvasSize.width / 2,
      y: currentCanvasSize.height / 2
    };

    console.log(`🔧 绝对坐标适配: 缩放=${scale.toFixed(3)}, 原始中心=(${originalCenter.x}, ${originalCenter.y}), 当前中心=(${currentCenter.x}, ${currentCenter.y})`);

    // 适配每个拼图块
    const adaptedPieces = originalPieces.map(piece => {
      // 适配所有点
      const adaptedPoints = piece.points.map(point => {
        const relativeX = point.x - originalCenter.x;
        const relativeY = point.y - originalCenter.y;
        return {
          x: currentCenter.x + relativeX * scale,
          y: currentCenter.y + relativeY * scale,
          isOriginal: point.isOriginal
        };
      });

      // 适配中心位置
      const relativeX = piece.x - originalCenter.x;
      const relativeY = piece.y - originalCenter.y;
      const adaptedX = currentCenter.x + relativeX * scale;
      const adaptedY = currentCenter.y + relativeY * scale;

      return {
        ...piece,
        points: adaptedPoints,
        x: adaptedX,
        y: adaptedY,
        rotation: 0,
        originalRotation: 0
      };
    });

    console.log(`✅ 绝对坐标适配完成: ${adaptedPieces.length} 个拼图块`);
    return adaptedPieces;
  } catch (error) {
    console.error('Absolute puzzle piece adaptation failed:', error);
    return originalPieces;
  }
}

/**
 * 散开拼图块的绝对坐标适配函数
 * 基于originalPositions作为基准，避免累积误差
 */
export function adaptScatteredPuzzlePiecesAbsolute(
  currentPieces: PuzzlePiece[],
  originalPositions: PuzzlePiece[],
  originalCanvasSize: { width: number; height: number },
  currentCanvasSize: { width: number; height: number }
): PuzzlePiece[] {
  if (!currentPieces || currentPieces.length === 0) {
    return currentPieces;
  }

  if (!originalPositions || originalPositions.length === 0) {
    console.warn('⚠️ originalPositions为空，无法进行散开拼图适配');
    return currentPieces;
  }

  try {
    // 计算缩放比例
    const scaleX = currentCanvasSize.width / originalCanvasSize.width;
    const scaleY = currentCanvasSize.height / originalCanvasSize.height;

    console.log(`🔧 散开拼图适配: 缩放X=${scaleX.toFixed(3)}, 缩放Y=${scaleY.toFixed(3)}`);

    // 适配每个拼图块
    const adaptedPieces = currentPieces.map((piece, index) => {
      const originalPos = originalPositions[index];
      if (!originalPos) {
        console.warn(`⚠️ 拼图块 ${index} 缺少原始位置信息`);
        return piece;
      }

      // 计算适配后的中心位置
      const adaptedX = originalPos.x * scaleX;
      const adaptedY = originalPos.y * scaleY;

      // 计算位置偏移量
      const deltaX = adaptedX - piece.x;
      const deltaY = adaptedY - piece.y;

      // 适配所有点的坐标
      const adaptedPoints = piece.points.map(point => ({
        ...point,
        x: point.x + deltaX,
        y: point.y + deltaY
      }));

      return {
        ...piece,
        points: adaptedPoints,
        x: adaptedX,
        y: adaptedY,
        // 保持旋转角度不变
        rotation: piece.rotation,
        originalRotation: piece.originalRotation
      };
    });

    console.log(`✅ 散开拼图适配完成: ${adaptedPieces.length} 个拼图块`);
    return adaptedPieces;
  } catch (error) {
    console.error('Scattered puzzle piece adaptation failed:', error);
    return currentPieces;
  }
}