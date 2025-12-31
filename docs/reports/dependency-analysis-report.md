# 📦 项目依赖分析报告

**生成时间**: 2025-12-31  
**项目版本**: 1.3.72  
**分析工具**: analyze-unused-deps.cjs

## 📊 依赖使用情况总览

| 指标 | 数值 | 等级 | 状态 |
|------|------|------|------|
| **总依赖数量** | 101个 | - | 📦 统计 |
| **检测使用依赖** | 60个 | - | ✅ 扫描 |
| **真实使用率** | 86.1% | A | ✅ 良好 |
| **可能冗余** | 14个 | B+ | ⚠️ 需优化 |

## 🎨 Radix UI 组件分析

| 指标 | 数值 | 状态 |
|------|------|------|
| **总组件数** | 27个 | 📊 统计 |
| **使用组件** | 27个 | ✅ 活跃 |
| **未使用组件** | 0个 | 🎉 完美 |
| **使用率** | 100.0% | 🏆 100% |


### ✅ Radix UI 组件使用完美

所有 27 个 Radix UI 组件都在项目中被使用，没有冗余依赖。


## 🔍 依赖分类分析

### 📋 分类统计

| 分类 | 总数 | 使用中 | 未使用 | 状态 |
|------|------|--------|--------|------|
| 🚀 框架核心 | 3 | 2 | 1 | ⚠️ |
| 🔧 构建工具 | 6 | 0 | 6 | ⚠️ |
| 🧪 测试工具 | 9 | 2 | 7 | ⚠️ |
| 📝 类型定义 | 26 | 0 | 26 | ⚠️ |
| 🔍 代码检查 | 3 | 0 | 3 | ⚠️ |
| 🎨 CSS工具 | 4 | 1 | 3 | ⚠️ |
| ⚙️ 开发工具 | 2 | 0 | 2 | ⚠️ |
| 🎭 UI组件 | 27 | 27 | 0 | ✅ |

### 🔍 详细分析

#### 🎭 Radix UI组件
✅ **状态**: 所有依赖都在使用中
📊 **统计**: 27个依赖，100%使用率

#### 🔧 构建工具依赖
⚠️ **状态**: 6个依赖未直接检测到使用
📊 **统计**: 6个依赖，0.0%使用率

**未使用依赖**:
- `autoprefixer` - 构建工具，在配置文件中使用
- `eslint` - 构建工具，在配置文件中使用
- `postcss` - 构建工具，在配置文件中使用
- `tailwindcss` - 构建工具，在配置文件中使用
- `typescript` - 构建工具，在配置文件中使用
- `webpack-bundle-analyzer` - 构建工具，在配置文件中使用

#### 🎨 CSS工具依赖
⚠️ **状态**: 3个依赖未直接检测到使用
📊 **统计**: 4个依赖，25.0%使用率

**未使用依赖**:
- `clsx` - CSS工具，可能在Tailwind配置中使用
- `tailwind-merge` - CSS工具，可能在Tailwind配置中使用
- `tailwindcss-animate` - CSS工具，可能在Tailwind配置中使用

#### 🚀 框架核心依赖
⚠️ **状态**: 1个依赖未直接检测到使用
📊 **统计**: 3个依赖，66.7%使用率

**未使用依赖**:
- `react-dom` - Next.js框架自动使用，无需显式import

#### 🧪 测试工具依赖
⚠️ **状态**: 7个依赖未直接检测到使用
📊 **统计**: 9个依赖，22.2%使用率

**未使用依赖**:
- `@playwright/test` - 测试框架，在测试配置中使用
- `@testing-library/user-event` - 测试框架，在测试配置中使用
- `identity-obj-proxy` - 测试框架，在测试配置中使用
- `jest` - 测试框架，在测试配置中使用
- `jest-environment-jsdom` - 测试框架，在测试配置中使用
- `jsdom` - 测试框架，在测试配置中使用
- `ts-jest` - 测试框架，在测试配置中使用

#### 📝 TypeScript类型定义
⚠️ **状态**: 26个依赖未直接检测到使用
📊 **统计**: 26个依赖，0.0%使用率

**未使用依赖**:
- `@types/babel__core` - TypeScript类型定义，编译时使用
- `@types/babel__generator` - TypeScript类型定义，编译时使用
- `@types/babel__template` - TypeScript类型定义，编译时使用
- `@types/babel__traverse` - TypeScript类型定义，编译时使用
- `@types/d3-array` - TypeScript类型定义，编译时使用
- `@types/d3-color` - TypeScript类型定义，编译时使用
- `@types/d3-ease` - TypeScript类型定义，编译时使用
- `@types/d3-interpolate` - TypeScript类型定义，编译时使用
- `@types/d3-path` - TypeScript类型定义，编译时使用
- `@types/d3-scale` - TypeScript类型定义，编译时使用
- `@types/d3-shape` - TypeScript类型定义，编译时使用
- `@types/d3-time` - TypeScript类型定义，编译时使用
- `@types/d3-timer` - TypeScript类型定义，编译时使用
- `@types/fs-extra` - TypeScript类型定义，编译时使用
- `@types/graceful-fs` - TypeScript类型定义，编译时使用
- `@types/istanbul-lib-coverage` - TypeScript类型定义，编译时使用
- `@types/istanbul-lib-report` - TypeScript类型定义，编译时使用
- `@types/istanbul-reports` - TypeScript类型定义，编译时使用
- `@types/jest` - TypeScript类型定义，编译时使用
- `@types/node` - TypeScript类型定义，编译时使用
- `@types/pg` - TypeScript类型定义，编译时使用
- `@types/react` - TypeScript类型定义，编译时使用
- `@types/react-dom` - TypeScript类型定义，编译时使用
- `@types/stack-utils` - TypeScript类型定义，编译时使用
- `@types/yargs` - TypeScript类型定义，编译时使用
- `@types/yargs-parser` - TypeScript类型定义，编译时使用

#### 🔍 代码检查工具
⚠️ **状态**: 3个依赖未直接检测到使用
📊 **统计**: 3个依赖，0.0%使用率

**未使用依赖**:
- `@typescript-eslint/eslint-plugin` - ESLint配置，在.eslintrc中使用
- `@typescript-eslint/parser` - ESLint配置，在.eslintrc中使用
- `eslint-config-next` - ESLint配置，在.eslintrc中使用

#### ⚙️ 开发工具依赖
⚠️ **状态**: 2个依赖未直接检测到使用
📊 **统计**: 2个依赖，0.0%使用率

**未使用依赖**:
- `fs-extra` - 开发工具，在脚本中使用
- `tsx` - 开发工具，在脚本中使用


#### ❓ 未分类依赖

⚠️ **状态**: 9个依赖需要手动检查

**需要检查的依赖**:
- `@heroicons/react` - Unknown - needs manual review
- `@hookform/resolvers` - Unknown - needs manual review
- `zod` - Unknown - needs manual review
- `@agentdeskai/browser-tools-mcp` - Unknown - needs manual review
- `@modelcontextprotocol/sdk` - Unknown - needs manual review
- `@swc/core` - Unknown - needs manual review
- `@swc/jest` - Unknown - needs manual review
- `dayjs` - Unknown - needs manual review
- `pg` - Unknown - needs manual review


## 💡 优化建议

### 🎯 当前状态评估


⚠️ **待优化** 项目依赖需要清理

- 📊 依赖使用率 86.1%
- ⚠️ 发现 14 个可能未使用的依赖
- 🔧 建议进行依赖清理优化


### 📋 清理步骤


1. **手动检查**: 搜索项目中是否有配置文件使用这些依赖
2. **脚本检查**: 检查package.json的scripts是否使用
3. **测试验证**: 在测试环境中验证清理后的功能
4. **安全移除**: 确认后可以安全移除冗余依赖


### ⚠️ 注意事项

- 📊 此分析基于静态代码扫描，可能存在误报
- 🔧 某些依赖可能被间接使用或在配置文件中使用  
- 🧪 清理前请确认依赖确实未被使用
- ✅ 建议在测试环境中验证清理后的功能

## 📈 历史对比

*注：首次生成报告，暂无历史对比数据*

---

**报告生成**: 2025/12/31 17:37:04  
**下次建议检查**: 2026/1/30  
**工具版本**: analyze-unused-deps.cjs v1.0