"use client"

import { useCallback, useReducer, useRef, createContext, useContext, useEffect } from "react"

import type { ReactNode } from "react"
// import { ShapeType, CutType } from "@/types/types"
import { ShapeGenerator } from "@/utils/shape/ShapeGenerator"
import { PuzzleGenerator } from "@/utils/puzzle/PuzzleGenerator"
import { ScatterPuzzle } from "@/utils/puzzle/ScatterPuzzle"
import { calculateCenter } from "@/utils/geometry/puzzleGeometry"

// 导入从 puzzleTypes.ts 迁移的类型
import { Point, PuzzlePiece, DraggingPiece, PieceBounds, GameState, GameAction as GameActionType, GameContextProps, ShapeType, CutType } from "@/types/puzzleTypes";

// 删除本地GameState接口声明，全部使用types/puzzleTypes.ts导入的GameState类型
// 更新GameContextProps接口
// ... existing code ...

// 画布相关状态统一管理（全局适配基准）
// - canvasWidth/canvasHeight: 当前画布像素尺寸，随容器/窗口变化实时更新
// - scale: 当前画布的缩放比例（如有适配缩放需求时使用）
// - orientation: 当前画布方向（'portrait' | 'landscape'），便于移动端适配
// - previousCanvasSize: 上一次画布尺寸（{ width: number, height: number }），用于归一化适配和状态恢复
const initialState: GameState = {
  originalShape: [],
  baseShape: [], // 基础形状（未经适配）
  baseCanvasSize: { width: 0, height: 0 }, // 基础形状对应的画布尺寸
  puzzle: null,
  draggingPiece: null,
  selectedPiece: null,
  completedPieces: [],
  isCompleted: false,
  isScattered: false,
  showHint: false,
  shapeType: '' as any, // 初始无选中
  pendingShapeType: null,
  cutType: "" as CutType,
  cutCount: 1,
  originalPositions: [],
  canvasWidth: 0, // 当前画布宽度（像素）
  canvasHeight: 0, // 当前画布高度（像素）
  previousCanvasSize: { width: 0, height: 0 }, // 上一次画布尺寸
}

function gameReducer(state: GameState, action: GameActionType): GameState {
  // reducer 入口
  switch (action.type) {
    case "SET_ORIGINAL_SHAPE":
      // SET_ORIGINAL_SHAPE
      return { ...state, originalShape: action.payload }
    case "SET_BASE_SHAPE":
      // SET_BASE_SHAPE - 设置基础形状和对应的画布尺寸
      // 注意：只设置基础形状，不更新originalShape，让useShapeAdaptation负责适配
      return { 
        ...state, 
        baseShape: action.payload.shape,
        baseCanvasSize: action.payload.canvasSize
      }
    case "SET_PUZZLE":
      // SET_PUZZLE
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
      // RESET_GAME
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
      // BATCH_UPDATE
      return {
        ...state,
        puzzle: action.payload.puzzle,
        originalPositions: action.payload.originalPositions
      }
    case "SYNC_ALL_POSITIONS":
      // SYNC_ALL_POSITIONS
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
    case "MOVE_PIECE": {
      if (!state.puzzle) return state;
      const { pieceIndex, x, y } = action.payload;
      const puzzle = [...state.puzzle];
      const piece = puzzle[pieceIndex];
      if (!piece) return state;

      const oldCenter = calculateCenter(piece.points);
      const dx = x - oldCenter.x;
      const dy = y - oldCenter.y;

      piece.points = piece.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
      piece.x += dx;
      piece.y += dy;

      return { ...state, puzzle };
    }
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
      dispatch({ type: "ROTATE_PIECE", payload: { clockwise } })
    },
    [dispatch],
  )

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

  // generateShape 支持传入 shapeType，点击按钮时强制生成新形状
  const generateShape = useCallback((shapeType?: ShapeType) => {
    // 如果传入 shapeType，则强制使用该类型
    const currentShapeType = shapeType || state.pendingShapeType || state.shapeType;
    
    // 获取实际画布尺寸以确保形状居中
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      if (canvasWidth <= 0 || canvasHeight <= 0) {
        // 画布尺寸无效，使用默认值
      }
      try {
        const shape = ShapeGenerator.generateShape(currentShapeType);
        if (shape.length === 0) {
          console.error("生成的形状没有点");
          return;
        }
        // 直接根据画布尺寸适配形状
        // 形状直径应该是画布较小边的30%
        const canvasMinDimension = Math.min(canvasWidth, canvasHeight);
        const targetDiameter = canvasMinDimension * 0.3;
        
        // 计算当前形状的大致直径
        const bounds = shape.reduce(
          (acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxX: Math.max(acc.maxX, point.x),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );
        
        const currentDiameter = Math.max(
          bounds.maxX - bounds.minX,
          bounds.maxY - bounds.minY
        );
        
        // 计算缩放比例
        const scaleRatio = currentDiameter > 0 ? targetDiameter / currentDiameter : 0.3;
        
        // 计算形状中心
        const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
        const shapeCenterY = (bounds.minY + bounds.maxY) / 2;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        
        // 缩放并居中形状
        const adaptedShape = shape.map(point => {
          // 相对于形状中心的坐标
          const relativeX = point.x - shapeCenterX;
          const relativeY = point.y - shapeCenterY;
          
          // 应用缩放
          const scaledX = relativeX * scaleRatio;
          const scaledY = relativeY * scaleRatio;
          
          // 重新定位到画布中心
          return {
            ...point,
            x: canvasCenterX + scaledX,
            y: canvasCenterY + scaledY,
          };
        });
        
        console.log(`形状生成适配: 画布=${canvasWidth}x${canvasHeight}, 目标直径=${targetDiameter.toFixed(1)}, 当前直径=${currentDiameter.toFixed(1)}, 缩放比例=${scaleRatio.toFixed(3)}`);
        // 设置基础形状
        dispatch({ 
          type: "SET_BASE_SHAPE", 
          payload: { 
            shape: adaptedShape, 
            canvasSize: { width: canvasWidth, height: canvasHeight } 
          } 
        });
        
        // 同时设置当前显示形状，确保立即显示
        // 这样即使适配Hook有延迟，形状也能立即显示
        dispatch({ 
          type: "SET_ORIGINAL_SHAPE", 
          payload: adaptedShape 
        });
        
        // 强制更新 shapeType
        dispatch({ type: "SET_SHAPE_TYPE", payload: currentShapeType });
      } catch (error) {
        console.error("形状生成失败:", error);
      }
    } else {
      // 画布引用不可用，使用默认方法
      try {
        const shape = ShapeGenerator.generateShape(currentShapeType);
        if (shape.length === 0) {
          console.error("生成的形状没有点");
          return;
        }
        // 设置基础形状（使用默认画布尺寸）
        const defaultCanvasSize = { width: 800, height: 600 };
        
        // 即使没有画布引用，也要根据默认尺寸适配形状
        const canvasMinDimension = Math.min(defaultCanvasSize.width, defaultCanvasSize.height);
        const targetDiameter = canvasMinDimension * 0.3;
        
        // 计算当前形状的大致直径
        const bounds = shape.reduce(
          (acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxX: Math.max(acc.maxX, point.x),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );
        
        const currentDiameter = Math.max(
          bounds.maxX - bounds.minX,
          bounds.maxY - bounds.minY
        );
        
        // 计算缩放比例
        const scaleRatio = currentDiameter > 0 ? targetDiameter / currentDiameter : 0.3;
        
        // 计算形状中心
        const shapeCenterX = (bounds.minX + bounds.maxX) / 2;
        const shapeCenterY = (bounds.minY + bounds.maxY) / 2;
        const canvasCenterX = defaultCanvasSize.width / 2;
        const canvasCenterY = defaultCanvasSize.height / 2;
        
        // 缩放并居中形状
        const adaptedShape = shape.map(point => {
          // 相对于形状中心的坐标
          const relativeX = point.x - shapeCenterX;
          const relativeY = point.y - shapeCenterY;
          
          // 应用缩放
          const scaledX = relativeX * scaleRatio;
          const scaledY = relativeY * scaleRatio;
          
          // 重新定位到画布中心
          return {
            ...point,
            x: canvasCenterX + scaledX,
            y: canvasCenterY + scaledY,
          };
        });
        
        dispatch({ 
          type: "SET_BASE_SHAPE", 
          payload: { 
            shape: adaptedShape, 
            canvasSize: defaultCanvasSize // 默认尺寸
          } 
        });
        
        // 同时设置当前显示形状，确保立即显示
        dispatch({ 
          type: "SET_ORIGINAL_SHAPE", 
          payload: adaptedShape 
        });
        
        dispatch({ type: "SET_SHAPE_TYPE", payload: currentShapeType });
      } catch (error) {
        console.error("默认形状生成失败:", error);
      }
    }
  }, [state.shapeType, state.pendingShapeType, canvasRef, dispatch]);

  // 1. useRef 兜底，始终保存 puzzle 最新值
  const puzzleRef = useRef(state.puzzle);
  useEffect(() => {
    puzzleRef.current = state.puzzle;
    // 拼图状态更新
  }, [state.puzzle]);

  // 2. generatePuzzle 加日志
  const generatePuzzle = useCallback(() => {
    if (!state.originalShape) return;
    const { pieces, originalPositions } = PuzzleGenerator.generatePuzzle(
      state.originalShape,
      state.cutType,
      state.cutCount,
    );
    // 拼图生成完成
    dispatch({ type: "SET_PUZZLE", payload: pieces });
    dispatch({ type: "SET_ORIGINAL_POSITIONS", payload: originalPositions });
  }, [state.originalShape, state.cutType, state.cutCount, dispatch]);

  // 3. scatterPuzzle 加日志和 useRef 兜底
  const scatterPuzzle = useCallback(() => {
    const puzzle = puzzleRef.current;
    // 散开前 puzzle 长度
    const canvasWidth = state.canvasWidth ?? 0;
    const canvasHeight = state.canvasHeight ?? 0;
    // 散布拼图前的状态检查
    if (!puzzle) {
      console.warn("Cannot scatter puzzle: No puzzle pieces generated");
      return;
    }
    if (state.isScattered) {
      console.warn("Puzzle already scattered");
      return;
    }
    let targetShape = null;
    if (state.originalShape && state.originalShape.length > 0) {
      const bounds = state.originalShape.reduce(
        (acc, point) => ({
          minX: Math.min(acc.minX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxX: Math.max(acc.maxX, point.x),
          maxY: Math.max(acc.maxY, point.y),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const radius = Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2) * 1.2;
      targetShape = {
        center: { x: centerX, y: centerY },
        radius: radius
      };
    }
    const scatteredPuzzle = ScatterPuzzle.scatterPuzzle(puzzle, {
      canvasWidth,
      canvasHeight,
      targetShape: targetShape
    });
    // 散开后 puzzle 长度
    // 散布拼图完成
    if (!scatteredPuzzle || !Array.isArray(scatteredPuzzle) || scatteredPuzzle.length === 0) {
      console.error('scatterPuzzle failed, fallback to original puzzle');
      return;
    }
    dispatch({ type: "SET_PUZZLE", payload: scatteredPuzzle });
    dispatch({ type: "SET_IS_SCATTERED", payload: true });
  }, [state.isScattered, state.canvasWidth, state.canvasHeight, state.originalShape, dispatch]);

  // Test API setup（无论开发、生产、测试环境都挂载只读状态）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__gameStateForTests__ = {
        puzzle: state.puzzle,
        completedPieces: state.completedPieces,
        originalPositions: state.originalPositions,
        isCompleted: state.isCompleted,
        originalShape: state.originalShape,
        baseShape: state.baseShape,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
      };
      
      // 为测试脚本暴露游戏状态 - 确保每次状态变化都更新
      (window as any).__GAME_STATE__ = {
        originalShape: state.originalShape,
        baseShape: state.baseShape,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        puzzle: state.puzzle,
        isCompleted: state.isCompleted,
        shapeType: state.shapeType,
        // 添加调试信息
        _debug: {
          originalShapeLength: state.originalShape?.length || 0,
          baseShapeLength: state.baseShape?.length || 0,
          hasValidCanvas: state.canvasWidth > 0 && state.canvasHeight > 0,
          timestamp: Date.now()
        }
      };
      
      // 在控制台输出状态更新信息，便于调试
      console.log('__GAME_STATE__ 已更新:', {
        originalShapeLength: state.originalShape?.length || 0,
        baseShapeLength: state.baseShape?.length || 0,
        canvasSize: `${state.canvasWidth}x${state.canvasHeight}`,
        shapeType: state.shapeType
      });
    }
  }, [state.puzzle, state.completedPieces, state.originalPositions, state.isCompleted, state.originalShape, state.baseShape, state.canvasWidth, state.canvasHeight]);

  // 测试辅助函数：无论环境都挂载，保证 E2E 可用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectPieceForTest = (pieceIndex: number) => dispatch({ type: 'SET_SELECTED_PIECE', payload: pieceIndex });
      (window as any).markPieceAsCompletedForTest = (pieceIndex: number) => dispatch({ type: 'ADD_COMPLETED_PIECE', payload: pieceIndex });
      (window as any).rotatePieceForTest = (clockwise: boolean) => rotatePiece(clockwise);
      (window as any).resetPiecePositionForTest = (pieceIndex: number) => dispatch({ type: 'RESET_PIECE_TO_ORIGINAL', payload: pieceIndex });
      // 其它 testAPI 保持原样
      window.testAPI = {
        generateShape: (shapeType) => dispatch({ type: 'SET_SHAPE_TYPE', payload: shapeType }),
        generatePuzzle: (cutCount) => {
          dispatch({ type: 'SET_CUT_TYPE', payload: 'straight' });
          dispatch({ type: 'SET_CUT_COUNT', payload: cutCount });
          generatePuzzle();
        },
        scatterPuzzle: () => scatterPuzzle(),
        movePiece: (pieceIndex, x, y) => dispatch({ type: 'MOVE_PIECE', payload: { pieceIndex, x, y } }),
        snapPiece: (pieceIndex) => {
            dispatch({ type: 'RESET_PIECE_TO_ORIGINAL', payload: pieceIndex });
            dispatch({ type: 'ADD_COMPLETED_PIECE', payload: pieceIndex });
        },
        getPieceCenter: (pieceIndex) => {
            if (!state.puzzle) return { x: 0, y: 0 };
            const piece = state.puzzle[pieceIndex];
            return piece ? calculateCenter(piece.points) : { x: 0, y: 0 };
        },
        getPieceTargetCenter: (pieceIndex) => {
            if (!state.originalPositions) return { x: 0, y: 0 };
            const piece = state.originalPositions[pieceIndex];
            return piece ? calculateCenter(piece.points) : { x: 0, y: 0 };
        },
      };
    }
  }, [state, generatePuzzle, scatterPuzzle, dispatch, rotatePiece]);

  const showHintOutline = useCallback(() => {
    dispatch({ type: "SHOW_HINT" })
    setTimeout(() => {
      dispatch({ type: "HIDE_HINT" })
    }, 4000) // 延长提示显示时间到4秒
  }, [dispatch])

  // 4. resetGame 加日志
  const resetGame = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (backgroundCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext("2d");
      if (bgCtx) bgCtx.clearRect(0, 0, backgroundCanvasRef.current.width, backgroundCanvasRef.current.height);
    }
    // 重置游戏状态
    dispatch({ type: "RESET_GAME" });
  }, []);

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
      // 静默处理空拼图块，避免控制台警告
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
    // 修正：强制以 canvasRef.current.width/height 为主判据
    let canvasW = canvasRef.current?.width;
    let canvasH = canvasRef.current?.height;
    if (!canvasW || !canvasH) {
      canvasW = (state.canvasWidth ?? 0);
      canvasH = (state.canvasHeight ?? 0);
    }
    if (!canvasW || !canvasH) {
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

    // 边界检测逻辑

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

        }
    } else if (potentialMaxX > canvasW - safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = potentialMaxX - (canvasW - safeMargin);
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
            correctionX = -(boundaryViolation); // 需要向左修正
            hitBoundary = true;

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

        }
    } else if (potentialMaxY > canvasH - safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = potentialMaxY - (canvasH - safeMargin);
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
            correctionY = -(boundaryViolation); // 需要向上修正
            hitBoundary = true;

        }
    }

    // 应用修正和回弹
    if (hitBoundary) {
        // 应用修正量，将拼图带回画布边缘
        constrainedDx = dx + correctionX;
        constrainedDy = dy + correctionY;
        


        // 计算回弹距离，与修正方向相反，但距离有限制
        // 使用Math.sign确保回弹方向正确，Math.min限制最大回弹距离
        const bounceX = Math.abs(correctionX) > 0 ? 
                       -Math.sign(correctionX) * Math.min(Math.abs(correctionX) * bounceBackFactor, maxBounceDistance) : 0;
        const bounceY = Math.abs(correctionY) > 0 ? 
                       -Math.sign(correctionY) * Math.min(Math.abs(correctionY) * bounceBackFactor, maxBounceDistance) : 0;

        // 应用回弹偏移
        constrainedDx += bounceX;
        constrainedDy += bounceY;
        


        // 再次进行边界检查，确保回弹没有导致再次超出边界
        const finalMinX = currentBounds.minX + constrainedDx;
        const finalMaxX = currentBounds.maxX + constrainedDx;
        const finalMinY = currentBounds.minY + constrainedDy;
        const finalMaxY = currentBounds.maxY + constrainedDy;
        
        let secondCorrection = false;

        if (finalMinX < safeMargin) {
          constrainedDx = safeMargin - currentBounds.minX;
          secondCorrection = true;

        }
        if (finalMaxX > canvasW - safeMargin) {
          constrainedDx = (canvasW - safeMargin) - currentBounds.maxX;
          secondCorrection = true;

        }
        if (finalMinY < safeMargin) {
          constrainedDy = safeMargin - currentBounds.minY;
          secondCorrection = true;

        }
        if (finalMaxY > canvasH - safeMargin) {
          constrainedDy = (canvasH - safeMargin) - currentBounds.maxY;
          secondCorrection = true;

        }
        
        if (secondCorrection) {

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
  }, [state.canvasWidth, state.canvasHeight, calculatePieceBounds, state.puzzle, canvasRef]);
  
  // updateCanvasSize 函数
  // 仅更新画布尺寸，不重置 puzzle 状态。会将当前尺寸存入 previousCanvasSize，
  // 新尺寸存入 canvasWidth/canvasHeight，供适配逻辑使用。
  // 该函数是画布尺寸变化时状态记忆与恢复的关键入口。
  const updateCanvasSize = useCallback((width: number, height: number) => {
    // 更新画布尺寸
    // 至少确保有一个最小尺寸
    const finalWidth = Math.max(width, 320); // 强制最小宽度320
    const finalHeight = Math.max(height, 200);
    // 只更新尺寸，不重置 puzzle
    if (finalWidth !== state.canvasWidth || finalHeight !== state.canvasHeight) {
      dispatch({
        type: "UPDATE_CANVAS_SIZE",
        payload: { width: finalWidth, height: finalHeight }
      });
      // 不再自动 RESET_GAME 或 SET_PUZZLE(null)
      // 画布尺寸已更新
    }
  }, [dispatch, state.canvasWidth, state.canvasHeight]);

  // puzzle 相关副作用日志
  // 便于调试和追踪尺寸变化对拼图状态的影响。
  // 游戏状态监控（已移除调试日志）

  // 状态变化监控（已移除调试日志）

  // 新增 isCanvasReady 标志
  const isCanvasReady = state.canvasWidth > 0 && state.canvasHeight > 0;
  // 生成/分布拼图的 useEffect 依赖 isCanvasReady
  useEffect(() => {
    if (!isCanvasReady) return;
    // 只有画布尺寸 ready 时才允许生成/分布拼图
    // 1. useRef 兜底，始终保存 puzzle 最新值
    // 2. generatePuzzle 加日志
    // 3. scatterPuzzle 加日志和 useRef 兜底
  }, [isCanvasReady, state.originalShape, state.cutType, state.cutCount]);

  // 画布尺寸变化时自动重新分布拼图，保证resize后拼图不会消失
  useEffect(() => {
    if (state.isScattered && state.puzzle && state.puzzle.length > 0) {
      // 重新分布拼图，基于最新canvas尺寸
      let targetShape = null;
      if (state.originalShape && state.originalShape.length > 0) {
        const bounds = state.originalShape.reduce(
          (acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            minY: Math.min(acc.minY, point.y),
            maxX: Math.max(acc.maxX, point.x),
            maxY: Math.max(acc.maxY, point.y),
          }),
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const radius = Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2) * 1.2;
        targetShape = {
          center: { x: centerX, y: centerY },
          radius: radius
        };
      }
      const scatteredPuzzle = ScatterPuzzle.scatterPuzzle(state.puzzle, {
        canvasWidth: state.canvasWidth ?? 0,
        canvasHeight: state.canvasHeight ?? 0,
        targetShape: targetShape
      });
      if (scatteredPuzzle && Array.isArray(scatteredPuzzle) && scatteredPuzzle.length > 0) {
        dispatch({ type: "SET_PUZZLE", payload: scatteredPuzzle });
      }
    }
  }, [state.canvasWidth, state.canvasHeight]);

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

