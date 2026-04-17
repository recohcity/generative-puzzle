> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI 规范审计报告 #07：游戏控制按钮组规范 (Game Controls & Interactive Elements)

本报告分析了形态选择、切割难度、操作按钮组等核心交互组件的视觉标准。该系统已于 2026-04-17 完成与全局 Design Tokens 的深度回归。

---

## 1. 统一设计语言：状态驱动 UI

所有核心交互按钮（Shape, CutType, CutCount, Scatter, Action）均遵循一套严密的 CSS 状态规则：

| 状态 | 视觉特征 | CSS 类 & 属性 |
| :--- | :--- | :--- |
| **已选中/激活** | 渐变背景 (Peach-Orange) + 深色文字 | `.glass-btn-active` |
| **未选中/默认** | 半透明磨砂底 + 浅色文字 | `.glass-btn-inactive` |
| **禁用态** | 30% 透明度 + 拦截交互 | `opacity-30 pointer-events-none` |
| **悬浮反馈** | 线性高光扫过动画 | `.glass-btn-sheen` |

## 2. 关键组件分析与 Design Tokens 回归 (2026-04-17)

*   **字重标准化 (Weight Normalization)**：
    *   根据 SOP 2026-04-17 规范，所有控制按钮的标签统一修正为 `font-bold` (700)。
    *   **已修复**：`PuzzleControlsCutCount.tsx` 中原有的 `font-black` (900) 已全量降级，确保系统排版层级的轻量化与一致性。
*   **颜色语义化**：
    *   控制面板中的提示信息（如 "请选择切割类型"）统一使用 `brand-peach (#FFD5AB)`。
    *   激活态颜色对齐全局 Primary 渐变。
*   **动态缩放逻辑锁定**：
    *   核心算法：`borderRadius: calc(var(--panel-scale, 1) * 14px)`。
    *   **已修复**：`PuzzleControlsScatter.tsx` 中原有的硬编码 `14px` 圓角已迁移至动态缩放公式，解决了桌面端面板非 1.0 比例下的视觉突兀感。

## 3. 布局规范

*   **形态与切割类型**：采用 `grid-template-columns` 均发布局，配合 `gap: calc(var(--panel-scale, 1) * 8px)` 实现响应式间距。
*   **切割数量 (1–8)**：采用正圆形按钮。选中时触发 `scale-110` 微反馈。

---

## 4. 历史问题与修正记录

### ✅ 圆角一致性 (2026-04-17 已修复)
完成了 `PuzzleControlsScatter` 的动态圆角改造，确保全系统交互组件具备统一的几何缩放特征。

### ✅ 字重回归 (2026-04-17 已修复)
清除了控制面板中残留的 `font-black` 样式，统一回落至 `font-bold`。

### ✅ 颜色 fallback 建议 (已接受)
已在 `globals.css` 中为 `.glass-btn-active` 增加了底层的固体色 fallback 环境，提升了兼容性。

---

## 5. 优化状态汇总 (Optimization Status)

### 🟢 视觉与交互层 - **已锁定**
*   [x] **动态缩放全量接入**: 解决了 Scatter 按钮圆角硬编码问题。
*   [x] **按钮字重归一化**: 全量使用 `font-bold`，剥离 `font-black`。
*   [x] **提示色锁定**: 统一采用 `brand-peach (#FFD5AB)`。

### 🟢 响应式与性能层 - **已锁定**
*   [x] **状态切换平滑度**: 依靠 `transition-all duration-500` 与 `animate-in` 实现丝滑的状态切换体验。
*   [x] **交互命中区**: 移动端保持足够的 `touch-target` 高度（min-34px）。

---
*创建日期：2026-04-10*
*审计更新：2026-04-17 (SOP v2 回归、核心圆角与字重标准化版)*
*状态：**Finalized** - 模块一致性 100%*
