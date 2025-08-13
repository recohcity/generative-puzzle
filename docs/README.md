# 📚 项目文档中心

欢迎来到 Generative Puzzle 项目文档中心！这里包含了项目的核心文档和完整的开发指令说明。

## 🚀 快速导航

### 📖 核心文档
- **[快速开始](./GETTING_STARTED.md)** - 5分钟上手指南
- **[API文档](./API_DOCUMENTATION.md)** - 完整的API参考手册 (151个API)
- **[项目体检报告](./PROJECT_HEALTH_REPORT.md)** - 🏥 最高级别全面体检 (A+级别)
- **[当前适配系统](./CURRENT_ADAPTATION_SYSTEM.md)** - 最新适配技术方案详解
- **[项目结构](./project_structure.md)** - 完整的项目架构
- **[配置指南](./configuration/)** - 环境配置和部署
- **[测试文档](./testing/)** - Playwright自动化测试系统
- **[GitHub Pages部署](./GITHUB_PAGES_DEPLOYMENT.md)** - 完整的部署管理指南
- **[难度设计](./difficulty-design.md)** - 游戏难度设计文档

### 🎯 监督指令
- **[最高级别监督指令](./SUPREME_ADAPTATION_DIRECTIVE.md)** - 项目开发的最高指导原则

### 🏥 项目健康报告
- **[项目全面体检报告](./PROJECT_HEALTH_REPORT.md)** - 最高级别全面分析 (A+级别，99/100分)

## 🛠️ NPM 指令完整说明

### 🚀 开发服务器
```bash
# 启动开发服务器
npm run dev

# 构建开发版本（支持npm run start）
npm run build

# 构建GitHub Pages静态导出版本
npm run build:github

# 启动生产服务器
npm run start

# 预览静态导出版本
npx serve@latest out
```

### 🧪 测试相关
```bash
# 运行 Playwright E2E 测试
npm test

# 运行 E2E 测试并归档结果（推荐）
npm run test:e2e

# 查看最新测试报告
npm run test:report

# 运行单元测试
npm run test:unit

# 运行性能和质量相关的 E2E 测试
npm run test:quality

# 检查单元测试覆盖率
npm run test:unit -- --coverage --coverageReporters=text
npm run test:unit -- --coverage --silent --no-cache
npm run test:unit -- --coverage --silent

# 单元测试覆盖率报告生成
npm run coverage:report

# 单个文件覆盖率检查
npm run test:unit -- --testPathPatterns="puzzleUtils" --coverage --coverageReporters=text


```
### 🔍 代码质量
```bash
# ESLint 代码检查
npm run lint
npx tsc --noEmit

# 格式化代码
npm run format

# 检查代码格式
npm run check-format
```

### 📊 质量系统
```bash
# 标准质量检查（开发环境）
npm run quality:check

# 质量门禁检查
npm run quality:gate

# 生成质量报告
npm run quality:report

# 详细质量检查（调试用）
npm run quality:verbose

# CI/CD 静默模式质量检查
npm run quality:ci
```

### 📚 文档管理
```bash
# 生成项目结构文档
npm run generate-structure
# 别名：npm run docs:structure

# 扫描 API 变更
npm run scan-api-changes
# 别名：npm run docs:scan

# 完整 API 分析（扫描 + 分类）⭐ 推荐
npm run docs:check

# 单独运行 API 分类
npm run classify-apis

# 整理文档结构
npm run organize-docs

# 确认所有自动生成文件被正确忽略
./scripts/check-gitignore.sh
```
## 📁 目录结构

```
docs/
├── README.md                           # 📚 文档中心首页（本文件）
├── GETTING_STARTED.md                  # 🚀 快速开始指南
├── API_DOCUMENTATION.md                # 📖 完整的API参考手册
├── CURRENT_ADAPTATION_SYSTEM.md        # 🔧 当前适配系统技术方案
├── GITHUB_PAGES_DEPLOYMENT.md          # 🚀 GitHub Pages部署管理指南
├── project_structure.md                # 🏗️ 项目结构文档（自动生成）
├── api-scan-report.md                  # 🔍 API扫描报告（自动生成）
├── api-classification-report.md        # �️ 戏API分类报告（自动生成）
├── difficulty-design.md                # 🎮 游戏难度设计文档
├── SUPREME_ADAPTATION_DIRECTIVE.md     # �️ 最高级别监督指令
├── PRD_生成式拼图游戏.md                # 📋 产品需求文档
├── configuration/                      # ⚙️ 配置相关文档
│   └── ...
├── testing/                           # 🧪 测试相关文档
│   ├── README.md                      # 测试文档索引
│   └── playwright-automation.md       # Playwright自动化测试系统
├── i18n/                              # 🌍 国际化文档
└── audio/                             # 🔊 音频相关文档
```

## 🔍 文档搜索指南

### 按功能查找
- **🔌 API相关**: 搜索 "API"、"Hook"、"Manager"、"Service"
- **⚙️ 配置相关**: 搜索 "Config"、"Adaptation"、"Device"、"Thresholds"
- **🧪 测试相关**: 搜索 "Test"、"E2E"、"Performance"、"Playwright"
- **🛠️ 开发相关**: 搜索 "Development"、"Debug"、"Quality"
- **🎮 游戏相关**: 搜索 "Puzzle"、"Shape"、"Canvas"、"Interaction"

### 按文档类型查找
- **📖 指南类**: `GETTING_STARTED.md`、`configuration/`
- **📚 参考类**: `API_DOCUMENTATION.md`、`project_structure.md`
- **📊 报告类**: `api-scan-report.md`、`api-classification-report.md`
- **🛡️ 规范类**: `SUPREME_ADAPTATION_DIRECTIVE.md`

## 🛠️ 文档维护说明

### 🤖 自动生成的文档
以下文档由工具自动生成，**请勿手动编辑**：
- `project_structure.md` - 由 `npm run docs:structure` 生成
- `api-scan-report.md` - 由 `npm run docs:check` 生成
- `api-classification-report.md` - 由 `npm run docs:check` 生成

### ✏️ 手动维护的文档
以下文档需要手动维护：
- `API_DOCUMENTATION.md` - 根据API扫描结果手动更新
- `GETTING_STARTED.md` - 根据功能变更手动更新
- `README.md` - 文档中心首页（本文件）
- `CURRENT_ADAPTATION_SYSTEM.md` - 适配系统技术方案
- `SUPREME_ADAPTATION_DIRECTIVE.md` - 监督指令

## 🔄 常用工作流

### 📝 文档更新工作流
```bash
# 1. 更新项目结构文档
npm run docs:structure

# 2. 完整 API 分析（推荐）
npm run docs:check

# 3. 根据分析结果手动更新 API 文档
# 编辑 docs/API_DOCUMENTATION.md
```

### 🧪 测试工作流
```bash
# 1. 运行完整 E2E 测试并归档结果
npm run test:e2e

# 2. 查看测试报告和性能数据
npm run test:report
# 或访问: http://localhost:3000/test

# 3. 运行质量检查
npm run quality:check
```

### 🚀 开发工作流
```bash
# 1. 启动开发服务器
npm run dev

# 2. 代码开发...

# 3. 格式化代码
npm run format

# 4. 代码检查
npm run lint

# 5. 运行测试
npm run test:e2e

# 6. 质量检查
npm run quality:check
```

### 📦 发布工作流
```bash
# 1. 质量门禁检查
npm run quality:gate

# 2. 构建开发版本（支持npm run start）
npm run build

# 3. 启动生产服务器验证
npm run start

# 4. 构建GitHub Pages版本
npm run build:github

# 5. 生成最终质量报告
npm run quality:report
```

### 🚀 GitHub Pages部署工作流
```bash
# 1. 本地测试静态导出
npm run build:github

# 2. 预览静态版本
npx serve@latest out

# 3. 推送到GitHub触发自动部署
git add .
git commit -m "部署更新"
git push origin main

# 4. 查看部署状态
# 访问GitHub仓库 → Actions 查看部署进度
```

## 💡 使用建议

### ⭐ 推荐的日常命令
- **`npm run dev`** - 开发时启动
- **`npm run docs:check`** - API 分析（合并了扫描和分类）
- **`npm run test:e2e`** - 完整测试（包含性能数据归档）
- **`npm run quality:check`** - 日常质量检查
- **`npm run build:github`** - GitHub Pages部署构建

### 🔧 调试和排查
- **`npm run quality:verbose`** - 详细质量检查信息
- **`npm run test:report`** - 查看详细测试报告
- **`npm run check-format`** - 检查代码格式问题

### 🤖 CI/CD 专用
- **`npm run quality:ci`** - 静默模式质量检查
- **`npm run test:quality`** - 性能相关测试

## 📊 输出文件说明

### 📄 自动生成的文档
- `docs/project_structure.md` - 项目结构（`npm run docs:structure`）
- `docs/api-scan-report.md` - API 扫描报告（`npm run docs:check`）
- `docs/api-classification-report.md` - API 分类报告（`npm run docs:check`）

### 📈 测试和质量报告
- `playwright-test-logs/` - E2E 测试报告归档
- `test-results/` - Playwright 测试结果
- `quality-reports/` - 质量检查报告

### 🎯 性能数据
- 访问 `http://localhost:3000/test` 查看性能趋势图表
- 测试报告包含适配通过率、性能指标等数据
## 🔗 相关链接

- **🎮 游戏体验**: `http://localhost:3000/` (开发服务器)
- **🌐 线上体验**: `https://www.citylivepark.com/` (GitHub Pages部署)
- **� 性能监控**: *`http://localhost:3000/test` (测试数据可视化)
- **�  GitHub仓库**: [项目地址](https://github.com/recohcity/generative-puzzle)
- **🚀 部署状态**: [GitHub Actions](https://github.com/recohcity/generative-puzzle/actions)

## 📞 技术支持

如果在使用过程中遇到问题：

1. **📖 查看文档**: 先查看相关文档和API说明
2. **🔍 搜索问题**: 在项目中搜索相关关键词
3. **🧪 运行测试**: 使用 `npm run test:e2e` 验证功能
4. **📊 检查质量**: 使用 `npm run quality:check` 排查问题
5. **📝 提交Issue**: 在GitHub上提交详细的问题描述

---

**📅 最后更新**: 2025年8月13日  
**📦 项目版本**: v1.3.45  
**🛠️ 维护团队**: Generative Puzzle Development Team  
**🌐 部署状态**: ✅ GitHub Pages 正常运行
