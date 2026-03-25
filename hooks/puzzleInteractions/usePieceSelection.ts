import { RefObject, useCallback } from "react";
import type { GameAction, GameState } from "@/types/puzzleTypes";
import { findPieceIndexAtCanvasPoint } from "@/hooks/puzzleInteractions/pieceHitTest";

export interface UsePieceSelectionParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  trackDragOperation: () => void;
  playPieceSelectSound: () => Promise<void>;
}

/**
 * 拼图拾取：鼠标按下与单指 touchstart（含统计与 dispatch）。
 * [P1-HR-03] 命中与坐标缩放逻辑须与旧实现保持一致，变更需多端回归。
 */
export function usePieceSelection({
  canvasRef,
  state,
  dispatch,
  trackDragOperation,
  playPieceSelectSound,
}: UsePieceSelectionParams) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;

      const canvas = canvasRef.current;
      if (!canvas || state.isCompleted) return;
      if (!state.isScattered) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const clickedPieceIndex = findPieceIndexAtCanvasPoint(
        state.puzzle,
        state.completedPieces,
        x,
        y,
        20,
      );

      if (clickedPieceIndex !== -1) {
        dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex });
        dispatch({
          type: "SET_DRAGGING_PIECE",
          payload: { index: clickedPieceIndex, startX: x, startY: y },
        });
        try {
          trackDragOperation();
        } catch (error) {
          console.warn("统计追踪失败 (拖拽):", error);
        }
        void playPieceSelectSound();
      } else {
        dispatch({ type: "SET_SELECTED_PIECE", payload: null });
        dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
      }
    },
    [
      canvasRef,
      state.isCompleted,
      state.isScattered,
      state.puzzle,
      state.completedPieces,
      dispatch,
      trackDragOperation,
      playPieceSelectSound,
    ],
  );

  const handleTouchStartSingleFinger = useCallback(
    (touchX: number, touchY: number) => {
      const clickedPieceIndex = findPieceIndexAtCanvasPoint(
        state.puzzle,
        state.completedPieces,
        touchX,
        touchY,
        30,
      );

      if (clickedPieceIndex !== -1) {
        dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex });
        dispatch({
          type: "SET_DRAGGING_PIECE",
          payload: { index: clickedPieceIndex, startX: touchX, startY: touchY },
        });
        try {
          trackDragOperation();
        } catch (error) {
          console.warn("统计追踪失败 (触摸拖拽):", error);
        }
        void playPieceSelectSound();
      }
    },
    [
      state.puzzle,
      state.completedPieces,
      dispatch,
      trackDragOperation,
      playPieceSelectSound,
    ],
  );

  return { handleMouseDown, handleTouchStartSingleFinger };
}
