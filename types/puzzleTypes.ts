import type { ReactNode } from "react"
// Re-export ShapeType and CutType from ./types
// export { ShapeType, CutType } from "./types"

// Define types
export interface Point {
  x: number
  y: number
  isOriginal?: boolean
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
}

export type DraggingPiece = any; // 请根据实际定义替换 any

// 添加一个接口描述边界信息
export type PieceBounds = any; // 请根据实际定义替换 any

export interface GameState {
  originalShape: Point[] // 当前显示的形状（可能已适配）
  baseShape?: Point[] // 基础形状（未经适配的原始形状）
  baseCanvasSize?: { width: number; height: number } // 基础形状对应的画布尺寸
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
}

// 更新GameContextProps接口
export type GameContextProps = any; // 请根据实际定义替换 any

export type GameAction = any; // 请根据实际定义替换 any

// 直接在本文件内定义并导出 ShapeType 和 CutType
export enum ShapeType {
  Polygon = "polygon",
  Curve = "curve",
  Circle = "irregular",
}

export enum CutType {
  Straight = "straight",
  Diagonal = "diagonal",
} 