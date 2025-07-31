# 项目质量自检系统

真正对本地项目进行质量检查的实用工具，包括TypeScript编译检查、ESLint代码规范检查、测试覆盖率分析和GitHub Actions集成。

## 系统概述

项目质量自检系统提供以下核心功能：

- **真实代码检查**: 对本地项目进行实际的TypeScript、ESLint检查
- **测试覆盖率分析**: 运行真实测试并分析覆盖率
- **质量门禁**: 基于实际检查结果的质量门禁机制
- **GitHub Actions集成**: 在CI/CD流程中自动运行质量检查
- **API检索**: 项目API分类和文档化支持

## 目录结构

```
src/quality-system/
├── quality-checker.js           # 核心质量检查器
└── README.md                    # 系统文档
```

## 核心功能

### 1. 项目质量检查器 (quality-checker.js)
- **TypeScript编译检查**: 使用 `npx tsc --noEmit` 进行真实编译检查
- **ESLint代码规范检查**: 使用 `npm run lint` 进行代码风格检查
- **测试覆盖率分析**: 使用 `npm run test:unit --coverage` 进行覆盖率分析
- **智能评分系统**: 基于错误数量和覆盖率的综合评分
- **质量门禁**: 可配置的质量阈值检查

## 快速开始

### 运行项目质量检查
```bash
# 运行完整的质量检查
npm run quality:check

# 运行质量门禁检查
npm run quality:gate

# 生成详细质量报告
npm run quality:report
```

### 质量检查结果示例
```
🔍 开始项目质量检查...

📝 检查 TypeScript 编译...
❌ TypeScript: 5 错误, 0 警告

🔧 检查 ESLint 规则...
✅ ESLint: 0 错误, 0 警告

🧪 运行测试和覆盖率检查...
✅ 测试通过，覆盖率: 88.0%

📊 质量检查报告
==================

🎯 总体评分: 80/100 👍
📋 总体状态: ❌ 未通过

📝 详细结果:
  TypeScript: 50/100 ❌
  ESLint:     100/100 ✅
  测试覆盖率: 100/100 ✅ (88.0%)

🚪 质量门禁: ✅ 通过
```

### GitHub Actions集成
系统已集成到GitHub Actions工作流中：

```yaml
# .github/workflows/quality-check.yml
name: Code Quality Check
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
    - name: Run project quality check
      run: npm run quality:check
```

### API分类和检索
```bash
# 运行API分类工具
npm run classify-apis

# 检查文档完整性
npm run docs:check
```

## 质量检查类型

系统对本地项目进行真实的质量检查：

### 1. TypeScript编译检查
- 使用 `npx tsc --noEmit` 进行真实编译检查
- 检测类型错误、语法错误、配置问题
- 每个错误扣10分，每个警告扣2分

### 2. ESLint代码规范检查
- 使用 `npm run lint` 进行代码风格检查
- 检测代码规范问题、潜在错误、最佳实践违规
- 每个错误扣5分，每个警告扣1分

### 3. 测试覆盖率分析
- 使用 `npm run test:unit --coverage` 运行真实测试
- 分析代码覆盖率（行覆盖率、函数覆盖率、分支覆盖率）
- 覆盖率 + 20分基础分（最高100分）

## 评分系统

### 权重分配
- **TypeScript**: 40% 权重
- **ESLint**: 30% 权重  
- **测试覆盖率**: 30% 权重

### 质量门禁
- 默认阈值: 70分
- 可通过修改 `quality-checker.js` 中的 `passesQualityGate(threshold)` 调整
- 未通过质量门禁时，进程退出码为1（CI/CD失败）

## 报告功能

### 控制台报告
- 实时显示检查进度
- 详细的错误和警告信息
- 改进建议和总体评分

### JSON报告
- 自动保存到 `quality-reports/` 目录
- 包含完整的检查结果和元数据
- 支持历史趋势分析

## GitHub Actions集成

### 自动化流程
- 在推送和PR时自动运行质量检查
- 生成质量报告并上传为构件
- 在PR中自动评论质量结果
- 质量门禁检查和状态更新

### 工作流配置
```yaml
- name: Run project quality check
  run: npm run quality:check
  
- name: Run quality gate check
  run: |
    QUALITY_SCORE=$(grep -o "总体评分: [0-9.]*" quality-output.txt | grep -o "[0-9.]*" | head -1)
    if (( $(echo "$QUALITY_SCORE >= 70" | bc -l) )); then
      echo "✅ Quality gate passed!"
    else
      echo "❌ Quality gate failed!"
    fi
```

## API检索功能

### API分类工具
```bash
# 分析和分类项目API
npm run classify-apis
```

支持的API分类：
- **公开API**: 对外暴露的核心功能API
- **团队API**: 团队内部共享的工具和服务
- **内部API**: 模块内部使用的私有API

### 文档完整性检查
```bash
# 检查API文档完整性
npm run docs:check
```

## 技术特性

- **真实检查**: 对本地项目进行实际的代码分析
- **零配置**: 使用项目现有的TypeScript、ESLint、Jest配置
- **CI/CD友好**: 支持质量门禁和进程退出码
- **详细报告**: 提供具体的错误信息和改进建议
- **历史追踪**: JSON报告支持质量趋势分析