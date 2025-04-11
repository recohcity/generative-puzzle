# Generative Puzzle

一个基于Next.js和React的生成式拼图游戏项目，提供丰富的交互式拼图体验。

## 功能特性

- 🎨 动态生成拼图形状
- 🖱️ 直观的拖拽交互
- 🎯 实时预览和调整
- 🌙 支持深色/浅色主题
- 📱 响应式设计，支持移动端
- 🎮 流畅的游戏体验

## 技术栈

- **前端框架**: Next.js 15.1.0
- **UI组件**: Radix UI
- **样式**: Tailwind CSS
- **状态管理**: React Context
- **类型检查**: TypeScript
- **构建工具**: Vite
- **其他工具**: 
  - react-hook-form: 表单处理
  - zod: 数据验证
  - recharts: 数据可视化
  - next-themes: 主题管理

## 项目结构

```
generative-puzzle/
├── app/                # Next.js应用主目录
├── components/         # React组件
├── contexts/          # React Context
├── hooks/             # 自定义Hooks
├── lib/               # 工具库
├── public/            # 静态资源
├── styles/            # 样式文件
├── types/             # TypeScript类型定义
└── utils/             # 工具函数
```

## 安装说明

1. 克隆仓库
```bash
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

4. 构建生产版本
```bash
npm run build
# 或
yarn build
```

## 使用说明

1. 启动应用后，访问 `http://localhost:3000`
2. 使用左侧控制面板调整拼图参数
3. 在画布上拖拽和旋转拼图块
4. 使用右上角的主题切换按钮切换深色/浅色模式

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。在提交PR之前，请确保：

1. 代码符合项目的编码规范
2. 所有测试都通过
3. 更新了相关文档

## 许可证

MIT License

## 联系方式

如有任何问题或建议，欢迎通过GitHub Issues联系我们。 