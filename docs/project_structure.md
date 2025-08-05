# 项目结构（Project Structure）

> 自动生成时间：2025/8/5 16:04:19  
> 生成工具：项目结构文档生成器 v3.1.0 - 开发导航版

**开发者导航工具** - 快速理解项目架构，精准定位代码位置，提升开发效率。

## 快速导航
[项目概览](#项目概览) | [架构概览](#架构概览) | [功能模块](#功能模块) | [技术栈](#技术栈) | [开发指引](#开发指引) | [目录索引](#目录索引)

---

## 项目概览

| 统计项 | 数量 | 说明 |
|--------|------|------|
| 总目录数 | 41 | 项目目录结构层次 |
| 总文件数 | 199 | 代码文件和资源文件总数 |
| 项目容量 | 4.5 MB | 不包含node_modules的项目大小 |

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
  - lcov-report/
- docs/
  - configuration/
  - testing/
- e2e/
  - screenshots/
  - temp/
- hooks/
- lib/
- playwright-report/
- public/
- quality-reports/
- scripts/
- src/
  - config/
  - quality-system/
- test-results/
- types/
- utils/
  - __tests__/
  - debug/
  - geometry/
    - __tests__/
  - puzzle/
  - rendering/
    - __tests__/
  - shape/
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
📁 **constants/**
  📄 `canvasAdaptation.ts`
📁 **contexts/**
  📄 🔥 `GameContext.tsx` - 核心状态管理中心
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
  📁 **lcov-report/**
    📄 `base.css`
    📄 `block-navigation.js`
    📄 `colorUtils.ts.html`
    📄 `favicon.png`
    📄 `index.html`
    📄 `prettify.css`
    📄 `prettify.js`
    📄 `sort-arrow-sprite.png`
    📄 `sorter.js`
  📄 `base.css`
  📄 `block-navigation.js`
  📄 `colorUtils.ts.html`
  📄 `coverage-final.json`
  📄 `coverage-summary.json`
  📄 `favicon.png`
  📄 `index.html`
  📄 `lcov.info`
  📄 `prettify.css`
  📄 `prettify.js`
  📄 `sort-arrow-sprite.png`
  📄 `sorter.js`
📁 **docs/**
  📁 **configuration/**
    📄 `adaptation-system.md`
    📄 `build-dev.md`
    📄 `core-architecture.md`
    📄 `debug-mode.md`
    📄 `device-responsive.md`
    📄 `difficulty-cutting.md`
    📄 `media-sound.md`
    📄 `performance.md`
    📄 `README.md` - 项目说明文档
    📄 `shape-generation.md`
  📁 **testing/**
    📄 `playwright-automation.md`
    📄 `README.md` - 项目说明文档
  📄 `API_DOCUMENTATION.md`
  📄 `api-scan-report.md`
  📄 `CURRENT_ADAPTATION_SYSTEM.md`
  📄 `difficulty-design.md`
  📄 `GETTING_STARTED.md`
  📄 `project_structure.md`
  📄 `README.md` - 项目说明文档
  📄 `SUPREME_ADAPTATION_DIRECTIVE.md`
📁 **e2e/**
  📁 **screenshots/**
  📁 **temp/**
    📄 `final_acceptance_test.spec.ts`
    📄 `simple_desktop_adaptation_test.spec.ts`
  📄 `full_game_flow.spec.ts`
📁 **hooks/**
  📄 `use-mobile.tsx`
  📄 `use-toast.ts`
  📄 `useDebugToggle.ts`
  📄 `useDeviceDetection.ts`
  📄 `useMobileAdaptation.ts`
  📄 `useMobileEnhancements.ts`
  📄 `usePuzzleInteractions.ts`
  📄 `useResponsiveCanvasSizing.ts`
📁 **lib/**
  📄 `utils.ts`
📁 **playwright-report/**
📁 **public/**
  📄 `bg-mobile-portrait.png`
  📄 `puzzle-pieces.mp3` - 游戏音效文件
  📄 `texture-tile.png` - 拼图材质纹理
📁 **quality-reports/**
  📄 `cicd-test-report.json`
  📄 `cicd-test-report.md`
  📄 `quality-report-2025-07-31.json`
  📄 `quality-report-2025-08-03.json`
  📄 `quality-report-2025-08-05.json`
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
    📄 `quality-checker.js`
    📄 `README.md` - 项目说明文档
    📄 `test-trigger.md`
📁 **test-results/**
📁 **types/**
  📄 `global.d.ts`
  📄 `puzzleTypes.ts`
📁 **utils/**
  📁 **__tests__/**
    📄 `SimpleAdapter.test.ts`
  📁 **debug/**
    📄 `wechatTest.js`
  📁 **geometry/**
    📁 **__tests__/**
      📄 `puzzleGeometry.test.ts`
    📄 `puzzleGeometry.ts`
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
  📄 `SimpleAdapter.ts`
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

*📅 生成时间：2025/8/5 16:04:19 | 🔧 版本：v3.1.0 | 🎯 开发导航工具*
