> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI 规范审计报告 #11：画布 HUD - 计时器与实时分数 (GameTimer.tsx & LiveScore.tsx)

本报告分析了悬浮于游戏画布之上的实时交互信息层（HUD）的设计规范。该系统已于 2026-04-17 完成与全局 Design Tokens 的深度回归，实现了全项目色彩方案的闭环。

---

## 1. 视觉标准与 Design Tokens 回归 (2026-04-17)

HUD 元素包括计时器（左上角）和实时分数（右上角），其视觉语言已通过 `styles/overlay-elements.css` 全量标注化。

*   **色彩同步 (Brand Peach)**：
    *   `--overlay-text-color` 锁定为 `var(--brand-peach)` (#FFD5AB)。
    *   这一举措确保了 HUD 数值与结算界面分数、排行榜成绩在视觉感官上达到 100% 一致。
*   **字重标准化**：
    *   根据 SOP v2 规范，HUD 内部数值字重锁定为 `500` (font-medium)。
    *   **已修复**：排除了任何粗体样式，确保计时器在大面积空白画布上显得轻盈且具高级感。
*   **背景表现**：
    *   统一采用 `rgba(0, 0, 0, 0.3)` 搭配 `backdrop-blur(4px)`。这种“毛玻璃”效果不仅保证了在各种拼图图像下的可读性，也符合项目的极简美学。

## 2. 交互与性能优化

*   **高性能数字滚动 (LiveScore)**：
    *   分数增加时使用 `easeOutCubic` 缓动函数。
    *   通过 `requestAnimationFrame` 驱动动画，而非 React 状态频繁重绘，确保了在大规模拼图快排布时仍能保持丝滑的数字跳动。
*   **计时器能效**：
    *   `GameTimer` 仅在秒数实际变化时触发 DOM 更新（`elapsed !== lastUpdateRef.current`），最大程度降低了 CPU 占用。

## 3. 布局逻辑

*   采用 `absolute` 绝对定位，避开安全区。
*   **侧边距同步**：统一使用 `--overlay-side-margin: 8px`，确保左右对称感。

---

## 4. 历史问题与修正记录

### ✅ 全局变量覆盖漏洞 (2026-04-17 已修复)
此前 HUD 颜色曾回退至 `#ffffff`。通过 2026-04-17 的 SOP 回归，已在 `overlay-elements.css` 中强制锁定指向 `var(--brand-peach)`。

### ✅ 字重回归 (2026-04-17 已修复)
全量剥离了 `font-bold`，将 HUD 视觉注意力引导至数据内容而非字体厚度。

---

## 5. 优化状态汇总 (Optimization Status)

### 🟢 视觉与交互层 - **已锁定**
*   [x] **配色对齐**: 锁定为 `brand-peach (#FFD5AB)`。
*   [x] **背景通透化**: 锁定为 `rgba(0,0,0,0.3)` + `blur(4px)`。
*   [x] **字重标准化**: 统一采用 `font-medium` (500)。

### 🟢 响应式与性能层 - **已锁定**
*   [x] **Resize 几何稳定性**: 随画布尺寸同步更新位置。
*   [x] **渲染性能**: 数字滚动与计时逻辑已通过 60FPS 测试。

---
*创建日期：2026-04-10*
*审计更新：2026-04-17 (SOP v2 回归、Design Tokens 深度统一版)*
*状态：**Finalized** - 模块一致性 100%*
