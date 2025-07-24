# 生成式拼图游戏 - 配置说明

> 修订日期：2025-07-24 (v1.3.33 统一架构重构完成更新)

本文档详细列举并说明本项目所有关键配置点、参数、核心算法入口及其对应的源文件，便于开发者理解、调整和维护游戏行为。每次配置或算法有变动都需同步修订。

---

## 目录

1. 主要配置文件与分工
2. 统一架构管理器配置（v1.3.33新增）
3. 难度与切割配置
4. 形状生成配置
5. 拼图散开与分布配置
6. 碰撞与回弹配置
7. 旋转配置
8. 设备适配与响应式配置
9. 拼图块适配系统配置（Step3新增）
10. 媒体资源与音效配置
11. 视觉与主题配置
12. 构建与开发配置
13. 性能测试与报告配置
14. UI 组件配置
15. 触摸事件与交互配置
16. F10 Debug 调试模式配置

---

## 1. 主要配置文件与分工

### 核心业务逻辑
- `utils/puzzle/cutGenerators.ts`：切割算法与难度映射
- `utils/puzzle/PuzzleGenerator.ts`：拼图块生成主逻辑
- `utils/puzzle/ScatterPuzzle.ts`：拼图块散布与分布算法
- `utils/shape/ShapeGenerator.ts`：基础形状生成与参数
- `utils/puzzlePieceAdaptationUtils.ts`：拼图块适配工具函数（Step3新增）

### 统一架构管理器（v1.3.33新增）
- `utils/managers/DeviceManager.ts`：统一设备检测管理器，单例模式
- `utils/managers/CanvasManager.ts`：统一画布管理器，单例模式
- `utils/managers/EventManager.ts`：统一事件管理器，单例模式
- `utils/managers/AdaptationEngine.ts`：统一适配引擎管理器

### 状态与组件
- `contexts/GameContext.tsx`：全局游戏状态、边界检测、回弹、适配（v1.3.33增强：统一架构支持）
- `components/PuzzleCanvas.tsx`：主画布渲染与交互（v1.3.33重构：使用统一管理器）
- `components/GameInterface.tsx`、`components/layouts/`：多端布局与适配（v1.3.33重构：迁移到统一系统）

### 统一架构Hooks（v1.3.33新增）
- `hooks/useDevice.ts`：统一设备检测Hook，替代分散的设备检测逻辑
- `hooks/useCanvas.ts`：统一画布管理Hook，替代分散的画布状态管理
- `hooks/useEventManager.ts`：统一事件管理Hook，替代分散的事件监听器

### 传统Hooks（保持兼容）
- `hooks/useShapeAdaptation.ts`：形状与拼图块同步适配（Step2-3）
- `hooks/usePuzzleAdaptation.ts`：散开拼图适配（Step2）
- `hooks/useResponsiveCanvasSizing.ts`：响应式尺寸管理
- `hooks/useDeviceDetection.ts`：传统设备检测（逐步迁移中）

### 其他配置
- `utils/rendering/soundEffects.ts`：音效管理
- `public/`：静态资源（图片、音效）
- `tailwind.config.ts`、`components.json`：UI 主题与组件
- `next.config.mjs`：构建配置

### 文档体系
- `docs/difficulty-design.md`：难度与切割设计说明
- `docs/puzzle_memory_adaptation_optimization/`：拼图记忆适配优化文档
  - `step1_canvas_adaptation_plan.md`：画布适配系统（Step1）
  - `step2_shape_adaptation_plan.md`：智能形状适配系统（Step2）
  - `step3/`：拼图块适配系统文档集（Step3）
- `docs/rebuild/`：统一架构重构文档（v1.3.33新增）
  - `重构前分析.md`：重构前问题分析
  - `plan.md`：重构计划和实施方案
  - `REFACTORING_SUMMARY.md`：重构过程总结

---

## 2. 统一架构管理器配置（v1.3.33新增）

### DeviceManager 配置

- **singleton**  
  作用：单例模式，确保全局唯一的设备检测实例  
  取值范围：DeviceManager.getInstance()  
  默认值：自动创建单例  
  影响点：设备检测一致性、内存优化  
  配置/代码位置：`utils/managers/DeviceManager.ts`

- **deviceDetectionCache**  
  作用：设备检测结果缓存，避免重复计算  
  取值范围：{ isMobile: boolean, isPortrait: boolean, deviceType: string }  
  默认值：首次检测时自动缓存  
  影响点：性能优化、检测一致性  
  配置/代码位置：`utils/managers/DeviceManager.ts`

### CanvasManager 配置

- **singleton**  
  作用：单例模式，确保全局唯一的画布管理实例  
  取值范围：CanvasManager.getInstance()  
  默认值：自动创建单例  
  影响点：画布状态一致性、内存优化  
  配置/代码位置：`utils/managers/CanvasManager.ts`

- **canvasStateCache**  
  作用：画布状态缓存，统一管理画布尺寸、缩放等状态  
  取值范围：{ size: CanvasSize, scale: number, orientation: string }  
  默认值：初始化时自动设置  
  影响点：画布适配、状态同步  
  配置/代码位置：`utils/managers/CanvasManager.ts`

### EventManager 配置

- **singleton**  
  作用：单例模式，确保全局唯一的事件管理实例  
  取值范围：EventManager.getInstance()  
  默认值：自动创建单例  
  影响点：事件监听器管理、内存优化  
  配置/代码位置：`utils/managers/EventManager.ts`

- **eventListenerRegistry**  
  作用：事件监听器注册表，避免重复监听  
  取值范围：Map<string, EventListener[]>  
  默认值：空Map，动态注册  
  影响点：事件监听器优化、内存泄漏防护  
  配置/代码位置：`utils/managers/EventManager.ts`

- **maxListenersPerEvent**  
  作用：每个事件类型的最大监听器数量限制  
  取值范围：1~10  
  默认值：3  
  影响点：性能优化、内存控制  
  配置/代码位置：`utils/managers/EventManager.ts`

### AdaptationEngine 配置

- **singleton**  
  作用：单例模式，确保全局唯一的适配引擎实例  
  取值范围：AdaptationEngine.getInstance()  
  默认值：自动创建单例  
  影响点：适配逻辑统一、性能优化  
  配置/代码位置：`utils/managers/AdaptationEngine.ts`

- **adaptationQueue**  
  作用：适配任务队列，避免并发适配冲突  
  取值范围：Queue<AdaptationTask>  
  默认值：空队列，动态添加任务  
  影响点：适配性能、状态一致性  
  配置/代码位置：`utils/managers/AdaptationEngine.ts`

### 统一架构性能指标

- **managerInitTime**  
  作用：管理器初始化时间基准  
  取值范围：<10ms  
  默认值：自动测量  
  影响点：启动性能  
  配置/代码位置：各管理器构造函数

- **eventListenerReduction**  
  作用：事件监听器数量减少比例  
  取值范围：85%减少（从~20个到3个）  
  默认值：自动统计  
  影响点：内存使用、性能优化  
  配置/代码位置：`utils/managers/EventManager.ts`

- **codeReductionRatio**  
  作用：代码重复度减少比例  
  取值范围：70%减少  
  默认值：重构后自动达成  
  影响点：维护性、可读性  
  配置/代码位置：全局重构成果

---

## 3. 难度与切割配置

- **cutCount**（切割次数）  
  作用：用户选择的拼图切割难度，决定实际切割线数和拼图块数  
  取值范围：1~8（整数）  
  默认值：3  
  影响点：拼图块数量、分布、吸附、回弹等  
  配置/代码位置：`GameContext` 状态、`PuzzleControlsCutCount.tsx`、`cutGenerators.ts`

- **cutType**（切割类型）  
  作用：决定切割线类型  
  取值范围：'straight' | 'diagonal'  
  默认值：'straight'  
  影响点：切割算法、拼图块形状  
  配置/代码位置：`GameContext` 状态、`PuzzleControlsCutType.tsx`、`cutGenerators.ts`

- **useCenterCutProbability**  
  作用：低难度时优先生成穿过中心的切割线  
  取值范围：0~1（随难度动态调整）  
  默认值：0.8（低难度），0.2（高难度）  
  影响点：切割线分布  
  配置/代码位置：`cutGenerators.ts`

- **useExtremeRandomness**  
  作用：高难度时放宽切割线生成条件，增加随机性  
  取值范围：布尔  
  默认值：false（低难度），true（高难度）  
  影响点：切割线生成  
  配置/代码位置：`cutGenerators.ts`

---

## 3. 形状生成配置

- **shapeType**  
  作用：决定基础形状类型  
  取值范围：'polygon' | 'curve' | 'irregular'  
  默认值：'polygon'  
  影响点：形状生成、拼图块形状  
  配置/代码位置：`GameContext` 状态、`ShapeControls.tsx`、`ShapeGenerator.ts`

- **numPoints**  
  作用：多边形顶点数  
  取值范围：5~12（随设备/难度动态调整）  
  默认值：8（桌面），6（移动端）  
  影响点：多边形复杂度  
  配置/代码位置：`ShapeGenerator.ts`

- **detail**  
  作用：曲线/不规则圆形的细节点数  
  取值范围：60~200  
  默认值：200（桌面），120（移动端）  
  影响点：曲线平滑度  
  配置/代码位置：`ShapeGenerator.ts`

- **amplitude**  
  作用：不规则圆形的扰动幅度  
  取值范围：0~0.2  
  默认值：0.08（桌面），0.04（移动端）  
  影响点：形状不规则程度  
  配置/代码位置：`ShapeGenerator.ts`

- **STANDARD_SIZE**  
  作用：所有形状归一化的基准尺寸  
  取值范围：1000（常量）  
  默认值：1000  
  影响点：归一化、缩放、适配  
  配置/代码位置：`ShapeGenerator.ts`、`constants.ts`

---

## 4. 拼图散开与分布配置

- **distributionType**  
  作用：决定拼图块散布算法  
  取值范围：'spiral'（竖屏）|'grid'（桌面/横屏）  
  默认值：随设备/方向自动切换  
  影响点：拼图初始分布  
  配置/代码位置：`ScatterPuzzle.ts`、`GameInterface.tsx`

- **distributionFactor**  
  作用：控制拼图块分散程度  
  取值范围：0.5~2.0（随难度动态调整）  
  默认值：1.0  
  影响点：拼图块间距  
  配置/代码位置：`ScatterPuzzle.ts`

- **safeMargin**  
  作用：画布边缘安全距离，防止拼图超出可视区域  
  取值范围：20~80（像素，随设备/难度动态调整）  
  默认值：40  
  影响点：拼图块初始位置  
  配置/代码位置：`ScatterPuzzle.ts`

---

## 5. 碰撞与回弹配置

- **bounceBackFactor**  
  作用：控制拼图块碰撞边界后的回弹强度  
  取值范围：0.1~0.6  
  默认值：0.4  
  影响点：回弹距离  
  配置/代码位置：`GameContext.tsx`

- **maxBounceDistance**  
  作用：回弹距离上限  
  取值范围：30~80（像素）  
  默认值：60  
  影响点：回弹效果  
  配置/代码位置：`GameContext.tsx`

- **collisionThreshold**  
  作用：边界检测的精度阈值  
  取值范围：0.05~0.2（像素）  
  默认值：0.1  
  影响点：碰撞检测灵敏度  
  配置/代码位置：`GameContext.tsx`

---

## 6. 旋转配置

- **rotationStep**  
  作用：每次旋转的角度增量  
  取值范围：15（度，常量）  
  默认值：15  
  影响点：旋转操作、吸附判定  
  配置/代码位置：`ScatterPuzzle.ts`、`GameContext.tsx`

- **initialRotationRange**  
  作用：拼图块散开时的初始角度范围  
  取值范围：0~345（度，随设备/难度动态调整）  
  默认值：0~90（竖屏），0~180（桌面/横屏）  
  影响点：拼图初始状态  
  配置/代码位置：`ScatterPuzzle.ts`

---

## 8. 设备适配与响应式配置

### 统一设备检测系统（v1.3.33重构）

- **useDevice Hook**  
  作用：统一设备检测Hook，替代分散的设备检测逻辑  
  取值范围：{ isMobile: boolean, isPortrait: boolean, deviceType: string }  
  默认值：自动检测  
  影响点：所有组件的设备检测逻辑  
  配置/代码位置：`hooks/useDevice.ts`、`utils/managers/DeviceManager.ts`

- **DeviceManager单例**  
  作用：全局唯一的设备检测管理器，避免重复检测  
  取值范围：DeviceManager.getInstance()  
  默认值：单例自动创建  
  影响点：设备检测性能、一致性  
  配置/代码位置：`utils/managers/DeviceManager.ts`

### 统一画布管理系统（v1.3.33重构）

- **useCanvas Hook**  
  作用：统一画布管理Hook，替代分散的画布状态管理  
  取值范围：{ canvasSize: CanvasSize, scale: number, updateCanvas: Function }  
  默认值：自动初始化  
  影响点：所有布局组件的画布管理  
  配置/代码位置：`hooks/useCanvas.ts`、`utils/managers/CanvasManager.ts`

- **CanvasManager单例**  
  作用：全局唯一的画布管理器，统一管理画布状态  
  取值范围：CanvasManager.getInstance()  
  默认值：单例自动创建  
  影响点：画布状态一致性、性能优化  
  配置/代码位置：`utils/managers/CanvasManager.ts`

### 传统配置（保持兼容）

- **canvasMaxSize**  
  作用：画布最大尺寸（竖屏强制正方形）  
  取值范围：320~1024（像素，随设备/窗口动态调整）  
  默认值：桌面 800，移动端 360  
  影响点：画布、拼图缩放、适配  
  配置/代码位置：`useResponsiveCanvasSizing.ts`、`PuzzleCanvas.tsx`（v1.3.33：通过统一管理器管理）
  
- **全局画布与面板自适应**  
  作用：桌面端/移动端竖屏/横屏下，画布始终正方形最大化利用空间，面板与画布高度联动，所有自适应逻辑由父容器驱动，PuzzleCanvas 只需100%适配父容器。  
  配置/代码位置：`GameContext.tsx`（集中管理画布状态）、`PhoneTabPanel.tsx`（移动端Tab面板集中管理）、`DesktopLayout.tsx`、`PhonePortraitLayout.tsx`、`PhoneLandscapeLayout.tsx`（v1.3.33：迁移到useCanvas()）  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

- **拼图块适配系统**  
  作用：未散开拼图块与目标形状同步适配，保持完美重叠和画布居中对齐  
  配置/代码位置：`hooks/useShapeAdaptation.ts`（拼图块同步适配）、`utils/puzzlePieceAdaptationUtils.ts`（绝对坐标适配算法）  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step3/`。

- **绝对坐标适配算法**  
  作用：基于画布中心的绝对坐标适配，彻底解决累积误差问题  
  取值范围：画布中心作为唯一基准点  
  默认值：启用  
  影响点：拼图块位置、尺寸、旋转  
  配置/代码位置：`utils/puzzlePieceAdaptationUtils.ts`（adaptPuzzlePiecesAbsolute函数）

- **basePuzzle状态**  
  作用：保存原始拼图块状态，作为拼图块适配的基准  
  取值范围：PuzzlePiece[] | null  
  默认值：null（初始），生成拼图后自动设置  
  影响点：拼图块适配、状态记忆  
  配置/代码位置：`contexts/GameContext.tsx`（SET_BASE_PUZZLE action）

- **tabPanelAdaptive**  
  作用：移动端Tab面板集中管理，PhoneTabPanel组件负责tab切换与内容区像素级布局，所有tab内容与全局状态同步，tab与画布高度联动。  
  配置/代码位置：`components/layouts/PhoneTabPanel.tsx`、`GameContext.tsx`  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

### 组件迁移状态（v1.3.33）

- **已迁移组件**  
  作用：已成功迁移到统一架构的组件列表  
  组件列表：  
    - 所有控制组件：ActionButtons、ShapeControls、PuzzleControls系列、PuzzleControlsGamepad、PuzzleControlsScatter  
    - 所有布局组件：DesktopLayout、PhoneLandscapeLayout、PhonePortraitLayout  
    - 背景组件：ResponsiveBackground  
    - 核心组件：PuzzleCanvas  
  影响点：代码重复度降低70%，事件监听器减少85%  
  配置/代码位置：各组件文件（使用useDevice()、useCanvas()、useEventManager()）

---

## 9. 拼图块适配系统配置（Step3新增）

- **adaptPuzzlePiecesAbsolute**  
  作用：基于画布中心的绝对坐标适配算法，彻底解决累积误差问题  
  取值范围：函数参数 - 原始拼图块、原始画布尺寸、当前画布尺寸  
  默认值：启用  
  影响点：拼图块位置、尺寸、旋转  
  配置/代码位置：`utils/puzzlePieceAdaptationUtils.ts`

- **useShapeAdaptation扩展**  
  作用：扩展形状适配钩子，支持拼图块与形状同步适配  
  取值范围：Hook函数  
  默认值：启用  
  影响点：拼图块适配、状态管理  
  配置/代码位置：`hooks/useShapeAdaptation.ts`

- **shouldAdaptPuzzlePieces**  
  作用：智能检测是否需要适配拼图块（未散开状态）  
  取值范围：布尔  
  默认值：自动检测 - state.puzzle && !state.isScattered && state.originalShape.length > 0  
  影响点：拼图块适配触发条件  
  配置/代码位置：`hooks/useShapeAdaptation.ts`

- **basePuzzle状态**  
  作用：保存原始拼图块状态，作为拼图块适配的基准  
  取值范围：PuzzlePiece[] | null  
  默认值：null（初始），生成拼图后自动设置  
  影响点：拼图块适配、状态记忆  
  配置/代码位置：`contexts/GameContext.tsx`（SET_BASE_PUZZLE action）

- **baseCanvasSize状态**  
  作用：保存原始画布尺寸，作为适配计算的基准  
  取值范围：{ width: number, height: number } | undefined  
  默认值：undefined（初始），生成拼图后自动设置  
  影响点：拼图块适配计算  
  配置/代码位置：`contexts/GameContext.tsx`

- **UPDATE_SHAPE_AND_PUZZLE action**  
  作用：同步更新形状和拼图块状态，确保一致性  
  取值范围：action类型  
  默认值：启用  
  影响点：状态管理、适配同步  
  配置/代码位置：`contexts/GameContext.tsx`

---

## 10. 媒体资源与音效配置

- **backgroundMusic**  
  作用：背景音乐开关与音量控制  
  取值范围：布尔（开关）+ 0~1（音量）  
  默认值：false（静音），0.3（音量）  
  影响点：用户体验、沉浸感  
  配置/代码位置：`utils/rendering/soundEffects.ts`、`GlobalUtilityButtons.tsx`

- **pieceSelectSound**  
  作用：拼图块选中音效  
  取值范围：频率 440Hz~880Hz，持续时间 0.1~0.3s  
  默认值：660Hz，0.15s  
  影响点：交互反馈  
  配置/代码位置：`utils/rendering/soundEffects.ts`

- **pieceSnapSound**  
  作用：拼图块吸附音效  
  取值范围：频率 880Hz~1760Hz，持续时间 0.2~0.4s  
  默认值：1320Hz，0.3s  
  影响点：成功反馈  
  配置/代码位置：`utils/rendering/soundEffects.ts`

- **puzzleCompletedSound**  
  作用：拼图完成音效（音阶序列）  
  取值范围：C5-E5-G5-C6 音阶，间隔 0.1s  
  默认值：[523.25, 659.25, 783.99, 1046.5]Hz  
  影响点：完成庆祝  
  配置/代码位置：`utils/rendering/soundEffects.ts`

- **rotateSound**  
  作用：拼图块旋转音效  
  取值范围：频率 330Hz~440Hz，持续时间 0.08~0.15s  
  默认值：380Hz，0.12s  
  影响点：操作反馈  
  配置/代码位置：`utils/rendering/soundEffects.ts`

- **collisionSound**  
  作用：边界碰撞音效（双音调）  
  取值范围：低音 120Hz + 高音 240Hz，持续时间 0.1~0.15s  
  默认值：120Hz + 240Hz，0.15s + 0.1s  
  影响点：边界反馈  
  配置/代码位置：`GameContext.tsx`

- **staticAssets**  
  作用：静态资源文件配置  
  资源列表：  
    - `public/bg.jpg`：游戏背景图片  
    - `public/puzzle-pieces.mp3`：游戏音效文件  
    - `public/texture-tile.png`：瓷砖气孔材质纹理  
  影响点：视觉效果、音效体验  
  配置/代码位置：`public/` 目录

---

## 11. 视觉与主题配置

- **BENCHMARKS**  
  作用：性能基准值，用于评估各项指标，分为“资源加载(page.goto)”与“端到端加载(E2E)”两项，基准值分别为1000ms/1800ms，所有性能指标分项采集与分级，保留两位小数，报告、索引、终端日志格式统一。  
  取值范围/默认值：  
    - `resourceLoadTime`: 1000ms  
    - `e2eLoadTime`: 1800ms  
    - `shapeGenerationTime`: 500ms  
    - `puzzleGenerationTime`: 800ms  
    - `scatterTime`: 800ms  
    - `pieceInteractionTime`: 1200ms  
    - `minFps`: 30fps  
    - `maxMemoryUsage`: 100MB  
  影响点：性能趋势仪表盘评级、分组统计、对比、差异高亮、趋势分析  
  配置/代码位置：`app/test/page.tsx`（BENCHMARKS 常量）

- **环境模式自动识别**  
  作用：自动识别开发/生产环境，支持分组统计、对比、差异高亮、趋势分析  
  取值范围：'development' | 'production'  
  默认值：自动检测  
  影响点：测试报告、API、前端可视化、分组统计、趋势分析  
  配置/代码位置：`e2e/full_game_flow.spec.ts`、`app/test/page.tsx`、`scripts/archive-test-results.js`、`app/api/performance-trend/route.ts`

- **primaryColor**  
  作用：主色调  
  取值范围：Tailwind 颜色变量  
  默认值：#fbbf24（amber-400）  
  影响点：UI 主题、按钮、进度条等  
  配置/代码位置：`tailwind.config.ts`

- **glassEffect**  
  作用：画布玻璃效果  
  取值范围：CSS filter  
  默认值：blur(8px) + 透明度  
  影响点：画布背景  
  配置/代码位置：`app/globals.css`

- **materialTexture**（材质纹理填充）  
  作用：拼图块和目标形状主色填充后叠加瓷砖气孔纹理，提升美术质感  
  默认值：启用  
  资源位置：`public/texture-tile.png`  
  代码位置：`utils/rendering/puzzleDrawing.ts`

- **backgroundEffect**（背景特效）  
  作用：动态气泡背景特效，提升沉浸感  
  默认值：启用  
  组件位置：`components/animate-ui/backgrounds/bubble.tsx`

- **buttonBorderless**（无描边按钮）  
  作用：所有按钮已去除 border 样式，风格更简洁  
  默认值：启用  
  影响点：全局按钮视觉

- **hintOutline**（提示轮廓与文字）  
  作用：提示功能已修复，轮廓与“这里”文字可正确显示  
  默认值：启用  
  影响点：PuzzleCanvas.tsx

- **puzzleZIndex**（拼图层级优化）  
  作用：已完成拼图始终在下层，未完成拼图始终在上层，避免遮挡  
  默认值：启用  
  影响点：PuzzleCanvas.tsx、puzzleDrawing.ts

- **loadingScreen**（加载页风格与体验）  
  作用：加载页与主页面风格完全一致，极简高效，进度条与数字同步，动画平滑递增，彻底无黑屏  
  默认值：启用  
  组件位置：components/loading/LoadingScreen.tsx

- **buttonIconSize**
  作用：所有主流程按钮图标大小统一为24px，strokeWidth统一，风格高度一致。
  默认值：24px
  影响点：形状选择、切割、散开、提示、旋转、音量、全屏等主流程按钮
  配置/代码位置：各主流程按钮组件

---

## 12. 构建与开发配置

- **Next.js 配置**  
  作用：框架构建配置  
  配置文件：`next.config.mjs`  
  主要配置：静态资源、图片优化、构建输出

- **Tailwind CSS 配置**  
  作用：样式框架配置  
  配置文件：`tailwind.config.ts`  
  主要配置：主题色彩、响应式断点、自定义样式

- **TypeScript 配置**  
  作用：类型检查配置  
  配置文件：`tsconfig.json`  
  主要配置：编译选项、路径映射、严格模式

- **Playwright 配置**  
  作用：E2E 测试配置  
  配置文件：`playwright.config.ts`、`playwright.full.config.ts`  
  主要配置：浏览器、超时、报告生成

- **Jest 配置**  
  作用：单元测试配置  
  配置文件：`jest.config.js`  
  主要配置：测试环境、模块映射、覆盖率

---

## 13. 性能测试与报告配置

- **BENCHMARKS**  
  作用：性能基准值，用于评估各项指标，分为"资源加载(page.goto)"与"端到端加载(E2E)"两项，基准值分别为1000ms/1800ms，所有性能指标分项采集与分级，保留两位小数，报告、索引、终端日志格式统一。  
  取值范围/默认值：  
    - `resourceLoadTime`: 1000ms  
    - `e2eLoadTime`: 1800ms  
    - `shapeGenerationTime`: 500ms  
    - `puzzleGenerationTime`: 800ms  
    - `scatterTime`: 800ms  
    - `pieceInteractionTime`: 1200ms  
    - `minFps`: 30fps  
    - `maxMemoryUsage`: 100MB  
  影响点：性能趋势仪表盘评级、分组统计、对比、差异高亮、趋势分析  
  配置/代码位置：`app/test/page.tsx`（BENCHMARKS 常量）

- **环境模式自动识别**  
  作用：自动识别开发/生产环境，支持分组统计、对比、差异高亮、趋势分析  
  取值范围：'development' | 'production'  
  默认值：自动检测  
  影响点：测试报告、API、前端可视化、分组统计、趋势分析  
  配置/代码位置：`e2e/full_game_flow.spec.ts`、`app/test/page.tsx`、`scripts/archive-test-results.js`、`app/api/performance-trend/route.ts`

---

## 14. UI 组件配置

### 统一架构组件配置（v1.3.33重构）

- **统一设备检测组件**  
  作用：所有控制组件使用统一的useDevice()Hook，替代本地设备检测  
  组件列表：ActionButtons、ShapeControls、PuzzleControlsCutCount、PuzzleControlsCutType、PuzzleControlsGamepad、PuzzleControlsScatter  
  默认值：useDevice()自动检测  
  影响点：设备检测一致性、代码重复度降低  
  配置/代码位置：各控制组件（v1.3.33迁移完成）

- **统一画布管理组件**  
  作用：所有布局组件使用统一的useCanvas()Hook，替代本地画布管理  
  组件列表：DesktopLayout、PhoneLandscapeLayout、PhonePortraitLayout  
  默认值：useCanvas()自动管理  
  影响点：画布状态一致性、性能优化  
  配置/代码位置：各布局组件（v1.3.33迁移完成）

- **统一事件管理组件**  
  作用：核心组件使用统一的useEventManager()Hook，避免重复事件监听  
  组件列表：PuzzleCanvas、ResponsiveBackground  
  默认值：useEventManager()自动管理  
  影响点：事件监听器数量减少85%，内存优化  
  配置/代码位置：核心组件（v1.3.33迁移完成）

### 传统组件配置（保持兼容）

- **hintAreaFlow**
  作用：提示区内容严格按五步唯一流转，所有流程节点以提示区域为唯一判断标准。
  默认值：五步唯一流转
  影响点：画布提示区、自动化测试
  配置/代码位置：DesktopLayout.tsx、PhoneLandscapeLayout.tsx、PhonePortraitLayout.tsx、E2E 测试脚本

- **tabPanelAdaptive**  
  作用：移动端Tab面板集中管理，PhoneTabPanel组件负责tab切换与内容区像素级布局，所有tab内容与全局状态同步，tab与画布高度联动。  
  配置/代码位置：`components/layouts/PhoneTabPanel.tsx`、`GameContext.tsx`  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

- **panelCanvasAdaptive**  
  作用：桌面端/移动端画布与面板正方形自适应，所有端像素级体验一致。  
  配置/代码位置：`GameContext.tsx`、`DesktopLayout.tsx`、`PhonePortraitLayout.tsx`、`PhoneLandscapeLayout.tsx`（v1.3.33：通过统一管理器优化）  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

### 重构性能指标（v1.3.33）

- **componentMigrationRate**  
  作用：组件迁移到统一架构的完成率  
  取值范围：95%完成  
  默认值：自动统计  
  影响点：重构质量评估  
  配置/代码位置：重构总结文档

- **codeReductionInComponents**  
  作用：组件代码重复度减少比例  
  取值范围：70%减少  
  默认值：重构后自动达成  
  影响点：维护性、可读性  
  配置/代码位置：各迁移组件

---

## 15. 触摸事件与交互配置

- **touchEventHandling**  
  作用：移动端触摸事件处理，解决被动监听器 preventDefault 问题  
  取值范围：{ passive: false }（非被动监听器）  
  默认值：非被动模式，允许 preventDefault  
  影响点：移动端拖拽、旋转、页面滚动阻止  
  配置/代码位置：`components/PuzzleCanvas.tsx`、`hooks/usePuzzleInteractions.ts`

- **touchSensitivity**  
  作用：触摸检测灵敏度  
  取值范围：20~50（像素）  
  默认值：30（触摸），20（鼠标）  
  影响点：拼图块选中精度  
  配置/代码位置：`hooks/usePuzzleInteractions.ts`

- **magnetThreshold**  
  作用：磁吸效果触发距离  
  取值范围：30~80（像素）  
  默认值：50  
  影响点：拼图块自动吸附  
  配置/代码位置：`hooks/usePuzzleInteractions.ts`

- **magnetStrength**  
  作用：磁吸力强度  
  取值范围：0.1~0.3  
  默认值：0.15  
  影响点：磁吸效果强度  
  配置/代码位置：`hooks/usePuzzleInteractions.ts`

- **rotationThreshold**  
  作用：双指旋转触发阈值  
  取值范围：3~10（度）  
  默认值：5  
  影响点：双指旋转灵敏度  
  配置/代码位置：`hooks/usePuzzleInteractions.ts`

- **shakeAnimation**  
  作用：边界碰撞震动动画配置  
  取值范围：震动次数 4~8，幅度 [8, -6, 5, -4, 3, -2]  
  默认值：6次震动，间隔30ms  
  影响点：边界反馈视觉效果  
  配置/代码位置：`hooks/usePuzzleInteractions.ts`

---

## 12. 构建与开发配置

- **Next.js 配置**  
  作用：框架构建配置  
  配置文件：`next.config.mjs`  
  主要配置：静态资源、图片优化、构建输出

- **Tailwind CSS 配置**  
  作用：样式框架配置  
  配置文件：`tailwind.config.ts`  
  主要配置：主题色彩、响应式断点、自定义样式

- **TypeScript 配置**  
  作用：类型检查配置  
  配置文件：`tsconfig.json`  
  主要配置：编译选项、路径映射、严格模式

- **Playwright 配置**  
  作用：E2E 测试配置  
  配置文件：`playwright.config.ts`、`playwright.full.config.ts`  
  主要配置：浏览器、超时、报告生成

---

## 16. F10 Debug 调试模式配置（2025-01-18 最新版）

### 功能说明

F10 debug 模式用于开发和测试阶段，便于实时观察拼图布局、边界、序号及导出调试日志。该模式可通过键盘 F10 键一键切换，适用于桌面端和移动端（需外接键盘）。

---

### 启用方式

- 按下 F10 键（或 keyCode 121）即可切换 debug 模式开关。
- 相关 Hook：`hooks/useDebugToggle.ts`（监听 F10，管理 debug 状态）。

---

### 当前调试显示内容

1. **拼图占位红色虚线矩形框+拼图序号**
   - 每个拼图块显示红色虚线矩形边框，中心显示序号（从1开始）。
   - 便于开发者定位拼图块实际占位和索引。
   - 代码位置：`components/PuzzleCanvas.tsx`（debug 状态下渲染）、`utils/geometry/puzzleGeometry.ts`（边界计算）。

2. **游戏有效交互区域红色虚线边框**
   - 整个拼图交互区域显示红色虚线边框，辅助观察画布边界。
   - 代码位置：`utils/rendering/puzzleDrawing.ts`（drawCanvasBorderLine）、`components/PuzzleCanvas.tsx`（debug 状态下调用）。

3. **一键导出 debug 日志（debugLog）**
   - debug 模式下，右上角显示“导出 debugLog”按钮，样式为半透明深蓝色背景、白色文字、圆角、阴影，悬停高亮，确保在任何背景下都清晰可见。
   - 点击按钮后，自动下载当前所有调试日志为 debugLog-yyyymmddhhmmss.json 文件，便于问题复现和远程协作。
   - 日志内容包括：canvas 区域、所有拼图块的中心、顶点、旋转角度、完成/选中状态、时间戳等。

---

### debug 日志（debugLog）输出

- **日志内容**：
  - canvas 有效交互区域尺寸与坐标（width, height, area）
  - 每个拼图块的中心点、所有顶点坐标、旋转角度、完成/选中状态等
  - 时间戳
- **触发时机**：
  - debug 模式开启时
  - 画布尺寸变化、拼图块移动/散开/吸附、窗口 resize 时自动记录
- **输出方式**：
  - 日志收集到数组，点击“导出 debugLog”按钮后下载为 debugLog-yyyymmddhhmmss.json 文件
- **优势**：
  - 方便开发者在控制台快速定位问题
  - 可将日志导出，便于远程协作、问题复现
  - 结构化数据便于后续自动化分析

---

### 相关文件

- `hooks/useDebugToggle.ts`：F10 监听与 debug 状态管理
- `components/PuzzleCanvas.tsx`：debug 状态下的调试渲染逻辑与日志收集、导出按钮
- `utils/rendering/puzzleDrawing.ts`：红色虚线边框绘制

---

### 扩展建议

- 如果后续需要记录更多事件（如 drag、drop、rotate、reset 等），可在对应交互逻辑中调用 logDebugEvent 并传入不同 event/action。
- 目前 isTablet/isDesktop 字段为 null，如需区分可扩展 useDeviceDetection。
- 日志内容已非常适合问题复现、适配排查和自动化分析。
