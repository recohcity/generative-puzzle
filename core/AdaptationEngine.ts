/**
 * AdaptationEngine - Unified adaptation logic system
 * Consolidates all adaptation parameters and algorithms from multiple files
 */

import { Point, PuzzlePiece } from '@/types/puzzleTypes';

// Unified adaptation constants consolidated from canvasAdaptation.ts
export const ADAPTATION_CONFIG = {
  // Desktop adaptation parameters
  DESKTOP: {
    TOP_BOTTOM_MARGIN: 40,
    LEFT_RIGHT_MARGIN: 20,
    CANVAS_PANEL_GAP: 10,
    PANEL_WIDTH: 350,
    MIN_PANEL_WIDTH: 280,
    MIN_CANVAS_SIZE: 320,
    MAX_CANVAS_SIZE: 2560,
    MIN_HEIGHT_THRESHOLD: 560,
  },
  
  // Mobile adaptation parameters
  MOBILE: {
    PORTRAIT: {
      CANVAS_MARGIN: 10,
      PANEL_MARGIN: 10,
      SAFE_AREA_TOP: 10,
      SAFE_AREA_BOTTOM: 30,
      PANEL_HEIGHT: 180,
    },
    LANDSCAPE: {
      CANVAS_MARGIN: 6,
      PANEL_MARGIN: 10,
      SAFE_AREA_TOP: 6,
      SAFE_AREA_BOTTOM: 6,
      MIN_PANEL_WIDTH: 240,
      MAX_PANEL_WIDTH: 350,
    },
    MIN_CANVAS_SIZE: 240,
    MAX_CANVAS_SIZE: 380,
  },
  
  // Device detection thresholds
  THRESHOLDS: {
    DESKTOP_MIN_WIDTH: 1024,
    TABLET_MIN_WIDTH: 640,
    PHONE_MAX_WIDTH: 639,
    DESKTOP_MOBILE_HEIGHT: 560,
  }
} as const;

interface AdaptationContext {
  deviceType: 'desktop' | 'tablet' | 'phone';
  layoutMode: 'desktop' | 'portrait' | 'landscape';
  canvasSize: { width: number; height: number };
  previousCanvasSize?: { width: number; height: number };
  iPhone16Model?: string | null;
}

interface AdaptationResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  metadata?: {
    scaleRatio: number;
    offset: { x: number; y: number };
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
  };
}

export class AdaptationEngine {
  private static instance: AdaptationEngine;

  private constructor() {}

  public static getInstance(): AdaptationEngine {
    if (!AdaptationEngine.instance) {
      AdaptationEngine.instance = new AdaptationEngine();
    }
    return AdaptationEngine.instance;
  }

  // Unified canvas size calculation
  public calculateCanvasSize(context: AdaptationContext): AdaptationResult<{ width: number; height: number }> {
    try {
      const { deviceType, layoutMode, canvasSize } = context;
      let result: { width: number; height: number };

      switch (deviceType) {
        case 'desktop':
          result = this.calculateDesktopCanvasSize(canvasSize.width, canvasSize.height);
          break;
        case 'phone':
          if (layoutMode === 'portrait') {
            result = this.calculateMobilePortraitCanvasSize(canvasSize.width, canvasSize.height, context);
          } else {
            result = this.calculateMobileLandscapeCanvasSize(canvasSize.width, canvasSize.height, context);
          }
          break;
        case 'tablet':
          // Tablets use desktop layout but with mobile constraints
          result = this.calculateDesktopCanvasSize(canvasSize.width, canvasSize.height);
          break;
        default:
          throw new Error(`Unknown device type: ${deviceType}`);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private calculateDesktopCanvasSize(windowWidth: number, windowHeight: number): { width: number; height: number } {
    const config = ADAPTATION_CONFIG.DESKTOP;
    const minSafeMargin = 30;

    const availableHeight = windowHeight - config.TOP_BOTTOM_MARGIN * 2;
    const safeLeftRightMargin = Math.max(config.LEFT_RIGHT_MARGIN, minSafeMargin);
    const availableWidth = windowWidth - safeLeftRightMargin * 2 - config.PANEL_WIDTH - config.CANVAS_PANEL_GAP;

    let canvasSize = Math.min(availableHeight, availableWidth);
    canvasSize = Math.max(config.MIN_CANVAS_SIZE, Math.min(canvasSize, config.MAX_CANVAS_SIZE));

    return {
      width: canvasSize,
      height: canvasSize
    };
  }

  private calculateMobilePortraitCanvasSize(
    windowWidth: number, 
    windowHeight: number, 
    context: AdaptationContext
  ): { width: number; height: number } {
    const config = ADAPTATION_CONFIG.MOBILE;
    const { CANVAS_MARGIN, SAFE_AREA_TOP, SAFE_AREA_BOTTOM, PANEL_HEIGHT } = config.PORTRAIT;

    const availableWidth = windowWidth - CANVAS_MARGIN * 2;
    const availableHeight = windowHeight - PANEL_HEIGHT - CANVAS_MARGIN - SAFE_AREA_TOP - SAFE_AREA_BOTTOM;

    let canvasSize = Math.min(availableWidth, availableHeight);

    // iPhone 16 series optimization
    if (context.iPhone16Model) {
      canvasSize = this.optimizeForIPhone16(canvasSize, context.iPhone16Model, 'portrait');
    }

    canvasSize = Math.max(config.MIN_CANVAS_SIZE, Math.min(canvasSize, config.MAX_CANVAS_SIZE));

    return {
      width: canvasSize,
      height: canvasSize
    };
  }

  private calculateMobileLandscapeCanvasSize(
    windowWidth: number, 
    windowHeight: number, 
    context: AdaptationContext
  ): { width: number; height: number } {
    const config = ADAPTATION_CONFIG.MOBILE;
    const { CANVAS_MARGIN, SAFE_AREA_TOP, MIN_PANEL_WIDTH } = config.LANDSCAPE;

    const availableHeight = windowHeight - CANVAS_MARGIN * 2 - SAFE_AREA_TOP;
    let panelWidth = MIN_PANEL_WIDTH;

    // iPhone 16 series optimization
    if (context.iPhone16Model) {
      const optimalWidth = this.getOptimalPanelWidth(context.iPhone16Model);
      panelWidth = optimalWidth as any; // 类型断言解决类型冲突
    }

    const availableWidth = windowWidth - panelWidth - CANVAS_MARGIN * 2;
    let canvasSize = Math.min(availableHeight, availableWidth);

    if (context.iPhone16Model) {
      canvasSize = this.optimizeForIPhone16(canvasSize, context.iPhone16Model, 'landscape');
    }

    canvasSize = Math.max(config.MIN_CANVAS_SIZE, Math.min(canvasSize, config.MAX_CANVAS_SIZE));

    return {
      width: canvasSize,
      height: canvasSize
    };
  }

  private optimizeForIPhone16(canvasSize: number, model: string, orientation: 'portrait' | 'landscape'): number {
    const optimizations = {
      'iPhone 16e': { portrait: 355, landscape: 350 },
      'iPhone 16': { portrait: 360, landscape: 360 },
      'iPhone 16 Plus': { portrait: 400, landscape: 410 },
      'iPhone 16 Pro': { portrait: 370, landscape: 380 },
      'iPhone 16 Pro Max': { portrait: 410, landscape: 420 }
    };

    const modelOptimization = optimizations[model as keyof typeof optimizations];
    if (modelOptimization) {
      return Math.min(canvasSize, modelOptimization[orientation]);
    }

    return canvasSize;
  }

  private getOptimalPanelWidth(model: string): number {
    const panelWidths: Record<string, number> = {
      'iPhone 16e': 270,
      'iPhone 16': 270,
      'iPhone 16 Plus': 250,
      'iPhone 16 Pro': 260,
      'iPhone 16 Pro Max': 260
    };

    return panelWidths[model] || 260;
  }

  // Unified shape adaptation
  public adaptShape(
    originalShape: Point[],
    fromCanvasSize: { width: number; height: number },
    toCanvasSize: { width: number; height: number }
  ): AdaptationResult<Point[]> {
    try {
      if (!originalShape || originalShape.length === 0) {
        throw new Error('Invalid original shape');
      }

      const scaleX = toCanvasSize.width / fromCanvasSize.width;
      const scaleY = toCanvasSize.height / fromCanvasSize.height;
      const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

      // Calculate shape bounds
      const bounds = this.calculateBounds(originalShape);
      const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
      const shapeCenterY = (bounds.minY + bounds.maxY) / 2;

      // Calculate new center position
      const newCenterX = toCanvasSize.width / 2;
      const newCenterY = toCanvasSize.height / 2;

      const adaptedShape = originalShape.map(point => ({
        ...point,
        x: (point.x - shapeCenterX) * scale + newCenterX,
        y: (point.y - shapeCenterY) * scale + newCenterY
      }));

      return {
        success: true,
        data: adaptedShape,
        metadata: {
          scaleRatio: scale,
          offset: { x: newCenterX - shapeCenterX * scale, y: newCenterY - shapeCenterY * scale },
          bounds: this.calculateBounds(adaptedShape)
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Shape adaptation failed'
      };
    }
  }

  // Unified puzzle piece adaptation
  public adaptPuzzlePieces(
    originalPieces: PuzzlePiece[],
    fromCanvasSize: { width: number; height: number },
    toCanvasSize: { width: number; height: number },
    completedPieces: number[] = [],
    originalPositions: PuzzlePiece[] = []
  ): AdaptationResult<PuzzlePiece[]> {
    try {
      if (!originalPieces || originalPieces.length === 0) {
        throw new Error('Invalid puzzle pieces');
      }

      const scaleX = toCanvasSize.width / fromCanvasSize.width;
      const scaleY = toCanvasSize.height / fromCanvasSize.height;
      const scale = Math.min(scaleX, scaleY);

      console.log(`🔧 [AdaptationEngine] 拼图适配开始:`, {
        拼图数量: originalPieces.length,
        已完成拼图: completedPieces,
        缩放比例: scale.toFixed(3),
        原始画布: `${fromCanvasSize.width}x${fromCanvasSize.height}`,
        目标画布: `${toCanvasSize.width}x${toCanvasSize.height}`
      });

      const adaptedPieces = originalPieces.map((piece, index) => {
        if (completedPieces.includes(index) && originalPositions[index]) {
          // 🔒 已完成拼图的特殊处理：100%锁定到目标形状位置
          const originalPiece = originalPositions[index];
          const scaledPiece = this.scalePuzzlePiece(originalPiece, scale, toCanvasSize);
          
          return {
            ...scaledPiece,
            // 🔑 关键：已完成拼图必须锁定到目标形状的精确位置和角度
            x: scaledPiece.x,
            y: scaledPiece.y,
            points: scaledPiece.points,
            rotation: originalPiece.rotation || 0, // 锁定到目标角度
            originalRotation: originalPiece.originalRotation || 0,
            isCompleted: true, // 确保标记为已完成
            originalX: originalPiece.x,
            originalY: originalPiece.y
          };
        } else {
          // 🧩 未完成拼图：保持当前状态，只进行尺寸缩放
          const scaledPiece = this.scalePuzzlePiece(piece, scale, toCanvasSize);
          
          return {
            ...scaledPiece,
            // 🔑 关键：未完成拼图保持玩家当前的旋转角度
            rotation: piece.rotation, // 保持玩家操作的角度
            originalRotation: piece.originalRotation,
            isCompleted: piece.isCompleted || false
          };
        }
      });

      // 验证适配结果
      const completedCount = adaptedPieces.filter(p => p.isCompleted).length;
      console.log(`✅ [AdaptationEngine] 拼图适配完成:`, {
        总拼图数: adaptedPieces.length,
        已完成数: completedCount,
        未完成数: adaptedPieces.length - completedCount,
        已完成拼图角度: adaptedPieces
          .filter((p, i) => completedPieces.includes(i))
          .map((p, i) => `拼图${completedPieces[i]}:${p.rotation}°`)
      });

      return {
        success: true,
        data: adaptedPieces,
        metadata: {
          scaleRatio: scale,
          offset: { x: 0, y: 0 },
          bounds: { minX: 0, minY: 0, maxX: toCanvasSize.width, maxY: toCanvasSize.height }
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Puzzle adaptation failed'
      };
    }
  }

  private scalePuzzlePiece(
    piece: PuzzlePiece, 
    scale: number, 
    canvasSize: { width: number; height: number }
  ): PuzzlePiece {
    // Calculate piece center
    const centerX = piece.points.reduce((sum, p) => sum + p.x, 0) / piece.points.length;
    const centerY = piece.points.reduce((sum, p) => sum + p.y, 0) / piece.points.length;

    // Scale points relative to piece center
    const scaledPoints = piece.points.map(point => ({
      ...point,
      x: (point.x - centerX) * scale + centerX * scale,
      y: (point.y - centerY) * scale + centerY * scale
    }));

    return {
      ...piece,
      points: scaledPoints,
      x: piece.x * scale,
      y: piece.y * scale,
      // 🔑 关键修复：保持拼图的角度信息，避免窗口调整时角度随机变化
      rotation: piece.rotation,
      originalRotation: piece.originalRotation,
      // 🔑 保持完成状态和其他重要属性
      isCompleted: piece.isCompleted,
      originalX: piece.originalX,
      originalY: piece.originalY
    };
  }

  private calculateBounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
    return points.reduce(
      (bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxX: Math.max(bounds.maxX, point.x),
        maxY: Math.max(bounds.maxY, point.y)
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
  }

  // Position normalization utilities
  public normalizePosition(
    x: number, 
    y: number, 
    canvasSize: { width: number; height: number }
  ): { normalizedX: number; normalizedY: number } {
    return {
      normalizedX: x / canvasSize.width,
      normalizedY: y / canvasSize.height
    };
  }

  public denormalizePosition(
    normalizedX: number, 
    normalizedY: number, 
    canvasSize: { width: number; height: number }
  ): { x: number; y: number } {
    return {
      x: normalizedX * canvasSize.width,
      y: normalizedY * canvasSize.height
    };
  }
}