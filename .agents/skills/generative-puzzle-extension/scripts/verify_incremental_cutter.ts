/**
 * 几何核心（增量顺序切割器）自测脚本 —— 可独立于游戏项目运行
 *
 * 用法（项目根）：
 *   npx tsx .agents/skills/generative-puzzle-extension/scripts/verify_incremental_cutter.ts
 *
 * 检查项：
 *   1. 片数不变量：每类型 × 多形状 × 多 seed × 多刀数，最终碎片数 = 成功刀数 + 1；
 *   2. 面积守恒：全部碎片面积和与原形状面积误差 < AREA_TOL（1e-3）；
 *   3. 碎片质量：所有碎片为合法简单多边形（≥3 顶点、面积为正）；
 *   4. 成功率：每类型整体刀成功率达到阈值（贯穿 ≥ 99%，S弯/折线/嵌齿 ≥ 97%）。
 */
import { IncrementalCutter, type CutPathKind } from "@generative-puzzle/game-core";
import type { Point } from "@generative-puzzle/game-core";

const KINDS: CutPathKind[] = ["through", "s-curve", "zigzag", "jigsaw"];
const CUT_COUNTS = [4, 6, 10, 15];
const SEEDS = [1, 7, 42, 99, 2026];
const SHAPES = ["polygon", "cloud"] as const;

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeShape(type: string, rng: () => number): Point[] {
  const C = 500, R = 150;
  const nV = 5 + Math.floor(rng() * 5);
  const angs: number[] = [];
  for (let i = 0; i < nV; i++) angs.push(rng() * Math.PI * 2);
  angs.sort((a, b) => a - b);
  const base: Point[] = [];
  for (let i = 0; i < nV; i++) {
    const r = R * (0.9 + rng() * 0.3);
    base.push({ x: C + Math.cos(angs[i]) * r, y: C + Math.sin(angs[i]) * r });
  }
  if (type === "polygon") return base;
  const out: Point[] = [];
  const STEPS = 14;
  for (let i = 0; i < base.length; i++) {
    const p0 = base[(i - 1 + base.length) % base.length];
    const p1 = base[i];
    const p2 = base[(i + 1) % base.length];
    const sx = (p0.x + p1.x) / 2, sy = (p0.y + p1.y) / 2;
    const ex = (p1.x + p2.x) / 2, ey = (p1.y + p2.y) / 2;
    for (let t = 0; t <= STEPS; t++) {
      if (t === STEPS && i < base.length - 1) continue;
      const r = t / STEPS, inv = 1 - r;
      const x = inv * inv * sx + 2 * inv * r * p1.x + r * r * ex;
      const y = inv * inv * sy + 2 * inv * r * p1.y + r * r * ey;
      const last = out[out.length - 1];
      if (last && Math.hypot(x - last.x, y - last.y) < 1e-3) continue;
      out.push({ x, y });
    }
  }
  return out;
}

function polyArea(p: Point[]): number {
  let s = 0;
  for (let i = 0, n = p.length; i < n; i++) {
    const j = (i + 1) % n;
    s += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return s / 2;
}

let failures = 0;

function fail(msg: string): void {
  failures++;
  console.error(`  [FAIL] ${msg}`);
}

for (const kind of KINDS) {
  let okCuts = 0, totalCuts = 0;
  let maxAreaErr = 0;
  let successRuns = 0, runs = 0;
  for (const shapeType of SHAPES) {
    for (const seed of SEEDS) {
      for (const cuts of CUT_COUNTS) {
        const shape = makeShape(shapeType, mulberry32(seed + 999));
        const res = IncrementalCutter.generate(shape, cuts, 0.45, seed, kind);
        runs++;
        totalCuts += cuts;
        const okD = res.log.filter((l) => l.status === "ok").length;
        okCuts += okD;
        if (res.pieces.length !== okD + 1) {
          fail(`${kind} ${shapeType} seed${seed} ${cuts}刀: 片数 ${res.pieces.length} ≠ 成功刀+1 (${okD + 1})`);
        }
        const total = res.pieces.reduce((s, p) => s + Math.abs(polyArea(p)), 0);
        const orig = Math.abs(polyArea(shape));
        const err = Math.abs(total - orig) / orig;
        maxAreaErr = Math.max(maxAreaErr, err);
        if (err > 1e-3) {
          fail(`${kind} ${shapeType} seed${seed} ${cuts}刀: 面积误差 ${err.toFixed(6)} > 1e-3`);
        }
        for (const p of res.pieces) {
          if (p.length < 3 || Math.abs(polyArea(p)) < 1e-9) {
            fail(`${kind} ${shapeType} seed${seed} ${cuts}刀: 存在退化碎片（顶点 ${p.length}）`);
          }
        }
        if (okD === cuts) successRuns++;
      }
    }
  }
  const rate = (okCuts / totalCuts) * 100;
  const threshold = kind === "through" ? 99 : 97;
  if (rate < threshold) fail(`${kind}: 刀成功率 ${rate.toFixed(2)}% < ${threshold}%`);
  console.log(
    `${kind.padEnd(9)} 刀成功率 ${rate.toFixed(2).padStart(6)}%  · 最大面积误差 ${maxAreaErr.toExponential(1)}  · 满刀局 ${successRuns}/${runs}`,
  );
}

console.log("========================================");
if (failures === 0) {
  console.log("几何核心自测全部通过");
  process.exit(0);
} else {
  console.log(`失败 ${failures} 项，禁止交付`);
  process.exit(1);
}
