# 生成式拼图游戏 - 配置说明

> 修订日期：2025-07-16

本文档详细列举并说明本项目所有关键配置点、参数、核心算法入口及其对应的源文件，便于开发者理解、调整和维护游戏行为。每次配置或算法有变动都需同步修订。

---

## 目录

1. 主要配置文件与分工
2. 难度与切割配置
3. 形状生成配置
4. 拼图散开与分布配置
5. 碰撞与回弹配置
6. 旋转配置
7. 设备适配与响应式配置
8. 媒体资源与音效配置
9. 视觉与主题配置
10. 构建与开发配置
11. 性能测试与报告配置
12. UI 组件配置
13. F10 Debug 调试模式配置

---

## 1. 主要配置文件与分工

- `utils/puzzle/cutGenerators.ts`：切割算法与难度映射
- `utils/puzzle/PuzzleGenerator.ts`：拼图块生成主逻辑
- `utils/puzzle/ScatterPuzzle.ts`：拼图块散布与分布算法
- `utils/shape/ShapeGenerator.ts`：基础形状生成与参数
- `contexts/GameContext.tsx`：全局游戏状态、边界检测、回弹、适配
- `components/PuzzleCanvas.tsx`：主画布渲染与交互
- `components/GameInterface.tsx`、`components/layouts/`：多端布局与适配
- `hooks/`：响应式尺寸、设备检测、适配、交互等钩子
- `utils/rendering/soundEffects.ts`：音效管理
- `public/`：静态资源（图片、音效）
- `tailwind.config.ts`、`components.json`：UI 主题与组件
- `next.config.mjs`：构建配置
- `docs/difficulty-design.md`：难度与切割设计说明

---

## 2. 难度与切割配置

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

## 7. 设备适配与响应式配置

- **canvasMaxSize**  
  作用：画布最大尺寸（竖屏强制正方形）  
  取值范围：320~1024（像素，随设备/窗口动态调整）  
  默认值：桌面 800，移动端 360  
  影响点：画布、拼图缩放、适配  
  配置/代码位置：`useResponsiveCanvasSizing.ts`、`PuzzleCanvas.tsx`  
  
- **全局画布与面板自适应**  
  作用：桌面端/移动端竖屏/横屏下，画布始终正方形最大化利用空间，面板与画布高度联动，所有自适应逻辑由父容器驱动，PuzzleCanvas 只需100%适配父容器。  
  配置/代码位置：`GameContext.tsx`（集中管理画布状态）、`PhoneTabPanel.tsx`（移动端Tab面板集中管理）、`DesktopLayout.tsx`、`PhonePortraitLayout.tsx`、`PhoneLandscapeLayout.tsx`  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

- **isMobile**  
  作用：是否为移动端设备  
  取值范围：布尔  
  默认值：自动检测  
  影响点：布局、参数、分布、UI  
  配置/代码位置：`useDeviceDetection.ts`、`GameInterface.tsx`

- **isPortrait**  
  作用：是否为竖屏  
  取值范围：布尔  
  默认值：自动检测  
  影响点：布局、分布算法、UI  
  配置/代码位置：`useDeviceDetection.ts`、`GameInterface.tsx`

- **tabPanelAdaptive**  
  作用：移动端Tab面板集中管理，PhoneTabPanel组件负责tab切换与内容区像素级布局，所有tab内容与全局状态同步，tab与画布高度联动。  
  配置/代码位置：`components/layouts/PhoneTabPanel.tsx`、`GameContext.tsx`  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

---

## 8. 性能测试与报告配置

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

---

## 9. 视觉与主题配置

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

## 10. UI 组件配置

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
  配置/代码位置：`GameContext.tsx`、`DesktopLayout.tsx`、`PhonePortraitLayout.tsx`、`PhoneLandscapeLayout.tsx`  
  说明：详见 `docs/puzzle_memory_adaptation_optimization/step1_canvas_adaptation_plan.md`。

---

## 11. F10 Debug 调试模式配置（2025-06-22 最新版）

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
