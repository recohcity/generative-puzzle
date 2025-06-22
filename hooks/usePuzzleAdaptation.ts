import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Point, PuzzlePiece } from '@/types/puzzleTypes';
import { calculateCenter } from '@/utils/geometry/puzzleGeometry';

/**
 * A custom hook that adapts the puzzle state when the canvas size changes.
 * It listens for changes in canvasSize and recalculates the positions of all puzzle pieces
 * to maintain their relative placement on the new canvas.
 * This hook does not return anything; it dispatches actions to the GameContext.
 */
export const usePuzzleAdaptation = (canvasSize: { width: number; height: number } | null) => {
  const { state, dispatch } = useGame();
  const { puzzle, originalPositions, previousCanvasSize, isScattered } = state;

  useEffect(() => {
    if (
      !canvasSize || // Guard against null/undefined canvasSize
      !isScattered ||
      !previousCanvasSize ||
      !puzzle ||
      puzzle.length === 0 ||
      (previousCanvasSize.width === canvasSize.width && previousCanvasSize.height === canvasSize.height)
    ) {
      return;
    }

    const newPuzzleState = puzzle.map((piece: PuzzlePiece): PuzzlePiece => {
      if (piece.isCompleted) {
        const originalPiece = originalPositions.find((p: PuzzlePiece) => p.id === piece.id);
        if (!originalPiece) return piece;

        const shapeWidth = 1000;
        const shapeHeight = 1000;
        const scale = Math.min(canvasSize.width / shapeWidth, canvasSize.height / shapeHeight);
        
        const offsetX = (canvasSize.width - shapeWidth * scale) / 2;
        const offsetY = (canvasSize.height - shapeHeight * scale) / 2;

        const newPoints = originalPiece.points.map((p: Point) => ({
          x: p.x * scale + offsetX,
          y: p.y * scale + offsetY,
        }));
        
        return {
          ...piece,
          points: newPoints,
          rotation: originalPiece.rotation,
        };
      } else {
        const oldCenter = calculateCenter(piece.points);
        
        const normalizedX = oldCenter.x / previousCanvasSize.width;
        const normalizedY = oldCenter.y / previousCanvasSize.height;

        const newCenterX = normalizedX * canvasSize.width;
        const newCenterY = normalizedY * canvasSize.height;
        
        const relativePoints = piece.points.map((p: Point) => ({
            x: p.x - oldCenter.x,
            y: p.y - oldCenter.y
        }));
        
        const newPoints = relativePoints.map((p: Point) => ({
            x: p.x + newCenterX,
            y: p.y + newCenterY,
        }));

        return {
          ...piece,
          points: newPoints,
        };
      }
    });

    dispatch({
      type: 'UPDATE_ADAPTED_PUZZLE_STATE',
      payload: {
        puzzle: newPuzzleState,
      },
    });

  }, [canvasSize, isScattered, previousCanvasSize, puzzle, originalPositions, dispatch]);
}; 