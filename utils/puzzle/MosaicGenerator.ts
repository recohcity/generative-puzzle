import { Point } from "@generative-puzzle/game-core";
import { DIFFICULTY_SETTINGS } from "./cutGeneratorConfig";

export class MosaicGenerator {
  /**
   * 生成马赛克随机碎裂拼图片段
   * 
   * @param shape 原始形状顶点数组
   * @param difficultyLevel 难度等级 (1-8)
   * @param shapeType 形状类型 ("polygon" | "cloud" | "jagged")
   * @returns 分割后的多边形碎片数组 (Point[][])
   */
  static generate(shape: Point[], difficultyLevel: number, shapeType?: string): Point[][] {
    const actualShape = (shapeType && shapeType !== "polygon")
      ? this.discretizeShape(shape)
      : shape;

    const bounds = this.getBounds(actualShape);
    const settings = DIFFICULTY_SETTINGS[difficultyLevel as keyof typeof DIFFICULTY_SETTINGS];
    const pieceRange = settings?.pieceRange || { min: difficultyLevel * 2, max: difficultyLevel * 4 };
    const targetCount = pieceRange.max;

    console.log(`[MosaicGenerator] 难度级别: ${difficultyLevel}, 期望碎片量: ${pieceRange.min}-${pieceRange.max}, 目标生成: ${targetCount}`);

    // 生成种子点
    const seeds = this.generateSeeds(actualShape, bounds, targetCount);

    // 基于 Voronoi 半平面裁剪生成多边形碎片
    const pieces: Point[][] = [];
    const minArea = 10;

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      let cell = [...actualShape];

      for (let j = 0; j < seeds.length; j++) {
        if (i === j) continue;
        const other = seeds[j];
        cell = this.clipPolygonByBisector(cell, seed, other);
        if (cell.length < 3) break;
      }

      if (cell.length >= 3 && Math.abs(this.getSignedArea(cell)) >= minArea) {
        const markedCell = cell.map(p => ({ ...p, isOriginal: false }));
        pieces.push(markedCell);
      }
    }

    // 兜底防护：如果分割失败，返回原始形状
    if (pieces.length === 0) {
      console.warn("[MosaicGenerator] 分割异常，返回原形状兜底");
      return [shape];
    }

    console.log(`[MosaicGenerator] 成功生成 ${pieces.length} 块马赛克拼图碎片`);
    return pieces;
  }

  /**
   * 离散化非多边形形状，提高边缘切割质量
   */
  private static discretizeShape(shape: Point[]): Point[] {
    if (shape.length < 3) return shape;
    const result: Point[] = [];
    const STEPS = 15;

    for (let i = 0; i < shape.length; i++) {
      const p0 = shape[i];
      const p1 = shape[(i + 1) % shape.length];
      const p2 = shape[(i + 2) % shape.length];

      const startX = (p0.x + p1.x) / 2;
      const startY = (p0.y + p1.y) / 2;
      const endX = (p1.x + p2.x) / 2;
      const endY = (p1.y + p2.y) / 2;

      for (let t = 0; t <= STEPS; t++) {
        if (t === STEPS && i < shape.length - 1) continue;
        const ratio = t / STEPS;
        const inv = 1 - ratio;
        const x = inv * inv * startX + 2 * inv * ratio * p1.x + ratio * ratio * endX;
        const y = inv * inv * startY + 2 * inv * ratio * p1.y + ratio * ratio * endY;

        if (result.length > 0) {
          const last = result[result.length - 1];
          if (Math.hypot(x - last.x, y - last.y) < 0.01) continue;
        }
        result.push({ x, y });
      }
    }
    return result;
  }

  /**
   * 种子点采样（泊松盘 / 最小距离限制的拒绝采样）
   */
  private static generateSeeds(
    shape: Point[],
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    count: number
  ): Point[] {
    const seeds: Point[] = [];
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const area = Math.abs(this.getSignedArea(shape));
    const minDistance = Math.sqrt(area / (count * 1.8));

    const MAX_ATTEMPTS = count * 200;
    let attempts = 0;

    while (seeds.length < count && attempts < MAX_ATTEMPTS) {
      attempts++;
      const px = bounds.minX + Math.random() * width;
      const py = bounds.minY + Math.random() * height;
      const candidate = { x: px, y: py };

      if (!this.isPointInPolygon(candidate, shape)) continue;

      let tooClose = false;
      for (const s of seeds) {
        if (Math.hypot(s.x - candidate.x, s.y - candidate.y) < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        seeds.push(candidate);
      }
    }

    // 如果拒绝采样未填满数量，放宽距离补齐
    if (seeds.length < count) {
      attempts = 0;
      while (seeds.length < count && attempts < 1000) {
        attempts++;
        const candidate = {
          x: bounds.minX + Math.random() * width,
          y: bounds.minY + Math.random() * height,
        };
        if (this.isPointInPolygon(candidate, shape)) {
          seeds.push(candidate);
        }
      }
    }

    return seeds;
  }

  /**
   * 使用种子点 A 和 B 的垂直平分线裁剪多边形 (Sutherland-Hodgman Line Clipping)
   * 保留靠近 seedA 的半平面
   */
  private static clipPolygonByBisector(polygon: Point[], seedA: Point, seedB: Point): Point[] {
    if (polygon.length < 3) return [];

    const mx = (seedA.x + seedB.x) / 2;
    const my = (seedA.y + seedB.y) / 2;
    const nx = seedB.x - seedA.x;
    const ny = seedB.y - seedA.y;

    // 半平面判定方程： (P.x - mx) * nx + (P.y - my) * ny <= 0 (靠近 seedA)
    const isInside = (p: Point) => (p.x - mx) * nx + (p.y - my) * ny <= 0;

    const output: Point[] = [];
    let s = polygon[polygon.length - 1];

    for (let i = 0; i < polygon.length; i++) {
      const e = polygon[i];

      const sInside = isInside(s);
      const eInside = isInside(e);

      if (eInside) {
        if (!sInside) {
          const ip = this.lineBisectorIntersection(s, e, mx, my, nx, ny);
          if (ip) output.push(ip);
        }
        output.push(e);
      } else if (sInside) {
        const ip = this.lineBisectorIntersection(s, e, mx, my, nx, ny);
        if (ip) output.push(ip);
      }
      s = e;
    }

    return output;
  }

  /**
   * 线段 (p1, p2) 与垂直平分线 (mx, my) (nx, ny) 的交点
   */
  private static lineBisectorIntersection(
    p1: Point,
    p2: Point,
    mx: number,
    my: number,
    nx: number,
    ny: number
  ): Point | null {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const denom = dx * nx + dy * ny;

    if (Math.abs(denom) < 1e-10) return null;

    const t = ((mx - p1.x) * nx + (my - p1.y) * ny) / denom;
    if (t < 0 || t > 1) return null;

    return {
      x: p1.x + t * dx,
      y: p1.y + t * dy,
    };
  }

  private static getBounds(points: Point[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  private static getSignedArea(points: Point[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return area / 2;
  }

  private static isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    const { x, y } = point;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
