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
// 修正：usePuzzleAdaptation为具名导出，需用花括号导入
import { usePuzzleAdaptation } from '@/hooks/usePuzzleAdaptation';
import { useDebugToggle } from '@/hooks/useDebugToggle';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// ========================
// 画布适配核心流程说明
//
// 1. 画布相关状态（canvasWidth, canvasHeight, scale, orientation, previousCanvasSize）
//    统一由GameContext集中管理，作为全局适配与归一化的唯一基准。
// 2. 监听机制采用window.resize、orientationchange和ResizeObserver，
//    并用requestAnimationFrame节流，避免高频重绘，保障性能。
// 3. 每次尺寸/方向变化时，先记录previousCanvasSize，再原子性更新所有画布相关状态，
//    保证适配流程的前后状态可追溯、一致。
// 4. 画布状态变化后，自动驱动下游适配（如usePuzzleAdaptation），
//    保证目标形状、拼图块等内容始终与画布同步，且幂等、无需手动触发。
// 5. 对极端尺寸（超小、超大、超宽、超窄）和方向切换场景，
//    设定安全区间，超出时自动回退，防止内容溢出、消失或变形。
//
// 以上流程和参数均有详细注释，便于团队理解、维护和后续扩展。
// ========================

import { DESKTOP_ADAPTATION, MOBILE_ADAPTATION } from '@/constants/canvasAdaptation';

// 画布尺寸边界常量（使用统一适配参数）
const MIN_CANVAS_WIDTH = DESKTOP_ADAPTATION.MIN_CANVAS_SIZE; // 画布最小宽度，防止内容过小或消失
const MIN_CANVAS_HEIGHT = DESKTOP_ADAPTATION.MIN_CANVAS_SIZE; // 画布最小高度
const MAX_CANVAS_WIDTH = DESKTOP_ADAPTATION.MAX_CANVAS_SIZE; // 画布最大宽度，防止内容溢出
const MAX_CANVAS_HEIGHT = DESKTOP_ADAPTATION.MAX_CANVAS_SIZE; // 画布最大高度

// 画布自适应监听与节流实现
function useCanvasResizeObserver(onResize: (width: number, height: number) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frameId: number | null = null;
    const handleResize = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          onResize(Math.round(rect.width), Math.round(rect.height));
        }
      });
    };
    // 监听window resize和orientationchange
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    // 可选：使用ResizeObserver监听容器变化
    let observer: ResizeObserver | null = null;
    if (containerRef.current && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => handleResize());
      observer.observe(containerRef.current);
    }
    // 初始化时触发一次
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (observer && containerRef.current) observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [onResize]);
  return containerRef;
}

export default function PuzzleCanvas() {
  const { state, dispatch, canvasRef, backgroundCanvasRef, ensurePieceInBounds, calculatePieceBounds, rotatePiece } = useGame();
  
  // 画布resize时的原子状态更新（含边界与容错处理）
  const containerRef = useCanvasResizeObserver((width, height) => {
    // 边界处理：限制画布尺寸在安全区间，防止极端场景下内容溢出或消失
    let safeWidth = Math.max(MIN_CANVAS_WIDTH, Math.min(width, MAX_CANVAS_WIDTH));
    let safeHeight = Math.max(MIN_CANVAS_HEIGHT, Math.min(height, MAX_CANVAS_HEIGHT));
    if (safeWidth !== width || safeHeight !== height) {
      // 可选：在UI或console给出提示，便于调试和用户感知
      // console.warn('画布尺寸已自动回退到安全区域:', safeWidth, safeHeight);
    }
    // 记录前一帧尺寸，便于归一化适配和状态恢复
    const prevWidth = state.canvasWidth;
    const prevHeight = state.canvasHeight;
    // 方向判断，便于移动端适配
    const orientation = safeWidth >= safeHeight ? 'landscape' : 'portrait';
    // scale如有自适应缩放需求可扩展，这里暂用1
    const scale = 1;
    // 原子性dispatch所有相关状态，保证适配一致性
    dispatch({
      type: 'UPDATE_CANVAS_SIZE',
      payload: {
        canvasWidth: safeWidth,
        canvasHeight: safeHeight,
        scale,
        orientation,
        previousCanvasSize: { width: prevWidth, height: prevHeight },
      },
    });
  });
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
  
  // 顶层直接调用 usePuzzleAdaptation，确保每次渲染都响应最新画布状态
  usePuzzleAdaptation({ 
    width: state.canvasWidth, 
    height: state.canvasHeight
  });

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

  // 手动绑定触摸事件以避免被动监听器问题
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 将React事件处理器转换为原生事件处理器
    const nativeHandleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // 在非被动监听器中可以安全调用
      // 创建React合成事件对象
      const syntheticEvent = {
        preventDefault: () => {},
        touches: Array.from(e.touches).map(touch => ({
          clientX: touch.clientX,
          clientY: touch.clientY
        }))
      } as React.TouchEvent<HTMLCanvasElement>;
      handleTouchStart(syntheticEvent);
    };

    const nativeHandleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 在非被动监听器中可以安全调用
      const syntheticEvent = {
        preventDefault: () => {},
        touches: Array.from(e.touches).map(touch => ({
          clientX: touch.clientX,
          clientY: touch.clientY
        }))
      } as React.TouchEvent<HTMLCanvasElement>;
      handleTouchMove(syntheticEvent);
    };

    const nativeHandleTouchEnd = (e: TouchEvent) => {
      e.preventDefault(); // 在非被动监听器中可以安全调用
      e.stopPropagation();
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        touches: Array.from(e.touches).map(touch => ({
          clientX: touch.clientX,
          clientY: touch.clientY
        }))
      } as React.TouchEvent<HTMLCanvasElement>;
      handleTouchEnd(syntheticEvent);
    };

    // 添加非被动的触摸事件监听器
    canvas.addEventListener('touchstart', nativeHandleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', nativeHandleTouchMove, { passive: false });
    canvas.addEventListener('touchend', nativeHandleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', nativeHandleTouchEnd, { passive: false });

    return () => {
      // 清理事件监听器
      canvas.removeEventListener('touchstart', nativeHandleTouchStart);
      canvas.removeEventListener('touchmove', nativeHandleTouchMove);
      canvas.removeEventListener('touchend', nativeHandleTouchEnd);
      canvas.removeEventListener('touchcancel', nativeHandleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

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
    // 调试信息（已移除控制台输出）

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
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', boxSizing: 'content-box' }}
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
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', boxSizing: 'content-box' }}
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
      />
      <canvas
        ref={canvasRef}
        id="puzzle-canvas"
        style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer', boxSizing: 'content-box' }}
        width={canvasSize?.width || 0}
        height={canvasSize?.height || 0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        // 触摸事件通过useEffect手动绑定以避免被动监听器问题
      />
    </div>
  );
}
