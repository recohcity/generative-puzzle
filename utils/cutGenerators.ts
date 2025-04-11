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
  type: "straight" | "diagonal"
}

// 计算边界
const calculateBounds = (points: Point[]): Bounds => {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

// 线段相交检测
const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
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

// 检查点是否靠近线段
const isPointNearLine = (point: Point, line: CutLine, threshold: number): boolean => {
  const d1 = Math.hypot(line.x1 - point.x, line.y1 - point.y)
  const d2 = Math.hypot(line.x2 - point.x, line.y2 - point.y)
  const lineLength = Math.hypot(line.x2 - line.x1, line.y2 - line.y1)
  const buffer = 0.1 // 小缓冲区以处理舍入误差

  return d1 + d2 >= lineLength - buffer && d1 + d2 <= lineLength + threshold + buffer
}

// 生成切割线
export const generateCuts = (shape: Point[], count: number, type: "straight" | "diagonal"): CutLine[] => {
  const bounds = calculateBounds(shape)
  const cuts: CutLine[] = []
  const maxAttempts = 100

  for (let i = 0; i < count; i++) {
    let cut: CutLine | null = null
    let attempts = 0

    do {
      if (type === "straight") {
        cut = generateStraightCutLine(bounds)
      } else {
        cut = generateDiagonalCutLine(bounds)
      }
      attempts++
    } while (!isValidCut(cut, shape, cuts) && attempts < maxAttempts)

    if (attempts < maxAttempts && cut) {
      cuts.push(cut)
    } else {
      console.log(`Failed to generate valid cut for cut ${i + 1}`)
      break
    }
  }

  return cuts
}

// 生成直线切割线
const generateStraightCutLine = (bounds: Bounds): CutLine => {
  const isVertical = Math.random() < 0.5

  if (isVertical) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX)
    return {
      x1: x,
      y1: bounds.minY,
      x2: x,
      y2: bounds.maxY,
      type: "straight",
    }
  } else {
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
    return {
      x1: bounds.minX,
      y1: y,
      x2: bounds.maxX,
      y2: y,
      type: "straight",
    }
  }
}

// 生成斜线切割线
const generateDiagonalCutLine = (bounds: Bounds): CutLine => {
  const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.5
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  // 随机选择起点和终点
  const startAngle = Math.random() * 2 * Math.PI
  const endAngle = startAngle + Math.PI + (Math.random() - 0.5) * Math.PI

  const x1 = centerX + Math.cos(startAngle) * extension
  const y1 = centerY + Math.sin(startAngle) * extension
  const x2 = centerX + Math.cos(endAngle) * extension
  const y2 = centerY + Math.sin(endAngle) * extension

  return { x1, y1, x2, y2, type: "diagonal" }
}

// 检查切割线是否有效
const isValidCut = (cut: CutLine, shape: Point[], existingCuts: CutLine[]): boolean => {
  // 检查是否与形状相交
  const intersections = doesCutIntersectShape(cut, shape)
  if (intersections < 2) return false

  // 检查是否与现有切割线太接近
  for (const existingCut of existingCuts) {
    if (cutsAreTooClose(cut, existingCut)) {
      return false
    }
  }

  // 确保切割线穿过形状中心区域
  const bounds = calculateBounds(shape)
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }

  if (!isPointNearLine(center, cut, 50)) {
    return false
  }

  return true
}

// 检查切割线是否太靠近
const cutsAreTooClose = (cut1: CutLine, cut2: CutLine): boolean => {
  const minDistance = 20
  const points = [
    { x: cut1.x1, y: cut1.y1 },
    { x: cut1.x2, y: cut1.y2 },
    { x: cut2.x1, y: cut2.y1 },
    { x: cut2.x2, y: cut2.y2 },
  ]

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < minDistance) {
        return true
      }
    }
  }

  return false
}

// 检查切割线与形状的交点数
const doesCutIntersectShape = (cut: CutLine, shape: Point[]): number => {
  let intersections = 0

  for (let i = 0; i < shape.length; i++) {
    const j = (i + 1) % shape.length

    if (lineIntersection({ x: cut.x1, y: cut.y1 }, { x: cut.x2, y: cut.y2 }, shape[i], shape[j])) {
      intersections++
    }
  }

  return intersections
}

