/**
 * useAdaptation - Unified adaptation hook
 * Replaces usePuzzleAdaptation.ts and consolidates adaptation logic
 */

import { useEffect, useCallback } from 'react';
import { useSystem } from '../SystemProvider';
import { useDevice } from './useDevice';
import { Point, PuzzlePiece } from '@/types/puzzleTypes';

interface AdaptationOptions {
  preserveCompletedPieces?: boolean;
  maintainAspectRatio?: boolean;
  centerAlign?: boolean;
}

interface UseAdaptationProps {
  canvasSize: { width: number; height: number } | null;
  previousCanvasSize?: { width: number; height: number } | null;
  onShapeAdapted?: (adaptedShape: Point[]) => void;
  onPuzzleAdapted?: (adaptedPieces: PuzzlePiece[]) => void;
  options?: AdaptationOptions;
}

export const useAdaptation = ({
  canvasSize,
  previousCanvasSize,
  onShapeAdapted,
  onPuzzleAdapted,
  options = {}
}: UseAdaptationProps) => {
  const { adaptationEngine } = useSystem();
  const deviceState = useDevice();

  const adaptShape = useCallback((
    originalShape: Point[],
    fromSize: { width: number; height: number },
    toSize: { width: number; height: number }
  ) => {
    const result = adaptationEngine.adaptShape(originalShape, fromSize, toSize);
    
    if (result.success && result.data) {
      onShapeAdapted?.(result.data);
      return result.data;
    } else {
      console.error('Shape adaptation failed:', result.error);
      return originalShape;
    }
  }, [adaptationEngine, onShapeAdapted]);

  const adaptPuzzlePieces = useCallback((
    originalPieces: PuzzlePiece[],
    fromSize: { width: number; height: number },
    toSize: { width: number; height: number },
    completedPieces: number[] = [],
    originalPositions: PuzzlePiece[] = []
  ) => {
    const result = adaptationEngine.adaptPuzzlePieces(
      originalPieces,
      fromSize,
      toSize,
      options.preserveCompletedPieces ? completedPieces : [],
      originalPositions
    );
    
    if (result.success && result.data) {
      onPuzzleAdapted?.(result.data);
      return result.data;
    } else {
      console.error('Puzzle adaptation failed:', result.error);
      return originalPieces;
    }
  }, [adaptationEngine, onPuzzleAdapted, options.preserveCompletedPieces]);

  const calculateOptimalCanvasSize = useCallback((
    windowWidth: number,
    windowHeight: number
  ) => {
    const context = {
      deviceType: deviceState.deviceType,
      layoutMode: deviceState.layoutMode,
      canvasSize: { width: windowWidth, height: windowHeight },
      iPhone16Model: null // TODO: Add iPhone16 detection to device state
    };

    const result = adaptationEngine.calculateCanvasSize(context);
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Canvas size calculation failed:', result.error);
      return { width: windowWidth, height: windowHeight };
    }
  }, [adaptationEngine, deviceState]);

  const normalizePosition = useCallback((
    x: number,
    y: number,
    canvasSize: { width: number; height: number }
  ) => {
    return adaptationEngine.normalizePosition(x, y, canvasSize);
  }, [adaptationEngine]);

  const denormalizePosition = useCallback((
    normalizedX: number,
    normalizedY: number,
    canvasSize: { width: number; height: number }
  ) => {
    return adaptationEngine.denormalizePosition(normalizedX, normalizedY, canvasSize);
  }, [adaptationEngine]);

  return {
    adaptShape,
    adaptPuzzlePieces,
    calculateOptimalCanvasSize,
    normalizePosition,
    denormalizePosition,
    deviceState
  };
};

// Specialized hook for automatic puzzle adaptation
export const usePuzzleAdaptation = (
  canvasSize: { width: number; height: number } | null,
  puzzle: PuzzlePiece[] | null,
  originalPositions: PuzzlePiece[],
  completedPieces: number[],
  previousCanvasSize: { width: number; height: number } | null,
  onAdapted: (adaptedPieces: PuzzlePiece[]) => void
) => {
  const { adaptPuzzlePieces } = useAdaptation({
    canvasSize,
    previousCanvasSize,
    onPuzzleAdapted: onAdapted,
    options: { preserveCompletedPieces: true }
  });

  useEffect(() => {
    // 添加更严格的参数验证，避免在resize过程中传递无效参数
    if (!canvasSize || 
        !previousCanvasSize || 
        !puzzle || 
        puzzle.length === 0 ||
        canvasSize.width <= 0 ||
        canvasSize.height <= 0 ||
        previousCanvasSize.width <= 0 ||
        previousCanvasSize.height <= 0 ||
        (canvasSize.width === previousCanvasSize.width && canvasSize.height === previousCanvasSize.height)) {
      return;
    }

    try {
      adaptPuzzlePieces(puzzle, previousCanvasSize, canvasSize, completedPieces, originalPositions);
    } catch (error) {
      console.error('❌ [usePuzzleAdaptation] 拼图适配失败:', error);
      // 不抛出错误，避免白屏
    }
  }, [
    canvasSize,
    previousCanvasSize,
    puzzle,
    completedPieces,
    originalPositions,
    adaptPuzzlePieces
  ]);
};

// Specialized hook for automatic shape adaptation
export const useShapeAdaptation = (
  canvasSize: { width: number; height: number } | null,
  baseShape: Point[],
  baseCanvasSize: { width: number; height: number } | null,
  onAdapted: (adaptedShape: Point[]) => void
) => {
  const { adaptShape } = useAdaptation({
    canvasSize,
    onShapeAdapted: onAdapted
  });

  useEffect(() => {
    if (!canvasSize || 
        !baseCanvasSize || 
        !baseShape || 
        baseShape.length === 0 ||
        (canvasSize.width === baseCanvasSize.width && canvasSize.height === baseCanvasSize.height)) {
      return;
    }

    adaptShape(baseShape, baseCanvasSize, canvasSize);
  }, [canvasSize, baseCanvasSize, baseShape, adaptShape]);
};