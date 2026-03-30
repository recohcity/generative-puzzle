/**
 * 拼图交互处理Hook
 * 处理鼠标和触摸事件的拼图交互逻辑
 */

import { RefObject, useState, useRef, useEffect, useCallback } from "react";
import { GameState, Point, PuzzlePiece } from "@/types/puzzleTypes";
import { useGame } from "@/contexts/GameContext";
import { calculateCenter, isPointInPolygon, rotatePoint, calculateAngle } from "@/utils/geometry/puzzleGeometry";
import { playPieceSelectSound, playPieceSnapSound, playFinishSound, playRotateSound } from "@/utils/rendering/soundEffects";
import { drawPuzzle } from "@/utils/rendering/puzzleDrawing";

// 拖拽跟手系数：
// - 1.0: 与鼠标/手指目标位移完全一致（当前推荐默认）
// - <1.0: 更柔和、更有阻尼感
// - >1.0: 更激进，可能出现轻微过冲
const DRAG_FOLLOW_GAIN = 1.05;

interface UsePuzzleInteractionsProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
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
  playFinishSound: () => Promise<void>;
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
  playRotateSound,
}: UsePuzzleInteractionsProps) {
  const {
    state: gameState,
    dispatch: gameDispatch,
    ensurePieceInBounds: gameEnsurePieceInBounds,
    calculatePieceBounds: gameCalculatePieceBounds,
    rotatePiece: gameRotatePiece,
    // 统计方法
    trackRotation,
    trackDragOperation
  } = useGame();
  const isDragging = useRef(false); // 追踪是否正在拖拽
  const [touchStartAngle, setTouchStartAngle] = useState(0);
  const lastTouchRef = useRef<Point | null>(null);
  const animationFrameRef = useRef<number | null>(null); // 动画帧引用

  const canvasWidth = state.canvasSize ? state.canvasSize.width : 0;
  const canvasHeight = state.canvasSize ? state.canvasSize.height : 0;

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
        if (state.puzzle) {
          drawPuzzle(ctx, state.puzzle, state.completedPieces, null, shapeType, originalShape, state.isScattered);
        }

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
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // 只响应鼠标左键

    const canvas = canvasRef.current;
    if (!canvas || state.isCompleted) return;
    if (!state.isScattered) return // 如果拼图没有散开，不允许交互

    const rect = canvas.getBoundingClientRect()

    // 🔧 关键修复：考虑画布缩放比例进行坐标转换
    // 画布的CSS尺寸可能与逻辑尺寸不同，需要进行缩放转换
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // 检查点击的是哪个拼图片段
    let clickedPieceIndex = -1

    // 倒序遍历，因为后绘制的在上面
    if (state.puzzle) {
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
    }

    // 如果没有找到，使用更宽松的距离检测
    if (clickedPieceIndex === -1) {
      const hitDistance = 20 // 增加点击容差
      if (state.puzzle) {
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
    }

    if (clickedPieceIndex !== -1) {
      const clickedPiece = state.puzzle?.[clickedPieceIndex];
      const clickedCenter = clickedPiece ? calculateCenter(clickedPiece.points) : { x, y };

      // 设置选中的拼图块
      dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex })
      // 设置拖动信息
      dispatch({
        type: "SET_DRAGGING_PIECE",
        payload: {
          index: clickedPieceIndex,
          offsetX: x - clickedCenter.x,
          offsetY: y - clickedCenter.y,
          startX: x,
          startY: y,
        }
      })

      // 统计触发：追踪拖拽操作
      try {
        trackDragOperation();
      } catch (error) {
        console.warn('统计追踪失败 (拖拽):', error);
      }

      // 播放音效
      playPieceSelectSound()
    } else {
      // 如果点击空白区域，清除选中状态和拖拽状态
      dispatch({ type: "SET_SELECTED_PIECE", payload: null })
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
    }
  }, [state, canvasRef, dispatch]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.draggingPiece || !state.puzzle) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    // 🔧 关键修复：考虑画布缩放比例进行坐标转换
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // 获取当前拖动的拼图
    const piece = state.puzzle[state.draggingPiece.index];
    const pieceCenter = calculateCenter(piece.points);
    const anchorOffsetX = state.draggingPiece.offsetX ?? 0;
    const anchorOffsetY = state.draggingPiece.offsetY ?? 0;
    const targetCenterX = x - anchorOffsetX;
    const targetCenterY = y - anchorOffsetY;
    const dx = (targetCenterX - pieceCenter.x) * DRAG_FOLLOW_GAIN;
    const dy = (targetCenterY - pieceCenter.y) * DRAG_FOLLOW_GAIN;

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
      dispatch({ type: "SET_SELECTED_PIECE", payload: null });
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
      else if (bounds.maxX >= canvasWidth - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动

      if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
      else if (bounds.maxY >= canvasHeight - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动

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
      dispatch({
        type: "SET_DRAGGING_PIECE", payload: {
          index: state.draggingPiece.index,
          offsetX: anchorOffsetX,
          offsetY: anchorOffsetY,
          startX: x,
          startY: y,
        }
      });
    }
  }, [state, canvasRef, dispatch]);

  const handleMouseUp = useCallback(() => {
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
  }, [state, dispatch]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // 在React事件中，preventDefault通常是安全的
    // 如果仍有问题，浏览器会忽略而不会抛出错误
    e.preventDefault();

    if (!canvasRef.current || !state.puzzle) return
    if (!state.isScattered) return // 如果拼图没有散开，不允许交互

    const rect = canvasRef.current.getBoundingClientRect()

    // 🔧 关键修复：考虑画布缩放比例进行坐标转换
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    // 检查是否是单点触摸（拖拽）或多点触摸（旋转）
    if (e.touches.length === 1) {
      // 单点触摸 - 处理拼图选择/拖拽
      const touch = e.touches[0]
      const touchX = (touch.clientX - rect.left) * scaleX
      const touchY = (touch.clientY - rect.top) * scaleY

      // 保存初始触摸位置
      lastTouchRef.current = { x: touchX, y: touchY }

      // 检查点击的是哪个拼图片段
      let clickedPieceIndex = -1

      // 使用多边形点包含检测
      if (state.puzzle) {
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
      }

      // 如果没有找到，使用更宽松的距离检测
      if (clickedPieceIndex === -1) {
        const hitDistance = 30 // 增加触摸容差，比鼠标点击的容差更大
        if (state.puzzle) {
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
      }

      if (clickedPieceIndex !== -1) {
        const clickedPiece = state.puzzle?.[clickedPieceIndex];
        const clickedCenter = clickedPiece ? calculateCenter(clickedPiece.points) : { x: touchX, y: touchY };

        // 设置选中的拼图块
        dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex })
        // 设置拖动信息
        dispatch({
          type: "SET_DRAGGING_PIECE",
          payload: {
            index: clickedPieceIndex,
            offsetX: touchX - clickedCenter.x,
            offsetY: touchY - clickedCenter.y,
            startX: touchX,
            startY: touchY,
          }
        })

        // 统计触发：追踪拖拽操作
        try {
          trackDragOperation();
        } catch (error) {
          console.warn('统计追踪失败 (触摸拖拽):', error);
        }
        // 播放音效
        playPieceSelectSound()
      }
    }
    else if (e.touches.length === 2) {
      // 双指触摸 - 处理旋转
      // 🔧 修复：不需要已选中拼图，双指触摸时自动选中触摸区域的拼图
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      // 计算双指中心点，用于确定要旋转的拼图
      const centerX = ((touch1.clientX + touch2.clientX) / 2 - rect.left) * scaleX
      const centerY = ((touch1.clientY + touch2.clientY) / 2 - rect.top) * scaleY

      // 如果没有选中拼图，先尝试选中双指中心点下的拼图
      if (state.selectedPiece === null) {
        let clickedPieceIndex = -1

        if (state.puzzle) {
          for (let i = state.puzzle.length - 1; i >= 0; i--) {
            if (state.completedPieces.includes(i)) continue

            const piece = state.puzzle[i]
            const center = calculateCenter(piece.points)
            const rotationAngle = -piece.rotation
            const rotatedPoint = rotatePoint(centerX, centerY, center.x, center.y, rotationAngle)

            if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
              clickedPieceIndex = i
              break
            }
          }
        }

        // 如果找到拼图，选中它
        if (clickedPieceIndex !== -1) {
          dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex })
          playPieceSelectSound()
        }
      }

      // 计算两个触摸点形成的角度
      const angle = calculateAngle(
        (touch1.clientX - rect.left) * scaleX,
        (touch1.clientY - rect.top) * scaleY,
        (touch2.clientX - rect.left) * scaleX,
        (touch2.clientY - rect.top) * scaleY
      )

      // 保存初始角度用于计算旋转
      setTouchStartAngle(angle)

      // 清除拖拽状态，因为双指操作是旋转而不是拖拽
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null })
    }
  }, [state, canvasRef, dispatch]);

  // 触摸移动事件处理
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // 在React合成事件中，preventDefault通常是安全的
    e.preventDefault();

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    // 处理多点触摸旋转
    if (e.touches.length >= 2 && state.selectedPiece !== null) {

      // 多点触摸 - 处理旋转
      // 🔧 关键修复：考虑画布缩放比例进行坐标转换
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const touch1X = (touch1.clientX - rect.left) * scaleX
      const touch1Y = (touch1.clientY - rect.top) * scaleY
      const touch2X = (touch2.clientX - rect.left) * scaleX
      const touch2Y = (touch2.clientY - rect.top) * scaleY

      const currentAngle = calculateAngle(touch1X, touch1Y, touch2X, touch2Y)

      // 🔧 修复：确保touchStartAngle已初始化且不为0
      if (touchStartAngle !== 0) {
        let rotationChange = currentAngle - touchStartAngle

        // 🔧 修复：处理角度跨越-180/180度边界的情况
        if (rotationChange > 180) {
          rotationChange -= 360
        } else if (rotationChange < -180) {
          rotationChange += 360
        }

        // 🔧 修复：按15度增量旋转，与旋转按钮保持一致
        if (Math.abs(rotationChange) >= 15) {
          // 只执行一次15度旋转，避免重复
          const isClockwise = rotationChange > 0;



          // 只执行一次15度旋转
          rotatePiece(isClockwise);

          // 统计触发：追踪旋转操作
          try {
            trackRotation();
          } catch (error) {
            console.warn('统计追踪失败 (旋转):', error);
          }

          // 播放旋转音效
          playRotateSound();

          // 🔧 关键修复：直接设置为当前角度，而不是累加
          setTouchStartAngle(currentAngle);
        }
      } else {
        // 如果touchStartAngle为0，重新初始化
        setTouchStartAngle(currentAngle);
      }

      // 双指旋转时不处理拖拽
      return
    } else if (e.touches.length === 1) {
      // 单点触摸 - 处理拖动
      // 🔧 关键修复：考虑画布缩放比例进行坐标转换
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const touch = e.touches[0]
      const touchX = (touch.clientX - rect.left) * scaleX
      const touchY = (touch.clientY - rect.top) * scaleY

      // 使用上一次触摸位置计算移动距离
      if (lastTouchRef.current) {
        // 获取当前拖动的拼图
        if (!state.puzzle || !state.draggingPiece) return;
        const piece = state.puzzle[state.draggingPiece.index];
        const pieceCenter = calculateCenter(piece.points);
        const anchorOffsetX = state.draggingPiece.offsetX ?? 0;
        const anchorOffsetY = state.draggingPiece.offsetY ?? 0;
        const targetCenterX = touchX - anchorOffsetX;
        const targetCenterY = touchY - anchorOffsetY;
        const dx = (targetCenterX - pieceCenter.x) * DRAG_FOLLOW_GAIN;
        const dy = (targetCenterY - pieceCenter.y) * DRAG_FOLLOW_GAIN;

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
          dispatch({ type: "SET_SELECTED_PIECE", payload: null });
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
          else if (bounds.maxX >= canvasWidth - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动

          if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
          else if (bounds.maxY >= canvasHeight - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动

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
        }
      } else {
        // 首次触摸，记录位置
        lastTouchRef.current = { x: touchX, y: touchY };
      }
    }
  }, [state, canvasRef, dispatch]);

  // 处理触摸结束事件
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // 在React合成事件中，preventDefault通常是安全的
    e.preventDefault();
    e.stopPropagation();

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
    // 🔧 修复：从双指变为单指时的状态处理
    else if (e.touches.length === 1) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()

      // 🔧 关键修复：考虑画布缩放比例进行坐标转换
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const touch = e.touches[0]
      const touchX = (touch.clientX - rect.left) * scaleX
      const touchY = (touch.clientY - rect.top) * scaleY

      // 更新lastTouch为当前位置，准备单指拖拽
      lastTouchRef.current = { x: touchX, y: touchY }

      // 重置旋转状态，因为不再是双指操作
      setTouchStartAngle(0)

      // 🔧 修复：如果有选中的拼图，设置拖拽状态
      if (state.selectedPiece !== null && state.puzzle?.[state.selectedPiece]) {
        const selectedPiece = state.puzzle[state.selectedPiece];
        const selectedCenter = calculateCenter(selectedPiece.points);
        dispatch({
          type: "SET_DRAGGING_PIECE",
          payload: {
            index: state.selectedPiece,
            offsetX: touchX - selectedCenter.x,
            offsetY: touchY - selectedCenter.y,
            startX: touchX,
            startY: touchY,
          }
        })
      }
    }
    // 🔧 修复：从单指变为双指时清除拖拽状态
    else if (e.touches.length === 2) {
      // 清除拖拽状态，准备旋转
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null })
      lastTouchRef.current = null

      // 重新计算双指角度
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const angle = calculateAngle(
          (touch1.clientX - rect.left) * scaleX,
          (touch1.clientY - rect.top) * scaleY,
          (touch2.clientX - rect.left) * scaleX,
          (touch2.clientY - rect.top) * scaleY
        )
        setTouchStartAngle(angle)
      }
    }
  }, [state, dispatch, handleMouseUp]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
} 