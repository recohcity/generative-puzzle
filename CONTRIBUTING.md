# 贡献指南

感谢你对 Generative Puzzle 项目的关注！我们欢迎所有形式的贡献。

## 🎯 如何贡献

### 🐛 报告Bug
1. 在 [Issues](https://github.com/recohcity/generative-puzzle/issues) 中搜索是否已有相关问题
2. 如果没有，请创建新的 Issue 并使用 Bug 报告模板
3. 提供详细的复现步骤和环境信息

### 💡 功能建议
1. 在 [Issues](https://github.com/recohcity/generative-puzzle/issues) 中搜索是否已有相关建议
2. 创建新的 Issue 并使用功能请求模板
3. 详细描述功能需求和使用场景

### 📚 改进文档
1. 发现文档问题时，创建 Issue 或直接提交 PR
2. 使用我们的 API 扫描工具检查文档覆盖率
3. 遵循文档编写规范

### 🔧 代码贡献
1. Fork 项目到你的 GitHub 账户
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 进行开发并确保代码质量
4. 提交 Pull Request

## 🛠️ 开发环境设置

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤
```bash
# 1. 克隆项目
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 运行测试
npm run test:e2e
```

## 📋 开发工作流

### 代码开发
1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发功能**
   - 遵循项目的代码规范
   - 添加必要的测试
   - 更新相关文档

3. **测试验证**
   ```bash
   # 运行所有测试
   npm run test:e2e
   
   # 检查代码格式
   npm run check-format
   
   # 运行 lint 检查
   npm run lint
   ```

4. **API文档维护**
   ```bash
   # 扫描API变更
   npm run scan-api-changes
   
   # 分类新增API
   npm run classify-apis
   
   # 检查文档完整性
   npm run docs:check
   ```

### API开发规范

#### 新增API检查清单
- [ ] API设计符合项目架构
- [ ] 添加完整的TypeScript类型定义
- [ ] 编写单元测试和集成测试
- [ ] 根据API分类更新对应文档
- [ ] 运行API扫描工具验证覆盖率

#### API分类标准
- **公开API**: 对外暴露的核心功能，需要详细文档
- **团队API**: 内部共享的工具和服务，需要基础文档
- **内部API**: 实现细节，选择性文档化

#### 文档化要求
根据API分类提供不同详细程度的文档：

**公开API文档要求**：
- 完整的参数说明和类型定义
- 多个使用示例（基础用法和高级用法）
- 错误处理说明
- 性能注意事项
- 相关API链接

**团队API文档要求**：
- 基本的参数说明和类型定义
- 一个使用示例
- 主要注意事项

**内部API文档要求**：
- 简洁的功能描述
- 基础的类型信息
- 必要时提供示例

## 🧪 测试指南

### 测试类型
- **单元测试**: 使用 Jest 测试独立功能
- **集成测试**: 测试组件间的交互
- **E2E测试**: 使用 Playwright 测试完整流程
- **性能测试**: 监控关键指标

### 测试命令
```bash
# 运行所有测试
npm run test:e2e

# 仅运行 Playwright 测试
npm run test

# UI 模式调试测试
npx playwright test --ui

# 查看测试报告
npm run test:report
```

### 测试要求
- 新功能必须包含相应测试
- 测试覆盖率不能降低
- 性能测试不能有回归
- E2E测试必须稳定通过

## 📝 代码规范

### 代码风格
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数名
- 添加必要的注释和文档

### 提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明**：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**：
```
feat(api): add useDevice hook for device detection

- Add device type detection
- Support mobile/desktop/tablet classification
- Include responsive breakpoint handling

Closes #123
```

## 🔍 Pull Request 流程

### 提交前检查
- [ ] 代码通过所有测试
- [ ] 遵循代码规范
- [ ] 更新相关文档
- [ ] API变更已扫描和分类
- [ ] 性能指标无回归

### PR模板
创建PR时请使用以下模板：

```markdown
## 📝 变更描述
简要描述这个PR的主要变更

## 🎯 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构

## 🧪 测试
- [ ] 添加了新的测试
- [ ] 所有测试通过
- [ ] 手动测试完成

## 📚 文档
- [ ] 更新了API文档
- [ ] 更新了README
- [ ] 添加了代码注释

## 📊 性能影响
描述对性能的影响（如有）

## 🔗 相关Issue
Closes #issue_number
```

### 审查流程
1. 自动化检查（CI/CD）
2. 代码审查（至少一个维护者）
3. 测试验证
4. 文档检查
5. 合并到主分支

## 🚀 发布流程

### 版本管理
- 遵循 [Semantic Versioning](https://semver.org/)
- 主要版本：破坏性变更
- 次要版本：新功能
- 补丁版本：Bug修复

### 发布检查清单
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG已更新
- [ ] 性能基准测试完成
- [ ] 依赖版本检查

## 🤝 社区准则

### 行为准则
- 尊重所有贡献者
- 建设性的反馈和讨论
- 包容不同的观点和经验
- 专注于对项目最有利的事情

### 沟通渠道
- **GitHub Issues**: Bug报告和功能请求
- **GitHub Discussions**: 技术讨论和问答
- **Pull Requests**: 代码审查和讨论
- **Email**: 私人或敏感问题

## 📞 获取帮助

如果你在贡献过程中遇到问题：

1. 查看 [文档中心](./docs/README.md)
2. 搜索现有的 [Issues](https://github.com/recohcity/generative-puzzle/issues)
3. 在 [Discussions](https://github.com/recohcity/generative-puzzle/discussions) 中提问
4. 联系维护者：contact@recohcity.com

## 🏆 贡献者认可

我们重视每一个贡献，无论大小。所有贡献者都会在项目中得到认可：

- README中的贡献者列表
- 发布说明中的致谢
- 特殊贡献的专门感谢

感谢你对 Generative Puzzle 项目的贡献！🎉