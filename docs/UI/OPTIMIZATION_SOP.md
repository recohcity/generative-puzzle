# Generative Puzzle - UI 评审与深度优化标准作业程序 (SOP)

本规范定义了 Generative Puzzle 项目 UI/UX 维护、新功能评审及全局回归的标准作业程序。所有后续开发必须强制执行此 SOP，以确保项目维持高水准的视觉一致性与性能标准。

---

## 🎯 核心设计原则 (Source of Truth: UI_SPECIFICATION.md)

1.  **极简玻璃拟态统一**：强制执行高阶玻璃拟态（`backdrop-blur-xl` + `border-white/30`），严禁使用硬阴影或不通透的实色背景。
2.  **Design Tokens 绝对引用**：严禁在组件内写死任何 HEX/RGB 色值。所有色彩必须引用 [UI_SPECIFICATION.md](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/UI/UI_SPECIFICATION.md) 定义的语义 Token。
3.  **字重标准化回归**：所有数值、姓名、计时等呈现类文本必须锁定为 `font-medium` (500)。

---

## 📋 标准化执行流 (Step-by-Step Workflow)

针对任何 UI 变更或新组件开发，必须严格遵守以下五步走流程：

### 第一步：视觉审计与 Token 对准 (Visual Audit)
*   **正向 Token 校验**: 检查新组件是否使用了 `brand-peach` 或 `brand-amber`。
*   **反向 Grep 审计 (Negative Pattern Check)**：
    - 检查数值粗体：`grep -E "font-bold|font-black" <file_path>` (数值位严禁加粗)
    - 检查硬编码白色：`grep -E "text-white(?!/| )|#ffffff" <file_path>` (数值位严禁纯白)
    - 检查非标背景：`grep "bg-gray" <file_path>`
    - **硬编码文本检查**：除 `t()` 函数外，严禁在 UI 渲染层直接使用中文字符串，确保 I18n 绝对纯洁。

### 第二步：跨端响应式与大字体防御 (Responsive & textZoom Defense)
*   **布局分流**: 必须同时在 `DesktopLayout`, `PhonePortraitLayout`, `PhoneLandscapeLayout` 下验证。
*   **物理适配**: 使用 `panel-scale` 变量进行按钮与边距的等比缩放计算。
*   **交互稳定性**: 移动端 Tab 面板必须采用 **Fixed Height Container**，且提示信息容器必须锁定 `h-[16px]`，确保内容动态显隐时按钮位置不跳动。
*   **大字体灾难防御**：在安卓微信大字体极端场景下，所有核心标题必须强制使用 **SVG `<text>`** 渲染以彻底免疫 `textZoom`；对于图标内文本与动态数据，必须挂载 `.text-zoom-lock` 样式。布局间距严禁使用 `gap-1` 等 `rem` 单位，必须使用 `gap: '4px'` 物理像素。

### 第三步：性能与合成层优化 (Performance)
*   **动画选型**: 涉及位移或缩放的动画必须使用 `transform`，严禁操作 `width/height`。
*   **渲染频率**: 实时刷新组件需评估 React 重绘压力，必要时进行降频处理。
*   **交互质量监控**: 
    - **震动反馈审计**: 检查所有交互组件是否通过 `haptics.ts` 规范化触发，严禁裸调原生态震动 API。
    - **事件审计**: 强制通过 `grep -E "onWheel|onTouchStart" <file_path>` 检查，严禁添加会导致 Chrome/Android 滚动卡顿的 Passive Event 隐患。
    - **报错防御**: 严禁控制台出现任何 `Passive event listener` 或 `Non-passive event` 警告。

### 第四步：全局回归检查 (Mandatory Regression Gate)
*   **三端视图验证**: 检查侧边控制面板比例、底部 Tab 面板遮挡及横屏滚动条。
*   **组件映射对齐**: 确保修改同步涉及 `PhoneTabPanel.tsx` 等移动端专用容器。
*   **弹窗标准对齐**: 所有新增 Modal 必须继承统一的 `bg-white/10 backdrop-blur-2xl` 磨砂底，顶部图标容器必须严格执行 `12x12 rounded-2xl bg-gradient-to-tr` 规范，严禁私自定义弹窗。
*   **数据链路对齐**: 涉及 Supabase RPC 或 Cloud Sync 时，必须核对 `Database.ts` 定义，严禁将 String 传给 Int 字段。

### 第五步：版本化记录 (Versioning)
*   详细标注影响的 Token 及组件列表并滚动版本号。

---

## 🔍 UI 回归评审清单矩阵 (Regression Review Matrix)

### A. 全局框架与底层表现 (Foundation & Shell)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **品牌化** | 标题 Amber (#FFB17A) / 进度 Peach (#FFD5AB) | 加载屏幕 | `components/loading/LoadingScreen.tsx` |
| **自适应** | 单图 Object-fit cover / scale(1.2) 逻辑 | 背景渲染 | `components/ResponsiveBackground.tsx` |
| **弹窗与覆盖层** | 统一 `backdrop-blur-2xl` / Header 渐变图标库对齐 / I18n 全面挂载 | 弹窗体系 | `AlertDialog`, `VirtualAuthWidget` |
| **安卓防御** | **关键标题 SVG 化** / `.text-zoom-lock` 反向缩放 / 绝对像素间隙 `gap: '4px'` | 系统底层 | `FontScaleLock.tsx`, `globals.css` |
| **交互域** | 触控拦截与 User-select 划分 | 根容器逻辑 | `components/GameInterface.tsx` |

### B. 计分与统计系统 (Scoring & Statistics)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **色彩 Token** | 数值全量锁定 Peach (#FFD5AB) / 警告 Red | 结算面板 | `DesktopScoreLayout.tsx`, `MobileScoreLayout.tsx` |
| **字重规范** | 数值、名次、计时锁定 font-medium (500) | 排行榜/详情 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **排名限制** | **全端仅显示前 5 名 (Strict Top 5)** | 全局一致性 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **极致空气感** | 移除个人最佳与全服排名容器底色框，实现无边悬浮 | 排行榜/详情 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **UI 镜像化** | **确保结算页与历史记录详情页（RecentGameDetails）参数 100% 对齐** | 结算/往绩对齐 | `RecentGameDetails.tsx`, `DesktopScoreLayout.tsx` |
| **排版对齐** | Tabular-nums 等宽对齐 / 移除背景色 | 纪录明细 | `RecentGameDetails.tsx` |
| **响应式** | 横屏字号缩至 11px / 移除 HR 分割线 | 移动端结算 | `MobileScoreLayout.tsx` |

### C. 交互控制面板 (Interactive Controls)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **状态机** | Active (Peach-Orange) / Inactive / Sheen | 动作按钮组 | `ActionButtons.tsx`, `PhoneTabPanel.tsx` |
| **焦点色边防护** | **锁定 `outline: none !important` 覆盖全局 focus-visible 规则**，防止触摸点击出现 amber 色边 | 按钮全局响应 | `app/globals.css` (.glass-btn-base) |
| **视觉防溢出与跳黑** | 激活态锁定 `border-color: rgba(255,255,255,0)` 结合 `background-clip: padding-box`，防止退化闪黑边与层叠边缘溢出 | 按钮渲染基类 | `app/globals.css` (.glass-btn-active) |
| **阴影截断防护** | **使用 `overflow-x-hidden` 替代 `overflow-hidden`** 并配合 `pb-2` 内补，确保 11px 的物理阴影渲染空间 | 容器布局规则 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **动态缩放** | 基于 panel-scale 计算的半径与间距 | 切割/难度 | `PuzzleControlsCutCount.tsx` |
| **一致性** | 提示文字统一使用 Peach (#FFD5AB) | 控件组合器 | `PuzzleControlsScatter.tsx` |
| **顶部工具条** | 用户状态（访客灰/登录金）集成至 `GlobalUtilityButtons`，废除独立 IdentityChip 行，极致压缩垂直空间 | 全局工具栏 | `GlobalUtilityButtons.tsx`, `PhoneTabPanel.tsx` |
| **比例适配** | 基于 panel-scale 的图标与容器尺寸 | 全局工具栏 | `GlobalUtilityButtons.tsx`, `RestartButton.tsx` |

### D. 游戏引擎与 HUD (Engine & HUD)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **几何稳定** | ResizeObserver 延迟 150ms 重新映射坐标 / **锁定 Tab 面板物理高度** | 画布图层 | `PuzzleCanvas.tsx`, `PhoneTabPanel.tsx` |
| **感官反馈** | Android 震动适配 / **iOS 高穿透性音效补偿 (Triangle Wave)** | 物理反馈 | `haptics.ts`, `soundEffects.ts` |
| **代码纯净度** | **禁止 Passive Event 冲突** / 禁用 next/font 预加载 (防止 Preload 警告) | 控制台质量 | `usePuzzleInteractions.ts`, `layout.tsx` |
| **品牌色** | HUD 文本锁定 Peach (#FFD5AB) / 提示信息剥离 monospace | 计时与滚分 | `GameTimer.tsx`, `LiveScore.tsx` |
| **动画性能** | 移除拖拽时的 backdrop-blur 动态降级，防止视觉闪烁 | 交互流畅度 | `app/globals.css` |
| **动画驱动** | requestAnimationFrame 驱动数字滚动 | 实时得分 | `LiveScore.tsx` |

---

## 🚀 历史审计资产 (Historical Archives)

本项目早期的 1-13 号详细审计报告及原始优化计划已归档至以下分类目录：
*   **[审计报告目录](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/audit-reports/)**: 包含 report_01 到 report_13 的深度审计细节。
*   **[执行计划与清单](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/checklists-plans/)**: 包含 TASK_CHECKLIST, MASTER_AUDIT, OPTIMIZATION_PLAN 等项目级汇总文档。
*   **[历史规范与指南](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/legacy-specs/)**: 包含 PRD、架构视角及早期规则定义。

---
*上次修订：2026-04-26*  
*全量结案更新：2026-04-26 (SOP v3.0 - 极致弹窗一致性与安卓大字体物理免疫版)*  
*文档状态：**Official Standard / Strictly Enforced***
