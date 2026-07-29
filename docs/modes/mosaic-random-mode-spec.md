# 随机碎裂切割模式 (CutType.MosaicRandom) 技术方案规范

## 1. 需求与背景

在现有的直线（Straight）、斜线（Diagonal）与曲线（Curve）贯穿式割线模式基础之上，新增 **`CutType.MosaicRandom`（完全随机碎裂）** 模式。
作为全新“马赛克/花窗”切分体系的 MVP（最小可行性验证）版本，该模式旨在验证：
- 基于 Voronoi 晶格多边形剖分算法在 HTML5 Canvas 上的渲染性能与割线视觉。
- 玩家在面对非规则咬合多边形碎片时的拼合手感、旋转识别与认知体验。

---

## 2. 核心机制与几何算法设计

### 2.1 算法流程
1. **边界约束**：获取当前原始形状的顶点数组 `shape: Point[]` 及其外接矩形 `Bounds`。
2. **种子点采样 (Seed Point Sampling)**：
   - 根据难度系数 `cutCount` 确定生成碎片目标数量 $N$。
   - 使用 **泊松盘采样 (Poisson Disc Sampling)** 在形状内部产生 $N$ 个均匀分布且保持最小距离约束的随机种子点。
3. **Voronoi 胞腔剖分 (Voronoi Cell Subdivision)**：
   - 计算种子点集与原始形状 `shape` 的多边形交集，生成 $N$ 个封闭多边形胞腔 `Point[]`。
4. **边缘抖动化 (Jagged Border Distort)**：
   - 将相邻胞腔之间的直边界微幅插值抖动，生成自然不规则的咬合锯齿折线。

### 2.2 防护与防呆机制 (Quality Control)
- **最小面积校验**：碎片面积小于设定阈值（如总面积的 1.5%）时，自动将其与邻近碎片合并，避免产生无法触控拖拽的极小微粒。
- **简单多边形保证**：校验顶点顺序并防范自交，输出严格符合 `Point[]` 标准的 2D 凸/简单凹多边形。

---

## 3. 模块影响分析与代码变更清单

按项目分层规范，影响范围限定如下：

### 3.1 核心类型扩展 (`packages/game-core`)
- **[MODIFY] [puzzleTypes.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/packages/game-core/src/types/puzzleTypes.ts)**
  - 扩展 `CutType` 枚举：
    ```typescript
    export enum CutType {
      Straight = "straight",
      Diagonal = "diagonal",
      Curve = "curve",
      MosaicRandom = "mosaic-random", // 🆕 新增随机马赛克碎裂模式
    }
    ```

### 3.2 几何切割算法 (`utils/puzzle/`)
- **[NEW] [MosaicGenerator.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/utils/puzzle/MosaicGenerator.ts)**
  - 封装 Voronoi 剖分与多边形裁剪核心逻辑，暴露 `generate(shape: Point[], cutCount: number): Point[][]`。
- **[MODIFY] [PuzzleGenerator.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/utils/puzzle/PuzzleGenerator.ts)**
  - 在 `generatePuzzle` 方法中接入分支：
    ```typescript
    if (cutType === CutType.MosaicRandom) {
      splitPieces = MosaicGenerator.generate(shape, cutCount);
    }
    ```

### 3.3 计分与难度系统 (`packages/game-core`)
- **[MODIFY] [ScoreCalculator.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/packages/game-core/src/utils/score/ScoreCalculator.ts)**
  - 为 `CutType.MosaicRandom` 配置对应的难度乘数系数（如 1.5x），反映更高的视觉辨识与旋转匹配难度。

### 3.4 UI 与国际化
- **[MODIFY] [zh.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/src/i18n/locales/zh.ts)** & **[en.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/src/i18n/locales/en.ts)**
  - 新增翻译键：`"cutType.mosaicRandom": "随机碎裂"` / `"Mosaic"`。
- **[MODIFY] 切割类型选择组件**
  - 在选项组中增加【随机碎裂】按钮。

---

## 4. 验证计划

1. **构建与类型检查**：
   - 运行 `npm run build && npm run lint` 确保类型无报错。
2. **运行时验证**：
   - 检查在各难度片数下生成的碎块无重叠、无遗漏空隙。
   - 验证在百级碎片量下，移动端与桌面端 Canvas 依然保持 60FPS 顺畅拖拽。
