type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

export const calculateCenter = (points: Point[]): Point => {
  return points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  )
}

