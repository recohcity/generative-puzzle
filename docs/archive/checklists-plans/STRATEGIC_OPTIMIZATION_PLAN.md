> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI/UX 战略优化排序方案 (Strategic Optimization Plan)

本方案基于对 Report 1-13 的深度审计，结合现代 Web 性能标准与 React 架构最佳实践，将优化路径拆分为四个阶段。此方案已获得批准，作为后续具体任务拆分执行的指导纲领。

---

## 阶段一：全局一致性与“水合”修复 (Foundation & Consistency)
**重点方向**：建立单一事实来源，消除启动瓶颈。
- **对应报告**：Report 01 (Styles), Report 02 (Layout), Report 13 (SEO/Meta)
- **核心理由**：地基稳固是所有 UI 优化的前提。修复服务器与客户端渲染不一致（Hydration Mismatch）是解决“加载变慢”的关键。
- **关键任务清单**：
    1.  **样式收敛**：清理 `globals.css`，将硬编码颜色、字体转换为 CSS 变量 Token。
    2.  **SEO 动态化**：修正 `layout.tsx` 的硬编码 `lang` 属性及 OpenGraph 元数据。
    3.  **启动性能**：重排根布局逻辑，彻底排查导致页面初次加载时主线程阻塞的逻辑冲突。

## 阶段二：渲染引擎性能优化 (The Core Engine)
**重点方向**：极致流畅度，榨干硬件性能。
- **对应报告**：Report 10 (Canvas Rendering), Report 12 (Loading Optimization)
- **核心理由**：Canvas 是交互中心。通过物理上的静动分离，减少 80% 的不必要重绘，显著提升移动端帧率。
- **关键任务清单**：
    1.  **Canvas 双层落地**：将画布边框（Border）和形状预览（Shape Preview）移至 `backgroundCanvas`。
    2.  **Resize 抖动消除**：优化 `useCanvasResizeObserver`，防止窗口/方向变动时的坐标重复计算。
    3.  **GPU 动画介入**：在确保水合安全的前提下，将 Loading 进度条动画交由 GPU 合成。

## 阶段三：交互逻辑纠错与 HUD 固化 (Logic & Interaction)
**重点方向**：反馈精准化，状态零误差。
- **对应报告**：Report 11 (HUD), Report 03-09 (Specific Panels), Report 13 (Dead Code)
- **核心理由**：修复玩家感知最深的反馈逻辑 Bug（如数值跳动、计时暂停等）。
- **关键任务清单**：
    1.  **分数动画修复**：解决 `LiveScore` 中的闭包捕获陈旧状态问题，确保分数动画连贯。
    2.  **孤儿逻辑清理**：删除 `MobileSmartHints` 等组件中的不可达逻辑（Dead Code）。
    3.  **层叠上下文保护**：利用 `isolation: isolate` 固化 HUD 层级，防止被背景动效非法覆盖。

## 阶段四：结构性解耦与模块重构 (Architecture Refinement)
**重点方向**：代码健康度，利于长期维护。
- **对应报告**：Report 13 (Component Decomposition)
- **核心理由**：将庞然大物拆分为细粒度组件，提升热更新（HMR）速度和单元测试覆盖率。
- **关键任务清单**：
    1.  **VirtualAuthWidget 拆解**：按业务模式（Login/Register/Recover）剥离 JSX 树。
    2.  **Hook 提取**：将复杂的鉴权逻辑从 UI 组件中抽离。

---

## 验收准则
- **阶段性验收**：每个阶段完成后，必须进行 Desktop/Mobile 双端回归测试。
- **性能监控**：优化后的“Time to Interactive” (TTI) 必须优于当前数值。
- **体系保护**：任何优化不得破坏现有的无障碍（A11y）标准。

---
*创建日期：2026-04-11*
*执行状态：已通过战略审核，待按阶段执行*


