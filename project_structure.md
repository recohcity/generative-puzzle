# 项目结构

本文档描述了生成式拼图项目的文件结构和组织。

## 目录结构

```
generative-puzzle/
├── app/                      # Next.js App Router 文件
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局组件
│   └── page.tsx              # 主页面组件
├── components/               # UI组件
│   ├── ui/                   # 基础UI组件 (Shadcn UI)
│   │   ├── button.tsx        # 按钮组件
│   │   ├── dropdown-menu.tsx # 下拉菜单组件
│   │   ├── slider.tsx        # 滑块组件
│   │   ├── switch.tsx        # 开关组件
│   │   └── tooltip.tsx       # 提示组件
│   ├── LoadingScreen.tsx     # 加载屏幕组件
│   ├── PuzzleCanvas.tsx      # 画布渲染组件
│   ├── PuzzleControls.tsx    # 拼图控制组件
│   └── ShapeControls.tsx     # 形状控制组件
├── contexts/                 # 状态管理
│   ├── GameContext.tsx       # 游戏状态管理
│   └── ThemeContext.tsx      # 主题管理
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
    ├── ShapeGenerator.ts     # 形状生成器
    ├── PuzzleGenerator.ts    # 拼图生成器
    ├── ScatterPuzzle.ts      # 拼图打散工具
    ├── renderUtils.tsx       # 渲染辅助函数
    ├── cutGenerators.ts      # 切割线生成器
    ├── geometryUtils.ts      # 几何计算工具
    ├── constants.ts          # 常量定义
    ├── helper.ts             # 通用辅助函数
    ├── puzzleUtils.ts        # 拼图操作工具
    └── soundEffects.ts       # 音效处理
```

## 核心模块说明

### app 目录

Next.js 15 应用路由系统的入口点。

- `page.tsx`: 应用的主页面，包含游戏UI的主要布局和加载屏幕逻辑
- `layout.tsx`: 应用的布局组件，提供全局上下文和主题
- `globals.css`: 全局样式定义，包括Tailwind CSS的基础配置和加载动画

### components 目录

包含所有React组件，包括游戏界面和UI元素。

- `LoadingScreen.tsx`: 游戏加载页面，显示标题、进度条和动画拼图碎片
- `PuzzleCanvas.tsx`: 核心画布组件，处理形状和拼图的渲染与交互
- `PuzzleControls.tsx`: 拼图操作控制面板，提供重置、提示等功能
- `ShapeControls.tsx`: 形状生成控制面板，配置形状类型和切割参数
- `ui/`: 基于Shadcn UI的基础组件库，提供一致的设计系统

### contexts 目录

React Context API实现的状态管理。

- `GameContext.tsx`: 核心游戏状态管理，包括形状、拼图片段、交互状态等
- `ThemeContext.tsx`: 主题管理，控制颜色方案和视觉偏好

### hooks 目录

自定义React钩子函数。

- `use-mobile.tsx`: 检测移动设备并优化界面
- `use-toast.ts`: 提供轻量级通知功能

### utils 目录

游戏核心逻辑和辅助功能实现。

- `ShapeGenerator.ts`: 基于参数生成各种类型的形状
- `PuzzleGenerator.ts`: 将形状切割成拼图片段
- `ScatterPuzzle.ts`: 将拼图片段分散到画布上
- `renderUtils.tsx`: 提供画布渲染和视觉效果
- `cutGenerators.ts`: 生成不同类型的切割线
- `geometryUtils.ts`: 几何计算工具函数
- `constants.ts`: 游戏常量定义
- `helper.ts`: 通用辅助函数
- `puzzleUtils.ts`: 拼图操作的专用工具
- `soundEffects.ts`: 音效播放和管理

### 其他目录

- `types/`: TypeScript类型定义
- `public/`: 静态资源文件
- `lib/`: 通用工具函数库

## 配置文件

- `next.config.mjs`: Next.js配置
- `tailwind.config.ts`: Tailwind CSS配置
- `postcss.config.mjs`: PostCSS配置
- `tsconfig.json`: TypeScript配置
- `components.json`: Shadcn UI组件配置

## 数据流

1. 用户访问应用时先显示加载页面，提供视觉反馈
2. 加载完成后进入主界面
3. 用户在控制面板中设置形状和切割参数
4. 通过GameContext更新游戏状态
5. ShapeGenerator生成基础形状
6. PuzzleGenerator根据切割参数将形状切成片段
7. ScatterPuzzle将片段分散到画布上
8. PuzzleCanvas渲染片段并处理交互
9. 当用户完成拼图时，触发完成动画效果
