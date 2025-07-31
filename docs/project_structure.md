# 项目结构（Project Structure）

> 自动生成时间：2025/7/31 19:49:19  
> 生成工具：项目结构文档生成器 v3.1.0 - 开发导航版

**开发者导航工具** - 快速理解项目架构，精准定位代码位置，提升开发效率。

## 快速导航
[项目概览](#项目概览) | [架构概览](#架构概览) | [功能模块](#功能模块) | [技术栈](#技术栈) | [开发指引](#开发指引) | [目录索引](#目录索引)

---

## 项目概览

| 统计项 | 数量 | 说明 |
|--------|------|------|
| 总目录数 | 67 | 项目目录结构层次 |
| 总文件数 | 295 | 代码文件和资源文件总数 |
| 项目容量 | 6.47 MB | 不包含node_modules的项目大小 |

---

## 架构概览

### 表现层 (Presentation Layer)
React组件和UI界面
**主要目录**: `components/`, `app/`

### 业务层 (Business Layer)
业务逻辑和状态管理
**主要目录**: `hooks/`, `contexts/`, `providers/`

### 数据层 (Data Layer)
数据处理和工具函数
**主要目录**: `utils/`, `lib/`, `core/`

### 配置层 (Config Layer)
配置文件和常量定义
**主要目录**: `src/config/`, `constants/`, `types/`



---

## 功能模块

### � 核心游戏功能
游戏主要逻辑和界面

**关键文件**:
- `components/GameInterface.tsx` - 核心游戏界面
- `components/PuzzleCanvas.tsx` - 主画布组件
- `contexts/GameContext.tsx` - 核心状态管理中心
- `utils/puzzle/`
- `hooks/usePuzzleInteractions.ts`

### � 设备适配系统
跨设备响应式适配

**关键文件**:
- `core/DeviceManager.ts`
- `core/CanvasManager.ts`
- `utils/adaptation/`
- `constants/canvasAdaptation.ts`
- `providers/hooks/useDevice.ts`

### � 渲染系统
Canvas渲染和视觉效果

**关键文件**:
- `utils/rendering/`
- `utils/shape/`
- `components/animate-ui/`
- `public/texture-tile.png` - 拼图材质纹理

### � 测试体系
自动化测试和质量保证

**关键文件**:
- `e2e/` - 端到端测试脚本
- `tests/` - 测试文件
- `scripts/archive-test-results.js`
- `playwright.config.ts` - Playwright E2E 测试配置



---

## 技术栈

| 分类 | 技术 | 主要文件 |
|------|------|----------|
| framework | Next.js 15 | `app/`, `next.config.mjs` |
| language | TypeScript | `tsconfig.json`, `**/*.ts`, `**/*.tsx` |
| styling | Tailwind CSS | `tailwind.config.ts`, `app/globals.css` |
| stateManagement | React Context | `contexts/`, `providers/` |
| testing | Playwright + Jest | `e2e/`, `tests/`, `jest.config.js` |
| ui | Shadcn UI | `components/ui/`, `components.json` |


---

## 开发指引

### 关键文件 (开发必知)
- 🔥 **`app/page.tsx`** - 应用入口
- 🔥 **`contexts/GameContext.tsx`** - 全局状态
- 🔥 **`components/GameInterface.tsx`** - 核心界面
- ⭐ **`core/DeviceManager.ts`** - 设备管理
- ⭐ **`utils/adaptation/UnifiedAdaptationEngine.ts`** - 适配引擎

### 开发流程 (5步法)
```
1. 组件开发 → components/     2. 业务逻辑 → hooks/, utils/
3. 状态管理 → contexts/       4. 类型定义 → types/
5. 测试编写 → tests/, e2e/
```

### 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| React组件 | PascalCase | `GameInterface.tsx` |
| Hook函数 | use前缀 | `useDevice.ts` |
| 工具函数 | camelCase | `puzzleUtils.ts` |
| 常量定义 | UPPER_CASE | `CANVAS_SIZE` |
| 目录名称 | kebab-case | `animate-ui/` |

### 开发命令
```bash
npm run dev                    # 启动开发服务器
npm run build                  # 构建生产版本
npm run test                   # 运行单元测试
npm run test:e2e              # 运行E2E测试
npm run generate-structure     # 更新项目结构文档
npm run lint                   # 代码检查
```

### 常见开发任务快速定位

| 开发任务 | 主要文件位置 | 说明 |
|----------|-------------|------|
| 修改游戏逻辑 | `components/GameInterface.tsx`, `contexts/GameContext.tsx` | 核心游戏功能 |
| 调整UI样式 | `components/`, `app/globals.css`, `tailwind.config.ts` | 界面和样式 |
| 设备适配问题 | `core/DeviceManager.ts`, `utils/adaptation/` | 跨设备兼容 |
| 添加工具函数 | `utils/`, `lib/utils.ts` | 通用工具 |
| 编写测试 | `tests/`, `e2e/` | 测试相关 |
| 修改配置 | `src/config/`, `constants/` | 配置管理 |
| 状态管理 | `contexts/`, `providers/`, `hooks/` | 应用状态 |
| 性能优化 | `utils/performance/`, `core/` | 性能相关 |

### 代码搜索提示

**搜索关键词建议**：
- `GameInterface` - 游戏主界面相关
- `DeviceManager` - 设备检测相关  
- `useCanvas` - 画布管理相关
- `adaptation` - 适配系统相关
- `PuzzleCanvas` - 画布组件相关
- `GameContext` - 全局状态相关

### 🎯 常见开发任务快速定位

| 开发任务 | 主要文件位置 | 说明 |
|----------|-------------|------|
| 🎮 修改游戏逻辑 | `components/GameInterface.tsx`, `contexts/GameContext.tsx` | 核心游戏功能 |
| 🎨 调整UI样式 | `components/`, `app/globals.css`, `tailwind.config.ts` | 界面和样式 |
| 📱 设备适配问题 | `core/DeviceManager.ts`, `utils/adaptation/` | 跨设备兼容 |
| 🔧 添加工具函数 | `utils/`, `lib/utils.ts` | 通用工具 |
| 🧪 编写测试 | `tests/`, `e2e/` | 测试相关 |
| ⚙️ 修改配置 | `src/config/`, `constants/` | 配置管理 |
| 🎯 状态管理 | `contexts/`, `providers/`, `hooks/` | 应用状态 |
| 📊 性能优化 | `utils/performance/`, `core/` | 性能相关 |

### 🔍 代码搜索提示

**搜索关键词建议**：
- `GameInterface` - 游戏主界面相关
- `DeviceManager` - 设备检测相关  
- `useCanvas` - 画布管理相关
- `adaptation` - 适配系统相关
- `PuzzleCanvas` - 画布组件相关
- `GameContext` - 全局状态相关

---

## 目录索引

<details>
<summary>点击展开完整目录树 (快速浏览项目结构)</summary>

```
- app/
  - api/
    - performance-trend/
  - test/
  - test-unified-system/
- components/
  - animate-ui/
    - backgrounds/
  - layouts/
  - loading/
  - ui/
- constants/
- contexts/
- core/
- coverage/
- docs/
  - adaptation/
    - architecture/
    - archive/
    - compatibility/
    - desktop/
    - mobile/
  - code-review/
    - v1.3.37/
  - configuration/
  - REFACTORING/
    - refactoring1.0/
    - refactoring2.0/
      - analysis/
      - optimization/
      - tasks/
  - testing/
- e2e/
  - temp/
- hooks/
- lib/
- playwright-report/
- providers/
  - hooks/
- public/
- quality-reports/
- scripts/
- src/
  - config/
  - quality-system/
    - ci-cd/
      - configs/
      - examples/
      - tests/
    - quality-detection/
      - __tests__/
      - analyzers/
      - examples/
- test-results/
- tests/
- types/
- utils/
  - adaptation/
  - geometry/
    - __tests__/
  - memory/
  - performance/
  - puzzle/
  - rendering/
    - __tests__/
  - shape/
- validation-reports/
```

</details>

---

## 详细文件结构

<details>
<summary>点击展开详细文件列表 (包含文件描述)</summary>

📁 **app/**
  📁 **api/**
    📁 **performance-trend/**
      📄 `route.ts`
  📁 **test/**
    📄 `page.tsx`
  📁 **test-unified-system/**
    📄 `page.tsx`
  📄 `globals.css` - 全局 CSS 样式
  📄 `layout.tsx` - 全局布局
  📄 🔥 `page.tsx` - Next.js 应用主页
📁 **components/**
  📁 **animate-ui/**
    📁 **backgrounds/**
      📄 `bubble.tsx`
  📁 **layouts/**
    📄 `DesktopLayout.tsx`
    📄 `PhoneLandscapeLayout.tsx`
    📄 `PhonePortraitLayout.tsx`
    📄 `PhoneTabPanel.tsx`
  📁 **loading/**
    📄 `LoadingScreen.tsx`
  📁 **ui/**
    📄 `accordion.tsx`
    📄 `alert.tsx`
    📄 `aspect-ratio.tsx`
    📄 `avatar.tsx`
    📄 `badge.tsx`
    📄 `breadcrumb.tsx`
    📄 `button.tsx`
    📄 `calendar.tsx`
    📄 `card.tsx`
    📄 `carousel.tsx`
    📄 `chart.tsx`
    📄 `checkbox.tsx`
    📄 `collapsible.tsx`
    📄 `command.tsx`
    📄 `context-menu.tsx`
    📄 `drawer.tsx`
    📄 `dropdown-menu.tsx`
    📄 `form.tsx`
    📄 `hover-card.tsx`
    📄 `input-otp.tsx`
    📄 `input.tsx`
    📄 `label.tsx`
    📄 `menubar.tsx`
    📄 `navigation-menu.tsx`
    📄 `pagination.tsx`
    📄 `popover.tsx`
    📄 `progress.tsx`
    📄 `radio-group.tsx`
    📄 `resizable.tsx`
    📄 `scroll-area.tsx`
    📄 `select.tsx`
    📄 `separator.tsx`
    📄 `sheet.tsx`
    📄 `sidebar.tsx`
    📄 `skeleton.tsx`
    📄 `slider.tsx`
    📄 `sonner.tsx`
    📄 `switch.tsx`
    📄 `table.tsx`
    📄 `tabs.tsx`
    📄 `textarea.tsx`
    📄 `toast.tsx`
    📄 `toaster.tsx`
    📄 `toggle-group.tsx`
    📄 `toggle.tsx`
    📄 `tooltip.tsx`
  📄 `ActionButtons.tsx`
  📄 `DesktopPuzzleSettings.tsx`
  📄 `EnvModeClient.tsx`
  📄 🔥 `GameInterface.tsx` - 核心游戏界面
  📄 `GlobalUtilityButtons.tsx`
  📄 `PuzzleCanvas.tsx` - 主画布组件
  📄 `PuzzleControlsCutCount.tsx`
  📄 `PuzzleControlsCutType.tsx`
  📄 `PuzzleControlsGamepad.tsx`
  📄 `PuzzleControlsScatter.tsx`
  📄 `ResponsiveBackground.tsx`
  📄 `RestartButton.tsx`
  📄 `ShapeControls.tsx`
  📄 `theme-provider.tsx`
  📄 `UnifiedSystemDemo.tsx`
📁 **constants/**
  📄 `canvasAdaptation.ts`
📁 **contexts/**
  📄 🔥 `GameContext.tsx` - 核心状态管理中心
📁 **core/**
  📄 `AdaptationEngine.ts`
  📄 `CanvasManager.ts`
  📄 `DeviceLayoutManager.ts`
  📄 ⭐ `DeviceManager.ts`
  📄 `ErrorHandlingService.ts`
  📄 `ErrorMonitoringService.ts`
  📄 `EventManager.ts`
  📄 `EventScheduler.ts`
  📄 `index.ts`
  📄 `LoggingService.ts`
  📄 `PuzzleAdaptationService.ts`
  📄 `ResizeObserverManager.ts`
  📄 `ValidationService.ts`
📁 **coverage/**
  📄 `coverage-final.json`
📁 **docs/**
  📁 **adaptation/**
    📁 **architecture/**
      📄 `performance_optimization.md`
      📄 `README.md` - 项目说明文档
      📄 `unified_adaptation_engine.md`
    📁 **archive/**
      📄 `puzzle_memory_system_legacy.md`
    📁 **compatibility/**
      📄 `browser_support.md`
      📄 `device_compatibility.md`
      📄 `README.md` - 项目说明文档
      📄 `testing_matrix.md`
    📁 **desktop/**
      📄 `desktop_canvas_fix.md`
      📄 `README.md` - 项目说明文档
      📄 `ultrawide_support.md`
      📄 `window_resize_handling.md`
    📁 **mobile/**
      📄 `iphone16_optimization.md`
      📄 `mobile_adaptation_summary.md`
      📄 `mobile_background_adaptation.md`
      📄 `README.md` - 项目说明文档
      📄 `touch_interaction.md`
    📄 `ADAPTATION_GUIDE.md`
    📄 `ADAPTATION_KNOWLEDGE_INHERITANCE.md`
    📄 `fix.md`
    📄 `README.md` - 项目说明文档
    📄 `V1_3_39_GOLDEN_STANDARD.md`
  📁 **code-review/**
    📁 **v1.3.37/**
      📄 `code-review-report.md`
      📄 `improvement-plan.md`
      📄 `metrics-summary.json`
    📄 `quality-trends.md`
    📄 `README.md` - 项目说明文档
  📁 **configuration/**
    📄 `00-configuration-impact-matrix.md`
    📄 `01-core-architecture.md`
    📄 `02-unified-managers.md`
    📄 `03-mobile-adaptation.md`
    📄 `04-unified-adaptation.md`
    📄 `05-desktop-centering.md`
    📄 `06-difficulty-cutting.md`
    📄 `07-shape-generation.md`
    📄 `08-puzzle-scatter.md`
    📄 `09-collision-bounce.md`
    📄 `10-rotation.md`
    📄 `11-device-responsive.md`
    📄 `12-puzzle-piece-adaptation.md`
    📄 `13-media-sound.md`
    📄 `14-visual-theme.md`
    📄 `15-build-dev.md`
    📄 `16-performance-test.md`
    📄 `17-ui-components.md`
    📄 `18-touch-interaction.md`
    📄 `19-debug-mode.md`
    📄 `README.md` - 项目说明文档
  📁 **REFACTORING/**
    📁 **refactoring1.0/**
      📄 `重构前分析.md`
      📄 `BUILD_STATUS.md`
      📄 `MIGRATION_COMPLETE.md`
      📄 `MIGRATION_GUIDE.md`
      📄 `plan.md`
      📄 `README.md` - 项目说明文档
      📄 `REFACTORING_SUMMARY.md`
      📄 `TYPE_ERRORS_FINAL_FIX.md`
    📁 **refactoring2.0/**
      📁 **analysis/**
        📄 `1.0重构分析.md`
        📄 `1.0重构改进方案.md`
        📄 `event-driven-architecture-design.md`
      📁 **optimization/**
        📄 `cross-brand-optimization-summary.md`
        📄 `iphone16-cross-brand-compatibility.md`
      📁 **tasks/**
        📄 `task1-7.md`
        📄 `task10-resize-observer-implementation.md`
        📄 `task11-setTimeout-removal-implementation.md`
        📄 `task12-event-response-optimization.md`
        📄 `task13-device-manager-refactoring.md`
        📄 `task14-adaptation-engine-refactoring.md`
        📄 `task15-useCanvas-hook-refactoring.md`
        📄 `task16-responsibility-separation-validation.md`
        📄 `task19-error-handling-mechanism.md`
        📄 `task20-completion-summary.md`
        📄 `task21-completion-summary.md`
        📄 `task22-performance-benchmark.md`
        📄 `task23-code-quality-assessment.md`
        📄 `task24-documentation-update.md`
        📄 `task8-device-detection-verification.md`
        📄 `task9-setTimeout-analysis.md`
      📄 `README.md` - 项目说明文档
      📄 `REFACTORING_2.0_SUMMARY.md`
    📄 `README.md` - 项目说明文档
  📁 **testing/**
    📄 `automated_testing_workflow.cn.md`
    📄 `automated_testing_workflow.en.md`
  📄 `API_DOCUMENTATION.md`
  📄 `api-scan-report.md`
  📄 `CICD_INTEGRATION_STATUS.md`
  📄 `difficulty-design.md`
  📄 `GETTING_STARTED.md`
  📄 `GITHUB_ACTIONS_SETUP_GUIDE.md`
  📄 `PRE_PUSH_CHECKLIST.md`
  📄 `project_structure.md`
  📄 `QUICK_ADAPTATION_GUIDE.md`
  📄 `README.md` - 项目说明文档
📁 **e2e/**
  📁 **temp/**
  📄 `full_game_flow.spec.ts`
📁 **hooks/**
  📄 `use-mobile.tsx`
  📄 `use-toast.ts`
  📄 `useDebugToggle.ts`
  📄 `useDeviceDetection.ts`
  📄 `usePuzzleAdaptation.ts`
  📄 `usePuzzleInteractions.ts`
  📄 `useResponsiveCanvasSizing.ts`
  📄 `useShapeAdaptation.ts`
📁 **lib/**
  📄 `utils.ts`
📁 **playwright-report/**
📁 **providers/**
  📁 **hooks/**
    📄 `index.ts`
    📄 `useAdaptation.ts`
    📄 `useCanvas.ts`
    📄 `useCanvasEvents.ts`
    📄 `useCanvasRefs.ts`
    📄 `useCanvasSize.ts`
    📄 `useDevice.ts`
  📄 `SystemProvider.tsx`
📁 **public/**
  📄 `bg-mobile-landscape.png`
  📄 `bg-mobile-portrait.png`
  📄 `puzzle-pieces.mp3` - 游戏音效文件
  📄 `texture-tile.png` - 拼图材质纹理
📁 **quality-reports/**
  📄 `cicd-test-report.json`
  📄 `cicd-test-report.md`
📁 **scripts/**
  📄 `archive-test-results.js`
  📄 `check-architecture-conflicts.ts`
  📄 `classify-apis.js`
  📄 `cleanup-code.js`
  📄 `generate-project-structure-clean.js`
  📄 `generate-project-structure-simple.js`
  📄 `generate-project-structure.js`
  📄 `organize-docs.js`
  📄 `run-comprehensive-tests.js`
  📄 `scan-api-changes.js`
  📄 `test-cicd-integration.js`
  📄 `validate-unified-system.ts`
📁 **src/**
  📁 **config/**
    📄 `adaptationConfig.ts`
    📄 `deviceConfig.ts`
    📄 `index.ts`
    📄 `performanceConfig.ts`
  📁 **quality-system/**
    📁 **ci-cd/**
      📁 **configs/**
        📄 `external-tools.config.js`
        📄 `sonarqube.properties`
      📁 **examples/**
        📄 `cicd-integration-demo.ts`
      📁 **tests/**
        📄 `external-tools-integration.test.ts`
      📄 `CICDIntegrationService.ts`
    📁 **quality-detection/**
      📁 **__tests__/**
        📄 `AdvancedQualityMetrics.test.ts`
        📄 `QualityDetectionEngine.test.ts`
      📁 **analyzers/**
        📄 `ComplexityAnalyzer.ts`
        📄 `ESLintAnalyzer.ts`
        📄 `TestCoverageAnalyzer.ts`
        📄 `TypeScriptAnalyzer.ts`
      📁 **examples/**
        📄 `advanced-metrics-demo.ts`
        📄 `quality-detection-demo.ts`
      📄 `AdvancedQualityMetrics.ts`
      📄 `ImprovementSuggestionEngine.ts`
      📄 `QualityDetectionEngine.ts`
      📄 `QualityScoreCalculator.ts`
      📄 `QualityTrendAnalyzer.ts`
    📄 `README.md` - 项目说明文档
📁 **test-results/**
📁 **tests/**
  📄 `test-performance-benchmark.js`
  📄 `test-performance-impact.js`
  📄 `test-real-performance-analysis.js`
  📄 `test-real-performance-baseline.js`
📁 **types/**
  📄 `common.ts`
  📄 `global.d.ts`
  📄 `memory.ts`
  📄 `puzzleTypes.ts`
📁 **utils/**
  📁 **adaptation/**
    📄 `StatePreservationEngine.ts`
    📄 ⭐ `UnifiedAdaptationEngine.ts`
  📁 **geometry/**
    📁 **__tests__/**
      📄 `puzzleGeometry.test.ts`
    📄 `puzzleGeometry.ts`
  📁 **memory/**
    📄 `AdaptationEngine.ts`
    📄 `AdaptationRuleEngine.ts`
    📄 `AdaptationRules.ts`
    📄 `CoordinateCleaner.ts`
    📄 `MemoryManager.ts`
    📄 `MemoryStorage.ts`
    📄 `memoryUtils.ts`
  📁 **performance/**
    📄 `EventManager.ts`
    📄 `MemoryManager.ts`
    📄 `OptimizationAdapter.ts`
    📄 `SystemPerformanceMonitor.ts`
  📁 **puzzle/**
    📄 `cutGenerators.ts`
    📄 `PuzzleGenerator.ts`
    📄 `puzzleUtils.ts`
    📄 `ScatterPuzzle.ts`
  📁 **rendering/**
    📁 **__tests__/**
      📄 `colorUtils.test.ts`
    📄 `colorUtils.ts`
    📄 `puzzleDrawing.ts`
    📄 `RenderOptimizer.ts`
    📄 `soundEffects.ts`
  📁 **shape/**
    📄 `geometryUtils.ts`
    📄 `shapeAdaptationUtils.ts`
    📄 `ShapeGenerator.ts`
  📄 `constants.ts`
  📄 `helper.ts`
  📄 `puzzlePieceAdaptationUtils.ts`
📁 **validation-reports/**
  📄 `validation-report-report_1753780609470_esnf4leap.html`
  📄 `validation-report-report_1753780609470_esnf4leap.json`
  📄 `validation-report-report_1753780609470_esnf4leap.markdown`
📄 `.gitignore` - Git 忽略文件配置
📄 `CHANGELOG.md` - 版本历史与变更记录
📄 `components.json` - Shadcn UI 组件配置
📄 `eslint.config.js`
📄 `jest.config.js` - Jest 测试配置
📄 `next.config.mjs` - Next.js 框架配置
📄 `package-lock.json` - 依赖锁定文件
📄 `package.json` - 项目依赖和脚本配置
📄 `playwright.config.ts` - Playwright E2E 测试配置
📄 `postcss.config.mjs` - PostCSS 配置
📄 `quality-gate.config.js`
📄 `README.md` - 项目说明文档
📄 `tailwind.config.ts` - Tailwind CSS 配置
📄 `tsconfig.json` - TypeScript 编译配置


</details>

---

## 开发相关文档

| 文档类型 | 链接 | 用途 |
|----------|------|------|
| 📖 项目说明 | [README.md](/README.md) | 项目介绍和快速开始 |
| 📝 更新日志 | [CHANGELOG.md](/CHANGELOG.md) | 版本历史和变更记录 |
| 🔌 API文档 | [API_DOCUMENTATION.md](/docs/API_DOCUMENTATION.md) | 接口规范和使用指南 |
| ⚙️ 配置指南 | [configuration/](/docs/configuration/README.md) | 环境配置和部署指南 |

---

## 使用说明

### 图标含义
- 📁 目录 | 📄 文件 | 🔥 核心文件 | ⭐ 重要文件
- 🎨 表现层 | ⚡ 业务层 | 🔧 数据层 | ⚙️ 配置层

### 文档更新
```bash
npm run generate-structure  # 一键更新项目结构文档
```

### 自定义配置
编辑 `scripts/generate-project-structure-clean.js` 可配置：
- 架构分层定义
- 功能模块划分  
- 技术栈信息
- 关键文件标记

---

*📅 生成时间：2025/7/31 19:49:19 | 🔧 版本：v3.1.0 | 🎯 开发导航工具*
