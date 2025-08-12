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

export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  // 快速边界框预检查 - 大幅提升性能
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const point = polygon[i];
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  
  // 如果点在边界框外，直接返回false
  if (x < minX || x > maxX || y < minY || y > maxY) {
    return false;
  }

  // Helper function to check if a point is on a line segment
  const onSegment = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => {
    // Check if r is collinear with p and q
    if (((qy - py) * (rx - qx) - (qx - px) * (ry - qy)) !== 0) return false;
    
    // Check if r is within the bounding box of segment pq
    return (
      rx <= Math.max(px, qx) && rx >= Math.min(px, qx) &&
      ry <= Math.max(py, qy) && ry >= Math.min(py, qy)
    );
  };

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    // Check if the point is on the current segment
    if (onSegment(xi, yi, xj, yj, x, y)) {
      return true; // Point is on the boundary
    }
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
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