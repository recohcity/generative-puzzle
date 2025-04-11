type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

type CutLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  type: string
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

// 拆分多边形
export const splitPolygon = (shape: Point[], cuts: CutLine[]): Point[][] => {
  let pieces = [shape]

  cuts.forEach((cut) => {
    const newPieces: Point[][] = []

    pieces.forEach((piece) => {
      const splitResult = splitPieceWithLine(piece, cut)
      newPieces.push(...splitResult)
    })

    pieces = newPieces
  })

  return pieces.filter((piece) => piece.length >= 3)
}

// 使用直线拆分片段
export const splitPieceWithLine = (piece: Point[], cut: CutLine): Point[][] => {
  const intersections: { point: Point; index: number }[] = []

  for (let i = 0; i < piece.length; i++) {
    const j = (i + 1) % piece.length
    const intersection = lineIntersection({ x: cut.x1, y: cut.y1 }, { x: cut.x2, y: cut.y2 }, piece[i], piece[j])

    if (intersection) {
      intersections.push({
        point: { ...intersection, isOriginal: false },
        index: i,
      })
    }
  }

  // 如果没有恰好两个交点，返回原始片段
  if (intersections.length !== 2) {
    return [piece]
  }

  // 按索引排序交点
  intersections.sort((a, b) => a.index - b.index)
  const [int1, int2] = intersections

  // 创建两个新片段
  const piece1: Point[] = [...piece.slice(0, int1.index + 1), int1.point, int2.point, ...piece.slice(int2.index + 1)]

  const piece2: Point[] = [int1.point, ...piece.slice(int1.index + 1, int2.index + 1), int2.point]

  return [piece1, piece2]
}

// 检查拼图片段是否有效
export const isValidPiece = (piece: Point[]): boolean => {
  return piece.length >= 3
}

