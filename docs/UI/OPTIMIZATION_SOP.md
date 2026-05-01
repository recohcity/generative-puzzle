# Generative Puzzle - UI 评审与深度优化标准作业程序 (SOP)

本规范定义了 Generative Puzzle 项目 UI/UX 维护、新功能评审及全局回归的标准作业程序。所有后续开发必须强制执行此 SOP。

---

## 🎯 核心设计原则 (Source of Truth: UI_SPECIFICATION.md)

1.  **极简玻璃拟态统一**：强制执行 `backdrop-blur-xl` + `border-white/30`。
2.  **Design Tokens 绝对引用**：严禁硬编码 HEX/RGB。
3.  **字重与数字美学统一**：数值锁定 `font-medium` (500) + `font-sans` + `tabular-nums`。
4.  **术语一致性 (v1.4.15)**：统一使用“切割 (Cut)”，严禁使用“次数”。

---

## 📋 标准化执行流 (Step-by-Step Workflow)

### 第一步：视觉审计与 Token 对准 (Visual Audit)
*   **术语审计**：`grep "次数" <file_path>` (除历史归档外需清理)。
*   **数值审计**：检查 `font-bold` 或 `text-white` (数值位严禁纯白或加粗)。
*   **I18n 审计**：确保所有文案通过 `t()` 函数调用。

### 第二步：跨端响应式与大字体防御 (Responsive & textZoom)
*   **等宽对齐审计 (v1.4.15)**：确保“难度卡片/切割按钮”与顶部 Tab 组物理长度一致。
*   **垂直间距审计**：画布与面板 `gap` 锁定为 **`2px`**。
*   **高度稳定性**：Tab 面板三个状态（控制/结算/榜单）高度必须像素级对齐。
*   **大字体防御**：标题 SVG 化，动态数据挂载 `.text-zoom-lock`。

### 第三步：性能与合成层优化 (Performance)
*   **动画选型**：强制使用 `transform`。
*   **事件审计**：检查 `onWheel/onTouchStart` 的 Passive 隐患。
*   **震动审计**：必须通过 `haptics.ts` 调用。

### 第四步：全局回归检查 (Regression Gate)
*   **全屏防御审计 (v1.4.15)**：检查 `GlobalUtilityButtons` 引用 `supportsFullscreen` 的逻辑，严禁移动端启用全屏。
*   **三端视图验证**：Portrait / Landscape / Desktop。
*   **数据链路对齐**：核对 `Database.ts` 定义。

### 第五步：主流移动浏览器极速适配审计 (Browser Adaptation)
*   **指纹审计**：确保 `calculateMobile*CanvasSize` 接收并处理 `browserInfo` (Safari/Chrome/WeChat)。
*   **垂直回收审计**：检查非微信环境下 `paddingTop` 是否为 **`0`**，且根容器是否包含 `no-scroll-container` 和 `justify-start`。
*   **横屏对称审计**：确保微信横屏下，Canvas 与 Panel 的包装层均显式设为 `items-start` 或 `flex-start`。
*   **底部防御审计**：验证 `panelBottomPadding` 是否正确传导至 `panel-container` 的 `paddingBottom` 样式。

---

## 🔍 UI 回归评审清单矩阵 (Regression Review Matrix)

| 评审维度 | 检查项 | 核心组件 |
| :--- | :--- | :--- |
| **品牌化** | Peach (#FFD5AB) / Amber (#FFB17A) | `LoadingScreen.tsx`, `globals.css` |
| **数值规范** | font-medium / font-sans / tabular-nums | `MobileScoreLayout.tsx`, `GameTimer.tsx` |
| **仪表盘化** | Zone 1/2/3 三区架构 | `DesktopScoreLayout.tsx`, `RecentGameDetails.tsx` |
| **等宽对齐** | 卡片、按钮与 Tab 组长度对齐 | `PhoneTabPanel.tsx`, `PuzzleControlsCutCount.tsx` |
| **全屏探测** | 微信/iOS 隐藏按钮 | `GlobalUtilityButtons.tsx`, `useDeviceDetection.ts` |
| **感官反馈** | Android 震动 / iOS 音效补偿 | `haptics.ts`, `soundEffects.ts` |
| **防御装甲** | SVG 标题 / .text-zoom-lock | `FontScaleLock.tsx`, `PhoneTabPanel.tsx` |

---

## 🚀 历史审计资产 (Historical Archives)

本项目早期的审计报告及计划已归档至以下目录：
*   **[审计报告目录](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/audit-reports/)**
*   **[执行计划与清单](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/checklists-plans/)**
*   **[历史规范与指南](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/legacy-specs/)**

---
*上次修订：2026-05-01 (SOP v3.2 - 结构重组版)*
*文档状态：**Official Standard***
