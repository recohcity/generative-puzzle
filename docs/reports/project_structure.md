# 项目结构（Project Structure）

> 自动生成时间：2026/3/27 13:38:30  
> 生成工具：项目结构文档生成器 v3.1.0 - 开发导航版

**开发者导航工具** - 快速理解项目架构，精准定位代码位置，提升开发效率。

## 快速导航
[项目概览](#项目概览) | [架构概览](#架构概览) | [功能模块](#功能模块) | [技术栈](#技术栈) | [开发指引](#开发指引) | [目录索引](#目录索引)

---

## 项目概览

| 统计项 | 数量 | 说明 |
|--------|------|------|
| 总目录数 | 63 | 项目目录结构层次 |
| 总文件数 | 317 | 代码文件和资源文件总数 |
| 项目容量 | 5.09 MB | 不包含node_modules的项目大小 |

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
  - scores/
  - test/
- components/
  - animate-ui/
    - backgrounds/
  - layouts/
  - leaderboard/
  - loading/
  - score/
    - __tests__/
  - ui/
- constants/
- contexts/
- core/
- coverage/
- docs/
  - archive/
  - configuration/
  - i18n/
  - reports/
  - Review/
  - testing/
- e2e/
- hooks/
- lib/
- playwright-report/
- public/
- quality-reports/
- scripts/
- src/
  - config/
  - i18n/
    - locales/
  - quality-system/
- styles/
- test-results/
- types/
- utils/
  - __tests__/
  - angleDisplay/
    - __tests__/
  - data/
    - __tests__/
  - data-tools/
  - difficulty/
    - __tests__/
  - geometry/
    - __tests__/
  - leaderboard/
    - __tests__/
  - puzzle/
    - __tests__/
    - graph/
      - __tests__/
  - rendering/
    - __tests__/
  - score/
    - __tests__/
  - shape/
    - __tests__/
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
  📁 **scores/**
    📄 `page.tsx`
  📁 **test/**
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
  📁 **leaderboard/**
    📄 `leaderboard-styles.css`
    📄 `LeaderboardItemStyles.tsx`
    📄 `LeaderboardPanel.tsx`
    📄 `SimplifiedLeaderboardPanel.tsx`
  📁 **loading/**
    📄 `LoadingScreen.tsx`
  📁 **score/**
    📁 **__tests__/**
      📄 `RotationScoreDisplay.test.tsx`
    📄 `animations.css`
    📄 `DesktopScoreLayout.tsx`
    📄 `MobileScoreLayout.tsx`
    📄 `README.md` - 项目说明文档
    📄 `RotationScoreDisplay.example.tsx`
    📄 `RotationScoreDisplay.module.css`
    📄 `RotationScoreDisplay.tsx`
    📄 `ScoreDisplay.tsx`
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
  📄 `DynamicTitle.tsx`
  📄 `EnvModeClient.tsx`
  📄 🔥 `GameInterface.tsx` - 核心游戏界面
  📄 `GameRecordDetails.tsx`
  📄 `GameTimer.module.css`
  📄 `GameTimer.tsx`
  📄 `GlobalUtilityButtons.tsx`
  📄 `LanguageSwitcher.tsx`
  📄 `LeaderboardButton.tsx`
  📄 `LeaderboardPanel.tsx`
  📄 `LiveScore.module.css`
  📄 `LiveScore.tsx`
  📄 `MobileSmartHints.tsx`
  📄 `PuzzleCanvas.tsx` - 主画布组件
  📄 `PuzzleControlsCutCount.tsx`
  📄 `PuzzleControlsCutType.tsx`
  📄 `PuzzleControlsGamepad.tsx`
  📄 `PuzzleControlsScatter.tsx`
  📄 `RecentGameDetails.tsx`
  📄 `ResponsiveBackground.tsx`
  📄 `RestartButton.tsx`
  📄 `RotationCounter.tsx`
  📄 `ShapeControls.tsx`
  📄 `theme-provider.tsx`
📁 **constants/**
  📄 `canvasAdaptation.ts`
📁 **contexts/**
  📄 🔥 `GameContext.tsx` - 核心状态管理中心
  📄 `I18nContext.tsx`
📁 **core/**
  📄 `CanvasManager.ts`
  📄 `DeviceLayoutManager.ts`
  📄 ⭐ `DeviceManager.ts`
  📄 `ErrorHandlingService.ts`
  📄 `ErrorMonitoringService.ts`
  📄 `EventManager.ts`
  📄 `EventScheduler.ts`
  📄 `index.ts`
  📄 `LoggingService.ts`
  📄 `ResizeObserverManager.ts`
  📄 `ValidationService.ts`
📁 **coverage/**
📁 **docs/**
  📁 **archive/**
    📄 `coverage-strategy-legacy.md`
    📄 `CUT_LOGIC_FIX_REPORT.md`
    📄 `cutGenerators-refactoring-report.md`
    📄 `DEPLOY_SUMMARY.md`
    📄 `dynamic-report-optimization-summary.md`
    📄 `GITIGNORE_OPTIMIZATION_SUMMARY.md`
    📄 `hint-reward-impact.md`
    📄 `performance-optimization-results.md`
  📁 **configuration/**
    📄 `adaptation-system.md`
    📄 `build-dev.md`
    📄 `core-architecture.md`
    📄 `debug-mode.md`
    📄 `device-responsive.md`
    📄 `difficulty-cutting.md`
    📄 `media-sound.md`
    📄 `performance.md`
    📄 `shape-generation.md`
  📁 **i18n/**
    📄 `README.md` - 项目说明文档
  📁 **reports/**
    📄 `api-classification-report.md`
    📄 `api-scan-report.md`
    📄 `code-quality-report.md`
    📄 `dependency-analysis-report.md`
    📄 `Generative Puzzle 项目代码质量全面体检报告.md`
    📄 `project_structure.md`
  📁 **Review/**
    📄 `2026-current-codebase-architecture-review-and-refactor-plan.md`
    📄 `2026-web-game-architecture-assessment-report.md`
    📄 `architecture-plan-0322.md`
    📄 `web_game_arch_references_2026.docx`
    📄 `web_game_arch_review_2026.html`
  📁 **testing/**
    📄 `button-testids.md`
    📄 `playwright-automation.md`
    📄 `README.md` - 项目说明文档
  📄 `API_DOCUMENTATION.md`
  📄 `CURRENT_ADAPTATION_SYSTEM.md`
  📄 `game-development-milestones.md`
  📄 `game-rules-unified.md`
  📄 `GETTING_STARTED.md`
  📄 `GITHUB_PAGES_DEPLOYMENT.md`
  📄 `icon-configuration.md`
  📄 `PRD_生成式拼图游戏.md`
  📄 `README.md` - 项目说明文档
  📄 `SUPREME_ADAPTATION_DIRECTIVE.md`
📁 **e2e/**
  📄 `full_game_flow.spec.ts`
  📄 `production_guard.spec.ts`
📁 **hooks/**
  📄 `use-mobile.tsx`
  📄 `use-toast.ts`
  📄 `useDebugToggle.ts`
  📄 `useDeviceDetection.ts`
  📄 `useMobileAdaptation.ts`
  📄 `useMobileEnhancements.ts`
  📄 `usePanelState.ts`
  📄 `usePuzzleInteractions.ts`
  📄 `useResponsiveCanvasSizing.ts`
📁 **lib/**
  📄 `utils.ts`
📁 **playwright-report/**
📁 **public/**
  📄 `bg-mobile-portrait.webp`
  📄 `bgm.mp3` - 游戏音效文件
  📄 `eb8734d4982c5186c0a4d6018b409622.txt`
  📄 `finish.mp3`
  📄 `icon-1024.png`
  📄 `icon-16.png`
  📄 `icon-180.png`
  📄 `icon-192.png`
  📄 `icon-32.png`
  📄 `icon-512.png`
  📄 `icon.ico`
  📄 `manifest.json`
  📄 `performance-data.json`
  📄 `scatter.mp3`
  📄 `split.mp3`
  📄 `texture-tile.png` - 拼图材质纹理
📁 **quality-reports/**
📁 **scripts/**
  📄 `analyze-unused-deps.cjs`
  📄 `archive-test-results.cjs`
  📄 `build-for-github.cjs`
  📄 `check-architecture-conflicts.ts`
  📄 `check-docs-consistency.cjs`
  📄 `check-gitignore.sh`
  📄 `check-reducer-purity.cjs`
  📄 `classify-apis.cjs`
  📄 `cleanup-code.cjs`
  📄 `generate-lint-report.cjs`
  📄 `generate-performance-data.cjs`
  📄 `generate-project-structure-clean.cjs`
  📄 `generate-project-structure-simple.cjs`
  📄 `generate-project-structure.cjs`
  📄 `organize-docs.cjs`
  📄 `run-comprehensive-tests.cjs`
  📄 `scan-api-changes.cjs`
  📄 `scan-production-exposure.cjs`
  📄 `scan-ssr-boundary.cjs`
  📄 `simple-coverage-report.cjs`
  📄 `test-cicd-integration.cjs`
  📄 `update-health-report.cjs`
  📄 `validate-unified-system.ts`
📁 **src/**
  📁 **config/**
    📄 `adaptationConfig.ts`
    📄 `deviceConfig.ts`
    📄 `index.ts`
    📄 `performanceConfig.ts`
  📁 **i18n/**
    📁 **locales/**
      📄 `en.json`
      📄 `zh-CN.json`
    📄 `config.ts`
    📄 `index.ts`
  📁 **quality-system/**
    📄 `quality-checker.cjs`
    📄 `README.md` - 项目说明文档
    📄 `test-trigger.md`
📁 **styles/**
  📄 `overlay-elements.css`
📁 **test-results/**
📁 **types/**
  📄 `global.d.ts`
  📄 `puzzleTypes.ts`
📁 **utils/**
  📁 **__tests__/**
    📄 `constants.test.ts`
    📄 `helper.test.ts`
    📄 `SimpleAdapter.test.ts`
  📁 **angleDisplay/**
    📁 **__tests__/**
      📄 `AngleDisplayController.test.ts`
      📄 `AngleDisplayModeUpdater.test.ts`
      📄 `AngleDisplayService.test.ts`
      📄 `AngleVisibilityManager.test.ts`
      📄 `HintEnhancedDisplay.test.ts`
      📄 `index.test.ts`
      📄 `README.md` - 项目说明文档
      📄 `useAngleDisplay.test.ts`
    📄 `AngleDisplayController.ts`
    📄 `AngleDisplayModeUpdater.ts`
    📄 `AngleDisplayService.ts`
    📄 `AngleVisibilityManager.ts`
    📄 `HintEnhancedDisplay.ts`
    📄 `index.ts`
    📄 `README.md` - 项目说明文档
    📄 `useAngleDisplay.ts`
  📁 **data/**
    📁 **__tests__/**
      📄 `GameDataManager.test.ts`
      📄 `GameDataManagerCoverage.test.ts`
    📄 `GameDataManager.ts`
  📁 **data-tools/**
    📄 `clearGameData.ts`
    📄 `GameDataTools.ts`
    📄 `manualClear.md`
  📁 **difficulty/**
    📁 **__tests__/**
      📄 `DifficultyUtils.test.ts`
    📄 `DifficultyUtils.ts`
  📁 **geometry/**
    📁 **__tests__/**
      📄 `puzzleGeometry.test.ts`
    📄 `puzzleGeometry.ts`
  📁 **leaderboard/**
    📁 **__tests__/**
      📄 `LeaderboardSimplifier.test.ts`
    📄 `LeaderboardSimplifier.ts`
  📁 **puzzle/**
    📁 **__tests__/**
      📄 `cutGeneratorController.test.ts`
      📄 `cutGeneratorGeometry.test.ts`
      📄 `cutGenerators-performance.test.ts`
      📄 `cutGenerators.test.ts`
      📄 `cutGeneratorTypes.test.ts`
      📄 `cutGeneratorValidator.test.ts`
      📄 `puzzleCompensation.test.ts`
      📄 `PuzzleGenerator.branches.test.ts`
      📄 `PuzzleGenerator.test.ts`
      📄 `puzzleUtils.test.ts`
      📄 `simplePuzzleGenerator.test.ts`
    📁 **graph/**
      📁 **__tests__/**
        📄 `BezierCurve.test.ts`
        📄 `NetworkCutter.test.ts`
      📄 `BezierCurve.ts`
      📄 `Graph.ts`
      📄 `NetworkCutter.ts`
    📄 `cutGeneratorConfig.ts`
    📄 `cutGeneratorController.ts`
    📄 `cutGeneratorGeometry.ts`
    📄 `cutGenerators.ts`
    📄 `cutGeneratorStrategies.ts`
    📄 `cutGeneratorTypes.ts`
    📄 `cutGeneratorValidator.ts`
    📄 `puzzleCompensation.ts`
    📄 `PuzzleGenerator.ts`
    📄 `puzzleUtils.ts`
    📄 `ScatterPuzzle.ts`
    📄 `simplePuzzleGenerator.ts`
  📁 **rendering/**
    📁 **__tests__/**
      📄 `colorUtils.test.ts`
      📄 `puzzleDrawing.test.ts`
      📄 `RenderOptimizer.test.ts`
      📄 `soundEffects.test.ts`
    📄 `colorUtils.ts`
    📄 `puzzleDrawing.ts`
    📄 `RenderOptimizer.ts`
    📄 `soundEffects.ts`
  📁 **score/**
    📁 **__tests__/**
      📄 `RotationEfficiencyCalculator.test.ts`
      📄 `ScoreCalculator.test.ts`
      📄 `ScoreCalculatorCoverage.test.ts`
    📄 `RotationEfficiencyCalculator.ts`
    📄 `ScoreCalculator.ts`
  📁 **shape/**
    📁 **__tests__/**
      📄 `geometryUtils.test.ts`
      📄 `OptimizedShapeGenerator.test.ts`
      📄 `ShapeGenerator.test.ts`
      📄 `simpleShapeGenerator.test.ts`
    📄 `geometryUtils.ts`
    📄 `OptimizedShapeGenerator.ts`
    📄 `ShapeGenerator.ts`
    📄 `simpleShapeGenerator.ts`
  📄 `constants.ts`
  📄 `helper.ts`
  📄 `SimpleAdapter.ts`
📄 `.gitignore` - Git 忽略文件配置
📄 `CHANGELOG.md` - 版本历史与变更记录
📄 `components.json` - Shadcn UI 组件配置
📄 `jest.config.cjs`
📄 `jest.coverage.cjs`
📄 `jest.fast.cjs`
📄 `LICENSE`
📄 `next.config.mjs` - Next.js 框架配置
📄 `package-lock.json` - 依赖锁定文件
📄 `package.json` - 项目依赖和脚本配置
📄 `playwright.config.ts` - Playwright E2E 测试配置
📄 `postcss.config.mjs` - PostCSS 配置
📄 `quality-gate.config.cjs`
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
| ⚙️ 配置指南 | [configuration/](/docs/configuration/) | 环境配置和部署指南 |

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

*📅 生成时间：2026/3/27 13:38:30 | 🔧 版本：v3.1.0 | 🎯 开发导航工具*
