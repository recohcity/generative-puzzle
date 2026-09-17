---
name: generative-puzzle-extension
description: "Generative Puzzle 项目的切割/形状/难度扩展规范与可复用资产入口。当用户要求新增或修改切割类型（切割方式）、拼图形状、难度档位、切割算法（曲线/S弯/折线/嵌齿/蜂巢/碎裂/鱼鳞等）、切割相关 i18n 文案或结算字段时使用；也用于从本项目几何核心（增量顺序切割器）快速生成可玩 DEMO、做多端适配，或引导新项目复用已验证的切割架构。定义十种切割类型的架构分族、新增切割的标准流程、几何硬约束、多端适配规范与一致性验证，防止新增能力破坏既有架构或引入几何缺陷（飞边、极小碎片、交叉越界）。"
---

# Generative Puzzle 扩展规范 + 可复用资产

本技能两部分：① 本项目切割引擎的扩展规范（新增/修改切割必须遵守）；② 已验证架构事实的可复用资产（几何核心独立模块、一键 DEMO 生成器、多端适配规范），供新项目快速起步。

## 一、扩展规范（本项目内新增/修改）

### 架构总览

切割引擎统一入口 `utils/puzzle/PuzzleGenerator.ts`，按切割类型分派到生成器族：

| 生成器族 | 文件 | 适用切割类型 | 特性 |
| --- | --- | --- | --- |
| 直线切割族 | `utils/puzzle/cutGenerators.ts`（`generateCuts` + `splitPolygon`） | 直线、斜线 | 一次生成切割线后统一分割；带智能补偿 |
| 图网络族 | `utils/puzzle/graph/`（`NetworkCutter`） | 放射 | 随机中心点放射式曲线，星形规律切割 |
| Voronoi 族 | `utils/puzzle/MosaicGenerator.ts` | 碎裂 | 马赛克式裂纹碎片 |
| 马赛克+曲边替换 | `utils/puzzle/ConcavoConvexGenerator.ts` | 鱼鳞（原凹凸） | Voronoi 剖分后内部共享边替换贝塞尔曲边 |
| 增量顺序切割族 | `packages/game-core/src/utils/geometry/IncrementalCutter.ts` | 曲线、S弯、折线、嵌齿 | 逐刀切割、结构共享，消除飞边；`CutPathKind = "through" \| "s-curve" \| "zigzag" \| "jigsaw"` |
| 六边形网格族 | `utils/puzzle/HexGenerator.ts` | 蜂巢 | 蜂窝单元边集合 → 图网络面提取 |

业务层 `utils/puzzle/IncrementalCutter.ts` 仅为 re-export，几何核心的单一事实来源是 `packages/game-core/src/utils/geometry/IncrementalCutter.ts`（无框架纯 TS）。

**两族引擎入口（并存是设计事实，勿当重复重构）**：直线/斜线族走「一次性生成切割线」路径——`cutGenerators.generateCuts` → `CutGeneratorController` → `CutGenerationStrategy` 策略工厂（配置在 `cutGeneratorConfig`、专用几何在 `cutGeneratorGeometry`、校验在 `cutGeneratorValidator`）；增量族（曲线/S弯/折线/嵌齿）走 `IncrementalCutter` 逐刀路径，输出 `cutSteps` 供逐刀动画。两条路径服务于不同切割语义（一次切割线 vs 顺序逐刀），各自独立自洽。

**几何边界**：`packages/game-core/src/utils/geometry/puzzleGeometry.ts` 是**通用几何**（质心、点在多边形内、旋转、角度、bounds）；`utils/puzzle/cutGeneratorGeometry.ts` 是**切割线专用几何**（CutLine/Bounds、线段相交、切割线生成与去重）。两者职责不同、无实质重复，勿合并；新增通用几何进 game-core，新增切割专用几何进 cutGeneratorGeometry。

### 十种切割类型清单

枚举定义于 `packages/game-core/src/types/puzzleTypes.ts` 的 `CutType`：

| 枚举值 | 中文名 | 英文名 | 生成器族 | 关键约束 |
| --- | --- | --- | --- | --- |
| `Straight` (`"straight"`) | 直线 | Straight | 直线切割族 | 平行/垂直切割线 |
| `Diagonal` (`"diagonal"`) | 斜线 | Diagonal | 直线切割族 | 随机角度斜切 |
| `Radial` (`"radial"`) | 放射 | Radial | 图网络族 | 由 `curve` 更名而来；旧存档映射保留 |
| `ThroughCurve` (`"through-curve"`) | 曲线 | Curve | 增量顺序切割族 | 真随机贯穿贝塞尔曲线；片数 = 刀数 + 1 |
| `SCurve` (`"s-curve"`) | S弯 | S-Curve | 增量顺序切割族 | 大 S 双曲、永不互相交叉；逐刀步骤输出 |
| `Zigzag` (`"zigzag"`) | 折线 | Zigzag | 增量顺序切割族 | 单 V 折角 30°-90°，每刀只切一块；最小 4 刀起步 |
| `Jigsaw` (`"jigsaw"`) | 嵌齿 | Jigsaw | 增量顺序切割族 | 锯齿互嵌边 |
| `MosaicRandom` (`"mosaic-random"`) | 碎裂 | Mosaic | Voronoi 族 | 裂纹碎片 |
| `ConcavoConvex` (`"concavo-convex"`) | 鱼鳞 | Fish Scale | 马赛克+曲边替换 | 原名凹凸，更名仅文案 |
| `Hex` (`"hex"`) | 蜂巢 | Hex | 六边形网格族 | 规则六边形网格 |

### 新增切割类型的标准流程

> 每次只新增一种，逐个走完下列清单再交付，防止重蹈此前曲线/蜂巢反复返工的覆辙。

1. **枚举**：在 `CutType` 追加 kebab-case 值，不得复用或更名旧值（存档映射依赖旧值）。
2. **生成器分派**：在 `PuzzleGenerator.generatePuzzle` 按分族接入。新增几何算法优先评估是否适合增量顺序切割族（扩展 `CutPathKind`），这是唯一经实测消除贝塞尔飞边的路径。
3. **UI 按钮**：`components/PuzzleControlsCutType.tsx` 类型数组追加 `{ id, type, label }`，`data-testid` 与 id 一致。
4. **i18n 双块**：`src/i18n/locales/zh-CN.json` 与 `en.json` 的 **两个块**都要加键：`game.cutType.<key>`（面板）与顶层 `cutType.<key>`（结算页/统计）；中英文名同步（中文 2-4 字，英文首字母大写）。
5. **难度接线**：若为增量顺序切割族，片数必须等于 `targetCuts + 1`；有碎片数下限的（如折线最小 4 刀）在分派处显式抬升 `targetCuts`。
6. **几何硬约束（曲线族必须遵守）**：
   - S弯/折线逐刀切割、步骤输出（`cutSteps`），供逐刀动画；
   - S弯永不互相交叉（下一条 S 只能在当前碎片内再切）；
   - 折线折角范围 30°-90°，同局可不同角度，不得出现垂直/水平；
   - 任何切割不得产生超出形状边界的碎片（蜂巢曾出现边缘溢出，须按面积比例合并/裁剪极小碎片）。
7. **多端核对**：低难度 × 小碎片在触控端（手机/iPad）是否可拾取，见 `references/adaptive-ui.md`。
8. **验证**：运行下面两条，均须全绿；再 `npx tsc --noEmit`。
9. **同步文档**：更新 `README.md`（切割模型节/banner 图）、`CHANGELOG.md`（合并收敛为一条最终成果，不保留修订打磨过程）。

### 更名规范

- 只允许文案更名（如 凹凸→鱼鳞、curve→放射）；枚举值与存档映射保持不变。
- i18n 双块中旧驼峰/连字符键均可保留作别名，业务代码统一用新枚举引用。
- `verify_extension.ts` 检查 1 校验双块双语言键存在，检查 3 拦截被废弃枚举字面量残留。

### 难度档位

`utils/puzzle/cutGeneratorConfig.ts` 的 `DIFFICULTY_SETTINGS[1-8]` 与 `utils/difficulty/difficultyMetadata.ts` 文案区间是唯一权威来源：

| 档位 | targetCuts（切割线/刀数） | pieceRange 文案 |
| --- | --- | --- |
| 1 入门 | 2 | 2 - 4 |
| 2 简单 | 3 | 4 - 6 |
| 3 初级 | 4 | 5 - 8 |
| 4 中级 | 6 | 7 - 12 |
| 5 中高级 | 8 | 9 - 16 |
| 6 高级 | 10 | 11 - 20 |
| 7 专家 | 12 | 13 - 24 |
| 8 大师 | 15 | 16 - 30 + |

注意：`targetCuts` 是切割线/刀数而非切割次数；增量族片数 = targetCuts + 1；直线/斜线族片数随机但须 ≥ pieceRange.min。

## 二、可复用资产（新项目快速起步）

以下资产均从本项目已验证架构提炼，**不复制代码**——几何核心仍在主仓库，资产只负责引导与组装。

### 1. 几何核心独立模块

- **位置**：`packages/game-core/src/utils/geometry/IncrementalCutter.ts`（纯 TS、零框架依赖，`Point` 仅含 x/y/isOriginal）
- **导出**：`IncrementalCutter.generate(shape, cuts, bend=0.45, seed?, kind)` → `{ pieces, curves, log, steps }`；静态方法含 `createThroughCurve / createSCurvePoints / createZigzagPoints / createJigsawPoints / tryCut`
- **核心里面量**（复用方必须维持）：碎片数 = 成功刀数 + 1；面积守恒误差 < 1e-3（实测 ~1e-14）；单刀失败只重试该刀（≤40 次）；结构共享保证缝合缺口恒 0
- **四种路径形态**：`through`（贯穿曲线）/ `s-curve`（S弯，永不交叉）/ `zigzag`（折线，折角 30-90°）/ `jigsaw`（嵌齿）

### 2. 一键 DEMO 生成器（10 种切割同时检视）

```bash
npx tsx .agents/skills/generative-puzzle-extension/scripts/generate_demo.ts \
  --level 6 --out ./demos/demo.html
```

- 可选：`--level 1-8`（默认 6，统一控制全部 10 格切割片数）、`--out` 输出路径
- 产物：**单文件自包含 HTML**（esbuild 现场打包 `utils/puzzle/PuzzleGenerator.ts` 切割引擎内联，含全部 10 种生成器，无外部依赖）；页面在同一不规则云朵形状上并排展示 10 种切割结果（5×2 网格，每格标注类型与片数），难度滑条统一控制、每局随机种子，**纯检视比对、无拖拽交互**
- 新项目接入：复制脚本到新仓库，把 bundle 入口与 `alias` 指向自己的生成器路径（或直接以 npm 依赖引入 `@generative-puzzle/game-core`），其余不变

### 3. 几何核心自测

```bash
npx tsx .agents/skills/generative-puzzle-extension/scripts/verify_incremental_cutter.ts
```

- 检查：片数不变量、面积守恒（<1e-3）、碎片合法性（≥3 顶点）、刀成功率阈值（贯穿 ≥99%，其余 ≥97%）
- 覆盖：4 kind × 2 形状 × 5 seed × 4 刀数 = 160 局；基线：成功率 100%、面积误差 ~1e-14

### 4. 多端适配规范

`references/adaptive-ui.md` —— 设备分型（`getDeviceType`）、`--panel-scale` 缩放体系、移动端信息取舍、**几何层 × 端能力联动**（碎片可拾取下限随端变化）、三端验证清单。新项目直接套用该清单。

## 三、验证基线

- `verify_extension.ts`：10 个切割类型 × 8 档 × 2 形状 × 2 seed 全部通过（2026-09-17）。
- `verify_incremental_cutter.ts`：160 局全绿（2026-09-17）。
- 任何新增/修改后必须重跑上述两项 + `npx tsc --noEmit`。
