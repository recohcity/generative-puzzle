/**
 * 一键生成"生成式拼图"切割检视 Demo（同时展示全部 10 种切割方式）
 *
 * 用法（项目根）：
 *   npx tsx .agents/skills/generative-puzzle-extension/scripts/generate_demo.ts \
 *     --level 6 --out ./demos/demo.html
 *
 * 可选参数：
 *   --level 1-8   难度（默认 6，影响全部 10 格的切割片数）
 *   --out         输出 HTML 路径（默认 ./demos/demo.html）
 *
 * 产物：单文件自包含 HTML。页面同时呈现 10 种切割方式在同一不规则云朵形状上的
 * 切割结果（5×2 网格，每格标注类型与片数），难度滑条统一控制，纯检视比对、
 * 无拖拽交互。切割引擎由 esbuild 从 utils/puzzle/PuzzleGenerator.ts 现场打包
 * 内联（含增量顺序切割、放射、碎裂、鱼鳞、蜂巢等全部生成器）——无复制代码、不漂移。
 */
import { build } from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");

function parseArgs(argv: string[]): { level: number; out: string } {
  const a: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) a[argv[i].slice(2)] = argv[i + 1];
  }
  const level = Math.min(8, Math.max(1, parseInt(a.level ?? "6", 10) || 6));
  const out = a.out ? path.resolve(ROOT, a.out) : path.join(ROOT, "demos/demo.html");
  return { level, out };
}

async function bundlePuzzleEngine(): Promise<string> {
  const entry = path.join(ROOT, "utils/puzzle/PuzzleGenerator.ts");
  const res = await build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    globalName: "GP",
    write: false,
    minify: false,
    platform: "browser",
    target: ["es2020"],
    logLevel: "silent",
    alias: {
      "@": ROOT,
      "@generative-puzzle/game-core": path.join(ROOT, "packages/game-core/src/index.ts"),
    },
  });
  return res.outputFiles[0].text;
}

function appJs(level: number): string {
  return `
const CFG = { level: ${level} };
const LEVEL_CUTS = { 1: 2, 2: 3, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12, 8: 15 };
const CUTS = [
  ["straight", "直线"], ["diagonal", "斜线"], ["radial", "放射"], ["through-curve", "曲线"],
  ["s-curve", "S弯"], ["zigzag", "折线"], ["jigsaw", "嵌齿"], ["mosaic-random", "碎裂"],
  ["concavo-convex", "鱼鳞"], ["hex", "蜂巢"],
];

// ---------- 不规则云朵形状（固定，全 10 格共用同一形状） ----------
function mulberry32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}}
function makeCloud(rng){
  const C=500,R=150,nV=7+Math.floor(rng()*4),angs=[];
  for(let i=0;i<nV;i++)angs.push(rng()*Math.PI*2);
  angs.sort((a,b)=>a-b);
  const base=[];
  for(let i=0;i<nV;i++){const r=R*(0.8+rng()*0.35);base.push({x:C+Math.cos(angs[i])*r,y:C+Math.sin(angs[i])*r});}
  const out=[],STEPS=16;
  for(let i=0;i<base.length;i++){
    const p0=base[(i-1+base.length)%base.length],p1=base[i],p2=base[(i+1)%base.length];
    const sx=(p0.x+p1.x)/2,sy=(p0.y+p1.y)/2,ex=(p1.x+p2.x)/2,ey=(p1.y+p2.y)/2;
    for(let t=0;t<=STEPS;t++){
      if(t===STEPS&&i<base.length-1)continue;
      const r=t/STEPS,inv=1-r;
      const x=inv*inv*sx+2*inv*r*p1.x+r*r*ex, y=inv*inv*sy+2*inv*r*p1.y+r*r*ey;
      const last=out[out.length-1];
      if(last&&Math.hypot(x-last.x,y-last.y)<1e-3)continue;
      out.push({x,y});
    }
  }
  return out;
}
function polyArea(p){let s=0;for(let i=0,n=p.length;i<n;i++){const j=(i+1)%n;s+=p[i].x*p[j].y-p[j].x*p[i].y;}return s/2;}

// ---------- 10 格布局 ----------
const grid = document.getElementById('grid');
const state = { level: CFG.level, shape: null, cells: [] };
for (const [id, name] of CUTS) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  const cv = document.createElement('canvas');
  cv.width = 480; cv.height = 400;
  const label = document.createElement('div');
  label.className = 'label'; label.textContent = name;
  cell.appendChild(cv); cell.appendChild(label);
  grid.appendChild(cell);
  state.cells.push({ id, name, cv, ctx: cv.getContext('2d'), label, pieces: [] });
}

// ---------- 生成 + 渲染 ----------
function renderCell(c){
  const ctx = c.ctx, W = c.cv.width, H = c.cv.height;
  ctx.clearRect(0, 0, W, H);
  const b = { minX: 1e18, minY: 1e18, maxX: -1e18, maxY: -1e18 };
  for (const q of state.shape) { if (q.x<b.minX)b.minX=q.x; if(q.x>b.maxX)b.maxX=q.x; if(q.y<b.minY)b.minY=q.y; if(q.y>b.maxY)b.maxY=q.y; }
  const sc = Math.min((W-36)/(b.maxX-b.minX), (H-36)/(b.maxY-b.minY));
  const ox = W/2 - (b.minX+b.maxX)/2*sc, oy = H/2 - (b.minY+b.maxY)/2*sc;
  for (const p of c.pieces) {
    ctx.beginPath();
    ctx.moveTo(ox + p.pts[0].x*sc, oy + p.pts[0].y*sc);
    for (let i=1;i<p.pts.length;i++) ctx.lineTo(ox + p.pts[i].x*sc, oy + p.pts[i].y*sc);
    ctx.closePath();
    ctx.fillStyle = p.color; ctx.fill();
    ctx.strokeStyle = 'rgba(30,18,50,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
}
function generate(){
  state.shape = makeCloud(mulberry32(20260917));
  for (const c of state.cells) {
    const res = GP.PuzzleGenerator.generatePuzzle(state.shape, c.id, state.level, 'cloud');
    c.pieces = res.pieces.map((p, i) => ({
      pts: p.points,
      color: p.color || 'hsl(' + (12 + (i*37)%34) + ', 68%, ' + (50 + (i*11)%16) + '%)',
    }));
    c.label.textContent = c.name + ' · ' + c.pieces.length + ' 片';
    renderCell(c);
  }
  info.textContent = '不规则云朵形状 · 难度 ' + state.level + ' · 同形状同难度 10 种切割比照 · 每局唯一';
}
const info = document.getElementById('info');

// ---------- 控制 ----------
const levelSlider = document.getElementById('level');
levelSlider.value = String(state.level);
levelSlider.oninput = () => { state.level = +levelSlider.value; generate(); };
document.getElementById('regen').onclick = generate;
generate();
`;
}

function htmlDoc(appJsStr: string, coreJs: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>生成式拼图 · 10 种切割检视 Demo</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: linear-gradient(160deg, #423266 0%, #181128 100%);
    color: #f6ecdc; min-height: 100vh;
  }
  header {
    padding: 14px 20px; font-size: 15px; font-weight: 700; letter-spacing: .5px;
    background: rgba(255,255,255,.05); border-bottom: 1px solid rgba(255,255,255,.08);
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  header span { color: #d9b26b; }
  header .bar { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #d8c9a8; }
  header input[type=range] { width: 160px; accent-color: #d9a94f; }
  header button {
    padding: 7px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.08); color: #f0e6d2; font-size: 13px; cursor: pointer;
  }
  header button:hover { background: rgba(255,255,255,.14); }
  #info { padding: 10px 20px; font-size: 13px; color: #c9ba98; border-bottom: 1px solid rgba(255,255,255,.06); }
  #grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px;
    padding: 16px 20px;
  }
  .cell {
    background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.09);
    border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 8px;
  }
  .cell canvas { width: 100%; height: auto; display: block; border-radius: 8px; background: rgba(0,0,0,.18); }
  .cell .label { font-size: 13px; color: #efe3cb; text-align: center; font-weight: 600; }
  @media (max-width: 1100px) { #grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { #grid { grid-template-columns: repeat(2, 1fr); padding: 10px; gap: 10px; } header .bar { margin-left: 0; width: 100%; } }
</style>
</head>
<body>
  <header>
    🧩 Generative Puzzle <span>生成式拼图</span> · 10 种切割检视
    <div class="bar">
      <label for="level">难度</label>
      <input id="level" type="range" min="1" max="8" step="1" />
      <button id="regen">重新生成（随机种子）</button>
    </div>
  </header>
  <div id="info"></div>
  <div id="grid"></div>
  <script>
${coreJs}
  </script>
  <script>
${appJsStr}
  </script>
</body>
</html>
`;
}

async function main() {
  const { level, out } = parseArgs(process.argv.slice(2));
  console.log("打包切割引擎（全部 10 种切割方式）...");
  const coreJs = await bundlePuzzleEngine();
  console.log("组装检视 Demo 页面...");
  const html = htmlDoc(appJs(level), coreJs);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, "utf-8");
  console.log("已生成: " + out);
  console.log("浏览器直接打开即可：同云朵形状 × 10 种切割结果并排检视，难度滑条统一控制");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
