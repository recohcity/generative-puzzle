# 🧩 Generative Puzzle 核心 UI/UX 规范手册 (V3.5 - 完整技术全案版)

本文档是 Generative Puzzle 项目的**官方 UI/UX 唯一事实来源 (Source of Truth)**。它整合了从全局布局架构、Design Tokens、组件状态机到性能工程与跨端安全的所有技术细节。

> [!IMPORTANT]
> **文档效力**：所有组件开发、UI 修订及视觉回归测试必须 100% 遵循本规范。任何偏离本规范的行为均需提交架构评审。

---

## 1. 核心设计语言与美学基础 (Design Philosophy)

项目采用基于暗色调的“极简玻璃拟态 (Premium Glassmorphism)”设计，通过深度感（Blur）、透视感（Transparency）与反射感（Border Reflectance）建立高级感。

### 1.1 玻璃拟态物理属性 (Glassmorphism Specs)
| 层级 | 样式名 | 背景色 (Tailwind) | 模糊度 (Backdrop Blur) | 边框与阴影 |
| :--- | :--- | :--- | :--- | :--- |
| **容器层** | `.glass-panel` | `bg-white/10` | `backdrop-blur-xl` | `border-2 border-white/30`, 内发光 `inset 0 0 20px` |
| **卡片层** | `.glass-card` | `bg-white/5` | `backdrop-blur-md` | `border border-white/10`, 无外部阴影 |
| **无边界规范** | N/A | N/A | N/A | **禁止使用硬投影**。通过细腻的边缘反射替代阴影。 |

### 1.2 颜色系统 (Color Tokens - 2026-04-17 锁定)
所有颜色通过 `rgba(var(--token-rgb), <alpha-value>)` 驱动，支持 Tailwind 的透明度修饰符（如 `text-brand-peach/50`）。

| 变量 ID | HEX | RGB 变量 (CSS) | Tailwind 语义类 | 使用场景指导 |
| :--- | :--- | :--- | :--- | :--- |
| `brand-peach` | `#FFD5AB` | `255, 213, 171` | `text-brand-peach` | **主数值色**：全量用于分数、计分数值、用户名、时间提示及返回按钮。 |
| `brand-amber` | `#FFB17A` | `255, 177, 122` | `text-brand-amber` | **关键强调色**：用于主 Logo 标题、顶级分类、全局工具按钮图标。 |
| `brand-orange` | `#F68E5F` | `246, 142, 95` | `bg-brand-orange` | **装饰性渐变色**：仅允许出现在渐变按钮 (`Active`) 的终点或装饰背景中。 |
| `brand-deep` | `#1E1A2A` | `30, 26, 42` | `bg-brand-deep` | **系统底色**：全屏背景色。 |
| `brand-dark` | `#232035` | `35, 32, 53` | `text-brand-dark` | **对比底色**：用于激活按钮文字背景。 |
| `negative` | `#FF8A80` | `255, 138, 128` | `text-red-400` | **警告色**：仅用于结算面板的扣分项数值。 |

### 1.3 排版与字重标准化 (Typography & Weights)
*   **字体栈回退**: `[Inter, Segoe UI, PingFang SC, Microsoft YaHei, Arial, sans-serif]`。
*   **数值呈现规范**:
    *   **锁定期**: 2026-04-17。
    *   **字重**: **全量锁定为 `font-medium` (500)**。禁止在数值中使用 Bold/Black 样式。
    *   **特性**: 必须携带 `tabular-nums` 以确保数字在跳动/增长时宽度恒定。
*   **交互标题规范**:
    *   **字重**: 锁定为 `font-bold` (700)，以区分交互逻辑与内容展示。

---

## 2. 响应式与物理断点律法 (Detailed Layout Architecture)

项目抛弃了断裂式的 CSS 媒体查询，转而使用由 `DeviceLayoutManager` 驱动的特征检测与动态数学缩放。

### 3.1 设备探测标准 (iPhone 17 Standalone)
| 设备类别 | 探测特征 | 强制行为 |
| :--- | :--- | :--- |
| **iPhone 17 系列** | 宽度 400-440px | 强制 Phone 模式，应用 2026 最小边距 (12px)。 |
| **iPad Landscape** | 1024-1366px | 加载 `DesktopLayout` (双列)。锁定背景为 `fixed` 且边距 50px。 |
| **iPad Portrait** | 768-1024px | 加载 `PhonePortraitLayout` (垂直)。顶补 60px 避开状态栏。 |
| **超宽屏 (>3000px)** | `screenWidth > 3000` | 强制锁定 Desktop 模式，限制主容器最大宽度 `2560px`。 |

### 3.2 全局缩放补偿公式 (Scaling System)
*   **面板缩放因子 (`panelScale`)**:
    *   `Math.max(0.4, Math.min(canvasSizeFinal / 560, 1.0))`
    *   该值通过 Context 广播至所有子组件用于计算 `gap`, `padding` 与 `borderRadius`。
*   **工具栏动态公式**:
    *   `width: calc(var(--panel-scale, 1) * 26px)`
    *   这解决了在高 DPI 与小视口桌面模式下顶栏按钮过于细小的问题。

---

## 3. 核心组件状态机与工程规范 (Component Deep-Dive)

### 3.1 激活按钮规范 (Action Button Machine)
| 状态 | CSS 特性 | 交互行为 |
| :--- | :--- | :--- |
| **Active** | `.glass-btn-active` (Peach-Orange 渐变) | 反色文字 (#232035)；锁定 `border-color: rgba(255,255,255,0)` 阻断闪黑边现象，配以 `background-clip: padding-box` 防溢出。 |
| **Focus Policy** | `outline: none !important` | **禁止在点击/触摸时触发焦点框**。仅保留视觉状态回馈，防止非键盘操作下的色边残留。 |
| **Inactive** | `.glass-btn-inactive` (30% White 底色) | 白色/Peach 文字，扫光特效 (`.glass-btn-sheen`)。 |
| **Disabled** | `opacity-30` | `pointer-events-none` 拦截。 |
| **Shadow Safe** | `overflow-x-hidden` + `pb-2` | **容器必须允许纵向阴影渲染**。严禁在该类按钮的紧邻父级使用全局 `overflow-hidden`。 |

### 3.2 结算系统 (Scoring Layouts)
*   **镜像对称原则**: `RecentGameDetails` 与 `DesktopScoreLayout` (Desktop) 以及 `GameRecordDetails` 与 `MobileScoreLayout` (Mobile) 的子字号排版必须 100% 对齐。
*   **视觉留白**: 2026-04-18 规范移除了排行榜/结算面板中顶级的磨砂背景色块 (`bg-white/[0.04]`)，统一实现无框悬浮效果，提升呼吸感与空气感。
*   **细节间距与分隔**: 移除了结算面板操作按钮上方的 `border-t` 分隔线，按钮高度统一为 `36px` (Mobile) / `40px` (Desktop)。
*   **横屏空间防溢**: 横屏下字号强制降至 `11px`，移除 `<hr />` 分离线，间距压缩至 `gap-1`。

### 3.3 画布与 HUD 图层 (Canvas & HUD)
*   **安全边距**: HUD 元素左右边距锁定为 `--overlay-side-margin: 8px`。
*   **背景表现**: HUD 统一背景为 `rgba(0,0,0,0.3)` 叠加 `blur(4px)`。
*   **几何稳定性**: 拦截 `ResizeObserver`，仅在 Resize 稳定 150ms 后重新映射积木坐标，防止 UI 抖动。

---

## 4. 性能工程与平台安全 (Performance & Safety)

### 4.1 GPU 动画优化
*   **变换优先**: 进度条、面板伸缩必须使用 `transform: translate3d/scale`。
*   **合成层管理**: 关键动效组件必须配备 `will-change: transform` 并在动画结束后移除。

### 4.2 平台安全 (iOS & Touch Hacks)
*   **Focus Safe**: 所有输入框字体强制 `16px` 以拦截 iOS 系统级自动缩放。
*   **Rubber Banding**: `PuzzleCanvas` 强制 `touch-action: none` 防止滚动穿透。
*   **Safe Area Insets**: 通过 CSS 变量 `env(safe-area-inset-top)` 注入全局变量 `var(--safe-top)`。

---

## 5. 开发者修改指南 (Technical Modification Guide)

### 5.1 修改品牌色彩
1.  在 `app/globals.css` 中找到对应变量：`--brand-peach: 255, 213, 171;`
2.  修改 RGB 数值。**切勿在此填入十六进制。**
3.  系统会自动同步至全项目 100+ 个应用场景。

### 5.2 注册新语义 Token
在 `tailwind.config.ts` 的 `extend.colors` 块中添加：
```typescript
'brand-custom': 'rgba(var(--brand-custom), <alpha-value>)',
```

---
*版本：V3.8 (Detailed Technical Manual)*
*最近同步：2026-04-18 (过渡状态缝隙与闪黑补帧规范)*
*状态：**Strict Enforcement***
