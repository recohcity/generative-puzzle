# 项目结构

本文档描述了生成式拼图项目的文件结构和组织。

## 目录结构

```
generative-puzzle/
├── app/                      # Next.js App Router 文件
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局组件
│   └── page.tsx              # 主页面组件 (动态加载 GameInterface)
├── components/               # UI组件
│   ├── ui/                   # 基础UI组件 (Shadcn UI)
│   ├── loading/              # 加载相关组件
│   │   ├── LoadingScreen.tsx # 动态加载屏幕组件
│   │   └── LoadingScreenStatic.tsx # 静态加载屏幕组件
│   ├── GameInterface.tsx     # 主要游戏界面组件 (原 curve-test-optimized.tsx)
│   ├── PuzzleCanvas.tsx      # 画布渲染组件
│   ├── PuzzleControls.tsx    # 拼图控制面板
│   ├── PuzzleControlsCutCount.tsx  # 切割次数控制组件
│   ├── PuzzleControlsCutType.tsx   # 切割类型控制组件
│   ├── PuzzleControlsGamepad.tsx   # 游戏控制组件 (重置/提示等)
│   ├── PuzzleControlsScatter.tsx   # 拼图散开控制组件n
│   ├── ShapeControls.tsx     # 形状控制组件
│   └── theme-provider.tsx    # 主题提供者组件
├── contexts/                 # 状态管理
│   └── GameContext.tsx       # 游戏状态管理
├── docs/                     # 项目文档
│   ├── CONFIGURATION.MD      # 游戏配置说明文档
│   ├── DIFFICULTY-DESIGN.MD  # 难度设计详细文档
│   ├── PROJECT_STRUCTURE.MD  # 项目结构文档 (本文档)
│   └── PROMOTION.MD          # 商业推广文档
├── hooks/                    # 自定义React钩子
│   ├── use-mobile.tsx        # 移动设备检测
│   └── use-toast.ts          # Toast通知
├── lib/                      # 通用工具函数
│   └── utils.ts              # 工具函数 (主要为 cn)
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
    │   ├── PuzzleGenerator.ts# 拼图生成器
    │   ├── ScatterPuzzle.ts  # 拼图打散工具
    │   ├── cutGenerators.ts  # 切割线生成器
    │   └── puzzleUtils.ts    # 拼图操作工具
    └── rendering/            # 渲染相关工具
        └── soundEffects.ts   # 音效处理
```

## 核心模块说明

### app 目录

Next.js 15 应用路由系统的入口点。

- `page.tsx`: 应用的主页面，负责加载逻辑和动态导入主游戏界面(`GameInterface.tsx`)
- `layout.tsx`: 应用的布局组件，提供全局上下文和主题
- `globals.css`: 全局样式定义

### components 目录

包含所有React组件，包括游戏界面和UI元素。

- `loading/`: 包含 `LoadingScreen.tsx` 和 `LoadingScreenStatic.tsx` 负责加载体验。
- `GameInterface.tsx`: **主要的游戏界面组件**，整合了控制面板和画布区域 (之前名为 `curve-test-optimized.tsx`)。
- `PuzzleCanvas.tsx`: 核心画布组件，处理渲染与交互。
- `PuzzleControls.tsx`: 完整的拼图控制面板 (桌面端/平板端)。
- `PuzzleControlsCutCount.tsx`, `PuzzleControlsCutType.tsx`, `PuzzleControlsGamepad.tsx`, `PuzzleControlsScatter.tsx`: 手机端选项卡式控制面板的各个部分。
- `ShapeControls.tsx`: 形状生成控制面板。
- `theme-provider.tsx`: 提供主题切换功能。
- `ui/`: 基于Shadcn UI的基础组件库。

### contexts 目录

React Context API实现的状态管理。

- `GameContext.tsx`: 核心游戏状态管理。

### docs 目录

包含项目相关文档。

- `CONFIGURATION.MD`: 游戏配置相关说明。
- `DIFFICULTY-DESIGN.MD`: 详细描述游戏难度系统的设计与实现。
- `PROJECT_STRUCTURE.MD`: 本文档，描述项目文件结构。
- `PROMOTION.MD`: 项目推广相关的材料。

### hooks 目录

自定义React钩子函数。

- `use-mobile.tsx`: 检测移动设备。
- `use-toast.ts`: 提供轻量级通知功能。

### lib 目录

- `utils.ts`: 主要包含 `cn` 函数，用于合并 Tailwind 类名。

### public 目录

存放静态资源文件，如背景图、背景音乐和预览图。

### types 目录

- `types.ts`: 定义项目中共享的 TypeScript 类型。

### utils 目录

游戏核心逻辑和辅助功能实现。

- `shape/`: 形状生成和几何运算。
- `puzzle/`: 拼图生成和操作。
- `rendering/`: 渲染和视觉效果（目前主要是音效处理）。
- `constants.ts`: 游戏常量定义。
- `helper.ts`: 通用辅助函数。

## 开发配置说明

### React StrictMode

本项目在`next.config.mjs`中禁用了React的StrictMode，主要为了解决开发模式下旋转功能重复执行的问题。生产构建不受影响。详情请查看文件内注释。
