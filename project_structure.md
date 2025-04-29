# 项目结构

本文档描述了生成式拼图项目的文件结构和组织。

## 目录结构

```
generative-puzzle/
├── app/                      # Next.js App Router 文件
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局组件
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
│   ├── PuzzleCanvas.tsx      # 画布渲染组件 (响应式适配)
│   ├── PuzzleControls.tsx    # 拼图控制组件 (优化文字表述)
│   ├── ShapeControls.tsx     # 形状控制组件
│   └── theme-provider.tsx    # 主题提供者组件
├── contexts/                 # 状态管理
│   └── GameContext.tsx       # 游戏状态管理 (含画布尺寸控制)
├── hooks/                    # 自定义React钩子
│   ├── use-mobile.tsx        # 移动设备检测
│   └── use-toast.ts          # Toast通知
├── lib/                      # 通用工具函数
│   └── utils.ts              # 工具函数
├── public/                   # 静态资源
│   └── puzzle-preview.png    # 预览图片
├── types/                    # 类型定义
│   └── types.ts              # 共享类型
└── utils/                    # 游戏逻辑工具
    ├── constants.ts          # 常量定义
    ├── helper.ts             # 通用辅助函数
    ├── shape/                # 形状相关工具
    │   ├── ShapeGenerator.ts # 形状生成器
    │   └── geometryUtils.ts  # 几何计算工具
    ├── puzzle/               # 拼图相关工具
    │   ├── PuzzleGenerator.ts# 拼图生成器
    │   ├── ScatterPuzzle.ts  # 拼图打散工具 (优化分布算法)
    │   ├── cutGenerators.ts  # 切割线生成器
    │   └── puzzleUtils.ts    # 拼图操作工具
    └── rendering/            # 渲染相关工具
        └── soundEffects.ts   # 音效处理
```

## 核心模块说明

### app 目录

Next.js 15 应用路由系统的入口点。

- `page.tsx`: 应用的主页面，包含游戏UI的主要布局和优化的加载屏幕逻辑
- `layout.tsx`: 应用的布局组件，提供全局上下文和主题
- `globals.css`: 全局样式定义，包括Tailwind CSS的基础配置和加载动画

### components 目录

包含所有React组件，包括游戏界面和UI元素。

- `loading/LoadingScreen.tsx`: 动态加载页面组件，显示标题、进度条和动画拼图碎片
- `loading/LoadingScreenStatic.tsx`: 静态加载页面组件，作为动态组件加载前的占位
- `PuzzleCanvas.tsx`: 核心画布组件，处理形状和拼图的渲染与交互，支持屏幕适配
- `PuzzleControls.tsx`: 拼图操作控制面板，优化了按钮文字表述，提供重置、提示等功能
- `ShapeControls.tsx`: 形状生成控制面板，配置形状类型和切割参数
- `theme-provider.tsx`: 提供主题切换功能
- `ui/`: 基于Shadcn UI的基础组件库，提供一致的设计系统

### contexts 目录

React Context API实现的状态管理。

- `GameContext.tsx`: 核心游戏状态管理，包括形状、拼图片段、交互状态、画布尺寸等

### hooks 目录

自定义React钩子函数。

- `use-mobile.tsx`: 检测移动设备并优化界面
- `use-toast.ts`: 提供轻量级通知功能

### utils 目录

游戏核心逻辑和辅助功能实现，按功能分组组织。

- `shape/`: 形状生成和几何运算
  - `ShapeGenerator.ts`: 基于参数生成各种类型的形状
  - `geometryUtils.ts`: 几何计算工具函数
- `puzzle/`: 拼图生成和操作
  - `PuzzleGenerator.ts`: 将形状切割成拼图片段
  - `ScatterPuzzle.ts`: 改进的拼图片段打散布局，优化了画布边界限制
  - `cutGenerators.ts`: 生成不同类型的切割线
  - `puzzleUtils.ts`: 拼图操作的专用工具
- `rendering/`: 渲染和视觉效果
  - `soundEffects.ts`: 音效播放和管理
- `constants.ts`: 游戏常量定义
- `helper.ts`: 通用辅助函数

## 优化项目说明

### 加载体验优化

- 添加了静态加载屏幕作为首次渲染时的占位组件
- 动态加载屏幕实现了平滑的进度条和加载状态显示
- 优化了资源加载顺序和组件预加载策略
- 加入了超时保护机制，确保加载过程不会卡住

### 屏幕适配优化

- 画布自动检测并适应屏幕尺寸
- 响应式布局，支持不同设备尺寸
- 拼图与屏幕边界的智能碰撞检测

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
