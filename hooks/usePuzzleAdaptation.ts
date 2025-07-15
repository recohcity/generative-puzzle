import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Point, PuzzlePiece } from '@/types/puzzleTypes';
import { calculateCenter } from '@/utils/geometry/puzzleGeometry';

/**
 * usePuzzleAdaptation
 * 本 Hook 负责在画布尺寸变化时，自动适配所有拼图块的位置和旋转，实现拼图状态的记忆与恢复。
 * 监听 canvasSize、isScattered、previousCanvasSize、puzzle、originalPositions 等依赖。
 * 
 * 适配流程：
 * 1. 对于已完成的拼图块，查找 originalPositions，按归一化点位和新画布尺寸缩放恢复。
 *    （注意：此处假设 originalPositions 的点为归一化坐标，需与生成逻辑保持一致）
 * 2. 对于未完成的拼图块，计算当前中心点，归一化为 normalizedX/Y（相对于 previousCanvasSize），
 *    再反归一化到新画布尺寸，保持相对位置。
 *    （建议：在拖拽/移动拼图块时同步更新 normalizedX/Y 字段，便于下次适配更精确）
 * 3. 适配后通过 dispatch({ type: 'UPDATE_ADAPTED_PUZZLE_STATE', payload: { ... } }) 批量更新状态。
 *    （注意：payload 字段需与 reducer 保持一致，否则适配结果无法写入 state）
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