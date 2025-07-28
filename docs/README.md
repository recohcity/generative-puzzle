# 📚 项目文档中心

欢迎来到 Generative Puzzle 项目文档中心！这里包含了项目的所有详细文档。

## 🚀 快速导航

### 📖 用户文档
- **[快速开始](./GETTING_STARTED.md)** - 5分钟上手指南
- **[API文档](./API_DOCUMENTATION.md)** - 完整的API参考

### 🏗️ 开发文档
- **[项目结构](./project_structure.md)** - 完整的项目架构
- **[自动化测试](./automated_testing_workflow.cn.md)** - 测试体系指南
- **[开发记录](./development/)** - 开发过程记录

### 🔧 技术文档
- **[重构记录](./REFACTORING/)** - 重构1.0和2.0完整记录
- **[适配系统](./adaptation/)** - 跨平台适配技术方案
- **[配置指南](./configuration/)** - 环境配置和部署

### 📊 分析报告
- **[难度设计](./difficulty-design.md)** - 游戏难度设计文档

## 📁 目录结构

```
docs/
├── README.md                           # 文档中心首页
├── GETTING_STARTED.md                  # 快速开始指南
├── API_DOCUMENTATION.md                # 完整API文档
├── project_structure.md               # 项目结构文档
├── automated_testing_workflow.cn.md   # 测试工作流
├── configuration/                      # 配置相关文档
├── REFACTORING/                        # 重构记录
│   ├── refactoring1.0/                # 重构1.0：统一架构重构
│   └── refactoring2.0/                # 重构2.0：架构优化重构
├── adaptation/                         # 适配相关文档
├── testing/                           # 测试相关文档
└── reports/                           # 各类分析报告
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

## 📞 文档反馈

如果你发现文档问题或有改进建议：
1. 创建 [文档改进Issue](https://github.com/recohcity/generative-puzzle/issues/new?template=docs_improvement.md)
2. 在 [讨论区](https://github.com/recohcity/generative-puzzle/discussions) 提出建议
3. 直接提交PR改进文档

## 🏆 文档贡献者

感谢所有为项目文档做出贡献的开发者！

---

*📝 最后更新: 2025年1月*  
*🔄 本文档会随着项目发展持续更新*