/**
 * 六边形网格（蜂巢）切割生成器
 *
 * 网络类生成器：按难度档位推导期望块数 → 六边形边长 d（单元面积 = (3√3/2)d²），
 * 铺蜂窝中心网格（行距 1.5d、列距 √3d、奇数行偏移），生成所有单元的正六边形边
 * （共享边去重），以二次贝塞尔"直线"表示，复用 NetworkCutter 的 arrangement
 * 求交 / 面提取管线（cutShapeWithCurvesNetwork），产出被形状裁剪的蜂窝单元。
 *
 * 档位语义：difficultyLevel 为难度档位（1-8），内部按 DIFFICULTY_SETTINGS 的
 * pieceRange 推导期望块数；不足下限时逐级加密（边长 ×0.9）重试。
 */

import { Point } from "@generative-puzzle/game-core";
import { BezierCurve } from "./graph/BezierCurve";
import { NetworkCutter } from "./graph/NetworkCutter";
import { DIFFICULTY_SETTINGS } from "./cutGeneratorConfig";

export class HexGenerator {
  static readonly MAX_RETRIES = 6;

  static generate(shape: Point[], difficultyLevel: number): Point[][] {
    const settings = DIFFICULTY_SETTINGS[difficultyLevel as keyof typeof DIFFICULTY_SETTINGS];
    const pieceRange = settings?.pieceRange || { min: difficultyLevel * 2, max: difficultyLevel * 4 };

    const bounds = this.getBounds(shape);
    const area = Math.abs(this.getSignedArea(shape)) || 1;

    // 期望块数取档位上限（与放射/马赛克口径一致：8 档 → 30 块）；边缘截断补偿 0.6
    const targetCells = pieceRange.max;
    const d = Math.sqrt((2 * area) / (3 * Math.sqrt(3) * targetCells * 0.6));

    console.log(`[HexGenerator] 难度级别: ${difficultyLevel}, 期望拼图范围: ${pieceRange.min}-${pieceRange.max}, 单元边长: ${d.toFixed(1)}`);

    let lastShapes: Point[][] = [shape];
    let edge = d;
    for (let attempt = 0; attempt < HexGenerator.MAX_RETRIES; attempt++) {
      const curves = this.buildHexEdges(bounds, edge);
      const result = NetworkCutter.cutShapeWithCurvesNetwork(shape, curves);
      // 后过滤：跨边界单元的"形状外凸出片"（中心容差 5px 误保留）任一顶点在形状外 → 丢弃
      const inShape = (p: Point) => NetworkCutter.isPointInPolygon(p, shape, 1.0);
      const shapes = result.shapes.filter((f) => f.every(inShape));
      // 极小碎片合并：边缘被截断的六边形残余并入相邻块，避免"极细碎片难拾取"
      const hexArea = (3 * Math.sqrt(3) / 2) * edge * edge;
      const merged = this.mergeTinyShapes(shapes, hexArea, 0.25);
      lastShapes = merged;

      let totalArea = 0;
      for (const s of merged) totalArea += Math.abs(this.getSignedArea(s));
      const areaRatio = totalArea / area;
      const count = merged.length;

      if (count >= pieceRange.min && count <= Math.max(pieceRange.max * 1.6, pieceRange.max + 6) && areaRatio > 0.85 && areaRatio < 1.15) {
        console.log(`[HexGenerator] 成功: 生成 ${count} 块拼图 (期望 ${pieceRange.min}-${pieceRange.max}, 面积 ${(areaRatio * 100).toFixed(1)}%)`);
        return merged;
      }
      // 双向收敛：片数过多 → 放大单元；片数不足 → 加密网格
      if (count > Math.max(pieceRange.max * 1.6, pieceRange.max + 6)) edge *= 1.2;
      else edge *= 0.85;
    }
    console.error(`[HexGenerator] 重试失败，返回最后一次结果 (${lastShapes.length} 块)`);
    return lastShapes;
  }

  /**
   * 极小碎片合并：面积 < ratio × hexArea 的面片与共享边最长的相邻面片融合。
   * 规则网格裁剪不规则形状时，边缘六边形被边界截断成极细碎片（难拾取/难旋转），
   * 此步骤把残余并入邻居，让最终碎片面积可控。
   * 两个多边形共享一条几何边（顶点坐标一致、环绕方向相反），沿共享边拼接顶点环。
   */
  static mergeTinyShapes(shapes: Point[][], hexArea: number, ratio = 0.25): Point[][] {
    const EPS = 1e-6;
    const areaOf = (poly: Point[]): number => Math.abs(this.getSignedArea(poly));
    const threshold = hexArea * ratio;

    let result = shapes.map((s) => s.map((p) => ({ ...p })));

    // 共享边索引：规范化边键 → 该边出现的面片（面片索引, 边起点索引）
    const edgeIndex = new Map<string, { face: number; startIdx: number }[]>();
    const keyOf = (a: Point, b: Point): string => {
      const ax = a.x.toFixed(4), ay = a.y.toFixed(4), bx = b.x.toFixed(4), by = b.y.toFixed(4);
      return ax < bx || (ax === bx && ay <= by)
        ? `${ax},${ay}|${bx},${by}`
        : `${bx},${by}|${ax},${ay}`;
    };

    const buildIndex = () => {
      edgeIndex.clear();
      for (let f = 0; f < result.length; f++) {
        const poly = result[f];
        for (let i = 0; i < poly.length; i++) {
          const key = keyOf(poly[i], poly[(i + 1) % poly.length]);
          const list = edgeIndex.get(key);
          if (list) list.push({ face: f, startIdx: i });
          else edgeIndex.set(key, [{ face: f, startIdx: i }]);
        }
      }
    };

    // 循环合并直到没有低于阈值的面片
    for (let iter = 0; iter < 50; iter++) {
      buildIndex();
      // 找最小的小碎片
      let tinyFace = -1;
      let tinyArea = Infinity;
      for (let f = 0; f < result.length; f++) {
        const a = areaOf(result[f]);
        if (a < threshold && a < tinyArea) {
          tinyArea = a;
          tinyFace = f;
        }
      }
      if (tinyFace < 0) break;

      // 找共享边最长的邻居
      let best: { neighbor: number; aIdx: number; bIdx: number; edgeLen: number } | null = null;
      const poly = result[tinyFace];
      for (let i = 0; i < poly.length; i++) {
        const key = keyOf(poly[i], poly[(i + 1) % poly.length]);
        const list = edgeIndex.get(key) ?? [];
        for (const e of list) {
          if (e.face === tinyFace) continue;
          const edgeLen = Math.hypot(
            poly[(i + 1) % poly.length].x - poly[i].x,
            poly[(i + 1) % poly.length].y - poly[i].y,
          );
          if (!best || edgeLen > best.edgeLen) {
            best = { neighbor: e.face, aIdx: i, bIdx: e.startIdx, edgeLen };
          }
        }
      }
      if (!best) {
        // 无共享边邻居：无法合并（理论上不会发生），移除该面片避免死循环
        result.splice(tinyFace, 1);
        continue;
      }

      const A = result[tinyFace];
      const B = result[best.neighbor];
      let aIdx = best.aIdx;
      let bIdx = best.bIdx;
      const n = A.length;
      const m = B.length;

      // 方向归一化：保证共享边在两环中方向相反（A: aIdx→aIdx+1，B: bIdx+1→bIdx）
      // 即 A[aIdx] == B[(bIdx+1)%m] 且 A[(aIdx+1)%n] == B[bIdx]
      if (Math.hypot(A[aIdx].x - B[bIdx].x, A[aIdx].y - B[bIdx].y) < EPS) {
        bIdx = (bIdx + 1) % m; // 同向 → 反转 B 共享边起点
      }

      // 合并环：A[0..aIdx]（含共享端点1）→ B 跳过共享两端点后剩余段 → A[aIdx+1..n-1]（含共享端点2）
      const merged: Point[] = [];
      for (let i = 0; i <= aIdx; i++) merged.push(A[i]);
      for (let j = 2; j < m; j++) merged.push(B[(bIdx + j) % m]);
      for (let i = aIdx + 1; i < n; i++) merged.push(A[i]);
      // 去除相邻重复顶点（数值噪声）
      const clean: Point[] = [];
      for (const p of merged) {
        const last = clean[clean.length - 1];
        if (last && Math.hypot(p.x - last.x, p.y - last.y) < EPS) continue;
        clean.push(p);
      }
      if (clean.length < 3) {
        // 合并退化（理论不出现）：删除两个面片避免死循环
        result.splice(Math.max(tinyFace, best.neighbor), 1);
        result.splice(Math.min(tinyFace, best.neighbor), 1);
        continue;
      }

      // 替换两个面片为一个合并面片
      const idxA = tinyFace, idxB = best.neighbor;
      result = result.filter((_, idx) => idx !== idxA && idx !== idxB);
      result.push(clean);
    }

    return result;
  }

  /**
   * 铺蜂窝中心网格，生成所有单元正六边形边（共享边去重），
   * 每条边以 BezierCurve(p0, mid, p2) 直线表示。
   */
  private static buildHexEdges(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    d: number,
  ): BezierCurve[] {
    const rowH = d * 1.5;          // 行距
    const colW = d * Math.sqrt(3); // 列距
    const pad = d * 2;             // 外扩，覆盖边缘单元
    const curves: BezierCurve[] = [];
    const seen = new Set<string>();

    const addEdge = (a: Point, b: Point) => {
      const key = a.x < b.x || (a.x === b.x && a.y <= b.y)
        ? `${a.x.toFixed(2)},${a.y.toFixed(2)}|${b.x.toFixed(2)},${b.y.toFixed(2)}`
        : `${b.x.toFixed(2)},${b.y.toFixed(2)}|${a.x.toFixed(2)},${a.y.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      curves.push(new BezierCurve(a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, b));
    };

    let row = 0;
    for (let cy = bounds.minY - pad; cy <= bounds.maxY + pad; cy += rowH, row++) {
      const offsetX = row % 2 === 1 ? colW / 2 : 0;
      for (let cx = bounds.minX - pad + offsetX; cx <= bounds.maxX + pad; cx += colW) {
        const verts: Point[] = [];
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI / 6) + (k * Math.PI) / 3;
          verts.push({ x: cx + Math.cos(ang) * d, y: cy + Math.sin(ang) * d });
        }
        for (let k = 0; k < 6; k++) addEdge(verts[k], verts[(k + 1) % 6]);
      }
    }
    return curves;
  }

  private static getBounds(shape: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
    const b = { minX: 1e18, minY: 1e18, maxX: -1e18, maxY: -1e18 };
    for (const p of shape) {
      if (p.x < b.minX) b.minX = p.x;
      if (p.x > b.maxX) b.maxX = p.x;
      if (p.y < b.minY) b.minY = p.y;
      if (p.y > b.maxY) b.maxY = p.y;
    }
    return b;
  }

  private static getSignedArea(shape: Point[]): number {
    let s = 0;
    for (let i = 0, n = shape.length; i < n; i++) {
      const j = (i + 1) % n;
      s += shape[i].x * shape[j].y - shape[j].x * shape[i].y;
    }
    return s / 2;
  }
}
