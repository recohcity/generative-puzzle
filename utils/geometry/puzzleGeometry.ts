// 使用统一的Point类型定义
import type { Point } from '@/types/puzzleTypes';

export const calculateCenter = (points: Point[]) => {
  return points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  )
}

/**
 * 点在多边形内检测算法 - 射线投射法优化版本
 * 
 * 算法原理：
 * 1. 边界框预检查：快速排除明显在外部的点
 * 2. 射线投射：从目标点向右发射射线，计算与多边形边的交点数
 * 3. 奇偶规则：交点数为奇数则点在内部，偶数则在外部
 * 4. 边界处理：特殊处理点在多边形边上的情况
 * 
 * 性能优化：
 * - 边界框预检查可以快速排除大部分情况
 * - 避免不必要的浮点运算
 * - 特殊处理共线情况
 * 
 * @param x 目标点X坐标
 * @param y 目标点Y坐标  
 * @param polygon 多边形顶点数组
 * @returns 点是否在多边形内部（包括边界）
 */
export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  // 步骤1：边界框预检查优化
  // 计算多边形的最小外接矩形，快速排除明显在外部的点
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const point = polygon[i];
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  
  // 如果点在边界框外，直接返回false（性能优化）
  if (x < minX || x > maxX || y < minY || y > maxY) {
    return false;
  }

  // 步骤2：边界点检测辅助函数
  // 检查点是否恰好在线段上（边界情况处理）
  const onSegment = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => {
    // 首先检查三点是否共线（叉积为0）
    if (((qy - py) * (rx - qx) - (qx - px) * (ry - qy)) !== 0) return false;
    
    // 然后检查点是否在线段的边界框内
    return (
      rx <= Math.max(px, qx) && rx >= Math.min(px, qx) &&
      ry <= Math.max(py, qy) && ry >= Math.min(py, qy)
    );
  };

  // 步骤3：射线投射算法主循环
  // 从目标点向右发射射线，计算与多边形边的交点数
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    // 步骤3.1：检查点是否在当前边上
    if (onSegment(xi, yi, xj, yj, x, y)) {
      return true; // 点在边界上，视为内部
    }
    
    // 步骤3.2：射线相交检测
    // 检查从点向右的射线是否与当前边相交
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside; // 奇偶规则：每次相交切换内外状态
  }
  return inside;
}

export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): {x: number, y: number} {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  const nx = x - cx;
  const ny = y - cy;
  
  const rotatedX = nx * cos - ny * sin;
  const rotatedY = nx * sin + ny * cos;
  
  return {
    x: rotatedX + cx,
    y: rotatedY + cy
  };
}

export function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

export function calculatePieceBounds(piece: { points: Point[] }): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number; centerX: number; centerY: number } {
  const xs = piece.points.map(p => p.x)
  const ys = piece.points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width  = maxX - minX
  const height = maxY - minY
  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  }
 }