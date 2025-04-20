# 项目结构分析

本文档概述了项目的目录结构以及关键文件和文件夹的用途。

```
.
├── .git/                  # Git 版本控制文件 (通常隐藏)
├── .next/                 # Next.js 构建输出和缓存 (自动生成)
├── .DS_Store              # macOS 特定文件 (可忽略)
├── app/                   # Next.js App Router 目录
│   ├── globals.css        # 全局 CSS 样式 (Tailwind + Shadcn 基础样式)
│   ├── layout.tsx         # 应用程序的根布局组件 (包含 ThemeProvider)
│   └── page.tsx           # 主页面组件 (渲染 curve-test-optimized)
├── components/            # 应用程序中使用的 React 组件
│   ├── ui/                # Shadcn UI 组件 (通过 CLI 添加)
│   │   ├── accordion.tsx      # 手风琴效果组件
│   │   ├── alert-dialog.tsx   # 警告对话框组件
│   │   ├── alert.tsx          # 警告提示组件
│   │   ├── aspect-ratio.tsx   # 宽高比容器组件
│   │   ├── avatar.tsx         # 用户头像组件
│   │   ├── badge.tsx          # 徽章/标签组件
│   │   ├── breadcrumb.tsx     # 面包屑导航组件
│   │   ├── button.tsx         # 按钮组件 (游戏中可能用到)
│   │   ├── calendar.tsx       # 日历选择组件
│   │   ├── card.tsx           # 卡片布局组件
│   │   ├── carousel.tsx       # 轮播/走马灯组件
│   │   ├── chart.tsx          # 图表组件 (可能是封装)
│   │   ├── checkbox.tsx       # 复选框组件
│   │   ├── collapsible.tsx    # 可折叠内容区域组件
│   │   ├── command.tsx        # 命令面板/搜索框组件
│   │   ├── context-menu.tsx   # 右键菜单组件
│   │   ├── dialog.tsx         # 对话框/模态框组件
│   │   ├── drawer.tsx         # 抽屉式导航/侧边栏组件
│   │   ├── dropdown-menu.tsx  # 下拉菜单组件
│   │   ├── form.tsx           # 表单处理相关组件
│   │   ├── hover-card.tsx     # 悬停卡片提示组件
│   │   ├── input-otp.tsx      # 一次性密码输入框组件
│   │   ├── input.tsx          # 输入框组件
│   │   ├── label.tsx          # 表单标签组件 (游戏中可能用到)
│   │   ├── menubar.tsx        # 顶部菜单栏组件
│   │   ├── navigation-menu.tsx# 导航菜单组件
│   │   ├── pagination.tsx     # 分页组件
│   │   ├── popover.tsx        # 弹出框/气泡提示组件
│   │   ├── progress.tsx       # 进度条组件
│   │   ├── radio-group.tsx    # 单选按钮组组件 (游戏中用到)
│   │   ├── resizable.tsx      # 可调整大小的面板组件
│   │   ├── scroll-area.tsx    # 自定义滚动条区域组件
│   │   ├── select.tsx         # 下拉选择框组件
│   │   ├── separator.tsx      # 分隔线组件
│   │   ├── sheet.tsx          # 侧边弹出表单/面板组件
│   │   ├── sidebar.tsx        # 侧边栏组件
│   │   ├── skeleton.tsx       # 骨架屏加载状态组件
│   │   ├── slider.tsx         # 滑块输入组件 (游戏中用到)
│   │   ├── sonner.tsx         # Toast/通知组件 (Sonner 库)
│   │   ├── switch.tsx         # 开关切换组件
│   │   ├── table.tsx          # 表格组件
│   │   ├── tabs.tsx           # 标签页切换组件
│   │   ├── textarea.tsx       # 多行文本输入框组件
│   │   ├── toast.tsx          # Toast/通知样式组件
│   │   ├── toaster.tsx        # Toast/通知容器组件
│   │   ├── toggle-group.tsx   # 切换按钮组组件
│   │   ├── toggle.tsx         # 单个切换按钮组件
│   │   └── tooltip.tsx        # 工具提示/文字提示组件
│   ├── PuzzleCanvas.tsx     # 负责渲染拼图画布的组件 (使用原生 Canvas API)
│   ├── PuzzleControls.tsx   # 拼图游戏控制组件 (切割类型、次数、重置等)
│   ├── ShapeControls.tsx    # 用于选择和生成基础拼图形状的组件
│   └── theme-provider.tsx # next-themes 的 ThemeProvider 封装 (用于 app/layout.tsx)
├── contexts/              # 用于全局状态管理的 React context providers
│   └── GameContext.tsx    # 管理拼图游戏状态和逻辑的 Context
├── hooks/                 # 自定义 React hooks
│   ├── use-mobile.tsx     # 用于检测移动设备的 Hook (被 components/ui/sidebar.tsx 使用)
│   └── use-toast.ts       # 与 Shadcn UI toast 通知相关的 Hook (被 components/ui/toaster.tsx 使用)
├── lib/                   # 库/工具函数 (通常是共享的工具)
│   └── utils.ts           # 工具函数，包含 `cn` 用于 Tailwind 类名合并 (Shadcn UI 依赖)
├── node_modules/          # 项目依赖项 (通过 npm/yarn 安装)
├── public/                # 直接提供服务的静态资源
│   └── puzzle-preview.png # 拼图游戏的预览图片
├── types/                 # 自定义 TypeScript 类型定义
│   └── types.ts           # 包含项目的共享类型定义 (Point, PuzzlePiece, Enums)
├── utils/                 # 工具函数，主要用于游戏逻辑
│   ├── constants.ts       # 游戏相关的常量值
│   ├── cutGenerators.ts   # 生成不同类型拼图切割的函数
│   ├── geometryUtils.ts   # 几何计算工具函数 (点、线、多边形)
│   ├── helper.ts          # 通用游戏辅助函数
│   ├── PuzzleGenerator.ts # 根据形状和切割生成最终拼图块的类或函数
│   ├── puzzleUtils.ts     # 特定于拼图状态管理或操作的工具函数
│   ├── ScatterPuzzle.ts   # 在画布上散开拼图块的逻辑
│   ├── ShapeGenerator.ts  # 生成基础形状 (多边形、曲线) 的类或函数
│   └── soundEffects.ts    # 游戏过程中播放音效的函数
├── .gitignore             # 指定 Git 应忽略的、故意不跟踪的文件
├── components.json        # Shadcn UI 组件的配置文件
├── curve-test-optimized.tsx # 协调拼图游戏 UI (设置 + 画布) 的主组件
├── next-env.d.ts          # Next.js 环境变量的 TypeScript 声明文件
├── next.config.mjs        # Next.js 配置文件 (使用 ES Module 语法)
├── package-lock.json      # 记录依赖项的精确版本
├── package.json           # 项目清单：元数据、依赖项、脚本
├── postcss.config.mjs     # PostCSS 配置文件 (Tailwind CSS 使用)
├── project_structure.md   # 本项目结构分析文档
├── README.md              # 项目描述、设置说明等
├── tailwind.config.ts     # Tailwind CSS 配置文件
└── tsconfig.json          # TypeScript 编译器配置
```

## 结构说明与注意事项

*   **代码整洁度:** 项目结构现在比较清晰，冗余和错位的文件已被移除。
*   **核心逻辑:** 主要的游戏逻辑位于 `contexts/GameContext.tsx` 和 `utils/` 目录下的各个工具函数/类中。
*   **UI 组件:** 核心游戏 UI 组件位于 `components/` 目录下 (`PuzzleCanvas.tsx`, `PuzzleControls.tsx`, `ShapeControls.tsx`)。`components/ui/` 目录包含通过 Shadcn UI CLI 添加的标准 UI 库组件，虽然目前并非所有组件都在拼图游戏中明确使用，但它们是 UI 库的一部分，通常会保留以备将来使用或扩展。
*   **依赖项:** 项目主要依赖 Next.js, React, TypeScript, Tailwind CSS, Shadcn UI, next-themes, 以及用于音效的 `howler` (推测，基于 `soundEffects.ts`)。
*   **渲染:** 拼图画布使用原生 HTML Canvas API 进行绘制，而非 Konva.js。
