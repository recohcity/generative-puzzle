"use client"

import type React from "react"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useGame } from "@/contexts/GameContext"
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useTranslation } from '@/contexts/I18nContext'

import {
  drawPuzzle,
  drawHintOutline,
  drawCanvasBorderLine,
  drawShape
} from "@/utils/rendering/puzzleDrawing";

import { PuzzlePiece } from "@/types/puzzleTypes";

import { usePuzzleInteractions } from "@/hooks/usePuzzleInteractions";
import { useDebugToggle } from '@/hooks/useDebugToggle';

// 画布尺寸边界常量
const MIN_CANVAS_WIDTH = 400;
const MIN_CANVAS_HEIGHT = 400;
const MAX_CANVAS_WIDTH = 1000;
const MAX_CANVAS_HEIGHT = 1000;

// 冻结解冻机制Hook
function useCanvasResizeObserver(
  onResize: (width: number, height: number) => void,
  onUnfreeze: (width: number, height: number) => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFrozenRef = useRef(false);
  const pendingResizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let frameId: number | null = null;
    const handleResize = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);

          // 冻结机制：窗口变化时立即冻结适配
          if (!isFrozenRef.current) {
            isFrozenRef.current = true;
          }

          pendingResizeRef.current = { width, height };

          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          // 解冻机制：窗口稳定100ms后解冻
          resizeTimeoutRef.current = setTimeout(() => {
            if (pendingResizeRef.current && isFrozenRef.current) {
              onUnfreeze(pendingResizeRef.current.width, pendingResizeRef.current.height);
              isFrozenRef.current = false;
              pendingResizeRef.current = null;
            }
          }, 100);
        }
      });
    };

    let observer: ResizeObserver | null = null;
    let handleWindowResize: (() => void) | null = null;

    if (containerRef.current && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => handleResize());
      observer.observe(containerRef.current);
    } else {
      handleWindowResize = () => handleResize();
      window.addEventListener('resize', handleWindowResize);
      window.addEventListener('orientationchange', handleWindowResize);
    }

    handleResize();

    return () => {
      if (observer) {
        observer.disconnect();
      } else if (handleWindowResize) {
        window.removeEventListener('resize', handleWindowResize);
        window.removeEventListener('orientationchange', handleWindowResize);
      }
      if (frameId) window.cancelAnimationFrame(frameId);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [onResize, onUnfreeze]);

  return containerRef;
}

export default function PuzzleCanvas() {
  const { state, dispatch, canvasRef, backgroundCanvasRef, ensurePieceInBounds, calculatePieceBounds, rotatePiece } = useGame();
  const { t, getRandomCompletionMessage } = useTranslation();

  // 解冻专用函数：从冻结前尺寸适配到当前尺寸
  const handleUnfreeze = useCallback((width: number, height: number) => {
    dispatch({
      type: 'UPDATE_CANVAS_SIZE',
      payload: {
        canvasSize: { width, height },
        scale: 1,
        orientation: width >= height ? 'landscape' : 'portrait',
        forceUpdate: true,
      }
    });
  }, [dispatch]);

  // 画布resize处理
  const containerRef = useCanvasResizeObserver(
    (width, height) => {
      const safeWidth = Math.max(MIN_CANVAS_WIDTH, Math.min(width, MAX_CANVAS_WIDTH));
      const safeHeight = Math.max(MIN_CANVAS_HEIGHT, Math.min(height, MAX_CANVAS_HEIGHT));
      const prevWidth = state.canvasWidth;
      const prevHeight = state.canvasHeight;
      const orientation = safeWidth >= safeHeight ? 'landscape' : 'portrait';

      // 冻结保护：检查是否需要冻结适配
      const aspectRatio = safeWidth / safeHeight;
      const isExtremeRatio = aspectRatio > 3 || aspectRatio < 0.3;
      const hasSignificantChange = Math.abs(safeWidth - prevWidth) > 100 || Math.abs(safeHeight - prevHeight) > 100;
      const needsProtection = isExtremeRatio || hasSignificantChange;

      dispatch({
        type: 'UPDATE_CANVAS_SIZE',
        payload: {
          canvasSize: { width: safeWidth, height: safeHeight },
          scale: 1,
          orientation,
          skipAdaptation: needsProtection,
        },
      });
    }, handleUnfreeze);

  const [showDebugElements] = useDebugToggle();
  const [isShaking, setIsShaking] = useState(false);

  // 画布尺寸计算
  const canvasSize = useMemo(() => {
    return state.canvasSize || null;
  }, [state.canvasSize]);

  // 适配状态同步
  const lastCanvasSizeRef = useRef<{ width: number; height: number } | null>(null);
  const gameStateRef = useRef<string>('');

  useEffect(() => {
    const currentCanvasSize = state.canvasSize || { width: 0, height: 0 };

    if (currentCanvasSize.width <= 0 || currentCanvasSize.height <= 0) {
      return;
    }

    const currentGameState = `${state.isScattered}-${state.isCompleted}-${state.puzzle?.length || 0}-${(state.completedPieces as number[])?.length || 0}`;
    const lastSize = lastCanvasSizeRef.current;
    const lastGameState = gameStateRef.current;

    const sizeUnchanged = lastSize && lastSize.width === currentCanvasSize.width && lastSize.height === currentCanvasSize.height;
    const stateUnchanged = lastGameState === currentGameState;

    if (sizeUnchanged && stateUnchanged) {
      return;
    }

    if (!state.originalShape?.length && !state.puzzle?.length && !state.originalPositions?.length) {
      lastCanvasSizeRef.current = currentCanvasSize;
      gameStateRef.current = currentGameState;
      return;
    }

    lastCanvasSizeRef.current = currentCanvasSize;
    gameStateRef.current = currentGameState;
  }, [state.canvasSize, state.originalShape, state.puzzle, state.originalPositions, state.isScattered, state.isCompleted, state.completedPieces]);

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
    canvasSize: canvasSize || { width: 0, height: 0 },
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



  // 渲染逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;

    if (!canvas || !backgroundCanvas || !canvasSize) {
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

    if (state.puzzle) {
      // 获取随机完成消息
      const completionMessage = getRandomCompletionMessage();

      drawPuzzle(
        ctx,
        state.puzzle,
        state.completedPieces as number[],
        state.selectedPiece,
        state.shapeType,
        state.originalShape,
        state.isScattered,
        completionMessage
      );

      if (state.showHint && state.selectedPiece !== null && (state.originalPositions as PuzzlePiece[]).length > 0) {
        const hintPiece = state.originalPositions[state.selectedPiece];
        if (hintPiece) {
          const hintText = t('game.hints.hintText');
          drawHintOutline(ctx, hintPiece, state.shapeType, hintText);
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

    drawCanvasBorderLine(ctx, canvasSize.width, canvasSize.height, showDebugElements);

    // F10调试功能：绘制中心+标记
    if (showDebugElements) {
      const canvasCenterX = canvasSize.width / 2;
      const canvasCenterY = canvasSize.height / 2;

      ctx.save();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvasCenterX - 15, canvasCenterY);
      ctx.lineTo(canvasCenterX + 15, canvasCenterY);
      ctx.moveTo(canvasCenterX, canvasCenterY - 15);
      ctx.lineTo(canvasCenterX, canvasCenterY + 15);
      ctx.stroke();
      ctx.restore();

      if (state.originalShape && state.originalShape.length > 0) {
        const shapeBounds = state.originalShape.reduce(
          (acc: { minX: number; minY: number; maxX: number; maxY: number }, point: { x: number; y: number }) => ({
            minX: Math.min(acc.minX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxX: Math.max(acc.maxX, point.x),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        const shapeCenterX = (shapeBounds.minX + shapeBounds.maxX) / 2;
        const shapeCenterY = (shapeBounds.minY + shapeBounds.maxY) / 2;

        ctx.save();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(shapeCenterX - 15, shapeCenterY);
        ctx.lineTo(shapeCenterX + 15, shapeCenterY);
        ctx.moveTo(shapeCenterX, shapeCenterY - 15);
        ctx.lineTo(shapeCenterX, shapeCenterY + 15);
        ctx.stroke();
        ctx.restore();
      }
    }

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
    state.originalPositions,
    calculatePieceBounds,
    canvasRef,
    backgroundCanvasRef,
    getRandomCompletionMessage,
    t
  ]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <canvas
        ref={backgroundCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
      />
      <canvas
        ref={canvasRef}
        id="puzzle-canvas"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          touchAction: 'none', // 🔧 关键修复：禁用浏览器默认触摸行为
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}