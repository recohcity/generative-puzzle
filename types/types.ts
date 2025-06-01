export interface Point {
  x: number
  y: number
  isOriginal?: boolean
}

export interface PuzzlePiece {
  points: Point[]
  rotation: number
  path?: Path2D
  color?: string
}

export enum ShapeType {
  Polygon = "polygon",
  Curve = "curve",
  Circle = "irregular",
}

export enum CutType {
  Straight = "straight",
  Diagonal = "diagonal",
}

