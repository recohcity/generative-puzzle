/**
 * PuzzleAdaptationService - Handles puzzle-specific adaptation logic
 * Extracted from AdaptationEngine to maintain single responsibility principle
 */

import { Point, PuzzlePiece } from '@/types/puzzleTypes';

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

export class PuzzleAdaptationService {
  private static instance: PuzzleAdaptationService;

  private constructor() {}

  public static getInstance(): PuzzleAdaptationService {
    if (!PuzzleAdaptationService.instance) {
      PuzzleAdaptationService.instance = new PuzzleAdaptationService();
    }
    return PuzzleAdaptationService.instance;
  }

  /**
   * Adapts puzzle pieces to new canvas size
   * Handles completed vs uncompleted pieces differently
   */
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

      // Force recalculation even when scale is close to 1.0 to eliminate accumulated errors
      const forceRecalculation = Math.abs(scale - 1.0) < 0.001;

      const adaptedPieces = originalPieces.map((piece, index) => {
        if (completedPieces.includes(index)) {
          // Completed pieces: skip adaptation, maintain locked state
          return {
            ...piece,
            isCompleted: true
          };
        } else {
          // Uncompleted pieces: adapt using canvas center as reference
          const scaledPiece = this.scalePuzzlePiece(piece, scale, toCanvasSize, fromCanvasSize);
          
          return {
            ...scaledPiece,
            // Maintain player's current rotation angle
            rotation: piece.rotation,
            originalRotation: piece.originalRotation,
            isCompleted: piece.isCompleted || false
          };
        }
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

  /**
   * Scales a single puzzle piece to new canvas size
   * Uses canvas center as reference point for accurate positioning
   */
  private scalePuzzlePiece(
    piece: PuzzlePiece, 
    scale: number, 
    toCanvasSize: { width: number; height: number },
    fromCanvasSize?: { width: number; height: number }
  ): PuzzlePiece {
    // Simple scaling if no original canvas size provided
    if (!fromCanvasSize) {
      const centerX = piece.points.reduce((sum, p) => sum + p.x, 0) / piece.points.length;
      const centerY = piece.points.reduce((sum, p) => sum + p.y, 0) / piece.points.length;

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
        rotation: piece.rotation,
        originalRotation: piece.originalRotation,
        isCompleted: piece.isCompleted,
        originalX: piece.originalX,
        originalY: piece.originalY
      };
    }

    // Use canvas center as reference point for adaptation
    const fromCenter = {
      x: fromCanvasSize.width / 2,
      y: fromCanvasSize.height / 2
    };
    
    const toCenter = {
      x: toCanvasSize.width / 2,
      y: toCanvasSize.height / 2
    };

    // Calculate piece center relative to original canvas center
    const relativeX = piece.x - fromCenter.x;
    const relativeY = piece.y - fromCenter.y;

    // Scale and reposition to new canvas center
    const scaledX = toCenter.x + relativeX * scale;
    const scaledY = toCenter.y + relativeY * scale;

    // Adapt all points
    const scaledPoints = piece.points.map(point => {
      const pointRelativeX = point.x - fromCenter.x;
      const pointRelativeY = point.y - fromCenter.y;
      
      return {
        ...point,
        x: toCenter.x + pointRelativeX * scale,
        y: toCenter.y + pointRelativeY * scale
      };
    });

    return {
      ...piece,
      points: scaledPoints,
      x: scaledX,
      y: scaledY,
      rotation: piece.rotation,
      originalRotation: piece.originalRotation,
      isCompleted: piece.isCompleted,
      originalX: piece.originalX,
      originalY: piece.originalY
    };
  }

  /**
   * Validates puzzle pieces for adaptation
   */
  public validatePuzzlePieces(pieces: PuzzlePiece[]): boolean {
    if (!pieces || pieces.length === 0) {
      return false;
    }

    return pieces.every(piece => 
      piece.points && 
      piece.points.length > 0 &&
      typeof piece.x === 'number' &&
      typeof piece.y === 'number'
    );
  }

  /**
   * Calculates puzzle bounds
   */
  public calculatePuzzleBounds(pieces: PuzzlePiece[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (!pieces || pieces.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    const allPoints = pieces.flatMap(piece => piece.points);
    return this.calculateBounds(allPoints);
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
}