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

### 第二步：跨端响应式注入 (Responsive Parity)
*   **布局分流**: 必须同时在 `DesktopLayout`, `PhonePortraitLayout`, `PhoneLandscapeLayout` 下验证。
*   **物理适配**: 使用 `panel-scale` 变量进行按钮与边距的等比缩放计算。

### 第三步：性能与合成层优化 (Performance)
*   **动画选型**: 涉及位移或缩放的动画必须使用 `transform`，严禁操作 `width/height`。
*   **渲染频率**: 实时刷新组件需评估 React 重绘压力，必要时进行降频处理。

### 第四步：全局回归检查 (Mandatory Regression Gate)
*   **三端视图验证**: 检查侧边控制面板比例、底部 Tab 面板遮挡及横屏滚动条。
*   **组件映射对齐**: 确保修改同步涉及 `PhoneTabPanel.tsx` 等移动端专用容器。

### 第五步：版本化记录 (Versioning)
*   详细标注影响的 Token 及组件列表并滚动版本号。

---

## 🔍 UI 回归评审清单矩阵 (Regression Review Matrix)

### A. 全局框架与底层表现 (Foundation & Shell)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **品牌化** | 标题 Amber (#FFB17A) / 进度 Peach (#FFD5AB) | 加载屏幕 | `components/loading/LoadingScreen.tsx` |
| **自适应** | 单图 Object-fit cover / scale(1.2) 逻辑 | 背景渲染 | `components/ResponsiveBackground.tsx` |
| **安全区** | Safe Area Inset 变量注入与 Padding | 全局包裹层 | `app/layout.tsx` |
| **交互域** | 触控拦截与 User-select 划分 | 根容器逻辑 | `components/GameInterface.tsx` |

### B. 计分与统计系统 (Scoring & Statistics)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **色彩 Token** | 数值全量锁定 Peach (#FFD5AB) / 警告 Red | 结算面板 | `DesktopScoreLayout.tsx`, `MobileScoreLayout.tsx` |
| **字重规范** | 数值、名次、计时锁定 font-medium (500) | 排行榜/详情 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **排名限制** | **全端仅显示前 5 名 (Strict Top 5)** | 全局一致性 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **极致空气感** | 移除个人最佳与全服排名容器底色框，实现无边悬浮 | 排行榜/详情 | `LeaderboardPanel.tsx`, `PhoneTabPanel.tsx` |
| **排版对齐** | Tabular-nums 等宽对齐 / 移除背景色 | 纪录明细 | `RecentGameDetails.tsx` |
| **响应式** | 横屏字号缩至 11px / 移除 HR 分割线 | 移动端结算 | `MobileScoreLayout.tsx` |

### C. 交互控制面板 (Interactive Controls)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **状态机** | Active (Peach-Orange) / Inactive / Sheen | 动作按钮组 | `ActionButtons.tsx`, `PhoneTabPanel.tsx` |
| **视觉防溢出** | 激活态按钮解除边框(`border-none`)且弃用内阴影，禁止渐变色从底边/透明边溢出错位 | 按钮渲染基类 | `app/globals.css` (.glass-btn-active) |
| **动态缩放** | 基于 panel-scale 计算的半径与间距 | 切割/难度 | `PuzzleControlsCutCount.tsx` |
| **一致性** | 提示文字统一使用 Peach (#FFD5AB) | 控件组合器 | `PuzzleControlsScatter.tsx` |
| **比例适配** | 基于 panel-scale 的图标与容器尺寸 | 全局工具栏 | `GlobalUtilityButtons.tsx`, `RestartButton.tsx` |

### D. 游戏引擎与 HUD (Engine & HUD)
| 评审维度 | 检查项 | 对应功能 | 核心源代码 (Source Files) |
| :--- | :--- | :--- | :--- |
| **几何稳定** | ResizeObserver 延迟 150ms 重新映射坐标 | 画布图层 | `PuzzleCanvas.tsx` |
| **品牌色** | HUD 文本锁定 Peach (#FFD5AB) / Blur(4px) | 计时与滚分 | `GameTimer.tsx`, `LiveScore.tsx` |
| **动画性能** | requestAnimationFrame 驱动数字滚动 | 实时得分 | `LiveScore.tsx` |

---

## 🚀 历史审计资产 (Historical Archives)

本项目早期的 1-13 号详细审计报告及原始优化计划已归档至以下分类目录：
*   **[审计报告目录](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/audit-reports/)**: 包含 report_01 到 report_13 的深度审计细节。
*   **[执行计划与清单](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/checklists-plans/)**: 包含 TASK_CHECKLIST, MASTER_AUDIT, OPTIMIZATION_PLAN 等项目级汇总文档。
*   **[历史规范与指南](file:///Users/citylivepark/Documents/project/generative-puzzle/docs/archive/legacy-specs/)**: 包含 PRD、架构视角及早期规则定义。

---
*上次修订：2026-04-18*  
*全量结案更新：2026-04-18 (SOP v2.63 - 金钮渲染修正版)*  
*文档状态：**Official Standard / Strictly Enforced***
