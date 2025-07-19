/**
 * 通用类型定义 - 项目中共享的基础数据类型
 */

/**
 * 二维坐标点
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 画布尺寸
 */
export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * 矩形区域
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 边界框
 */
export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 颜色定义
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * 变换矩阵
 */
export interface Transform {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  rotation: number;
}