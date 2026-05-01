# 🧩 Generative Puzzle

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle)
[![Live Demo](https://img.shields.io/badge/🚀-Live_Demo-brightgreen)](https://www.citylivepark.com) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel Speed Insights](https://img.shields.io/badge/Speed--Insights-Optimized-blueviolet)](https://vercel.com/speed-insights)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Version](https://img.shields.io/badge/version-1.4.15-orange.svg)]()

**基于 Next.js 15 和 React 19 构建的极致前端全栈拼图引擎**

*无限生成 • 无框悬浮 UI • 云端全服连线 • 移动端结算仪表盘与标准数字审美*

</div>

---

## 🏗️ 核心架构与生态

本项目代表了现代全栈 Web 开发的最佳实践，将响应式视觉、极致交互体验与重度核心算法优雅剥离：

- **生产环境框架**: 基于 **Next.js 15** 和 **React 19** 构建骨架。
- **云端与数据底座**: 完美集成 **Supabase** (Auth & Database)，提供多端云存档和全服竞技看板。通过 PostgreSQL RPC (`SECURITY DEFINER`) 实现原生服务器级别的权限校验。
- **UI / UX 视觉与触感升级**: 最新的 **v1.4.15** 版本引入了 **全平台“仪表盘化”结算系统 (Unified Settlement System)** 以及 **移动端全屏控制机制的深度重构**。通过将结算 UI 从原始的“账单式”重构为“分区仪表盘（Zone-based Dashboard）”，实现了从桌面大屏到移动双态（竖/横屏）的极致排版对齐与逻辑大一统，配合标准无斜线数字美学，确立了项目级的视觉工业标准。

---

## ✨ 杀手级特性系统

### ☁️ 全服数据流与云同步 (Cloud System)
- **无感跨设备存档**：基于抽象好的 `useCloudSync` 机制自动上传玩家解谜进度（包括难度评定、完赛时间与游戏统计）。
- **Global Leaderboard 全服排行榜**：按切片刀数（1-8 难度）和切割模式分组的实时竞速榜卡片。在前端通过强化的 `useMemo` 运用去重排序策略，保证频繁刷新时的极高帧率。
- **后台看板与系统化管理**：增设管理专线 (`/scores`)，实时洞察分析所有账户的游玩频次及全服热度。

### 📦 隔离部署的物理/算法层 (Monorepo)
- 拼图切割的重度多边形几何与数学计算被隔离托管至独立的包 `@generative-puzzle/game-core` 内部进行。
- 完全剥离逻辑算法和渲染引擎（Canvas GPU），使得未来的 React Native / 客户端多端跨全平台迁移成本趋近于零。

### 📐 随机多态智能切割模型
- **三模拼图切割**: 同时支援三种动态解算生成：基础直线（Line）、斜向切割（Diagonal）、以及高级仿真曲线连结（Bezier Jigsaw Curve）。
- **千变万化，唯一解题**: 巧妙利用动态加密的随机生成种子保证：即便选择相同的切片刀数，每一局所切割出的每片多边形的边缘走向、中心质心坐标在全球范围内都是毫不重复的唯一解。

---

## 🎮 人机交互与体验打磨

- **硬核触控优化手势识别**：不仅支持 PC 的快捷键映射，移动端更专门重制了多点触控（Mutli-touch）。玩家可直接靠双指甚至多指进行拼图（Two-finger rotating）、并具有边界回弹震荡动画（Bouncing animation）反馈系统。
- **音频系统与磁吸定位**：拖拽拼图接近目标吻合卡槽位时，散发出真实的“咔嗒”音效并启用阈值自动吸附（Magnetic Snap）；附带环境音乐渐入渐变音箱。
- **国际化 (i18n) 与全局无缝操作**：提供中、英双语实时无刷新热切换。配合 `framer-motion` 构筑物理级平滑视图转场。

---

## 🛠️ 技术栈一览表

| 层面 | 选用技术 / 框架 | 核心效用说明 |
|------|------|------|
| **骨干框架** | Next.js 15, React 19 | 当今最新的流式渲染 (App Router)及 React 并发特性支持 |
| **云端服务** | Supabase, Vercel | 高效的 PostgreSQL 与全球边缘节点加速支持 |
| **工程模式** | Monorepo (NPM Workspaces)| 领域驱动与依赖管控核心设计，保障项目纵向扩展自由度 |
| **基础 UI 组件**| Shadcn UI, Tailwind CSS | 原生扩展的预构积木与 Utility-first CSS 的极致原子化控制 |
| **动画/动效** | Framer Motion | 稳定 60FPS 的布局测算动画与物理惯性转场 |
| **底层绘图** | HTML5 Canvas + Web API | 面向移动设备定制的低功耗、高性能二维重叠绘制 |
| **渲染管线** | OffscreenCanvas AOT Cache | 游戏引擎级的位图缓存架构，确保百级碎片量下的 60FPS 稳定性 |

---

## 📄 许可证信息

本项目及其相关源代码遵循 [MIT 许可证](./LICENSE) 分发。

---

<div align="center">

**如果这个项目对您启发了灵感，欢迎提供建设意见甚至 PR 贡献！**

[🌟 前往 GitHub 代码仓库](https://github.com/recohcity/generative-puzzle)

</div>