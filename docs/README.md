# 📚 项目文档中心

欢迎来到 Generative Puzzle 项目文档中心！这里包含了项目的核心文档。

## 🚀 快速导航

### 📖 核心文档
- **[快速开始](./GETTING_STARTED.md)** - 5分钟上手指南
- **[API文档](./API_DOCUMENTATION.md)** - 完整的API参考手册 (148个API)
- **[当前适配系统](./CURRENT_ADAPTATION_SYSTEM.md)** - 最新适配技术方案详解
- **[项目结构](./project_structure.md)** - 完整的项目架构
- **[配置指南](./configuration/)** - 环境配置和部署
- **[测试文档](./testing/)** - Playwright自动化测试系统
- **[难度设计](./difficulty-design.md)** - 游戏难度设计文档

### 🎯 监督指令
- **[最高级别监督指令](./SUPREME_ADAPTATION_DIRECTIVE.md)** - 项目开发的最高指导原则

## 📁 目录结构

```
docs/
├── README.md                           # 文档中心首页
├── GETTING_STARTED.md                  # 快速开始指南
├── CURRENT_ADAPTATION_SYSTEM.md        # 当前适配系统技术方案
├── project_structure.md                # 项目结构文档
├── difficulty-design.md                # 游戏难度设计文档
├── SUPREME_ADAPTATION_DIRECTIVE.md     # 最高级别监督指令
├── configuration/                      # 配置相关文档
└── testing/                           # 测试相关文档
    ├── README.md                      # 测试文档索引
    └── playwright-automation.md       # Playwright自动化测试系统
```

## 🔍 文档搜索

### 按功能查找
- **API相关**: 搜索 "API"、"Hook"、"Manager"
- **配置相关**: 搜索 "Config"、"Adaptation"、"Device"
- **测试相关**: 搜索 "Test"、"E2E"、"Performance"
- **开发相关**: 搜索 "Development"、"Debug"、"Fix"

### 按文档类型查找
- **指南类**: GETTING_STARTED.md, API_SCAN_USAGE.md
- **参考类**: API_DOCUMENTATION.md, project_structure.md
- **记录类**: development/, REFACTORING/
- **报告类**: reports/

## 🛠️ 文档维护

### 自动生成的文档
以下文档由工具自动生成，请勿手动编辑：
- `project_structure.md` - 由 `npm run generate-structure` 生成

### 手动维护的文档
以下文档需要手动维护：
- `API_DOCUMENTATION.md` - 根据API扫描结果手动更新
- `GETTING_STARTED.md` - 根据功能变更手动更新
- `development/` - 开发过程中的记录文档

### 文档更新工作流
```bash
# 1. 更新项目结构
npm run generate-structure

# 2. 根据代码变更手动更新API文档
# 编辑 docs/API_DOCUMENTATION.md

# 3. 验证文档完整性
npm run docs:check
```
### 运行项目质量检查
```bash
# 运行完整的质量检查（日常开发使用）
npm run quality

# 运行质量检查并显示详细报告路径（查看报告）
npm run quality:verbose

# CI/CD环境中运行（静默模式，CI/CD流水线使用）
npm run quality:ci

# 检查覆盖率
npm run test:unit -- --coverage --coverageReporters=text

# 单个文件覆盖率检查
npm run test:unit -- --testPathPatterns="puzzleDrawing" --coverage --coverageReporters=text
```
---
