import { RefObject, useCallback, useState } from "react";
import type { GameAction, GameState } from "@/types/puzzleTypes";
import { calculateAngle } from "@/utils/geometry/puzzleGeometry";
import { findPieceIndexAtCanvasPoint } from "@/hooks/puzzleInteractions/pieceHitTest";

export interface UsePieceRotationTouchParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  rotatePiece: (clockwise: boolean) => void;
  trackRotation: () => void;
  playRotateSound: () => Promise<void>;
  playPieceSelectSound: () => Promise<void>;
}

/**
 * 双指旋转：touchstart（两指）角度初始化 + touchmove 15° 步进。
 * [P1-HR-03] 触摸旋转路径禁止未验证的结构性改动。
 */
export function usePieceRotationTouch({
  canvasRef,
  state,
  dispatch,
  rotatePiece,
  trackRotation,
  playRotateSound,
  playPieceSelectSound,
}: UsePieceRotationTouchParams) {
  const [touchStartAngle, setTouchStartAngle] = useState(0);

  const handleTouchStartTwoFingers = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = ((touch1.clientX + touch2.clientX) / 2 - rect.left) * scaleX;
      const centerY = ((touch1.clientY + touch2.clientY) / 2 - rect.top) * scaleY;

      if (state.selectedPiece === null) {
        const clickedPieceIndex = findPieceIndexAtCanvasPoint(
          state.puzzle,
          state.completedPieces,
          centerX,
          centerY,
          -1,
        );
        if (clickedPieceIndex !== -1) {
          dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex });
          void playPieceSelectSound();
        }
      }

      const angle = calculateAngle(
        (touch1.clientX - rect.left) * scaleX,
        (touch1.clientY - rect.top) * scaleY,
        (touch2.clientX - rect.left) * scaleX,
        (touch2.clientY - rect.top) * scaleY,
      );
      setTouchStartAngle(angle);
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
    },
    [
      canvasRef,
      state.selectedPiece,
      state.puzzle,
      state.completedPieces,
      dispatch,
      playPieceSelectSound,
    ],
  );

  const handleTouchMoveRotation = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (e.touches.length < 2 || state.selectedPiece === null) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const touch1X = (touch1.clientX - rect.left) * scaleX;
      const touch1Y = (touch1.clientY - rect.top) * scaleY;
      const touch2X = (touch2.clientX - rect.left) * scaleX;
      const touch2Y = (touch2.clientY - rect.top) * scaleY;

      const currentAngle = calculateAngle(touch1X, touch1Y, touch2X, touch2Y);

      if (touchStartAngle !== 0) {
        let rotationChange = currentAngle - touchStartAngle;
        if (rotationChange > 180) rotationChange -= 360;
        else if (rotationChange < -180) rotationChange += 360;

        if (Math.abs(rotationChange) >= 15) {
          rotatePiece(rotationChange > 0);
          try {
            trackRotation();
          } catch (error) {
            console.warn("统计追踪失败 (旋转):", error);
          }
          void playRotateSound();
          setTouchStartAngle(currentAngle);
        }
      } else {
        setTouchStartAngle(currentAngle);
      }
    },
    [
      canvasRef,
      state.selectedPiece,
      touchStartAngle,
      rotatePiece,
      trackRotation,
      playRotateSound,
    ],
  );

  return {
    touchStartAngle,
    setTouchStartAngle,
    handleTouchStartTwoFingers,
    handleTouchMoveRotation,
  };
}
