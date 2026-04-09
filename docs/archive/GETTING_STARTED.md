# 🚀 快速开始指南

欢迎使用 Generative Puzzle！本指南将帮助您在 5 分钟内上手由 Next.js 15 + React 19 构建的全栈生成式拼图项目。

## 📋 环境要求

- Node.js 22+ 
- npm 或 yarn

## ⚡ 快速安装与配置

### 1. 克隆项目
```bash
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle
```

### 2. 环境变量设定（关键）
本游戏依赖云端同步功能（基于 Supabase）。请在项目根目录下创建一个 `.env.local` 文件，填入您的后端凭证：

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

> **注意**: 如果您没有填入环境变量，应用虽然可以启动，但是在点击“玩家名 / 云同步”区域时，将会因为无法建立网络连接而只能运行纯单机模式。

### 3. 安装依赖
由于本项目采用了 Monorepo 架构提取了 `@generative-puzzle/game-core` 核心依赖，您只需在根目录执行：
```bash
npm install
```
根级的安装系统会自动链接 `packages/game-core`。

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 打开浏览器
访问 [http://localhost:3000](http://localhost:3000) 查看项目。

---

## 🏗️ 架构导航图 (Architecture Navigation)

面对繁杂的代码库，新开发者可以按以下路径快速定位核心逻辑：

### 🔌 游戏纯核心库 (packages/game-core/)
所有与 React 无关、可以纯粹被单元测试覆盖的无头(Headless)逻辑都在这里：
- **计分计算**: `/src/score/scoreComputer.ts`
- **几何与切割模型**: `/src/puzzle/cutGeneratorGeometry.ts`
- **碰撞与坐标系**: `/src/physics/*`

### ⚛️ 视图与状态桥层 (根目录 /hooks, /contexts)
- **物理反弹引擎**: `hooks/usePhysicsBounds.ts` 承载了游戏边框弹跳特效与画布尺寸监控。
- **云端与存储**: `hooks/useCloudSync.ts`、`utils/cloud/CloudGameRepository.ts`。实现了安全地将本地 IndexedDB / LocalStorage 上推到 Supabase 的能力。
- **UI 状态**: `contexts/GameContext.tsx` 承载核心界面变量交互流转。

### 🖱️ 交互绘制渲染 (utils/rendering)
- **画布底层绘制**: `utils/rendering/puzzleDrawing.ts` 这里利用 HTML5 Canvas 绘制不规则的多边形切割片，及高亮的“拟物”浮雕阴影特效。

---

## 🛠️ 下一步指南

如果您想要全面深入理解系统是如何控制复杂的渲染周期和保护玩家存档数据的，请阅读最高指导架构文献：

- [☁️ 核心云架构指南](./2026-game-cloud-monorepo-architecture.md)
  
当您完全理解架构脉络后，就可以直接修改文件，保存后 Next.js 的 Fast Refresh 将立即响应您的创作！祝开发愉快！🎉