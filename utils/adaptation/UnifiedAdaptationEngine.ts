/**
 * 统一适配引擎 - 基于Step3方法的全局适配系统
 * 
 * 核心特性：
 * - 绝对坐标计算，避免累积误差
 * - 画布中心基准点，确保一致性
 * - 统一的适配接口和错误处理
 * - 支持多种适配类型（形状、拼图块、散开拼图）
 */

import { Point } from '@/types/common';
import { PuzzlePiece } from '@/types/puzzleTypes';

// 适配配置接口
export interface UnifiedAdaptationConfig {
  // 适配类型
  type: 'shape' | 'puzzle' | 'scattered';

  // 原始状态
  originalData: Point[] | PuzzlePiece[];
  originalCanvasSize: { width: number; height: number };

  // 目标状态
  targetCanvasSize: { width: number; height: number };

  // 🎯 目标形状数据（用于已完成拼图的精确锁定）
  targetShapeData?: Point[];

  // 🎯 目标位置数据（originalPositions，用于已完成拼图锁定）
  targetPositions?: PuzzlePiece[];

  // 散开拼图特有的原始画布尺寸
  scatterCanvasSize?: { width: number; height: number };

  // 已完成拼图的索引数组（用于散开拼图适配）
  completedPieces?: number[];

  // 适配选项
  options?: {
    preserveAspectRatio?: boolean;
    centerAlign?: boolean;
    scaleMethod?: 'minEdge' | 'maxEdge' | 'independent';
    debugMode?: boolean;
    // 🔑 新增：是否只适配完成的拼图（用于散开状态）
    onlyAdaptCompleted?: boolean;
  };
}

// 适配结果接口
export interface UnifiedAdaptationResult<T> {
  adaptedData: T;
  metrics: {
    scaleFactor: number | { x: number; y: number };
    centerOffset: { x: number; y: number };
    processingTime: number;
  };
  success: boolean;
  error?: string;
}

// 默认适配选项
const DEFAULT_OPTIONS = {
  preserveAspectRatio: true,
  centerAlign: true,
  scaleMethod: 'minEdge' as 'minEdge' | 'maxEdge' | 'independent',
  debugMode: false
};

/**
 * 统一适配引擎类
 */
export class UnifiedAdaptationEngine {
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * 主适配方法 - 统一入口
   */
  adapt<T>(config: UnifiedAdaptationConfig): UnifiedAdaptationResult<T> {
    const startTime = performance.now();

    try {
      // 验证输入参数
      this.validateConfig(config);

      // 合并默认选项
      const options = { ...DEFAULT_OPTIONS, ...config.options };

      if (this.debugMode || options.debugMode) {
        console.log(`🔧 [统一适配引擎] 开始${config.type}适配:`, {
          原始画布: `${config.originalCanvasSize.width}x${config.originalCanvasSize.height}`,
          目标画布: `${config.targetCanvasSize.width}x${config.targetCanvasSize.height}`,
          数据量: Array.isArray(config.originalData) ? config.originalData.length : 0
        });
      }

      let result: any;

      switch (config.type) {
        case 'shape':
          result = this.adaptShape(config, options);
          break;
        case 'puzzle':
          result = this.adaptPuzzlePieces(config, options);
          break;
        case 'scattered':
          // 🎯 基于目标形状的散开拼图适配
          result = this.adaptScatteredPieces(config, options);
          break;
        default:
          throw new Error(`不支持的适配类型: ${config.type}`);
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      if (this.debugMode || options.debugMode) {
        console.log(`✅ [统一适配引擎] ${config.type}适配完成: 耗时${processingTime.toFixed(2)}ms`);
      }

      return {
        adaptedData: result.adaptedData,
        metrics: {
          ...result.metrics,
          processingTime
        },
        success: true
      };

    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      console.error(`❌ [统一适配引擎] ${config.type}适配失败:`, error);

      return {
        adaptedData: config.originalData as T,
        metrics: {
          scaleFactor: 1,
          centerOffset: { x: 0, y: 0 },
          processingTime
        },
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 形状适配 - 基于Step3方法
   */
  private adaptShape(
    config: UnifiedAdaptationConfig,
    options: { preserveAspectRatio: boolean; centerAlign: boolean; scaleMethod: 'minEdge' | 'maxEdge' | 'independent'; debugMode: boolean }
  ): { adaptedData: Point[]; metrics: any } {
    const points = config.originalData as Point[];

    // 计算缩放比例
    const scaleFactor = this.calculateScaleFactor(
      config.originalCanvasSize,
      config.targetCanvasSize,
      options.scaleMethod
    );

    // 计算中心偏移
    const centerOffset = this.calculateCenterOffset(
      config.originalCanvasSize,
      config.targetCanvasSize,
      scaleFactor,
      options.centerAlign
    );

    // 适配每个点
    const adaptedPoints = points.map(point => {
      const originalCenter = {
        x: config.originalCanvasSize.width / 2,
        y: config.originalCanvasSize.height / 2
      };

      const targetCenter = {
        x: config.targetCanvasSize.width / 2,
        y: config.targetCanvasSize.height / 2
      };

      // 转换为相对于中心的坐标
      const relativeX = point.x - originalCenter.x;
      const relativeY = point.y - originalCenter.y;

      // 应用缩放
      const scaledX = typeof scaleFactor === 'number'
        ? relativeX * scaleFactor
        : relativeX * scaleFactor.x;
      const scaledY = typeof scaleFactor === 'number'
        ? relativeY * scaleFactor
        : relativeY * scaleFactor.y;

      // 转换回绝对坐标
      return {
        ...point,
        x: targetCenter.x + scaledX,
        y: targetCenter.y + scaledY
      };
    });

    return {
      adaptedData: adaptedPoints,
      metrics: {
        scaleFactor,
        centerOffset
      }
    };
  }

  /**
   * 拼图块适配 - 基于Step3方法
   */
  private adaptPuzzlePieces(
    config: UnifiedAdaptationConfig,
    options: { preserveAspectRatio: boolean; centerAlign: boolean; scaleMethod: 'minEdge' | 'maxEdge' | 'independent'; debugMode: boolean }
  ): { adaptedData: PuzzlePiece[]; metrics: any } {
    const pieces = config.originalData as PuzzlePiece[];

    // 计算缩放比例
    const scaleFactor = this.calculateScaleFactor(
      config.originalCanvasSize,
      config.targetCanvasSize,
      options.scaleMethod
    );

    // 计算中心点
    const originalCenter = {
      x: config.originalCanvasSize.width / 2,
      y: config.originalCanvasSize.height / 2
    };

    const targetCenter = {
      x: config.targetCanvasSize.width / 2,
      y: config.targetCanvasSize.height / 2
    };

    // 适配每个拼图块
    const adaptedPieces = pieces.map((piece, index) => {
      // 适配拼图块中心位置
      const relativeX = piece.x - originalCenter.x;
      const relativeY = piece.y - originalCenter.y;

      const scaledX = typeof scaleFactor === 'number'
        ? relativeX * scaleFactor
        : relativeX * scaleFactor.x;
      const scaledY = typeof scaleFactor === 'number'
        ? relativeY * scaleFactor
        : relativeY * scaleFactor.y;

      const adaptedX = targetCenter.x + scaledX;
      const adaptedY = targetCenter.y + scaledY;

      // 适配所有点的坐标
      const adaptedPoints = piece.points.map(point => {
        const pointRelativeX = point.x - originalCenter.x;
        const pointRelativeY = point.y - originalCenter.y;

        const pointScaledX = typeof scaleFactor === 'number'
          ? pointRelativeX * scaleFactor
          : pointRelativeX * scaleFactor.x;
        const pointScaledY = typeof scaleFactor === 'number'
          ? pointRelativeY * scaleFactor
          : pointRelativeY * scaleFactor.y;

        return {
          ...point,
          x: targetCenter.x + pointScaledX,
          y: targetCenter.y + pointScaledY
        };
      });

      // 调试信息
      if ((this.debugMode || options.debugMode) && index < 3) {
        console.log(`🔧 拼图块${index}适配: (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)}) → (${adaptedX.toFixed(1)}, ${adaptedY.toFixed(1)})`);
      }

      return {
        ...piece,
        x: adaptedX,
        y: adaptedY,
        points: adaptedPoints,
        // 🔧 重要修复：保持原始旋转角度不变
        rotation: piece.rotation,
        originalRotation: piece.originalRotation
      };
    });

    return {
      adaptedData: adaptedPieces,
      metrics: {
        scaleFactor,
        centerOffset: {
          x: targetCenter.x - originalCenter.x,
          y: targetCenter.y - originalCenter.y
        }
      }
    };
  }

  /**
   * 🎯 基于目标形状的散开拼图适配
   * 
   * 核心原则：所有元素都以目标形状为基准
   * 1. 使用与目标形状完全一致的缩放比例
   * 2. 已完成拼图：100%锁定到目标形状的对应位置
   * 3. 未完成拼图：保持与目标形状一致的缩放变化
   * 4. 确保所有拼图的适配都跟随目标形状的变化
   * 5. 目标形状是唯一的适配基准，其他元素都跟随变化
   */
  private adaptScatteredPieces(
    config: UnifiedAdaptationConfig,
    options: { preserveAspectRatio: boolean; centerAlign: boolean; scaleMethod: 'minEdge' | 'maxEdge' | 'independent'; debugMode: boolean }
  ): { adaptedData: PuzzlePiece[]; metrics: any } {
    const pieces = config.originalData as PuzzlePiece[];

    // 如果没有scatterCanvasSize，使用targetCanvasSize作为兜底
    if (!config.scatterCanvasSize) {
      console.warn('散开拼图适配没有提供scatterCanvasSize参数，使用targetCanvasSize作为兜底');
      config.scatterCanvasSize = config.targetCanvasSize;
    }

    // 安全检查 - 使用更宽松的验证，避免resize过程中的瞬间无效值导致白屏
    if (!config.scatterCanvasSize || config.scatterCanvasSize.width <= 0 || config.scatterCanvasSize.height <= 0) {
      console.warn(`[UnifiedAdaptationEngine] 散开画布尺寸无效，使用默认值: ${config.scatterCanvasSize?.width}x${config.scatterCanvasSize?.height}`);
      // 使用默认尺寸而不是抛出错误
      config.scatterCanvasSize = { width: 1280, height: 720 };
    }

    if (!config.targetCanvasSize || config.targetCanvasSize.width <= 0 || config.targetCanvasSize.height <= 0) {
      console.warn(`[UnifiedAdaptationEngine] 目标画布尺寸无效，使用默认值: ${config.targetCanvasSize?.width}x${config.targetCanvasSize?.height}`);
      // 使用默认尺寸而不是抛出错误
      config.targetCanvasSize = { width: 1280, height: 720 };
    }

    // 🎯 关键改进：使用与目标形状完全一致的缩放比例
    // 这确保了拼图与目标形状保持100%一致的比例关系
    // 🔑 重要：使用与目标形状适配相同的算法（30%直径规则）
    const originalMinEdge = Math.min(config.scatterCanvasSize.width, config.scatterCanvasSize.height);
    const targetMinEdge = Math.min(config.targetCanvasSize.width, config.targetCanvasSize.height);
    let uniformScale = targetMinEdge / originalMinEdge;

    if (this.debugMode || options.debugMode) {
      console.log(`🎯 [缩放计算] 原始最小边=${originalMinEdge}, 目标最小边=${targetMinEdge}, 统一缩放比例=${uniformScale.toFixed(4)}`);
    }

    // 验证缩放比例是否有效 - 使用默认值而不是抛出错误
    if (!isFinite(uniformScale) || uniformScale <= 0) {
      console.warn(`[UnifiedAdaptationEngine] 统一缩放比例无效，使用默认值1: ${uniformScale}`);
      uniformScale = 1; // 使用默认缩放比例
    }

    // 🎯 计算画布中心点（快照整体缩放的基准点）
    // 使用画布中心作为缩放基准，确保整体缩放的一致性
    const originalCenter = {
      x: config.scatterCanvasSize.width / 2,
      y: config.scatterCanvasSize.height / 2
    };

    const targetCenter = {
      x: config.targetCanvasSize.width / 2,
      y: config.targetCanvasSize.height / 2
    };

    if (this.debugMode || options.debugMode) {
      console.log(`🔧 [快照缩放] 散开拼图适配参数:`, {
        散开画布: `${config.scatterCanvasSize.width}x${config.scatterCanvasSize.height}`,
        目标画布: `${config.targetCanvasSize.width}x${config.targetCanvasSize.height}`,
        统一缩放比例: uniformScale.toFixed(3),
        原始中心: `(${originalCenter.x}, ${originalCenter.y})`,
        目标中心: `(${targetCenter.x}, ${targetCenter.y})`
      });
    }

    // 添加画布尺寸验证 - 这里已经在上面处理过了，移除重复检查

    // 🎯 快照整体缩放：适配每个拼图块
    const adaptedPieces = pieces.map((piece, index) => {
      // 🔑 关键：检查是否为已完成的拼图块
      // 已完成的拼图块需要特殊处理，确保它们锁定在目标形状的正确位置
      const isCompletedPiece = piece.isCompleted || (config.completedPieces && config.completedPieces.includes(index)) || false;

      if (this.debugMode || options.debugMode) {
        console.log(`🔍 [拼图块${index}] 完成状态检查:`, {
          isCompleted: piece.isCompleted,
          inCompletedList: config.completedPieces?.includes(index),
          completedPieces: config.completedPieces,
          isCompletedPiece,
          hasTargetPositions: !!config.targetPositions,
          targetPositionsLength: config.targetPositions?.length
        });
      }

      let scaledX: number;
      let scaledY: number;
      let scaledPoints: Point[];

      if (isCompletedPiece) {
        // 🔒 已完成拼图的特殊处理：100%锁定到目标形状位置

        // 🎯 第一优先级：使用目标位置数据（originalPositions）- 100%精确锁定
        if (config.targetPositions && config.targetPositions[index]) {
          const targetPosition = config.targetPositions[index];

          // 🔑 关键：100%精确锁定，不进行任何缩放变换
          scaledX = targetPosition.x;
          scaledY = targetPosition.y;

          // 🔑 关键：使用目标位置的精确点数据
          scaledPoints = targetPosition.points.map(point => ({ ...point }));

          if (this.debugMode || options.debugMode) {
            console.log(`🔒 [已完成拼图-100%锁定] 拼图块${index}: (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)}) 角度=${targetPosition.rotation}°`);
          }

          // 🔑 直接返回完全锁定的拼图块，不进行任何变换
          return {
            ...piece,
            x: scaledX,
            y: scaledY,
            points: scaledPoints,
            // 🔑 100%锁定角度到目标形状
            rotation: targetPosition.rotation || 0,
            originalRotation: targetPosition.originalRotation || 0,
            // 🔑 标记为已完成并锁定
            isCompleted: true,
            originalX: targetPosition.originalX,
            originalY: targetPosition.originalY
          };
        }
        // 如果有原始目标位置信息，使用它
        else if (piece.originalX !== undefined && piece.originalY !== undefined) {
          // 对原始目标位置也应用相同的缩放变换
          const originalTargetRelativeX = piece.originalX - originalCenter.x;
          const originalTargetRelativeY = piece.originalY - originalCenter.y;

          scaledX = targetCenter.x + originalTargetRelativeX * uniformScale;
          scaledY = targetCenter.y + originalTargetRelativeY * uniformScale;

          if (this.debugMode || options.debugMode) {
            console.log(`🔒 [已完成拼图] 拼图块${index}使用原始目标位置: (${piece.originalX}, ${piece.originalY}) → (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})`);
          }
        } else {
          // 如果没有原始目标位置，按正常方式缩放但标记为需要锁定
          const relativeX = piece.x - originalCenter.x;
          const relativeY = piece.y - originalCenter.y;

          scaledX = targetCenter.x + relativeX * uniformScale;
          scaledY = targetCenter.y + relativeY * uniformScale;

          console.warn(`⚠️ [已完成拼图] 拼图块${index}缺少原始目标位置信息，使用当前位置缩放`);
        }

        // 对已完成拼图的点也要特殊处理
        scaledPoints = piece.points.map((point, pointIndex) => {
          if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            console.error(`[已完成拼图] 拼图块${index}的点${pointIndex}数据无效:`, point);
            return { x: 0, y: 0, isOriginal: false };
          }

          // 对于已完成拼图的点，也需要基于目标位置进行缩放
          const pointRelativeX = point.x - originalCenter.x;
          const pointRelativeY = point.y - originalCenter.y;

          const newX = targetCenter.x + pointRelativeX * uniformScale;
          const newY = targetCenter.y + pointRelativeY * uniformScale;

          if (!isFinite(newX) || !isFinite(newY)) {
            console.error(`[已完成拼图] 拼图块${index}点${pointIndex}计算结果无效:`, {
              original: { x: point.x, y: point.y },
              result: { x: newX, y: newY }
            });
            return { x: 0, y: 0, isOriginal: false };
          }

          return {
            ...point,
            x: newX,
            y: newY
          };
        });

      } else {
        // 🧩 未完成拼图的正常处理：快照整体缩放
        const relativeX = piece.x - originalCenter.x;
        const relativeY = piece.y - originalCenter.y;

        scaledX = targetCenter.x + relativeX * uniformScale;
        scaledY = targetCenter.y + relativeY * uniformScale;

        // 🎯 快照整体缩放：适配所有点的坐标
        scaledPoints = piece.points.map((point, pointIndex) => {
          // 基本验证
          if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            console.error(`[快照缩放] 拼图块${index}的点${pointIndex}数据无效:`, point);
            return { x: 0, y: 0, isOriginal: false };
          }

          if (!isFinite(point.x) || !isFinite(point.y)) {
            console.error(`[快照缩放] 拼图块${index}的点${pointIndex}坐标不是有限数:`, point);
            return { x: 0, y: 0, isOriginal: false };
          }

          // 计算点相对于原始中心的位置
          const pointRelativeX = point.x - originalCenter.x;
          const pointRelativeY = point.y - originalCenter.y;

          // 应用统一缩放
          const newX = targetCenter.x + pointRelativeX * uniformScale;
          const newY = targetCenter.y + pointRelativeY * uniformScale;

          // 验证结果
          if (!isFinite(newX) || !isFinite(newY)) {
            console.error(`[快照缩放] 拼图块${index}点${pointIndex}计算结果无效:`, {
              original: { x: point.x, y: point.y },
              result: { x: newX, y: newY }
            });
            return { x: 0, y: 0, isOriginal: false };
          }

          return {
            ...point,
            x: newX,
            y: newY
          };
        });
      }

      // 🎯 快照整体缩放：调试信息
      if ((this.debugMode || options.debugMode) && index < 3) {
        const statusLabel = isCompletedPiece ? '[已完成]' : '[未完成]';
        console.log(`🔧 ${statusLabel} 拼图块${index}适配: (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)}) → (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)}), 角度保持: ${piece.rotation}°`);
      }

      // 🎯 快照整体缩放：返回适配后的拼图块
      return {
        ...piece,
        x: scaledX,
        y: scaledY,
        points: scaledPoints,
        // 🔑 核心：已完成拼图锁定到目标角度，未完成拼图保持当前角度
        rotation: isCompletedPiece ? (piece.originalRotation || 0) : piece.rotation,
        originalRotation: piece.originalRotation,
        // 保持完成状态
        isCompleted: isCompletedPiece
      };
    });

    return {
      adaptedData: adaptedPieces,
      metrics: {
        scaleFactor: uniformScale,
        centerOffset: {
          x: targetCenter.x - originalCenter.x,
          y: targetCenter.y - originalCenter.y
        }
      }
    };
  }

  /**
   * 适配目标位置（originalPositions）- 确保提示位置正确
   * 
   * 这个方法专门用于适配拼图的目标位置，确保提示功能显示在正确的位置
   */
  adaptOriginalPositions(
    originalPositions: PuzzlePiece[],
    originalCanvasSize: { width: number; height: number },
    targetCanvasSize: { width: number; height: number }
  ): PuzzlePiece[] {
    try {
      // 使用与散开拼图相同的缩放逻辑，确保一致性
      const originalMinEdge = Math.min(originalCanvasSize.width, originalCanvasSize.height);
      const targetMinEdge = Math.min(targetCanvasSize.width, targetCanvasSize.height);
      const uniformScale = targetMinEdge / originalMinEdge;

      const originalCenter = {
        x: originalCanvasSize.width / 2,
        y: originalCanvasSize.height / 2
      };

      const targetCenter = {
        x: targetCanvasSize.width / 2,
        y: targetCanvasSize.height / 2
      };

      if (this.debugMode) {
        console.log(`🎯 [目标位置适配] 缩放比例: ${uniformScale.toFixed(3)}, 原始中心: (${originalCenter.x}, ${originalCenter.y}), 目标中心: (${targetCenter.x}, ${targetCenter.y})`);
      }

      return originalPositions.map((position, index) => {
        // 适配位置
        const relativeX = position.x - originalCenter.x;
        const relativeY = position.y - originalCenter.y;

        const scaledX = targetCenter.x + relativeX * uniformScale;
        const scaledY = targetCenter.y + relativeY * uniformScale;

        // 适配所有点
        const scaledPoints = position.points.map(point => {
          const pointRelativeX = point.x - originalCenter.x;
          const pointRelativeY = point.y - originalCenter.y;

          return {
            ...point,
            x: targetCenter.x + pointRelativeX * uniformScale,
            y: targetCenter.y + pointRelativeY * uniformScale
          };
        });

        if (this.debugMode && index < 3) {
          console.log(`🎯 [目标位置] 拼图块${index}: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}) → (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})`);
        }

        return {
          ...position,
          x: scaledX,
          y: scaledY,
          points: scaledPoints,
          // 保持原始角度
          rotation: position.rotation,
          originalRotation: position.originalRotation
        };
      });
    } catch (error) {
      console.error('❌ 目标位置适配失败:', error);
      return originalPositions;
    }
  }

  /**
   * 计算缩放比例
   */
  private calculateScaleFactor(
    originalSize: { width: number; height: number },
    targetSize: { width: number; height: number },
    scaleMethod: 'minEdge' | 'maxEdge' | 'independent'
  ): number | { x: number; y: number } {
    switch (scaleMethod) {
      case 'minEdge':
        const originalMinEdge = Math.min(originalSize.width, originalSize.height);
        const targetMinEdge = Math.min(targetSize.width, targetSize.height);
        return targetMinEdge / originalMinEdge;

      case 'maxEdge':
        const originalMaxEdge = Math.max(originalSize.width, originalSize.height);
        const targetMaxEdge = Math.max(targetSize.width, targetSize.height);
        return targetMaxEdge / originalMaxEdge;

      case 'independent':
        return {
          x: targetSize.width / originalSize.width,
          y: targetSize.height / originalSize.height
        };

      default:
        throw new Error(`不支持的缩放方法: ${scaleMethod}`);
    }
  }

  /**
   * 计算中心偏移
   */
  private calculateCenterOffset(
    originalSize: { width: number; height: number },
    targetSize: { width: number; height: number },
    scaleFactor: number | { x: number; y: number },
    centerAlign: boolean
  ): { x: number; y: number } {
    if (!centerAlign) {
      return { x: 0, y: 0 };
    }

    const originalCenter = {
      x: originalSize.width / 2,
      y: originalSize.height / 2
    };

    const targetCenter = {
      x: targetSize.width / 2,
      y: targetSize.height / 2
    };

    return {
      x: targetCenter.x - originalCenter.x,
      y: targetCenter.y - originalCenter.y
    };
  }

  /**
   * 验证配置参数
   */
  private validateConfig(config: UnifiedAdaptationConfig): void {
    if (!config.originalData || !Array.isArray(config.originalData)) {
      throw new Error('originalData必须是有效的数组');
    }

    // 对画布尺寸使用更宽松的验证，在resize过程中可能出现瞬间的无效值
    if (!config.originalCanvasSize) {
      console.warn('[UnifiedAdaptationEngine] originalCanvasSize缺失，使用默认值');
      config.originalCanvasSize = { width: 1280, height: 720 };
    } else if (config.originalCanvasSize.width <= 0 || config.originalCanvasSize.height <= 0) {
      console.warn('[UnifiedAdaptationEngine] originalCanvasSize无效，使用默认值');
      config.originalCanvasSize = { width: 1280, height: 720 };
    }

    if (!config.targetCanvasSize) {
      console.warn('[UnifiedAdaptationEngine] targetCanvasSize缺失，使用默认值');
      config.targetCanvasSize = { width: 1280, height: 720 };
    } else if (config.targetCanvasSize.width <= 0 || config.targetCanvasSize.height <= 0) {
      console.warn('[UnifiedAdaptationEngine] targetCanvasSize无效，使用默认值');
      config.targetCanvasSize = { width: 1280, height: 720 };
    }

    if (config.type === 'scattered' && !config.scatterCanvasSize) {
      console.warn('[UnifiedAdaptationEngine] 散开拼图适配缺少scatterCanvasSize，使用targetCanvasSize');
      config.scatterCanvasSize = config.targetCanvasSize;
    }
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

// 导出单例实例
export const unifiedAdaptationEngine = new UnifiedAdaptationEngine(
  process.env.NODE_ENV === 'development'
);