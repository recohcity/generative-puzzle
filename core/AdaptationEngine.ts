/**
 * AdaptationEngine - Unified adaptation logic system
 * Consolidates all adaptation parameters and algorithms from multiple files
 */

import { Point, PuzzlePiece } from '@/types/puzzleTypes';
import {
  DESKTOP_ADAPTATION,
  MOBILE_ADAPTATION,
  type AdaptationContext
} from '../src/config/adaptationConfig';

// Adaptation constants now imported from unified configuration

// Interfaces now imported from adaptationConfig.ts

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
    const config = DESKTOP_ADAPTATION;
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
    const config = MOBILE_ADAPTATION;
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
    const config = MOBILE_ADAPTATION;
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

  // Puzzle piece adaptation - delegated to PuzzleAdaptationService
  public adaptPuzzlePieces(
    originalPieces: PuzzlePiece[],
    fromCanvasSize: { width: number; height: number },
    toCanvasSize: { width: number; height: number },
    completedPieces: number[] = [],
    originalPositions: PuzzlePiece[] = []
  ): AdaptationResult<PuzzlePiece[]> {
    // Import here to avoid circular dependencies
    const { PuzzleAdaptationService } = require('./PuzzleAdaptationService');
    const puzzleService = PuzzleAdaptationService.getInstance();
    return puzzleService.adaptPuzzlePieces(originalPieces, fromCanvasSize, toCanvasSize, completedPieces, originalPositions);
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