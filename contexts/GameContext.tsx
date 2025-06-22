"use client"

import { useCallback, useReducer, useRef, createContext, useContext, useEffect } from "react"

import type { ReactNode } from "react"
// import { ShapeType, CutType } from "@/types/types"
import { ShapeGenerator } from "@/utils/shape/ShapeGenerator"
import { PuzzleGenerator } from "@/utils/puzzle/PuzzleGenerator"
import { ScatterPuzzle } from "@/utils/puzzle/ScatterPuzzle"

// 导入从 puzzleTypes.ts 迁移的类型
import { Point, PuzzlePiece, DraggingPiece, PieceBounds, GameState, GameAction as GameActionType, GameContextProps, ShapeType, CutType } from "@/types/puzzleTypes";

// Define types
// ... existing code ...

// 更新GameContextProps接口
// ... existing code ...

const initialState: GameState = {
  originalShape: [],
  puzzle: null,
  draggingPiece: null,
  selectedPiece: null,
  completedPieces: [],
  isCompleted: false,
  isScattered: false,
  showHint: false,
  shapeType: ShapeType.Polygon,
  pendingShapeType: null,
  cutType: "" as CutType,
  cutCount: 1,
  originalPositions: [],
  canvasWidth: 800,  // 默认画布宽度
  canvasHeight: 600, // 默认画布高度
  previousCanvasSize: null, // 初始化为 null
}

function gameReducer(state: GameState, action: GameActionType): GameState {
  switch (action.type) {
    case "SET_ORIGINAL_SHAPE":
      return { ...state, originalShape: action.payload }
    case "SET_PUZZLE":
      return { ...state, puzzle: action.payload }
    case "SET_DRAGGING_PIECE":
      return { ...state, draggingPiece: action.payload }
    case "SET_SELECTED_PIECE":
      // 当选择一个新的拼图片段时，自动隐藏提示
      // 这样当玩家点击新拼图时，之前的提示会消失，只有再次点击提示按钮才会显示新拼图的提示
      return { 
        ...state, 
        selectedPiece: action.payload,
        // 当选择新拼图时，强制关闭提示显示
        showHint: false
      }
    case "SET_COMPLETED_PIECES":
      // 检查拼图是否完成
      const isNowCompleted = action.payload.length > 0 && action.payload.length === state.puzzle?.length;
      return { 
        ...state, 
        completedPieces: action.payload,
        isCompleted: isNowCompleted
      };
    case "ADD_COMPLETED_PIECE":
      // 如果已经包含，直接返回，避免重复添加
      if (state.completedPieces.includes(action.payload)) {
        return state;
      }
      const newCompletedPieces = [...state.completedPieces, action.payload];
      // 添加后，立刻检查是否所有拼图都已完成
      const isGameFinished = state.puzzle ? newCompletedPieces.length === state.puzzle.length : false;
      
      return { 
        ...state, 
        completedPieces: newCompletedPieces,
        isCompleted: isGameFinished // 直接在这里更新完成状态
      };
    case "SET_IS_COMPLETED":
      return { ...state, isCompleted: action.payload }
    case "SET_IS_SCATTERED":
      return { ...state, isScattered: action.payload }
    case "SET_SHOW_HINT":
      return { ...state, showHint: action.payload }
    case "SET_SHAPE_TYPE":
      return { ...state, shapeType: action.payload, pendingShapeType: null }
    case "SET_SHAPE_TYPE_WITHOUT_REGENERATE":
      return { ...state, pendingShapeType: action.payload }
    case "SET_CUT_TYPE":
      return { ...state, cutType: action.payload }
    case "SET_CUT_COUNT":
      return { ...state, cutCount: action.payload }
    case "GENERATE_SHAPE":
      return { ...state }
    case "GENERATE_PUZZLE":
      return { ...state }
    case "SCATTER_PUZZLE":
      return { ...state, isScattered: true }
    case "ROTATE_PIECE":
      if (!state.puzzle || state.selectedPiece === null) return state
      const newPuzzle = [...state.puzzle]
      const piece = newPuzzle[state.selectedPiece]
      const oldRotation = piece.rotation;
      piece.rotation = (piece.rotation + (action.payload.clockwise ? 15 : -15) + 360) % 360
      console.log(`[GameReducer] ROTATE_PIECE: Selected piece ${state.selectedPiece}, Old Angle: ${oldRotation}, New Angle: ${piece.rotation}, Clockwise: ${action.payload.clockwise}`);
      return { ...state, puzzle: newPuzzle }
    case "UPDATE_PIECE_POSITION":
      if (!state.puzzle) return state
      const updatedPuzzle = [...state.puzzle]
      const pieceToUpdate = updatedPuzzle[action.payload.index]

      // 更新拼图位置
      pieceToUpdate.x += action.payload.dx
      pieceToUpdate.y += action.payload.dy

      // 同时更新所有点的位置
      pieceToUpdate.points = pieceToUpdate.points.map((point) => ({
        ...point,
        x: point.x + action.payload.dx,
        y: point.y + action.payload.dy,
        isOriginal: point.isOriginal,
      }))

      return { ...state, puzzle: updatedPuzzle }
    case "RESET_PIECE_TO_ORIGINAL":
      if (!state.puzzle || !state.originalPositions) return state
      const resetPuzzle = [...state.puzzle]
      const originalPiece = state.originalPositions[action.payload]

      // 完全复制原始拼图的所有属性，包括点位置和精确角度
      resetPuzzle[action.payload] = {
        ...resetPuzzle[action.payload],
        x: originalPiece.x,
        y: originalPiece.y,
        rotation: originalPiece.originalRotation || originalPiece.rotation, // 使用原始角度
        // 重要：完全复制原始点，确保位置精确
        points: JSON.parse(JSON.stringify(originalPiece.points)),
      }

      return { ...state, puzzle: resetPuzzle }
    case "SHOW_HINT":
      return { ...state, showHint: true }
    case "HIDE_HINT":
      return { ...state, showHint: false }
    case "RESET_GAME":
      return {
        ...initialState,
        // 完全重置游戏，不保留任何上一轮的设置
        // 注释掉原先保留的选项： 
        // shapeType: state.shapeType, // 保留当前形状类型设置
        // cutType: state.cutType, // 保留当前切割类型设置
        // cutCount: state.cutCount, // 保留当前切割次数设置
        
        // 只保留画布尺寸信息
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight
      }
    case "SET_ORIGINAL_POSITIONS":
      return { ...state, originalPositions: action.payload }
    case "SET_SHAPE_OFFSET":
      return { 
        ...state, 
        lastShapeOffsetX: action.payload.offsetX, 
        lastShapeOffsetY: action.payload.offsetY 
      }
    case "BATCH_UPDATE":
      // 批量更新多个状态值
      return {
        ...state,
        puzzle: action.payload.puzzle,
        originalPositions: action.payload.originalPositions
      }
    case "SYNC_ALL_POSITIONS":
      // 同步更新所有与位置相关的状态
      return {
        ...state,
        originalShape: action.payload.originalShape,
        puzzle: action.payload.puzzle,
        originalPositions: action.payload.originalPositions,
        lastShapeOffsetX: action.payload.shapeOffset.offsetX,
        lastShapeOffsetY: action.payload.shapeOffset.offsetY
      }
    case "UPDATE_CANVAS_SIZE":
      // 同时更新当前画布尺寸和上一次画布尺寸
      return { 
        ...state, 
        previousCanvasSize: { width: state.canvasWidth || action.payload.width, height: state.canvasHeight || action.payload.height }, // 记录更新前的尺寸作为 previous
        canvasWidth: action.payload.width, 
        canvasHeight: action.payload.height 
      }
    case "UPDATE_ADAPTED_PUZZLE_STATE":
      // 更新适配后的拼图数据和上一次画布尺寸
      return {
        ...state,
        puzzle: action.payload.newPuzzleData,
        previousCanvasSize: action.payload.newPreviousCanvasSize,
        // Note: canvasWidth and canvasHeight should already be the new size
        // when this action is dispatched after a resize.
      };
    case "NO_CHANGE":
      // 不做任何改变
      return state
    default:
      return state
  }
}

export const GameContext = createContext<GameContextProps | undefined>(undefined)

// 在GameProvider组件中添加resetGame函数
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null)

  const rotatePiece = useCallback(
    (clockwise: boolean) => {
      console.log(`[GameContext] rotatePiece called, clockwise: ${clockwise}`);
      dispatch({ type: "ROTATE_PIECE", payload: { clockwise } })
      console.log('[GameContext] ROTATE_PIECE dispatched');
    },
    [dispatch],
  )

  // 专用于测试的接口，直接修改游戏状态
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).__gameStateForTests__ = state;
      (window as any).selectPieceForTest = (pieceIndex: number) => {
        // 只设置选中状态，保持职责单一
        dispatch({ type: 'SET_SELECTED_PIECE', payload: pieceIndex });
        console.log(`[Test] 强制选中拼图块: ${pieceIndex}`);
      };
      (window as any).markPieceAsCompletedForTest = (pieceIndex: number) => {
        dispatch({ type: 'ADD_COMPLETED_PIECE', payload: pieceIndex });
        console.log(`[Test] 强制标记拼图块为完成: ${pieceIndex}`);
      };
      // 暴露旋转函数，用于测试
      (window as any).rotatePieceForTest = (clockwise: boolean) => {
        // 直接调用内部的 rotatePiece 函数
        rotatePiece(clockwise);
      };
      (window as any).resetPiecePositionForTest = (pieceIndex: number) => {
        dispatch({ type: 'RESET_PIECE_TO_ORIGINAL', payload: pieceIndex });
        console.log(`[Test] 强制重置拼图块位置: ${pieceIndex}`);
      };
    }
    // 组件卸载时清理
    return () => {
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).__gameStateForTests__;
        delete (window as any).selectPieceForTest;
        delete (window as any).markPieceAsCompletedForTest;
        delete (window as any).rotatePieceForTest;
        delete (window as any).resetPiecePositionForTest;
      }
    }
  }, [state, rotatePiece]); // 添加 rotatePiece 到依赖项

  // 自动完成判定副作用：全部拼图完成时自动设置 isCompleted
  useEffect(() => {
    if (
      state.puzzle &&
      state.completedPieces.length === state.puzzle.length &&
      state.puzzle.length > 0 &&
      !state.isCompleted
    ) {
      dispatch({ type: "SET_IS_COMPLETED", payload: true });
    }
  }, [state.completedPieces, state.puzzle, state.isCompleted]);

  const generateShape = useCallback(() => {
    // 如果有待生成的形状类型，则使用它
    const currentShapeType = state.pendingShapeType || state.shapeType;
    
    // 获取实际画布尺寸以确保形状居中
    console.log("开始生成形状, 当前类型:", currentShapeType);
    
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      
      // 日志输出当前画布状态
      console.log("Canvas尺寸:", canvasWidth, "x", canvasHeight);
      console.log("使用画布引用生成形状");
      
      // 确保画布尺寸有效
      if (canvasWidth <= 0 || canvasHeight <= 0) {
        console.warn("画布尺寸无效 - 使用默认值");
      }
      
      // 创建形状时考虑实际画布尺寸
      try {
        // 调用ShapeGenerator生成形状
        const shape = ShapeGenerator.generateShape(currentShapeType);
        console.log(`形状生成成功: ${shape.length}个点`);
        
        if (shape.length === 0) {
          console.error("生成的形状没有点");
          return;
        }
        
        // 确保形状居中
        const bounds = shape.reduce(
          (acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxX: Math.max(acc.maxX, point.x),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );
        
        // 计算形状中心和画布中心之间的差值
        const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
        const shapeCenterY = (bounds.minY + bounds.maxY) / 2;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        
        // 计算需要移动的距离
        const offsetX = canvasCenterX - shapeCenterX;
        const offsetY = canvasCenterY - shapeCenterY;
        
        console.log("形状边界:", bounds);
        console.log("形状中心:", shapeCenterX, shapeCenterY);
        console.log("画布中心:", canvasCenterX, canvasCenterY);
        console.log("偏移量:", offsetX, offsetY);
        
        // 移动所有点以居中形状
        const centeredShape = shape.map(point => ({
          ...point,
          x: point.x + offsetX,
          y: point.y + offsetY
        }));
        
        dispatch({ type: "SET_ORIGINAL_SHAPE", payload: centeredShape });
        
        // 如果有待生成的形状类型，则更新形状类型
        if (state.pendingShapeType) {
          dispatch({ type: "SET_SHAPE_TYPE", payload: state.pendingShapeType });
        }
      } catch (error) {
        console.error("形状生成失败:", error);
      }
    } else {
      // 如果画布引用不可用，提供详细日志
      console.warn("画布引用不可用 - 尝试使用默认方法");
      
      try {
        const shape = ShapeGenerator.generateShape(currentShapeType);
        console.log(`使用默认方法生成形状: ${shape.length}个点`);
        
        if (shape.length === 0) {
          console.error("生成的形状没有点");
          return;
        }
        
        dispatch({ type: "SET_ORIGINAL_SHAPE", payload: shape });
        
        // 如果有待生成的形状类型，则更新形状类型
        if (state.pendingShapeType) {
          dispatch({ type: "SET_SHAPE_TYPE", payload: state.pendingShapeType });
        }
      } catch (error) {
        console.error("默认形状生成失败:", error);
      }
    }
  }, [state.shapeType, state.pendingShapeType, canvasRef, dispatch])

  const generatePuzzle = useCallback(() => {
    if (!state.originalShape) return
    const { pieces, originalPositions } = PuzzleGenerator.generatePuzzle(
      state.originalShape,
      state.cutType,
      state.cutCount,
    )
    dispatch({ type: "SET_PUZZLE", payload: pieces })
    dispatch({ type: "SET_ORIGINAL_POSITIONS", payload: originalPositions })
  }, [state.originalShape, state.cutType, state.cutCount])

  const scatterPuzzle = useCallback(() => {
    if (!state.puzzle) {
      console.warn("Cannot scatter puzzle: No puzzle pieces generated")
      return
    }

    // 检查是否已经散开
    if (state.isScattered) {
      console.warn("Puzzle already scattered")
      return
    }

    // 调试输出 - 检查散开前的原始形状状态
    console.log("散开前状态:", {
      originalShapeExists: state.originalShape && state.originalShape.length > 0,
      originalShapePoints: state.originalShape.length,
      puzzlePieces: state.puzzle.length,
      canvasSize: { width: state.canvasWidth, height: state.canvasHeight }
    });

    // 计算原始形状的边界和中心点
    let targetShape = null;
    if (state.originalShape && state.originalShape.length > 0) {
      // 计算原始形状的边界
      const bounds = state.originalShape.reduce(
        (acc, point) => ({
          minX: Math.min(acc.minX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxX: Math.max(acc.maxX, point.x),
          maxY: Math.max(acc.maxY, point.y),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );
      
      // 计算原始形状的中心点和半径
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const radius = Math.max(
        (bounds.maxX - bounds.minX) / 2,
        (bounds.maxY - bounds.minY) / 2
      ) * 1.2; // 增加20%的边距
      
      targetShape = {
        center: { x: centerX, y: centerY },
        radius: radius
      };
      
      console.log("目标形状信息:", targetShape);
    }

    // 传递当前的画布尺寸信息给ScatterPuzzle
    const scatteredPuzzle = ScatterPuzzle.scatterPuzzle(state.puzzle, {
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      targetShape: targetShape
    })
    
    dispatch({ type: "SET_PUZZLE", payload: scatteredPuzzle })
    dispatch({ type: "SET_IS_SCATTERED", payload: true })
    
    // 记录散开后的拼图位置
    console.log("Scattered puzzle pieces:", scatteredPuzzle.length);
    
    // 调试输出 - 确认散开后原始形状仍然存在
    console.log("散开后状态:", {
      originalShapeExists: state.originalShape && state.originalShape.length > 0,
      originalShapePoints: state.originalShape.length
    });
    
    // 检查是否有需要回弹动画的拼图
    const piecesNeedingBounce = scatteredPuzzle.filter(piece => piece.needsBounceAnimation);
    
    if (piecesNeedingBounce.length > 0) {
      console.log(`找到${piecesNeedingBounce.length}个拼图需要执行回弹动画`);
      
      // 为需要回弹的拼图执行震动动画
      setTimeout(() => {
        piecesNeedingBounce.forEach((piece, index) => {
          const pieceIndex = scatteredPuzzle.indexOf(piece);
          if (pieceIndex === -1 || !piece.bounceInfo) return;
          
          // 确定回弹方向
          const shakeDirectionX = Math.sign(piece.bounceInfo.bounceX);
          const shakeDirectionY = Math.sign(piece.bounceInfo.bounceY);
          
          // 震动动画序列 - 与碰撞回弹保持一致
          let animationStep = 0;
          const maxSteps = 6; // 震动次数
          const shakeAmount = [8, -6, 5, -4, 3, -2]; // 震动幅度序列
          
          // 执行震动动画
          const shakeAnimation = () => {
            if (animationStep >= maxSteps) return;
            
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
          
          // 错开不同拼图的震动动画开始时间，避免所有拼图同时震动
          setTimeout(() => {
            // 播放碰撞音效 - 同样使用边界碰撞的声音效果
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              
              // 创建主音频振荡器 - 低音碰撞声
              const oscillator1 = audioContext.createOscillator();
              const gainNode1 = audioContext.createGain();
              
              oscillator1.type = "sine";
              oscillator1.frequency.setValueAtTime(120, audioContext.currentTime); // 更低的音调
              gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
              gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15); // 更快衰减
              
              oscillator1.connect(gainNode1);
              gainNode1.connect(audioContext.destination);
              
              // 创建次要振荡器 - 高音碰撞声
              const oscillator2 = audioContext.createOscillator();
              const gainNode2 = audioContext.createGain();
              
              oscillator2.type = "sine";
              oscillator2.frequency.setValueAtTime(240, audioContext.currentTime); // 高一倍的音调
              gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
              gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // 更快衰减
              
              oscillator2.connect(gainNode2);
              gainNode2.connect(audioContext.destination);
              
              // 启动并停止振荡器
              oscillator1.start();
              oscillator2.start();
              oscillator1.stop(audioContext.currentTime + 0.15);
              oscillator2.stop(audioContext.currentTime + 0.1);
            } catch (e) {
              console.log("Audio not supported");
            }
            
            // 开始震动动画
            shakeAnimation(); 
            
          }, index * 100); // 每个拼图错开100ms开始震动
        });
      }, 300); // 散开完成后等待300ms再开始回弹动画，给用户一个视觉缓冲
    }
  }, [state.puzzle, state.isScattered, state.canvasWidth, state.canvasHeight, state.originalShape, dispatch])

  const showHintOutline = useCallback(() => {
    dispatch({ type: "SHOW_HINT" })
    setTimeout(() => {
      dispatch({ type: "HIDE_HINT" })
    }, 4000) // 延长提示显示时间到4秒
  }, [dispatch])

  // 添加重置游戏函数
  const resetGame = useCallback(() => {
    // Clear the canvases first
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
        if (backgroundCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext("2d")
      if (bgCtx) {
        bgCtx.clearRect(0, 0, backgroundCanvasRef.current.width, backgroundCanvasRef.current.height)
        }
      }
    // Then dispatch the reset action
    dispatch({ type: "RESET_GAME" })
  }, []) // Keep dependencies empty if refs are stable

  // 简单的音效函数
  const playSnapSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (e) {
      console.log("Audio not supported")
    }
  }

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 播放上升的音阶
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.type = "sine"
        oscillator.frequency.value = freq

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start(audioContext.currentTime + i * 0.1)
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3)
      })
    } catch (e) {
      console.log("Audio not supported")
    }
  }

  // 添加计算拼图边界的函数
  const calculatePieceBounds = useCallback((piece: PuzzlePiece): PieceBounds => {
    if (!piece.points || piece.points.length === 0) {
      console.warn("Empty piece or no points found");
      return {
        minX: 0, maxX: 0, minY: 0, maxY: 0,
        width: 0, height: 0, centerX: 0, centerY: 0
      };
    }
    
    // 计算拼图当前的中心点（用于旋转参考）
    const center = {
      x: piece.points.reduce((sum, p) => sum + p.x, 0) / piece.points.length,
      y: piece.points.reduce((sum, p) => sum + p.y, 0) / piece.points.length
    };
    
    // 如果拼图有旋转，则需要考虑旋转后的实际边界
    if (piece.rotation !== 0) {
      // 计算每个点旋转后的坐标
      const rotatedPoints = piece.points.map(point => {
        // 计算点到中心的向量
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        // 计算旋转角度（弧度）
        const angleRadians = piece.rotation * Math.PI / 180;
        
        // 旋转向量
        const rotatedDx = dx * Math.cos(angleRadians) - dy * Math.sin(angleRadians);
        const rotatedDy = dx * Math.sin(angleRadians) + dy * Math.cos(angleRadians);
        
        // 返回旋转后的坐标
        return {
          x: center.x + rotatedDx,
          y: center.y + rotatedDy
        };
      });
      
      // 使用旋转后的点计算边界框
      const minX = Math.min(...rotatedPoints.map(p => p.x));
      const maxX = Math.max(...rotatedPoints.map(p => p.x));
      const minY = Math.min(...rotatedPoints.map(p => p.y));
      const maxY = Math.max(...rotatedPoints.map(p => p.y));
      
      // 计算尺寸和中心点
      const width = maxX - minX;
      const height = maxY - minY;
      
      return { 
        minX, maxX, minY, maxY, 
        width, height, 
        centerX: center.x, 
        centerY: center.y 
      };
    }
    
    // 如果没有旋转，直接使用原始点计算边界框
    const minX = Math.min(...piece.points.map(p => p.x));
    const maxX = Math.max(...piece.points.map(p => p.x));
    const minY = Math.min(...piece.points.map(p => p.y));
    const maxY = Math.max(...piece.points.map(p => p.y));
    
    // 计算尺寸和中心点
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    return { minX, maxX, minY, maxY, width, height, centerX, centerY };
  }, []);
  
  // 添加边界约束函数
  const ensurePieceInBounds = useCallback((piece: PuzzlePiece, dx: number, dy: number, safeMargin: number = 1) => {
    const { canvasWidth, canvasHeight } = state;
    if (canvasWidth === undefined || canvasHeight === undefined) {
      console.warn("Canvas size not available for boundary check.");
      return { constrainedDx: dx, constrainedDy: dy, hitBoundary: false };
    }

    // 获取拼图当前的精确边界（考虑旋转后的实际坐标）
    const currentBounds = calculatePieceBounds(piece);

    // 计算应用dx, dy后的潜在新边界
    const potentialMinX = currentBounds.minX + dx;
    const potentialMaxX = currentBounds.maxX + dx;
    const potentialMinY = currentBounds.minY + dy;
    const potentialMaxY = currentBounds.maxY + dy;

    // 调试信息：记录边界检测细节
    console.log(`碰撞检测详情 [拼图ID: ${state.puzzle?.indexOf(piece) ?? -1}]:`, {
      pieceBounds: {
        current: { minX: currentBounds.minX, maxX: currentBounds.maxX, minY: currentBounds.minY, maxY: currentBounds.maxY },
        potential: { minX: potentialMinX, maxX: potentialMaxX, minY: potentialMinY, maxY: potentialMaxY }
      },
      canvas: { width: canvasWidth, height: canvasHeight },
      safeMargin: safeMargin,
      movement: { dx, dy }
    });

    let constrainedDx = dx;
    let constrainedDy = dy;
    let hitBoundary = false; // 标记是否触碰边界
    
    // 增加回弹因子，使拼图回弹更明显
    const bounceBackFactor = 0.4; 
    
    // 使用拼图尺寸的30%作为回弹距离基准
    const pieceSizeBasedBounce = Math.max(currentBounds.width, currentBounds.height) * 0.3;
    // 最大回弹距离限制(像素) - 确保回弹效果明显但不过度
    const maxBounceDistance = Math.min(Math.max(pieceSizeBasedBounce, 30), 80);

    // 计算需要修正的移动距离，使用真实画布边缘
    let correctionX = 0;
    let correctionY = 0;

    // 检查水平边界 - 使用画布真实边缘，仅保留1像素的缓冲防止渲染问题
    if (potentialMinX < safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = safeMargin - potentialMinX;
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
            correctionX = boundaryViolation; // 需要向右修正
            hitBoundary = true;
            console.log(`  ⚠️ 触碰左边界: 当前${potentialMinX}px < 安全边距${safeMargin}px, 修正${correctionX}px`);
        }
    } else if (potentialMaxX > canvasWidth - safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = potentialMaxX - (canvasWidth - safeMargin);
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
            correctionX = -(boundaryViolation); // 需要向左修正
            hitBoundary = true;
            console.log(`  ⚠️ 触碰右边界: 当前${potentialMaxX}px > 画布宽度${canvasWidth - safeMargin}px, 修正${correctionX}px`);
        }
    }

    // 检查垂直边界 - 使用画布真实边缘，仅保留1像素的缓冲防止渲染问题
    if (potentialMinY < safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = safeMargin - potentialMinY;
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
            correctionY = boundaryViolation; // 需要向下修正
            hitBoundary = true;
            console.log(`  ⚠️ 触碰上边界: 当前${potentialMinY}px < 安全边距${safeMargin}px, 修正${correctionY}px`);
        }
    } else if (potentialMaxY > canvasHeight - safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = potentialMaxY - (canvasHeight - safeMargin);
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
            correctionY = -(boundaryViolation); // 需要向上修正
            hitBoundary = true;
            console.log(`  ⚠️ 触碰下边界: 当前${potentialMaxY}px > 画布高度${canvasHeight - safeMargin}px, 修正${correctionY}px`);
        }
    }

    // 应用修正和回弹
    if (hitBoundary) {
        // 应用修正量，将拼图带回画布边缘
        constrainedDx = dx + correctionX;
        constrainedDy = dy + correctionY;
        
        console.log(`  🔄 应用修正: dx从${dx}修正为${constrainedDx}, dy从${dy}修正为${constrainedDy}`);

        // 计算回弹距离，与修正方向相反，但距离有限制
        // 使用Math.sign确保回弹方向正确，Math.min限制最大回弹距离
        const bounceX = Math.abs(correctionX) > 0 ? 
                       -Math.sign(correctionX) * Math.min(Math.abs(correctionX) * bounceBackFactor, maxBounceDistance) : 0;
        const bounceY = Math.abs(correctionY) > 0 ? 
                       -Math.sign(correctionY) * Math.min(Math.abs(correctionY) * bounceBackFactor, maxBounceDistance) : 0;

        // 应用回弹偏移
        constrainedDx += bounceX;
        constrainedDy += bounceY;
        
        console.log(`  🔄 应用回弹: 回弹X=${bounceX}, 回弹Y=${bounceY}, 最终dx=${constrainedDx}, dy=${constrainedDy}`);

        // 再次进行边界检查，确保回弹没有导致再次超出边界
        const finalMinX = currentBounds.minX + constrainedDx;
        const finalMaxX = currentBounds.maxX + constrainedDx;
        const finalMinY = currentBounds.minY + constrainedDy;
        const finalMaxY = currentBounds.maxY + constrainedDy;
        
        let secondCorrection = false;

        if (finalMinX < safeMargin) {
          constrainedDx = safeMargin - currentBounds.minX;
          secondCorrection = true;
          console.log(`  ⚠️ 回弹后仍触碰左边界, 最终修正dx=${constrainedDx}`);
        }
        if (finalMaxX > canvasWidth - safeMargin) {
          constrainedDx = (canvasWidth - safeMargin) - currentBounds.maxX;
          secondCorrection = true;
          console.log(`  ⚠️ 回弹后仍触碰右边界, 最终修正dx=${constrainedDx}`);
        }
        if (finalMinY < safeMargin) {
          constrainedDy = safeMargin - currentBounds.minY;
          secondCorrection = true;
          console.log(`  ⚠️ 回弹后仍触碰上边界, 最终修正dy=${constrainedDy}`);
        }
        if (finalMaxY > canvasHeight - safeMargin) {
          constrainedDy = (canvasHeight - safeMargin) - currentBounds.maxY;
          secondCorrection = true;
          console.log(`  ⚠️ 回弹后仍触碰下边界, 最终修正dy=${constrainedDy}`);
        }
        
        if (secondCorrection) {
          console.log(`  🔄 第二次边界修正: 最终dx=${constrainedDx}, dy=${constrainedDy}`);
        }

        // 播放碰撞音效 - 仅在触碰边界时
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // 创建主音频振荡器 - 低音碰撞声
          const oscillator1 = audioContext.createOscillator();
          const gainNode1 = audioContext.createGain();
          
          oscillator1.type = "sine";
          oscillator1.frequency.setValueAtTime(120, audioContext.currentTime); // 更低的音调
          gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15); // 更快衰减
          
          oscillator1.connect(gainNode1);
          gainNode1.connect(audioContext.destination);
          
          // 创建次要振荡器 - 高音碰撞声
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          
          oscillator2.type = "sine";
          oscillator2.frequency.setValueAtTime(240, audioContext.currentTime); // 高一倍的音调
          gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // 更快衰减
          
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);
          
          // 启动并停止振荡器
          oscillator1.start();
          oscillator2.start();
          oscillator1.stop(audioContext.currentTime + 0.15);
          oscillator2.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          console.log("Audio not supported");
      }
    } else {
        // 如果没有触碰边界，移动距离不受约束
        constrainedDx = dx;
        constrainedDy = dy;
    }

    return { constrainedDx, constrainedDy, hitBoundary };
  }, [state.canvasWidth, state.canvasHeight, calculatePieceBounds, state.puzzle]);
  
  // 添加updateCanvasSize函数用于更新画布尺寸
  const updateCanvasSize = useCallback((width: number, height: number) => {
    console.log(`更新GameContext中的画布尺寸: ${width}x${height}`);
    
    // 至少确保有一个最小尺寸
    const finalWidth = Math.max(width, 300);
    const finalHeight = Math.max(height, 200);
    
    // 如果尺寸发生变化，则更新状态
    if (finalWidth !== state.canvasWidth || finalHeight !== state.canvasHeight) {
      dispatch({
        type: "UPDATE_CANVAS_SIZE",
        payload: { width: finalWidth, height: finalHeight }
      });
      
      // 如果已经有形状，则需要考虑调整形状位置以适应新的画布尺寸
      if (state.originalShape.length > 0) {
        console.log("画布尺寸变化，考虑调整形状位置");
      }
    }
  }, [dispatch, state.canvasWidth, state.canvasHeight, state.originalShape.length]);

  // 组装上下文值，添加resetGame函数
  const contextValue: GameContextProps = {
    state,
    dispatch,
    canvasRef,
    backgroundCanvasRef,
    generateShape,
    generatePuzzle,
    scatterPuzzle,
    rotatePiece,
    showHintOutline,
    resetGame,
    calculatePieceBounds,
    ensurePieceInBounds,
    updateCanvasSize
  }

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

