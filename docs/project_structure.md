# 项目结构

本文档详细描述了"生成式拼图"项目的文件结构和组织，旨在提供一个清晰、完整的模块指南，方便团队成员快速理解项目全貌，并追踪文件变更。

## 生成式拼图游戏-项目模块说明

### 根目录文件

-   `README.md`: 项目的入口文档，包含项目简介、安装、启动和开发指南。
-   `package.json`: 定义项目依赖、脚本（`scripts`）和元数据。
-   `package-lock.json`: 锁定项目依赖的具体版本，确保环境一致性。
-   `next.config.mjs`: Next.js 框架的配置文件。
-   `tailwind.config.ts`: Tailwind CSS 的配置文件，用于定义主题、插件和 JIT 编译器选项。
-   `postcss.config.mjs`: PostCSS 的配置文件，与 Tailwind CSS 配合使用。
-   `tsconfig.json`: TypeScript 编译器的配置文件。
-   `components.json`: `shadcn/ui` 的配置文件，记录了已安装的UI组件信息。
-   `playwright.config.ts`: Playwright E2E 测试框架的配置文件。
-   `jest.config.js`: Jest 单元测试框架的配置文件。
-   `CHANGELOG.md`: 项目的版本历史和变更记录。

### `app/` - Next.js 应用目录

Next.js 15 App Router 的核心目录，负责应用的路由、页面和 API。

-   **`app/page.tsx`**: 应用的主页（'/'），是用户访问的第一个页面。它负责处理初始加载逻辑，并动态导入核心游戏界面 `GameInterface`。
-   **`app/layout.tsx`**: 应用的根布局，包裹所有页面，通常包含 `<html>` 和 `<body>` 标签，并集成全局 Context Providers（如 `ThemeProvider`）。
-   **`app/globals.css`**: 全局 CSS 样式文件，用于定义基础样式和 Tailwind CSS 指令。
-   **`app/test/page.tsx`**: (**新增**) 性能测试仪表盘页面 (`'/test'`)。此页面通过请求 `/api/performance-trend` API，动态地、可视化地展示历史性能测试数据和趋势。
-   **`app/api/performance-trend/route.ts`**: (**新增**) 一个实时的 API 端点。它负责在每次被请求时，动态地扫描 `playwright-test-logs/` 目录，实时解析所有 Markdown 格式的测试报告，并将聚合后的数据以 JSON 格式返回给前端。

### `components/` - React 组件库

存放项目中所有可复用的 React 组件。

-   **`components/GameInterface.tsx`**: 核心游戏界面，作为设备检测的路由，根据屏幕尺寸和方向动态渲染 `DesktopLayout`、`PhonePortraitLayout` 或 `PhoneLandscapeLayout`。
-   **`components/PuzzleCanvas.tsx`**: 核心游戏画布。重构后，此组件主要负责编排各种自定义钩子（如 `usePuzzleInteractions`），处理 Canvas 的渲染逻辑，并绑定所有用户交互事件。
-   **`components/ActionButtons.tsx`**: 包含游戏操作按钮（如旋转、提示、重置）的组件。
-   **`components/DesktopPuzzleSettings.tsx`**: 桌面端专用的游戏设置面板组件。
-   **`components/GlobalUtilityButtons.tsx`**: 全局工具按钮，如全屏、切换主题等。
-   **`components/PuzzleControls*.tsx`**: 一系列控制拼图生成参数的组件，例如 `PuzzleControlsCutCount` (切片数量), `PuzzleControlsCutType` (切片类型), `PuzzleControlsScatter` (散布范围)。
-   `components/ShapeControls.tsx`: 控制基础形状选择的组件。
-   `components/theme-provider.tsx`: 主题切换的 Context Provider。
-   **`components/layouts/`**: 包含针对不同设备和屏幕方向的特定布局组件。
    -   `DesktopLayout.tsx`: 桌面端布局。
    -   `PhoneLandscapeLayout.tsx`: 手机横屏布局。
    -   `PhonePortraitLayout.tsx`: 手机竖屏布局。
-   **`components/loading/`**: 加载状态相关的组件。
    -   `LoadingScreen.tsx`: 动态加载过程中的加载动画。
    -   `LoadingScreenStatic.tsx`: 静态资源加载时的加载界面。
-   **`components/ui/`**: 基于 `shadcn/ui` 自动生成的基础 UI 组件库，如 `Button`, `Dialog`, `Slider` 等。

### `contexts/` - 状态管理

使用 React Context API 实现全局状态管理。

-   **`contexts/GameContext.tsx`**: 整个游戏的核心状态管理中心。它使用 `useReducer` 来管理复杂的游戏状态（如拼图块、游戏进程、得分等）。**重构后，它还包含了一套专用于 E2E 测试的 API (`window.testAPI`)**，通过在 `window` 对象上暴露测试辅助函数，来支持稳定、高效的自动化测试流程。

### `docs/` - 项目文档

存放所有项目相关的设计、规划和说明文档。

-   **`docs/project_structure.md`**: (本文) 对项目结构进行详细说明的文档。
-   **`docs/automated_testing_workflow.md`**: (**新增**) 详细介绍了本项目从 E2E 测试执行、性能数据收集、报告归档到前端动态展示的"测试-分析-洞察"全自动闭环工作流。
-   **`docs/CONFIGURATION.MD`**: 游戏内各项配置参数（如难度、形状等）的详细说明文档。
-   **`docs/difficulty-design.md`**: 详细阐述了游戏难度系统的设计理念、算法和实现细节。
-   **`docs/PuzzleCanvas_*.md`**: 记录了对核心组件 `PuzzleCanvas` 进行重构时的分析和规划。

### `e2e/` - 端到端测试

存放使用 Playwright 编写的端到端（E2E）测试脚本。

-   **`e2e/full_game_flow.spec.ts`**: **核心测试脚本**。它通过调用 `GameContext` 暴露的测试专用 API (`window.testAPI`)，以程序化方式覆盖完整的游戏流程（开始、选择、旋转、完成），并精确收集性能指标（如内存占用、交互耗时），最后将数据附加到测试结果中。

### `hooks/` - 自定义 React 钩子

封装和复用组件逻辑的自定义 React Hooks。

-   **`hooks/usePuzzleInteractions.ts`**: **(重构提取)** 聚合了所有与画布交互相关的复杂逻辑，包括拖拽、旋转、吸附、缩放等。
-   **`hooks/useResponsiveCanvasSizing.ts`**: **(重构提取)** 负责动态计算并管理画布的响应式尺寸，确保在不同设备上都能正确显示。
-   **`hooks/useDeviceDetection.ts`**: **(重构提取)** 封装了设备类型（桌面/移动）和屏幕方向（横屏/竖屏）的检测逻辑。
-   **`hooks/use-mobile.tsx`**: 一个简单的钩子，用于判断当前是否为移动设备。
-   **`hooks/use-toast.ts`**: `sonner` 弹窗提示的钩子。

### `lib/` - 基础库与工具函数

-   **`lib/utils.ts`**: 包含 `cn` 函数，一个用于合并和优化 Tailwind CSS 类名的小工具。

### `playwright-report/` - Playwright HTML 测试报告

-   此目录由 Playwright 在运行测试时自动生成（通过 `playwright.config.ts` 中的 `reporter: 'html'` 配置）。它包含一个可交互的 HTML 报告 (`index.html`)，详细展示了最近一次测试的运行结果、每个测试步骤的耗时、日志、截图和追踪信息，是进行失败诊断和细节分析的重要工具。

### `playwright-test-logs/` - Playwright 测试报告

-   (**新增目录**) 此目录用于存储由 `scripts/archive-test-results.js` 脚本在每次 E2E 测试执行后生成的、格式化后的 Markdown 性能报告。这些报告是 `/api/performance-trend` API 的数据源。

### `public/` - 静态资源

存放所有静态文件，这些文件会被直接部署到网站根目录。

-   `bg.jpg`: 游戏背景图片。
-   `puzzle-pieces.mp3`: 游戏音效文件。

### `scripts/` - 自动化脚本

存放用于开发、构建和持续集成流程的 Node.js 脚本。

-   **`scripts/archive-test-results.js`**: (**新增**) 一个关键的自动化脚本，在 Playwright 测试流程结束后（`globalTeardown`）自动执行。它负责：
    1.  从 Playwright 的测试结果（附件）中读取原始性能数据。
    2.  对 Base64 编码的数据进行解码和解析。
    3.  计算派生指标（如平均交互时间）。
    4.  生成一份包含时间戳、核心指标和环境信息的 Markdown 格式报告。
    5.  将报告文件存储到 `playwright-test-logs/` 目录中。

### `types/` - TypeScript 类型定义

-   **`types/puzzleTypes.ts`**: **(重构整合)** 定义了项目中所有共享的业务核心类型，如 `GameState`, `PuzzlePiece`, `CutType` 等，是整个应用类型的唯一真实来源（Single Source of Truth）。

### `utils/` - 核心业务逻辑

实现游戏核心功能和算法的工具函数，已按业务领域清晰划分。

-   **`utils/puzzle/`**: 与拼图生成和操作相关的逻辑。
    -   `PuzzleGenerator.ts`: 负责将基础形状切割成拼图块。
    -   `cutGenerators.ts`: 定义不同切割算法（直线、曲线）。
    -   `puzzleUtils.ts`: 拼图相关的通用辅助函数。
    -   `ScatterPuzzle.ts`: 负责将生成的拼图块散布到画布上。
-   **`utils/shape/`**: 与基础图形生成相关的逻辑。
    -   `ShapeGenerator.ts`: 负责生成不同类型的几何形状（如矩形、心形）。
    -   `geometryUtils.ts`: 形状相关的几何计算函数。
-   **`utils/geometry/`**: 底层几何计算。
    -   `puzzleGeometry.ts`: 提供拼图块吸附、对齐等相关的几何计算函数。
-   **`utils/rendering/`**: 与 Canvas 渲染相关的逻辑。
    -   `puzzleDrawing.ts`: 提供在 Canvas 上绘制拼图块的函数。
    -   `colorUtils.ts`: 颜色处理工具。
    -   `soundEffects.ts`: 播放音效的函数。
-   **`utils/helper.ts`**: 其他通用辅助函数。
-   **`utils/constants.ts`**: 存放项目中的全局常量。 