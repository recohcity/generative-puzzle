# 添加切割方式：逐项清单

按顺序逐项核对。**每一项都必须有落点**，没有对应落点也要显式说明原因。改完跑 `scripts/verify_extension.ts`。

## 0. 前置决策

- [ ] 新切割属于**贯穿类**（一刀二分 → `IncrementalCutter`）还是**网络类**（多线交叉 → `NetworkCutter` / `MosaicGenerator` 族）？
  - 判断：是否可描述为"一条贯穿曲线/折线把当前碎片一分为二"。是 → 贯穿类；否（网格/裂纹/放射网络）→ 网络类。
- [ ] 曲边还是直边？（决定渲染层 `isCurvedShape` 是否需要改动）
- [ ] 中文名 ≤2 字、英文名 ≤2 词（事故 4）。

## 1. game-core 层（两处）

- [ ] `packages/game-core/src/types/puzzleTypes.ts`：`CutType` 枚举加新字符串值（如 `ThroughCurve = "through-curve"`），带注释。
- [ ] `packages/game-core/src/utils/score/ScoreCalculator.ts`：难度系数表加 `[CutType.New]: 系数`。系数档位参考：straight 1.0 / diagonal 1.15 / radial 1.25 / through-curve 1.3 / mosaic 1.35 / concavo 1.4。

## 2. 算法层

### 贯穿类

- [ ] `utils/puzzle/IncrementalCutter.ts`：新增贯穿路径生成器（返回 `{ p0, p1, p2 }` 或折线路径），或扩展 `createThroughCurve` 支持新形态。
- [ ] `utils/puzzle/PuzzleGenerator.ts`：分发分支加 `else if (cutType === CutType.New)`，调用时**用档位映射**：
  ```ts
  const settings = DIFFICULTY_SETTINGS[cutCount as keyof typeof DIFFICULTY_SETTINGS] ?? DIFFICULTY_SETTINGS[1];
  const result = IncrementalCutter.generate(shape, settings.targetCuts, bend?, seed?);
  ```
  **禁止** `IncrementalCutter.generate(shape, cutCount)`（事故 1）。

### 网络类

- [ ] 新建生成器（参照 `MosaicGenerator` / `ConcavoConvexGenerator` / `NetworkCutter` 结构）：`generate(shape, difficultyLevel, shapeType?)`，**内部按档位换算目标块数**（网络类用 `DIFFICULTY_SETTINGS[档位]` 或 `DIFFICULTY_METADATA` 区间）。
- [ ] `PuzzleGenerator.ts` 分发分支。

### 直线/斜线扩展（仅当新类型走 `generateCuts` 时）

- [ ] `cutGeneratorTypes.ts` / `cutGeneratorStrategies.ts` / `cutGeneratorGeometry.ts` / `cutGeneratorController.ts` / `cutGenerators.ts` 全链类型标注与生成逻辑。

## 3. i18n（两文件 × 两块，共 4 处）

- [ ] `src/i18n/locales/zh-CN.json`：`game.cutType` 块加键；顶层 `cutType` 块加键（**两个块都要**）。
- [ ] `src/i18n/locales/en.json`：同上。
- [ ] 键名：连字符枚举值 + 驼峰，**双键并存**（如 `"through-curve"` 与 `"throughCurve"`）。
- [ ] JSON 保持 4 空格缩进（事故 5），只动目标块。

## 4. UI 层

- [ ] `components/PuzzleControlsCutType.tsx`：按钮数组加 `{ id: <枚举值>, type: CutType.New, label: t('game.cutType.<驼峰>') }`。
- [ ] `components/layouts/DesktopLayout.tsx`：`getCutTypeMultiplier` 显示系数表加条目。
- [ ] `components/layouts/PhoneTabPanel.tsx`：检查是否有同款按钮/系数列表需同步。

## 5. 存档迁移

- [ ] `utils/data/GameDataManager.ts`：新增字符串映射。更名时**保留旧值别名**（`'curve': CutType.Radial` 模式）。改枚举值后 `MIGRATION_MAP` 必须覆盖旧存档。

## 6. 渲染判定

- [ ] `utils/rendering/puzzleDrawing.ts`：`isCurvedShape`（`shapeType !== "polygon" && cutType !== "mosaic-random" && cutType !== "concavo-convex"`）——曲边新类型默认已覆盖；直边新类型需显式加进排除列表。

## 7. 验证（全部通过才算完成）

- [ ] `npx tsx .agents/skills/generative-puzzle-extension/scripts/verify_extension.ts` 全绿。
- [ ] `npx tsc --noEmit -p tsconfig.json` 0 错误。
- [ ] `npx next lint` 无新增错误。
- [ ] 几何回归：多 seed × 3 形状 × 每档 targetCuts，成功 100%、面积误差 0.000%、缝合缺口 0、片数 = 刀数 + 1（贯穿类）。
- [ ] 结算页/按钮/榜单三种显示位点目视：中文、英文各一次。
- [ ] 旧存档兼容：带旧 cutType 字符串的存档读入后显示新类型名。
