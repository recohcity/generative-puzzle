import { RefObject, useCallback } from "react";
import type { GameAction, GameState, Point, PuzzlePiece } from "@/types/puzzleTypes";
import { calculateAngle, calculateCenter } from "@/utils/geometry/puzzleGeometry";

export interface UsePieceDragParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
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
  setIsShaking: React.Dispatch<React.SetStateAction<boolean>>;
  playPieceSnapSound: () => Promise<void>;
  lastTouchRef: RefObject<Point | null>;
  setTouchStartAngle: (angle: number) => void;
}

/**
 * 指针拖拽与吸附：鼠标 move/up，单指 touchmove，touchend 收敛。
 * [P1-HR-03] 边界与磁吸行为禁止未验证改动。
 */
export function usePieceDrag({
  canvasRef,
  state,
  dispatch,
  ensurePieceInBounds,
  calculatePieceBounds,
  setIsShaking,
  playPieceSnapSound,
  lastTouchRef,
  setTouchStartAngle,
}: UsePieceDragParams) {
  const canvasWidth = state.canvasSize ? state.canvasSize.width : 0;
  const canvasHeight = state.canvasSize ? state.canvasSize.height : 0;

  const runBoundaryShake = useCallback(
    (pieceIndex: number, piece: PuzzlePiece, dx: number, dy: number) => {
      let animationStep = 0;
      const maxSteps = 6;
      const shakeAmount = [8, -6, 5, -4, 3, -2];
      let shakeDirectionX = 0;
      let shakeDirectionY = 0;
      const bounds = calculatePieceBounds(piece);
      const safeMargin = 1;
      if (bounds.minX <= safeMargin) shakeDirectionX = 1;
      else if (bounds.maxX >= canvasWidth - safeMargin) shakeDirectionX = -1;
      if (bounds.minY <= safeMargin) shakeDirectionY = 1;
      else if (bounds.maxY >= canvasHeight - safeMargin) shakeDirectionY = -1;
      if (shakeDirectionX === 0 && Math.abs(dx) > Math.abs(dy))
        shakeDirectionX = -Math.sign(dx);
      if (shakeDirectionY === 0 && Math.abs(dy) > Math.abs(dx))
        shakeDirectionY = -Math.sign(dy);
      if (shakeDirectionX === 0 && shakeDirectionY === 0) {
        shakeDirectionX = dx < 0 ? 1 : -1;
      }
      const shakeAnimation = () => {
        if (animationStep >= maxSteps || !canvasRef.current) return;
        const shakeX = shakeDirectionX * shakeAmount[animationStep];
        const shakeY = shakeDirectionY * shakeAmount[animationStep];
        dispatch({
          type: "UPDATE_PIECE_POSITION",
          payload: { index: pieceIndex, dx: shakeX, dy: shakeY },
        });
        animationStep++;
        setTimeout(shakeAnimation, 30);
      };
      setTimeout(shakeAnimation, 10);
    },
    [canvasRef, canvasWidth, canvasHeight, calculatePieceBounds, dispatch],
  );

  const applyMagnet = useCallback(
    (canvasX: number, canvasY: number) => {
      if (state.selectedPiece === null || !state.originalPositions || !state.puzzle) return;
      const pieceIndex = state.selectedPiece;
      const piece = state.puzzle[pieceIndex];
      const originalPiece = state.originalPositions[pieceIndex];
      const pieceCenter = calculateCenter(piece.points);
      const originalCenter = calculateCenter(originalPiece.points);
      if (pieceCenter && originalCenter) {
        const magnetThreshold = 50;
        const mdx = pieceCenter.x - originalCenter.x;
        const mdy = pieceCenter.y - originalCenter.y;
        const distance = Math.sqrt(mdx * mdx + mdy * mdy);
        if (distance < magnetThreshold) {
          const magnetStrength = 0.15;
          const attractionFactor = 1 - distance / magnetThreshold;
          const attractionX = -mdx * attractionFactor * magnetStrength;
          const attractionY = -mdy * attractionFactor * magnetStrength;
          if (Math.abs(attractionX) > 0.1 || Math.abs(attractionY) > 0.1) {
            dispatch({
              type: "UPDATE_PIECE_POSITION",
              payload: { index: pieceIndex, dx: attractionX, dy: attractionY },
            });
            dispatch({
              type: "SET_DRAGGING_PIECE",
              payload: { index: pieceIndex, startX: canvasX, startY: canvasY },
            });
          }
        }
      }
    },
    [state.selectedPiece, state.originalPositions, state.puzzle, dispatch],
  );

  const applyMagnetTouch = useCallback(
    (touchX: number, touchY: number) => {
      if (state.selectedPiece === null || !state.originalPositions || !state.puzzle) return;
      const pieceIndex = state.selectedPiece;
      const piece = state.puzzle[pieceIndex];
      const originalPiece = state.originalPositions[pieceIndex];
      const pieceCenter = calculateCenter(piece.points);
      const originalCenter = calculateCenter(originalPiece.points);
      if (pieceCenter && originalCenter) {
        const magnetThreshold = 50;
        const mdx = pieceCenter.x - originalCenter.x;
        const mdy = pieceCenter.y - originalCenter.y;
        const distance = Math.sqrt(mdx * mdx + mdy * mdy);
        if (distance < magnetThreshold) {
          const magnetStrength = 0.15;
          const attractionFactor = 1 - distance / magnetThreshold;
          const attractionX = -mdx * attractionFactor * magnetStrength;
          const attractionY = -mdy * attractionFactor * magnetStrength;
          if (Math.abs(attractionX) > 0.1 || Math.abs(attractionY) > 0.1) {
            dispatch({
              type: "UPDATE_PIECE_POSITION",
              payload: { index: pieceIndex, dx: attractionX, dy: attractionY },
            });
          }
        }
      }
    },
    [state.selectedPiece, state.originalPositions, state.puzzle, dispatch],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!state.draggingPiece || !state.puzzle) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const dx = x - state.draggingPiece.startX;
      const dy = y - state.draggingPiece.startY;
      const piece = state.puzzle[state.draggingPiece.index];
      const { constrainedDx, constrainedDy, hitBoundary } = ensurePieceInBounds(
        piece,
        dx,
        dy,
        1,
      );

      dispatch({
        type: "UPDATE_PIECE_POSITION",
        payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
      });

      if (hitBoundary) {
        dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
        setIsShaking(false);
        const pieceIndex = state.draggingPiece.index;
        runBoundaryShake(pieceIndex, piece, dx, dy);
      }

      if (!hitBoundary) {
        dispatch({
          type: "SET_DRAGGING_PIECE",
          payload: { index: state.draggingPiece.index, startX: x, startY: y },
        });
        applyMagnet(x, y);
      }
    },
    [
      state.draggingPiece,
      state.puzzle,
      canvasRef,
      ensurePieceInBounds,
      dispatch,
      setIsShaking,
      runBoundaryShake,
      applyMagnet,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (!state.isScattered) return;
    if (!state.draggingPiece || !state.puzzle || !state.originalPositions) return;

    const pieceIndex = state.draggingPiece.index;
    const piece = state.puzzle[pieceIndex];
    const originalPiece = state.originalPositions[pieceIndex];
    let isNearOriginal = false;
    const pieceRotation = ((piece.rotation % 360) + 360) % 360;
    const originalRotation = ((originalPiece.rotation % 360) + 360) % 360;
    const rotationDiff = Math.min(
      Math.abs(pieceRotation - originalRotation),
      360 - Math.abs(pieceRotation - originalRotation),
    );
    const isRotationCorrect = rotationDiff < 15;

    if (isRotationCorrect) {
      const pieceCenter = calculateCenter(piece.points);
      const originalCenter = calculateCenter(originalPiece.points);
      const distanceThreshold = 40;
      const mx = pieceCenter.x - originalCenter.x;
      const my = pieceCenter.y - originalCenter.y;
      isNearOriginal = Math.sqrt(mx * mx + my * my) < distanceThreshold;
    }

    if (isNearOriginal) {
      dispatch({ type: "RESET_PIECE_TO_ORIGINAL", payload: pieceIndex });
      dispatch({ type: "ADD_COMPLETED_PIECE", payload: pieceIndex });
      dispatch({ type: "SET_SELECTED_PIECE", payload: null });
      setIsShaking(false);
      void playPieceSnapSound();
    }
    dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
  }, [
    state.isScattered,
    state.draggingPiece,
    state.puzzle,
    state.originalPositions,
    dispatch,
    setIsShaking,
    playPieceSnapSound,
  ]);

  const handleTouchMoveSingleFinger = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];
      const touchX = (touch.clientX - rect.left) * scaleX;
      const touchY = (touch.clientY - rect.top) * scaleY;

      if (lastTouchRef.current) {
        const dx = touchX - lastTouchRef.current.x;
        const dy = touchY - lastTouchRef.current.y;

        if (!state.puzzle || !state.draggingPiece) return;
        const piece = state.puzzle[state.draggingPiece.index];
        const { constrainedDx, constrainedDy, hitBoundary } = ensurePieceInBounds(
          piece,
          dx,
          dy,
          1,
        );
        dispatch({
          type: "UPDATE_PIECE_POSITION",
          payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
        });

        if (hitBoundary) {
          dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
          setIsShaking(false);
          const pieceIndex = state.draggingPiece.index;
          runBoundaryShake(pieceIndex, piece, dx, dy);
        } else {
          lastTouchRef.current = { x: touchX, y: touchY };
          applyMagnetTouch(touchX, touchY);
        }
      } else {
        lastTouchRef.current = { x: touchX, y: touchY };
      }
    },
    [
      canvasRef,
      lastTouchRef,
      state.puzzle,
      state.draggingPiece,
      ensurePieceInBounds,
      dispatch,
      setIsShaking,
      runBoundaryShake,
      applyMagnetTouch,
    ],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.touches.length === 0) {
        handleMouseUp();
        setIsShaking(false);
        lastTouchRef.current = null;
        setTouchStartAngle(0);
      } else if (e.touches.length === 1) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;
        lastTouchRef.current = { x: touchX, y: touchY };
        setTouchStartAngle(0);
        if (state.selectedPiece !== null) {
          dispatch({
            type: "SET_DRAGGING_PIECE",
            payload: { index: state.selectedPiece, startX: touchX, startY: touchY },
          });
        }
      } else if (e.touches.length === 2) {
        dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
        lastTouchRef.current = null;
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          setTouchStartAngle(
            calculateAngle(
              (touch1.clientX - rect.left) * scaleX,
              (touch1.clientY - rect.top) * scaleY,
              (touch2.clientX - rect.left) * scaleX,
              (touch2.clientY - rect.top) * scaleY,
            ),
          );
        }
      }
    },
    [
      canvasRef,
      dispatch,
      handleMouseUp,
      lastTouchRef,
      setIsShaking,
      setTouchStartAngle,
      state.selectedPiece,
    ],
  );

  return {
    handleMouseMove,
    handleMouseUp,
    handleTouchMoveSingleFinger,
    handleTouchEnd,
  };
}
