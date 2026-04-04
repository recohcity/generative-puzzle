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

### ✨ 曲线切割模式 (Curve Mode)
引入了基于**贝塞尔曲线**和**图论网络**的全新切割算法，支持生成优雅流畅的互锁曲线拼图。
- **视觉升级**：告别单一的直线，体验如行云流水般的拼图线条。
- **算法保障**：严格的面积守恒与拓扑完整性验证，确保每一块拼图都完美契合。

---

## ✨ 核心亮点

### 🎨 无限生成引擎
- **多变形状**：支持多边形、云朵形、锯齿形等多种基础外观。
- **智能切割**：支持直线、斜线、**曲线**三种切割模式，结合 1-8 级难度动态生成。
- **每一局都独一无二**：纯算法实时生成，永远不会玩到两局完全相同的拼图。

### 🏆 企业级代码质量
- **A+ 质量标准**：核心算法 100% 覆盖。
- **卓越性能**：形状生成 <100ms，内存占用 **<10MB (JS Heap)**，全流程 55+fps 流畅渲染。
- **坚如磐石**：通过 1400+ 个单元测试与全新的 **Phased E2E** 自动化评测流程。

### 🎮 极致游戏体验
- **3端深度适配**：桌面端、移动端、iPad（针对 Safari dvh 优化），支持 **PWA 沉浸式全屏**。
- **深度评分系统**：基于时间、步数、旋转效率的多维度评分，挑战最优解。
- **沉浸交互**：磁吸归位、物理回弹、动态阴影、真实音效反馈。

---

## 🎯 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装运行
```bash
# 克隆项目
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

---

## 🛠️ 技术栈一览

| 类别 | 技术 | 说明 |
|------|------|------|
| **核心框架** | Next.js 15, React 19 | 最新全栈架构 |
| **语言** | TypeScript 5.0 | 全类型安全保障 |
| **样式** | Tailwind CSS, Shadcn UI | 现代化响应式设计 |
| **渲染** | HTML5 Canvas API | 高性能图形处理 |
| **测试** | Playwright, Jest | 全链路自动化测试 |

---

## 📊 质量与测试

本项目执行严格的代码质量标准：

| 指标 | 状态 | 说明 |
|------|------|------|
| **测试覆盖率** | **99.22%** | A+ 级别完美覆盖 |
| **TypeScript** | **0 Errors** | 严格模式编译通过 |
| **Linting** | **Pass** | ESLint 代码规范检查 |
| **整体评分** | **98/100** | v1.3.73 综合体检评定 |

### 常用命令
```bash
npm run test:e2e      # 运行 E2E 测试
npm run test:unit     # 运行单元测试
npm run test:coverage # 查看覆盖率报告
npm run quality:check # 运行全项目质量检查
```

---

## 📚 文档资源

- **[📚 文档中心](./docs/README.md)**：项目文档总索引与指令手册。
- **[🏥 项目体检报告](./docs/reports/Generative%20Puzzle%20项目代码质量全面体检报告.md)**：最新的 A+ 级质量分析。
- **[🎮 规则说明](./docs/game-rules-unified.md)**：详细的难度与评分算法说明。
- **[📱 适配规范](./docs/SUPREME_ADAPTATION_DIRECTIVE.md)**：跨设备适配开发准则。

---

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

<div align="center">

**喜欢这个项目？给我们一个 ⭐ Star 吧！**

[🌟 GitHub Repository](https://github.com/recohcity/generative-puzzle)

</div>