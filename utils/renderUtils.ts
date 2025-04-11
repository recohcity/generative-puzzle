type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

type PuzzlePiece = {
  points: Point[]
  rotation: number
  path?: Path2D
}

// 绘制形状
export const drawShape = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string, isDarkMode = false) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.fillStyle = isDarkMode ? "rgba(45, 55, 72, 0.3)" : "rgba(200, 200, 200, 0.3)"
  ctx.strokeStyle = isDarkMode ? "#cbd5e1" : "#333333"

  ctx.beginPath()

  if (shape.length > 0) {
    ctx.moveTo(shape[0].x, shape[0].y)

    if (shapeType === "polygon") {
      // 多边形使用直线
      for (let i = 1; i < shape.length; i++) {
        ctx.lineTo(shape[i].x, shape[i].y)
      }
    } else {
      // 曲线形状使用贝塞尔曲线
      for (let i = 1; i < shape.length; i++) {
        const prev = shape[i - 1]
        const current = shape[i]
        const next = shape[(i + 1) % shape.length]

        // 使用二次贝塞尔曲线平滑连接点
        const midX = (prev.x + current.x) / 2
        const midY = (prev.y + current.y) / 2
        const nextMidX = (current.x + next.x) / 2
        const nextMidY = (current.y + next.y) / 2

        ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY)
      }
    }
  }

  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

// 绘制拼图
export const drawPuzzle = (
  ctx: CanvasRenderingContext2D,
  pieces: PuzzlePiece[],
  completedPieces: number[],
  selectedPiece: number | null,
  shapeType: string,
  isDarkMode = false,
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 为每个拼图片段创建路径
  pieces.forEach((piece, index) => {
    drawPiece(ctx, piece, index, completedPieces.includes(index), selectedPiece === index, shapeType, isDarkMode)
  })
}

// 绘制单个拼图片段
const drawPiece = (
  ctx: CanvasRenderingContext2D,
  piece: PuzzlePiece,
  index: number,
  isCompleted: boolean,
  isSelected: boolean,
  shapeType: string,
  isDarkMode: boolean,
) => {
  // 计算中心点用于旋转
  const center = piece.points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / piece.points.length,
      y: acc.y + point.y / piece.points.length,
    }),
    { x: 0, y: 0 },
  )

  // 创建路径
  const path = new Path2D()

  ctx.save()

  // 应用旋转变换
  ctx.translate(center.x, center.y)
  ctx.rotate((piece.rotation * Math.PI) / 180)
  ctx.translate(-center.x, -center.y)

  // 绘制路径
  path.moveTo(piece.points[0].x, piece.points[0].y)

  for (let i = 1; i < piece.points.length; i++) {
    const prev = piece.points[i - 1]
    const current = piece.points[i]
    const next = piece.points[(i + 1) % piece.points.length]

    if (shapeType !== "polygon" && prev.isOriginal && current.isOriginal) {
      // 对于曲线形状，使用二次贝塞尔曲线
      const midX = (prev.x + current.x) / 2
      const midY = (prev.y + current.y) / 2
      const nextMidX = (current.x + next.x) / 2
      const nextMidY = (current.y + next.y) / 2

      path.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY)
    } else {
      // 对于多边形和切割线，使用直线
      path.lineTo(current.x, current.y)
    }
  }

  path.closePath()

  // 填充颜色
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98FB98",
    "#FFD166",
    "#06D6A0",
    "#118AB2",
    "#073B4C",
    "#F78C6B",
  ]

  if (isDarkMode) {
    // 深色模式下使用更暗的色调
    ctx.fillStyle = isCompleted ? "rgba(56, 189, 248, 0.7)" : colors[index % colors.length] + "99"
  } else {
    ctx.fillStyle = isCompleted ? "skyblue" : colors[index % colors.length]
  }

  ctx.fill(path)

  // 绘制边框
  if (!isCompleted) {
    ctx.strokeStyle = isDarkMode ? "#e2e8f0" : "black"

    if (isSelected) {
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 2
    } else {
      ctx.setLineDash([])
      ctx.lineWidth = 1
    }

    ctx.stroke(path)
    ctx.setLineDash([])
    ctx.lineWidth = 1
  }

  ctx.restore()

  // 存储路径供后续点击检测
  piece.path = path
}

// 绘制提示轮廓
export const drawHintOutline = (ctx: CanvasRenderingContext2D, piece: PuzzlePiece) => {
  if (!piece) return

  ctx.save()
  ctx.strokeStyle = "green"
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(piece.points[0].x, piece.points[0].y)

  for (let i = 1; i < piece.points.length; i++) {
    ctx.lineTo(piece.points[i].x, piece.points[i].y)
  }

  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

// 绘制完成效果
export const drawCompletionEffect = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  ctx.save()

  ctx.beginPath()
  ctx.moveTo(shape[0].x, shape[0].y)

  if (shapeType === "polygon") {
    for (let i = 1; i < shape.length; i++) {
      ctx.lineTo(shape[i].x, shape[i].y)
    }
  } else {
    for (let i = 1; i < shape.length; i++) {
      const prev = shape[i - 1]
      const current = shape[i]
      const next = shape[(i + 1) % shape.length]

      const midX = (prev.x + current.x) / 2
      const midY = (prev.y + current.y) / 2
      const nextMidX = (current.x + next.x) / 2
      const nextMidY = (current.y + next.y) / 2

      ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY)
    }
  }

  ctx.closePath()

  // 创建闪亮效果
  const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height)
  gradient.addColorStop(0, "gold")
  gradient.addColorStop(0.5, "yellow")
  gradient.addColorStop(1, "gold")

  ctx.strokeStyle = gradient
  ctx.lineWidth = 5
  ctx.stroke()

  // 显示完成文本
  const bounds = shape.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )

  ctx.font = "24px Arial"
  ctx.fillStyle = "gold"
  ctx.textAlign = "center"
  ctx.fillText("完成！", bounds.minX + (bounds.maxX - bounds.minX) / 2, bounds.minY - 20)

  ctx.restore()
}

