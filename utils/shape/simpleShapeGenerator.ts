/**
 * 简化的形状生成器
 * 基于成功实现的最小化版本
 */

import type { Point } from "@/types/puzzleTypes";

/**
 * 生成简单的多边形形状
 */
export function generateSimpleShape(): Point[] {
  // 生成一个简单的正方形
  const size = 200;
  const centerX = 320;
  const centerY = 320;
  
  return [
    { x: centerX - size/2, y: centerY - size/2 },
    { x: centerX + size/2, y: centerY - size/2 },
    { x: centerX + size/2, y: centerY + size/2 },
    { x: centerX - size/2, y: centerY + size/2 }
  ];
}