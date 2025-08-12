// Re-export ShapeType and CutType from ./types
// export { ShapeType, CutType } from "./types"

// Define types
export interface Point {
  x: number
  y: number
  isOriginal?: boolean
  [key: string]: unknown; // 添加索引签名以兼容Scalable接口
}

export interface PuzzlePiece {
  id: number;
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
  isCompleted: boolean;
  color?: string;
  [key: string]: unknown; // 添加索引签名以兼容Scalable接口
}

export interface DraggingPiece {
  index: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
}

// 画布尺寸类型
export interface CanvasSize {
  width: number;
  height: number;
}

// 添加一个接口描述边界信息
export interface PieceBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface GameState {
  originalShape: Point[] // 当前显示的形状（可能已适配）
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
  canvasSize: CanvasSize | null
  // 🔑 关键修复：保存形状生成时的基准画布尺寸，用于正确的适配计算
  baseCanvasSize: CanvasSize | null;
}

// 更新GameContextProps接口
export type GameContextProps = any; // 请根据实际定义替换 any

export type GameAction = any; // 请根据实际定义替换 any

// 直接在本文件内定义并导出 ShapeType 和 CutType
export enum ShapeType {
  Polygon = "polygon",
  Cloud = "cloud",
  Jagged = "jagged",
}

export enum CutType {
  Straight = "straight",
  Diagonal = "diagonal",
} 