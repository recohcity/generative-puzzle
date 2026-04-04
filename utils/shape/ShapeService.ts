import { ShapeType, Point, CanvasSize } from "@generative-puzzle/game-core";
import { OptimizedShapeGenerator } from "./OptimizedShapeGenerator";

/**
 * 形状服务
 * 封装形状生成、适配和变换的核心逻辑，从 GameContext 中剥离上帝对象逻辑
 */
export class ShapeService {
  private static readonly DEFAULT_CANVAS_SIZE: CanvasSize = { width: 800, height: 600 };

  /**
   * 生成并适配形状
   * @param shapeType 形状类型
   * @param canvasSize 画布尺寸（可选，默认使用 DEFAULT_CANVAS_SIZE）
   * @returns 生成的形状点数组和实际使用的画布尺寸
   */
  static generateShape(
    shapeType: ShapeType,
    canvasSize?: CanvasSize | null
  ): { shape: Point[]; actualCanvasSize: CanvasSize } {
    const actualCanvasSize = canvasSize || this.DEFAULT_CANVAS_SIZE;

    try {
      const shape = OptimizedShapeGenerator.generateOptimizedShape(
        shapeType,
        actualCanvasSize
      );

      if (shape.length === 0) {
        console.error("[ShapeService] 生成的形状没有点");
        return { shape: [], actualCanvasSize };
      }

      return { shape, actualCanvasSize };
    } catch (error) {
      console.error("[ShapeService] 形状生成失败:", error);
      return { shape: [], actualCanvasSize };
    }
  }

  /**
   * 计算形状边界
   * @param shape 形状点数组
   */
  static getShapeBounds(shape: Point[]) {
    if (shape.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, centerX: 0, centerY: 0, diameter: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const point of shape) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }

    return {
      minX, maxX, minY, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      diameter: Math.max(maxX - minX, maxY - minY)
    };
  }
}
