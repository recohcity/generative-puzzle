type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

type PuzzlePiece = {
  points: Point[]
  originalPoints: Point[]
  rotation: number
  originalRotation: number
  x: number
  y: number
  originalX: number
  originalY: number
}

export class ScatterPuzzle {
  static scatterPuzzle(pieces: PuzzlePiece[]): PuzzlePiece[] {
    const canvasWidth = 800
    const canvasHeight = 600
    const margin = 50

    // 创建一个网格来放置拼图片段
    const gridSize = Math.ceil(Math.sqrt(pieces.length))
    const cellWidth = (canvasWidth - margin * 2) / gridSize
    const cellHeight = (canvasHeight - margin * 2) / gridSize

    return pieces.map((piece, index) => {
      // 计算网格位置
      const gridX = index % gridSize
      const gridY = Math.floor(index / gridSize)

      // 计算新位置，添加一些随机偏移
      const newX = margin + gridX * cellWidth + Math.random() * (cellWidth / 2)
      const newY = margin + gridY * cellHeight + Math.random() * (cellHeight / 2)

      // 计算位移
      const dx = newX - piece.x
      const dy = newY - piece.y

      // 随机旋转
      const randomRotation = Math.floor(Math.random() * 4) * 90

      // 创建新的点集 - 深拷贝确保不影响原始点
      const newPoints = piece.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
        isOriginal: point.isOriginal,
      }))

      return {
        ...piece,
        points: newPoints,
        rotation: randomRotation,
        x: newX,
        y: newY,
      }
    })
  }
}

