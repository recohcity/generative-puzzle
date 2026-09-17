---
name: generative-puzzle-extension
description: "Generative Puzzle 项目的切割/形状/难度扩展规范。当用户要求新增或修改切割类型（切割方式）、拼图形状、难度档位、切割算法（曲线/S弯/折线/嵌齿/蜂巢/碎裂/鱼鳞等），或调整切割相关 i18n 文案、结算统计字段时使用。定义十种切割类型的架构分族、新增切割的标准流程、几何硬约束与一致性验证，防止新增能力破坏既有架构或引入几何缺陷（飞边、极小碎片、交叉越界）。"
---

# Generative Puzzle 扩展规范

本技能规范 `generative-puzzle` 项目切割引擎的扩展标准：任何新增形状、切割类型、难度档位或切割相关文案，必须先按本文档确认架构分族、几何约束与一致性检查，再落地代码。

## 架构总览

切割引擎统一入口 `utils/puzzle/PuzzleGenerator.ts`，按切割类型分派到六个生成器族：

| 生成器族 | 文件 | 适用切割类型 | 特性 |
| --- | --- | --- | --- |
| 直线切割族 | `utils/puzzle/cutGenerators.ts`（`generateCuts` + `splitPolygon`） | 直线、斜线 | 一次生成切割线后统一分割；带智能补偿（`applyExtraCutsWithRetry` / `ensureMinPieces`） |
| 图网络族 | `utils/puzzle/graph/`（`NetworkCutter`） | 放射 | 随机中心点放射式曲线，星形规律切割 |
| Voronoi 族 | `utils/puzzle/MosaicGenerator.ts` | 碎裂 | 马赛克式裂纹碎片（Voronoi 剖分） |
| 马赛克+曲边替换 | `utils/puzzle/ConcavoConvexGenerator.ts` | 鱼鳞（原凹凸） | Voronoi 剖分后内部共享边替换贝塞尔曲边 |
| 增量顺序切割族 | `utils/puzzle/IncrementalCutter.ts` | 曲线、S弯、折线、嵌齿 | 逐刀切割、结构共享，消除飞边；`CutPathKind = "through" \| "s-curve" \| "zigzag" \| "jigsaw"` |
| 六边形网格族 | `utils/puzzle/HexGenerator.ts` | 蜂巢 | 蜂窝单元边集合 → 图网络面提取 |

## 十种切割类型清单

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

## 新增切割类型的标准流程

> 每次只新增一种，逐个走完下列清单再交付，防止重蹈此前曲线/蜂巢反复返工的覆辙。

1. **枚举**：在 `CutType` 追加 kebab-case 值（如 `"wave"`），不得复用或更名旧值（存档映射依赖旧值）。
2. **生成器分派**：在 `PuzzleGenerator.generatePuzzle` 按分族接入。新增几何算法优先评估是否适合增量顺序切割族（`IncrementalCutter` 扩展 `CutPathKind`），这是唯一经实测消除贝塞尔飞边的路径。
3. **UI 按钮**：`components/PuzzleControlsCutType.tsx` 的类型数组追加 `{ id, type, label }`，`data-testid` 与 id 一致。
4. **i18n 双块**：`src/i18n/locales/zh-CN.json` 与 `en.json` 的 **两个块**都要加键：
   - `game.cutType.<key>`（面板按钮文案）
   - 顶层 `cutType.<key>`（结算页/统计文案）
   - 中英文名必须同步（中文 2-4 字为宜，如"放射/曲线"；英文首字母大写）。
5. **难度接线**：若新类型为增量顺序切割族，片数必须等于 `targetCuts + 1`；若存在碎片数下限要求（如折线最小 4 刀），在分派处显式抬升 `targetCuts`。
6. **几何硬约束（曲线族必须遵守）**：
   - S弯/折线逐刀切割、步骤输出（`cutSteps`），供游戏逐刀动画；
   - S弯永不互相交叉（下一条 S 只能在当前碎片内再切）；
   - 折线折角范围 30°-90°（含）内随机，同局可不同角度，但不得出现垂直/水平；
   - 任何切割不得产生超出形状边界的碎片（蜂巢曾出现边缘溢出，须按面积比例合并/裁剪极小碎片）。
7. **验证**：运行 `npx tsx .agents/skills/generative-puzzle-extension/scripts/verify_extension.ts`，要求输出"全部通过（N 个切割类型 × 8 档）"；再运行 `npx tsc --noEmit`。
8. **同步文档**：更新 `README.md`（切割模型节/banner 图）、`CHANGELOG.md`（合并收敛为一条最终成果，不保留修订打磨过程）。

## 更名规范

- 只允许文案更名（如 凹凸→鱼鳞、curve→放射）；枚举值与存档映射保持不变。
- i18n 双块中旧驼峰/连字符键均可保留作别名，业务代码统一用新枚举引用。
- `verify_extension.ts` 检查 1 会对每个枚举值校验双块双语言键存在，检查 3 会拦截被废弃枚举字面量残留。

## 难度档位

`utils/puzzle/cutGeneratorConfig.ts` 的 `DIFFICULTY_SETTINGS[1-8]` 与 `utils/difficulty/difficultyMetadata.ts` 的文案区间是唯一权威来源：

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

## 验证基线

当前状态（修订日期：2026-09-17）：10 个切割类型 × 8 档 × 2 形状 × 2 seed 全部通过，`npx tsc --noEmit` 通过。任何新增/修改后两项必须重新跑绿。
