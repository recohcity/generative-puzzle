"use client"

import { useCallback, useReducer, useRef, createContext, useContext } from "react"

import type { ReactNode } from "react"
import { ShapeType, CutType } from "@/types/types"
import { ShapeGenerator } from "@/utils/shape/ShapeGenerator"
import { PuzzleGenerator } from "@/utils/puzzle/PuzzleGenerator"
import { ScatterPuzzle } from "@/utils/puzzle/ScatterPuzzle"

// Define types
interface Point {
  x: number
  y: number
  isOriginal?: boolean
}

interface PuzzlePiece {
  points: Point[]
  originalPoints: Point[]
  rotation: number
  originalRotation: number
  x: number
  y: number
  originalX: number
  originalY: number
}

interface DraggingPiece {
  index: number
  startX: number
  startY: number
}

// 添加一个接口描述边界信息
interface PieceBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

interface GameState {
  originalShape: Point[]
  puzzle: PuzzlePiece[] | null
  draggingPiece: DraggingPiece | null
  selectedPiece: number | null
  completedPieces: number[]
  isCompleted: boolean
  isScattered: boolean
  showHint: boolean
  shapeType: ShapeType
  pendingShapeType: ShapeType | null // 待生成的形状类型
  cutType: CutType
  cutCount: number
  originalPositions: PuzzlePiece[]
  lastShapeOffsetX?: number
  lastShapeOffsetY?: number
  // 添加画布尺寸信息，用于边界检查
  canvasWidth?: number
  canvasHeight?: number
}

// 更新GameContextProps接口
interface GameContextProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement | null>
  generateShape: () => void
  generatePuzzle: () => void
  scatterPuzzle: () => void
  rotatePiece: (clockwise: boolean) => void
  showHintOutline: () => void
  resetGame: () => void
  // 添加边界检查函数
  calculatePieceBounds: (piece: PuzzlePiece) => PieceBounds
  ensurePieceInBounds: (piece: PuzzlePiece, dx: number, dy: number, safeMargin?: number) => { constrainedDx: number, constrainedDy: number }
  updateCanvasSize: (width: number, height: number) => void
}

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
  cutType: CutType.Straight,
  cutCount: 1,
  originalPositions: [],
  canvasWidth: 800,  // 默认画布宽度
  canvasHeight: 600, // 默认画布高度
}

type GameAction =
  | { type: "SET_ORIGINAL_SHAPE"; payload: Point[] }
  | { type: "SET_PUZZLE"; payload: PuzzlePiece[] }
  | { type: "SET_DRAGGING_PIECE"; payload: DraggingPiece | null }
  | { type: "SET_SELECTED_PIECE"; payload: number | null }
  | { type: "SET_COMPLETED_PIECES"; payload: number[] }
  | { type: "ADD_COMPLETED_PIECE"; payload: number }
  | { type: "SET_IS_COMPLETED"; payload: boolean }
  | { type: "SET_IS_SCATTERED"; payload: boolean }
  | { type: "SET_SHOW_HINT"; payload: boolean }
  | { type: "SET_SHAPE_TYPE"; payload: ShapeType }
  | { type: "SET_SHAPE_TYPE_WITHOUT_REGENERATE"; payload: ShapeType }
  | { type: "SET_CUT_TYPE"; payload: CutType }
  | { type: "SET_CUT_COUNT"; payload: number }
  | { type: "GENERATE_SHAPE" }
  | { type: "GENERATE_PUZZLE" }
  | { type: "SCATTER_PUZZLE" }
  | { type: "ROTATE_PIECE"; payload: { clockwise: boolean } }
  | { type: "UPDATE_PIECE_POSITION"; payload: { index: number; dx: number; dy: number } }
  | { type: "RESET_PIECE_TO_ORIGINAL"; payload: number }
  | { type: "SHOW_HINT" }
  | { type: "HIDE_HINT" }
  | { type: "RESET_GAME" }
  | { type: "SET_ORIGINAL_POSITIONS"; payload: PuzzlePiece[] }
  | { type: "SET_SHAPE_OFFSET"; payload: { offsetX: number; offsetY: number } }
  | { type: "BATCH_UPDATE"; payload: { puzzle: PuzzlePiece[]; originalPositions: PuzzlePiece[] } }
  | { type: "SYNC_ALL_POSITIONS"; payload: { originalShape: Point[]; puzzle: PuzzlePiece[]; originalPositions: PuzzlePiece[]; shapeOffset: { offsetX: number; offsetY: number } } }
  | { type: "UPDATE_CANVAS_SIZE"; payload: { width: number; height: number } }
  | { type: "NO_CHANGE" }

// 在gameReducer中添加RESET_GAME动作处理
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_ORIGINAL_SHAPE":
      return { ...state, originalShape: action.payload }
    case "SET_PUZZLE":
      return { ...state, puzzle: action.payload }
    case "SET_DRAGGING_PIECE":
      return { ...state, draggingPiece: action.payload }
    case "SET_SELECTED_PIECE":
      return { ...state, selectedPiece: action.payload }
    case "SET_COMPLETED_PIECES":
      return { ...state, completedPieces: action.payload }
    case "ADD_COMPLETED_PIECE":
      return { ...state, completedPieces: [...state.completedPieces, action.payload] }
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
        shapeType: state.shapeType, // 保留当前形状类型设置
        cutType: state.cutType, // 保留当前切割类型设置
        cutCount: state.cutCount, // 保留当前切割次数设置
        // 重要：保留当前画布尺寸信息
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
      return {
        ...state,
        canvasWidth: action.payload.width,
        canvasHeight: action.payload.height
      }
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
  }, [state.puzzle, state.isScattered, state.canvasWidth, state.canvasHeight, state.originalShape, dispatch])

  const rotatePiece = useCallback(
    (clockwise: boolean) => {
      console.log(`[GameContext] rotatePiece called, clockwise: ${clockwise}`);
      dispatch({ type: "ROTATE_PIECE", payload: { clockwise } })
      console.log('[GameContext] ROTATE_PIECE dispatched');
    },
    [dispatch],
  )

  const showHintOutline = useCallback(() => {
    dispatch({ type: "SHOW_HINT" })
    setTimeout(() => {
      dispatch({ type: "HIDE_HINT" })
    }, 2000)
  }, [dispatch])

  // 添加重置游戏函数
  const resetGame = useCallback(() => {
    console.log("重置游戏状态");
    
    // 确保保留当前画布尺寸和设备信息
    const currentCanvasWidth = state.canvasWidth;
    const currentCanvasHeight = state.canvasHeight;
    
    // 记录当前设备信息，用于日志
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log(`重置时设备信息: 移动=${isMobile}, 竖屏=${isPortrait}, 画布=${currentCanvasWidth}x${currentCanvasHeight}`);
    
    // 清除状态
    dispatch({ type: "RESET_GAME" });
    
    // 重要：确保画布尺寸已正确设置
    if (canvasRef.current) {
      const hasCorrectSize = 
        canvasRef.current.width === currentCanvasWidth && 
        canvasRef.current.height === currentCanvasHeight;
      
      console.log(`重置后画布尺寸: ${canvasRef.current.width}x${canvasRef.current.height}, 是否正确: ${hasCorrectSize}`);
      
      // 如果尺寸不匹配，强制更新
      if (!hasCorrectSize && currentCanvasWidth && currentCanvasHeight) {
        console.log("重置后画布尺寸不正确，强制更新");
        canvasRef.current.width = currentCanvasWidth;
        canvasRef.current.height = currentCanvasHeight;
        
        if (backgroundCanvasRef.current) {
          backgroundCanvasRef.current.width = currentCanvasWidth;
          backgroundCanvasRef.current.height = currentCanvasHeight;
        }
      }
    }
  }, [dispatch, state.canvasWidth, state.canvasHeight, canvasRef, backgroundCanvasRef]);

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
    
    // 计算拼图的边界框
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
  const ensurePieceInBounds = useCallback((piece: PuzzlePiece, dx: number, dy: number, safeMargin: number = 10): { constrainedDx: number, constrainedDy: number } => {
    const bounds = calculatePieceBounds(piece);
    
    // 如果未设置画布尺寸，则不应用约束
    if (!state.canvasWidth || !state.canvasHeight) {
      console.warn("Canvas size not set, cannot constrain piece");
      return { constrainedDx: dx, constrainedDy: dy };
    }
    
    // 检测设备类型和屏幕方向
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // 为移动设备设置额外大的安全边距
    let actualSafeMargin = safeMargin;
    if (isMobile && isPortrait) {
      // 手机竖屏模式使用非常严格的边距
      actualSafeMargin = Math.max(safeMargin, Math.floor(state.canvasWidth * 0.08));
    } else if (isMobile) {
      // 手机横屏模式
      actualSafeMargin = Math.max(safeMargin, Math.floor(state.canvasWidth * 0.05)); 
    }
    
    // 为小拼图特别处理 - 通过拼图尺寸判断是否为小拼图
    const isSmallPiece = bounds.width < state.canvasWidth * 0.15 || bounds.height < state.canvasHeight * 0.15;
    
    // 如果是小拼图，减小边界约束的严格度，让用户可以更容易地操作
    if (isSmallPiece && isMobile) {
      // 减小边界约束，允许更多操作空间
      actualSafeMargin = Math.max(5, Math.floor(actualSafeMargin * 0.7));
    }
    
    // 计算预期的新位置
    const newMinX = bounds.minX + dx;
    const newMaxX = bounds.maxX + dx;
    const newMinY = bounds.minY + dy;
    const newMaxY = bounds.maxY + dy;
    
    // 添加安全边距，确保拼图不会完全移出视图
    const canvasBounds = {
      minX: actualSafeMargin,
      maxX: state.canvasWidth - actualSafeMargin,
      minY: actualSafeMargin,
      maxY: state.canvasHeight - actualSafeMargin
    };
    
    // 计算约束后的移动距离
    let constrainedDx = dx;
    let constrainedDy = dy;
    
    // 如果是移动设备，使用更严格的约束
    if (isMobile) {
      // 更严格的水平约束 - 确保整个拼图都在画布范围内
      if (newMinX < canvasBounds.minX) {
        constrainedDx = canvasBounds.minX - bounds.minX;
      } else if (newMaxX > canvasBounds.maxX) {
        constrainedDx = canvasBounds.maxX - bounds.maxX;
      }
      
      // 更严格的垂直约束 - 确保整个拼图都在画布范围内
      if (newMinY < canvasBounds.minY) {
        constrainedDy = canvasBounds.minY - bounds.minY;
      } else if (newMaxY > canvasBounds.maxY) {
        constrainedDy = canvasBounds.maxY - bounds.maxY;
      }
      
      // 额外的安全检查 - 确保在约束后拼图真的在画布内
      const constrainedMinX = bounds.minX + constrainedDx;
      const constrainedMaxX = bounds.maxX + constrainedDx;
      const constrainedMinY = bounds.minY + constrainedDy;
      const constrainedMaxY = bounds.maxY + constrainedDy;
      
      if (constrainedMinX < canvasBounds.minX) {
        constrainedDx = canvasBounds.minX - bounds.minX;
      }
      if (constrainedMaxX > canvasBounds.maxX) {
        constrainedDx = canvasBounds.maxX - bounds.maxX;
      }
      if (constrainedMinY < canvasBounds.minY) {
        constrainedDy = canvasBounds.minY - bounds.minY;
      }
      if (constrainedMaxY > canvasBounds.maxY) {
        constrainedDy = canvasBounds.maxY - bounds.maxY;
      }
    } else {
      // 标准设备的宽松约束，确保至少有一部分拼图仍然可见
      // 水平约束
      if (newMaxX < canvasBounds.minX) {
        // 如果整个拼图都超出了左边界，则约束到左边界
        constrainedDx = canvasBounds.minX - bounds.maxX;
      } else if (newMinX > canvasBounds.maxX) {
        // 如果整个拼图都超出了右边界，则约束到右边界
        constrainedDx = canvasBounds.maxX - bounds.minX;
      }
      
      // 垂直约束
      if (newMaxY < canvasBounds.minY) {
        // 如果整个拼图都超出了上边界，则约束到上边界
        constrainedDy = canvasBounds.minY - bounds.maxY;
      } else if (newMinY > canvasBounds.maxY) {
        // 如果整个拼图都超出了下边界，则约束到下边界
        constrainedDy = canvasBounds.maxY - bounds.minY;
      }
    }
    
    return { constrainedDx, constrainedDy };
  }, [calculatePieceBounds, state.canvasWidth, state.canvasHeight]);
  
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

