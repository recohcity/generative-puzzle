# Generative Puzzle

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle)

基于Next.js和React构建的交互式拼图游戏应用。

## 技术概览

- **前端**: Next.js 15.1.0 / React 19
- **UI**: Radix UI + Shadcn UI / Tailwind CSS
- **状态管理**: React Context + useReducer
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

> **版本历史**: 详见 [CHANGELOG.md](./CHANGELOG.md)

## 架构设计

- **GameContext**: 核心状态管理系统
- **PuzzleCanvas**: 画布渲染与交互组件
- **GameInterface**: 布局路由与状态管理
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