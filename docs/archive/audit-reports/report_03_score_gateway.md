> [!CAUTION]
> **历史归档背景 (Historical Archive)**
> 本文档记录了 2026-04-17 UI 专项优化期间的审计细节与执行过程。
> **当前最新 UI/UX 标准请参考核心手册：[UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md)**

# UI 规范审计报告 #03：得分面板路由网关 (ScoreDisplay.tsx)

本报告分析了结算界面的路由分发逻辑以及模态框渲染策略。

---

## 1. 核心定位

`ScoreDisplay.tsx` 是项目游戏结算界面的入口网关。它不直接承担具体的计分渲染工作，而是作为决策层，根据当前设备状态和游戏状态将任务分发给具体的子组件。

## 2. 关键实现细节

*   **设备级路由分流**：
    *   通过 `useDeviceDetection` 的 `deviceType` 属性进行判断。
    *   **Phone (手机)**：挂载 `MobileScoreLayout`。
    *   **Desktop/Tablet (电脑/平板)**：统一挂载 `DesktopScoreLayout`。
*   **渲染模式选择 (Embedded vs Modal)**：
    *   **嵌入模式 (Embedded = true)**：直接将得分板注入当前 DOM 流中。在桌面端，这通常表现为控制面板区域无缝切换为得分板。
    *   **模态框模式 (Modal)**：在非嵌入状态下，渲染一个全屏覆盖的遮罩层（`fixed inset-0 bg-black/50 z-50`），并遵循标准的 Web Accessibility 规范（`role="dialog"`, `aria-modal="true"`）。
*   **渲染卫标逻辑**：
    *   只有在游戏状态标记为已完成 (`state.isCompleted`) 且具备有效的统计数据 (`state.gameStats`) 时才会进行渲染。
    *   如果不符合条件，组件静默返回 `null`，防止在游戏过程中意外跳出空面板。

---

## 3. 子组件架构说明

*   **`DesktopScoreLayout.tsx`**：承接桌面端与 iPad 的结算渲染，支持嵌入模式（侧边面板内无缝切换）与模态框模式（全屏覆盖层）两种展示形态，已全面使用 `brand-*` Design Tokens 及 `text-premium-*` 语义化标签。
*   **`MobileScoreLayout.tsx`**：承接手机端的结算渲染，支持竖屏与横屏（`isLandscape`）两种超紧凑布局模式，横屏下极限压缩行高与间距，确保全部信息一屏展示无需滚动。

---

## 4. 历史问题与修正记录

### ✅ 原 ⚠️ 过度分色处理（已澄清为误报）
报告初稿认为"对折叠屏可能误判为手机"。经代码复核，`ScoreDisplay.tsx` 中使用的 `deviceType === 'phone'` 逻辑直接读取 `useDeviceDetection` 的权威输出，而该 hook 已通过 `DeviceLayoutManager` 完成了对所有平板设备的正确归类（`tablet` / `desktop`）。因此，在通常条件下不存在误判风险，原问题属于文档描述与实际実装不同步的误报，**已标注为已澄清**。

### ✅ 原 🔄 状态同步延迟（接受为已知限制）
该延迟属于游戏状态机 (`GameContext`) 级别的正常行为，结算面板弹出依赖 `isCompleted` 是语义上最精确的触发时机，无需在网关层加入额外的"结算中..."状态，原建议属于超前优化，**标注为已接受的产品限制**。

### ✅ MobileScoreLayout 色彩规范迁移（2026-04-15 已修复）
`MobileScoreLayout.tsx` 全文存在大量硬编码 Hex 色值（`#FFD5AB`、`#F68E5F`、`#232035`、`#FF8A80`），违反了全局 Design Tokens 规范。已将所有实例迁移至 `brand-peach`、`brand-orange`、`brand-dark`、`red-400` 语义化 Token，实现与 `DesktopScoreLayout` 100% 的色彩体系一致性。

### ✅ 分数色全局统一回归（2026-04-17 回归追加）
根据 SOP 第五步回归检查，本次确认以下变更已正确传导至网关下游组件：
*   **分数色锁定**：`MobileScoreLayout` 和 `DesktopScoreLayout` 中，所有分数/数值场景已统一为 `brand-peach (#FFD5AB)`，`brand-orange` 仅保留于装饰性渐变按钮。
*   **卡片背景去除**：两端成绩卡片从 `bg-white/[0.02] backdrop-blur-md` 改为 `bg-transparent`，仅保留边框。
*   **字重标准化**：分数/标题从 `font-black` / `font-bold` 统一降级为 `font-medium`。
*   **页眉图标统一**：移动端 Emoji 奖杯 `🏆` 已替换为 Lucide `Trophy` 图标（`#FFD5AB`，无透明度），与桌面端保持一致。
*   **横竖屏字号对齐**：移动端横屏下的标题字号从 `text-[9px]` 恢复至与竖屏一致的 `text-[11px]`。

---

## 5. 优化状态汇总 (Optimization Status)

### 🟢 视觉与交互层 - **已锁定**
*   [x] **Design Tokens 全量迁移**: `MobileScoreLayout.tsx` 中所有硬编码 Hex 色值已全部替换为 `brand-*` 语义化 Token，与桌面端色彩系统完全统一。
*   [x] **架构分层清晰**: 网关层（ScoreDisplay）、布局层（Desktop/MobileScoreLayout）职责分离，无跨层耦合。
*   [x] **无障碍合规**: 模态模式已正确应用 `role="dialog"` 与 `aria-modal` 属性。
*   [x] **分数色全局统一（2026-04-17 回归确认）**: 下游全部组件已锁定 `brand-peach (#FFD5AB)` 为唯一分数色。

### 🟢 响应式与性能层 - **已锁定**
*   [x] **设备分流精准**: `phone` / `tablet+desktop` 二元路由依赖 `useDeviceDetection` 权威输出，无误判风险。
*   [x] **移动端极限适配**: `MobileScoreLayout` 的横屏超紧凑模式保证关键信息在任意手机横屏尺寸下完整一屏展示。
*   [x] **渲染卫标安全**: `isCompleted && gameStats` 双重守卫防止空数据渲染，无闪烁风险。
*   [x] **横竖屏字号统一（2026-04-17 回归确认）**: 横屏标题字号已与竖屏对齐为 `text-[11px]`。

---
*创建日期：2026-04-10*
*审计更新：2026-04-17 (Design Tokens 全局统一回归、分数色锁定 `#FFD5AB`)*
*状态：**Finalized** - 得分网关模块一致性 100%*

