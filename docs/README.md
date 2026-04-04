# 📚 项目文档中心 (Documentation Hub)

欢迎来到 Generative Puzzle 文档中心。本文档作为项目的**文档索引**和**核心架构指南**。

---

## 🏗️ 1. 文档索引 (Document Index)

### 🌟 核心指南 (Manual Guides)
> 开发者参考的核心维护文档，确立了项目的工程基准。

| 文档名称 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| **[🚀 快速开始](./GETTING_STARTED.md)** | 项目本地跑通、环境配置与 Vercel/Supabase 联调指南 | 新手入门 / 环境搭建 |
| **[📖 产品需求文档 (PRD)](./PRD_生成式拼图游戏.md)** | 包含业务逻辑、拼图演化史、云存档设计与商业化路径 | 理解产品全貌 |
| **[⚖️ 统一规则文档](./game-rules-unified.md)** | 分数计算公式、难度梯度映射、曲线切割算法定义 | 查阅计算逻辑 |
| **[☁️ 云端架构深度指南](./2026-game-cloud-monorepo-architecture.md)** | 详细描述 `game-cloud` 阶段的 Monorepo 架构与数据同步方案 | 深入理解云端底层 |
| **[🧐 架构评审报告](./2026-game-cloud-architecture-review.md)** | 对 `game-cloud` 整合过程的技术债务与安全性评估 | 架构演进参考 |
| **[🗺️ 项目路线图](./2026-game-only-and-game-cloud-roadmap.md)** | `game-only` 时期到 `game-cloud` 时代的路线发展预测 | 查阅愿景规划 |
| **[🖼️ 图标配置说明](./icon-configuration.md)** | 游戏中各类图形元素与 SVG 资源的使用规范 | UI/UX 设计参考 |
| **[🌍 国际化手册](./i18n/README.md)** | 描述如何扩展翻译键、多语言切换的 Context 实现 | 增加新语言 |

### 🛠️ 数据库脚本 (SQL Infrastructure)
> 云端存储基准，建议在 Supabase SQL Editor 中执行。

- **[game-cloud-supabase-mvp.sql](./game-cloud-supabase-mvp.sql)**: 核心表结构、RLS 安全策略与榜单视图。
- **[clear-sessions-rpc.sql](./clear-sessions-rpc.sql)**: 安全注销专用 RPC 函数定义。

---

## ⚡ 2. 指令手册 (Command Manual)

本项目已全面简化其任务流，专注于 Next.js 高效开发。

### 💻 开发调试 (Development)
```bash
# 启动本地开发服务器 (支持极速热更新, http://localhost:3000)
npm run dev

# 构建生产版本 (Next.js build, 包含全包编译与 CSS 压缩)
npm run build

# 启动构建后的本地服务 (用于预览生产环境表现)
npm run start

# 代码规范扫描 (ESLint)
npm run lint
```

> **注意**: 旧版本的 `test:e2e`, `test:unit` 及 `quality:*` 系列指令由于底层工具链清理（移除 Jest/Playwright 以减负）目前已失效。建议开发者通过 `dev` 模式实时观测 UI 表现，或在 `packages/game-core` 内部进行算法侧验证。

---

## 📁 目录结构摘要

```
docs/
├── 2026-game-cloud-...          # 云端及 Monorepo 深度架构文献
├── PRD_生成式拼图游戏.md            # 产品原始定义文档
├── game-rules-unified.md         # 权威规则与公式定义
├── game-cloud-supabase-mvp.sql  # 数据库基准脚本
├── GETTING_STARTED.md            # 快速起步
└── README.md                     # 本文档 (索引汇总)
```

---

## 📞 系统状态与维护

由于处于 `game-cloud` 稳定阶段，所有的部署与构建均由 **Vercel** 自动处理。如需查看最新性能指标（RUM），请前往 Vercel 控制台对应的 **Speed Insights** 面板。
