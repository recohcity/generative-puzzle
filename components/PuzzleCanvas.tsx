"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/GameContext"
import { useTheme } from "next-themes"
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound } from "@/utils/soundEffects"

// 定义类型
interface Point {
  x: number
  y: number
  isOriginal?: boolean
}

interface PuzzlePiece {
  points: Point[]
  rotation: number
}

// 在组件顶部添加calculateCenter函数
const calculateCenter = (points: Point[]) => {
  return points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  )
}

// 判断点是否在多边形内的辅助函数
function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// 计算点相对于中心点的旋转
function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): {x: number, y: number} {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  // 将点相对于中心点平移
  const nx = x - cx;
  const ny = y - cy;
  
  // 应用旋转
  const rotatedX = nx * cos - ny * sin;
  const rotatedY = nx * sin + ny * cos;
  
  // 平移回原始坐标系
  return {
    x: rotatedX + cx,
    y: rotatedY + cy
  };
}

// 内联renderUtils函数
// 绘制形状
const drawShape = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string, isDarkMode = false) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.fillStyle = isDarkMode ? "rgba(45, 55, 72, 0.3)" : "rgba(200, 200, 200, 0.3)"
  ctx.strokeStyle = isDarkMode ? (isDarkMode ? "#cbd5e1" : "#333333") : "#333333"

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

const drawPuzzle = (
  ctx: CanvasRenderingContext2D,
  pieces: PuzzlePiece[],
  completedPieces: number[],
  selectedPiece: number | null,
  shapeType: string,
  isDarkMode = false,
  originalShape?: Point[]
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 检查是否所有拼图都已完成
  const isAllCompleted = completedPieces.length === pieces.length

  if (isAllCompleted && originalShape && originalShape.length > 0) {
    // 如果所有拼图都完成，使用原始形状绘制一个完整的形状，避免拼图间的缝隙
    ctx.beginPath()
    ctx.moveTo(originalShape[0].x, originalShape[0].y)

    if (shapeType === "polygon") {
      // 多边形使用直线
      originalShape.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
    } else {
      // 曲线形状使用贝塞尔曲线
      for (let i = 1; i < originalShape.length; i++) {
        const prev = originalShape[i - 1]
        const current = originalShape[i]
        const next = originalShape[(i + 1) % originalShape.length]

        const midX = (prev.x + current.x) / 2
        const midY = (prev.y + current.y) / 2
        const nextMidX = (current.x + next.x) / 2
        const nextMidY = (current.y + next.y) / 2

        ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY)
      }
    }

    ctx.closePath()
    ctx.fillStyle = isDarkMode ? "rgba(56, 189, 248, 0.8)" : "rgba(135, 206, 250, 0.9)"
    ctx.fill()
  } else {
    // 如果还没有全部完成，按原来的方式绘制各个拼图片段
    pieces.forEach((piece, index) => {
      drawPiece(ctx, piece, index, completedPieces.includes(index), selectedPiece === index, shapeType, isDarkMode)
    })
  }
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
  const center = calculateCenter(piece.points)

  ctx.save()

  // 应用旋转变换
  ctx.translate(center.x, center.y)
  ctx.rotate((piece.rotation * Math.PI) / 180)
  ctx.translate(-center.x, -center.y)

  // 绘制路径
  ctx.beginPath()
  ctx.moveTo(piece.points[0].x, piece.points[0].y)

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

      ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY)
    } else {
      // 对于多边形和切割线，使用直线
      ctx.lineTo(current.x, current.y)
    }
  }

  ctx.closePath()

  // 填充颜色
  const colors = [
    "#FF9F40", // 橙色
    "#FF6B6B", // 红色
    "#FFD166", // 黄色
    "#F68E5F", // 珊瑚色
    "#FFB17A", // 浅珊瑚色
    "#FFE3C1", // 浅橙色
    "#FFBB7C", // 杏色
    "#FF8A5B", // 胡萝卜色
    "#FF785A", // 番茄色
    "#F26419", // 深橙色
  ]

  if (isDarkMode) {
    // 深色模式下使用更鲜艳的色调
    ctx.fillStyle = isCompleted ? "rgba(242, 100, 25, 0.8)" : colors[index % colors.length] + "CC"
  } else {
    ctx.fillStyle = isCompleted ? "rgba(255, 211, 101, 0.8)" : colors[index % colors.length]
  }

  ctx.fill()

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

    ctx.stroke()
    ctx.setLineDash([])
    ctx.lineWidth = 1
  }

  ctx.restore()
}

// 改进提示轮廓显示
const drawHintOutline = (ctx: CanvasRenderingContext2D, piece: PuzzlePiece) => {
  if (!piece) return

  ctx.save()

  // 创建闪烁效果
  const time = new Date().getTime()
  const alpha = 0.5 + 0.5 * Math.sin(time / 200) // 闪烁效果

  ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`
  ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.3})`
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.moveTo(piece.points[0].x, piece.points[0].y)

  for (let i = 1; i < piece.points.length; i++) {
    ctx.lineTo(piece.points[i].x, piece.points[i].y)
  }

  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // 添加"放在这里"的文本提示
  const bounds = piece.points.reduce(
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

  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.font = "bold 14px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("放在这里", centerX, centerY)

  ctx.restore()
}

// 增强星星效果
const drawStars = (ctx: CanvasRenderingContext2D, bounds: any) => {
  const time = Date.now()
  const numStars = 30 // 增加星星数量

  // 添加一些小星星作为背景
  for (let i = 0; i < numStars * 2; i++) {
    const x = bounds.minX - 50 + Math.random() * (bounds.maxX - bounds.minX + 100)
    const y = bounds.minY - 50 + Math.random() * (bounds.maxY - bounds.minY + 100)
    const size = 1 + Math.random() * 3
    const alpha = 0.2 + 0.8 * Math.sin(time / 300 + i * 0.3)

    ctx.fillStyle = `rgba(255, 255, 180, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // 添加更醒目的五角星
  for (let i = 0; i < numStars; i++) {
    const x = bounds.minX - 30 + Math.random() * (bounds.maxX - bounds.minX + 60)
    const y = bounds.minY - 30 + Math.random() * (bounds.maxY - bounds.minY + 60)
    const size = 4 + Math.random() * 8
    const alpha = 0.4 + 0.6 * Math.sin(time / 200 + i)

    // 随机颜色 - 金色、黄色或白色
    const colors = [
      `rgba(255, 215, 0, ${alpha})`, // 金色
      `rgba(255, 255, 0, ${alpha})`, // 黄色
      `rgba(255, 255, 255, ${alpha})`, // 白色
    ]
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    
    // 添加星星发光效果
    ctx.shadowColor = "rgba(255, 255, 0, 0.8)"
    ctx.shadowBlur = 5
    
    drawStar(ctx, x, y, 5, size, size / 2)
    
    // 重置阴影
    ctx.shadowBlur = 0
  }
}

// 绘制星星函数
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, innerRadius: number, outerRadius: number) {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fill()
}

// 修改完成效果，使用儿童暖色系
const drawCompletionEffect = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  ctx.save()

  // 绘制柔和的发光效果
  ctx.shadowColor = "rgba(255, 159, 64, 0.9)" // 暖橙色发光
  ctx.shadowBlur = 35
  ctx.strokeStyle = "rgba(255, 159, 64, 0.3)" // 半透明的橙色描边
  ctx.lineWidth = 10

  // 绘制原始形状的轮廓
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
  ctx.stroke() // 创建阴影效果

  // 画星星和彩带效果
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

  // 绘制小星星
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const radius = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / 2

  // 绘制彩带效果
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2
    const length = radius * (0.5 + Math.random() * 0.5)
    const startX = centerX
    const startY = centerY
    const endX = centerX + Math.cos(angle) * length
    const endY = centerY + Math.sin(angle) * length
    
    // 彩带宽度
    ctx.lineWidth = 3 + Math.random() * 5
    
    // 彩带颜色 - 儿童暖色系
    const colors = [
      "#FF9F40", // 橙色
      "#FF6B6B", // 红色
      "#FFD166", // 黄色
      "#F68E5F", // 珊瑚色
      "#FFB17A", // 浅珊瑚色
      "#FFE3C1", // 浅橙色
      "#FFBB7C", // 杏色
      "#FF8A5B", // 胡萝卜色
      "#FF785A", // 番茄色
      "#F26419", // 深橙色
    ]
    
    ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.shadowBlur = 0 // 关闭彩带的阴影
    
    // 绘制彩带
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    
    // 添加随机控制点使彩带弯曲
    const ctrlX = (startX + endX) / 2 + (Math.random() - 0.5) * 50
    const ctrlY = (startY + endY) / 2 + (Math.random() - 0.5) * 50
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY)
    ctx.stroke()
  }
  
  // 绘制小星星
  for (let i = 0; i < 20; i++) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX)
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
    const size = 5 + Math.random() * 15
    
    // 星星颜色 - 明亮暖色
    const starColors = ["#FFD700", "#FFA500", "#FF8C00", "#FFE3C1", "#FFFACD"]
    ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)]
    
    // 画星星
    drawStar(ctx, x, y, 5, size / 2, size)
  }

  // 绘制完成文本
  ctx.shadowBlur = 0
  ctx.font = "bold 36px 'Comic Sans MS', cursive, sans-serif" // 使用更活泼的字体
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // 文本 - 使用多彩文字
  const canvasCenterX = ctx.canvas.width / 2
  const textY = bounds.minY - 40; // 40 pixels above the top of the shape
  const finalY = Math.max(50, textY); // Ensure at least 50px margin from the canvas top
  
  // 文字阴影
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 5
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  
  // 文字描边
  ctx.strokeStyle = "#F26419"
  ctx.lineWidth = 6
  ctx.strokeText("你好犀利吖!", canvasCenterX, finalY)
  
  // 文字填充
  ctx.fillStyle = "#FFD166"
  ctx.fillText("你好犀利吖!", canvasCenterX, finalY)

  ctx.restore()
}

export default function PuzzleCanvas() {
  const { state, dispatch, canvasRef, backgroundCanvasRef } = useGame()
  const { theme } = useTheme()
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine isDarkMode based on the theme string
  const isDarkMode = theme === 'dark'

  // 响应式设置画布大小
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // 完全填充容器，不留空隙
        let width = containerWidth;
        let height = containerHeight;
        
        // 确保画布不超过容器大小
        width = Math.min(width, containerWidth);
        height = Math.min(height, containerHeight);
        
        setCanvasSize({ width, height });
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 绘制原始形状
  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current
    if (!bgCanvas || !state.originalShape) return

    const ctx = bgCanvas.getContext("2d")
    if (!ctx) return

    // 重新计算原始形状的位置，确保它在画布中心
    if (state.originalShape.length > 0) {
      // 计算原始形状的边界
      const bounds = state.originalShape.reduce(
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
        }
      );
      
      // 计算原始形状的尺寸
      const shapeWidth = bounds.maxX - bounds.minX;
      const shapeHeight = bounds.maxY - bounds.minY;
      
      // 画布中心
      const canvasCenterX = bgCanvas.width / 2;
      const canvasCenterY = bgCanvas.height / 2;
      
      // 计算需要移动的距离，使形状居中
      const offsetX = canvasCenterX - (bounds.minX + shapeWidth / 2);
      const offsetY = canvasCenterY - (bounds.minY + shapeHeight / 2);
      
      // 清除画布
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      
      // 绘制形状，确保它居中显示
      ctx.save();
      ctx.translate(offsetX, offsetY);
      drawShape(ctx, state.originalShape, state.shapeType, isDarkMode);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      drawShape(ctx, state.originalShape, state.shapeType, isDarkMode);
    }
  }, [state.originalShape, state.shapeType, isDarkMode, canvasSize.width, canvasSize.height])

  // 绘制拼图
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !state.puzzle) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 如果游戏完成，先绘制一个完整的无缝形状
    if (state.isCompleted && state.originalShape) {
      // 绘制完整形状
      ctx.beginPath()
      ctx.moveTo(state.originalShape[0].x, state.originalShape[0].y)

      if (state.shapeType === "polygon") {
        // 多边形使用直线
        state.originalShape.forEach((point) => {
          ctx.lineTo(point.x, point.y)
        })
      } else {
        // 曲线形状使用贝塞尔曲线
        for (let i = 1; i < state.originalShape.length; i++) {
          const prev = state.originalShape[i - 1]
          const current = state.originalShape[i]
          const next = state.originalShape[(i + 1) % state.originalShape.length]

          const midX = (prev.x + current.x) / 2
          const midY = (prev.y + current.y) / 2
          const nextMidX = (current.x + next.x) / 2
          const nextMidY = (current.y + next.y) / 2

          ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY)
        }
      }

      ctx.closePath()
      ctx.fillStyle = isDarkMode ? "rgba(242, 100, 25, 0.8)" : "rgba(255, 211, 101, 0.8)" // 使用暖色系
      ctx.fill()
      
      // 绘制完成效果
      drawCompletionEffect(ctx, state.originalShape, state.shapeType)
    } else {
      // 如果还没完成，绘制各个拼图片段
      drawPuzzle(ctx, state.puzzle, state.completedPieces, state.selectedPiece, state.shapeType, isDarkMode, state.originalShape)
      
      // 绘制提示轮廓（如果需要）
      if (state.showHint && state.selectedPiece !== null && state.originalPositions.length > 0) {
        drawHintOutline(ctx, state.originalPositions[state.selectedPiece])
      }
    }
  }, [
    state.puzzle,
    state.completedPieces,
    state.selectedPiece,
    state.showHint,
    state.isCompleted,
    state.originalShape,
    state.originalPositions,
    state.shapeType,
    isDarkMode,
    canvasSize.width,
    canvasSize.height,
  ])

  // 鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.puzzle) return
    if (!state.isScattered) return; // Prevent interaction if not scattered

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 检查点击的是哪个拼图片段
    let clickedPieceIndex = -1

    // 使用多边形点包含检测
    for (let i = state.puzzle.length - 1; i >= 0; i--) {
      // 跳过已完成的拼图，不允许拖拽
      if (state.completedPieces.includes(i)) continue

      const piece = state.puzzle[i];
      const center = calculateCenter(piece.points);
      
      // 将鼠标点逆向旋转，以匹配未旋转的形状
      const rotationAngle = -piece.rotation; // 逆向旋转
      const rotatedPoint = rotatePoint(x, y, center.x, center.y, rotationAngle);
      
      // 检查旋转后的点是否在形状内
      if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
        clickedPieceIndex = i;
        break;
      }
    }

    // 如果没有找到，使用更宽松的距离检测
    if (clickedPieceIndex === -1) {
      const hitDistance = 20 // 增加点击容差
      for (let i = state.puzzle.length - 1; i >= 0; i--) {
        // 跳过已完成的拼图，不允许拖拽
        if (state.completedPieces.includes(i)) continue

        const piece = state.puzzle[i]
        const center = calculateCenter(piece.points)
        const dx = center.x - x
        const dy = center.y - y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // 如果点击位置在拼图中心附近，也算作点击
        if (distance < hitDistance * 2) {
          clickedPieceIndex = i
          break
        }
      }
    }

    if (clickedPieceIndex !== -1) {
      // 设置选中的拼图块
      dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex });

      // 如果是鼠标左键点击，设置拖动信息
      if (e.button === 0) {
        dispatch({ type: "SET_DRAGGING_PIECE", payload: {
            index: clickedPieceIndex,
            startX: x,
            startY: y,
          } });
      }

      // 播放音效
      playPieceSelectSound();
    } else {
      dispatch({ type: "SET_SELECTED_PIECE", payload: null })
    }
  }

  // 鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.draggingPiece || !state.puzzle) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - state.draggingPiece.startX
    const dy = y - state.draggingPiece.startY

    // 获取当前拖动的拼图
    const piece = state.puzzle[state.draggingPiece.index];
    
    // 计算拼图的边界，考虑旋转角度的影响
    const center = calculateCenter(piece.points);
    
    // 确定拼图的边界框（考虑旋转）
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    piece.points.forEach(point => {
      // 考虑当前旋转角度计算真实坐标
      const rotated = rotatePoint(point.x, point.y, center.x, center.y, piece.rotation);
      minX = Math.min(minX, rotated.x);
      maxX = Math.max(maxX, rotated.x);
      minY = Math.min(minY, rotated.y);
      maxY = Math.max(maxY, rotated.y);
    });
    
    // 设置画布边界的安全边距
    const padding = 5;
    
    // 计算约束后的移动距离，确保拼图不会超出画布边界
    let constrainedDx = dx;
    let constrainedDy = dy;
    
    // 约束左右边界
    if (minX + dx < padding) {
      constrainedDx = padding - minX;
    }
    if (maxX + dx > canvas.width - padding) {
      constrainedDx = canvas.width - padding - maxX;
    }
    
    // 约束上下边界
    if (minY + dy < padding) {
      constrainedDy = padding - minY;
    }
    if (maxY + dy > canvas.height - padding) {
      constrainedDy = canvas.height - padding - maxY;
    }

    // 更新拼图位置
    dispatch({
      type: "UPDATE_PIECE_POSITION",
      payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
    });

    // 更新拖动起点
    dispatch({
      type: "SET_DRAGGING_PIECE",
      payload: { ...state.draggingPiece, startX: x, startY: y },
    });
  }

  // 鼠标释放事件
  const handleMouseUp = () => {
    if (!state.isScattered) return; // Prevent interaction if not scattered
    if (!state.draggingPiece || !state.puzzle || !state.originalPositions) return; // Exit if not dragging or puzzle/positions not ready

    const pieceIndex = state.draggingPiece.index
    // Check puzzle again after the early return confirms it's not null
    const piece = state.puzzle[pieceIndex]
    const originalPiece = state.originalPositions[pieceIndex]

    // 增强磁吸效果 - 降低吸附阈值并检查旋转是否接近正确值
    let isNearOriginal = false
    
    // 确保角度在0-360度范围内并计算差异
    const pieceRotation = (piece.rotation % 360 + 360) % 360;
    const originalRotation = (originalPiece.rotation % 360 + 360) % 360;
    const rotationDiff = Math.min(
      Math.abs(pieceRotation - originalRotation),
      360 - Math.abs(pieceRotation - originalRotation)
    );
    
    const isRotationCorrect = rotationDiff < 10; // 允许10度误差

    if (isRotationCorrect) {
      // 计算中心点
      const pieceCenter = calculateCenter(piece.points)
      const originalCenter = calculateCenter(originalPiece.points)

      // 检查中心点是否接近
      const distanceThreshold = 40 // 增加吸附范围
      const dx = pieceCenter.x - originalCenter.x
      const dy = pieceCenter.y - originalCenter.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      isNearOriginal = distance < distanceThreshold
    }

    if (isNearOriginal) {
      // 如果旋转和位置都接近正确，将其设置为完全正确的位置和旋转
      dispatch({ type: "RESET_PIECE_TO_ORIGINAL", payload: pieceIndex })
      dispatch({ type: "ADD_COMPLETED_PIECE", payload: pieceIndex })
      
      // 播放拼图吸附音效
      playPieceSnapSound()

      // 检查是否所有拼图都已完成
      // Check puzzle again before accessing length
      if (state.puzzle && state.completedPieces.length + 1 >= state.puzzle.length) {
        // 延迟一帧，确保所有拼图都已经渲染到正确位置
        setTimeout(() => {
          dispatch({ type: "SET_IS_COMPLETED", payload: true })

          // 播放完成音效
          playPuzzleCompletedSound()
        }, 50)
      }
    }

    // 清除拖动状态
    dispatch({ type: "SET_DRAGGING_PIECE", payload: null })
  }

  useEffect(() => {
    if (!state.puzzle && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [state.puzzle])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center dark:bg-[#2A2835] rounded-lg shadow-inner overflow-hidden"
    >
      <div className="relative flex items-center justify-center w-full h-full">
        <canvas
          ref={backgroundCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute top-0 left-0 w-full h-full"
        />
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative cursor-pointer w-full h-full"
        />
      </div>
    </div>
  )
}

