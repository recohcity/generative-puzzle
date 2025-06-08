import { RefObject, useState, useRef, useEffect, useCallback } from "react";
import { GameState, Point, PuzzlePiece } from "@/types/puzzleTypes"; // 从统一类型文件导入
import { useGame } from "@/contexts/GameContext"; // 导入 useGame 钩子
import { calculateCenter, isPointInPolygon, rotatePoint, calculateAngle } from "@/utils/geometry/puzzleGeometry";
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound, playRotateSound } from "@/utils/rendering/soundEffects";
import { drawPuzzle } from "@/utils/rendering/puzzleDrawing";

interface UsePuzzleInteractionsProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  containerRef: RefObject<HTMLDivElement>;
  canvasSize: { width: number; height: number };
  state: GameState; // 直接从 GameContext 获取的状态
  dispatch: React.Dispatch<any>; // GameContext 的 dispatch 函数
  ensurePieceInBounds: (piece: PuzzlePiece, dx: number, dy: number, margin: number) => { constrainedDx: number; constrainedDy: number; hitBoundary: boolean; };
  calculatePieceBounds: (piece: PuzzlePiece) => { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; centerX: number; centerY: number; };
  rotatePiece: (clockwise: boolean) => void;
  isShaking: boolean;
  setIsShaking: React.Dispatch<React.SetStateAction<boolean>>;
  playPieceSelectSound: () => Promise<void>;
  playPieceSnapSound: () => Promise<void>;
  playPuzzleCompletedSound: () => Promise<void>;
  playRotateSound: () => Promise<void>;
}

export function usePuzzleInteractions({
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
}: UsePuzzleInteractionsProps) {
  const { state: gameState, dispatch: gameDispatch, ensurePieceInBounds: gameEnsurePieceInBounds, calculatePieceBounds: gameCalculatePieceBounds, rotatePiece: gameRotatePiece } = useGame();
  const isDragging = useRef(false); // 追踪是否正在拖拽
  const [touchStartAngle, setTouchStartAngle] = useState(0); 
  const lastTouchRef = useRef<Point | null>(null);
  const animationFrameRef = useRef<number | null>(null); // 动画帧引用

  // 定义闪光动画函数
  const animateFlash = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      shapeType: string,
      originalShape: Point[],
      start: number,
      duration: number,
      onComplete: () => void,
    ) => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);

      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除整个画布

        // 绘制所有拼图块 (除了闪光的)
        drawPuzzle(ctx, state.puzzle, state.completedPieces, null, shapeType, originalShape, state.isScattered);

        // 绘制闪光效果
        if (progress < 1) {
          const radius = Math.max(canvas.width, canvas.height) * progress * 0.7; // 调整扩散速度
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${1 - progress})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(() =>
            animateFlash(ctx, shapeType, originalShape, start, duration, onComplete),
          );
        } else {
          onComplete();
        }
      }
    },
    [canvasRef, containerRef, state.puzzle, state.completedPieces, state.isScattered],
  );

  // 鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("DEBUG: handleMouseDown triggered in usePuzzleInteractions.");
    if (e.button !== 0) return; // 只响应鼠标左键

    const canvas = canvasRef.current;
    if (!canvas || state.isCompleted) return;
    if (!state.isScattered) return // 如果拼图没有散开，不允许交互

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 检查点击的是哪个拼图片段
    let clickedPieceIndex = -1

    // 倒序遍历，因为后绘制的在上面
    for (let i = state.puzzle.length - 1; i >= 0; i--) {
      // 跳过已完成的拼图，不允许拖拽
      if (state.completedPieces.includes(i)) continue

      const piece = state.puzzle[i]
      const center = calculateCenter(piece.points)
      
      // 将点击点逆向旋转，以匹配未旋转的形状
      const rotationAngle = -piece.rotation // 逆向旋转
      const rotatedPoint = rotatePoint(x, y, center.x, center.y, rotationAngle)
      
      // 检查旋转后的点是否在形状内
      if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
        clickedPieceIndex = i
        break
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

        // 如果鼠标位置在拼图中心附近，也算作点击
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
            startX: x,
            startY: y,
        } 
      })
      // 播放音效
      playPieceSelectSound()
    } else {
      // 如果点击空白区域，清除选中状态和拖拽状态
      dispatch({ type: "SET_SELECTED_PIECE", payload: null })
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.draggingPiece || !state.puzzle) {
      return
    }

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
      setIsShaking(false); // 更新本地状态，停止拖拽视觉反馈
      
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
      else if (bounds.maxX >= state.canvasWidth - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动
      
      if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
      else if (bounds.maxY >= state.canvasHeight - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动
      
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
  };

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
      setIsShaking(false)
      
      // 播放拼图吸附音效
      playPieceSnapSound()
    }

    // 清除拖动状态
    dispatch({ type: "SET_DRAGGING_PIECE", payload: null })
  };

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
  };
  
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
          setIsShaking(false);
          
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
          else if (bounds.maxX >= state.canvasWidth - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动
          
          if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
          else if (bounds.maxY >= state.canvasHeight - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动
          
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
  };
  
  // 处理触摸结束事件
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // 防止iOS上的默认事件
    e.stopPropagation(); // 阻止事件传播
    
    // 检查是否所有触摸点都已结束
      if (e.touches.length === 0) {
      // 复用鼠标释放的逻辑处理拖动结束
      handleMouseUp()
      
      // 只清除拖动状态，但保留选中状态
      setIsShaking(false)
      
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
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
} 