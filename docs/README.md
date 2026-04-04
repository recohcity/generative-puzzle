# 📚 项目文档中心 (Documentation Hub)

欢迎来到 Generative Puzzle 文档中心。本文档作为项目的**文档索引**和**完整指令手册**。

---

## � 1. 文档索引 (Document Index)

### 🌟 核心指南 (Manual Guides)
> 开发者主要参考的手动维护文档。

| 文档名称 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| **[快速开始](./GETTING_STARTED.md)** | 项目搭建、环境要求与运行指南 | 新手入门 / 环境搭建 |
| **[API 核心文档](./API_DOCUMENTATION.md)** | 核心模块设计与关键接口说明 | 查阅核心逻辑 / 接口设计 |
| **设备适配指南** | [适配系统](./configuration/adaptation-system.md) / [响应式](./configuration/device-responsive.md) | 屏幕适配、响应式参数调优 |
| **系统参数指南** | [性能](./configuration/performance.md) / [日志](./configuration/logging.md) / [构建](./configuration/build-dev.md) | 性能优化、日志级别、构建配置 |
| **核心算法配置** | [形状生成](./configuration/shape-generation.md) / [切割难度](./configuration/difficulty-cutting.md) | 生成算法逻辑参数配置 |
| **[适配监督指令](./SUPREME_ADAPTATION_DIRECTIVE.md)** | **最高级别**的跨设备适配规范 | **必须遵守**的开发准则 |
| **[当前适配系统](./CURRENT_ADAPTATION_SYSTEM.md)** | 适配技术方案与架构解析 | 理解适配实现原理 |
| **[部署指南](./GITHUB_PAGES_DEPLOYMENT.md)** | GitHub Pages 发布与工作流说明 | 上线发布 / CI配置 |
| **[game-cloud 单仓多包架构](./2026-game-cloud-monorepo-architecture.md)** | 单仓多包、同步权威顺序、删除/合规（RPC vs Edge） | `game-cloud` 重构与云端演进 |

### 📊 实时监控报告 (Auto-Generated Reports)
> 📍 所有报告均位于 `docs/reports/` 目录，由 CI/CD 或脚本自动生成，**反映真实代码状态**。

| 报告类型 | 链接 | 数据来源 | 更新指令 |
| :--- | :--- | :--- | :--- |
| **🏥 全面体检** | **[项目代码质量体检报告](./reports/Generative%20Puzzle%20项目代码质量全面体检报告.md)** | 整合所有质量数据 | `npm run quality:update-report` |
| **🔍 API 扫描** | [完整 API 列表](./reports/api-scan-report.md) | 扫描源代码 export | `npm run docs:check` |
| **🏷️ API 分类** | [API 分类统计](./reports/api-classification-report.md) | 基于命名规则分类 | `npm run classify-apis` |
| **🏗️ 项目结构** | [项目结构分析](./reports/project_structure.md) | 扫描文件树 | `npm run generate-structure` |
| **📦 依赖分析** | [依赖使用报告](./reports/dependency-analysis-report.md) | 分析 import 引用 | `npm run analyze:unused-deps` |
| **📋 代码规范** | [代码质量报告](./reports/code-quality-report.md) | ESLint/TS Check | `npm run quality:lint-report` |

---

## ⚡ 2. 指令手册 (Command Manual)

### 💻 开发调试 (Development)
```bash
# 启动开发服务器 (支持热更新, http://localhost:3000)
npm run dev

# 构建生产版本 (Next.js build)
npm run build

# 代码风格检查与修复
npm run lint          # 检查代码风格 (ESLint)
npm run format        # 自动格式化代码 (Prettier)
npm run check-format  # 仅检查格式问题
```

### 🧪 深入测试 (Advanced Testing)
```bash
# === 端到端测试 (E2E) ===
npm run test:e2e        # 运行完整 E2E 测试 (生成性能数据归档)
npm run test:report     # 查看 Playwright 测试报告 (浏览器打开)
npm run test:quality    # 仅运行质量和性能相关的 E2E 测试

# === 单元测试 (Unit) ===
npm run test:unit       # 运行所有单元测试 (Jest)

# === 覆盖率分析 ===
npm run test:coverage   # 运行测试并生成覆盖率报告
npm run coverage:report # 仅生成覆盖率报告 (不重新运行测试)

# === 针对性调试 ===
# 运行特定模块的测试
npm run test:unit -- utils/angleDisplay/
# 检查单个文件的覆盖率
npm run test:unit -- --testPathPatterns="puzzleUtils" --coverage
```

### �️ 质量保障体系 (Quality Assurance)
```bash
# === 日常检查 ===
npm run quality:check         # 运行标准质量检查 (快速扫描)
npm run quality:lint-report   # 生成代码质量详细报告 (ESLint + TypeScript)

# === 自动化生成报告 ===
npm run quality:update-report # 🏥 [核心] 生成最新全维度体检报告
                              # 包含：代码质量、覆盖率、API分析、依赖状况等
                              # 建议：每次发布版本前运行

# === CI/CD 集成 ===
npm run quality:gate          # 质量门禁 (如果未达标则报错退出)
npm run quality:ci            # 静默模式 (适合CI环境)
```

### � 文档自动化 (Documentation Tools)
```bash
npm run docs:check            # � API 完整分析 (扫描变更 + 自动分类)
npm run scan-api-changes      # 仅扫描 API 变更
npm run generate-structure    # 🏗️ 更新项目结构文档
npm run analyze:unused-deps   # 📦 扫描未使用的 npm 依赖 (生成报告)
```

### 🚀 部署发布 (Deployment)
```bash
npm run build:github    # 构建 GitHub Pages 静态版本 (输出到 out/ 目录)
npx serve out           # 本地预览静态构建结果
```

---

## 📁 目录结构说明

```
docs/
├── reports/                            # 📊 [自动生成] 各类实时监控报告
│   ├── Generative Puzzle...体检报告.md  # 核心总览报告
│   ├── api-scan-report.md              # API 扫描结果
│   ├── code-quality-report.md          # 代码质量报告
│   └── ...
├── archive/                            # 📦 [归档] 历史文档与旧版策略
├── configuration/                      # ⚙️ [手册] 各模块详细配置文档
│   ├── performance.md                  # 性能配置
│   ├── device-responsive.md            # 适配配置
│   └── ...
├── testing/                            # 🧪 [手册] 测试相关说明
├── API_DOCUMENTATION.md                # 📖 API 核心设计说明
├── GETTING_STARTED.md                  # 🚀 入门指南
├── SUPREME_ADAPTATION_DIRECTIVE.md     # 🛡️ 适配监督指令
└── README.md                           # 📎 本索引文件
```

---

## 📞 技术支持与流程

如果在使用过程中遇到问题：

1.  **📖 查看文档**: 先查看相关文档和自动生成的 API 报告
2.  **🧪 运行测试**: 使用 `npm run test:e2e` 验证功能
3.  **📊 检查质量**: 使用 `npm run quality:check` 排查问题
