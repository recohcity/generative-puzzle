"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/GameContext"
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound, playRotateSound } from "@/utils/rendering/soundEffects"
// Retaining necessary imports for interaction logic still in PuzzleCanvas
import { calculateCenter, calculatePieceBounds, isPointInPolygon, rotatePoint, calculateAngle } from "@/utils/geometry/puzzleGeometry";
import { appendAlpha } from "@/utils/rendering/colorUtils";

// 导入迁移到 utils/rendering/puzzleDrawing 的绘制函数和类型
import { 
  drawShape, 
  drawPuzzle, 
  drawPiece, 
  drawHintOutline, 
  drawCompletionEffect, 
  drawCanvasBorderLine, 
  drawDistributionArea 
} from "@/utils/rendering/puzzleDrawing";

// 导入从 types/puzzleTypes.ts 迁移的类型
import { Point, PuzzlePiece } from "@/types/puzzleTypes";

// 导入新的设备检测 Hook
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
// 导入新的响应式画布尺寸管理 Hook
import { useResponsiveCanvasSizing } from "@/hooks/useResponsiveCanvasSizing";
// 导入新的拼图交互处理 Hook
import { usePuzzleInteractions } from "@/hooks/usePuzzleInteractions";
import { cn } from "@/lib/utils";

export default function PuzzleCanvas() {
  // Access game context
  const { state, dispatch, canvasRef, backgroundCanvasRef, ensurePieceInBounds, calculatePieceBounds, rotatePiece } = useGame();
  
  // Use the new device detection hook
  const { isMobile } = useDeviceDetection();

  // Expose game state to window in test environment for Playwright access
  useEffect(() => {
    // Check if running in a test environment (e.g., if the test signal function exists)
    if (typeof (window as any).soundPlayedForTest === 'function') {
      // Expose the current game state
      (window as any).__gameStateForTests__ = state;
      console.log('Game state exposed to window.__gameStateForTests__ for testing.');
    }
    // Dependency array includes state so the exposed state is always current
  }, [state]);
  
  // Refs for canvas elements
  // containerRef 现在在 PuzzleCanvas 内部声明，并传递给 useResponsiveCanvasSizing
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Local state for dragging and canvas dimensions
  // const [isDragging, setIsDragging] = useState(false); // Moved to GameContext
  // const [selectedPiece, setSelectedPiece] = useState<number | null>(null); // Moved to GameContext
  // const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null); // Moved to GameContext
  const [showDebugElements, setShowDebugElements] = useState(false); // Keep local for now
  
  // State for shake animation
  const [isShaking, setIsShaking] = useState(false);
  
  // Access game context (re-added necessary destructuring)
  const { 
    // state and dispatch are already accessed above
    // state,
    // dispatch,
    // updateCanvasSize, // 已迁移到 useResponsiveCanvasSizing 内部调用
    // rotatePiece 
  } = useGame();
  
  // Local state and refs (re-added necessary declarations)
  // const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // 已迁移
  // const [isDragging, setIsDragging] = useState(false); // 保持本地拖拽状态
  // touchStartAngle 和 lastTouchRef 已迁移到 usePuzzleInteractions
  // animationFrameRef 和 resizeTimer 已迁移，无需在此声明
  // const isDarkMode = true; // Assuming this was local state or prop, keeping it here for now if needed
  
  // --- 使用新的 useResponsiveCanvasSizing Hook ---
  // 将所有必要的 ref 和 dispatch 作为单个对象传递，以匹配"应有 1 个参数"的错误
  // 此 Hook 负责将画布尺寸更新到 GameContext，不返回 canvasSize 或 containerRef
  useResponsiveCanvasSizing({ canvasRef, backgroundCanvasRef, containerRef });

  // --- 使用新的 usePuzzleInteractions Hook ---
  // 获取 canvasSize 以传递给 usePuzzleInteractions
  const canvasSize = { width: state.canvasWidth, height: state.canvasHeight };
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
    isShaking: state.isShaking,
    setIsShaking,
    playPieceSelectSound,
    playPieceSnapSound,
    playPuzzleCompletedSound,
    playRotateSound,
  });

  // --- 移除已迁移的函数和 Hook 逻辑 ---
  // setInitialCanvasSize 函数已迁移
  // handleResize 函数已迁移
  // updatePositions 函数暂时保留在 PuzzleCanvas 中，但在 Step 9 会被迁移
  // handleOrientationChange 已在步骤 6 中移除，其逻辑现在由 useResponsiveCanvasSizing 内部处理
  // --- 结束移除 ---

  // updatePositions 函数（暂时保留在此处，在步骤 9 会被迁移）
  const updatePositions = () => {
    if (!canvasRef.current || !state.puzzle) return;

    // 从 state 中获取画布尺寸，因为 canvasSize 已迁移到 GameContext
    const width = state.canvasWidth;
    const height = state.canvasHeight;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const shape = state.originalShape.map((point: Point) => ({
      x: point.x * width,
      y: point.y * height,
      isOriginal: true,
    }));

    // 检测设备和方向 (此处仍使用 navigator.userAgent，但最终应从 useDeviceDetection 获取)
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/i.test(ua);
    const isAndroidInternal = /Android/i.test(ua); // 内部临时变量，避免与 hook 冲突
    const isMobileInternal = isIPhone || isAndroidInternal;
    const isPortraitInternal = window.innerHeight > window.innerWidth;

    // 计算形状的包围盒
    const shapeBounds = shape.reduce(
      (bounds: { minX: number; minY: number; maxX: number; maxY: number }, point: Point) => ({
        minX: Math.min(bounds.minX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxX: Math.max(bounds.maxX, point.x),
        maxY: Math.max(bounds.maxY, point.y),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    const shapeWidth = shapeBounds.maxX - shapeBounds.minX;
    const shapeHeight = shapeBounds.maxY - shapeBounds.minY;

    // 调整不同设备上的缩放比例
    let scale = 0.8; // 默认缩放比例
    if (isMobileInternal && isPortraitInternal) {
      // 在移动设备竖屏模式下，形状应该占据画布的更大比例
      scale = Math.min(
        (width * 0.85) / shapeWidth, 
        (height * 0.85) / shapeHeight
      );
    } else if (isMobileInternal && !isPortraitInternal) {
      // 在移动设备横屏模式下，形状应该适当缩放以利用宽屏空间
      scale = Math.min(
        (width * 0.75) / shapeWidth, 
        (height * 0.8) / shapeHeight
      );
    } else {
      // 桌面和iPad模式下的正常缩放
      scale = Math.min(
        (width * 0.65) / shapeWidth, 
        (height * 0.65) / shapeHeight
      );
    }

    // ... 其余代码保持不变 ...
  };

  // 绘制拼图
  useEffect(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    const container = containerRef.current; // 使用本地声明的 containerRef

    if (!canvas || !backgroundCanvas || !container) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const backgroundCtx = backgroundCanvas.getContext("2d");

    if (!ctx || !backgroundCtx) {
      return;
    }

    // Get the current canvas dimensions from state
    const canvasWidth = state.canvasWidth;
    const canvasHeight = state.canvasHeight;

    // Clear old content before each draw to ensure no overwriting
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Only draw distribution area in debug mode
    if (showDebugElements) { // 启用时检查 showDebugElements
      drawDistributionArea(ctx, canvasWidth, canvasHeight, showDebugElements);
    }

    // If the game is completed, first draw a complete seamless shape
    if (state.isCompleted && state.originalShape && state.puzzle) {
      // When completed, drawPuzzle handles drawing the completed shape, fill, and effects.
      drawPuzzle(
        ctx,
        state.puzzle!, // Use non-null assertion as we checked state.puzzle above
        state.completedPieces,
        state.selectedPiece,
        state.shapeType,
        state.originalShape,
        state.isScattered
      ); // Use drawPuzzle function to draw the completed puzzle state

    } else if (state.puzzle) {
      // 确保 GameContext 中的画布尺寸是最新的
      // 注意：这一行逻辑现在由 useResponsiveCanvasSizing 内部处理，但为了安全和调试目的，可以暂时保留其依赖
      if (state.canvasWidth !== canvasWidth || state.canvasHeight !== canvasHeight) {
        // updateCanvasSize(canvasWidth, canvasHeight); // 这行不需要了，由 useResponsiveCanvasSizing 负责
      }

      // If there are puzzle pieces and the game is not completed
      // Add debug info, check state
      console.log("Rendering state:", {
        isScattered: state.isScattered,
        hasOriginalShape: state.originalShape && state.originalShape.length > 0,
        originalShapeLength: state.originalShape ? state.originalShape.length : 0,
        pieceCount: state.puzzle.length,
        // canvasBounds: canvasBounds // canvasBounds is not defined in this scope, need to remove or define
      });

      // Use drawPuzzle function to draw all content, including original shape outline if necessary
      drawPuzzle(
        ctx,
        state.puzzle,
        state.completedPieces,
        state.selectedPiece,
        state.shapeType,
        state.originalShape,
        state.isScattered
      ); // Use drawPuzzle function to draw current puzzle state


      // After drawing all pieces, draw the hint outline if needed
      if (state.showHint && state.selectedPiece !== null && state.originalPositions.length > 0) {
        // We need the piece data for the hint outline, which is stored in originalPositions for completed state
        // but in state.puzzle for scattered/uncompleted state.
        // Assuming drawHintOutline should show the target position from originalPositions
        // Need to ensure originalPositions piece has the necessary shape points or calculate them.
        // For now, let's pass the piece from originalPositions assuming it has the required 'points'.
        drawHintOutline(ctx, state.originalPositions[state.selectedPiece]);
      }

      // -----Debug function: Draw collision bounding boxes for each piece-----
      if (showDebugElements && state.puzzle && state.puzzle.length > 0) { // 仅在调试模式下绘制
        state.puzzle.forEach((piece: PuzzlePiece, index: number) => {
          // Calculate piece bounds using the imported function
          const bounds = calculatePieceBounds(piece);

          // Save drawing state
          ctx.save();

          // Use different bounding box color for each piece
          const pieceColors = [
            'rgba(0, 100, 255, 0.7)',   // Blue
            'rgba(255, 100, 0, 0.7)',   // Orange
            'rgba(0, 200, 100, 0.7)',   // Green
            'rgba(200, 0, 200, 0.7)',   // Purple
            'rgba(255, 200, 0, 0.7)',   // Yellow
            'rgba(200, 100, 100, 0.7)', // Brownish red
            'rgba(100, 200, 200, 0.7)'  // Cyan
          ];

          // Set bounding box style
          ctx.strokeStyle = pieceColors[index % pieceColors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);

          // Draw bounding box
          ctx.beginPath();
          ctx.rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
          ctx.stroke();

          // Add piece number marker
          ctx.fillStyle = 'white';
          ctx.fillRect(bounds.centerX - 10, bounds.centerY - 10, 20, 20);
          ctx.fillStyle = 'black';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), bounds.centerX, bounds.centerY);

          // Restore drawing state
          ctx.restore();
        });
      }

      // Finally draw the canvas border warning line, make sure it's on top
      drawCanvasBorderLine(ctx, canvasWidth, canvasHeight, false);
    } else if (state.originalShape && state.originalShape.length > 0) {
      // If there is only the original shape but no puzzle, then draw the original shape
      drawShape(ctx, state.originalShape, state.shapeType);

      // Draw canvas border warning line
      drawCanvasBorderLine(ctx, canvasWidth, canvasHeight, false);
    }

    return () => {
      // Clear any possibly pending animation frame requests
      // animationFrameRef 已迁移，无需在此清理
    };
  }, [
    state.puzzle,
    state.completedPieces,
    state.selectedPiece, 
    state.showHint,
    state.isCompleted,
    state.originalShape,
    state.shapeType,
    state.isScattered,
    state.canvasWidth, // <-- 依赖 state.canvasWidth
    state.canvasHeight, // <-- 依赖 state.canvasHeight
    showDebugElements, // 添加依赖项以触发调试元素绘制更新
    // Add dependencies for functions used in the effect if they are not stable references
    // drawDistributionArea, drawShape, drawCompletionEffect, drawPuzzle, drawHintOutline, drawCanvasBorderLine, calculatePieceBounds
    // However, since these are imported functions/constants, they should be stable and don't need to be in the dependency array unless they are redefined within the component.
    // updateCanvasSize - This function is from useGame and should be stable
  ]);

  // 添加键盘事件监听器，用于切换调试元素显示
  const handleKeyDown = (e: KeyboardEvent) => {
    // F10键 (keyCode 121)
    if (e.key === 'F10' || e.keyCode === 121) {
      e.preventDefault(); // 防止浏览器默认行为
      setShowDebugElements(prev => !prev); // 切换调试元素显示状态
      console.log(`调试元素显示状态切换为: ${!showDebugElements}`);
    }
  };

  // Canvas 初始化和事件监听的 useEffect
  useEffect(() => {
    console.log('[PuzzleCanvas] 初始化画布尺寸并添加事件监听器');

    // 仅添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown);

    // 根据 state.canvasWidth/Height 的变化触发 updatePositions，实现适配逻辑
    // useResponsiveCanvasSizing 已经负责了尺寸的计算和更新 GameContext
    // 这里的 useEffect 监听 state.canvasWidth/Height 变化，然后触发拼图位置的更新
    if (state.canvasWidth > 0 && state.canvasHeight > 0) {
      console.log(`[PuzzleCanvas] 检测到画布尺寸变化: ${state.canvasWidth}x${state.canvasHeight}, 触发拼图位置更新。`);
      updatePositions();
    }
    
    // 清理函数：在组件卸载时移除键盘事件监听器
    return () => {
      console.log('[PuzzleCanvas] 清理 PuzzleCanvas 监听器');
      window.removeEventListener('keydown', handleKeyDown);
      // 计时器和动画帧清除已移到 useResponsiveCanvasSizing 或其他 Hook
    };
  }, [state.canvasWidth, state.canvasHeight, isMobile, showDebugElements]); // 依赖项：state.canvasWidth, state.canvasHeight, isMobile, showDebugElements

  // 监听游戏状态变化以确保画布尺寸在游戏重置时重新计算
  // 这部分逻辑暂时保留，可能在步骤 9: 提取拼图状态适配钩子中进一步调整
  useEffect(() => {
    // Check for game state reset and initialize canvas size only when game is not completed
    if (!state.isScattered && !state.isCompleted && state.completedPieces.length === 0 && !state.isCompleted) {
      console.log('[PuzzleCanvas] Detected game reset state, ensuring canvas size is correct');

      // 延迟执行以确保其他状态已更新
      const timeoutId = setTimeout(() => {
        // 在这里，我们不再直接调用 setInitialCanvasSize，因为 canvasSize 由 useResponsiveCanvasSizing 管理
        // 但我们可能需要触发一次适配逻辑，或者依赖 useResponsiveCanvasSizing 在尺寸变化时触发
        // 目前，如果 canvasSize 没有变化，updatePositions 不会触发。
        // 如果需要强制重新适配，可以在此触发 dispatch 一个 action 或调用一个适配函数
        // For now, let's just ensure the canvasSize is correctly propagated via useResponsiveCanvasSizing.
        // We will refactor adaptation in Step 9.
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [state.isScattered, state.isCompleted, state.completedPieces.length]); // Dependencies include state changes relevant to reset check

  // useEffect for shake animation (partial, kept for context)
  useEffect(() => {
    // ... existing code ...
  }, [isShaking]);

  // useEffect for flash animation (partial, kept for context)
  useEffect(() => {
    // ... existing code ...
  }, [state.isCompleted]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden`}
    >
      <canvas
        ref={backgroundCanvasRef}
        className="absolute top-0 left-0"
        width={state.canvasWidth}
        height={state.canvasHeight}
      />
      <canvas
        ref={canvasRef}
        id="puzzle-canvas"
        className="relative cursor-pointer"
        width={state.canvasWidth}
        height={state.canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {/* 调试元素 (如果 showDebugElements 为 true) */}
      {showDebugElements && (
        <>
          {/* 这里可以放置其他调试元素，例如拼图编号，虚线框等 */}
        </>
      )}
    </div>
  );
}
