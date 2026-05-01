# 🧩 Generative Puzzle 核心 UI/UX 规范手册 (V4.3 - 2026 移动全能力探测版)

本文档是 Generative Puzzle 项目的**官方 UI/UX 唯一事实来源 (Source of Truth)**。它整合了从全局布局架构、Design Tokens、组件状态机到性能工程与跨端安全的所有技术细节。

> [!IMPORTANT]
> **文档效力**：所有组件开发、UI 修订及视觉回归测试必须 100% 遵循本规范。任何偏离本规范的行为均需提交架构评审。

---

## 1. 核心设计语言与基本法 (Design Philosophy & Lexicon)

项目采用基于暗色调的“极简玻璃拟态 (Premium Glassmorphism)”设计，通过深度感（Blur）、透视感（Transparency）与反射感（Border Reflectance）建立高级感。

### 1.1 术语与数字美学 (Terminology & Numerics)
*   **术语定义 (v1.4.15)**: 
    - 严禁使用“次数”描述切割逻辑。
    - **标准术语**: 统一使用 **“切割 (Cut)”**（如：切割 1-15）。
*   **字重规范**: **全量锁定为 `font-medium` (500)**。禁止在数值中使用 Bold/Black 样式。
*   **标准数字 (New)**: 2026-04-28 强制。**必须使用 `font-sans`**。严禁在分数、倍率、计时等数值中使用带有中斜线 0 的 `font-mono`。
*   **排版特性**: 数值必须携带 `tabular-nums` 以确保等宽增长。

### 1.2 玻璃拟态物理属性 (Glassmorphism Specs)
| 层级 | 样式名 | 背景色 (Tailwind) | 模糊度 (Backdrop Blur) | 边框与阴影 |
| :--- | :--- | :--- | :--- | :--- |
| **容器层** | `.glass-panel` | `bg-white/10` | `backdrop-blur-xl` | `border-2 border-white/30`, 内发光 `inset 0 0 20px` |
| **卡片层** | `.glass-card` | `bg-white/5` | `backdrop-blur-md` | `border border-white/10`, 无阴影 |
| **弹窗层** | `AlertDialogContent` | `bg-white/10` | `backdrop-blur-2xl` | 必须伴随深色背景遮罩 `bg-black/60` |

### 1.3 颜色系统 (Color Tokens)
| 变量 ID | RGB 变量 (CSS) | Tailwind 语义类 | 使用场景指导 |
| :--- | :--- | :--- | :--- |
| `brand-peach` | `255, 213, 171` | `text-brand-peach` | **主数值色**：分数、计分数值、用户名、时间提示。 |
| `brand-amber` | `255, 177, 122` | `text-brand-amber` | **关键强调色**：主 Logo、顶级分类、全局工具图标。 |
| `brand-orange` | `246, 142, 95` | `bg-brand-orange` | **装饰渐变**：仅用于按钮 Active 态终点。 |
| `brand-deep` | `30, 26, 42` | `bg-brand-deep` | **系统底色**：全屏背景。 |

---

## 2. 响应式布局与全屏探测架构 (Layout & Architecture)

### 2.1 移动端布局律法 (Mobile UI Laws - v1.4.15)
*   **等宽对齐 (Width Uniformity)**: 在 `PhoneTabPanel` 中，**“难度卡片”**、**“切割形状按钮组”** 与顶部的 **“Tab 切换按钮组”** 物理总长度必须严格一致，确保视觉轴线垂直对齐。
*   **高度锁定**: 控制面板、结算页、排行榜的高度必须在像素级完全一致（Portrait ~170px / Landscape ~160px），禁止切换跳动。
*   **极致间距**: 画布底边与面板顶边的物理间距锁定为 **`2px`**。
*   **极致置顶策略**: 在主流移动浏览器（Chrome, Safari, WeChat）下，强制归零 `paddingTop` 并移除 `my-auto` 居中对齐，回收被浏览器地址栏浪费的垂直空间。

### 2.2 全屏能力门禁 (Fullscreen Policy - v1.4.15)
系统弃用一切“伪全屏”方案，转而使用原生能力探测：
- **隐藏机制**: 在 WeChat (微信)、iOS Safari、Arc Mobile 等环境下**强制隐藏全屏按钮**。
- **原因**: 避免上述浏览器对全屏 API 拦截导致的 `fixed/absolute` 布局偏移（Layout Shift）。

### 2.3 移动端主流浏览器适配 (2026 Mainstream Adaptation)
针对 Chrome, Safari, Firefox, Arc Mobile 等主流浏览器的特殊适配：
- **极致上移适配 (Extreme Up-shift)**: 
    - **Chrome/Safari**: 实施“零顶距”策略，将布局重心推向视口绝对顶部。
    - **WeChat (微信)**: 实施“左右对称置顶”策略。横屏下左右两栏（画布与面板）必须同时使用 `flex-start` 靠顶对齐，高度基准线保持一致。
- **动态视口与缓冲区 (Dynamic Buffers)**: 
    - 垂直方向通过 `panelBottomPadding` (25-50px) 在面板底部建立物理“安全岛”，抵御 Chrome 导航栏或微信底栏遮挡。
    - 横屏左右 Padding 使用 `max(env(safe-area-inset-left), env(safe-area-inset-right), 12px)` 实现视觉绝对居中。
- **横屏保守算法**: 横屏模式下，针对微信额外预留 **32-45px** 垂直冗余与 **80px** 水平冗余，以抵消其复杂的侧边与顶栏影响。
- **滚动锁定**: 移动端强制开启 `overscroll-behavior: none`，严防下拉刷新触发的布局重绘。

### 2.4 设备探测标准
| 设备类别 | 探测特征 | 强制行为 |
| :--- | :--- | :--- |
| **iPhone 17 系列** | 宽度 400-440px | 应用 2026 最小边距 (12px)。 |
| **iPad Landscape** | 1024-1366px | 加载 `DesktopLayout` (双列)。 |
| **iPad Portrait** | 768-1024px | 加载 `PhonePortraitLayout` (垂直)。 |

---

## 3. 核心组件规范 (Component Deep-Dive)

### 3.1 激活按钮状态机 (Action Button Machine)
- **Active**: `.glass-btn-active` (Peach-Orange 渐变)，文字反色 (#232035)，`outline: none !important`。
- **Inactive**: `.glass-btn-inactive` (30% White 底色)。
- **Shadow Safe**: 容器必须使用 `overflow-x-hidden` 并配合 `pb-2`，确保 11px 的动态阴影不被切断。

### 3.2 仪表盘化结算系统 (Settlement Dashboard)
- **核心字号**: 全端统一锁定为 **`text-[56px] font-medium`**。
- **三区布局**:
    - **Zone 1 (品牌)**: 奖杯与难度。
    - **Zone 2 (成就)**: 分数、星级、勋章墙。
    - **Zone 3 (数据)**: 扣分详情、操作按钮。
- **难度逻辑 (v1.4.15)**: **Level 1 (入门)** 碎片范围锁定为 **2-4 片**。

---

## 4. 性能工程与平台安全 (Performance & Safety)

### 4.1 GPU 动画优化
*   **变换优先**: 进度条、面板伸缩必须使用 `transform: translate3d/scale`。
*   **合成层管理**: 关键动效组件必须配备 `will-change: transform` 并在动画结束后移除。

### 4.2 安卓文字放大防御 (Android textZoom Defense)
针对安卓微信底层文字强行放大行为：
1.  **核心标题 SVG 化**: 主宣发标题强制使用 `<svg><text/></svg>` 渲染，100% 免疫缩放。
2.  **万能缩放锁 (`.text-zoom-lock`)**: 对动态数据挂载该样式，通过 `transform: scale(var(--text-zoom-scale))` 逆向补偿。
3.  **绝对像素间距**: 布局严禁使用 `gap-1` 等 `rem` 单位，必须使用 `style={{ gap: '4px' }}`。

### 4.3 平台反馈补完
- **Android Haptic**: 碰撞触发 15ms 短震；吸附触发 `[20, 30, 20]` 节奏震动。
- **iOS Audio Fallback**: iOS 强制回退至 `playCollideSound` (300Hz Triangle wave)。

---

*版本：V4.3 (Structured Edition)*
*最近更新：2026-05-01*
*状态：**Strict Enforcement***
