"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useGame } from "@/contexts/GameContext"
import { playPieceSelectSound, playPieceSnapSound, playPuzzleCompletedSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { appendAlpha } from "@/utils/rendering/colorUtils"

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
  color?: string
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
const drawShape = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  console.log(`开始绘制形状: ${shape.length}个点, 类型:${shapeType}`);
  
  if (shape.length === 0) {
    console.error('形状没有点，无法绘制');
    return;
  }
  
  // 记录画布尺寸
  console.log(`画布尺寸: ${ctx.canvas.width}x${ctx.canvas.height}`);
  
  // 先清除画布
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 使用更鲜明的填充颜色，确保在画布上可见
  ctx.fillStyle = "rgba(45, 55, 72, 0.6)"
  ctx.strokeStyle = "rgba(203, 213, 225, 0.8)"
  ctx.lineWidth = 2

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
      ctx.shadowColor = "rgba(255, 255, 255, 0.4)"
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
  ctx: CanvasRenderingContext2D, // Canvas 2D 渲染上下文
  pieces: PuzzlePiece[], // 所有拼图片段的数据数组
  completedPieces: number[], // 已完成拼图片段的索引数组
  selectedPiece: number | null, // 当前选中的拼图片段索引 (或 null)
  shapeType: string, // 形状类型 ('polygon' 或 'curve')
  originalShape?: Point[], // 原始形状的顶点数组 (用于显示轮廓或完成状态)
  isScattered: boolean = false // 游戏是否处于拼图散开的状态
) => {
  // 清除整个画布，准备重新绘制
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
    
    // 使用纯色填充，不使用半透明
    const fillColor = "#F26419"
    
    // 先填充纯色
    ctx.fillStyle = fillColor
    
    // 不使用模糊阴影，保持边缘锐利
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.fill()
    
    // 在边缘外围增加淡淡的发光效果，确保与填充色有明显区分
    ctx.save()
    ctx.shadowColor = "rgba(255, 159, 64, 0.6)"
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // 使用比填充色更淡的颜色绘制外发光形状
    ctx.strokeStyle = "rgba(255, 159, 64, 0.3)"
    ctx.lineWidth = 5
    
    // 仅绘制描边而不再次填充，发光效果只影响描边
    ctx.stroke()
    ctx.restore()
    
    // 绘制完成效果
    drawCompletionEffect(ctx, originalShape, shapeType)
  } else {
    // 如果在散开状态且有原始形状，先绘制原始形状的轮廓作为目标指南
    if (isScattered && originalShape && originalShape.length > 0) {
      ctx.save(); // 保存当前绘图状态
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
      ctx.fillStyle = "rgba(45, 55, 72, 0.6)";
      ctx.strokeStyle = "rgba(203, 213, 225, 0.8)";
      ctx.lineWidth = 2.;
      
      // 先填充
      ctx.fill();
      
      // 添加内阴影效果，像凹下去一样
      ctx.save();
      
      // 使用裁剪方式来限制内阴影只在形状内部
      ctx.clip();
      
      // 创建从中心到边缘的渐变，增加深度感
      const innerGradient = ctx.createRadialGradient(
        ctx.canvas.width/2, ctx.canvas.height/2, 0,
        ctx.canvas.width/2, ctx.canvas.height/2, ctx.canvas.width/2
      );
      
      innerGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)"); // 中心略亮
      innerGradient.addColorStop(0.7, "rgba(0, 0, 0, 0)"); // 过渡区完全透明
      innerGradient.addColorStop(1, "rgba(0, 0, 0, 0.25)"); // 边缘暗化
      
      // 应用渐变
      ctx.fillStyle = innerGradient;
      ctx.fill(); // 再次填充，叠加渐变效果
      
      // 绘制内阴影：从边缘向内
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 6; 
      ctx.shadowOffsetY = 6;
      
      // 绘制略小的形状以产生内阴影
      ctx.lineWidth = 8;
      ctx.stroke();
      
      // 从另一个角度添加内阴影，增强3D凹陷感
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = -4;
      ctx.shadowOffsetY = -4;
      
      ctx.lineWidth = 5;
      ctx.stroke();
      
      ctx.restore();
      
      // 添加轻微发光效果，保持原有的轮廓线样式
      ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
      ctx.shadowBlur = 15;
      ctx.stroke();
      
      // 重置阴影
      ctx.shadowBlur = 0
    }

    // 修改渲染顺序：将已完成和未完成的拼图分开绘制
    // 优化渲染顺序：先绘制所有未完成且未选中的拼图，最后绘制选中的拼图
    pieces.forEach((piece, index) => {
      const isCompleted = completedPieces.includes(index);
      const isSelected = selectedPiece === index;
      
      // 先绘制未完成且未选中的拼图
      if (!isCompleted && !isSelected) {
        drawPiece(ctx, piece, index, false, false, shapeType, isScattered);
      }
      // 如果是已完成的拼图，也先绘制（在底层）
      if (isCompleted) {
        drawPiece(ctx, piece, index, true, false, shapeType, isScattered);
      }
    });
    
    // 最后绘制当前选中的拼图，确保它在最上层
    if (selectedPiece !== null && pieces[selectedPiece]) {
      const piece = pieces[selectedPiece];
      drawPiece(ctx, piece, selectedPiece, false, true, shapeType, isScattered);
      }
  }


}

// 绘制单个拼图片段
const drawPiece = (
  ctx: CanvasRenderingContext2D, // Canvas 2D 渲染上下文
  piece: PuzzlePiece, // 当前要绘制的拼图片段数据
  index: number, // 拼图片段的索引
  isCompleted: boolean, // 拼图片段是否已完成并吸附到目标位置
  isSelected: boolean, // 拼图片段当前是否被用户选中/拖动
  shapeType: string, // 形状类型 ('polygon' 或 'curve')
  isScattered: boolean = false // 游戏是否处于拼图散开的状态
) => {
  // 计算中心点用于旋转
  const center = calculateCenter(piece.points)

  ctx.save()

  // 应用旋转变换：先平移到中心点，旋转，再平移回来
  ctx.translate(center.x, center.y)
  ctx.rotate((piece.rotation * Math.PI) / 180)
  ctx.translate(-center.x, -center.y)

  // 仅当拼图已散开且未完成时绘制阴影，已完成的拼图永远不显示阴影
  if (isScattered && !isCompleted) {
    ctx.save(); // 保存当前状态，用于绘制阴影形状
    ctx.beginPath(); // 开始新的路径
    ctx.moveTo(piece.points[0].x, piece.points[0].y);

    // 遍历拼图的所有点，绘制形状路径
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
    
    // 设置阴影样式：为被选中的拼图绘制更明显的阴影，未选中的拼图绘制较小的阴影
    if (isSelected) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; // 选中状态阴影颜色
      ctx.shadowBlur = 15; // 选中状态阴影模糊半径
      ctx.shadowOffsetX = 5; // 选中状态阴影水平偏移
      ctx.shadowOffsetY = 5; // 选中状态阴影垂直偏移
    } 
    // 为未完成且未选中的拼图绘制较小的阴影
    else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // 未选中状态阴影颜色
      ctx.shadowBlur = 10; // 未选中状态阴影模糊半径
      ctx.shadowOffsetX = 3; // 未选中状态阴影水平偏移
      ctx.shadowOffsetY = 3; // 未选中状态阴影垂直偏移
    }
    
    // 填充形状以显示阴影效果（阴影是绘制在填充形状下方的）
    // 使用拼图的颜色属性设置填充颜色（带透明度），已完成拼图使用特定颜色
    ctx.fillStyle = isCompleted 
      ? "rgba(255, 211, 101, 0.8)" // 已完成拼图使用特定的半透明黄色
      : (piece.color ? appendAlpha(piece.color, 0.8) : "rgba(204, 204, 204, 0.8)"); // 使用安全的颜色透明度函数

    ctx.fill(); // 填充当前路径
    ctx.restore(); // 恢复之前保存的绘图状态，取消阴影设置
  }

  // 绘制拼图的主体路径（在阴影上方）
  ctx.beginPath() // 开始新的路径
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
  // 根据是否已完成和是否有颜色属性设置填充颜色
  ctx.fillStyle = isCompleted 
    ? "rgba(255, 211, 101, 0.8)" // 已完成拼图使用特定的半透明黄色
    : (piece.color ? appendAlpha(piece.color, 0.8) : "rgba(204, 204, 204, 0.8)"); // 使用安全的颜色透明度函数

  ctx.fill() // 填充当前路径

  // 绘制边框 - 只为未完成的拼图绘制边框，完成的拼图不绘制边框
  if (!isCompleted) {
    // 设置描边颜色
    ctx.strokeStyle = "#e2e8f0" // 使用白色轮廓线
    
    // 根据是否被选中设置描边样式：选中时使用虚线
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

  // 使用固定透明度，移除闪烁效果
  // 绿色轮廓线
  ctx.strokeStyle = "rgba(0, 255, 0, 0.8)"
  // 绿色半透明填充
  ctx.fillStyle = "rgba(0, 255, 0, 0.25)"
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 4

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

  // 文字使用白色加黑色阴影，确保在任何背景下都清晰可见
  ctx.fillStyle = "white"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  
  // 添加黑色阴影使文字在任何背景下都清晰可见
  ctx.shadowColor = "black"
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  
  // 只需绘制一次文字，阴影会自动应用
  ctx.fillText("这里", centerX, centerY)
  
  // 重置阴影效果，避免影响其他绘制
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  ctx.restore()
}

// 修改完成效果，更简洁不遮挡拼图
const drawCompletionEffect = (
  ctx: CanvasRenderingContext2D, // Canvas 2D 渲染上下文
  shape: Point[], // 完成形状的顶点数组
  shapeType: string // 形状类型 ('polygon' 或 'curve')
) => {
  ctx.save(); // 保存当前绘图状态，以便后续恢复

  // 计算形状的边界框，用于定位效果和阴影尺寸计算
  const bounds = shape.reduce(
    (acc: {minX: number, maxX: number, minY: number, maxY: number}, point: Point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const centerX = (bounds.minX + bounds.maxX) / 2; // 形状中心X坐标
  const centerY = (bounds.minY + bounds.maxY) / 2; // 形状中心Y坐标
  
  // 绘制水平压扁的椭圆阴影，制造悬浮效果
  ctx.save(); // 保存当前状态以便应用变换
  
  // 计算阴影尺寸 - 宽度稍大于形状本身
  const shapeWidth = bounds.maxX - bounds.minX;
  const shadowWidthRadius = shapeWidth * 0.65;  // 控制阴影的宽度半径，占形状宽度的比例
  const shadowHeightRadius = shapeWidth * 0.2;  // 高度比宽度小很多，创造扁平效果
  
  // 阴影的位置 - 在形状下方，增加与拼图的距离
  const shadowX = centerX; // 阴影中心X坐标与形状中心一致
  const shadowY = bounds.maxY + shadowHeightRadius * 1.5;  // 阴影中心Y坐标在形状底部下方一定距离
  
  // 创建径向渐变，使阴影从中心向外逐渐消失，实现羽化效果
  const gradient = ctx.createRadialGradient(
    shadowX, shadowY, 0, // 渐变起始圆（中心点，半径0）
    shadowX, shadowY, shadowWidthRadius // 渐变结束圆（中心点，半径等于阴影宽度半径）
  );
  
  // 精细调整渐变过渡，中心稍黑但保持良好羽化
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');   // 渐变中心颜色和透明度
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)'); // 内部区域过渡颜色和透明度
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.05)'); // 外围区域过渡颜色和透明度
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');      // 边缘完全透明
  
  // 保存当前状态以便应用变换 (压扁阴影)
  ctx.save();
  
  // 设置变换矩阵使圆形在垂直方向压扁（扁平比例约0.3），绘制出椭圆阴影
  ctx.translate(shadowX, shadowY); // 平移到阴影中心
  ctx.scale(1, 0.3);  // Y轴缩放为原来的0.3倍，创造扁平椭圆
  ctx.translate(-shadowX, -shadowY); // 平移回原点
  
  // 应用渐变填充绘制阴影
  ctx.fillStyle = gradient; // 设置填充样式为创建的渐变
  ctx.beginPath(); // 开始绘制路径
  ctx.arc(shadowX, shadowY, shadowWidthRadius, 0, Math.PI * 2); // 绘制一个圆形 (将被压扁成椭圆)
  ctx.fill(); // 填充路径
  
  // 恢复变换状态，取消压扁效果
  ctx.restore();
  ctx.restore(); // 恢复最开始保存的绘图状态，取消阴影设置等效果
  
  // 绘制完成文本 - 使用更精确的字体堆栈和多层渲染技术，增强视觉效果
  const fontSize = Math.min(36, Math.max(24, ctx.canvas.width / 15)); // 根据画布宽度自适应字体大小，确保在不同屏幕尺寸下都合适
  ctx.font = `bold ${fontSize}px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'STHeiti', 'SimHei', 'WenQuanYi Micro Hei', sans-serif`; // 设置字体样式，包含多种中文字体以提高兼容性
  ctx.textAlign = "center"; // 文本水平居中对齐
  ctx.textBaseline = "middle"; // 文本垂直居中对齐
  
  // 文本位置 - 移到形状上方，避免遮挡，并确保不会超出画布顶部
  const textY = bounds.minY - 40; // 文本基础Y坐标，在形状 minY 上方40像素
  const finalY = Math.max(50, textY); // 确保文本不会太靠近顶部边缘，最小Y坐标为50
  const completeText = "你好犀利吖!"; // 游戏完成时显示的文本内容
  
  // 多层渲染技术，通过绘制多次叠加不同样式来创建复杂的文本效果
  // 1. 外发光效果 - 较大模糊，作为文本底层的辉光，使文本看起来更醒目
  ctx.shadowColor = "rgba(255, 140, 0, 0.7)"; // 橙色发光颜色，半透明效果
  ctx.shadowBlur = 12; // 较大的模糊半径，创建柔和的发光效果
  ctx.shadowOffsetX = 0; // 水平方向无偏移
  ctx.shadowOffsetY = 0; // 垂直方向无偏移
  ctx.fillStyle = "rgba(255, 215, 0, 0.4)"; // 半透明金色作为发光填充色，与橙色阴影叠加产生层次感
  ctx.fillText(completeText, centerX, finalY); // 绘制带发光的文本
  
  // 2. 描边阴影 - 增加文本的深度感和立体感，使文本边缘更清晰
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)"; // 黑色阴影颜色，提供深度
  ctx.shadowBlur = 3; // 较小的模糊半径，创建清晰的阴影边缘
  ctx.shadowOffsetX = 2; // 水平偏移
  ctx.shadowOffsetY = 2; // 垂直偏移
  ctx.strokeStyle = "#FF7700"; // 亮橙色作为描边颜色，与主体文字颜色形成对比
  ctx.lineWidth = Math.max(3, fontSize / 12); // 根据字体大小比例设置描边宽度，确保描边粗细适中
  ctx.strokeText(completeText, centerX, finalY); // 绘制带阴影的描边文本
  
  // 3. 清除阴影，绘制主体文字，确保主体文字清晰不受阴影影响
  ctx.shadowColor = "transparent"; // 将阴影颜色设为透明，移除阴影效果
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 4. 渐变填充效果 - 使主体文字具有更丰富的色彩层次和质感
  const textGradient = ctx.createLinearGradient(
    centerX, finalY - fontSize/2, // 渐变起始点 (文本顶部中心)
    centerX, finalY + fontSize/2 // 渐变结束点 (文本底部中心)
  ); // 创建线性渐变，从文本顶部到底部
  textGradient.addColorStop(0, "#FFD700"); // 金色顶部，起始颜色
  textGradient.addColorStop(0.5, "#FFCC00"); // 中间色，黄色
  textGradient.addColorStop(1, "#FF9500"); // 橙色底部，结束颜色
  ctx.fillStyle = textGradient; // 应用创建的渐变填充样式
  ctx.fillText(completeText, centerX, finalY); // 绘制渐变填充的主体文本

  ctx.restore(); // 恢复最开始保存的绘图状态
}

export default function PuzzleCanvas() {
  const { 
    state, 
    dispatch, 
    canvasRef, 
    backgroundCanvasRef, 
    ensurePieceInBounds, 
    calculatePieceBounds,
    updateCanvasSize,
    rotatePiece 
  } = useGame()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [touchStartAngle, setTouchStartAngle] = useState(0)
  const [showDebugElements, setShowDebugElements] = useState(false) // 添加显示调试元素状态
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const resizeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const lastTouchRef = useRef<{x: number, y: number} | null>(null)
  const isDarkMode = true
  
  // 设备检测
  const [isAndroid, setIsAndroid] = useState(false)
  
  // 组件挂载时进行设备检测
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroidDevice = /android/.test(userAgent)
    setIsAndroid(isAndroidDevice)
  }, [])
  
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
    } else if (isMobile && !isPortrait) {
      // 移动设备横屏模式 - 利用宽屏空间，使用更宽的矩形画布
      const availableHeight = Math.min(containerHeight, screenHeight * 0.8); // 高度占屏幕80%
      // 宽高比设为 16:9 或者其他适合横屏的比例
      const aspectRatio = 16/9;
      // 限制宽度不超过容器宽度
      canvasWidth = Math.min(availableHeight * aspectRatio, containerWidth * 0.9);
      canvasHeight = availableHeight;
      console.log("移动设备横屏模式，使用宽屏比例画布:", canvasWidth, "x", canvasHeight);
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
      // 桌面设备
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
      } else if (isMobile && !isPortrait) {
        // 移动设备横屏模式 - 利用宽屏空间，使用更宽的矩形画布
        const availableHeight = Math.min(containerHeight, screenHeight * 0.8); // 高度占屏幕80%
        // 宽高比设为 16:9 或者其他适合横屏的比例
        const aspectRatio = 16/9;
        // 限制宽度不超过容器宽度
        newWidth = Math.min(availableHeight * aspectRatio, containerWidth * 0.9);
        newHeight = availableHeight;
        console.log("移动设备横屏模式，使用宽屏比例画布:", newWidth, "x", newHeight);
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
        // 桌面设备
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
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIPhone || isAndroid;
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
    if (isMobile && isPortrait) {
      // 在移动设备竖屏模式下，形状应该占据画布的更大比例
      scale = Math.min(
        (width * 0.85) / shapeWidth, 
        (height * 0.85) / shapeHeight
      )
    } else if (isMobile && !isPortrait) {
      // 在移动设备横屏模式下，形状应该适当缩放以利用宽屏空间
      scale = Math.min(
        (width * 0.75) / shapeWidth, 
        (height * 0.8) / shapeHeight
      )
    } else {
      // 桌面和iPad模式下的正常缩放
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

    // 计算真实的画布边界
    const canvasBounds = {
      left: 0,
      top: 0,
      right: canvas.width,
      bottom: canvas.height
    };

    // 在每次绘制前清除旧内容，确保不会覆盖
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // -----调试功能：绘制画布边缘警戒线-----
    const drawCanvasBorderLine = () => {
      if (!showDebugElements) return; // 只在调试模式下显示
      
      // 保存当前绘图状态
      ctx.save();
      
      // 设置警戒线样式 - 红色虚线
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      
      // 绘制内边框（警戒线）- 距离画布边缘1像素
      ctx.beginPath();
      ctx.rect(1, 1, canvas.width - 2, canvas.height - 2);
      ctx.stroke();
      
      // 恢复绘图状态
      ctx.restore();
    };
    
    // -----调试功能：绘制可分布区域-----
    const drawDistributionArea = () => {
      if (!showDebugElements) return; // 只在调试模式下显示
      
      // 保存当前绘图状态
      ctx.save();
      
      // 获取当前在ScatterPuzzle中使用的边距
      // 模拟计算边距的逻辑
      const ua = navigator.userAgent;
      const isIPhone = /iPhone/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isMobile = isIPhone || isAndroid;
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmallScreen = canvas.width < 400 || canvas.height < 400;
      
      let margin;
      if (isMobile && isPortrait) {
        margin = Math.floor(canvas.width * 0.05);
      } else if (isSmallScreen) {
        margin = Math.min(20, Math.floor(canvas.width * 0.03));
      } else {
        margin = Math.min(30, Math.floor(canvas.width * 0.03));
      }
      
      // 小边距区域（用于拼图放置边界）
      const minMargin = 5;
      
      // 绘制安全放置区域（淡绿色）
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.fillRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);
      
      // 绘制较小放置边界区域（淡黄色）
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(minMargin, minMargin, canvas.width - minMargin * 2, canvas.height - minMargin * 2);
      
      // 恢复绘图状态
      ctx.restore();
    };
    
    // 只在调试模式下绘制分布区域
    if (showDebugElements) {
      drawDistributionArea();
    }

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
      ctx.fillStyle = "rgba(242, 100, 25, 0.8)"; // 使用暖色系
      ctx.fill();
      
      // 绘制完成效果
      drawCompletionEffect(ctx, state.originalShape, state.shapeType);
    } else if (state.puzzle) {
      // 确保在渲染前更新GameContext中的画布尺寸
      // 这确保了边界检测使用正确的尺寸
      if (state.canvasWidth !== canvas.width || state.canvasHeight !== canvas.height) {
        updateCanvasSize(canvas.width, canvas.height);
      }
      
      // 如果存在拼图且游戏未完成
      // 添加调试信息，查看状态
      console.log("渲染状态:", {
        isScattered: state.isScattered,
        hasOriginalShape: state.originalShape && state.originalShape.length > 0,
        originalShapeLength: state.originalShape ? state.originalShape.length : 0,
        pieceCount: state.puzzle.length,
        canvasBounds: canvasBounds
      });
      
      // 使用drawPuzzle函数绘制所有内容，包括必要时的原始形状轮廓
      drawPuzzle(
        ctx, 
        state.puzzle, 
        state.completedPieces, 
        state.selectedPiece, 
        state.shapeType, 
        state.originalShape,
        state.isScattered
      ); // 使用drawPuzzle函数绘制当前拼图状态
      
      
      // 在绘制完所有拼图后，如果需要，绘制提示轮廓
      if (state.showHint && state.selectedPiece !== null && state.originalPositions.length > 0) {
        drawHintOutline(ctx, state.originalPositions[state.selectedPiece]);
      }
      
      // -----调试功能：绘制每个拼图的碰撞边界框-----
      if (showDebugElements && state.puzzle && state.puzzle.length > 0) {
        state.puzzle.forEach((piece, index) => {
          // 计算拼图边界
          const bounds = calculatePieceBounds(piece);
          
          // 保存绘图状态
          ctx.save();
          
          // 为每个拼图使用不同的边界框颜色
          const pieceColors = [
            'rgba(0, 100, 255, 0.7)',   // 蓝色
            'rgba(255, 100, 0, 0.7)',   // 橙色
            'rgba(0, 200, 100, 0.7)',   // 绿色
            'rgba(200, 0, 200, 0.7)',   // 紫色
            'rgba(255, 200, 0, 0.7)',   // 黄色
            'rgba(200, 100, 100, 0.7)', // 棕红色
            'rgba(100, 200, 200, 0.7)'  // 青色
          ];
          
          // 设置边界框样式
          ctx.strokeStyle = pieceColors[index % pieceColors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          
          // 绘制边界框
          ctx.beginPath();
          ctx.rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
          ctx.stroke();
          
          // 添加拼图编号标记
          ctx.fillStyle = 'white';
          ctx.fillRect(bounds.centerX - 10, bounds.centerY - 10, 20, 20);
          ctx.fillStyle = 'black';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), bounds.centerX, bounds.centerY);
          
          // 恢复绘图状态
          ctx.restore();
        });
      }
      
      // 最后绘制画布边缘警戒线，确保它在最上层
      drawCanvasBorderLine();
    } else if (state.originalShape && state.originalShape.length > 0) {
      // 如果只有原始形状但没有拼图，则绘制原始形状
      drawShape(ctx, state.originalShape, state.shapeType);
      
      // 绘制画布边缘警戒线
      drawCanvasBorderLine();
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
    canvasSize.width,
    canvasSize.height,
    showDebugElements,
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
    // 使用1像素的安全边距，所有拼图使用完全相同的边界设置
    const { constrainedDx, constrainedDy, hitBoundary } = ensurePieceInBounds(piece, dx, dy, 1);
    
    // 更新拼图位置
    dispatch({
      type: "UPDATE_PIECE_POSITION",
      payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
    });

    // 如果触碰到边界，立即停止拖拽并添加震动动画
    if (hitBoundary) {
      // 只有在碰到画布边缘时才停止拖拽，而不是目标轮廓
      dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
      setIsDragging(false); // 更新本地状态，停止拖拽视觉反馈
      
      // 保存碰撞位置基准点
      const hitPiece = { ...piece };
      const pieceIndex = state.draggingPiece.index;
      
      // 震动动画序列 - 增大震动幅度以使回弹更明显
      let animationStep = 0;
      const maxSteps = 6; // 震动次数
      // 增大震动幅度，使回弹效果更明显
      const shakeAmount = [8, -6, 5, -4, 3, -2]; // 震动幅度序列
      
      // 确定震动方向 - 根据碰撞面决定
      let shakeDirectionX = 0;
      let shakeDirectionY = 0;
      
      // 根据碰撞边确定震动方向 - 使用1像素的边界值与ensurePieceInBounds保持一致
      const bounds = calculatePieceBounds(piece);
      const safeMargin = 1; // 使用与ensurePieceInBounds相同的边界值
      if (bounds.minX <= safeMargin) shakeDirectionX = 1; // 碰左边，向右震动
      else if (bounds.maxX >= canvas.width - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动
      
      if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
      else if (bounds.maxY >= canvas.height - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动
      
      // 如果没有确定方向，根据移动速度判断
      if (shakeDirectionX === 0 && Math.abs(dx) > Math.abs(dy)) shakeDirectionX = -Math.sign(dx);
      if (shakeDirectionY === 0 && Math.abs(dy) > Math.abs(dx)) shakeDirectionY = -Math.sign(dy);
      
      // 如果依然没有方向，至少有一个默认方向
      if (shakeDirectionX === 0 && shakeDirectionY === 0) {
        shakeDirectionX = dx < 0 ? 1 : -1;
      }
      
      // 执行震动动画
      const shakeAnimation = () => {
        if (animationStep >= maxSteps || !canvasRef.current) return;
        
        // 计算震动位移
        const shakeX = shakeDirectionX * shakeAmount[animationStep];
        const shakeY = shakeDirectionY * shakeAmount[animationStep];
        
        // 应用震动位移
        dispatch({
          type: "UPDATE_PIECE_POSITION",
          payload: { index: pieceIndex, dx: shakeX, dy: shakeY },
        });
        
        // 安排下一次震动
        animationStep++;
        setTimeout(shakeAnimation, 30); // 每次震动间隔30ms，实现快速震动效果
      };
      
      // 开始震动动画
      setTimeout(shakeAnimation, 10); // 短暂延迟后开始震动
    }
    
    // 设置新的拖拽起始点，这样下一次移动事件中的dx/dy会基于最新位置计算
    if (!hitBoundary) {
      dispatch({ type: "SET_DRAGGING_PIECE", payload: {
        index: state.draggingPiece.index,
        startX: x,
        startY: y,
      }});
      
      // 更新磁吸感应
      if (state.selectedPiece !== null && state.originalPositions) {
        const pieceIndex = state.selectedPiece;
        const piece = state.puzzle[pieceIndex];
        const originalPiece = state.originalPositions[pieceIndex];
        
        // 计算当前拼图中心点和目标位置中心点
        const pieceCenter = calculateCenter(piece.points);
        const originalCenter = calculateCenter(originalPiece.points);
        
        // 检查是否接近目标位置
        if (pieceCenter && originalCenter) {
          const magnetThreshold = 50; // 增大磁吸范围
          const dx = pieceCenter.x - originalCenter.x;
          const dy = pieceCenter.y - originalCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果拼图接近正确位置，应用磁吸效果
          if (distance < magnetThreshold) {
            // 计算磁吸力 - 距离越近，吸力越大
            const magnetStrength = 0.15; // 磁吸强度因子
            const attractionFactor = 1 - (distance / magnetThreshold); // 0到1之间的值
            const attractionX = -dx * attractionFactor * magnetStrength;
            const attractionY = -dy * attractionFactor * magnetStrength;
            
            // 应用磁吸力
            if (Math.abs(attractionX) > 0.1 || Math.abs(attractionY) > 0.1) {
              dispatch({
                type: "UPDATE_PIECE_POSITION",
                payload: { index: pieceIndex, dx: attractionX, dy: attractionY },
              });
              
              // 更新拖动起始点，确保下一次移动计算正确
              dispatch({
                type: "SET_DRAGGING_PIECE",
                payload: { 
                  index: pieceIndex,
                  startX: x,
                  startY: y
                },
              });
            }
          }
        }
      }
    }
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
              
              // 使用纯色填充，保持边缘清晰
              const fillColor = "rgba(255,211, 101, 0.8)"; // 游戏完成后的填充颜色
              completeCtx.fillStyle = fillColor;
              // 不使用模糊阴影
              completeCtx.shadowColor = "transparent";
              completeCtx.shadowBlur = 0;
              completeCtx.fill();
              
              // 添加微妙的外发光效果
              completeCtx.save();
              completeCtx.shadowColor = "rgba(255,211, 101, 0.8)"; // 完成后外发光颜色
              completeCtx.shadowBlur = 15;
              completeCtx.shadowOffsetX = 0;
              completeCtx.shadowOffsetY = 0;
              completeCtx.strokeStyle = "rgba(255,211, 101, 0.8)"; // 完成后外发光描边颜色
              completeCtx.lineWidth = 5;
              completeCtx.stroke();
              completeCtx.restore();
              
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
        // 检测设备和方向
        const ua = navigator.userAgent;
        const isIPhone = /iPhone/i.test(ua);
        const isAndroid = /Android/i.test(ua);
        const isMobile = isIPhone || isAndroid;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        console.log(`方向变化: 移动=${isMobile}, 竖屏=${isPortrait}, 宽度=${window.innerWidth}, 高度=${window.innerHeight}`);
        
        // 先调用常规的resize处理
        handleResize();
        
        // 对于移动设备，添加额外检查和处理
        if (isMobile) {
          setTimeout(() => {
            console.log('移动设备方向变化后额外检查');
            
            // 如果是横屏模式，应用横屏特定的布局
            if (!isPortrait) {
              console.log('检测到横屏模式，应用横屏优化布局');
              // 在横屏模式下，重新设置画布大小并更新位置
              setInitialCanvasSize();
              // 强制更新位置计算，确保正确利用宽屏空间
              setTimeout(() => updatePositions(), 100);
            } else {
              // 竖屏模式
              console.log('检测到竖屏模式，应用竖屏标准布局');
              setInitialCanvasSize();
            }
          }, 500);
        }
      }, 300) as any;
    };
    
    // 添加键盘事件监听器，用于切换调试元素显示
    const handleKeyDown = (e: KeyboardEvent) => {
      // F10键 (keyCode 121)
      if (e.key === 'F10' || e.keyCode === 121) {
        e.preventDefault(); // 防止浏览器默认行为
        setShowDebugElements(prev => !prev); // 切换调试元素显示状态
        console.log(`调试元素显示状态切换为: ${!showDebugElements}`);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // 特别监听方向变化
    window.addEventListener('orientationchange', handleOrientationChange);
    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown);
    
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
      window.removeEventListener('keydown', handleKeyDown);
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

      // 如果没有找到，使用更宽松的距离检测
      if (clickedPieceIndex === -1) {
        const hitDistance = 30 // 增加触摸容差，比鼠标点击的容差更大
        for (let i = state.puzzle.length - 1; i >= 0; i--) {
          // 跳过已完成的拼图，不允许拖拽
          if (state.completedPieces.includes(i)) continue

          const piece = state.puzzle[i]
          const center = calculateCenter(piece.points)
          const dx = center.x - touchX
          const dy = center.y - touchY
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 如果触摸位置在拼图中心附近，也算作点击
          if (distance < hitDistance * 2) {
            clickedPieceIndex = i
            break
          }
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
  
  // 触摸移动事件处理
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // 防止页面滚动
    if (!state.draggingPiece || !state.puzzle) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    
    // 处理多点触摸旋转
    if (e.touches.length >= 2 && state.selectedPiece !== null) {
      // 多点触摸 - 处理旋转
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const touch1X = touch1.clientX - rect.left
      const touch1Y = touch1.clientY - rect.top
      const touch2X = touch2.clientX - rect.left
      const touch2Y = touch2.clientY - rect.top

      const currentAngle = calculateAngle(touch1X, touch1Y, touch2X, touch2Y)
      if (touchStartAngle !== 0) {
        const rotationChange = currentAngle - touchStartAngle

        // 只有当旋转变化超过阈值时才应用旋转
        if (Math.abs(rotationChange) > 5) {
          const isClockwise = rotationChange > 0
          rotatePiece(isClockwise)
          
          // 播放旋转音效
          playRotateSound()
          
          // 更新开始角度
          setTouchStartAngle(currentAngle)
        }
      }
    } else if (e.touches.length === 1) {
      // 单点触摸 - 处理拖动
      const touch = e.touches[0]
      const touchX = touch.clientX - rect.left
      const touchY = touch.clientY - rect.top

      // 使用上一次触摸位置计算移动距离
      if (lastTouchRef.current) {
        const dx = touchX - lastTouchRef.current.x
        const dy = touchY - lastTouchRef.current.y

        // 获取当前拖动的拼图
        const piece = state.puzzle[state.draggingPiece.index];
        
        // 使用GameContext提供的统一边界处理函数，确保所有拼图使用完全相同的边界设置
        const { constrainedDx, constrainedDy, hitBoundary } = ensurePieceInBounds(piece, dx, dy, 1);
        
        // 更新拼图位置
        dispatch({
          type: "UPDATE_PIECE_POSITION",
          payload: { index: state.draggingPiece.index, dx: constrainedDx, dy: constrainedDy },
        });

        // 如果触碰到边界，立即停止拖拽并添加震动动画
        if (hitBoundary) {
          // 只有在碰到画布边缘时才停止拖拽
          dispatch({ type: "SET_DRAGGING_PIECE", payload: null });
          setIsDragging(false);
          
          // 保存碰撞位置基准点
          const hitPiece = { ...piece };
          const pieceIndex = state.draggingPiece.index;
          
          // 震动动画序列 - 增大震动幅度以使回弹更明显
          let animationStep = 0;
          const maxSteps = 6; // 震动次数
          // 增大震动幅度，使回弹效果更明显
          const shakeAmount = [8, -6, 5, -4, 3, -2]; // 震动幅度序列
          
          // 确定震动方向 - 根据碰撞面决定
          let shakeDirectionX = 0;
          let shakeDirectionY = 0;
          
          // 根据碰撞边确定震动方向 - 使用1像素的边界值
          const bounds = calculatePieceBounds(piece);
          const safeMargin = 1; // 使用统一的边界值
          if (bounds.minX <= safeMargin) shakeDirectionX = 1; // 碰左边，向右震动
          else if (bounds.maxX >= canvas.width - safeMargin) shakeDirectionX = -1; // 碰右边，向左震动
          
          if (bounds.minY <= safeMargin) shakeDirectionY = 1; // 碰上边，向下震动
          else if (bounds.maxY >= canvas.height - safeMargin) shakeDirectionY = -1; // 碰下边，向上震动
          
          // 如果没有确定方向，根据移动速度判断
          if (shakeDirectionX === 0 && Math.abs(dx) > Math.abs(dy)) shakeDirectionX = -Math.sign(dx);
          if (shakeDirectionY === 0 && Math.abs(dy) > Math.abs(dx)) shakeDirectionY = -Math.sign(dy);
          
          // 如果依然没有方向，至少有一个默认方向
          if (shakeDirectionX === 0 && shakeDirectionY === 0) {
            shakeDirectionX = dx < 0 ? 1 : -1;
          }
          
          // 执行震动动画
          const shakeAnimation = () => {
            if (animationStep >= maxSteps || !canvasRef.current) return;
            
            // 计算震动位移
            const shakeX = shakeDirectionX * shakeAmount[animationStep];
            const shakeY = shakeDirectionY * shakeAmount[animationStep];
            
            // 应用震动位移
            dispatch({
              type: "UPDATE_PIECE_POSITION",
              payload: { index: pieceIndex, dx: shakeX, dy: shakeY },
            });
            
            // 安排下一次震动
            animationStep++;
            setTimeout(shakeAnimation, 30); // 每次震动间隔30ms，实现快速震动效果
          };
          
          // 开始震动动画
          setTimeout(shakeAnimation, 10); // 短暂延迟后开始震动
        } else {
          // 更新最后触摸位置
          lastTouchRef.current = { x: touchX, y: touchY };
          
          // 更新磁吸感应
          if (state.selectedPiece !== null && state.originalPositions) {
            const pieceIndex = state.selectedPiece;
            const piece = state.puzzle[pieceIndex];
            const originalPiece = state.originalPositions[pieceIndex];
            
            // 计算当前拼图中心点和目标位置中心点
            const pieceCenter = calculateCenter(piece.points);
            const originalCenter = calculateCenter(originalPiece.points);
            
            // 检查是否接近目标位置
            if (pieceCenter && originalCenter) {
              const magnetThreshold = 50; // 磁吸范围
              const dx = pieceCenter.x - originalCenter.x;
              const dy = pieceCenter.y - originalCenter.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // 应用磁吸效果
              if (distance < magnetThreshold) {
                const magnetStrength = 0.15;
                const attractionFactor = 1 - (distance / magnetThreshold);
                const attractionX = -dx * attractionFactor * magnetStrength;
                const attractionY = -dy * attractionFactor * magnetStrength;
                
                if (Math.abs(attractionX) > 0.1 || Math.abs(attractionY) > 0.1) {
                  dispatch({
                    type: "UPDATE_PIECE_POSITION",
                    payload: { index: pieceIndex, dx: attractionX, dy: attractionY },
                  });
                }
              }
            }
          }
        }
      } else {
        // 首次触摸，记录位置
        lastTouchRef.current = { x: touchX, y: touchY };
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
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white z-10" 
            style={{
              fontSize: isAndroid ? '10px' : '12px', // 安卓设备使用更小的字体
              lineHeight: '1.2',
              maxWidth: '90%',
              textAlign: 'center',
              fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif", // 固定字体
              WebkitTextSizeAdjust: '100%', // 防止iOS和安卓字体自动调整大小不一致
              MozTextSizeAdjust: '100%',
              textSizeAdjust: '100%',
              padding: isAndroid ? '2px 8px' : '4px 12px', // 安卓设备减小内边距
            }}
          >
            {state.completedPieces.length} / {state.puzzle?.length || 0} 块拼图已完成
          </div>
        )}
      </div>
    </div>
  )
}
