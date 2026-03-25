/**
 * 拼图交互编排：拾取 / 拖拽 / 双指旋转分模块组合，单一数据源由宿主传入。
 */

import { RefObject, useCallback, useRef } from "react";
import type { GameAction, GameState, Point, PuzzlePiece } from "@/types/puzzleTypes";
import { usePieceDrag } from "@/hooks/puzzleInteractions/usePieceDrag";
import { usePieceRotationTouch } from "@/hooks/puzzleInteractions/usePieceRotationTouch";
import { usePieceSelection } from "@/hooks/puzzleInteractions/usePieceSelection";

interface UsePuzzleInteractionsProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasSize: { width: number; height: number };
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  ensurePieceInBounds: (
    piece: PuzzlePiece,
    dx: number,
    dy: number,
    margin: number,
  ) => { constrainedDx: number; constrainedDy: number; hitBoundary: boolean };
  calculatePieceBounds: (piece: PuzzlePiece) => {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  rotatePiece: (clockwise: boolean) => void;
  isShaking: boolean;
  setIsShaking: React.Dispatch<React.SetStateAction<boolean>>;
  playPieceSelectSound: () => Promise<void>;
  playPieceSnapSound: () => Promise<void>;
  playFinishSound: () => Promise<void>;
  playRotateSound: () => Promise<void>;
  trackDragOperation: () => void;
  trackRotation: () => void;
}

export function usePuzzleInteractions({
  canvasRef,
  containerRef: _containerRef,
  canvasSize: _canvasSize,
  state,
  dispatch,
  ensurePieceInBounds,
  calculatePieceBounds,
  rotatePiece,
  isShaking: _isShaking,
  setIsShaking,
  playPieceSelectSound,
  playPieceSnapSound,
  playFinishSound: _playFinishSound,
  playRotateSound,
  trackDragOperation,
  trackRotation,
}: UsePuzzleInteractionsProps) {
  const lastTouchRef = useRef<Point | null>(null);

  const { handleMouseDown, handleTouchStartSingleFinger } = usePieceSelection({
    canvasRef,
    state,
    dispatch,
    trackDragOperation,
    playPieceSelectSound,
  });

  const {
    setTouchStartAngle,
    handleTouchStartTwoFingers,
    handleTouchMoveRotation,
  } = usePieceRotationTouch({
    canvasRef,
    state,
    dispatch,
    rotatePiece,
    trackRotation,
    playRotateSound,
    playPieceSelectSound,
  });

  const { handleMouseMove, handleMouseUp, handleTouchMoveSingleFinger, handleTouchEnd } =
    usePieceDrag({
      canvasRef,
      state,
      dispatch,
      ensurePieceInBounds,
      calculatePieceBounds,
      setIsShaking,
      playPieceSnapSound,
      lastTouchRef,
      setTouchStartAngle,
    });

  // [P1-HR-03 PROTECT] 触摸/鼠标交互路径属于多端适配关键链路；子模块内已标注，此处仅做事件分发。
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!canvasRef.current || !state.puzzle) return;
      if (!state.isScattered) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;
        lastTouchRef.current = { x: touchX, y: touchY };
        handleTouchStartSingleFinger(touchX, touchY);
      } else if (e.touches.length === 2) {
        handleTouchStartTwoFingers(e);
      }
    },
    [
      canvasRef,
      state.puzzle,
      state.isScattered,
      handleTouchStartSingleFinger,
      handleTouchStartTwoFingers,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.touches.length >= 2 && state.selectedPiece !== null) {
        handleTouchMoveRotation(e);
        return;
      }
      if (e.touches.length === 1) {
        handleTouchMoveSingleFinger(e);
      }
    },
    [state.selectedPiece, handleTouchMoveRotation, handleTouchMoveSingleFinger],
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
