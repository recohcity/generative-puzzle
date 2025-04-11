"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/GameContext"
import { useTheme } from "@/contexts/ThemeContext"

// 定义类型
interface Point {
  x: number
  y: number
  isOriginal?: boolean
}

interface PuzzlePiece {
  points: Point[]
  rotation: number
  path?: Path2D
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

// 绘制五角星
const drawStar = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
) => {
  let rot = (Math.PI / 2) * 3
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

// 改进完成效果
const drawCompletionEffect = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  ctx.save()

  // 绘制柔和的发光效果，但不绘制实际轮廓线
  ctx.shadowColor = "rgba(0, 255, 128, 0.9)"
  ctx.shadowBlur = 35
  ctx.strokeStyle = "rgba(0, 255, 128, 0.1)" // 几乎透明的描边，只为了创建发光效果
  ctx.lineWidth = 10

  // 绘制原始形状的不可见轮廓(只为了创建发光效果)
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
  ctx.stroke() // 仍然需要stroke来创建阴影效果，但线条几乎透明

  // 重置阴影效果
  ctx.shadowBlur = 0

  // 计算形状中心
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

  // 绘制完成文本 - 将文字移到屏幕上方居中
  ctx.font = "bold 36px Arial, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // 文本 - 更亮的金色，添加描边和发光效果，去掉黑色背景
  const canvasCenterX = ctx.canvas.width / 2
  const textY = 50 // 距离顶部50像素

  // 添加文字发光效果
  ctx.fillStyle = "#FFD700"
  ctx.shadowColor = "rgba(255, 215, 0, 0.8)"
  ctx.shadowBlur = 15
  ctx.fillText("恭喜完成!", canvasCenterX, textY)
  
  // 添加文字描边，使其在任何背景上都更加清晰
  ctx.lineWidth = 2
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)"
  ctx.shadowBlur = 0 // 关闭描边的阴影
  ctx.strokeText("恭喜完成!", canvasCenterX, textY)

  // 添加更多星星效果
  drawStars(ctx, bounds)

  ctx.restore()
}

export default function PuzzleCanvas() {
  const { state, dispatch, canvasRef, backgroundCanvasRef } = useGame()
  const { isDarkMode } = useTheme()
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 响应式设置画布大小
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth, 1000)
        const height = Math.min(600, width * 0.6)
        setCanvasSize({ width, height })
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

    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height)
    drawShape(ctx, state.originalShape, state.shapeType, isDarkMode)
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
      ctx.fillStyle = isDarkMode ? "rgba(56, 189, 248, 0.9)" : "rgba(135, 206, 250, 0.95)"
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

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 检查点击的是哪个拼图片段
    let clickedPieceIndex = -1

    // 先尝试使用Path2D的isPointInPath方法
    for (let i = state.puzzle.length - 1; i >= 0; i--) {
      // 跳过已完成的拼图，不允许拖拽
      if (state.completedPieces.includes(i)) continue

      if (state.puzzle[i].path && ctx.isPointInPath(state.puzzle[i].path, x, y)) {
        clickedPieceIndex = i
        break
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
      dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex })
      dispatch({
        type: "SET_DRAGGING_PIECE",
        payload: { index: clickedPieceIndex, startX: x, startY: y },
      })
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

    // 更新拼图位置
    dispatch({
      type: "UPDATE_PIECE_POSITION",
      payload: { index: state.draggingPiece.index, dx, dy },
    })

    // 更新拖动起点
    dispatch({
      type: "SET_DRAGGING_PIECE",
      payload: { ...state.draggingPiece, startX: x, startY: y },
    })
  }

  // 鼠标释放事件
  const handleMouseUp = () => {
    if (state.draggingPiece && state.puzzle && state.originalPositions.length > 0) {
      const pieceIndex = state.draggingPiece.index
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

      // 如果靠近原始位置，重置到原始位置
      if (isNearOriginal) {
        dispatch({
          type: "RESET_PIECE_TO_ORIGINAL",
          payload: pieceIndex,
        })

        // 添加到已完成列表
        if (!state.completedPieces.includes(pieceIndex)) {
          dispatch({
            type: "ADD_COMPLETED_PIECE",
            payload: pieceIndex,
          })

          // 播放吸附音效
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.type = "sine"
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.2)
          } catch (e) {
            console.log("Audio not supported")
          }
        }

        // 检查是否所有拼图都已完成
        if (state.completedPieces.length + 1 >= state.puzzle.length) {
          // 延迟一帧，确保所有拼图都已经渲染到正确位置
          setTimeout(() => {
            dispatch({ type: "SET_IS_COMPLETED", payload: true })

            // 播放完成音效
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

              // 播放上升的音阶
              const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

              notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.type = "sine"
                oscillator.frequency.value = freq

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.start(audioContext.currentTime + i * 0.1)
                oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3)
              })
            } catch (e) {
              console.log("Audio not supported")
            }
          }, 50)
        }
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
      className="relative w-full border border-gray-300 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-md"
    >
      <canvas
        ref={backgroundCanvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute top-0 left-0"
      />
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative cursor-pointer"
      />
    </div>
  )
}

