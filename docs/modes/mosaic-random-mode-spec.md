# 随机碎裂切割模式 (CutType.MosaicRandom) 技术方案规范

## 1. 需求与背景

在现有的直线（Straight）、斜线（Diagonal）与曲线（Curve）贯穿式割线模式基础之上，新增 **`CutType.MosaicRandom`（完全随机碎裂）** 模式。
作为全新“马赛克/花窗”切分体系的 MVP（最小可行性验证）版本，该模式旨在验证：
- 基于 Voronoi 晶格多边形剖分算法在 HTML5 Canvas 上的渲染性能与割线视觉。
- 玩家在面对非规则咬合多边形碎片时的拼合手感、旋转识别与认知体验。

---

## 2. 核心机制与几何算法设计

### 2.1 算法流程
1. **形状兼容与边界约束**：获取当前原始形状顶点数组 `shape: Point[]` 及其外接矩形 `Bounds`。无缝兼容全 3 种形状基础类型（Polygon 多边形、Cloud 云朵形、Jagged 锯齿形），均能在其内部生成对应的 MosaicRandom 碎片。
2. **种子点采样与生成数量控制 (Seed Point Sampling & Quantity Control)**：
   - 生成数量严格沿用当前 1-8 级难度体系计算生成（根据 `cutCount` 计算目标碎片量 $N$）。
   - 使用 **泊松盘采样 (Poisson Disc Sampling)** 或受控随机点在形状内部产生 $N$ 个均匀分布且保持最小距离约束的随机种子点。
3. **Voronoi 胞腔剖分 (Voronoi Cell Subdivision)**：
   - 计算种子点集与原始形状 `shape` 的多边形交集，生成 $N$ 个封闭多边形胞腔 `Point[]`。
4. **边缘抖动化 (Jagged Border Distort)**：
   - 将相邻胞腔之间的直边界微幅插值抖动，生成自然不规则的咬合锯齿折线。
5. **碎片样式与配色机制 (Piece Styling & Color Palette)**：
   - 碎片样式与配色继续完全沿用当前项目拼图生成时使用的配色样式机制（例如暖色调色板随机打乱分配及 Canvas 纹理与边框渲染逻辑）。

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
  - 封装 Voronoi 剖分与多边形裁剪核心逻辑，暴露 `generate(shape: Point[], cutCount: number, shapeType?: ShapeType): Point[][]`。
- **[MODIFY] [PuzzleGenerator.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/utils/puzzle/PuzzleGenerator.ts)**
  - 在 `generatePuzzle` 方法中接入分支，碎片生成后统一复用现有 `colors` 打乱分配与样式属性逻辑：
    ```typescript
    if (cutType === CutType.MosaicRandom) {
      splitPieces = MosaicGenerator.generate(shape, cutCount, shapeType);
    }
    ```

### 3.3 计分与难度系统 (`packages/game-core`)
- **[MODIFY] [ScoreCalculator.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/packages/game-core/src/utils/score/ScoreCalculator.ts)**
  - 为 `CutType.MosaicRandom` 配置对应的难度乘数系数（设定为 1.35x ~ 1.4x），与现有 Straight (1.0x)、Diagonal (1.15x)、Curve (1.25x) 形成差异化梯度，让用户清晰感知到马赛克碎裂模式在分数结算上的难度区别。

### 3.4 UI 与国际化
- **[MODIFY] [zh.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/src/i18n/locales/zh.ts)** & **[en.ts](file:///Users/citylivepark/Documents/project/generative-puzzle/src/i18n/locales/en.ts)**
  - 新增翻译键：`"cutType.mosaicRandom": "马赛克碎裂"` / `"Mosaic"`。
- **[MODIFY] 切割类型选择组件**
  - 在选项组中增加【马赛克碎裂】选项按钮。

---

## 4. 验证计划

1. **构建与类型检查**：
   - 运行 `npm run build && npm run lint` 确保类型无报错。
2. **运行时验证**：
   - **多形状适配**：验证 Polygon（多边形）、Cloud（云朵形）、Jagged（锯齿形）3 种形状下均能正常生成 MosaicRandom 碎片。
   - **样式与配色继承**：确认生成碎片的配色与样式逻辑完全继承现有暖色调色板与渲染规则。
   - **生成数量一致性**：确认 1-8 级难度下的碎片数量按现有难度体系规则正确生成。
   - **难度系数差异化**：验证结算面板中 `CutType.MosaicRandom` 难度系数（如 1.35x）准确计算生效。
   - **性能体验**：在百级碎片量下，移动端与桌面端 Canvas 依然保持 60FPS 顺畅拖拽与渲染。

