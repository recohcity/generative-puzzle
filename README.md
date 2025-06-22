# Generative Puzzle

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle)

基于Next.js和React构建的交互式拼图游戏应用。

## 技术概览

- **前端**: Next.js 15 / React 19
- **UI**: Radix UI + Shadcn UI / Tailwind CSS
- **状态管理**: React Context + useReducer
- **自动化测试**: Playwright
- **渲染**: HTML Canvas API (多层画布)
- **类型系统**: TypeScript
- **交互**: Touch Events API，手势识别
- **构建优化**: 并行服务器编译

## 核心功能

- **形状系统**: 支持多边形、曲线形状和不规则圆形
- **切割系统**: 1-8次切割(产生2-14块拼图)，支持直线/斜线切割
- **交互机制**: 
  - 15度增量旋转与磁吸归位
  - 拼图碰撞物理回弹系统
  - 拖拽与双指旋转支持
- **设备适配**: 响应式设计，适配桌面及移动设备
- **视觉反馈**: 
  - 动态阴影与凹陷效果
  - 完成动画与声音反馈
- **优化分布算法**: 网格布局与螺旋分布，避免拼图超出边界
- **全自动测试与分析平台**:
  - **100%稳定**的E2E测试，覆盖核心游戏流程
  - **自动化性能评测**，包含加载、交互、帧率、内存等指标
  - **动态可视化仪表盘**，实时展示性能趋势和历史报告

> **版本历史**: 详见 [CHANGELOG.md](./CHANGELOG.md)
> **详细文档**: 
> - [项目结构](./docs/project_structure.md)
> - [配置说明](./docs/CONFIGURATION.MD)
> - [自动化测试工作流指南](./docs/automated_testing_workflow.md)

## 架构设计

- **GameContext**: 核心状态管理系统, 并为测试提供专用API
- **PuzzleCanvas**: 画布渲染与交互组件, 由多个自定义钩子驱动
- **GameInterface**: 布局路由与状态管理
- **自动化测试流程**:
  - `e2e/`: Playwright测试脚本
  - `scripts/`: 报告归档脚本
  - `app/api/`: 实时数据API
  - `app/test/`: 可视化仪表盘
- **工具模块**:
  - `ShapeGenerator`: 形状生成
  - `PuzzleGenerator`: 拼图切割
  - `ScatterPuzzle`: 拼图分布
  - `SoundEffects`: 音效系统

## 安装与运行

```bash
# 克隆仓库
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 运行测试

本项目的端到端（E2E）测试基于 Playwright 构建，并集成了一套完整的自动化性能分析流程。

```bash
# 运行所有端到端测试 (无头模式)
# 测试结束后会自动执行归档脚本，生成 Markdown 和 HTML 性能报告
npm run test:e2e

# 在UI模式下运行测试，方便进行单步调试
npx playwright test --ui

# 直接打开并查看最近一次生成的HTML测试报告
npx playwright show-report
```

## 游戏流程

1. 选择形状类型(多边形/曲线/不规则)
2. 生成形状
3. 设置切割参数(次数和类型)
4. 切割形状
5. 散开拼图
6. 拖拽和旋转拼图完成游戏

## 贡献指南

欢迎提交Issue和Pull Request，在提交PR前请确保:
1. 代码符合项目编码规范
2. 所有测试通过
3. 更新相关文档

## 许可证

MIT License