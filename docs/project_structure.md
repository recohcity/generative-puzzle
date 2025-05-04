# 项目结构

本文档描述了生成式拼图项目的文件结构和组织。

## 目录结构

```
generative-puzzle/
├── app/                      # Next.js App Router 文件
│   ├── globals.css           # 全局样式 (含圆角修复, 玻璃效果, 移动端触控优化, 全屏模式增强)
│   ├── layout.tsx            # 根布局组件 (含移动设备meta标签优化)
│   └── page.tsx              # 主页面组件 (优化加载体验)
├── components/               # UI组件
│   ├── ui/                   # 基础UI组件 (Shadcn UI)
│   │   ├── button.tsx        # 按钮组件
│   │   ├── dropdown-menu.tsx # 下拉菜单组件
│   │   ├── slider.tsx        # 滑块组件
│   │   ├── switch.tsx        # 开关组件
│   │   └── tooltip.tsx       # 提示组件
│   ├── loading/              # 加载相关组件
│   │   ├── LoadingScreen.tsx # 动态加载屏幕组件
│   │   └── LoadingScreenStatic.tsx # 静态加载屏幕组件
│   ├── PuzzleCanvas.tsx      # 画布渲染组件 (响应式, 触控修复, 文本渲染优化, 15度旋转支持)
│   ├── PuzzleControls.tsx    # 拼图控制组件 (优化文字, 背景音乐控制, 全屏切换)
│   ├── PuzzleControlsCutCount.tsx  # 切割次数控制组件 (支持1-8次)
│   ├── PuzzleControlsCutType.tsx   # 切割类型控制组件
│   ├── PuzzleControlsGamepad.tsx   # 游戏控制组件
│   ├── PuzzleControlsScatter.tsx   # 拼图散开控制组件
│   ├── ShapeControls.tsx     # 形状控制组件
│   └── theme-provider.tsx    # 主题提供者组件
├── contexts/                 # 状态管理
│   └── GameContext.tsx       # 游戏状态管理 (含画布尺寸, 散开逻辑, 旋转修复)
├── docs/                     # 项目文档
│   ├── difficulty-design.md  # 难度设计详细文档
│   └── project_structure.md  # 项目结构文档 (本文档)
├── hooks/                    # 自定义React钩子
│   ├── use-mobile.tsx        # 移动设备检测
│   └── use-toast.ts          # Toast通知
├── lib/                      # 通用工具函数
│   └── utils.ts              # 工具函数
├── public/                   # 静态资源
│   ├── bg.jpg                # 游戏背景图
│   ├── puzzle-pieces.mp3     # 循环背景音乐
│   ├── p1.png                # 预览图片1
│   └── p2.png                # 预览图片2
├── types/                    # 类型定义
│   └── types.ts              # 共享类型
└── utils/                    # 游戏逻辑工具
    ├── constants.ts          # 常量定义
    ├── helper.ts             # 通用辅助函数
    ├── shape/                # 形状相关工具
    │   ├── ShapeGenerator.ts # 形状生成器
    │   └── geometryUtils.ts  # 几何计算工具
    ├── puzzle/               # 拼图相关工具
    │   ├── PuzzleGenerator.ts# 拼图生成器 (处理不同切割次数)
    │   ├── ScatterPuzzle.ts  # 拼图打散工具 (优化分布, 避开目标, 15度旋转)
    │   ├── cutGenerators.ts  # 切割线生成器 (难度映射切割线数)
    │   └── puzzleUtils.ts    # 拼图操作工具
    └── rendering/            # 渲染相关工具
        └── soundEffects.ts   # 音效处理 (含背景音乐控制, 设备适配音量)
```

## 核心模块说明

### app 目录

Next.js 15 应用路由系统的入口点。

- `page.tsx`: 应用的主页面，包含游戏UI的主要布局和优化的加载屏幕逻辑
- `layout.tsx`: 应用的布局组件，提供全局上下文和主题，包含移动设备视口优化和全屏模式增强
- `globals.css`: 全局样式定义，包括Tailwind CSS基础配置、加载动画、圆角修复、玻璃效果样式、移动端触控优化和全屏控制增强

### components 目录

包含所有React组件，包括游戏界面和UI元素。

- `loading/LoadingScreen.tsx`: 动态加载页面组件
- `loading/LoadingScreenStatic.tsx`: 静态加载页面组件
- `PuzzleCanvas.tsx`: 核心画布组件，处理渲染与交互，修复移动端触摸选中问题，优化完成文字渲染，支持15度倍数旋转逻辑
- `PuzzleControls.tsx`: 拼图操作控制面板，提供重置、提示、背景音乐开关、全屏切换等功能
- `PuzzleControlsCutCount.tsx`: 切割次数控制组件，用于设置拼图的切割次数 (支持1-8次)
- `PuzzleControlsCutType.tsx`: 切割类型控制组件，用于选择直线或曲线切割
- `PuzzleControlsGamepad.tsx`: 游戏控制组件，包含提示、重置等游戏操作按钮
- `PuzzleControlsScatter.tsx`: 拼图散开控制组件，用于控制拼图片段的分散与排列
- `ShapeControls.tsx`: 形状生成控制面板
- `theme-provider.tsx`: 提供主题切换功能
- `ui/`: 基于Shadcn UI的基础组件库

### contexts 目录

React Context API实现的状态管理。

- `GameContext.tsx`: 核心游戏状态管理，包括形状、拼图、交互状态、画布尺寸、拼图散开状态 (`isScattered`)，散开避开目标逻辑，修复旋转角度问题

### docs 目录

包含项目相关文档。

- `difficulty-design.md`: 详细描述游戏难度系统的设计与实现
- `project_structure.md`: 本文档，描述项目文件结构

### hooks 目录

自定义React钩子函数。

- `use-mobile.tsx`: 检测移动设备
- `use-toast.ts`: 提供轻量级通知功能

### public 目录

存放静态资源文件。

- `bg.jpg`: 游戏界面的背景图片
- `puzzle-pieces.mp3`: 游戏的循环背景音乐
- `p1.png`: 项目预览图片1
- `p2.png`: 项目预览图片2

### utils 目录

游戏核心逻辑和辅助功能实现。

- `shape/`: 形状生成和几何运算
  - `ShapeGenerator.ts`: 基于参数生成各种类型的形状
  - `geometryUtils.ts`: 几何计算工具函数
- `puzzle/`: 拼图生成和操作
  - `PuzzleGenerator.ts`: 将形状切割成拼图片段，根据难度处理不同的切割次数
  - `ScatterPuzzle.ts`: 改进的拼图片段打散布局，优化画布边界限制，实现散开时避开目标形状，确保15度倍数旋转
  - `cutGenerators.ts`: 生成不同类型的切割线，包含难度级别到切割线数量的映射逻辑
  - `puzzleUtils.ts`: 拼图操作的专用工具
- `rendering/`: 渲染和视觉效果
  - `soundEffects.ts`: 音效播放和管理，包含背景音乐的播放、暂停、切换功能，设备适配音量控制
- `constants.ts`: 游戏常量定义
- `helper.ts`: 通用辅助函数

## 优化项目说明

### 难度系统与切割
- 切割次数选项扩展至1-8次
- 根据切割次数动态调整实际生成的拼图数量（高难度产生更多块）
- 细化难度级别定义和策略
- 创建详细的难度设计文档 (`docs/difficulty-design.md`)

### 散开与旋转
- 散开时拼图智能避开目标形状区域
- 修复散开时拼图旋转角度非15度倍数的问题

### 移动端交互优化
- 修复触摸后选中状态丢失问题
- 移除点击空白区域取消选中的逻辑
- 添加了移动设备触摸操作支持，实现触摸拖拽、双指旋转等功能
- 全屏模式增强，防止意外退出全屏的触摸事件处理
- 针对不同设备类型（iPad/iPhone/Android）的音量自适应调整
- 添加了touch-action控制，防止浏览器默认的滚动和缩放行为
- 优化了触摸事件处理，确保按钮和控件在触摸设备上可正常工作
- 全面优化iPad浏览器体验，防止向下滑动导致退出全屏
- 添加了移动设备视口meta标签，提供更好的全屏体验

### 手机端特别优化
- 针对手机竖屏模式做了特别适配，确保游戏界面完全可用
- 优化了控制面板在竖屏模式下的展示，使所有选项能在较小屏幕上显示
- 调整了形状显示方式，解决了在手机竖屏模式下形状变形的问题
- 实现了正方形画布自动计算，保证形状在任何屏幕上都保持比例
- 增强了边界检测机制，防止拼图移动到屏幕外无法取回
- 改进触摸旋转提示文本，使用更友好的表述方式

### 视觉效果优化
- 统一并优化游戏完成提示文字的渲染效果

### 加载体验优化
- 添加了静态加载屏幕作为首次渲染时的占位组件
- 动态加载屏幕实现了平滑的进度条和加载状态显示
- 优化了资源加载顺序和组件预加载策略
- 加入了超时保护机制，确保加载过程不会卡住

### 屏幕适配优化
- 画布自动检测并适应屏幕尺寸
- 响应式布局，支持不同设备尺寸
- 拼图与屏幕边界的智能碰撞检测
- 移动设备视口meta标签优化，提供更好的全屏体验

### 拼图分布优化
- 改进了拼图片段分散算法，确保片段不会超出画布边界
- 添加了动态安全边距计算，根据拼图大小调整
- 实现了网格布局系统，减少拼图重叠

### UI文字优化
- 修订了游戏面板按钮文字，提高直观性
- 优化了提示信息，帮助用户理解游戏机制
- 统一了色彩方案和交互反馈

### 文件组织优化
- 将相关功能组件和工具函数按功能分组，提高代码可维护性
- 创建专门的加载组件目录，便于管理加载相关功能
- 将工具函数按领域分类，如形状生成、拼图操作和渲染效果等

## 开发配置说明

### React StrictMode

本项目在`next.config.mjs`中禁用了React的StrictMode：

```js
// next.config.mjs
const nextConfig = {
  // ...其他配置
  reactStrictMode: false,
}
```

**StrictMode说明：**

- **StrictMode的作用**：是React提供的开发辅助工具，通过故意重复执行某些函数（如reducer、effect等）来帮助开发者发现潜在的副作用和不一致问题。
- **为什么禁用**：在开发过程中，StrictMode会导致拼图旋转功能异常（每次点击旋转30度而非预期的15度），这是因为它重复执行了旋转reducer。
- **生产环境**：生产构建中，React不会启用StrictMode的重复执行行为，因此禁用仅影响开发体验，不影响最终产品。
- **最佳实践**：在大部分功能开发稳定后，可以临时重新启用StrictMode来进行问题检测，并在发现和修复问题后再次禁用，以获得更好的开发体验。

注意：禁用StrictMode是一种权衡，它改善了开发体验，但可能会导致某些潜在问题在开发阶段难以发现。当遇到疑难问题时，可以考虑临时启用StrictMode进行调试。
