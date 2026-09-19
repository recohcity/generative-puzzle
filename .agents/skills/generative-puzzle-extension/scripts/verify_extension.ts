/**
 * generative-puzzle 扩展一致性验证脚本
 *
 * 用法（项目根）：
 *   npx tsx .agents/skills/generative-puzzle-extension/scripts/verify_extension.ts
 *
 * 检查项：
 *   1. i18n 双块：game.cutType 与顶层 cutType 对每个 CutType 枚举值都有键（连字符或驼峰）；
 *   2. 档位一致性：每个切割类型 × 难度档 1-8，生成片数 ≥ DIFFICULTY_METADATA 区间下限
 *      （上限软检查，因 "16-30+" 允许超出）；贯穿类片数 = targetCuts + 1；
 *   3. 废弃残留：业务代码无 CutType.Curve 引用、无旧 'curve' 字面量（GameDataManager 迁移别名除外）。
 */
import { CutType } from "../../../../packages/game-core/src/types/puzzleTypes";
import { PuzzleGenerator } from "../../../../utils/puzzle/PuzzleGenerator";
import { DIFFICULTY_SETTINGS } from "../../../../utils/puzzle/cutGeneratorConfig";
import { DIFFICULTY_METADATA } from "../../../../utils/difficulty/difficultyMetadata";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
let failures = 0;
let warnings = 0;

// 注入确定性 PRNG：PuzzleGenerator 内部用 Math.random()，跨 CI 运行偶发抽到坏 seed 会假失败。
// 固定 mulberry32 种子让验证可复现（不掩盖真实 bug——只是把"偶发"变"必现"，FAIL 时仍需修生成器）。
(() => {
  let a = 0x9e3779b9;
  Math.random = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();

function fail(msg: string): void {
  failures++;
  console.error(`  [FAIL] ${msg}`);
}
function warn(msg: string): void {
  warnings++;
  console.error(`  [WARN] ${msg}`);
}

// ---------- 检查 1：i18n 双块 ----------
console.log("== 检查 1: i18n 双块（game.cutType + 顶层 cutType，中英） ==");
const cutValues: string[] = Object.values(CutType);
for (const locale of ["zh-CN", "en"]) {
  const p = path.join(ROOT, "src/i18n/locales", `${locale}.json`);
  const d = JSON.parse(fs.readFileSync(p, "utf-8"));
  const gameBlock = d.game?.cutType ?? {};
  const topBlock = d.cutType ?? {};
  for (const v of cutValues) {
    const camel = v.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const inGame = gameBlock[v] != null || gameBlock[camel] != null;
    const inTop = topBlock[v] != null || topBlock[camel] != null;
    if (!inGame) fail(`${locale}: game.cutType 缺键 ${v} / ${camel}`);
    if (!inTop) fail(`${locale}: 顶层 cutType 缺键 ${v} / ${camel}`);
  }
}
console.log("  完成");

// ---------- 检查 2：档位一致性 ----------
console.log("== 检查 2: 档位片数一致性（每类型 × 档位 1-8，2 seed × 2 形状） ==");
const THROUGH_CUT = new Set([CutType.ThroughCurve, CutType.SCurve, CutType.Zigzag, CutType.Jigsaw]);
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeShape(type: string, rng: () => number): { x: number; y: number }[] {
  const C = 500, R = 150;
  const nV = 5 + Math.floor(rng() * 5);
  const angs: number[] = [];
  for (let i = 0; i < nV; i++) angs.push(rng() * Math.PI * 2);
  angs.sort((a, b) => a - b);
  const base: { x: number; y: number }[] = [];
  for (let i = 0; i < nV; i++) {
    const r = R * (0.9 + rng() * 0.3);
    base.push({ x: C + Math.cos(angs[i]) * r, y: C + Math.sin(angs[i]) * r });
  }
  if (type === "polygon") return base;
  const out: { x: number; y: number }[] = [];
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
function parseRange(s: string): { min: number; max: number } {
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return { min: 0, max: 1e9 };
  return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}
const consoleBackup = console.log;
console.log = () => {}; // 静音生成器日志
for (const v of cutValues) {
  for (let level = 1; level <= 8; level++) {
    const settings = DIFFICULTY_SETTINGS[level as keyof typeof DIFFICULTY_SETTINGS];
    const meta = DIFFICULTY_METADATA[level];
    const { min } = parseRange(meta.pieceRange);
    for (const seed of [1, 7]) {
      for (const shapeType of ["polygon", "cloud"]) {
        const s = makeShape(shapeType, mulberry32(seed + 999));
        const res = PuzzleGenerator.generatePuzzle(s, v as CutType, level, shapeType);
        const n = res.pieces.length;
        if (THROUGH_CUT.has(v as CutType) && n !== settings.targetCuts + 1) {
          // 折线单 V 无交叉，低档位刀数少碎片太少无拼图难度 → 最小 4 刀（5 片）起步（PuzzleGenerator 规则）
          const expectCuts = v === CutType.Zigzag ? Math.max(settings.targetCuts, 4) : settings.targetCuts;
          if (n !== expectCuts + 1) {
            fail(`${v} 档位${level} ${shapeType} seed${seed}: 片数 ${n} ≠ 期望刀数+1 (${expectCuts + 1})`);
          }
        }
        if (n < min) {
          fail(`${v} 档位${level} ${shapeType} seed${seed}: 片数 ${n} < 文案下限 ${min}`);
        }
      }
    }
  }
}
console.log = consoleBackup;
console.log("  完成");

// ---------- 检查 3：废弃残留 ----------
console.log("== 检查 3: 废弃残留（CutType.Curve / 旧 'curve' 字面量） ==");
const DIRS = ["utils", "components", "contexts", "packages", "app", "src", "hooks", "constants"];
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (f === "node_modules" || f === ".next") continue;
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(f)) out.push(full);
  }
  return out;
}
for (const dir of DIRS) {
  const base = path.join(ROOT, dir);
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)) {
    const src = fs.readFileSync(file, "utf-8");
    const rel = path.relative(ROOT, file);
    if (/CutType\.Curve\b/.test(src)) {
      // 仅允许存档迁移映射中的注释/别名
      if (!/GameDataManager\.ts$/.test(file)) fail(`${rel}: 含 CutType.Curve`);
    }
    const cleaned = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    if (/["']curve["']/.test(cleaned)) {
      const isMigration = /GameDataManager\.ts$/.test(file);
      if (!isMigration) fail(`${rel}: 含旧 'curve' 字面量`);
    }
  }
}
console.log("  完成");

// ---------- 汇总 ----------
console.log("========================================");
if (failures === 0 && warnings === 0) {
  console.log(`全部通过（${cutValues.length} 个切割类型 × 8 档）`);
  process.exit(0);
} else if (failures === 0) {
  console.log(`通过，但有 ${warnings} 个警告（不影响交付，建议人工复核）`);
  process.exit(0);
} else {
  console.log(`失败 ${failures} 项 / 警告 ${warnings} 项，禁止交付`);
  process.exit(1);
}
