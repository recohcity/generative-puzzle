import type { Point } from "@generative-puzzle/game-core";

/**
 * 增量顺序切割器（Incremental Cutter）
 *
 * 架构：逐刀增量切割 —— 每刀生成一条"贯穿曲线"（p0/p2 在形状外、二次贝塞尔），
 * 只对当前最大碎片求交，验证恰好 2 个交点后一分为二。
 *
 * 与旧批量架构（先生成全部切割线再统一 arrangement 求交/提取面）的本质差异：
 * 1. 切割线之间永不求交 —— 每刀只与当前碎片边界相交，相交退化从根上消除；
 * 2. 交点只计算一次，分裂时两侧环共享同一 Point 对象（结构共享）→ 缝合缺口恒为 0；
 * 3. 每刀校验碎片级面积守恒（阈值 1e-3）+ 最小碎片面积（总形状 0.4%）；
 * 4. 单刀失败只重试该刀（上限 40 次），不重跑整轮。
 *
 * 曲线形态：真正随机的贯穿二次贝塞尔（p1 在弦中垂线方向正反随机偏移），
 * 区别于旧"星形放射式曲线"（hub 单点发射、30° 风车弯曲的限制形态）。
 */

export interface ThroughCurve {
  p0: Point;
  p1: Point;
  p2: Point;
  bend: number; // |控制点偏移| / 弦长
}

/** 贯穿路径形态（决定每刀生成哪种贯穿路径） */
export type CutPathKind = "through" | "s-curve" | "zigzag" | "jigsaw";

interface Chord {
  p0: Point;
  p2: Point;
  mid: Point;
  nx: number; // 弦法向单位向量
  ny: number;
  len: number;
}

/** 生成一条贯穿弦：p0/p2 在形状包围盒外、近似对跖（角度差 π±0.55） */
function normPi(a: number): number {
  while (a > Math.PI / 2) a -= Math.PI;
  while (a < -Math.PI / 2) a += Math.PI;
  return a;
}

function randomChord(bounds: { minX: number; minY: number; maxX: number; maxY: number }, rng: () => number): Chord {
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const maxD = Math.max(w, h) * 1.05;

  const th0 = rng() * Math.PI * 2;
  const p0 = {
    x: cx + Math.cos(th0) * maxD * (0.55 + rng() * 0.45),
    y: cy + Math.sin(th0) * maxD * (0.55 + rng() * 0.45),
  };
  const th2 = th0 + Math.PI + (rng() - 0.5) * 1.1;
  const p2 = {
    x: cx + Math.cos(th2) * maxD * (0.55 + rng() * 0.45),
    y: cy + Math.sin(th2) * maxD * (0.55 + rng() * 0.45),
  };
  const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
  const dx = p2.x - p0.x, dy = p2.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  return { p0, p2, mid: { x: mx, y: my }, nx: -dy / len, ny: dx / len, len };
}

export interface IncrementalCutLog {
  d: number; // 刀序号（0-based）
  status: "ok" | "fail";
  text: string;
  areaErr?: number;
}

export interface IncrementalCutResult {
  pieces: Point[][];
  curves: (ThroughCurve | null)[];
  log: IncrementalCutLog[];
  /** 逐刀步骤：steps[0]=初始形状（1 块），steps[i]=第 i 刀后的碎片集（S弯/折线逐刀动画用） */
  steps: Point[][][];
}

interface Hit {
  tCurve: number;
  tEdge: number;
  edgeIdx: number;
  x: number;
  y: number;
}

interface CutAttempt {
  ok: boolean;
  nInt?: number;
  reason?: string;
  a?: Point[];
  b?: Point[];
  areaErr?: number;
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function polyArea(p: Point[]): number {
  let s = 0;
  for (let i = 0, n = p.length; i < n; i++) {
    const j = (i + 1) % n;
    s += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return s / 2;
}

function polyBounds(p: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const b = { minX: 1e18, minY: 1e18, maxX: -1e18, maxY: -1e18 };
  for (const q of p) {
    if (q.x < b.minX) b.minX = q.x;
    if (q.x > b.maxX) b.maxX = q.x;
    if (q.y < b.minY) b.minY = q.y;
    if (q.y > b.maxY) b.maxY = q.y;
  }
  return b;
}

function pointInPoly(x: number, y: number, p: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const xi = p[i].x, yi = p[i].y, xj = p[j].x, yj = p[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function segInt(
  p1: Point, p2: Point, p3: Point, p4: Point,
): { t1: number; t2: number; x: number; y: number } | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const cr = d1x * d2y - d1y * d2x;
  if (Math.abs(cr) < 1e-12) return null;
  const dx = p3.x - p1.x, dy = p3.y - p1.y;
  const t1 = (dx * d2y - dy * d2x) / cr;
  const t2 = (dx * d1y - dy * d1x) / cr;
  if (t1 < -1e-9 || t1 > 1 + 1e-9 || t2 < -1e-9 || t2 > 1 + 1e-9) return null;
  return { t1, t2, x: p1.x + t1 * d1x, y: p1.y + t1 * d1y };
}

export class IncrementalCutter {
  static readonly SAMPLE = 96; // 曲线折线采样段数
  static readonly MIN_AREA_RATIO = 0.004; // 最小碎片面积 / 总形状面积
  static readonly AREA_TOL = 1e-3; // 面积守恒阈值
  static readonly VERTEX_MARGIN = 0.015; // 交点距多边形顶点最小距离（t 参数）
  static readonly MAX_ATTEMPTS = 40; // 单刀重试上限
  static readonly DEFAULT_BEND = 0.45; // 默认弯曲幅度

  /**
   * 生成贯穿曲线：p0/p2 在形状外，p1 在弦中垂线方向正反随机偏移。
   * @param bounds 当前要切碎片的包围盒
   * @param rng 随机源（mulberry32，可复现）
   * @param bend 弯曲幅度 0.05~0.9（偏移 = bend × 弦长 / 2）
   */
  static createThroughCurve(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    rng: () => number,
    bend: number,
  ): ThroughCurve {
    const ch = randomChord(bounds, rng);
    const sign = rng() < 0.5 ? -1 : 1;
    const off = (sign * bend * ch.len) / 2;
    return {
      p0: ch.p0,
      p1: { x: ch.mid.x + ch.nx * off, y: ch.mid.y + ch.ny * off },
      p2: ch.p2,
      bend: Math.abs(off / ch.len),
    };
  }

  /**
   * S 形贯穿：三次贝塞尔，两个控制点分别位于弦 1/3、2/3 处、分居弦两侧。
   * 弯幅由 scale 控制（默认 1.8 大弯幅）：S 形全程大幅偏离弦，形成"太极分割线"观感；
   * 增量切割保证每条 S 弯只贯穿单个碎片（端点同碎片边界、路径不跨碎片），多刀互不交叉。
   * @param bend 弯幅基数 0.05~0.9（控制点偏移 = bend × 弦长 / 2 × 1.8 × scale）
   * @param scale 弯幅系数（生成器按"大 S 优先、降幅保成功"逐级尝试）
   */
  static createSCurvePoints(
    poly: Point[],
    rng: () => number,
    bend: number,
    scale: number = 1,
  ): Point[] | null {
    // 双弧贝塞尔：两段三次贝塞尔各为一个明显弧（段1 弧向一侧、段2 弧向另一侧）→ S 双曲清晰。
    // 弦端点 = 目标碎片边界随机两点（必穿碎片，消除"弦不穿目标 → 0/1 交点"失败 → 撑住大弯幅）。
    for (let tries = 0; tries < 20; tries++) {
      const e1 = Math.floor(rng() * poly.length);
      const t1 = rng();
      const a1 = poly[e1], b1 = poly[(e1 + 1) % poly.length];
      const p0 = { x: a1.x + (b1.x - a1.x) * t1, y: a1.y + (b1.y - a1.y) * t1 };
      const e2 = Math.floor(rng() * poly.length);
      const t2 = rng();
      const a2 = poly[e2], b2 = poly[(e2 + 1) % poly.length];
      const p2 = { x: a2.x + (b2.x - a2.x) * t2, y: a2.y + (b2.y - a2.y) * t2 };
      if (e1 === e2) continue;
      const dx = p2.x - p0.x, dy = p2.y - p0.y;
      const len = Math.hypot(dx, dy);
      if (len < 10) continue;
      const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
      const nx = -dy / len, ny = dx / len;
      const sgn = rng() < 0.5 ? 1 : -1;
      // 控制点偏移 = 弧高 × 4/3（三次贝塞尔弧高 ≈ 0.75 × 控制点偏移）；弧高 = bend·len·scale
      const ex = (nx * bend * len * scale * 4) / 3 * sgn;
      const ey = (ny * bend * len * scale * 4) / 3 * sgn;
      const d1x = (mx - p0.x) / 3, d1y = (my - p0.y) / 3;
      const c1a = { x: p0.x + d1x + ex, y: p0.y + d1y + ey };
      const c1b = { x: p0.x + 2 * d1x + ex, y: p0.y + 2 * d1y + ey };
      const d2x = (p2.x - mx) / 3, d2y = (p2.y - my) / 3;
      const c2a = { x: mx + d2x - ex, y: my + d2y - ey };
      const c2b = { x: mx + 2 * d2x - ex, y: my + 2 * d2y - ey };
      const pts: Point[] = [{ x: p0.x, y: p0.y, isOriginal: false }];
      const N = 20;
      let ok = true;
      for (let i = 1; i <= N && ok; i++) {
        const t = i / N, inv = 1 - t;
        const x = inv * inv * inv * p0.x + 3 * inv * inv * t * c1a.x + 3 * inv * t * t * c1b.x + t * t * t * mx;
        const y = inv * inv * inv * p0.y + 3 * inv * inv * t * c1a.y + 3 * inv * t * t * c1b.y + t * t * t * my;
        if (!pointInPoly(x, y, poly)) { ok = false; break; }
        pts.push({ x, y, isOriginal: false });
      }
      if (!ok) continue;
      for (let i = 1; i <= N && ok; i++) {
        const t = i / N, inv = 1 - t;
        const x = inv * inv * inv * mx + 3 * inv * inv * t * c2a.x + 3 * inv * t * t * c2b.x + t * t * t * p2.x;
        const y = inv * inv * inv * my + 3 * inv * inv * t * c2a.y + 3 * inv * t * t * c2b.y + t * t * t * p2.y;
        if (!pointInPoly(x, y, poly)) { ok = false; break; }
        pts.push({ x, y, isOriginal: false });
      }
      if (!ok) continue;
      return pts;
    }
    return null;
  }

  /**
   * 折线贯穿（v8 单 V，每刀独立折角）：每刀 = 1 个 V 形折角（起点 → 折点 → 终点）。
   * - 弦端点 = 目标碎片边界随机两点（必穿碎片）；折点 = 弦中点沿垂直弦方向朝质心侧偏移 halfAmp×L（L=弦半长）；
   * - halfAmp = tan((π−θ)/2)，θ 为 V 夹角（30°~90° 开区间，每刀独立随机，同局可不同折角）；
   * - 折角精确 = θ：折点沿垂直弦偏移 → tan(φ/2) = L/h 恒等；折角 ≤90° 保 sc ≥ 1/halfAmp；
   * - 目标角放不下（碎片法向宽度不足）时角度递进变浅（步长 5°），上限 89.9°；仍失败换弦重试，最终直线兜底；
   * - 与嵌齿（正弦波浪、多齿圆润）明显区分：折线是单个尖锐 V 形折角。
   * @param poly 目标碎片（切割只贯穿单个碎片，增量切割天然不交叉）
   * @param theta V 夹角目标值（弧度，本刀固定；碎片容纳不下时逐级变浅，上限 <90°）
   */
  static createZigzagPoints(
    poly: Point[],
    rng: () => number,
    theta: number,
  ): Point[] | null {
    // 碎片质心：折点方向取"弦中点 → 质心侧法线"（折角精确 = 目标角，且朝碎片内部）
    let ccx = 0, ccy = 0;
    for (const p of poly) { ccx += p.x; ccy += p.y; }
    ccx /= poly.length;
    ccy /= poly.length;
    // 角度递进：目标角放不下逐级变浅（步长 5°），上限 89.9°（保折角 <90°）
    const MAX_ANG = (89.9 * Math.PI) / 180;
    const STEP = (5 * Math.PI) / 180;
    for (let ang = theta; ang <= MAX_ANG + 1e-9; ang += STEP) {
      const a = Math.min(ang, MAX_ANG);
      const halfAmp = Math.tan((Math.PI - a) / 2);
      // 折角 ≤90° 要求 h·sc ≥ L → sc ≥ 1/halfAmp
      const minSc = Math.min(1, 1 / halfAmp);
      for (let tries = 0; tries < 10; tries++) {
        const e1 = Math.floor(rng() * poly.length);
        const t1 = rng();
        const a1 = poly[e1], b1 = poly[(e1 + 1) % poly.length];
        const p0 = { x: a1.x + (b1.x - a1.x) * t1, y: a1.y + (b1.y - a1.y) * t1 };
        const e2 = Math.floor(rng() * poly.length);
        const t2 = rng();
        const a2 = poly[e2], b2 = poly[(e2 + 1) % poly.length];
        const p2 = { x: a2.x + (b2.x - a2.x) * t2, y: a2.y + (b2.y - a2.y) * t2 };
        if (e1 === e2) continue;
        const dx = p2.x - p0.x, dy = p2.y - p0.y;
        const len = Math.hypot(dx, dy);
        if (len < 10) continue;
        const L = len / 2;
        const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
        // 垂直弦法线，取朝向质心一侧
        const nx = -dy / len, ny = dx / len;
        const gdx = ccx - mx, gdy = ccy - my;
        const gd = gdx * nx + gdy * ny;
        const sn = gd >= 0 ? 1 : -1;
        const h = halfAmp * L;
        for (let sc = 1; sc >= minSc * 1.02; sc *= 0.7) {
          const kx = mx + nx * sn * h * sc, ky = my + ny * sn * h * sc;
          if (!pointInPoly(kx, ky, poly)) continue;
          let ok = true;
          for (let i = 1; i <= 3 && ok; i++) {
            const t = i / 4;
            if (!pointInPoly(p0.x + (kx - p0.x) * t, p0.y + (ky - p0.y) * t, poly)) ok = false;
          }
          for (let i = 1; i <= 3 && ok; i++) {
            const t = i / 4;
            if (!pointInPoly(kx + (p2.x - kx) * t, ky + (p2.y - ky) * t, poly)) ok = false;
          }
          if (!ok) continue;
          return [
            { x: p0.x, y: p0.y, isOriginal: false },
            { x: kx, y: ky, isOriginal: false },
            { x: p2.x, y: p2.y, isOriginal: false },
          ];
        }
      }
    }
    return null;
  }

  /**
   * 嵌齿（Jigsaw 波形齿）贯穿：沿弦方向正弦波形偏移，齿形平滑无自交。
   * @param bend 齿高 0.05~0.9（齿高 = bend × 弦长 / 4，受 ampCap 上限截断）
   * @param ampScale 自适应缩放（交点过多时逐级缩齿）
   * @param pitchFactor 齿距 = 弦长 × pitchFactor（默认 0.1，即约 10 个齿）
   * @param ampCap 齿高上限（相对形状尺寸的固定值，保证不同刀数下幅度统一）
   */
  static createJigsawPoints(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    rng: () => number,
    bend: number,
    ampScale: number = 1,
    pitchFactor: number = 0.1,
    ampCap: number = Infinity,
  ): Point[] {
    const ch = randomChord(bounds, rng);
    const amp = Math.min((bend * ch.len) / 4, ampCap) * ampScale;
    const pitch = Math.max(ch.len * pitchFactor, 10);
    const phase = rng() * Math.PI * 2;
    const SEG_PER_PITCH = 14;
    const totalSegs = Math.max(Math.round((ch.len / pitch) * SEG_PER_PITCH), 24);
    const pts: Point[] = [];
    const taperLen = ch.len * 0.12; // 入口/出口渐变区（贴弦过渡，避免摆动造成多次穿越边界）
    for (let i = 0; i <= totalSegs; i++) {
      const s = (i / totalSegs) * ch.len; // 沿弦弧长
      const t = s / ch.len;
      const baseX = ch.p0.x + (ch.p2.x - ch.p0.x) * t;
      const baseY = ch.p0.y + (ch.p2.y - ch.p0.y) * t;
      const taper = s < taperLen ? s / taperLen : s > ch.len - taperLen ? (ch.len - s) / taperLen : 1;
      const wob = Math.sin((2 * Math.PI * s) / pitch + phase) * amp * taper;
      pts.push({ x: baseX + ch.nx * wob, y: baseY + ch.ny * wob });
    }
    return pts;
  }

  static curvePoint(c: ThroughCurve, t: number): Point {
    const inv = 1 - t;
    return {
      x: inv * inv * c.p0.x + 2 * inv * t * c.p1.x + t * t * c.p2.x,
      y: inv * inv * c.p0.y + 2 * inv * t * c.p1.y + t * t * c.p2.y,
    };
  }

  static curveSamples(c: ThroughCurve, n: number): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) pts.push(IncrementalCutter.curvePoint(c, i / n));
    return pts;
  }

  /**
   * 单刀切割：贯穿路径（折线点列）对单个多边形求交，恰 2 交点则一分为二。
   * 结构共享：入口/出口交点只创建一次，两侧环引用同一 Point 对象 → 缝合缺口恒为 0。
   */
  static tryCut(poly: Point[], pts: Point[]): CutAttempt {
    const n = pts.length - 1;
    const hits: Hit[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const c1 = pts[i], c2 = pts[i + 1];
      for (let e = 0; e < poly.length; e++) {
        const it = segInt(c1, c2, poly[e], poly[(e + 1) % poly.length]);
        if (!it) continue;
        if (it.t2 < IncrementalCutter.VERTEX_MARGIN || it.t2 > 1 - IncrementalCutter.VERTEX_MARGIN) continue;
        hits.push({ tCurve: i + it.t1, tEdge: it.t2, edgeIdx: e, x: it.x, y: it.y });
      }
    }
    if (hits.length !== 2) return { ok: false, nInt: hits.length };
    hits.sort((a, b) => a.tCurve - b.tCurve);
    const en = hits[0], ex = hits[1];
    if (en.edgeIdx === ex.edgeIdx) return { ok: false, nInt: 2, reason: "同边双交" };
    const tMid = (en.tCurve + ex.tCurve) / 2;
    const seg = Math.floor(tMid), f = tMid - seg;
    const mid = {
      x: pts[seg].x + (pts[seg + 1].x - pts[seg].x) * f,
      y: pts[seg].y + (pts[seg + 1].y - pts[seg].y) * f,
    };
    if (!pointInPoly(mid.x, mid.y, poly)) return { ok: false, nInt: 2, reason: "中点在形状外" };

    const m = poly.length;
    const enSeg = Math.floor(en.tCurve), exSeg = Math.floor(ex.tCurve);
    // 切割产生的点标记 isOriginal:false → 渲染层按直线精确绘制（避免贝塞尔重平滑造成共享边缝隙/镂空）
    const cutPt = (x: number, y: number): Point => ({ x, y, isOriginal: false });
    const ring1: Point[] = [];
    const ring2: Point[] = [];
    if (en.tEdge > 1e-6) ring1.push(cutPt(en.x, en.y)); else ring1.push(poly[en.edgeIdx]);
    let k = (en.edgeIdx + 1) % m;
    while (k !== (ex.edgeIdx + 1) % m) { ring1.push(poly[k]); k = (k + 1) % m; }
    if (ex.tEdge > 1e-6) ring1.push(cutPt(ex.x, ex.y)); else ring1.push(poly[ex.edgeIdx]);
    for (let s = exSeg - 1; s > enSeg; s--) ring1.push({ ...pts[s], isOriginal: false });
    // 环 2：沿短弧正向走（修复：旧实现沿长弧导致两环重叠、面积互为相反数）
    if (ex.tEdge > 1e-6) ring2.push(cutPt(ex.x, ex.y)); else ring2.push(poly[ex.edgeIdx]);
    let k2 = (ex.edgeIdx + 1) % m;
    while (k2 !== (en.edgeIdx + 1) % m) { ring2.push(poly[k2]); k2 = (k2 + 1) % m; }
    if (en.tEdge > 1e-6) ring2.push(cutPt(en.x, en.y)); else ring2.push(poly[en.edgeIdx]);
    for (let s2 = enSeg + 1; s2 < exSeg; s2++) ring2.push({ ...pts[s2], isOriginal: false });

    if (ring1.length < 3 || ring2.length < 3) return { ok: false, nInt: 2, reason: "环退化" };
    const a0 = Math.abs(polyArea(poly));
    const err = Math.abs(Math.abs(polyArea(ring1)) + Math.abs(polyArea(ring2)) - a0) / a0;
    if (err > IncrementalCutter.AREA_TOL) {
      return { ok: false, nInt: 2, reason: "面积不守恒 " + err.toFixed(6) };
    }
    return { ok: true, a: ring1, b: ring2, areaErr: err };
  }

  /**
   * 增量切割主流程：逐刀切当前最大碎片。
   * @param shape 原始形状（任意闭合多边形，坐标任意尺度）
   * @param cuts 切割刀数（每刀成功 → 碎片 +1，最终碎片数 = cuts + 1，失败刀不计）
   * @param bend 弯曲幅度（贯穿/S 弯：控制点偏移系数；折线：折幅系数；嵌齿：齿高系数），缺省 0.45
   * @param seed 随机种子，缺省按时间派生（传 seed 可复现）
   * @param kind 贯穿路径形态，缺省 "through"
   */
  static generate(
    shape: Point[],
    cuts: number,
    bend: number = IncrementalCutter.DEFAULT_BEND,
    seed?: number,
    kind: CutPathKind = "through",
  ): IncrementalCutResult {
    const rng = mulberry32(seed ?? (Date.now() & 0x7fffffff));
    const pieces: Point[][] = [shape.map((p) => ({ ...p }))];
    const steps: Point[][][] = [pieces.map((p) => p.map((pt) => ({ ...pt })))];
    const totalArea = Math.abs(polyArea(shape)) || 1;
    const minArea = totalArea * IncrementalCutter.MIN_AREA_RATIO;
    const curves: (ThroughCurve | null)[] = [];
    const log: IncrementalCutLog[] = [];
    // 嵌齿齿高上限：相对形状对角线固定（2.8%），保证少刀/多刀下齿形幅度统一
    const shapeB = polyBounds(shape);
    const jigsawAmpCap = Math.hypot(shapeB.maxX - shapeB.minX, shapeB.maxY - shapeB.minY) * 0.028;

    const pathKindName: Record<CutPathKind, string> = {
      "through": "贯穿曲线", "s-curve": "S弯", "zigzag": "折线", "jigsaw": "嵌齿",
    };

    for (let d = 0; d < cuts; d++) {
      // 折线折角：每刀独立随机（30°~90° 开区间，允许同局不同折角）
      const zigzagTheta = kind === "zigzag" ? ((30 + rng() * 59.9) * Math.PI) / 180 : 0;
      let used: ThroughCurve | null = null;
      let done = false;
      for (let att = 0; att < IncrementalCutter.MAX_ATTEMPTS; att++) {
        let all: Point[] = [];
        for (const p of pieces) all = all.concat(p);
        const bounds = polyBounds(all);
        let target = 0, tA = -1;
        for (let i = 0; i < pieces.length; i++) {
          const ar = Math.abs(polyArea(pieces[i]));
          if (ar > tA) { tA = ar; target = i; }
        }
        let path: Point[] | null;
        let res: CutAttempt;
        if (kind === "jigsaw") {
          // 自适应齿高：波形与碎片边界交点不合法（>2 / 0 / 同边等）时逐级缩齿并换弦，
          // 齿高→0 即贴弦；仍失败则退化为纯直线弦（通过率最高）
          let ampScale = 1;
          do {
            path = IncrementalCutter.createJigsawPoints(bounds, rng, bend, ampScale, 0.1, jigsawAmpCap);
            res = IncrementalCutter.tryCut(pieces[target], path);
            if (!res.ok && ampScale <= 0.03) {
              path = [path[0], path[path.length - 1]];
              res = IncrementalCutter.tryCut(pieces[target], path);
              break;
            }
            ampScale *= 0.5;
          } while (!res.ok && ampScale >= 0.06);
        } else if (kind === "zigzag") {
          // 折线（v8）：每刀独立随机折角 30°~90°，弦端点取目标碎片边界、折点朝质心（界内检查换弦重试）
          path = IncrementalCutter.createZigzagPoints(pieces[target], rng, zigzagTheta);
          res = path ? IncrementalCutter.tryCut(pieces[target], path) : { ok: false, nInt: 0 };
        } else {
          // S弯：双弧贝塞尔，大弯幅优先（太极分割线观感），逐级降幅保成功；最低 scale 0.55（每弧弧高 25% 弦长）
          const sCurveScales = [1.6, 1.3, 1.0, 0.75, 0.55];
          let sIdx = 0;
          do {
            path =
              kind === "s-curve"
                ? IncrementalCutter.createSCurvePoints(pieces[target], rng, bend, sCurveScales[sIdx])
                : IncrementalCutter.curveSamples(
                    IncrementalCutter.createThroughCurve(bounds, rng, bend),
                    IncrementalCutter.SAMPLE,
                  );
            res = path ? IncrementalCutter.tryCut(pieces[target], path) : { ok: false, nInt: 0 };
            sIdx++;
          } while (!res.ok && kind === "s-curve" && sIdx < sCurveScales.length);
          // S弯全降级仍失败：保持 S 弯形态换弦重试（不直接退化成直线）
          if (!res.ok && kind === "s-curve") {
            for (let i = 0; i < 2 && !res.ok; i++) {
              path = IncrementalCutter.createSCurvePoints(pieces[target], rng, bend, 0.55);
              res = path ? IncrementalCutter.tryCut(pieces[target], path) : { ok: false, nInt: 0 };
            }
          }
        }
        if (!res.ok) {
          // 曲线/折线形态失败兜底：退化为纯直线弦（通过率最高）
          const chord = randomChord(bounds, rng);
          path = path ? [path[0], path[path.length - 1]] : [chord.p0, chord.p2];
          res = IncrementalCutter.tryCut(pieces[target], path);
        }
        if (res.ok && res.a && res.b) {
          if (Math.min(Math.abs(polyArea(res.a)), Math.abs(polyArea(res.b))) < minArea) {
            if (att === IncrementalCutter.MAX_ATTEMPTS - 1) {
              log.push({ d, status: "fail", text: `刀#${d + 1} 重试${IncrementalCutter.MAX_ATTEMPTS}次放弃 · 碎片过小` });
            }
            continue;
          }
          pieces.splice(target, 1, res.a, res.b);
          steps.push(pieces.map((p) => p.map((pt) => ({ ...pt }))));
          used = null;
          log.push({
            d, status: "ok",
            text: `刀#${d + 1} 成功 · ${pathKindName[kind]} · 交点2 · 面积误差${(res.areaErr! * 100).toFixed(3)}%`,
            areaErr: res.areaErr,
          });
          done = true;
          break;
        }
        if (att === IncrementalCutter.MAX_ATTEMPTS - 1) {
          log.push({
            d, status: "fail",
            text: `刀#${d + 1} 重试${IncrementalCutter.MAX_ATTEMPTS}次放弃 · ${res.reason ?? "交点" + res.nInt}`,
          });
        }
      }
      curves.push(used);
    }
    return { pieces, curves, log, steps };
  }
}
