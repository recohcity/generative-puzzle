# 🧩 Generative Puzzle

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle) 
[![Live Demo](https://img.shields.io/badge/🚀-Live_Demo-brightgreen)](https://www.citylivepark.com) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)

**基于 Next.js 15 和 React 19 构建的企业级生成式拼图游戏**

*高可维护、可测试、3端统一适配的现代化拼图游戏解决方案*

</div>

---

## ✨ 项目亮点

### 🏆 企业级质量标准
- **A+ 级别代码质量** - 99.04% 测试覆盖率，零 TypeScript 错误
- **性能卓越** - 形状生成 77ms，拼图生成 43ms，60fps 流畅体验
- **3端统一适配** - 桌面端、移动端、iPad 端完美适配，智能布局切换
- **自动化测试闭环** - 100% 稳定的 E2E 测试 + 性能数据归档 + 趋势可视化

### 🚀 技术前沿
- **最新技术栈** - Next.js 15 + React 19 + TypeScript 5
- **现代化 UI** - Radix UI + Shadcn UI + Tailwind CSS
- **智能渲染** - HTML Canvas API 多层画布，支持材质纹理
- **音效系统** - 真实音频文件 + 程序生成音效的混合方案

### 🎮 游戏特性
- **生成式形状** - 多边形、曲线、不规则圆形，参数可调
- **智能切割** - 1-8 次切割，直线/斜线，智能分块算法
- **流畅交互** - 拖拽、双指旋转、15° 增量、磁吸归位、物理回弹
- **视觉反馈** - 动态阴影、完成动画、音效反馈、调试模式

---

## 🎯 快速开始

### 环境要求
- **Node.js** 18+ 
- **npm** 或 **yarn**
- **现代浏览器** (Chrome 90+, Firefox 88+, Safari 14+)

### 安装运行
```bash
# 克隆项目
git clone https://github.com/recohcity/generative-puzzle.git
cd generative-puzzle

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
open http://localhost:3000
```

### 游戏体验
1. **选择形状** - 点击多边形、曲线或不规则形状按钮
2. **设置切割** - 选择切割次数(1-8)和类型(直线/斜线)
3. **开始游戏** - 拖拽拼图块到正确位置
4. **完成拼图** - 所有块归位后查看完成动画

---

## 🛠️ 技术栈

### 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15.3.4 | React 全栈框架 |
| **React** | 19 | 用户界面库 |
| **TypeScript** | 5.0 | 类型安全 |
| **Tailwind CSS** | 3.4.17 | 样式框架 |

### UI 组件
| 技术 | 版本 | 用途 |
|------|------|------|
| **Radix UI** | 最新 | 无障碍组件库 |
| **Shadcn UI** | 最新 | 组件设计系统 |
| **Lucide React** | 0.454.0 | 图标库 |
| **Motion** | 12.23.0 | 动画库 |

### 测试工具
| 技术 | 版本 | 用途 |
|------|------|------|
| **Playwright** | 1.53.2 | E2E 测试 |
| **Jest** | 30.0.2 | 单元测试 |
| **Testing Library** | 16.3.0 | React 测试 |

> **⚠️ 性能优化提示**：经过性能基准测试，这些版本在形状生成、拼图切割、动画渲染等关键场景下表现最佳。升级到更新版本可能导致显著的性能下降。

---

## 📊 项目质量

### 🏥 质量指标
| 维度 | 得分 | 等级 | 状态 |
|------|------|------|------|
| **代码质量** | 100/100 | A+ | ✅ 优秀 |
| **测试覆盖率** | 99.04% | A+ | ✅ 优秀 |
| **性能表现** | 100/100 | A+ | 🚀 卓越 |
| **文档完整性** | 97/100 | A+ | ✅ 优秀 |
| **整体评分** | 100/100 | A+ | 🏆 卓越 |

### 📈 性能基准
- **形状生成时间**: ≤ 100ms (当前: 77ms)
- **拼图生成时间**: ≤ 100ms (当前: 43ms)
- **散开动画时间**: ≤ 200ms (当前: 163ms)
- **页面加载时间**: ≤ 1500ms (当前: 1328ms)
- **平均帧率**: ≥ 30fps (当前: 60fps)

---

## 🎮 核心功能

### 形状系统
- **多边形形状** - 可调节边数和复杂度
- **曲线形状** - 贝塞尔曲线生成的不规则形状
- **不规则圆形** - 随机点生成的有机形状
- **一键生成** - 点击按钮即生成，无需额外操作

### 切割系统
- **智能切割** - 1-8 次切割，支持直线和斜线
- **分块算法** - 智能分块，确保拼图块大小合理
- **边界检测** - 自动检测切割边界，避免无效切割

### 交互机制
- **拖拽操作** - 流畅的拖拽体验，支持多指操作
- **旋转控制** - 双指旋转，15° 增量控制
- **磁吸归位** - 智能吸附，精确归位
- **物理回弹** - 自然的物理反馈效果

### 3端适配
- **桌面端** - 左画布 + 右面板布局
- **移动端** - Tab 布局，触摸优化
- **iPad 端** - 智能切换，横竖屏适配
- **状态恢复** - 窗口/方向变化时无损恢复拼图状态

---

## 🧪 测试与质量

### 自动化测试
```bash
# 运行完整测试套件
npm run test:e2e

# 运行单元测试
npm run test:unit

# 查看测试覆盖率
npm run test:coverage

# 查看测试报告
npm run test:report
```

### 质量检查
```bash
# 代码质量检查
npm run quality:check

# 依赖分析
npm run analyze:unused-deps

# 项目结构扫描
npm run generate-structure
```

### 测试覆盖
- **E2E 测试** - 全流程自动化测试
- **单元测试** - 核心逻辑单元测试
- **性能测试** - 性能指标监控
- **适配测试** - 跨设备适配验证

---

## 📚 文档中心

### 核心文档
- **[快速开始指南](./docs/GETTING_STARTED.md)** - 5分钟上手指南
- **[API 文档](./docs/API_DOCUMENTATION.md)** - 完整的 API 参考手册
- **[项目体检报告](./docs/Generative%20Puzzle%20项目代码质量全面体检报告.md)** - 企业级质量分析
- **[项目结构](./docs/project_structure.md)** - 完整的项目架构

### 配置文档
- **[环境配置](./docs/configuration/README.md)** - 开发环境配置
- **[音效配置](./docs/configuration/media-sound.md)** - 音效系统配置
- **[测试配置](./docs/testing/README.md)** - 测试系统配置

### 部署文档
- **[GitHub Pages 部署](./docs/GITHUB_PAGES_DEPLOYMENT.md)** - 静态站点部署
- **[性能优化](./docs/configuration/performance.md)** - 性能优化指南

---

## 🏗️ 项目结构

```
generative-puzzle/
├── app/                    # Next.js 应用目录
│   ├── page.tsx           # 主页面
│   ├── test/              # 性能仪表盘
│   └── api/               # API 路由
├── components/            # React 组件
│   ├── GameInterface.tsx  # 核心游戏界面
│   ├── PuzzleCanvas.tsx   # 拼图画布
│   └── ui/                # UI 组件库
├── contexts/              # React Context
│   └── GameContext.tsx    # 全局状态管理
├── hooks/                 # 自定义 Hooks
│   └── usePuzzleInteractions.ts
├── utils/                 # 工具函数
│   ├── puzzle/            # 拼图算法
│   ├── rendering/         # 渲染引擎
│   └── adaptation/        # 适配系统
├── types/                 # TypeScript 类型
│   └── puzzleTypes.ts     # 核心类型定义
├── e2e/                   # E2E 测试
├── docs/                  # 项目文档
└── public/                # 静态资源
    ├── bgm.mp3           # 背景音乐
    ├── finish.mp3        # 完成音效
    └── texture-tile.png  # 材质纹理
```

---

## 🚀 开发指南

### 开发命令
```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 开发流程
1. **组件开发** → `components/`
2. **业务逻辑** → `hooks/`, `utils/`
3. **状态管理** → `contexts/`
4. **类型定义** → `types/`
5. **测试编写** → `tests/`, `e2e/`

### 代码规范
- **TypeScript 严格模式** - 类型安全保障
- **ESLint 规则** - 代码风格统一
- **Prettier 格式化** - 代码格式一致
- **命名规范** - 统一的命名约定

---

## 🤝 贡献指南

### 贡献流程
1. **Fork 项目** - 创建自己的分支
2. **创建功能分支** - `git checkout -b feature/amazing-feature`
3. **提交更改** - `git commit -m 'Add amazing feature'`
4. **推送分支** - `git push origin feature/amazing-feature`
5. **创建 Pull Request** - 提交合并请求

### 贡献检查清单
- [ ] 代码符合项目编码规范
- [ ] 所有测试通过
- [ ] 性能指标无回归
- [ ] 相关文档已更新
- [ ] 依赖更新已测试

---

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE) - 查看 LICENSE 文件了解详情。

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

[![Contributors](https://contrib.rocks/image?repo=recohcity/generative-puzzle)](https://github.com/recohcity/generative-puzzle/graphs/contributors)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！ ⭐**

[🌟 Star 项目](https://github.com/recohcity/generative-puzzle) | 
[🍴 Fork 项目](https://github.com/recohcity/generative-puzzle/fork) | 
[📢 分享项目](https://twitter.com/intent/tweet?text=Check%20out%20this%20amazing%20puzzle%20game%20project!)

</div>