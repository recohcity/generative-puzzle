# 项目结构（项目地图）
> 修订日期：2025-07-20

本文件严格对照实际目录结构，分层列出每个目录和主要文件，并为每个文件写明一句简要用途。每次目录或功能有变动都需同步修订。

---

## 根目录

### 配置文件
- `.gitignore`：Git 忽略文件配置
- `.DS_Store`：macOS 目录缓存文件（可忽略）
- `README.md`：项目简介、安装、开发、测试、报告、贡献指南
- `CHANGELOG.md`：版本历史与变更记录（已更新v1.3.29 Step2完成记录）
- `package.json`：依赖、脚本和元数据配置
- `package-lock.json`：依赖锁定文件，确保环境一致性
- `next.config.mjs`：Next.js 框架配置
- `tailwind.config.ts`：Tailwind CSS 主题与插件配置
- `postcss.config.mjs`：PostCSS 配置
- `tsconfig.json`：TypeScript 编译配置
- `jest.config.js`：Jest 单元测试配置
- `playwright.config.ts`：Playwright E2E 测试配置
- `components.json`：Shadcn UI 组件配置
- `next-env.d.ts`：Next.js 环境类型声明

### 测试目录
- `tests/`：测试文件目录（见下）

### 核心目录
- `app/`：Next.js 应用目录（见下）
- `components/`：React 组件库（见下）
- `constants/`：全局常量定义（见下）
- `contexts/`：全局状态管理（见下）
- `hooks/`：自定义 React 钩子（见下）
- `lib/`：通用工具库目录（见下）
- `types/`：TypeScript 类型定义（见下）
- `utils/`：核心算法与工具（见下）

### 文档与测试
- `docs/`：项目文档（见下）
- `e2e/`：端到端测试脚本（见下）
- `scripts/`：自动化脚本目录（见下）

### 静态资源
- `public/`：静态资源目录（见下）

### 自动生成目录
- `debug-log/`：调试日志目录（自动生成，存放调试信息）
- `playwright-report/`：Playwright 生成的 HTML 测试报告目录（自动生成）
- `playwright-test-logs/`：自动化性能报告归档目录（存放 Markdown/JSON 格式的测试报告）
- `test-results/`：Playwright 测试原始结果目录（自动生成）
- `node_modules/`：依赖包目录（npm/yarn 自动管理）
- `.next/`：Next.js 构建输出目录（自动生成）
- `.vscode/`：VS Code 编辑器配置目录
- `.kiro/`：Kiro IDE 配置目录
- `.git/`：Git 版本控制目录

---

## app/
- `globals.css`：全局 CSS 样式文件
- `page.tsx`：Next.js 应用主页，动态导入核心游戏界面
- `layout.tsx`：全局布局，集成 Context Providers
- `api/`：API 路由目录
  - `performance-trend/`：性能趋势 API 目录
    - `route.ts`：聚合并返回性能报告数据的 API 路由
- `test/`：测试相关页面目录
  - `page.tsx`：性能趋势仪表盘页面，支持开发/生产分组、对比、差异高亮、趋势分析，所有性能指标分项采集与分级，自动高亮环境差异
- 画布与面板自适应：桌面端/移动端竖屏/横屏下，画布始终正方形最大化利用空间，面板与画布高度联动，所有自适应逻辑由父容器驱动，PuzzleCanvas 只需100%适配父容器。全局状态集中管理于 GameContext，所有端像素级体验一致。详见 step1_canvas_adaptation_plan.md

---

## components/

### 核心组件
- `GameInterface.tsx`：核心游戏界面，按设备/方向分发布局，驱动画布与面板自适应
- `PuzzleCanvas.tsx`：主画布组件，100%适配父容器，所有自适应逻辑交由父容器处理

### 控制组件
- `ActionButtons.tsx`：游戏操作按钮组件（已移除"生成形状"按钮相关逻辑）
- `RestartButton.tsx`：重新开始按钮组件
- `ShapeControls.tsx`：基础形状选择组件（已移除"生成形状"按钮，形状按钮即生成）
- `PuzzleControlsCutCount.tsx`：切片数量控制组件（配合新形状生成逻辑）
- `PuzzleControlsCutType.tsx`：切片类型控制组件（配合新形状生成逻辑）
- `PuzzleControlsGamepad.tsx`：游戏手柄控制组件
- `PuzzleControlsScatter.tsx`：拼图散布范围控制组件
- `GlobalUtilityButtons.tsx`：音乐开关、全屏切换等全局工具按钮

### 布局组件
- `DesktopPuzzleSettings.tsx`：桌面端游戏设置面板（已适配新形状生成逻辑）
- `EnvModeClient.tsx`：环境模式客户端组件，处理开发/生产环境差异
- `ResponsiveBackground.tsx`：响应式背景组件，适配不同屏幕尺寸
- `layouts/`：多端布局组件目录
  - `DesktopLayout.tsx`：桌面端布局
  - `PhoneLandscapeLayout.tsx`：手机横屏布局
  - `PhonePortraitLayout.tsx`：手机竖屏布局
  - `PhoneTabPanel.tsx`：移动端Tab面板集中管理组件，负责tab切换、内容区像素级布局、与全局状态同步，tab与画布高度联动

### 动画组件
- `animate-ui/`：动画UI组件目录
  - `backgrounds/`：背景动画组件目录
    - `bubble.tsx`：动态气泡背景特效组件，提升美术体验

### 加载组件
- `loading/`：加载动画组件目录
  - `LoadingScreen.tsx`：动态加载动画

### 基础组件
- `theme-provider.tsx`：主题切换 Context Provider
- `ui/`：基础 UI 组件库（Shadcn UI 自动生成，所有按钮已无描边，风格更简洁）
  - `accordion.tsx` 等：各类基础 UI 组件（按钮、表单、弹窗等）

### 设计规范
- 所有主流程按钮（形状选择、切割、散开、提示、旋转、音量、全屏等）图标大小统一为24px，风格高度一致

---

## contexts/
- `GameContext.tsx`：核心状态管理中心，useReducer 管理全局游戏状态，集中管理画布尺寸、scale、orientation、previousCanvasSize，驱动所有自适应逻辑，自动挂载 window.testAPI（测试环境下）

---

## constants/
- `canvasAdaptation.ts`：画布适配常量定义，包含iPhone 16全系列检测函数、桌面端/移动端适配参数、三层检测机制等核心适配逻辑

---

## docs/
- `project_structure.md`：本项目结构说明（本文件）
- `CONFIGURATION.MD`：配置与参数说明
- `automated_testing_workflow.cn.md`：自动化测试与性能分析闭环工作流说明（中文版）
- `automated_testing_workflow.en.md`：自动化测试与性能分析闭环工作流说明（英文版）
- `difficulty-design.md`：游戏难度系统设计说明
- `desktop_canvas_adaptation_fix.md`：桌面端画布适配修复文档
- `device_compatibility_analysis.md`：设备兼容性分析报告，涵盖iPhone 16全系列及主流Android设备
- `mobile_background_static_adaptation.md`：移动端背景静态适配文档
- `puzzle_memory_adaptation_optimization/`：拼图记忆适配优化专项目录
  - `puzzle_memory_adaptation_optimization_plan.md`：总体优化计划（已更新Step3规划）
  - `step1_canvas_adaptation_plan.md`：iPhone 16全系列Canvas适配完整方案 ✅ 完成
  - `step2_shape_adaptation_plan.md`：智能形状适配系统 ✅ 完成
  - `step3_puzzle_pieces_adaptation_plan.md`：拼图块适配系统规划 🟡 规划完成
  - `step3_task_checklist.md`：Step3详细任务清单（25个任务，5-7天）
  - `README.md`：文档导航和使用指南
  - `DOCUMENT_CONSOLIDATION_SUMMARY.md`：文档整合总结
  - `final_project_summary.md`：项目完成总结
  - `memory_system_implementation_summary.md`：记忆系统技术实现总结
  - `archived_specs_shape_adaptation/`：早期形状适配优化文档归档
  - `archived_specs_memory_system/`：记忆系统设计文档归档
- `TDC/`：技术债务和问题分析目录
  - `canvas_puzzle_state_memory_summary.md`：画布拼图状态记忆总结
  - `mobile_portrait_cutcount_tab_width_issue.md`：移动端竖屏切割次数tab宽度问题
  - `puzzle_disappear_issue_analysis.md`：拼图消失问题分析

---

## e2e/
- `full_game_flow.spec.ts`：主流程 E2E 测试脚本，自动识别开发/生产环境，报告链路全自动，支持模式分组、对比、差异高亮
- `temp/`：专项/临时测试目录
  - `responsive_adaptation.spec.ts`：拼图响应式适配专项测试脚本

---

## hooks/
- `usePuzzleInteractions.ts`：拼图交互逻辑钩子（拖拽、旋转、吸附、回弹、音效等）
- `useResponsiveCanvasSizing.ts`：响应式画布尺寸管理钩子，监听resize/orientationchange/ResizeObserver，原子性更新状态，驱动下游适配
- `useDeviceDetection.ts`：设备/方向检测钩子
- `usePuzzleAdaptation.ts`：拼图状态适配钩子（随画布尺寸/方向变化，专门处理散开拼图）
- `useShapeAdaptation.ts`：形状适配钩子（Step2新增，基于拓扑记忆系统的智能形状适配）
- `useDebugToggle.ts`：调试模式切换钩子（F10）
- `use-mobile.tsx`：移动端检测钩子
- `use-toast.ts`：弹窗提示钩子

---

## lib/
- `utils.ts`：通用工具函数（如 Tailwind 类名合并）

---

## public/
- `bg.jpg`：游戏背景图片
- `puzzle-pieces.mp3`：游戏音效文件
- `texture-tile.png`：瓷砖气孔材质纹理，用于拼图块和目标形状的美术填充

---

## scripts/
- `archive-test-results.js`：E2E 测试后自动归档性能数据，生成 Markdown/JSON 报告

---

## types/
- `global.d.ts`：全局类型声明
- `puzzleTypes.ts`：核心业务类型定义（GameState、PuzzlePiece、CutType 等）
- `common.ts`：通用类型定义（Point、CanvasSize、BoundingBox 等）
- `memory.ts`：记忆系统类型定义（Step2新增，拓扑记忆相关类型）

---

## utils/
- `constants.ts`：全局常量定义
- `helper.ts`：通用辅助函数
- `geometry/`：底层几何计算工具目录
  - `puzzleGeometry.ts`：拼图块吸附、对齐等几何计算函数
  - `__tests__/`：几何工具单元测试目录
    - `puzzleGeometry.test.ts`：几何工具测试脚本
- `memory/`：拼图记忆适配系统目录（Step2新增）
  - `MemoryManager.ts`：记忆管理器，系统协调器
  - `AdaptationEngine.ts`：核心适配引擎，毫秒级高性能适配
  - `AdaptationRuleEngine.ts`：规则执行引擎
  - `AdaptationRules.ts`：智能适配规则集（30%直径规则、精确居中等）
  - `MemoryStorage.ts`：记忆存储系统
  - `TopologyExtractor.ts`：拓扑结构提取器，基于形状结构的记忆机制
  - `CoordinateCleaner.ts`：坐标清理机制
  - `memoryUtils.ts`：记忆系统工具函数集
  - `__tests__/`：记忆系统单元测试目录
- `puzzle/`：拼图生成与操作逻辑目录
  - `PuzzleGenerator.ts`：基础形状切割为拼图块的主逻辑
  - `cutGenerators.ts`：不同切割算法定义
  - `puzzleUtils.ts`：拼图相关通用辅助函数
  - `ScatterPuzzle.ts`：拼图块散布算法
- `rendering/`：Canvas 渲染与音效工具目录
  - `colorUtils.ts`：颜色处理工具
  - `puzzleDrawing.ts`：Canvas 上绘制拼图块的函数，支持材质纹理填充与层级优化
  - `soundEffects.ts`：音效播放函数
  - `__tests__/`：渲染工具单元测试目录
    - `colorUtils.test.ts`：颜色工具测试脚本
- `shape/`：基础图形生成与几何工具目录
  - `ShapeGenerator.ts`：生成多边形、曲线等基础形状
  - `geometryUtils.ts`：形状相关几何计算函数
  - `shapeAdaptationUtils.ts`：形状适配工具函数（Step2新增）

---

## 自动生成目录详细说明

### playwright-report/
- Playwright 生成的 HTML 测试报告目录（自动生成，存放测试报告，内容可忽略，.gitkeep 保证目录同步，文件不上传）

### playwright-test-logs/
- 自动化性能报告归档目录（存放 Markdown/JSON 格式的测试报告，供仪表盘和 API 使用，.gitkeep 保证目录同步，文件不上传）

### test-results/
- Playwright 测试原始结果目录（自动生成，存放原始测试结果文件，.gitkeep 保证目录同步，文件不上传）

---

## tests/
- `canvas-adaptation/`：画布适配测试目录
  - `test-canvas-adaptation.html`：通用画布适配参数测试页面，支持桌面端、移动端、超宽屏等所有场景的实时测试
  - `test-iphone16pro-adaptation.html`：iPhone 16全系列专用适配测试页面，提供可视化布局预览和精确设备检测
  - `test-desktop-adaptation.html`：桌面端适配测试页面，专注于桌面端布局和响应式适配
  - `test-ultrawide-desktop.html`：超宽屏桌面适配测试页面，针对3000px+宽度的超宽屏显示器优化

## 项目重要里程碑

### ✅ Step1: 画布适配系统完成 (v1.3.27)
- iPhone 16全系列精确适配，空间利用率92-95%
- 桌面端超宽屏支持，移动端Tab面板优化
- 三层检测机制，响应式布局系统完善

### ✅ Step2: 智能形状适配系统完成 (v1.3.29)
- **拓扑记忆机制**：基于形状结构而非坐标的创新记忆系统
- **30%直径规则**：确保形状在任何画布上都有合适的大小比例
- **无限循环修复**：从200+条日志减少到2条，彻底解决React依赖链循环
- **高性能优化**：记忆创建0.1-6ms，适配执行0.02-3ms，并发处理50次/24ms
- **核心组件**：MemoryManager、AdaptationEngine、TopologyExtractor等完整架构

### 🟡 Step3: 拼图块适配系统规划完成
- 详细技术方案和25个具体任务已制定
- 预计工期5-7天，基于Step2成果的简化实现
- 核心目标：未散开拼图块跟随目标形状同步适配

## 其它目录说明
- 相关常量、布局、像素级体验、流程图文档已归档于 docs/puzzle_memory_adaptation_optimization/
- Step1-2的完整技术实现和性能数据已详细记录
- 记忆系统架构为后续Step3-5提供了坚实的技术基础
- 测试文件在开发过程中发挥了重要作用，为适配逻辑验证提供了可视化工具，确保了跨设备的一致性体验