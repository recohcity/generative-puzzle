"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/GameContext"
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { calculatePieceBounds } from "@/utils/geometry/puzzleGeometry";
import { 
  drawPuzzle, 
  drawHintOutline, 
  drawCanvasBorderLine, 
  drawDistributionArea,
  drawShape
} from "@/utils/rendering/puzzleDrawing";

// 导入从 types/puzzleTypes.ts 迁移的类型
import { PuzzlePiece } from "@/types/puzzleTypes";

// 导入新的响应式画布尺寸管理 Hook
import { useResponsiveCanvasSizing } from "@/hooks/useResponsiveCanvasSizing";
// 导入新的拼图交互处理 Hook
import { usePuzzleInteractions } from "@/hooks/usePuzzleInteractions";
import { usePuzzleAdaptation } from '@/hooks/usePuzzleAdaptation';
import { useDebugToggle } from '@/hooks/useDebugToggle';

export default function PuzzleCanvas() {
  const { state, dispatch, canvasRef, backgroundCanvasRef, ensurePieceInBounds, calculatePieceBounds, rotatePiece } = useGame();
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showDebugElements] = useDebugToggle();
  const [isShaking, setIsShaking] = useState(false);
  
  const canvasSize = useResponsiveCanvasSizing({
    containerRef,
    canvasRef,
    backgroundCanvasRef,
  });
  
  usePuzzleAdaptation(canvasSize);

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePuzzleInteractions({
    canvasRef,
    containerRef,
    canvasSize,
    state,
    dispatch,
    ensurePieceInBounds,
    calculatePieceBounds,
    rotatePiece,
    isShaking,
    setIsShaking,
    playPieceSelectSound,
    playPieceSnapSound,
    playPuzzleCompletedSound,
    playRotateSound,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;

    if (!canvas || !backgroundCanvas || !canvasSize || !canvasSize.width || !canvasSize.height) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const backgroundCtx = backgroundCanvas.getContext("2d");

    if (!ctx || !backgroundCtx) {
      return;
    }

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    backgroundCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    if (isShaking) {
      ctx.save();
      ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
    }

    if (showDebugElements) {
      drawDistributionArea(ctx, canvasSize.width, canvasSize.height, showDebugElements);
    }

    if (state.puzzle) {
      drawPuzzle(
        ctx,
        state.puzzle,
        state.completedPieces,
        state.selectedPiece,
        state.shapeType,
        state.originalShape,
        state.isScattered
      );

      if (state.showHint && state.selectedPiece !== null && state.originalPositions.length > 0) {
        const hintPiece = state.originalPositions.find((p: PuzzlePiece) => p.id === state.selectedPiece);
        if (hintPiece) {
          drawHintOutline(ctx, hintPiece);
      }
      }

      if (showDebugElements && state.puzzle.length > 0) {
        state.puzzle.forEach((piece: PuzzlePiece, index: number) => {
          const bounds = calculatePieceBounds(piece);
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.85)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
          ctx.stroke();

          const centerX = bounds.minX + bounds.width / 2;
          const centerY = bounds.minY + bounds.height / 2;
          const r = 14;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,0,0,0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.stroke();

          ctx.fillStyle = 'black';
          ctx.font = 'bold 15px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), centerX, centerY);
          ctx.restore();
        });
      }
    } else if (state.originalShape && state.originalShape.length > 0) {
      drawShape(ctx, state.originalShape, state.shapeType);
    }
    
    drawCanvasBorderLine(ctx, canvasSize.width, canvasSize.height, false);

    if (isShaking) {
      ctx.restore();
    }

  }, [
    state.puzzle,
    state.completedPieces,
    state.selectedPiece, 
    state.shapeType,
    state.originalShape,
    state.isScattered,
    state.isCompleted,
    canvasSize,
    showDebugElements,
    isShaking,
    state.showHint,
    state.originalPositions
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden`}
    >
      <canvas
        ref={backgroundCanvasRef}
        className="absolute top-0 left-0"
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
      />
      <canvas
        ref={canvasRef}
        id="puzzle-canvas"
        className="relative cursor-pointer"
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
}
