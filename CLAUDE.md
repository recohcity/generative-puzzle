# CLAUDE.md — Generative Puzzle

DO NOT send optional commentary in the response.
DO NOT send optional commentary in the code.
DO NOT send optional commentary in the markdown. 

> AI 编码行为准则。融合 Andrej Karpathy 的 LLM 编码反模式洞察、第一性原理思维方法论，以及本项目的领域特定约束。

**权衡声明：** 本准则倾向于谨慎而非速度。对于琐碎任务（明显的单行修复、简单的拼写纠正），请自行判断——并非每个变更都需要完整的流程严谨性。

---

## 0. 在你开始之前：先判断场景

每次收到任务，先过这三个问题，再动手：

**① 我真正要解决的是什么？**
剥离表面形式，回归核心功能。用户说"加一个功能"，不等于你见过的某个模式就是正确答案。

**② 存在多种解读吗？**
如果有，把所有解读都呈现出来，不要默默挑一个。前置澄清比事后返工便宜得多。

**③ 我要碰的文件有风险吗？**
对照第 5.4 节高风险文件列表。如果是高风险文件，先走影响分析流程（第 6 节），再动手。

> 🔑 **LLM 最常见的失败模式**：悄悄做出错误假设然后一路狂奔，到代码写完才暴露问题。

---

## 1. 先思考，再编码

**不要假设。不要掩盖困惑。暴露权衡。**

实现之前：

- **显式陈述你的假设。** 如果不确定，问。
- **如果存在多种解读，全部呈现** — 不要默默挑一个。
- **如果存在更简单的方案，说出来。** 该反驳时就反驳。
- **如果遇到不清楚的地方，停下来。** 说明具体哪里令你困惑，然后提问。

---

## 2. 简洁至上

**用最少的代码解决问题。不做任何投机性设计。**

- 不要构建超出请求范围的功能。
- 不要为只用一次的代码构建抽象层。
- 不要构建未被请求的"灵活性"或"可配置性"。
- 不要为不可能发生的场景编写错误处理。
- 如果你写了 200 行而 50 行就能搞定，重写它。

**自检标准：** "一个资深工程师会不会说这过度复杂了？" 如果会，简化。

> ⚠️ **例外**：`contexts/GameContext.tsx`（~1200 行）和 `hooks/usePuzzleInteractions.ts`（~1000 行）的体积是真实业务复杂度的结果，不是过度工程。不要以"简洁"为由拆散它们——除非被明确要求重构，且已通过影响分析。

---

## 3. 精准手术式修改

**只碰必须碰的。只清理自己制造的垃圾。**

编辑现有代码时：

- **不要"顺手改进"** 相邻的代码、注释或格式。
- **不要重构没有坏的东西。**
- **匹配现有代码风格**，即使你个人会用不同的方式。
- 如果发现不相关的死代码，**提一句** — 但不要删除它。

当你的修改制造了孤儿：

- **移除你的变更导致的** 未使用的 imports / 变量 / 函数。
- **不要移除** 在你修改之前就已存在的死代码（除非被明确要求）。

**检验标准：** 每一行变更都应该能直接追溯到用户的请求。

---

## 4. 目标驱动执行

**定义成功标准。循环直至验证通过。**

> *"LLM 特别擅长循环直到达成特定目标… 不要告诉它做什么，给它成功标准然后看它执行。"* — Andrej Karpathy

将任务转化为可验证的目标。**本项目没有自动化测试框架**，验证方式以下列手段为主：

| 模糊指令 | 可验证目标 |
|---------|-----------|
| "修这个 bug" | "`npm run build` 无报错，浏览器中复现步骤不再触发问题" |
| "加一个功能" | "功能在 Chrome + Safari + 微信内置浏览器三端均可正常使用" |
| "重构 X" | "`npm run build && npm run lint` 全部通过，功能行为与重构前一致" |
| "优化性能" | "Chrome DevTools Performance 面板显示帧率在百级碎片量下稳定 60FPS" |
| "修复移动端问题" | "在竖屏 + 横屏 + 刘海屏三种形态下目视验证通过" |

对于多步骤任务，陈述简要计划：

```
1. [步骤] → 验证: [检查方式]
2. [步骤] → 验证: [检查方式]
3. [步骤] → 验证: [检查方式]
```

---

## 5. 项目特定规则

### 5.1 技术栈约束

| 领域 | 技术 | 注意事项 |
|------|------|---------|
| 框架 | Next.js 15 + React 19 (App Router) | 严格遵守 `"use client"` / Server Component 边界 |
| 样式 | Tailwind CSS 3.x + Shadcn UI | Shadcn 基于 Radix UI 原语；所有 Radix 组件已按需安装（见 package.json），不要重复引入 |
| 动画 | Framer Motion (`motion` 包 v12.x) | 60FPS 是底线；`layoutId` 必须全局唯一 |
| 渲染 | HTML5 Canvas + OffscreenCanvas AOT Cache | 拼图碎片绘制在 Canvas 层，禁止用 DOM 模拟 |
| 云端 | Supabase (Auth + PostgreSQL) | RPC 使用 `SECURITY DEFINER`，注意行级权限 |
| 核心算法 | `@generative-puzzle/game-core` | 几何/数学逻辑与 UI **完全隔离**，无 React/DOM 依赖 |
| 国际化 | 自建 i18n (`src/i18n/`) | 所有面向用户的文本必须同时支持中/英 |
| 本地存储 | `STORAGE_KEYS` 统一常量 (`utils/storageKeys.ts`) | 禁止硬编码任何 `localStorage` 键名 |
| Node.js | `>=22 <23`（见 `.nvmrc`） | 不要引入 Node 22 以外版本的特性 |

**已安装的 Radix UI 组件**（直接使用，无需重新安装）：
`accordion / alert-dialog / aspect-ratio / avatar / checkbox / collapsible / context-menu / dialog / dropdown-menu / hover-card / label / menubar / navigation-menu / popover / progress / radio-group / scroll-area / select / separator / slider / slot / switch / tabs / toast / toggle / toggle-group / tooltip`

### 5.2 架构分层边界（严格执行）

```
packages/game-core/src/
  ├── types/puzzleTypes.ts   → 所有共享类型的唯一来源（Point, PuzzlePiece, GameState…）
  ├── utils/geometry/        → 多边形切割、碰撞检测、随机种子
  └── utils/score/           → 计分、旋转效率计算

core/                        → 基础设施：Canvas 管理、设备检测、事件调度、日志
constants/canvasAdaptation.ts → 画布自适应核心常量
contexts/GameContext.tsx     → 游戏主状态机（useReducer，~1200 行，极高风险）
hooks/                       → 状态管理：云同步、物理模拟、触控交互
components/                  → UI 组件层：拼图交互、结算面板、排行榜
utils/                       → 业务工具：难度、渲染、分数、形状、云端
src/config/                  → 设备、性能、适配配置
src/i18n/                    → 国际化文本（中/英）
app/                         → Next.js 路由（/ 主页，/scores 管理台，/api 接口）
```

**绝对不做：**
- 在 `packages/game-core` 中引入任何 React / DOM 依赖。
- 在 UI 组件中直接编写几何计算逻辑（属于 `game-core`）。
- 硬编码 `localStorage` 键名（使用 `STORAGE_KEYS` 常量）。
- 绕过 `@generative-puzzle/game-core` 的类型直接在业务层自定义重复类型。
- 在 `gameReducer` 纯函数体内执行副作用（网络请求、`localStorage` 写入等在 dispatch 之前处理）。

### 5.3 游戏状态机（极高风险区）

`contexts/GameContext.tsx` 是项目的核心，包含约 **1200 行**的 `useReducer` 状态机，管理完整的游戏生命周期。**修改前必须先阅读完整文件，因为局部上下文极易导致错误判断。**

**游戏生命周期：**

```
初始化 → SET_SHAPE_TYPE / SET_CUT_TYPE / SET_CUT_COUNT
       → GENERATE_SHAPE → GENERATE_PUZZLE
       → SCATTER_PUZZLE（⚑ 游戏计时开始，gameStats 初始化）
       → [游戏中] TRACK_ROTATION / TRACK_HINT_USAGE / TRACK_DRAG_OPERATION
       →          UPDATE_PIECE_POSITION / ROTATE_PIECE / MOVE_PIECE
       →          ADD_COMPLETED_PIECE（触发完成检测）
       → GAME_COMPLETED（⚑ 分数计算、排行榜更新）
       → RESTART_GAME 或 RETRY_CURRENT_GAME
```

**修改 GameContext 时的强制规则：**

1. **Reducer 必须是纯函数**：不能在 `gameReducer` 中执行副作用（网络请求、`localStorage`、`Date.now()` 外的随机操作均在 action dispatch 之前处理）。
2. **`SCATTER_PUZZLE`** 是游戏计时的起点，同时初始化 `gameStats`；任何改动都会影响计分系统，必须先运行影响分析。
3. **`executeGameCompletion`** 有幂等锁（`isGameComplete` 检查），禁止绕过。
4. **分数实时计算**：`TRACK_ROTATION` / `TRACK_HINT_USAGE` 每次 dispatch 都会调用 `calculateLiveScore`，避免在此路径上引入昂贵运算。
5. **`angleDisplayMode`**：由 `cutCount` 自动决定（≤3 刀为 `"always"`，否则 `"conditional"`），不要手动覆盖。
6. **`RESET_GAME`** 会保留 `canvasSize` 和 `baseCanvasSize`（避免布局抖动），这是有意设计，不要改成完整重置。

### 5.4 高风险文件（修改前必须运行影响分析）

| 文件 | 风险原因 |
|------|---------|
| `contexts/GameContext.tsx` | 全局状态机，所有组件依赖，牵一发动全身 |
| `hooks/usePuzzleInteractions.ts` | 核心触控/鼠标交互（~1000 行），已深度打磨 |
| `hooks/useMobileEnhancements.ts` | 移动端多指手势、震动、磁吸逻辑 |
| `utils/rendering/CanvasAdapter.ts` | Canvas 尺寸自适应，影响所有设备布局 |
| `constants/canvasAdaptation.ts` | 画布适配核心常量，改动影响全平台渲染 |
| `packages/game-core/src/utils/score/ScoreCalculator.ts` | 计分公式，牵连排行榜数据一致性 |
| `packages/game-core/src/types/puzzleTypes.ts` | 所有共享类型的唯一来源 |

> **如何判断是否高风险：** 任何修改会影响多个组件或跨越架构边界的文件，都视为高风险。

### 5.5 移动端适配（极致要求）

本项目对移动端体验有最高优先级：

- 修改任何布局 / 尺寸相关代码时，必须同时考虑 **竖屏 + 横屏 + 刘海屏**。
- 浏览器兼容目标：**Chrome / Safari / 微信内置浏览器**的"极致置顶对齐 + 底部安全区岛屿防御"架构。
- 不要轻率修改 `usePuzzleInteractions.ts`（多指手势、磁吸吸附）和 `useMobileEnhancements.ts`（震动、音效反馈）——这些已经过大量真机调试。
- 设备类型由 `getDeviceType()` 统一判断，返回 `"desktop" | "mobile-portrait" | "mobile-landscape" | "ipad"`，不要在组件层重复实现。
- Safari 下 iPhone 刘海屏的左右不对称问题已被专门处理，不要引入影响该修复的 CSS 改动。

### 5.6 性能红线

- Canvas 渲染必须维持 **60FPS**，百级碎片量下不得掉帧（OffscreenCanvas AOT Cache 保障）。
- 排行榜等列表使用 `useMemo` 做去重排序，禁止在渲染路径引入 O(n²) 操作。
- 禁止在主线程引入任何同步阻塞计算（几何算法放 `game-core`，考虑 Web Worker 隔离）。
- 实时计分路径（`TRACK_ROTATION` → `calculateLiveScore`）必须保持毫秒级响应。

### 5.7 常见陷阱（已踩过的坑）

- **不要用 find-and-replace 重命名类型**：`puzzleTypes.ts` 中的类型被 `game-core` 和主应用同时使用，使用 `gitnexus_rename`（可用时）或手动追踪所有引用。
- **`CutType` 枚举**必须从 `@generative-puzzle/game-core` 导入，不要在业务层重新定义。
- **`calculateFinalScore` vs `calculateLiveScore`**：前者在游戏结束时一次性调用（参数包含完整 `GameStats`），后者在游戏中实时调用；两者参数不兼容，不要混用。
- **i18n 文本**：新增任何面向用户的字符串，必须同时在 `src/i18n/locales/zh.ts` 和 `en.ts` 中添加对应键，否则会有语言切换时的空白。
- **Radix UI 组件**：Shadcn UI 已封装 Radix 原语，直接从 `@/components/ui/` 导入，不要绕过 Shadcn 直接使用 Radix 原始组件（破坏主题系统）。
- **`motion` 包**：这是 Framer Motion v12 的新包名，从 `motion/react` 导入，不要使用旧的 `framer-motion`。

### 5.8 常用开发命令

```bash
# 日常开发
npm run dev         # 启动本地开发服务器
npm run build       # 生产构建（类型检查 + 编译，修改后必须通过）
npm run lint        # ESLint 检查（修改后必须通过）

# GitNexus 代码智能（需已配置 MCP，见第 6 节）
npx gitnexus analyze                   # 刷新索引（代码有大量变更后运行）
npx gitnexus analyze --skip-agents-md  # 刷新索引但保留 CLAUDE.md 自定义内容
npx gitnexus status                    # 查看当前索引状态
```

---

## 6. GitNexus — 代码智能

本项目由 GitNexus 索引为 **generative-puzzle**（4997 symbols，8169 relationships，300 execution flows）。GitNexus 通过 MCP 协议为 AI 提供完整的代码调用图、影响范围分析和执行流追踪。

### 6.1 环境检查（每次会话开始时）

在执行任何涉及高风险文件的任务前，先确认 GitNexus 可用状态：

```
可用状态 A（完整模式）：gitnexus MCP 工具已连接 → 按 6.2 节完整流程执行
可用状态 B（降级模式）：gitnexus MCP 不可用   → 按 6.3 节手动分析流程执行
```

**如果任何 GitNexus 工具警告索引已过时**，先在终端运行 `npx gitnexus analyze`。

### 6.2 完整模式：GitNexus 可用时

**编辑任何符号之前必须运行影响分析：**

```
修改函数/类/方法前 → gitnexus_impact({target: "symbolName", direction: "upstream"})
                   → 向用户报告：直接调用者、受影响的执行流、风险级别
提交前            → gitnexus_detect_changes() 验证变更只影响了预期符号
重命名符号时       → 使用 gitnexus_rename，禁止 find-and-replace
探索陌生代码时     → gitnexus_query({query: "concept"}) 而非 grep
需要完整上下文时   → gitnexus_context({name: "symbolName"})
```

**风险级别处理：**

| 风险级别 | 处理方式 |
|---------|---------|
| LOW | 可直接继续，简要说明影响范围 |
| MEDIUM | 向用户说明影响范围后继续 |
| HIGH / CRITICAL | **必须警告用户**，等待确认后才能继续编辑 |

**绝对不做（完整模式下）：**
- 绝不在未先运行 `gitnexus_impact` 的情况下编辑高风险文件中的函数、类或方法。
- 绝不忽略 HIGH / CRITICAL 风险警告。
- 绝不用 find-and-replace 重命名符号——使用 `gitnexus_rename`。
- 绝不在未运行 `gitnexus_detect_changes()` 的情况下提交变更。

### 6.3 降级模式：GitNexus 不可用时

GitNexus 不可用时**不要停止工作**，但要执行手动等效流程：

1. **影响分析替代方案**：在修改高风险文件前，先阅读完整文件，然后在项目中搜索目标符号的所有引用（`grep -r "symbolName" --include="*.ts" --include="*.tsx"`），向用户报告找到的调用方和潜在影响范围。
2. **明确告知用户**：「GitNexus 当前不可用，已通过手动搜索评估影响范围：[列出发现的引用]。建议在运行 `npx gitnexus analyze` 配置 MCP 后，可获得更精确的影响分析。」
3. **提交前**：手动运行 `npm run build && npm run lint`，确认无类型错误和 lint 报错，作为变更安全性的基本验证。

> 降级模式下，对高风险文件（第 5.4 节）的修改应格外谨慎，建议拆分成更小的原子变更。

### 6.4 GitNexus 资源索引

| 资源 | 用途 |
|------|------|
| `gitnexus://repo/generative-puzzle/context` | 代码库概览，检查索引新鲜度 |
| `gitnexus://repo/generative-puzzle/clusters` | 所有功能域 |
| `gitnexus://repo/generative-puzzle/processes` | 所有执行流 |
| `gitnexus://repo/generative-puzzle/process/{name}` | 逐步执行追踪 |

### 6.5 Agent Skills 路径

| 任务 | 阅读此技能文件 |
|------|--------------|
| 理解架构 / "X 怎么工作的？" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| 影响范围 / "改 X 会坏什么？" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| 追踪 bug / "X 为什么失败？" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| 重命名 / 提取 / 拆分 / 重构 | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| 工具、资源、Schema 参考 | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| 索引、状态、清理、Wiki CLI 命令 | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

---

## 7. 效果验证

这些准则正在发挥作用，如果你观察到：

- **更干净的 diff** — 只出现被请求的变更，没有附带"改进"
- **更少的过度工程返工** — 代码第一次就是简洁的
- **澄清问题出现在实现之前** — 而非犯错之后
- **每次修改高风险文件前都有影响分析** — 而非盲目编辑后才发现破坏了下游
- **验证标准可执行** — `npm run build` 通过、浏览器三端均正常

---

*灵感来源: [Andrej Karpathy 的 LLM 编码观察](https://x.com/karpathy/status/2015883857489522876) · [First Principles Thinking — James Clear](https://jamesclear.com/first-principles)*
