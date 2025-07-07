# 项目结构（项目地图）
> 修订日期：2025-06-22 23:10:45

本文件严格对照实际目录结构，分层列出每个目录和主要文件，并为每个文件写明一句简要用途。每次目录或功能有变动都需同步修订。

---

## 根目录

- `.gitignore`：Git 忽略文件配置
- `.DS_Store`：macOS 目录缓存文件（可忽略）
- `README.md`：项目简介、安装、开发、测试、报告、贡献指南
- `CHANGELOG.md`：版本历史与变更记录
- `package.json`：依赖、脚本和元数据配置
- `package-lock.json`：依赖锁定文件，确保环境一致性
- `next.config.mjs`：Next.js 框架配置
- `tailwind.config.ts`：Tailwind CSS 主题与插件配置
- `postcss.config.mjs`：PostCSS 配置
- `tsconfig.json`：TypeScript 编译配置
- `jest.config.js`：Jest 单元测试配置
- `playwright.config.ts`：Playwright E2E 测试配置
- `playwright.config 2.ts`：Playwright 备用/临时配置
- `components.json`：Shadcn UI 组件配置
- `next-env.d.ts`：Next.js 环境类型声明
- `lib/`：通用工具库目录（见下）
- `scripts/`：自动化脚本目录（见下）
- `public/`：静态资源目录（见下）
- `app/`：Next.js 应用目录（见下）
- `components/`：React 组件库（见下）
- `contexts/`：全局状态管理（见下）
- `docs/`：项目文档（见下）
- `e2e/`：端到端测试脚本（见下）
- `hooks/`：自定义 React 钩子（见下）
- `types/`：TypeScript 类型定义（见下）
- `utils/`：核心算法与工具（见下）
- `playwright-report/`：Playwright 生成的 HTML 测试报告目录（自动生成，存放测试报告，内容可忽略，.gitkeep 保证目录同步，文件不上传）
- `playwright-test-logs/`：自动化性能报告归档目录（存放 Markdown/JSON 格式的测试报告，供仪表盘和 API 使用，.gitkeep 保证目录同步，文件不上传）
- `test-results/`：Playwright 测试原始结果目录（自动生成，存放原始测试结果文件，.gitkeep 保证目录同步，文件不上传）

---

## app/
- `globals.css`：全局 CSS 样式文件
- `page.tsx`：Next.js 应用主页，动态导入核心游戏界面
- `layout.tsx`：全局布局，集成 Context Providers
- `api/`：API 路由目录
  - `performance-trend/`：性能趋势 API 目录
    - `route.ts`：聚合并返回性能报告数据的 API 路由
- `test/`：测试相关页面目录
  - `page.tsx`：性能趋势仪表盘页面，支持开发/生产分组、对比、差异高亮、趋势分析，所有性能指标分项采集与分级，自动高亮环境差异。
- 画布上方提示区严格按五步唯一流转，所有流程节点以提示区域为唯一判断标准，自动化测试脚本已同步适配。

---

## components/
- `GameInterface.tsx`：核心游戏界面，按设备/方向分发布局
- `PuzzleCanvas.tsx`：主画布组件，负责钩子编排与渲染，支持材质纹理填充、拼图层级优化、提示轮廓与文字显示修复
- `ActionButtons.tsx`：游戏操作按钮组件（已移除“生成形状”按钮相关逻辑）
- `DesktopPuzzleSettings.tsx`：桌面端游戏设置面板（已适配新形状生成逻辑）
- `GlobalUtilityButtons.tsx`：全局工具按钮（如全屏、主题切换）
- `PuzzleControlsCutCount.tsx`：切片数量控制组件（配合新形状生成逻辑）
- `PuzzleControlsCutType.tsx`：切片类型控制组件（配合新形状生成逻辑）
- `PuzzleControlsGamepad.tsx`：游戏手柄控制组件
- `PuzzleControlsScatter.tsx`：拼图散布范围控制组件
- `ShapeControls.tsx`：基础形状选择组件（已移除“生成形状”按钮，形状按钮即生成）
- `theme-provider.tsx`：主题切换 Context Provider
- `layouts/`：多端布局组件目录
  - `DesktopLayout.tsx`：桌面端布局
  - `PhoneLandscapeLayout.tsx`：手机横屏布局
  - `PhonePortraitLayout.tsx`：手机竖屏布局
- `loading/`：加载动画组件目录
  - `LoadingScreen.tsx`：唯一加载动画组件，风格与主页面完全一致，极简高效。已移除 LoadingScreenStatic.tsx，所有加载流程统一为此组件。
- `ui/`：基础 UI 组件库（Shadcn UI 自动生成，所有按钮已无描边，风格更简洁）
  - `accordion.tsx` 等：各类基础 UI 组件（按钮、表单、弹窗等）
- 所有主流程按钮（形状选择、切割、散开、提示、旋转、音量、全屏等）图标大小统一为24px，风格高度一致。

---

## contexts/
- `GameContext.tsx`：核心状态管理中心，useReducer 管理全局游戏状态，自动挂载 window.testAPI（测试环境下）

---

## docs/
- `project_structure.md`：本项目结构说明（本文件）
- `CONFIGURATION.MD`：配置与参数说明
- `automated_testing_workflow.md`：自动化测试与性能分析闭环工作流说明
- `difficulty-design.md`：游戏难度系统设计说明
- `PuzzleCanvas_Dependencies_and_State_Analysis.md`：PuzzleCanvas 依赖与状态分析
- `PuzzleCanvas_Dependencies_and_State_Analysis_refactored.md`：PuzzleCanvas 依赖分析（重构版）
- `PuzzleCanvas_Refactoring_Plan.md`：PuzzleCanvas 重构任务清单与方案

---

## e2e/
- `full_game_flow.spec.ts`：主流程 E2E 测试脚本，自动识别开发/生产环境，报告链路全自动，支持模式分组、对比、差异高亮。
- `temp/`：专项/临时测试目录
  - `responsive_adaptation.spec.ts`：拼图响应式适配专项测试脚本

---

## hooks/
- `usePuzzleInteractions.ts`：拼图交互逻辑钩子（拖拽、旋转、吸附、回弹、音效等）
- `useResponsiveCanvasSizing.ts`：响应式画布尺寸管理钩子
- `useDeviceDetection.ts`：设备/方向检测钩子
- `usePuzzleAdaptation.ts`：拼图状态适配钩子（随画布尺寸/方向变化）
- `useDebugToggle.ts`：调试模式切换钩子（F10）
- `use-mobile.tsx`：移动端检测钩子
- `use-toast.ts`：弹窗提示钩子

---

## lib/
- `utils.ts`：通用工具函数（如 Tailwind 类名合并）

---

## public/
- `puzzle-pieces.mp3`：游戏音效文件
- `texture-tile.png`：瓷砖气孔材质纹理，用于拼图块和目标形状的美术填充

---

## scripts/
- `archive-test-results.js`：E2E 测试后自动归档性能数据，生成 Markdown/JSON 报告

---

## types/
- `global.d.ts`：全局类型声明
- `puzzleTypes.ts`：核心业务类型定义（GameState、PuzzlePiece、CutType 等）

---

## utils/
- `constants.ts`：全局常量定义
- `helper.ts`：通用辅助函数
- `geometry/`：底层几何计算工具目录
  - `puzzleGeometry.ts`：拼图块吸附、对齐等几何计算函数
  - `__tests__/`：几何工具单元测试目录
    - `puzzleGeometry.test.ts`：几何工具测试脚本
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

---

## playwright-report/
- Playwright 生成的 HTML 测试报告目录（自动生成，存放测试报告，内容可忽略，.gitkeep 保证目录同步，文件不上传）

## playwright-test-logs/
- 自动化性能报告归档目录（存放 Markdown/JSON 格式的测试报告，供仪表盘和 API 使用，.gitkeep 保证目录同步，文件不上传）

## test-results/
- Playwright 测试原始结果目录（自动生成，存放原始测试结果文件，.gitkeep 保证目录同步，文件不上传）

## animate-ui/backgrounds/bubble.tsx
- 动态气泡背景特效组件，提升美术体验 