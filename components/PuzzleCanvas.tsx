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
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function PuzzleCanvas() {
  const { state, dispatch, canvasRef, backgroundCanvasRef, ensurePieceInBounds, calculatePieceBounds, rotatePiece } = useGame();
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showDebugElements] = useDebugToggle();
  const [isShaking, setIsShaking] = useState(false);
  const debugLogRef = useRef<any[]>([]);
  const device = useDeviceDetection(); // { isMobile, isTablet, isDesktop }

  // 统一 debug 日志收集方法
  function logDebugEvent(eventType: string, actionDesc: string, extra: any = {}) {
    if (!showDebugElements) return;
    const canvasWidth = canvasSize?.width || 0;
    const canvasHeight = canvasSize?.height || 0;
    const logicalWidth = canvasRef.current?.width || 0;
    const logicalHeight = canvasRef.current?.height || 0;
    const scale = (canvasWidth && logicalWidth) ? (canvasWidth / logicalWidth) : 1;
    debugLogRef.current.push({
      time: new Date().toISOString(),
      event: eventType,
      action: actionDesc,
      device: {
        isMobile: device?.isMobile,
        isTablet: null, // 未实现
        isDesktop: null, // 未实现
        isPortrait: device?.isPortrait,
        isAndroid: device?.isAndroid,
        isIOS: device?.isIOS,
        screen: { width: device?.screenWidth, height: device?.screenHeight }
      },
      canvas: {
        width: canvasWidth,
        height: canvasHeight,
        logicalWidth,
        logicalHeight,
        scale
      },
      game: {
        totalPieces: state.puzzle?.length,
        completed: state.completedPieces?.length,
        isScattered: state.isScattered,
        isCompleted: state.isCompleted,
        difficulty: state.difficulty || null
      },
      pieces: state.puzzle?.map((piece: PuzzlePiece, idx: number) => {
        const center = piece.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        center.x /= piece.points.length;
        center.y /= piece.points.length;
        return {
          index: idx + 1,
          center,
          points: piece.points,
          rotation: piece.rotation,
          completed: state.completedPieces.includes(idx),
          selected: state.selectedPiece === idx
        };
      }),
      ...extra
    });
  }

  // 导出 debuglog 的函数
  function exportDebuglog() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fileName = `debugLog-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
    const blob = new Blob([JSON.stringify(debugLogRef.current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

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

    // debug 日志收集（默认记录渲染）
    logDebugEvent('render', '画布渲染');

    // debug 日志输出
    if (showDebugElements) {
      console.log('[debugLog] canvas:', {
        width: canvasSize.width,
        height: canvasSize.height,
        area: { x0: 0, y0: 0, x1: canvasSize.width, y1: canvasSize.height }
      });
      if (state.puzzle) {
        state.puzzle.forEach((piece: PuzzlePiece, idx: number) => {
          // 计算中心点
          const center = piece.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
          center.x /= piece.points.length;
          center.y /= piece.points.length;
          console.log('[debugLog] piece', idx + 1, {
            center,
            points: piece.points,
            rotation: piece.rotation,
            completed: state.completedPieces.includes(idx),
            selected: state.selectedPiece === idx
          });
        });
      }
    }

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    backgroundCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    if (isShaking) {
      ctx.save();
      ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5);
    }

    if (showDebugElements) {
      // drawDistributionArea(ctx, canvasSize.width, canvasSize.height, showDebugElements);
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
        const hintPiece = state.originalPositions[state.selectedPiece];
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
    
    drawCanvasBorderLine(ctx, canvasSize.width, canvasSize.height, showDebugElements);

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
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* debug模式下显示导出按钮 */}
      {showDebugElements && (
        <button
          onClick={exportDebuglog}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 9999,
            background: 'rgba(33, 0, 150, 0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 22px',
            fontSize: 16,
            fontWeight: 100,
            letterSpacing: 1,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(6, 1, 1, 0.18)',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(17, 3, 67, 0.8)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(33, 0, 150, 0.8)')}
        >
          导出 debuglog
        </button>
      )}
      <canvas
        ref={backgroundCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
      />
      <canvas
        ref={canvasRef}
        id="puzzle-canvas"
        style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
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
