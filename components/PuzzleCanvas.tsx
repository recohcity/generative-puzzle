"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/GameContext"
import { useTheme } from "next-themes"
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound, playRotateSound } from "@/utils/rendering/soundEffects"

// 定义类型
interface Point {
  x: number
  y: number
  isOriginal?: boolean
}

interface PuzzlePiece {
  points: Point[]
  originalPoints: Point[]
  rotation: number
  originalRotation: number
  x: number
  y: number
  originalX: number
  originalY: number
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

// 计算两点之间角度的函数（用于多点触摸旋转）
function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

// 内联renderUtils函数
// 绘制形状
const drawShape = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string, isDarkMode = false) => {
  console.log(`开始绘制形状: ${shape.length}个点, 类型:${shapeType}, 暗色模式:${isDarkMode}`);
  
  if (shape.length === 0) {
    console.error('形状没有点，无法绘制');
    return;
  }
  
  // 记录画布尺寸
  console.log(`画布尺寸: ${ctx.canvas.width}x${ctx.canvas.height}`);
  
  // 先清除画布
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 使用更鲜明的填充颜色，确保在画布上可见
  ctx.fillStyle = isDarkMode ? "rgba(45, 55, 72, 0.6)" : "rgba(200, 200, 200, 0.5)"
  ctx.strokeStyle = isDarkMode ? "rgba(203, 213, 225, 0.8)" : "rgba(51, 51, 51, 0.7)"
  ctx.lineWidth = 2.5

  try {
    // 绘制路径
    ctx.beginPath()
    
    // 记录第一个点
    console.log(`起始点: (${shape[0].x.toFixed(2)}, ${shape[0].y.toFixed(2)})`);
    
    // 移动到第一个点
    if (shape.length > 0) {
      ctx.moveTo(shape[0].x, shape[0].y)

      if (shapeType === "polygon") {
        // 多边形使用直线
        for (let i = 1; i < shape.length; i++) {
          ctx.lineTo(shape[i].x, shape[i].y)
          console.log(`线段到: (${shape[i].x.toFixed(2)}, ${shape[i].y.toFixed(2)})`);
        }
        
        // 闭合路径
        ctx.lineTo(shape[0].x, shape[0].y);
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
      
      ctx.closePath()
      ctx.fill()
      
      // 添加轻微发光效果
      ctx.shadowColor = isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)"
      ctx.shadowBlur = 15
      ctx.stroke()
      
      // 重置阴影
      ctx.shadowBlur = 0
      
      console.log('形状绘制完成');
    } else {
      console.error('没有点可绘制');
    }
  } catch (error) {
    console.error('绘制过程中发生错误:', error);
  }
}

const drawPuzzle = (
  ctx: CanvasRenderingContext2D,
  pieces: PuzzlePiece[],
  completedPieces: number[],
  selectedPiece: number | null,
  shapeType: string,
  isDarkMode = false,
  originalShape?: Point[],
  isScattered: boolean = false
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
    
    // 使用半透明的亮色填充
    const gradientColor = isDarkMode ? "rgba(242, 100, 25, 0.85)" : "rgba(255, 211, 101, 0.85)"
    
    // 添加径向渐变为完成效果
    const center = calculateCenter(originalShape)
    const radius = Math.max(ctx.canvas.width, ctx.canvas.height) / 3
    const gradient = ctx.createRadialGradient(center.x, center.y, radius * 0.3, center.x, center.y, radius)
    gradient.addColorStop(0, gradientColor)
    gradient.addColorStop(1, isDarkMode ? "rgba(242, 100, 25, 0.6)" : "rgba(255, 211, 101, 0.6)")
    
    ctx.fillStyle = gradient
    
    // 添加发光效果
    ctx.shadowColor = isDarkMode ? "rgba(255, 159, 64, 0.7)" : "rgba(255, 211, 101, 0.7)"
    ctx.shadowBlur = 20
    ctx.fill()
    
    // 重置阴影
    ctx.shadowBlur = 0
    
    // 绘制完成效果
    drawCompletionEffect(ctx, originalShape, shapeType)
  } else {
    // 如果在散开状态且有原始形状，先绘制原始形状的轮廓作为目标指南
    if (isScattered && originalShape && originalShape.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originalShape[0].x, originalShape[0].y);
      
      if (shapeType === "polygon") {
        // 多边形使用直线
        originalShape.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
      } else {
        // 曲线形状使用贝塞尔曲线
        for (let i = 1; i < originalShape.length; i++) {
          const prev = originalShape[i - 1];
          const current = originalShape[i];
          const next = originalShape[(i + 1) % originalShape.length];
          
          const midX = (prev.x + current.x) / 2;
          const midY = (prev.y + current.y) / 2;
          const nextMidX = (current.x + next.x) / 2;
          const nextMidY = (current.y + next.y) / 2;
          
          ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
        }
      }
      
      ctx.closePath();
      
      // 完全匹配生成形状时的样式
      ctx.fillStyle = isDarkMode ? "rgba(45, 55, 72, 0.6)" : "rgba(200, 200, 200, 0.5)";
      ctx.strokeStyle = isDarkMode ? "rgba(203, 213, 225, 0.8)" : "rgba(51, 51, 51, 0.7)";
      ctx.lineWidth = 2.5;
      
      // 先填充
      ctx.fill();
      
      // 添加轻微发光效果
      ctx.shadowColor = isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.6)";
      ctx.shadowBlur = 15;
      ctx.stroke();
      
      // 重置阴影
      ctx.shadowBlur = 0;
      
      ctx.restore();
    }

    // 修改渲染顺序：将已完成和未完成的拼图分开绘制
    // 1. 先绘制已完成的拼图（放在底层）
    completedPieces.forEach(index => {
      const piece = pieces[index];
      drawPiece(ctx, piece, index, true, false, shapeType, isDarkMode, isScattered);
    });
    
    // 2. 再绘制未完成的拼图（放在顶层）
    pieces.forEach((piece, index) => {
      // 只绘制未完成的拼图
      if (!completedPieces.includes(index)) {
        drawPiece(ctx, piece, index, false, selectedPiece === index, shapeType, isDarkMode, isScattered);
      }
    });
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
  isScattered: boolean = false
) => {
  // 计算中心点用于旋转
  const center = calculateCenter(piece.points)

  ctx.save()

  // 应用旋转变换
  ctx.translate(center.x, center.y)
  ctx.rotate((piece.rotation * Math.PI) / 180)
  ctx.translate(-center.x, -center.y)

  // 仅当拼图已散开且未完成时绘制阴影，已完成的拼图永远不显示阴影
  if (isScattered && !isCompleted) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(piece.points[0].x, piece.points[0].y);

    for (let i = 1; i < piece.points.length; i++) {
      const prev = piece.points[i - 1];
      const current = piece.points[i];
      const next = piece.points[(i + 1) % piece.points.length];

      if (shapeType !== "polygon" && prev.isOriginal && current.isOriginal) {
        // 对于曲线形状，使用二次贝塞尔曲线
        const midX = (prev.x + current.x) / 2;
        const midY = (prev.y + current.y) / 2;
        const nextMidX = (current.x + next.x) / 2;
        const nextMidY = (current.y + next.y) / 2;

        ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
      } else {
        // 对于多边形和切割线，使用直线
        ctx.lineTo(current.x, current.y);
      }
    }

    ctx.closePath();
    
    // 为被选中拼图绘制更明显的阴影
    if (isSelected) {
      ctx.shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    } 
    // 为未完成拼图绘制较小的阴影
    else {
      ctx.shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }
    
    // 填充形状以显示阴影
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
    ];

    if (isDarkMode) {
      ctx.fillStyle = colors[index % colors.length] + "CC";
    } else {
      ctx.fillStyle = colors[index % colors.length];
    }

    ctx.fill();
    ctx.restore();
  }

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

  // 绘制边框 - 只为未完成的拼图绘制边框，完成的拼图不绘制边框
  if (!isCompleted) {
    ctx.strokeStyle = isDarkMode ? "#e2e8f0" : "white" // 修改为白色轮廓线
    
    if (isSelected) {
      ctx.setLineDash([5, 5]) // 选中时使用虚线
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
    (acc: {minX: number, maxX: number, minY: number, maxY: number}, point: Point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )

  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  ctx.fillStyle = "rgb(255, 255, 255)"
  ctx.font = "lighter 14px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("拖到这里", centerX, centerY)

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

// 修改完成效果，更简洁不遮挡拼图
const drawCompletionEffect = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  ctx.save()

  // 计算形状的边界框
  const bounds = shape.reduce(
    (acc: {minX: number, maxX: number, minY: number, maxY: number}, point: Point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )

  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  
  // 绘制水平压扁的椭圆阴影，制造悬浮效果
  ctx.save()
  
  // 计算阴影尺寸 - 宽度稍大于形状本身
  const shapeWidth = bounds.maxX - bounds.minX
  const shapeHeight = bounds.maxY - bounds.minY
  const shadowWidthRadius = shapeWidth * 0.65  // 控制阴影的宽度半径
  const shadowHeightRadius = shapeWidth * 0.2  // 高度比宽度小很多，创造扁平效果
  
  // 阴影的位置 - 在形状下方，增加与拼图的距离
  const shadowX = centerX
  const shadowY = bounds.maxY + shadowHeightRadius * 1.2  // 显著增加阴影距离，确保不遮挡拼图
  
  // 创建渐变 - 从中心向外渐变消失
  const gradient = ctx.createRadialGradient(
    shadowX, shadowY, 0,
    shadowX, shadowY, shadowWidthRadius
  )
  
  // 精细调整渐变过渡，中心稍黑但保持良好羽化
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.32)')   // 稍微加深中心点透明度
  gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.18)') // 内部区域
  gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.07)') // 外围区域
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')      // 边缘完全透明
  
  // 保存当前状态以便应用变换
  ctx.save()
  
  // 设置变换矩阵使圆形在垂直方向压扁（扁平比例约0.3）
  ctx.translate(shadowX, shadowY)
  ctx.scale(1, 0.3)  // Y轴缩放为原来的0.3倍，创造扁平椭圆
  ctx.translate(-shadowX, -shadowY)
  
  // 应用渐变填充
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(shadowX, shadowY, shadowWidthRadius, 0, Math.PI * 2)
  ctx.fill()
  
  // 恢复变换状态
  ctx.restore()
  ctx.restore()
  
  // 绘制边缘光晕效果（不遮挡形状）
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
  
  // 绘制金色光晕边框，减小宽度
  ctx.strokeStyle = "rgba(255, 215, 0, 0.7)"  // 金色光晕
  ctx.lineWidth = 5  // 减小边框宽度
  ctx.shadowColor = "rgba(255, 215, 0, 0.8)" 
  ctx.shadowBlur = 15  // 稍微减小光晕模糊半径
  ctx.stroke()
  
  // 重置阴影效果
  ctx.shadowBlur = 0
  
  // 绘制完成文本 - 使用更精确的字体堆栈
  const fontSize = Math.min(36, Math.max(24, ctx.canvas.width / 15)); // 根据画布宽度自适应字体大小
  ctx.font = `bold ${fontSize}px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'STHeiti', 'SimHei', 'WenQuanYi Micro Hei', sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  
  // 文本位置 - 移到形状上方，避免遮挡
  const textY = bounds.minY - 40
  const finalY = Math.max(50, textY)
  const completeText = "你好犀利吖!"
  
  // 多层渲染技术，确保在所有设备上的一致性
  // 1. 外发光效果 - 较大模糊
  ctx.shadowColor = "rgba(255, 140, 0, 0.7)" // 橙色发光
  ctx.shadowBlur = 12
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = "rgba(255, 215, 0, 0.4)" // 半透明金色
  ctx.fillText(completeText, centerX, finalY)
  
  // 2. 描边阴影 - 增加深度
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
  ctx.shadowBlur = 3
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.strokeStyle = "#FF7700" // 亮橙色
  ctx.lineWidth = Math.max(3, fontSize / 12) // 根据字体大小比例设置描边宽度
  ctx.strokeText(completeText, centerX, finalY)
  
  // 3. 清除阴影，绘制主体文字
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  // 4. 渐变填充效果
  const textGradient = ctx.createLinearGradient(
    centerX, finalY - fontSize/2,
    centerX, finalY + fontSize/2
  );
  textGradient.addColorStop(0, "#FFD700"); // 金色顶部
  textGradient.addColorStop(0.5, "#FFCC00"); // 中间色
  textGradient.addColorStop(1, "#FF9500"); // 橙色底部
  ctx.fillStyle = textGradient;
  ctx.fillText(completeText, centerX, finalY);

  ctx.restore()
}

export default function PuzzleCanvas() {
  const { 
    state, 
    dispatch, 
    canvasRef, 
    backgroundCanvasRef, 
    ensurePieceInBounds, 
    updateCanvasSize,
    rotatePiece 
  } = useGame()
  const { resolvedTheme: theme } = useTheme()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [touchStartAngle, setTouchStartAngle] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const resizeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const lastTouchRef = useRef<{x: number, y: number} | null>(null)
  const isDarkMode = theme === 'dark'
  
  // 更新设置初始画布大小的函数
  const setInitialCanvasSize = () => {
    if (!canvasRef.current) {
      console.error("画布引用不可用");
      return;
    }

    // 获取容器尺寸
    const container = canvasRef.current.parentElement;
    if (!container) {
      console.error("画布容器不可用");
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    console.log("容器尺寸:", containerWidth, "x", containerHeight);

    // 确定最佳画布尺寸 - 根据容器和设备方向调整
    let canvasWidth, canvasHeight;

    // 检测设备和方向
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIPhone || isAndroid;
    const isPortrait = window.innerHeight > window.innerWidth;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    console.log(`设备信息: iPhone=${isIPhone}, iPad=${isIPad}, Android=${isAndroid}, 竖屏=${isPortrait}, 屏幕=${screenWidth}x${screenHeight}`);

    if (isMobile && isPortrait) {
      // 移动设备竖屏模式 - 使用严格的正方形画布，保持较小尺寸以确保拼图完全可见
      // 获取容器的较小边作为画布的宽高，确保是正方形
      const minDimension = Math.min(containerWidth, containerHeight);
      // 进一步限制最大尺寸，确保不会过大导致拼图超出屏幕
      const maxSize = Math.min(minDimension, 
                             isIPhone ? 320 : 360, // iPhone设备上使用更保守的尺寸
                             Math.min(screenWidth, screenHeight) * 0.9); // 确保不超过屏幕较小边的90%
                             
      canvasWidth = maxSize;
      canvasHeight = maxSize;
      console.log("移动设备竖屏模式，强制使用严格限制的1:1正方形画布:", canvasWidth, "x", canvasHeight);
    } else if (isIPad || (screenWidth < 1024 && screenHeight < 1024)) {
      // iPad或平板设备
      const aspectRatio = containerWidth / containerHeight;
      
      // 保持宽高比但避免过度拉伸
      if (aspectRatio > 1.5) {
        // 横向过宽，限制宽度
        canvasHeight = Math.min(containerHeight, 600);
        canvasWidth = Math.min(canvasHeight * 1.5, containerWidth);
      } else if (aspectRatio < 0.7) {
        // 竖向过高，限制高度
        canvasWidth = Math.min(containerWidth, 600);
        canvasHeight = Math.min(canvasWidth * 1.5, containerHeight);
      } else {
        // 近似正方形，维持比例
        canvasWidth = containerWidth;
        canvasHeight = containerHeight;
      }
      console.log("平板设备，使用调整比例画布:", canvasWidth, "x", canvasHeight);
    } else {
      // 桌面设备或横屏模式
      canvasWidth = containerWidth;
      canvasHeight = containerHeight;
      console.log("桌面设备，使用全尺寸画布:", canvasWidth, "x", canvasHeight);
    }

    // 确保使用整数值避免渲染问题
    canvasWidth = Math.floor(canvasWidth);
    canvasHeight = Math.floor(canvasHeight);
    
    // 安全检查，确保尺寸不为0或负数
    if (canvasWidth <= 0) canvasWidth = 320;
    if (canvasHeight <= 0) canvasHeight = 320;

    // 设置画布尺寸
    canvasRef.current.width = canvasWidth;
    canvasRef.current.height = canvasHeight;
    
    // 同时设置背景画布尺寸（如果存在）
    if (backgroundCanvasRef.current) {
      backgroundCanvasRef.current.width = canvasWidth;
      backgroundCanvasRef.current.height = canvasHeight;
    }

    // 更新状态
    setCanvasSize({
      width: canvasWidth,
      height: canvasHeight,
    });

    // 更新GameContext中的画布尺寸，用于边界检查
    updateCanvasSize(canvasWidth, canvasHeight);

    console.log(`设置画布尺寸: ${canvasWidth}x${canvasHeight}`);
  }

  // 更新handleResize函数，添加设备检测逻辑
  const handleResize = () => {
    if (!canvasRef.current) return

    // 防抖动处理
    clearTimeout(resizeTimer.current as any)
    resizeTimer.current = setTimeout(() => {
      // 获取容器尺寸
      const container = canvasRef.current?.parentElement
      if (!container) return

      // 检测设备和方向
      const ua = navigator.userAgent;
      const isIPhone = /iPhone/i.test(ua);
      const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
      const isAndroid = /Android/i.test(ua);
      const isMobile = isIPhone || isAndroid;
      const isPortrait = window.innerHeight > window.innerWidth;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      console.log(`窗口调整: 移动=${isMobile}, 竖屏=${isPortrait}, 屏幕=${screenWidth}x${screenHeight}`);

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // 根据设备类型和方向设置画布尺寸
      let newWidth, newHeight
      
      if (isMobile && isPortrait) {
        // 移动设备竖屏模式 - 使用严格的正方形画布，并保持较小尺寸
        // 获取容器的较小边作为画布的宽高，确保是正方形
        const minDimension = Math.min(containerWidth, containerHeight);
        // 进一步限制最大尺寸
        const maxSize = Math.min(minDimension, 
                               isIPhone ? 320 : 360, // iPhone设备上使用更保守的尺寸
                               Math.min(screenWidth, screenHeight) * 0.9); // 确保不超过屏幕较小边的90%
                               
        newWidth = maxSize;
        newHeight = maxSize;
        console.log("移动设备竖屏模式，强制使用严格限制的1:1正方形画布:", newWidth, "x", newHeight);
      } else if (isIPad || (screenWidth < 1024 && screenHeight < 1024)) {
        // iPad或平板设备
        const aspectRatio = containerWidth / containerHeight;
        
        // 保持宽高比但避免过度拉伸
        if (aspectRatio > 1.5) {
          // 横向过宽，限制宽度
          newHeight = Math.min(containerHeight, 600);
          newWidth = Math.min(newHeight * 1.5, containerWidth);
        } else if (aspectRatio < 0.7) {
          // 竖向过高，限制高度
          newWidth = Math.min(containerWidth, 600);
          newHeight = Math.min(newWidth * 1.5, containerHeight);
        } else {
          // 近似正方形，维持比例
          newWidth = containerWidth;
          newHeight = containerHeight;
        }
        console.log("平板设备，使用调整比例画布:", newWidth, "x", newHeight);
      } else {
        // 桌面设备或横屏模式
        newWidth = containerWidth
        newHeight = containerHeight
        console.log("桌面设备，使用全尺寸画布:", newWidth, "x", newHeight);
      }

      // 确保使用整数值避免渲染问题
      newWidth = Math.floor(newWidth);
      newHeight = Math.floor(newHeight);
      
      // 安全检查，确保尺寸不为0或负数
      if (newWidth <= 0) newWidth = 320;
      if (newHeight <= 0) newHeight = 320;

      // 更新画布尺寸
      if (canvasRef.current) {
        canvasRef.current.width = newWidth
        canvasRef.current.height = newHeight
      }
      
      // 同步背景画布（如果存在）
      if (backgroundCanvasRef.current) {
        backgroundCanvasRef.current.width = newWidth;
        backgroundCanvasRef.current.height = newHeight;
      }

      // 更新状态
      setCanvasSize({
        width: newWidth,
        height: newHeight,
      })

      // 更新GameContext中的画布尺寸，确保边界检查使用正确的尺寸
      updateCanvasSize(newWidth, newHeight);

      console.log(`画布重新调整尺寸: ${newWidth}x${newHeight}`);

      // 重新计算所有位置
      updatePositions()
    }, 200) as any // 200ms防抖动
  }

  // 更新updatePositions函数，优化移动设备上的位置计算
  const updatePositions = () => {
    if (!canvasRef.current || !state.puzzle) return

    const { width, height } = canvasSize
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const shape = state.originalShape.map((point) => ({
      x: point.x * width,
      y: point.y * height,
      isOriginal: true,
    }))

    // 检测设备和方向
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/i.test(ua);
    const isPortrait = window.innerHeight > window.innerWidth;

    // 计算形状的包围盒
    const shapeBounds = shape.reduce(
      (bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxX: Math.max(bounds.maxX, point.x),
        maxY: Math.max(bounds.maxY, point.y),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    )

    const shapeWidth = shapeBounds.maxX - shapeBounds.minX
    const shapeHeight = shapeBounds.maxY - shapeBounds.minY

    // 调整不同设备上的缩放比例
    let scale = 0.8 // 默认缩放比例
    if (isIPhone && isPortrait) {
      // 在iPhone竖屏模式下，形状应该占据画布的更大比例
      scale = Math.min(
        (width * 0.85) / shapeWidth, 
        (height * 0.85) / shapeHeight
      )
    } else {
      // 桌面、iPad和横屏模式下的正常缩放
      scale = Math.min(
        (width * 0.65) / shapeWidth, 
        (height * 0.65) / shapeHeight
      )
    }

    // ... 其余代码保持不变 ...
  }

  // 绘制拼图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // 确保画布尺寸与canvasSize匹配
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // 在每次绘制前清除旧内容，确保不会覆盖
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 如果游戏完成，先绘制一个完整的无缝形状
    if (state.isCompleted && state.originalShape) {
      // 绘制完整形状
      ctx.beginPath();
      ctx.moveTo(state.originalShape[0].x, state.originalShape[0].y);

      if (state.shapeType === "polygon") {
        // 多边形使用直线
        state.originalShape.forEach((point: Point) => {
          ctx.lineTo(point.x, point.y);
        });
      } else {
        // 曲线形状使用贝塞尔曲线
        for (let i = 1; i < state.originalShape.length; i++) {
          const prev = state.originalShape[i - 1];
          const current = state.originalShape[i];
          const next = state.originalShape[(i + 1) % state.originalShape.length];

          const midX = (prev.x + current.x) / 2;
          const midY = (prev.y + current.y) / 2;
          const nextMidX = (current.x + next.x) / 2;
          const nextMidY = (current.y + next.y) / 2;

          ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
        }
      }

      ctx.closePath();
      ctx.fillStyle = isDarkMode ? "rgba(242, 100, 25, 0.8)" : "rgba(255, 211, 101, 0.8)"; // 使用暖色系
      ctx.fill();
      
      // 绘制完成效果
      drawCompletionEffect(ctx, state.originalShape, state.shapeType);
    } else if (state.puzzle) {
      // 如果存在拼图且游戏未完成
      // 添加调试信息，查看状态
      console.log("渲染状态:", {
        isScattered: state.isScattered,
        hasOriginalShape: state.originalShape && state.originalShape.length > 0,
        originalShapeLength: state.originalShape ? state.originalShape.length : 0,
        pieceCount: state.puzzle.length
      });
      
      // 使用drawPuzzle函数绘制所有内容，包括必要时的原始形状轮廓
      drawPuzzle(
        ctx, 
        state.puzzle, 
        state.completedPieces, 
        state.selectedPiece, 
        state.shapeType, 
        isDarkMode, 
        state.originalShape,
        state.isScattered
      );
      
      // 绘制提示轮廓（如果需要）
      if (state.showHint && state.selectedPiece !== null && state.originalPositions.length > 0) {
        drawHintOutline(ctx, state.originalPositions[state.selectedPiece]);
      }
    } else if (state.originalShape && state.originalShape.length > 0) {
      // 如果只有原始形状但没有拼图，则绘制原始形状
      drawShape(ctx, state.originalShape, state.shapeType, isDarkMode);
    }
    
    return () => {
      // 清除任何可能挂起的动画帧请求
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    state.puzzle,
    state.completedPieces,
    state.selectedPiece, 
    state.showHint,
    state.isCompleted,
    state.originalShape,
    state.shapeType,
    state.isScattered,
    isDarkMode,
    canvasSize.width,
    canvasSize.height,
  ]);
  
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
    }
    // 不再点击空白区域时清除选中状态
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
    
    // 使用GameContext提供的统一边界处理函数，确保在所有地方使用一致的边界逻辑
    const { constrainedDx, constrainedDy } = ensurePieceInBounds(piece, dx, dy, 15);
    
    // 调试日志，帮助排查问题
    // console.log("移动约束", { dx, dy, constrainedDx, constrainedDy });

    // 更新拼图位置
    dispatch({
      type: "UPDATE_PIECE_POSITION",
      payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
    });

    // 根据实际移动距离计算新的起点，确保下一次移动从正确位置开始
    const realStartX = state.draggingPiece.startX + constrainedDx;
    const realStartY = state.draggingPiece.startY + constrainedDy;
    
    dispatch({
      type: "SET_DRAGGING_PIECE",
      payload: { 
        index: state.draggingPiece.index,
        startX: realStartX,
        startY: realStartY
      },
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
    
    const isRotationCorrect = rotationDiff < 15; // 允许15度误差，适配旋转按钮15度的增量

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
      
      // 强制清除选中状态 - 放在添加完成拼图之后
      dispatch({ type: "SET_SELECTED_PIECE", payload: null })
      setIsDragging(false)
      
      // 播放拼图吸附音效
      playPieceSnapSound()
      
      // 添加视觉反馈 - 在拼图完成位置显示闪光效果
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // 保存当前绘图状态
          ctx.save();
          
          // 清空画布并重新绘制所有拼图（确保选中状态被清除）
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // 立即重绘拼图 - 确保没有选中状态
          if (state.puzzle) {
            drawPuzzle(
              ctx,
              state.puzzle,
              [...state.completedPieces, pieceIndex], // 确保包含刚完成的拼图
              null, // 强制不选中任何拼图
              state.shapeType,
              isDarkMode,
              state.originalShape,
              state.isScattered
            );
          }
          
          // 绘制白色闪光
          const center = calculateCenter(originalPiece.points);
          const radius = Math.max(originalPiece.points.reduce((max, p) => 
            Math.max(max, Math.hypot(p.x - center.x, p.y - center.y)), 0) * 1.5, 30);
          
          // 创建径向渐变
          const gradient = ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.globalCompositeOperation = 'lighter';
          
          // 绘制圆形闪光
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // 恢复原来的绘图状态
          ctx.restore();
          
          // 使用动画缩小闪光效果
          let animationStep = 0;
          const animateFlash = () => {
            if (animationStep >= 10) return;
            
            animationFrameRef.current = requestAnimationFrame(() => {
              ctx.save();
              ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
              
              // 重新绘制所有拼图（确保不会只有闪光效果）
              if (state.puzzle) {
                drawPuzzle(
                  ctx,
                  state.puzzle,
                  [...state.completedPieces, pieceIndex], // 包含刚完成的拼图
                  null, // 强制不选中任何拼图
                  state.shapeType,
                  isDarkMode,
                  state.originalShape,
                  state.isScattered
                );
              }
              
              // 绘制逐渐消失的闪光
              const fadeOutRadius = radius * (1 - animationStep / 10);
              const fadeOutOpacity = 0.8 * (1 - animationStep / 10);
              
              const fadeGradient = ctx.createRadialGradient(
                center.x, center.y, 0,
                center.x, center.y, fadeOutRadius
              );
              fadeGradient.addColorStop(0, `rgba(255, 255, 255, ${fadeOutOpacity})`);
              fadeGradient.addColorStop(0.5, `rgba(255, 255, 255, ${fadeOutOpacity/2})`);
              fadeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
              
              ctx.fillStyle = fadeGradient;
              ctx.globalCompositeOperation = 'lighter';
              
              ctx.beginPath();
              ctx.arc(center.x, center.y, fadeOutRadius, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.restore();
              
              animationStep++;
              if (animationStep < 10) {
                animateFlash();
              } else {
                // 动画结束后，再次强制重绘以确保状态正确
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                if (state.puzzle) {
                  drawPuzzle(
                    ctx,
                    state.puzzle,
                    [...state.completedPieces, pieceIndex],
                    null,
                    state.shapeType,
                    isDarkMode,
                    state.originalShape,
                    state.isScattered
                  );
                }
              }
            });
          };
          
          // 开始闪光动画
          animateFlash();
        }
      }

      // 检查是否所有拼图都已完成
      // Check puzzle again before accessing length
      if (state.puzzle && state.completedPieces.length + 1 >= state.puzzle.length) {
        // 先播放完成音效
        playPuzzleCompletedSound();
        
        // 等待闪光动画完成后再显示游戏完成效果
        setTimeout(() => {
          // 设置游戏为完成状态
          dispatch({ type: "SET_IS_COMPLETED", payload: true });
          
          // 强制重绘游戏完成状态
          if (canvasRef.current) {
            const completeCtx = canvasRef.current.getContext('2d');
            if (completeCtx && state.originalShape) {
              // 清空画布
              completeCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              // 绘制完整形状
              completeCtx.beginPath();
              completeCtx.moveTo(state.originalShape[0].x, state.originalShape[0].y);
              
              if (state.shapeType === "polygon") {
                // 多边形使用直线
                state.originalShape.forEach((point: Point) => {
                  completeCtx.lineTo(point.x, point.y);
                });
              } else {
                // 曲线形状使用贝塞尔曲线
                for (let i = 1; i < state.originalShape.length; i++) {
                  const prev = state.originalShape[i - 1];
                  const current = state.originalShape[i];
                  const next = state.originalShape[(i + 1) % state.originalShape.length];
                  
                  const midX = (prev.x + current.x) / 2;
                  const midY = (prev.y + current.y) / 2;
                  const nextMidX = (current.x + next.x) / 2;
                  const nextMidY = (current.y + next.y) / 2;
                  
                  completeCtx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
                }
              }
              
              completeCtx.closePath();
              
              // 填充完整形状
              completeCtx.fillStyle = isDarkMode ? "rgba(242, 100, 25, 0.8)" : "rgba(255, 211, 101, 0.8)";
              completeCtx.fill();
              
              // 绘制游戏完成特效
              drawCompletionEffect(completeCtx, state.originalShape, state.shapeType);
            }
          }
        }, 500); // 等待闪光动画完成
      }
    }

    // 清除拖动状态
    dispatch({ type: "SET_DRAGGING_PIECE", payload: null })
  }

  // 添加Canvas初始化的useEffect
  useEffect(() => {
    console.log('初始化画布');
    
    // 初始设置画布大小
    setInitialCanvasSize();
    
    // 添加窗口大小变化的监听器
    const handleOrientationChange = () => {
      console.log('方向变化检测到，强制重新计算画布尺寸');
      // 清除之前的定时器
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current as any);
      }
      
      // 设置新的定时器，确保DOM完全更新
      resizeTimer.current = setTimeout(() => {
        handleResize();
        
        // 对于移动设备，添加额外检查
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          setTimeout(() => {
            console.log('移动设备方向变化后额外检查');
            setInitialCanvasSize(); // 完全重置画布大小
          }, 500);
        }
      }, 300) as any;
    };
    
    window.addEventListener('resize', handleResize);
    // 特别监听方向变化
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 添加一个延迟的强制重新计算，确保在所有DOM元素完全渲染后执行
    const timeoutId = setTimeout(() => {
      console.log('强制重新计算画布尺寸...');
      handleResize();
      
      // 对于手机设备，添加额外的计算延迟，确保获取到正确的尺寸
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
          console.log('移动设备额外尺寸检查...');
          setInitialCanvasSize(); // 使用初始化函数而不是handleResize
        }, 500);
      }
    }, 300);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(timeoutId);
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current as any);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // 监听游戏状态变化，确保在重置游戏时重新计算画布尺寸
  useEffect(() => {
    // 检查游戏状态重置
    if (!state.isScattered && !state.isCompleted && state.completedPieces.length === 0) {
      console.log('检测到游戏重置状态，确保画布尺寸正确');
      
      // 延迟执行以确保其他状态都已更新
      const timeoutId = setTimeout(() => {
        setInitialCanvasSize();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.isScattered, state.isCompleted, state.completedPieces.length]);

  // 优化触摸事件处理
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // 防止触摸事件触发鼠标事件

    if (!canvasRef.current || !state.puzzle) return
    if (!state.isScattered) return // 如果拼图没有散开，不允许交互

    const rect = canvasRef.current.getBoundingClientRect()

    // 检查是否是单点触摸（拖拽）或多点触摸（旋转）
    if (e.touches.length === 1) {
      // 单点触摸 - 处理拼图选择/拖拽
      const touch = e.touches[0]
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top

      // 保存初始触摸位置
      lastTouchRef.current = { x: touchX, y: touchY }

      // 检查点击的是哪个拼图片段
      let clickedPieceIndex = -1

      // 使用多边形点包含检测
      for (let i = state.puzzle.length - 1; i >= 0; i--) {
        // 跳过已完成的拼图，不允许拖拽
        if (state.completedPieces.includes(i)) continue

        const piece = state.puzzle[i]
        const center = calculateCenter(piece.points)
        
        // 将触摸点逆向旋转，以匹配未旋转的形状
        const rotationAngle = -piece.rotation // 逆向旋转
        const rotatedPoint = rotatePoint(touchX, touchY, center.x, center.y, rotationAngle)
        
        // 检查旋转后的点是否在形状内
        if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
          clickedPieceIndex = i
          break
        }
      }

      if (clickedPieceIndex !== -1) {
        // 设置选中的拼图块
        dispatch({ type: "SET_SELECTED_PIECE", payload: clickedPieceIndex })
        // 设置拖动信息
        dispatch({ 
          type: "SET_DRAGGING_PIECE", 
          payload: {
            index: clickedPieceIndex,
            startX: touchX,
            startY: touchY,
          } 
        })
        // 播放音效
        playPieceSelectSound()
      } else {
        // 不再在触摸空白区域时清除选中状态
      }
    } 
    else if (e.touches.length === 2 && state.selectedPiece !== null) {
      // 双指触摸 - 处理旋转
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // 计算两个触摸点形成的角度
      const angle = calculateAngle(
        touch1.clientX - rect.left, 
        touch1.clientY - rect.top,
        touch2.clientX - rect.left, 
        touch2.clientY - rect.top
      )
      
      // 保存初始角度用于计算旋转
      setTouchStartAngle(angle)
    }
  }
  
  // 处理触摸移动事件
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!state.puzzle) return;
    if (!state.isScattered) return;
    
    e.preventDefault(); // 防止滚动
    e.stopPropagation(); // 阻止事件冒泡，防止触发浏览器手势
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    if (e.touches.length === 1 && state.draggingPiece) {
      // 单指拖拽
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 计算移动距离
      const lastX = lastTouchRef.current?.x || state.draggingPiece.startX;
      const lastY = lastTouchRef.current?.y || state.draggingPiece.startY;
      const dx = x - lastX;
      const dy = y - lastY;
      
      // 更新最后触摸位置
      lastTouchRef.current = { x, y };
      
      // 获取当前拖动的拼图
      const piece = state.puzzle[state.draggingPiece.index];
      if (!piece) {
        console.error("无法获取拼图片段:", state.draggingPiece.index);
        return;
      }
      
      // 使用边界检查确保拼图在画布内
      const { constrainedDx, constrainedDy } = ensurePieceInBounds(piece, dx, dy, 20);
      
      // 更新拼图位置
      dispatch({
        type: "UPDATE_PIECE_POSITION",
        payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
      });
    } 
    else if (e.touches.length === 2 && state.selectedPiece !== null) {
      // 双指旋转
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // 计算当前角度
      const currentAngle = calculateAngle(
        touch1.clientX - rect.left, 
        touch1.clientY - rect.top,
        touch2.clientX - rect.left, 
        touch2.clientY - rect.top
      );
      
      // 计算角度差
      let angleDiff = currentAngle - touchStartAngle;
      
      // 标准化角度到-180到180之间
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      
      // 分段旋转 - 每累积15度旋转一次，使用旋转量的符号决定方向
      if (Math.abs(angleDiff) >= 15) {
        const clockwise = angleDiff > 0;
        // 添加旋转音效
        playRotateSound();
        rotatePiece(clockwise); // 旋转1次，总计15度
        
        // 重置起始角度
        setTouchStartAngle(currentAngle);
      }
    }
  }
  
  // 处理触摸结束事件
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // 防止iOS上的默认事件
    e.stopPropagation(); // 阻止事件传播
    
    // 检查是否所有触摸点都已结束
    if (e.touches.length === 0) {
      // 复用鼠标释放的逻辑处理拖动结束
      handleMouseUp()
      
      // 只清除拖动状态，但保留选中状态
      setIsDragging(false)
      
      // 重置触摸状态
      lastTouchRef.current = null
      setTouchStartAngle(0)
    }
    // 如果仍有一个触摸点，更新lastTouch为当前位置
    else if (e.touches.length === 1) {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      lastTouchRef.current = { 
        x: touch.clientX - rect.left, 
        y: touch.clientY - rect.top 
      }
      
      // 重置旋转状态
      setTouchStartAngle(0)
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
    >
      {/* 添加轻微的内部发光效果 */}
      <div className="absolute inset-0 pointer-events-none bg-white/5 rounded-2xl"></div>
      <div 
        className="relative flex items-center justify-center w-full h-full"
      >
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative cursor-pointer w-full h-full"
        />
        
        {/* 拼图进度提示 - 只在游戏未完成时显示 */}
        {!state.isCompleted && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-xs z-10">
            {state.completedPieces.length} / {state.puzzle?.length || 0} 块拼图已完成
          </div>
        )}
      </div>
    </div>
  )
}
