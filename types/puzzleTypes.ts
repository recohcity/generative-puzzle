import type { ReactNode } from "react"

// Define enums
export enum ShapeType {
  Polygon = "polygon",
  Curve = "curve",
  Circle = "irregular",
}

export enum CutType {
  Straight = "straight",
  Diagonal = "diagonal",
}

// Define types
export interface Point {
  x: number
  y: number
  isOriginal?: boolean
}

export interface PuzzlePiece {
  points: Point[]
  originalPoints: Point[]
  rotation: number
  originalRotation: number
  x: number
  y: number
  originalX: number
  originalY: number
  normalizedX?: number; // Added for adaptation
  normalizedY?: number; // Added for adaptation
}

export interface DraggingPiece {
  index: number
  startX: number
  startY: number
}

// 添加一个接口描述边界信息
export interface PieceBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface GameState {
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
  previousCanvasSize?: { width: number; height: number } | null; // Added for adaptation
  isShaking: boolean // 新增属性，表示是否处于抖动动画
}

// 更新GameContextProps接口
export interface GameContextProps {
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
  ensurePieceInBounds: (piece: PuzzlePiece, dx: number, dy: number, safeMargin?: number) => { constrainedDx: number, constrainedDy: number, hitBoundary: boolean }
  updateCanvasSize: (width: number, height: number) => void
}

export type GameAction =
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
  | { type: "SET_IS_SHAKING"; payload: boolean }
  | { type: "NO_CHANGE" } 