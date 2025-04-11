import { MIN_SHAPE_DIAMETER, MAX_SHAPE_DIAMETER, MIN_SHAPE_AREA } from "./constants"
import { calculatePolygonArea } from "./geometryUtils"

type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

// 生成多边形
export const generatePolygon = (canvasWidth: number, canvasHeight: number): Point[] => {
  const numPoints = 5 + Math.floor(Math.random() * 5)
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const maxRadius = Math.min(MAX_SHAPE_DIAMETER / 4, Math.min(canvasWidth, canvasHeight) / 5)
  const minRadius = MIN_SHAPE_DIAMETER / 4

  let points: Point[]
  let area: number

  do {
    points = []
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI
      const r = minRadius + Math.random() * (maxRadius - minRadius)
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)
      points.push({ x, y, isOriginal: true })
    }
    area = calculatePolygonArea(points)
  } while (area < MIN_SHAPE_AREA / 16)

  return points
}

// 生成曲线形状
export const generateCurveShape = (canvasWidth: number, canvasHeight: number): Point[] => {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const maxRadius = Math.min(MAX_SHAPE_DIAMETER / 4, Math.min(canvasWidth, canvasHeight) / 5)
  const minRadius = MIN_SHAPE_DIAMETER / 4

  const numPoints = 100 // 使用更多的点来创建平滑的曲线
  const points: Point[] = []

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    const r = minRadius + Math.random() * (maxRadius - minRadius)
    const x = centerX + r * Math.cos(angle)
    const y = centerY + r * Math.sin(angle)
    points.push({ x, y, isOriginal: true })
  }

  return points
}

// 生成不规则圆形
export const generateIrregularCircle = (canvasWidth: number, canvasHeight: number): Point[] => {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const maxRadius = Math.min(MAX_SHAPE_DIAMETER / 4, Math.min(canvasWidth, canvasHeight) / 5)
  const minRadius = MIN_SHAPE_DIAMETER / 4

  // 生成椭圆的主轴和次轴
  const a = minRadius + Math.random() * (maxRadius - minRadius)
  const b = minRadius + Math.random() * (maxRadius - minRadius)

  const numPoints = 200
  const points: Point[] = []

  // 生成随机的扰动函数
  const frequency = 2 + Math.random() * 6
  const amplitude = 0.05 + Math.random() * 0.15
  const noise = (angle: number) =>
    1 + Math.sin(angle * frequency) * amplitude + Math.cos(angle * frequency * 1.5) * amplitude * 0.5

  // 生成不规则椭圆的点
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    const r = noise(angle)
    const x = centerX + a * Math.cos(angle) * r
    const y = centerY + b * Math.sin(angle) * r
    points.push({ x, y, isOriginal: true })
  }

  return points
}

