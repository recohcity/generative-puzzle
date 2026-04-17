> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI 规范审计报告 #04：桌面端计分卡片 (DesktopScoreLayout.tsx)

本报告分析了针对大屏幕设备的得分明细渲染逻辑及视觉呈现标准。该组件已根据 v1.3.83 规范完成深度重构，并于 2026-04-17 完成 Design Tokens 全局统一回归。

---

## 1. 核心定位

`DesktopScoreLayout.tsx` 专门用于桌面端及平板电脑。它具备极高的适应性，既能作为侧边栏面板的嵌入内容，也能作为独立的全屏模态框展示。

## 2. 视觉与排版规范

*   **字号层级与等宽对齐**：
    *   **主标题与数值**：统一使用 `brand-peach (#FFD5AB)` 作为唯一指定分数色。
    *   **字重统一**：分数数值使用 `font-medium`（500），**禁止使用 `font-bold` / `font-black`**，保持轻量高级感。
    *   **等宽字符 (Tabular Nums)**：分数区和明细表数值区域强制开启 `tabular-nums`。确保数字在动态增长或垂直排列时不会因字符宽度差异产生视觉抖动。
*   **语义化分色**：
    *   **正向得分**：统一使用 `brand-peach (#FFD5AB)`。 ~~（已废弃：`brand-orange` 不再用于分数场景）~~
    *   **负向惩罚**：对于"旋转得分"或"提示得分"中的负数，使用 `#FF8A80` 柔和警告红。
*   **卡片样式**：
    *   根据 2026-04-17 最新规范，内容框采用**纯透明背景 + 边框**方案：`bg-transparent border border-white/10 rounded-2xl`。
    *   **已废弃**：`bg-white/30 backdrop-blur-xl` 的玻璃态背景已移除，仅保留边框线以实现更加通透、极简的视觉效果。

## 3. 内容结构

*   **页眉区域 (Header Row)**：
    *   标题「本局成绩」与总得分**并排一行**显示，使用 Lucide `Trophy` 图标（`#FFD5AB`，无透明度）。
    *   总得分使用 `text-xl font-medium tabular-nums`。
    *   如果是新纪录，显示 `NEW` 徽章（`bg-[#FFD5AB]/20 text-[#FFD5AB]`）。
*   **计算明细表 (Breakdown Table)**：
    *   包含"基础分"、"速度加成"、"旋转得分项"及"提示扣分项"。
    *   各行间无分割线，通过 `space-y-1.5` 间距自然划分。
    *   小计和难度系数区域通过一条极细的分隔线（`h-px bg-white/10 opacity-15`）与明细行分隔。
*   **最终得分 (Footer Row)**：
    *   使用 `text-lg font-medium`，与页眉区的总得分保持一致的视觉层级，不做特殊放大。

---

## 4. 历史问题与修正记录

### ✅ 视觉规范对齐（2026-04-15 已修复）
原报告中提到的内联 Hex 值已全部迁移至语义化 Token。

### ✅ 阴影彻底剥离（2026-04-15 已修复）
彻底移除了所有卡片容器的外部阴影，视觉上更加高级且无冗余。

### ✅ 分数色统一为 brand-peach（2026-04-17 已修复）
原使用 `brand-orange (#F68E5F)` 显示分数数值的做法已废弃。全局统一为 `brand-peach (#FFD5AB)` 作为唯一指定分数色，与用户名色一致。

### ✅ 卡片背景去除（2026-04-17 已修复）
移除了 `bg-white/[0.02] backdrop-blur-md` 的透明背景效果，仅保留 `border border-white/10` 边框，实现更加通透的极简风格。

### ✅ 字重去加粗（2026-04-17 已修复）
所有分数数值和标题从 `font-black` / `font-bold` 降级为 `font-medium`，保持与全局设计系统的轻量高级感一致。

### ✅ 标题/图标去透明度（2026-04-17 已修复）
「本局成绩」标题和 Trophy 图标移除了 `opacity-40` / `text-white/40` 的淡化处理，现在使用清晰的 `text-white/90` 和全不透明图标色。

---

## 5. 优化状态汇总 (Optimization Status)

### 🟢 视觉与交互层 - **已锁定**
*   [x] **分数色全局统一**: 全面弃用 `brand-orange` 用于分数场景，统一为 `brand-peach (#FFD5AB)`。
*   [x] **卡片纯透明化**: 已移除背景色和模糊效果，仅保留边框（`border border-white/10`）。
*   [x] **字重标准化**: 分数/标题统一使用 `font-medium`，禁止 `font-bold` / `font-black`。
*   [x] **Design Tokens 闭环**: 全部色值已对齐 `report_01` 快速查阅表。
*   [x] **无影化处理**: 已确认剥离所有 `shadow-*` 类名。

### 🟢 响应式与性能层 - **已锁定**
*   [x] **嵌入/模态支持**: 组件在嵌入 (side panel) 和模态框 (overlay) 两种模式下均能自适应宽度，排版稳定。
*   [x] **内容防溢出**: 通过 `overflow-hidden`、`truncate` 和紧凑 `padding` 防止侧边栏窄宽度下数值溢出边框。

---
*创建日期：2026-04-10*
*审计更新：2026-04-17 (Design Tokens 全局统一回归、卡片透明化、字重标准化)*
*状态：**Finalized** - 模块一致性 100%*
