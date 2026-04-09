# 🧩 Generative Puzzle

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle) 
[![Live Demo](https://img.shields.io/badge/🚀-Live_Demo-brightgreen)](https://www.citylivepark.com) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Core Web Vitals](https://img.shields.io/badge/LCP-4.5s-orange.svg)](https://vercel.com/speed-insights)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)

**基于 Next.js 15 和 React 19 构建的企业级生成式拼图游戏**

*无限生成 • 曲线切割 • 云端全同步 • LCP 4.5s 极速体验*

</div>

---

## 🏗️ 双产品形态策略 (Branch Flavors)

本项目在同一 Git 仓库中通过不同分支提供截然不同的产品体验，确保核心算法共用的同时，满足不同场景下的数据隐私需求：

- **`main` (云端增强版 / Cloud-Enhanced)**:
  - **核心**: 完整接入 Supabase 认证与同步队列、Vercel 性能监控。
  - **场景**: 正式线上运营、排行榜竞技、跨端数据一致。
- **`game-only` (纯净单机版 / Standalone)**:
  - **核心**: 物理剥离云端 SDK，仅保留 LocalStorage。
  - **场景**: 静态站点发布 (GitHub Pages)、极致隐私环境、极速本地离线。

---

## 🌊 最新特性 

### ☁️ 云端联机同步 (Cloud Sync)
本项目主线已运行在高度解耦的 **useCloudSync** 架构下，提供全方位无感云端体验：
- **无缝联机存档**：多设备共享游戏进程，支持强力的离线队列保护（断网游玩不丢成绩，联机后自动增量补齐）。
- **全服公开榜单**：1-8 难度级均设立动态刷新的全服排行榜。
- **隐私级安全合规**：废弃客户端直连删除权限，采用 `SECURITY DEFINER` 的 Postgres RPC。

### 📦 防腐层引擎架构 (Monorepo)
引入 Monorepo 体系将纯计算骨架提取到 `@generative-puzzle/game-core` 独立包：
- 完美隔离计分矩阵、物理几何碰壁引擎与切割算子。
- 彻底斩断了与视图层（React DOM）的交叉依赖，确保算法在多分支间的通用性。

### ♿ 无障碍与工程化标准 (Accessibility & Engineering)
本项目在 v1.3.78 版本完成了全方位的工程化加固，确保在任何严苛环境下都能提供一致的专业级体验：
- **无障碍优先架构 (A11y)**：遵循 W3C 标准重构了语义化标题结构（h1-h2-h3），全面支持屏幕阅读器索引。
- **智能视口管理 (Anti-Zoom)**：针对 iOS/Safari 特有的输入框自动放大机制，实现了 16px 强制基准与动态视口智能重置算法，彻底解决了移动端顽固的布局缩放问题。
- **纯净化 Reducer 代码审计**：完成了 `GameReducer` 的 100% 纯净化改造，剥离所有 Side Effects，实现了游戏核心逻辑的理论可测试性。
- **双语标准化 Wiki**：建立了工程级的 [系统 Wiki](./docs/WIKI.md)，作为项目唯一的事实来源（SSO）。

### ✨ 曲线切割模式 (Curve Mode)
基于**贝塞尔曲线**和**图论网络**的算法，支持生成如行云流水般的互锁拼图线条：
- 严格的面积守恒与拓扑完整性验证，每一块碎片都完美契合。

---

## ✨ 核心亮点

### 🎨 无限生成引擎
- **多变形状**：支持纯多边形、手绘云朵、锯齿闪电等多种基础外观边框。
- **动态难度系统**：直线、斜线、**曲线**三种切割模式交叉，1-8 级动态生成组合，您永远不会两次玩到完全一样的同一张拼图。

### 🏆 极致性能标准
- **4.5s LCP (Largest Contentful Paint)**：针对移动端低功耗设备进行的专项调优（已适配 Font Swap / Bundle Shrink）。
- 核心算法执行时长 <100ms，全流程 55+FPS，无惧大型画布。
- **SWC 优化构建**：利用 Next.js 15 编译器实现极致资源压缩，支持 Vercel Speed Insights 深度监测。

### 🎮 极致游戏交互与适配
- **全场景响应式布局**：深度优化了**移动端横屏模式**下的垂直空间利用率，排行榜采用单行流式排版，确保在短屏幕高度下依然能清晰展示全服竞技数据。
- **跨设备深度适配**：PC 端精准吸附，移动端响应式触控，针对 iPad 和异形屏做了深度优化的 PWA 沉浸式支持。
- **深度多维评分**：您的成绩不再只论快慢！结合游戏步数、旋转次数、请求提示和完成时长的多维度加权公式，引导对全局最优解的探索思考。
- **灵动微交互**：磁性归位、碰撞物理反馈、拟物阴影以及真实清脆的音效系统。

---

## 🎯 快速开始

本项目依赖环境变量来激活云端引擎。请移步阅读项目 Wiki 了解详情：

👉 **[🚀 项目 Wiki 与文档总览](./docs/README.md)**

---

## 🛠️ 技术栈一览

| 类别 | 技术 | 说明 |
|------|------|------|
| **骨干框架** | Next.js 15, React 19 | 全栈基石与高性能渲染 |
| **语言规范** | TypeScript 5.0 | 全量类型安全保障 |
| **云端底座** | Supabase, Vercel | 提供 PostgreSQL 实时数据与 Edge 全球加速 |
| **工程模式** | Monorepo | 业务逻辑与基础设施物理隔离 |
| **UI与动画** | Tailwind CSS, Framer Motion | 极致的视觉体验与微动效 |
| **画布引擎** | HTML5 Canvas API | 轻量化、高性能的自定义绘图底座 |

---

## 📚 项目知识库 (Wiki)

想要深入理解项目的系统架构、技术演进及最近更新？请访问我们的 Wiki：

- **[📖 最新项目 Wiki (WIKI.md)](./docs/WIKI.md)**：包含系统架构、核心模块说明、开发规范及 2026 年 4 月最新技术进展报告。
- **[📂 文档归档 (Archive)](./docs/archive/)**：查阅历史 PRD、早期架构评审及设计草案。

---

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

<div align="center">

**喜欢这个项目？给我们一个 ⭐ Star 吧！**

[🌟 GitHub Repository](https://github.com/recohcity/generative-puzzle)

</div>