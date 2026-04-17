> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI 规范审计报告 #01：全局样式底座 (Global Style Foundation)

本报告详细记录了 Generative Puzzle 项目的核心样式基础设施，重点分析 `globals.css` 和 `tailwind.config.ts` 的实现逻辑。基于 2026-04-14 的专项优化，目前项目已全面转向 **基于 Design Tokens 的语义化样式体系**。

---

## 1. 颜色与主题系统 (Theme & Colors)

项目采用了一套完整的“玻璃拟态 (Glassmorphism)”设计语言，并建立了高兼容性的 Token 桥接层。

### 1.1 Design Tokens 架构 (tailwind.config.ts)
*   **解耦实现**：采用 `rgba(var(--token-rgb), <alpha-value>)` 注入模式。
*   **优势**：这种架构完美解决了 CSS 变量无法直接使用 Tailwind `/opacity` 修饰符的问题。现在可以在代码中自由使用 `text-brand-orange/50` 或 `bg-brand-peach/10`，而无需手动编写 `rgba()`。
*   **语义层级**：
    *   `brand-orange`: 核心交互色，用于激活态、进度条及高亮按钮。
    *   `brand-peach`: 主要文字色、HUD 覆盖层及渐变起点。
    *   `brand-amber`: 焦点高亮及辅助加粗标题。
    *   `brand-deep`/`brand-dark`: 系统级背景与对比文本容器。

### 1.2 玻璃拟态组件 (globals.css)
*   **纯粹透明态**: 移除了主面板容器的硬阴影（`shadow-2xl`），推出版面级别的“无边界/无阴影”视觉规范。利用统一的 `bg-white/30 backdrop-blur-xl border-2 border-white/30`，实现高度贴合的扁平玻璃态质感，完全规避了在小可视区域下的阴影边缘暴力裁切问题。
*   `.glass-panel`: 全局基础面板。使用 `backdrop-blur-xl` 并通过内发光（`inset 0 0 20px`）模拟物理质感。
*   `.glass-card`: 轻量级容器，降低了模糊度以保留更高的背景透视感。
*   **按钮系统**:
    *   `.glass-btn-active`: 采用品牌渐变（`135deg`）并配合 `glass-btn-sheen` 实现动态扫光。
    *   `.glass-btn-active-soft`: 使用 `brand-orange/20` 实现低饱和度的光效反馈。

## 2. 交互防护与作用域控制 (Interaction & Scoping)

为解决全局禁用对通用 UI 组件（Toast, Dialog）的干扰，项目实施了精准的作用域划分。

*   **交互域收紧 (`.game-root`)**: 
    *   原有的 `* { user-select: none }` 已被废弃。
    *   现在通过 `.game-root` 仅对拼图核心区域进行手势和文本选择限制，确保非游戏业务逻辑（如表单输入、提示弹窗）的文字可选中性。
*   **iOS 专项防御**:
    *   **防自动缩放**: 强制移动端输入框 `16px` 字体（iOS 16-18 兼容）。
    *   **橡皮筋阻断**: `.no-scroll-container` 正确应用在 `app/page.tsx` 根容器，结合 `overscroll-behavior: none` 和针对 Safari 的 `fixed` 定位加固。

## 3. 跨平台排版工程 (Typography & Platform)

### 3.1 字体栈串联 (Unified Font Stack)
*   **技术路径**: 通过 Next.js Font Variable 注入 `Inter`（拉丁语系），并在 `globals.css` 中将其作为 `var(--font-inter)` 整合进中文字体回退链。
*   **回退链设计**: `[Inter, Segoe UI, PingFang SC, Microsoft YaHei, Arial, sans-serif]`。
*   **渲染优化**: 全局强制开启 `antialiased`，并解决了不同平台（Windows/Android 渲染引擎）因默认行高不同导致的排版抖动。

### 3.2 无障碍合规 (A11y)
*   **焦点回归**: 彻底废弃了暴力禁用 `outline` 的历史遗留代码。
*   **语义化高亮**: 实现了基于 `brand-amber` 的统一 `:focus-visible` 方案，具有 2px 偏移量，满足 WCAG 2.1 关于键盘焦点可见性的合规要求。

---

## 4. 优化状态汇总 (Optimization Status)

### 🟢 核心基础设施 - **已锁定**
*   [x] **Design Tokens**: 已支持 Tailwind Opacity 修饰符。
*   [x] **RGB 变量层**: 为 Alpha 混合提供了底层硬件加速色彩支持。
*   [x] **根作用域管理**: 已完成 `.game-root` 的挂载与逻辑划分。

### 🟢 平台兼容性 - **已修复**
*   [x] **Safari Sticky Hack**: 已移除，回归标准布局逻辑。
*   [x] **橡皮筋效应**: 已在主入口通过 `.no-scroll-container` 阻断。
*   [x] **废弃 CSS 清理**: `-webkit-overflow-scrolling` 已清理。

### 🟢 组件迁移 - **已完成**
*   [x] **核心业务组件**: `VirtualAuthWidget`, `DesktopScoreLayout` 已完成迁移。
*   [x] **边缘页面**: 历史测试页（/test）等冗余资产已在此优化阶段被彻底清理，保持了项目的纯洁度。

---

## 5. Design Tokens 快速查阅表 (Quick Reference)

### 5.1 核心色彩 Token

| 变量 ID | HEX | RGB | Tailwind 类名 | 使用场景 |
| :--- | :--- | :--- | :--- | :--- |
| `brand-orange` | `#F68E5F` | `246, 142, 95` | `bg-brand-orange/20` | **仅限装饰性渐变**（登录按钮、语言切换器渐变终点）。**禁止用于分数/数值显示。** |
| `brand-peach` | `#FFD5AB` | `255, 213, 171` | `text-brand-peach`, `border-brand-peach/50` | **全局统一分数色、用户名色、计分板数值**。当前为 UI 主色调。 |
| `brand-amber` | `#FFB17A` | `255, 177, 122` | `text-brand-amber` | 游戏标题、工具按钮图标、语言切换器文字。 |
| `brand-deep` | `#1E1A2A` | `30, 26, 42` | `bg-brand-deep` | 系统级深色背景。 |
| `brand-dark` | `#232035` | `35, 32, 53` | `text-brand-dark` | 对比文本容器、激活态按钮文字底色。 |

### 5.2 组件级直写色值（已审计）

| HEX | 使用位置 | 状态 | 备注 |
| :--- | :--- | :--- | :--- |
| `#FFD5AB` | `DesktopScoreLayout`, `MobileScoreLayout`, `GameRecordDetails`, `LeaderboardPanel`, `IdentityChip`, `RestartButton` | 🟢 已统一 | 分数/数值/图标的唯一指定色 |
| `#FF8A80` | 所有 ScoreLayout 组件 | 🟢 合规 | 仅用于扣分项（负值标红） |
| `#F68E5F` | `SupabaseAuthWidget`, `LeaderboardButton`, `LanguageSwitcher` | ⚠️ 合规（限定场景） | 仅允许出现在渐变装饰中 |

### 5.3 字重规范

| 场景 | 规范字重 | Tailwind 类 | 备注 |
| :--- | :--- | :--- | :--- |
| 分数/数值 | Medium (500) | `font-medium` | **禁止 `font-bold` / `font-black`** |
| 标题/页眉 | Medium (500) | `font-medium` | 与分数统一，保持轻量高级感 |
| 按钮文字 | Bold (700) | `font-bold` | 仅在交互按钮中使用 |

---

## 6. 回归审计日志 (Regression Audit Log)

> 每次 UI 修改后，在此追加一条记录，作为变更追溯的永久凭证。

| 日期 | 变更摘要 | 影响 Token | 同步更新组件 | 回归结果 |
| :--- | :--- | :--- | :--- | :--- |
| 2026-04-17 | 全局分数色统一为 `#FFD5AB`（米金色），移除分数场景中的 `#F68E5F`；去除成绩卡背景色（仅留边框）；移除标题/图标透明度；竖横屏字号统一 | `brand-peach` 升格为主色调 | `DesktopScoreLayout`, `MobileScoreLayout`, `GameRecordDetails`, `LeaderboardPanel`, `LeaderboardItemStyles`, `RestartButton`, `IdentityChip`, `DesktopLayout` | 桌面/竖屏/横屏 三端已验证 |

---
*创建日期：2026-04-10*
*审计更新：2026-04-17 (Design Tokens 全局统一 & 分数色锁定 `#FFD5AB`)*
*状态：**Finalized** - 核心底座一致性 100%*

