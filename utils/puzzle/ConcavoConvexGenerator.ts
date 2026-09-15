import { Point } from "@generative-puzzle/game-core";
import { MosaicGenerator } from "./MosaicGenerator";

/**
 * 凹凸咬合切割生成器（Concavo-Convex / 曲边拼图）
 *
 * 设计目标：在"马赛克碎裂"（Voronoi 剖分）基础上做切割后处理，
 * 把碎片之间的内部共享边替换为二次贝塞尔曲边，形成凸凹咬合：
 *
 *   马赛克碎裂 → 共享边索引 → 内部边替换曲边 → 凸凹咬合
 *
 * 核心保证：
 * - 只动"内部共享边"（端点哈希出现 2 次的边），外轮廓边（出现 1 次）保持直线
 * - 相邻碎片共用同一条贝塞尔曲线（同一控制点、同一份采样点列，一方正序一方逆序）
 *   → 共享边顶点字节级一致，天然凸凹配对、无缝咬合
 * - 马赛克 cell 为凸多边形（半平面交集），控制点取中垂线方向偏移（边长 10%~25%）
 *   → 替换后碎片仍是简单多边形，不会自交
 * - 面积守恒：曲线一侧碎片面积增加、相邻碎片面积减少，总量不变
 */

interface SharedEdgeOccurrence {
  pieceIndex: number;
  edgeIndex: number;
}

interface SharedEdgeEntry {
  count: number;
  occurrences: SharedEdgeOccurrence[];
}

interface ReplaceOp {
  pieceIndex: number;
  edgeIndex: number;
  insert: Point[];
}

/** 端点坐标吸附精度（与马赛克裁剪精度同量级，用于共享边匹配） */
const SNAP = 1e-6;
const snap = (v: number) => Math.round(v / SNAP) * SNAP;

/** 共享边 key：两端点坐标排序后拼接，方向无关 */
const edgeKey = (a: Point, b: Point): string => {
  const ax = snap(a.x);
  const ay = snap(a.y);
  const bx = snap(b.x);
  const by = snap(b.y);
  return ax < bx || (ax === bx && ay <= by)
    ? `${ax},${ay}|${bx},${by}`
    : `${bx},${by}|${ax},${ay}`;
};

/** 在 poly 的第 e 条边（poly[e] → poly[e+1]）中间插入点列，替换原直线边 */
const replaceEdge = (poly: Point[], e: number, insert: Point[]): void => {
  if (insert.length === 0) return;
  poly.splice(e + 1, 0, ...insert);
};

export class ConcavoConvexGenerator {
  /** 曲线采样段数（越多越平滑，视觉与性能折中） */
  private static readonly CURVE_SEGMENTS = 14;

  /** 控制点偏移比例范围（相对边长） */
  private static readonly OFFSET_MIN = 0.1;
  private static readonly OFFSET_MAX = 0.25;

  /**
   * 生成凹凸咬合拼图片段
   * @param shape 原始形状顶点数组
   * @param difficultyLevel 难度等级 (1-8)
   * @param shapeType 形状类型 ("polygon" | "cloud" | "jagged")
   * @returns 曲边化后的多边形碎片数组
   */
  static generate(shape: Point[], difficultyLevel: number, shapeType?: string): Point[][] {
    // 1. 基于马赛克碎裂：先得到凸多边形碎片
    const pieces = MosaicGenerator.generate(shape, difficultyLevel, shapeType);

    // 兜底：碎片不足两块（无法形成共享边）或生成退化，直接返回
    if (pieces.length < 2) {
      console.warn("[ConcavoConvexGenerator] 碎片数量不足，跳过曲边化");
      return pieces;
    }

    // 2. 共享边索引：端点哈希统计出现次数与所属碎片
    const edgeMap = new Map<string, SharedEdgeEntry>();
    for (let i = 0; i < pieces.length; i++) {
      const poly = pieces[i];
      for (let e = 0; e < poly.length; e++) {
        const key = edgeKey(poly[e], poly[(e + 1) % poly.length]);
        let entry = edgeMap.get(key);
        if (!entry) {
          entry = { count: 0, occurrences: [] };
          edgeMap.set(key, entry);
        }
        entry.count++;
        entry.occurrences.push({ pieceIndex: i, edgeIndex: e });
      }
    }

    // 3. 深拷贝碎片，用于替换（不污染 MosaicGenerator 的结果）
    const result: Point[][] = pieces.map((poly) => poly.map((p) => ({ ...p })));

    // 4. 收集所有曲边替换操作
    const ops: ReplaceOp[] = [];
    for (const entry of edgeMap.values()) {
      if (entry.count !== 2) continue; // 只替换内部共享边
      const [o1, o2] = entry.occurrences;
      if (o1.pieceIndex === o2.pieceIndex) continue; // 同一碎片内的重复边（不应出现）

      const poly1 = pieces[o1.pieceIndex];
      const a = poly1[o1.edgeIndex];
      const b = poly1[(o1.edgeIndex + 1) % poly1.length];

      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1e-6) continue;

      // 控制点：中垂线方向随机偏移（正负随机 → 凸凹方向随机，两侧互补咬合）
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = (b.x - a.x) / len;
      const dy = (b.y - a.y) / len;
      const nx = -dy;
      const ny = dx;
      const side = Math.random() < 0.5 ? 1 : -1;
      const offset =
        len *
        (ConcavoConvexGenerator.OFFSET_MIN +
          Math.random() * (ConcavoConvexGenerator.OFFSET_MAX - ConcavoConvexGenerator.OFFSET_MIN)) *
        side;
      const ctrl = { x: mx + nx * offset, y: my + ny * offset };

      // 沿 A→B 采样二次贝塞尔（标记 isOriginal:false，渲染层按直线连接采样点）
      const curve = ConcavoConvexGenerator.sampleCurve(a, b, ctrl);
      // 去掉两端点（A、B 本身是碎片顶点），只插入中间点；另一碎片用逆序
      const insertForward = curve.slice(1, curve.length - 1);
      const insertReverse = insertForward.slice().reverse();

      ops.push({ pieceIndex: o1.pieceIndex, edgeIndex: o1.edgeIndex, insert: insertForward });
      ops.push({ pieceIndex: o2.pieceIndex, edgeIndex: o2.edgeIndex, insert: insertReverse });
    }

    // 5. 分组执行替换：同一碎片内按边索引降序插入（降序保证插入不影响更小索引）
    const byPiece = new Map<number, ReplaceOp[]>();
    for (const op of ops) {
      let list = byPiece.get(op.pieceIndex);
      if (!list) {
        list = [];
        byPiece.set(op.pieceIndex, list);
      }
      list.push(op);
    }
    let replacedCount = 0;
    for (const list of byPiece.values()) {
      list.sort((x, y) => y.edgeIndex - x.edgeIndex);
      for (const op of list) {
        replaceEdge(result[op.pieceIndex], op.edgeIndex, op.insert);
        replacedCount++;
      }
    }

    if (replacedCount === 0) {
      console.warn("[ConcavoConvexGenerator] 未找到内部共享边，返回原碎片");
    } else {
      console.log(`[ConcavoConvexGenerator] 曲边替换完成: ${replacedCount} 条内部共享边`);
    }

    return result;
  }

  /** 二次贝塞尔曲线采样点列（沿 A→B） */
  private static sampleCurve(a: Point, b: Point, ctrl: Point): Point[] {
    const points: Point[] = [];
    const segments = ConcavoConvexGenerator.CURVE_SEGMENTS;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const inv = 1 - t;
      const x = inv * inv * a.x + 2 * inv * t * ctrl.x + t * t * b.x;
      const y = inv * inv * a.y + 2 * inv * t * ctrl.y + t * t * b.y;
      points.push({ x, y, isOriginal: false });
    }
    return points;
  }
}
