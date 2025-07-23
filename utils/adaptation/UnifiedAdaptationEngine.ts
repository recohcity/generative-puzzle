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
  
  // 散开拼图特有的原始画布尺寸
  scatterCanvasSize?: { width: number; height: number };
  
  // 适配选项
  options?: {
    preserveAspectRatio?: boolean;
    centerAlign?: boolean;
    scaleMethod?: 'minEdge' | 'maxEdge' | 'independent';
    debugMode?: boolean;
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
  scaleMethod: 'minEdge' as const,
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
    options: typeof DEFAULT_OPTIONS
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
    options: typeof DEFAULT_OPTIONS
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
        points: adaptedPoints
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
   * 散开拼图适配 - 基于Step3方法
   */
  private adaptScatteredPieces(
    config: UnifiedAdaptationConfig,
    options: typeof DEFAULT_OPTIONS
  ): { adaptedData: PuzzlePiece[]; metrics: any } {
    const pieces = config.originalData as PuzzlePiece[];
    
    // 如果没有scatterCanvasSize，使用targetCanvasSize作为兜底
    if (!config.scatterCanvasSize) {
      console.warn('散开拼图适配没有提供scatterCanvasSize参数，使用targetCanvasSize作为兜底');
      config.scatterCanvasSize = config.targetCanvasSize;
    }

    // 计算缩放比例 - 散开拼图使用独立的X和Y缩放
    // 添加安全检查，防止除以0
    if (config.scatterCanvasSize.width <= 0 || config.scatterCanvasSize.height <= 0) {
      throw new Error(`散开画布尺寸无效: ${config.scatterCanvasSize.width}x${config.scatterCanvasSize.height}`);
    }
    
    if (config.targetCanvasSize.width <= 0 || config.targetCanvasSize.height <= 0) {
      throw new Error(`目标画布尺寸无效: ${config.targetCanvasSize.width}x${config.targetCanvasSize.height}`);
    }
    
    const scaleX = config.targetCanvasSize.width / config.scatterCanvasSize.width;
    const scaleY = config.targetCanvasSize.height / config.scatterCanvasSize.height;
    
    // 验证缩放比例是否有效
    if (!isFinite(scaleX) || !isFinite(scaleY)) {
      throw new Error(`缩放比例无效: scaleX=${scaleX}, scaleY=${scaleY}`);
    }

    // 计算画布中心点偏移
    const centerOffsetX = (config.targetCanvasSize.width / 2) - (config.scatterCanvasSize.width / 2) * scaleX;
    const centerOffsetY = (config.targetCanvasSize.height / 2) - (config.scatterCanvasSize.height / 2) * scaleY;

    if (this.debugMode || options.debugMode) {
      console.log(`🔧 散开拼图适配参数:`, {
        散开画布: `${config.scatterCanvasSize.width}x${config.scatterCanvasSize.height}`,
        目标画布: `${config.targetCanvasSize.width}x${config.targetCanvasSize.height}`,
        缩放比例X: scaleX.toFixed(3),
        缩放比例Y: scaleY.toFixed(3),
        中心偏移X: centerOffsetX.toFixed(3),
        中心偏移Y: centerOffsetY.toFixed(3)
      });
    }
    
    // 添加画布尺寸验证
    if (config.targetCanvasSize.width <= 0 || config.targetCanvasSize.height <= 0) {
      console.error(`[UnifiedAdaptationEngine] 目标画布尺寸无效:`, config.targetCanvasSize);
      throw new Error(`目标画布尺寸无效: ${config.targetCanvasSize.width}x${config.targetCanvasSize.height}`);
    }

    // 适配每个散开的拼图块
    const adaptedPieces = pieces.map((piece, index) => {
      // 适配拼图块中心位置 - 使用相对于中心的坐标计算
      const originalCenterX = config.scatterCanvasSize.width / 2;
      const originalCenterY = config.scatterCanvasSize.height / 2;
      
      // 验证中心点坐标是否有效
      if (!isFinite(originalCenterX) || !isFinite(originalCenterY)) {
        throw new Error(`原始中心点坐标无效: (${originalCenterX}, ${originalCenterY})`);
      }
      
      const relativeX = piece.x - originalCenterX;
      const relativeY = piece.y - originalCenterY;
      
      const scaledRelativeX = relativeX * scaleX;
      const scaledRelativeY = relativeY * scaleY;
      
      const targetCenterX = config.targetCanvasSize.width / 2;
      const targetCenterY = config.targetCanvasSize.height / 2;
      
      const scaledX = targetCenterX + scaledRelativeX;
      const scaledY = targetCenterY + scaledRelativeY;

      // 适配所有点的坐标 - 使用相同的相对中心计算方法
      const scaledPoints = piece.points.map((point, pointIndex) => {
        // 详细验证点对象的结构
        if (!point) {
          console.error(`[UnifiedAdaptationEngine] 拼图块${index}的点${pointIndex}为null/undefined:`, point);
          return { x: null, y: null, isOriginal: false }; // 返回安全的默认值
        }
        
        if (typeof point !== 'object') {
          console.error(`[UnifiedAdaptationEngine] 拼图块${index}的点${pointIndex}不是对象:`, typeof point, point);
          return { x: null, y: null, isOriginal: false };
        }
        
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
          console.error(`[UnifiedAdaptationEngine] 拼图块${index}的点${pointIndex}坐标类型错误:`, {
            x: point.x,
            y: point.y,
            xType: typeof point.x,
            yType: typeof point.y
          });
          return { x: null, y: null, isOriginal: false };
        }
        
        if (!isFinite(point.x) || !isFinite(point.y)) {
          console.error(`[UnifiedAdaptationEngine] 拼图块${index}的点${pointIndex}坐标不是有限数:`, {
            x: point.x,
            y: point.y,
            xIsFinite: isFinite(point.x),
            yIsFinite: isFinite(point.y)
          });
          // 输入数据本身就有问题，这说明问题出现在适配引擎之前
          console.error(`❌ 输入数据异常：拼图块${index}的点${pointIndex}在进入适配引擎前就已经是NaN`);
          return { x: null, y: null, isOriginal: false };
        }
        
        const pointRelativeX = point.x - originalCenterX;
        const pointRelativeY = point.y - originalCenterY;
        
        const newX = targetCenterX + pointRelativeX * scaleX;
        const newY = targetCenterY + pointRelativeY * scaleY;
        
        // 验证计算结果
        if (!isFinite(newX) || !isFinite(newY)) {
          console.error(`[UnifiedAdaptationEngine] 拼图块${index}点${pointIndex}坐标计算结果无效:`, {
            original: { x: point.x, y: point.y },
            relative: { x: pointRelativeX, y: pointRelativeY },
            scale: { x: scaleX, y: scaleY },
            result: { x: newX, y: newY },
            centers: { originalCenterX, originalCenterY, targetCenterX, targetCenterY },
            // 添加详细的中间计算步骤
            calculations: {
              'point.x': point.x,
              'originalCenterX': originalCenterX,
              'pointRelativeX': pointRelativeX,
              'targetCenterX': targetCenterX,
              'scaleX': scaleX,
              'pointRelativeX * scaleX': pointRelativeX * scaleX,
              'targetCenterX + pointRelativeX * scaleX': targetCenterX + pointRelativeX * scaleX
            }
          });
          return { x: null, y: null, isOriginal: false };
        }
        
        // 成功计算，返回新坐标
        if ((this.debugMode || options.debugMode) && index < 2 && pointIndex < 2) {
          console.log(`[UnifiedAdaptationEngine] 拼图块${index}点${pointIndex}适配: (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) → (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
        }
        
        return {
          ...point,
          x: newX,
          y: newY
        };
      });

      // 计算拼图块的边界（考虑旋转）
      const bounds = this.calculatePieceBounds({ ...piece, points: scaledPoints });
      
      // 边界约束 - 确保拼图块不会离开画布
      const SAFE_MARGIN = 10; // 安全边距
      let constrainedX = scaledX;
      let constrainedY = scaledY;
      let correctionX = 0;
      let correctionY = 0;

      // 检查水平边界
      if (bounds.minX < SAFE_MARGIN) {
        correctionX = SAFE_MARGIN - bounds.minX;
        constrainedX = scaledX + correctionX;
      } else if (bounds.maxX > config.targetCanvasSize.width - SAFE_MARGIN) {
        correctionX = (config.targetCanvasSize.width - SAFE_MARGIN) - bounds.maxX;
        constrainedX = scaledX + correctionX;
      }

      // 检查垂直边界
      if (bounds.minY < SAFE_MARGIN) {
        correctionY = SAFE_MARGIN - bounds.minY;
        constrainedY = scaledY + correctionY;
      } else if (bounds.maxY > config.targetCanvasSize.height - SAFE_MARGIN) {
        correctionY = (config.targetCanvasSize.height - SAFE_MARGIN) - bounds.maxY;
        constrainedY = scaledY + correctionY;
      }

      // 应用边界约束到所有点
      const constrainedPoints = scaledPoints.map(point => ({
        ...point,
        x: point.x + correctionX,
        y: point.y + correctionY
      }));

      // 调试信息
      if ((this.debugMode || options.debugMode) && index < 3) {
        const hasCorrection = correctionX !== 0 || correctionY !== 0;
        console.log(`🔧 散开拼图块${index}适配: (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)}) → (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})${hasCorrection ? ` → 边界约束(${constrainedX.toFixed(1)}, ${constrainedY.toFixed(1)})` : ''}`);
        if (hasCorrection) {
          console.log(`   边界修正: (${correctionX.toFixed(1)}, ${correctionY.toFixed(1)})`);
        }
      }

      return {
        ...piece,
        x: constrainedX,
        y: constrainedY,
        points: constrainedPoints
      };
    });

    return {
      adaptedData: adaptedPieces,
      metrics: {
        scaleFactor: { x: scaleX, y: scaleY },
        centerOffset: { x: centerOffsetX, y: centerOffsetY }
      }
    };
  }

  /**
   * 计算拼图块边界（考虑旋转）
   */
  private calculatePieceBounds(piece: PuzzlePiece): { minX: number; maxX: number; minY: number; maxY: number } {
    if (piece.rotation !== 0) {
      // 如果有旋转，需要计算旋转后的边界
      const center = { x: piece.x, y: piece.y };
      const radians = (piece.rotation * Math.PI) / 180;
      
      const rotatedPoints = piece.points.map(point => {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        const rotatedDx = dx * Math.cos(radians) - dy * Math.sin(radians);
        const rotatedDy = dx * Math.sin(radians) + dy * Math.cos(radians);
        
        return {
          x: center.x + rotatedDx,
          y: center.y + rotatedDy
        };
      });
      
      return {
        minX: Math.min(...rotatedPoints.map(p => p.x)),
        maxX: Math.max(...rotatedPoints.map(p => p.x)),
        minY: Math.min(...rotatedPoints.map(p => p.y)),
        maxY: Math.max(...rotatedPoints.map(p => p.y))
      };
    }
    
    // 没有旋转，直接使用点的坐标
    return {
      minX: Math.min(...piece.points.map(p => p.x)),
      maxX: Math.max(...piece.points.map(p => p.x)),
      minY: Math.min(...piece.points.map(p => p.y)),
      maxY: Math.max(...piece.points.map(p => p.y))
    };
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

    if (!config.originalCanvasSize || 
        config.originalCanvasSize.width <= 0 || 
        config.originalCanvasSize.height <= 0) {
      throw new Error('originalCanvasSize必须是有效的尺寸');
    }

    if (!config.targetCanvasSize || 
        config.targetCanvasSize.width <= 0 || 
        config.targetCanvasSize.height <= 0) {
      throw new Error('targetCanvasSize必须是有效的尺寸');
    }

    if (config.type === 'scattered' && !config.scatterCanvasSize) {
      throw new Error('散开拼图适配需要提供scatterCanvasSize参数');
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