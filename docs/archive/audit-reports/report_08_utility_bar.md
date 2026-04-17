> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI 规范审计报告 #08：全局工具按钮栏 (GlobalUtilityButtons.tsx)

本报告分析了全平台通用的“顶栏工具组”设计规范。该系统已于 2026-04-17 完成与全局 Design Tokens 的深度回归，并实现了全量比例自适应。

---

## 1. 核心定位

该组件位于界面顶部右侧（包含语言、排行榜、音乐、全屏切换），是全端（Desktop/Phone/Tablet）最稳定的导航入口。主要由 `GlobalUtilityButtons.tsx` 和 `LanguageSwitcher.tsx` 协同实现。

## 2. 视觉指标与 Design Tokens 回归 (2026-04-17)

*   **唯一色调锁定 (Color Unification)**：
    *   所有工具图标、语言切换器文字统一锁定为 `brand-amber (#FFB17A)`。
    *   **已修复**：清除了 `LanguageSwitcher` 中残留的硬编码样式，确保其与 `GlobalUtilityButtons` 颜色 100% 对其。
*   **状态语义规范**：
    *   **默认态 (Inactive)**：使用 `glass-btn-inactive` (2.5% 文字透明度隔离) + `#FFB17A`。
    *   **激活态 (Active - 排行榜)**：切换至 `.glass-btn-active` (橙金渐变底) + `#232035` (深色文字)，提供清晰的模式反馈。
*   **字重标准化**：
    *   语言切换按钮内部文字统一使用 `font-bold`，在小尺寸下保持清晰刻度感。

## 3. 全量比例自适应 (Responsive Scaling - 2026-04-17 回归)

*   **动态尺寸锁定**：
    *   **已修复**：根据 SOP 2026-04-17 专项优化，所有工具按钮的尺寸已由固定像素（26px）迁移至动态公式：`width: calc(var(--panel-scale, 1) * 26px)`。
    *   这一改进解决了在桌面端高分辨率下，顶部工具栏相对于面板主体缩放比例不一致的视觉失调问题。
*   **代码清理**：
    *   移除了 `GlobalUtilityButtons` 中过时且不再使用的 `buttonSize` 逻辑，代码结构已精简至 100% 现代标准。

---

## 4. 历史问题与修正记录

### ✅ 缩放响应失效 (Fixed Size Risk) (2026-04-17 已修复)
通过全量接入 `var(--panel-scale)`，工具栏现在能与底层面板保持完美的等比例缩放同步。

### ✅ 逻辑与 Prop 冗余 (2026-04-17 已修复)
完成了 `GlobalUtilityButtons` 的重构，剥离了冗余的 `phone-landscape` 逻辑，统一由 CSS变量驱动。

### ✅ 颜色一致性回扫 (2026-04-17 已修复)
确保了 `LanguageSwitcher` 与 `GlobalUtilityButtons` 两大入口共用同一套 `brand-amber` 视觉语言。

---

## 5. 优化状态汇总 (Optimization Status)

### 🟢 视觉与交互层 - **已锁定**
*   [x] **动态缩放全量接入**: 解决了工具栏固定像素导致的比例失调。
*   [x] **配色语义化**: 统一采用 `brand-amber (#FFB17A)`。
*   [x] **图标笔触一致性**: 统一锁定为 `2`。

### 🟢 响应式与性能层 - **已锁定**
*   [x] **多端兼容性**: 在 iOS Safari 与 Android WebView 下均通过了 TapHighlight 透明化测试。
*   [x] **代码冗余度**: 降至最低，移除所有不再支持的 legacy props。

---
*创建日期：2026-04-10*
*审计更新：2026-04-17 (SOP v2 回归、全场景动态缩放版)*
*状态：**Finalized** - 模块一致性 100%*
