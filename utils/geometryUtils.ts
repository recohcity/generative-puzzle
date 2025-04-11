type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

type CutLine = {
  x1: number
  y1: number
  x2: number
  y2: number
}

// 计算多边形面积
export const calculatePolygonArea = (vertices: Point[]): number => {
  let area = 0

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length
    area += vertices[i].x * vertices[j].y
    area -= vertices[j].x * vertices[i].y
  }

  return Math.abs(area / 2)
}

// 计算边界
export const calculateBounds = (points: Point[]): Bounds => {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

// 创建安全区域
export const createSafeZone = (shape: Point[]): Bounds => {
  const bounds = calculateBounds(shape)
  const buffer = 50

  return {
    minX: bounds.minX - buffer,
    minY: bounds.minY - buffer,
    maxX: bounds.maxX + buffer,
    maxY: bounds.maxY + buffer,
  }
}

// 线段相交检测
export const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const x1 = p1.x,
    y1 = p1.y,
    x2 = p2.x,
    y2 = p2.y
  const x3 = p3.x,
    y3 = p3.y,
    x4 = p4.x,
    y4 = p4.y

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) return null // 平行线

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null // 交点不在线段上

  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1),
  }
}

// 点到线的距离
export const distanceToLine = (point: Point, line: CutLine): number => {
  const A = point.x - line.x1
  const B = point.y - line.y1
  const C = line.x2 - line.x1
  const D = line.y2 - line.y1

  const dot = A * C + B * D
  const len_sq = C * C + D * D
  let param = -1

  if (len_sq !== 0) {
    param = dot / len_sq
  }

  let xx, yy

  if (param < 0) {
    xx = line.x1
    yy = line.y1
  } else if (param > 1) {
    xx = line.x2
    yy = line.y2
  } else {
    xx = line.x1 + param * C
    yy = line.y1 + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy

  return Math.sqrt(dx * dx + dy * dy)
}

// 检查点是否在多边形内
export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y
    const xj = polygon[j].x,
      yj = polygon[j].y

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

// 检查点是否靠近线段
export const isPointNearLine = (point: Point, line: CutLine, threshold: number): boolean => {
  const d1 = Math.hypot(line.x1 - point.x, line.y1 - point.y)
  const d2 = Math.hypot(line.x2 - point.x, line.y2 - point.y)
  const lineLength = Math.hypot(line.x2 - line.x1, line.y2 - line.y1)
  const buffer = 0.1 // 小缓冲区以处理舍入误差

  return d1 + d2 >= lineLength - buffer && d1 + d2 <= lineLength + threshold + buffer
}

