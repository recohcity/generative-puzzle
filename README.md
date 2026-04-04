# 🧩 Generative Puzzle

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle) 
[![Live Demo](https://img.shields.io/badge/🚀-Live_Demo-brightgreen)](https://www.citylivepark.com) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)

**基于 Next.js 15 和 React 19 构建的企业级生成式云端拼图游戏**

*无限生成 • 曲线切割 • 云端存档 • 3端完美适配*

</div>

---

## 🌊 最新特性 

### ☁️ 云端联机同步 (Cloud Sync & Supabase)
本项目目前已运行在正式的 `game-cloud` 架构下，提供全方位无感云端体验：
- **无缝联机存档**：多设备共享游戏进程，支持强力的离线队列保护（断网游玩不丢成绩，联机后自动增量补齐）。
- **全服公开榜单**：1-8 难度级均设立动态刷新的全服排行榜。
- **隐私级安全合规**：废弃客户端直连删除权限，采用 `SECURITY DEFINER` 的 Postgres RPC，让游戏历史记录注销绝对安全。

### 📦 防腐层引擎架构 (Monorepo)
引入 Monorepo 体系将纯计算骨架提取到 `@generative-puzzle/game-core` 独立包：
- 完美隔离计分矩阵、物理几何碰壁引擎与切割算子。
- 彻底斩断了与视图层（React DOM）的交叉依赖，大大提升代码复用与渲染纯度。

### ✨ 曲线切割模式 (Curve Mode)
基于**贝塞尔曲线**和**图论网络**的算法，支持生成如行云流水般的互锁拼图线条：
- 严格的面积守恒与拓扑完整性验证，每一块碎片都完美契合。

---

## ✨ 核心亮点

### 🎨 无限生成引擎
- **多变形状**：支持纯多边形、手绘云朵、锯齿闪电等多种基础外观边框。
- **动态难度系统**：直线、斜线、**曲线**三种切割模式交叉，1-8 级动态生成组合，您永远不会两次玩到完全一样的同一张拼图。

### 🏆 企业级卓越性能
- 核心算法执行时长 <100ms，JS 环境内存占用极低。
- 全流程 55+FPS，无惧大型画布与多层级浮雕渲染。
- Webpack 编译产物体积极致压缩。

### 🎮 极致游戏交互
- **跨设备深度适配**：PC 端精准吸附，移动端响应式触控，针对 iPad 和异形屏做了深度优化的 PWA 沉浸式支持。
- **深度多维评分**：您的成绩不再只论快慢！结合游戏步数、旋转次数、请求提示和完成时长的多维度加权公式，引导对全局最优解的探索思考。
- **灵动微交互**：磁性归位、碰撞物理反馈、拟物阴影以及真实清脆的音效系统。

---

## 🎯 快速开始

本项目极度依赖 `.env` 来激活云端引擎。请移步阅读专属的 5 分钟跑通指南：

👉 **[🚀 快速起步与环境配置指南](./docs/GETTING_STARTED.md)**

---

## 🛠️ 技术栈一览

| 类别 | 技术 | 说明 |
|------|------|------|
| **骨干框架** | Next.js 15, React 19 | 全栈基石与高并发并发渲染挂载 |
| **语言规范** | TypeScript 5.0 | P0 级系统类型安全防火墙 |
| **云端底座** | Supabase, Vercel | 提供 PostgreSQL 实时数据与 Edge 全球加速、状态透传 |
| **工程模式** | Monorepo (npm workspaces) | 前后端逻辑高度隔离的工业规范 |
| **UI与动画** | Tailwind CSS, Framer Motion | 快速堆叠与 GPU 硬件加速的微动效 |
| **画布引擎** | HTML5 Canvas API | 主引擎不依赖三方引擎，实现最轻量绘图底座 |

---

## 📚 项目知识库 (Wiki)

想要深入理解项目的系统运作原理？请翻阅如下核心技术基建指南：

- **[🏛️ 2026 核心架构设计思想](./docs/2026-game-cloud-monorepo-architecture.md)**：为什么采用 Monorepo 以及同步权威控制方案是如何处理掉包逻辑的。
- **[📝 Generative Puzzle PRD](./docs/PRD_生成式拼图游戏.md)**：包含本款产品的初心愿景、商业化推测和业务全貌记录。
- **[⚖️ 分数与难度机制深度解析](./docs/game-rules-unified.md)**：想了解如何挑战 99 分极速榜？欢迎了解我们内部的算分公式。

---

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

<div align="center">

**喜欢这个项目？给我们一个 ⭐ Star 吧！**

[🌟 GitHub Repository](https://github.com/recohcity/generative-puzzle)

</div>