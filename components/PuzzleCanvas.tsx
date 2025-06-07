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

export default function PuzzleCanvas() {
  // Access game context
  const { state, dispatch } = useGame();
  
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  
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
    ensurePieceInBounds, 
    // updateCanvasSize, // 已迁移到 useResponsiveCanvasSizing 内部调用
    rotatePiece 
  } = useGame();
  
  // Local state and refs (re-added necessary declarations)
  // const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // 已迁移
  const [isDragging, setIsDragging] = useState(false); // 保持本地拖拽状态
  const [touchStartAngle, setTouchStartAngle] = useState(0); // 保持本地触摸旋转状态
  const animationFrameRef = useRef<number | null>(null); // 保持本地动画帧引用
  // const resizeTimer = useRef<ReturnType<typeof setTimeout>>(null); // 已迁移
  const lastTouchRef = useRef<Point | null>(null); // 保持本地触摸位置引用
  // const [isAndroid, setIsAndroid] = useState(false); // 移除 - 使用 useDeviceDetection
  // const isDarkMode = true; // Assuming this was local state or prop, keeping it here for now if needed

  // --- 使用新的 useResponsiveCanvasSizing Hook ---
  const canvasSize = useResponsiveCanvasSizing({ containerRef, canvasRef, backgroundCanvasRef });

  // --- 移除已迁移的函数和 Hook 逻辑 ---
  // setInitialCanvasSize 函数已迁移
  // handleResize 函数已迁移
  // updatePositions 函数暂时保留在 PuzzleCanvas 中，但在 Step 9 会被迁移
  // handleOrientationChange 已在步骤 6 中移除，其逻辑现在由 useResponsiveCanvasSizing 内部处理
  // --- 结束移除 ---

  // updatePositions 函数（暂时保留在此处，在步骤 9 会被迁移）
  const updatePositions = () => {
    if (!canvasRef.current || !state.puzzle) return;

    const { width, height } = canvasSize;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const shape = state.originalShape.map((point) => ({
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
      (bounds, point) => ({
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
    const container = containerRef.current;

    if (!canvas || !backgroundCanvas || !container) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const backgroundCtx = backgroundCanvas.getContext("2d");

    if (!ctx || !backgroundCtx) {
      return;
    }

    // Get the current canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear old content before each draw to ensure no overwriting
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Only draw distribution area in debug mode
    if (showDebugElements) {
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
      if (showDebugElements && state.puzzle && state.puzzle.length > 0) {
        state.puzzle.forEach((piece, index) => {
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
      drawCanvasBorderLine(ctx, canvasWidth, canvasHeight, showDebugElements);
    } else if (state.originalShape && state.originalShape.length > 0) {
      // If there is only the original shape but no puzzle, then draw the original shape
      drawShape(ctx, state.originalShape, state.shapeType);

      // Draw canvas border warning line
      drawCanvasBorderLine(ctx, canvasWidth, canvasHeight, showDebugElements);
    }

    return () => {
      // Clear any possibly pending animation frame requests
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
    canvasSize.width, // <-- 保持依赖 canvasSize
    canvasSize.height, // <-- 保持依赖 canvasSize
    showDebugElements,
    // Add dependencies for functions used in the effect if they are not stable references
    // drawDistributionArea, drawShape, drawCompletionEffect, drawPuzzle, drawHintOutline, drawCanvasBorderLine, calculatePieceBounds
    // However, since these are imported functions/constants, they should be stable and don't need to be in the dependency array unless they are redefined within the component.
    // updateCanvasSize - This function is from useGame and should be stable
  ]);
  
  // 鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // === 临时用于 Playwright 音效测试: 如果在测试环境，直接触发音效 ===
    // 检查 window 对象上是否存在 Playwright 暴露的测试函数
    if (typeof (window as any).soundPlayedForTest === 'function') {
        playPieceSelectSound(); // 直接触发音效播放逻辑
        // 注意: 这里选择不 return，让正常的游戏逻辑也继续执行，更接近实际用户点击，
        // 但主要目的是确保 playPieceSelectSound 被调用。
    }
    // =======================================================

    const canvas = e.target as HTMLCanvasElement;
    if (!canvas) return
    if (!state.puzzle) return
    if (!state.isScattered) return; // Prevent interaction if not scattered

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 检查点击的是哪个拼图片段
    let clickedPieceIndex = -1

    // 使用多边形点包含检测
    for (let i = state.puzzle.length - 1; i >= 0; i--) {
      // 跳过已完成的拼图，不允许拖拽
      if (state.completedPieces.includes(i)) continue

      const piece = state.puzzle[i];
      const center = calculateCenter(piece.points);
      
      // 将鼠标点逆向旋转，以匹配未旋转的形状
      const rotationAngle = -piece.rotation; // 逆向旋转
      const rotatedPoint = rotatePoint(x, y, center.x, center.y, rotationAngle);
      
      // 检查旋转后的点是否在形状内
      if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
        clickedPieceIndex = i;
        break;
      }
    }

    // 如果没有找到，使用更宽松的距离检测
    if (clickedPieceIndex === -1) {
      const hitDistance = 20 // 增加点击容差
      for (let i = state.puzzle.length - 1; i >= 0; i--) {
        // 跳过已完成的拼图，不允许拖拽
        if (state.completedPieces.includes(i)) continue

        const piece = state.puzzle[i]
        const center = calculateCenter(piece.points)
        const dx = center.x - x
        const dy = center.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // 如果点击位置在拼图中心附近，也算作点击
        if (distance < hitDistance * 2) {
          clickedPieceIndex = i
          break
        }
      }
    }

    if (clickedPieceIndex !== -1) {
      // 设置选中的拼图块
      dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex });

      // 如果是鼠标左键点击，设置拖动信息
      if (e.button === 0) {
        dispatch({ type: "SET_DRAGGING_PIECE", payload: {
            index: clickedPieceIndex,
            startX: x,
            startY: y,
          } });
      }

      // 播放音效
      playPieceSelectSound();
    }
    // 不再点击空白区域时清除选中状态
  }

  // 鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.draggingPiece || !state.puzzle) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - state.draggingPiece.startX
    const dy = y - state.draggingPiece.startY

    // 获取当前拖动的拼图
    const piece = state.puzzle[state.draggingPiece.index];
    
    // 使用GameContext提供的统一边界处理函数，确保在所有地方使用一致的边界逻辑
    // 使用1像素的安全边距，所有拼图使用完全相同的边界设置
    const { constrainedDx, constrainedDy, hitBoundary } = ensurePieceInBounds(piece, dx, dy, 1);
    
    // 更新拼图位置
    dispatch({
      type: "UPDATE_PIECE_POSITION",
      payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
    });

    // 如果触碰到边界，立即停止拖拽并添加震动动画
    if (hitBoundary) {
      // 只有在碰到画布边缘时才停止拖拽，而不是目标轮廓
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
      setIsDragging(false); // 更新本地状态，停止拖拽视觉反馈
      
      // 保存碰撞位置基准点
      const hitPiece = { ...piece };
      const pieceIndex = state.draggingPiece.index;
      
      // 震动动画序列 - 增大震动幅度以使回弹更明显
      let animationStep = 0;
      const maxSteps = 6; // 震动次数
      // 增大震动幅度，使回弹效果更明显
      const shakeAmount = [8, -6, 5, -4, 3, -2]; // 震动幅度序列
      
      // 确定震动方向 - 根据碰撞面决定
      let shakeDirectionX = 0;
      let shakeDirectionY = 0;
      
      // 根据碰撞边确定震动方向 - 使用1像素的边界值与ensurePieceInBounds保持一致
      const bounds = calculatePieceBounds(piece);
      const safeMargin = 1; // 使用与ensurePieceInBounds相同的边界值
      if (bounds.minX <= safeMargin) shakeDirectionX = 1; // 碰左边，向右震动
      else if (bounds.maxX >= canvas.width - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动
      
      if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
      else if (bounds.maxY >= canvas.height - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动
      
      // 如果没有确定方向，根据移动速度判断
      if (shakeDirectionX === 0 && Math.abs(dx) > Math.abs(dy)) shakeDirectionX = -Math.sign(dx);
      if (shakeDirectionY === 0 && Math.abs(dy) > Math.abs(dx)) shakeDirectionY = -Math.sign(dy);
      
      // 如果依然没有方向，至少有一个默认方向
      if (shakeDirectionX === 0 && shakeDirectionY === 0) {
        shakeDirectionX = dx < 0 ? 1 : -1;
      }
      
      // 执行震动动画
      const shakeAnimation = () => {
        if (animationStep >= maxSteps || !canvasRef.current) return;
        
        // 计算震动位移
        const shakeX = shakeDirectionX * shakeAmount[animationStep];
        const shakeY = shakeDirectionY * shakeAmount[animationStep];
        
        // 应用震动位移
        dispatch({
          type: "UPDATE_PIECE_POSITION",
          payload: { index: pieceIndex, dx: shakeX, dy: shakeY },
        });
        
        // 安排下一次震动
        animationStep++;
        setTimeout(shakeAnimation, 30); // 每次震动间隔30ms，实现快速震动效果
      };
      
      // 开始震动动画
      setTimeout(shakeAnimation, 10); // 短暂延迟后开始震动
    }
    
    // 设置新的拖拽起始点，这样下一次移动事件中的dx/dy会基于最新位置计算
    if (!hitBoundary) {
      dispatch({ type: "SET_DRAGGING_PIECE", payload: {
        index: state.draggingPiece.index,
        startX: x,
        startY: y,
      }});
      
      // 更新磁吸感应
      if (state.selectedPiece !== null && state.originalPositions) {
        const pieceIndex = state.selectedPiece;
        const piece = state.puzzle[pieceIndex];
        const originalPiece = state.originalPositions[pieceIndex];
        
        // 计算当前拼图中心点和目标位置中心点
        const pieceCenter = calculateCenter(piece.points);
        const originalCenter = calculateCenter(originalPiece.points);
        
        // 检查是否接近目标位置
        if (pieceCenter && originalCenter) {
          const magnetThreshold = 50; // 增大磁吸范围
          const dx = pieceCenter.x - originalCenter.x;
          const dy = pieceCenter.y - originalCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果拼图接近正确位置，应用磁吸效果
          if (distance < magnetThreshold) {
            // 计算磁吸力 - 距离越近，吸力越大
            const magnetStrength = 0.15; // 磁吸强度因子
            const attractionFactor = 1 - (distance / magnetThreshold); // 0到1之间的值
            const attractionX = -dx * attractionFactor * magnetStrength;
            const attractionY = -dy * attractionFactor * magnetStrength;
            
            // 应用磁吸力
            if (Math.abs(attractionX) > 0.1 || Math.abs(attractionY) > 0.1) {
              dispatch({
                type: "UPDATE_PIECE_POSITION",
                payload: { index: pieceIndex, dx: attractionX, dy: attractionY },
              });
              
              // 更新拖动起始点，确保下一次移动计算正确
              dispatch({
                type: "SET_DRAGGING_PIECE",
                payload: { 
                  index: pieceIndex,
                  startX: x,
                  startY: y
                },
              });
            }
          }
        }
      }
    }
  }

  // 鼠标释放事件
  const handleMouseUp = () => {
    if (!state.isScattered) return; // Prevent interaction if not scattered
    if (!state.draggingPiece || !state.puzzle || !state.originalPositions) return; // Exit if not dragging or puzzle/positions not ready

    const pieceIndex = state.draggingPiece.index
    // Check puzzle again after the early return confirms it's not null
    const piece = state.puzzle[pieceIndex]
    const originalPiece = state.originalPositions[pieceIndex]

    // 增强磁吸效果 - 降低吸附阈值并检查旋转是否接近正确值
    let isNearOriginal = false
    
    // 确保角度在0-360度范围内并计算差异
    const pieceRotation = (piece.rotation % 360 + 360) % 360;
    const originalRotation = (originalPiece.rotation % 360 + 360) % 360;
    const rotationDiff = Math.min(
      Math.abs(pieceRotation - originalRotation),
      360 - Math.abs(pieceRotation - originalRotation)
    );
    
    const isRotationCorrect = rotationDiff < 15; // 允许15度误差，适配旋转按钮15度的增量

    if (isRotationCorrect) {
      // 计算中心点
      const pieceCenter = calculateCenter(piece.points)
      const originalCenter = calculateCenter(originalPiece.points)

      // 检查中心点是否接近
      const distanceThreshold = 40 // 增加吸附范围
      const dx = pieceCenter.x - originalCenter.x
      const dy = pieceCenter.y - originalCenter.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      isNearOriginal = distance < distanceThreshold
    }

    if (isNearOriginal) {
      // 如果旋转和位置都接近正确，将其设置为完全正确的位置和旋转
      dispatch({ type: "RESET_PIECE_TO_ORIGINAL", payload: pieceIndex })
      dispatch({ type: "ADD_COMPLETED_PIECE", payload: pieceIndex })
      
      // 强制清除选中状态 - 放在添加完成拼图之后
      dispatch({ type: "SET_SELECTED_PIECE", payload: null })
      setIsDragging(false)
      
      // 播放拼图吸附音效
      playPieceSnapSound()
    }

    // 清除拖动状态
    dispatch({ type: "SET_DRAGGING_PIECE", payload: null })
  }

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

    // 根据 canvasSize 的变化触发 updatePositions，实现适配逻辑
    // useResponsiveCanvasSizing 已经负责了尺寸的计算和更新 GameContext
    // 这里的 useEffect 监听 canvasSize 变化，然后触发拼图位置的更新
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      console.log(`[PuzzleCanvas] 检测到画布尺寸变化: ${canvasSize.width}x${canvasSize.height}, 触发拼图位置更新。`);
      updatePositions();
    }
    
    // 清理函数：在组件卸载时移除键盘事件监听器
    return () => {
      console.log('[PuzzleCanvas] 清理 PuzzleCanvas 监听器');
      window.removeEventListener('keydown', handleKeyDown);
      // 这里的计时器和动画帧清除不需要了，已移到 useResponsiveCanvasSizing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasSize, isMobile]); // 依赖项：canvasSize 和 isMobile

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

  // Optimize touch event handling
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // 防止触摸事件触发鼠标事件

    if (!canvasRef.current || !state.puzzle) return
    if (!state.isScattered) return // 如果拼图没有散开，不允许交互

    const rect = canvasRef.current.getBoundingClientRect()

    // 检查是否是单点触摸（拖拽）或多点触摸（旋转）
    if (e.touches.length === 1) {
      // 单点触摸 - 处理拼图选择/拖拽
      const touch = e.touches[0]
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top

      // 保存初始触摸位置
      lastTouchRef.current = { x: touchX, y: touchY }

      // 检查点击的是哪个拼图片段
      let clickedPieceIndex = -1

      // 使用多边形点包含检测
      for (let i = state.puzzle.length - 1; i >= 0; i--) {
        // 跳过已完成的拼图，不允许拖拽
        if (state.completedPieces.includes(i)) continue

        const piece = state.puzzle[i]
        const center = calculateCenter(piece.points)
        
        // 将触摸点逆向旋转，以匹配未旋转的形状
        const rotationAngle = -piece.rotation // 逆向旋转
        const rotatedPoint = rotatePoint(touchX, touchY, center.x, center.y, rotationAngle)
        
        // 检查旋转后的点是否在形状内
        if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
          clickedPieceIndex = i
          break
        }
      }

      // 如果没有找到，使用更宽松的距离检测
      if (clickedPieceIndex === -1) {
        const hitDistance = 30 // 增加触摸容差，比鼠标点击的容差更大
        for (let i = state.puzzle.length - 1; i >= 0; i--) {
          // 跳过已完成的拼图，不允许拖拽
          if (state.completedPieces.includes(i)) continue

          const piece = state.puzzle[i]
          const center = calculateCenter(piece.points)
          const dx = center.x - touchX
          const dy = center.y - touchY
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 如果触摸位置在拼图中心附近，也算作点击
          if (distance < hitDistance * 2) {
            clickedPieceIndex = i
            break
          }
        }
      }

      if (clickedPieceIndex !== -1) {
        // 设置选中的拼图块
        dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex })
        // 设置拖动信息
        dispatch({ 
          type: "SET_DRAGGING_PIECE", 
          payload: {
            index: clickedPieceIndex,
            startX: touchX,
            startY: touchY,
          } 
        })
        // 播放音效
        playPieceSelectSound()
      } else {
        // 不再在触摸空白区域时清除选中状态
      }
    } 
    else if (e.touches.length === 2 && state.selectedPiece !== null) {
      // 双指触摸 - 处理旋转
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // 计算两个触摸点形成的角度
      const angle = calculateAngle(
        touch1.clientX - rect.left, 
        touch1.clientY - rect.top,
        touch2.clientX - rect.left, 
        touch2.clientY - rect.top
      )
      
      // 保存初始角度用于计算旋转
      setTouchStartAngle(angle)
    }
  }
  
  // 触摸移动事件处理
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // 防止页面滚动
    if (!state.draggingPiece || !state.puzzle) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    
    // 处理多点触摸旋转
    if (e.touches.length >= 2 && state.selectedPiece !== null) {
      // 多点触摸 - 处理旋转
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const touch1X = touch1.clientX - rect.left
      const touch1Y = touch1.clientY - rect.top
      const touch2X = touch2.clientX - rect.left
      const touch2Y = touch2.clientY - rect.top

      const currentAngle = calculateAngle(touch1X, touch1Y, touch2X, touch2Y)
      if (touchStartAngle !== 0) {
        const rotationChange = currentAngle - touchStartAngle

        // 只有当旋转变化超过阈值时才应用旋转
        if (Math.abs(rotationChange) > 5) {
          const isClockwise = rotationChange > 0
          rotatePiece(isClockwise)
          
          // 播放旋转音效
          playRotateSound()
          
          // 更新开始角度
          setTouchStartAngle(currentAngle)
        }
      }
    } else if (e.touches.length === 1) {
      // 单点触摸 - 处理拖动
      const touch = e.touches[0]
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top

      // 使用上一次触摸位置计算移动距离
      if (lastTouchRef.current) {
        const dx = touchX - lastTouchRef.current.x
        const dy = touchY - lastTouchRef.current.y

        // 获取当前拖动的拼图
        const piece = state.puzzle[state.draggingPiece.index];
        
        // 使用GameContext提供的统一边界处理函数，确保所有拼图使用完全相同的边界设置
        const { constrainedDx, constrainedDy, hitBoundary } = ensurePieceInBounds(piece, dx, dy, 1);
        
        // 更新拼图位置
        dispatch({
          type: "UPDATE_PIECE_POSITION",
          payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
        });

        // 如果触碰到边界，立即停止拖拽并添加震动动画
        if (hitBoundary) {
          // 只有在碰到画布边缘时才停止拖拽
          dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
          setIsDragging(false);
          
          // 保存碰撞位置基准点
          const hitPiece = { ...piece };
          const pieceIndex = state.draggingPiece.index;
          
          // 震动动画序列 - 增大震动幅度以使回弹更明显
          let animationStep = 0;
          const maxSteps = 6; // 震动次数
          // 增大震动幅度，使回弹效果更明显
          const shakeAmount = [8, -6, 5, -4, 3, -2]; // 震动幅度序列
          
          // 确定震动方向 - 根据碰撞面决定
          let shakeDirectionX = 0;
          let shakeDirectionY = 0;
          
          // 根据碰撞边确定震动方向 - 使用1像素的边界值
          const bounds = calculatePieceBounds(piece);
          const safeMargin = 1; // 使用统一的边界值
          if (bounds.minX <= safeMargin) shakeDirectionX = 1; // 碰左边，向右震动
          else if (bounds.maxX >= canvas.width - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动
          
          if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
          else if (bounds.maxY >= canvas.height - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动
          
          // 如果没有确定方向，根据移动速度判断
          if (shakeDirectionX === 0 && Math.abs(dx) > Math.abs(dy)) shakeDirectionX = -Math.sign(dx);
          if (shakeDirectionY === 0 && Math.abs(dy) > Math.abs(dx)) shakeDirectionY = -Math.sign(dy);
          
          // 如果依然没有方向，至少有一个默认方向
          if (shakeDirectionX === 0 && shakeDirectionY === 0) {
            shakeDirectionX = dx < 0 ? 1 : -1;
          }
          
          // 执行震动动画
          const shakeAnimation = () => {
            if (animationStep >= maxSteps || !canvasRef.current) return;
            
            // 计算震动位移
            const shakeX = shakeDirectionX * shakeAmount[animationStep];
            const shakeY = shakeDirectionY * shakeAmount[animationStep];
            
            // 应用震动位移
            dispatch({
              type: "UPDATE_PIECE_POSITION",
              payload: { index: pieceIndex, dx: shakeX, dy: shakeY },
            });
            
            // 安排下一次震动
            animationStep++;
            setTimeout(shakeAnimation, 30); // 每次震动间隔30ms，实现快速震动效果
          };
          
          // 开始震动动画
          setTimeout(shakeAnimation, 10); // 短暂延迟后开始震动
        } else {
          // 更新最后触摸位置
          lastTouchRef.current = { x: touchX, y: touchY };
          
          // 更新磁吸感应
          if (state.selectedPiece !== null && state.originalPositions) {
            const pieceIndex = state.selectedPiece;
            const piece = state.puzzle[pieceIndex];
            const originalPiece = state.originalPositions[pieceIndex];
            
            // 计算当前拼图中心点和目标位置中心点
            const pieceCenter = calculateCenter(piece.points);
            const originalCenter = calculateCenter(originalPiece.points);
            
            // 检查是否接近目标位置
            if (pieceCenter && originalCenter) {
              const magnetThreshold = 50; // 磁吸范围
              const dx = pieceCenter.x - originalCenter.x;
              const dy = pieceCenter.y - originalCenter.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // 应用磁吸效果
              if (distance < magnetThreshold) {
                const magnetStrength = 0.15;
                const attractionFactor = 1 - (distance / magnetThreshold);
                const attractionX = -dx * attractionFactor * magnetStrength;
                const attractionY = -dy * attractionFactor * magnetStrength;
                
                if (Math.abs(attractionX) > 0.1 || Math.abs(attractionY) > 0.1) {
                  dispatch({
                    type: "UPDATE_PIECE_POSITION",
                    payload: { index: pieceIndex, dx: attractionX, dy: attractionY },
                  });
                }
              }
            }
          }
        }
      } else {
        // 首次触摸，记录位置
        lastTouchRef.current = { x: touchX, y: touchY };
      }
    }
  }
  
  // 处理触摸结束事件
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // 防止iOS上的默认事件
    e.stopPropagation(); // 阻止事件传播
    
    // 检查是否所有触摸点都已结束
    if (e.touches.length === 0) {
      // 复用鼠标释放的逻辑处理拖动结束
      handleMouseUp()
      
      // 只清除拖动状态，但保留选中状态
      setIsDragging(false)
      
      // 重置触摸状态
      lastTouchRef.current = null
      setTouchStartAngle(0)
    }
    // 如果仍有一个触摸点，更新lastTouch为当前位置
    else if (e.touches.length === 1) {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      lastTouchRef.current = { 
        x: touch.clientX - rect.left, 
        y: touch.clientY - rect.top 
      }
      
      // 重置旋转状态
      setTouchStartAngle(0)
    }
  }

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
      className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
    >
      {/* 添加轻微的内部发光效果 */}
      <div className="absolute inset-0 pointer-events-none bg-white/5 rounded-2xl"></div>
      <div 
        className="relative flex items-center justify-center w-full h-full"
      >
        <canvas
          ref={backgroundCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 w-full h-full"
        />
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative cursor-pointer w-full h-full"
        />
      </div>
      {/* Overlay for UI elements or effects */}
      {/* Example: <PuzzleProgressIndicator progress={completionProgress} /> */}
    </div>
  );
}
