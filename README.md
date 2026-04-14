# 🧩 Generative Puzzle

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle)
[![Live Demo](https://img.shields.io/badge/🚀-Live_Demo-brightgreen)](https://www.citylivepark.com) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel Speed Insights](https://img.shields.io/badge/Speed--Insights-Optimized-blueviolet)](https://vercel.com/speed-insights)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)

**基于 Next.js 15 和 React 19 构建的专业级生成式拼图引擎**

*无限生成 • 线性/曲线切割 • 云端全同步 • 移动端极速性能调优*

</div>

---

## 🏗️ 核心架构与部署

本项目采用现代全栈架构，确保算法性能与交互体验的极致融合：

- **生产环境**: 部署于 **Vercel**，完美集成 **Supabase** (Auth & Database) 提供持久化云端存档。
- **性能监控**: 接入 **Vercel Speed Insights**，持续针对真实用户体验（RUM）进行专项优化。
- **独占域名**: [www.citylivepark.com](https://www.citylivepark.com)

---

## 🌊 最新演进 (v1.3.80)

### ⚡ 移动端性能霸权 (Mobile Performance Taming)
在 v1.3.80 版本中，我们针对移动端主线程占用（TBT/INP）进行了深度外科手术式优化：

- **主线程减压调度**: 将 `LoadingScreen` 的 React 渲染频率从 60Hz 降频至约 7Hz，并将平滑轨迹交给 GPU 硬件加速 (CSS Transitions)，彻底释放了关键加载期的 CPU 算力，显著提升 LCP。
- **120Hz 交互动态节流**: 针对 iPad Pro 等高刷设备，在 `usePuzzleInteractions` 钩子中引入了基于时间戳的防抖节流 (Throttling)，将冗余交互指令严格锁定在 60FPS 黄金分割线，大幅降低 INP 延迟。

### 🏆 跨平台得分 UI 标准化 (Unified Score UI)
- **极简扁平化设计**: 统一了移动端与桌面端的结算界面，采用全新的紧凑型扁平列表。
- **零滚动布局**: 针对移动端横屏模式优化了垂直间距（Leading-none），确保在极窄高度下亦能实现一屏展示完整战报。
- **视觉一致性**: 全量采用符合品牌美学的 `#FFD5AB` 统一着色方案。

---

## ✨ 核心特性

### ☁️ 云端联机同步 (Cloud Sync)
- **无感多端同步**：通过 `useCloudSync` 架构实现游戏进程全自动存档。
- **全服竞技排行榜**：1-8 难度级动态刷新，支持个人成绩与全服榜单切换。
- **合规性管理**：采用 PostgreSQL RPC (`SECURITY DEFINER`) 实现服务器端权限校验，确保数据安全。

### 📦 物理隔离算法层 (Monorepo)
- 核心几何算法托管于独立包 `@generative-puzzle/game-core`。
- 切割算子、计分矩阵与视图层完全解耦，支持未来的多端（如 React Native）平滑迁移。

### ✨ 智能切割算法
- **三模形态**: 支持直线、斜线、以及基于贝塞尔曲线的**曲线切割模式**。
- **动态难度**: 实时生成互锁拼图路径，确保每一场对局都是全球唯一的几何解。

---

## 🎮 游戏交互亮点
- **灵动微交互**：磁性智能归位、真实的碰撞物理音频反馈、拟物阴影动效。
- **多维度评分系统**：计算模型涵盖了步数、旋转频率、提示请求及完成时长，引导玩家探索全局最优路径。
- **全设备适配**：PC 端极速响应，移动端响应式触控，针对 iOS Safari 的视口缩放问题实现了 16px 基准加固。

---

## 🛠️ 技术栈一览

| 类别 | 技术 | 说明 |
|------|------|------|
| **骨干框架** | Next.js 15, React 19 | 当前最前沿的 React 服务端渲染与全栈能力 |
| **云端底座** | Supabase, Vercel | PostgreSQL 实时库与边缘网络加速 |
| **工程模式** | Monorepo (NPM Workspaces) | 领域驱动设计 (DDD)，核心逻辑与业务剥离 |
| **样式与动效** | Tailwind CSS, Motion | 极致的视觉表达与 60FPS 转场效果 |
| **渲染引擎** | HTML5 Canvas + GPU | 针对移动端定制的低功耗、高性能绘图底座 |

---

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

<div align="center">

**发现 Bug 或有好的建议？欢迎提交 Issue 或 PR！**

[🌟 GitHub Repository](https://github.com/recohcity/generative-puzzle)

</div>