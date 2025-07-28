# Generative Puzzle



[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/recohcity/generative-puzzle)

基于 Next.js 和 React 构建的高可维护、可测试的响应式生成式拼图游戏。

---

## 项目愿景

- **极致适配（目标/持续优化方向）**：致力于支持桌面与移动端、横竖屏自适应，拼图状态随窗口/方向变化智能适配，进度无损恢复。
- **自动化测试闭环**：100% 稳定的 E2E 测试 + 性能数据归档 + 趋势可视化，开发、测试、分析一体化。
- **高可维护性**：核心逻辑高度解耦，类型系统完善，文档与变更记录齐全。

---

## 技术栈与架构

- **前端框架**：Next.js 15 / React 19
- **UI 体系**：Radix UI + Shadcn UI / Tailwind CSS
- **状态管理**：React Context + useReducer
- **类型系统**：TypeScript（核心类型集中于 `types/puzzleTypes.ts`）
- **渲染引擎**：HTML Canvas API（多层画布）
- **自动化测试**：Playwright（E2E 测试 + 性能分析 + 专用 API）
- **性能分析**：测试数据自动归档、趋势仪表盘、报告可视化

### 关键依赖版本（性能优化）

为确保最佳性能表现，项目锁定以下关键依赖版本：

```json
{
  "next": "15.3.4",
  "lucide-react": "0.454.0", 
  "motion": "12.23.0",
  "@playwright/test": "1.53.2",
  "playwright": "1.53.2"
}
```

> **⚠️ 重要提示**：经过性能基准测试，这些版本在形状生成、拼图切割、动画渲染等关键场景下表现最佳。升级到更新版本可能导致显著的性能下降（如形状生成时间从 66ms 增加到 691ms）。建议在升级前进行充分的性能测试。

---

## 核心功能

- **形状系统**：多边形、曲线、不规则圆形，参数可调，形状按钮即生成，已移除“生成形状”按钮
- **切割系统**：1-8 次切割，直线/斜线，智能分块
- **交互机制**：拖拽、双指旋转、15° 增量、磁吸归位、物理回弹
- **响应式适配**：画布与拼图随窗口/设备/方向变化自适应，状态无损恢复（持续优化中）
- **视觉反馈**：动态阴影、完成动画、音效、调试模式
- **分布算法**：网格/螺旋分布，智能避让，边界安全
- **自动化测试**：E2E 测试全流程覆盖，专项与主流程测试隔离
- **性能分析**：自动归档、趋势可视化、基准评估
- **UI优化** 
    - 拼图块与目标形状支持材质瓷砖气孔纹理填充，提升美术质感
    - 全新 BubbleBackground 动态气泡背景特效，体验更沉浸
    - 加载页风格与主页面一致，极简高效，进度条与数字同步，彻底无黑屏
    - 所有主流程按钮图标大小统一为24px，风格高度一致。

---

## 自动化测试与性能分析闭环

- **专用测试 API**：核心状态管理中心（GameContext）在测试环境下自动挂载 `window.testAPI`，支持直接驱动游戏状态，规避 UI 竞态，100% 稳定。
- **E2E 测试体系**：主流程测试（全流程）、专项测试（如响应式适配），Playwright 脚本与测试 API 紧密集成。
- **性能数据归档**：测试结束后自动归档性能数据（Markdown+JSON），存储于 `playwright-test-logs/`。
- **趋势可视化**：内置 `/test` 仪表盘页面，实时展示历史性能趋势与详细报告。
- **测试隔离与管理**：临时/专项测试与主流程测试物理隔离，配置 `testIgnore` 保证主流程环境纯净。
- **支持开发/生产模式自动识别，测试报告、API、前端可视化全链路分组、对比、差异高亮、趋势分析**
- **所有性能指标分项采集与分级，保留两位小数，报告、索引、终端日志格式统一**

---

## 🚀 API快速预览

### 核心API一览
```typescript
import { 
  UNIFIED_CONFIG,
  useDevice, 
  useCanvas, 
  useAdaptation 
} from 'generative-puzzle';

// 🎯 设备适配
const deviceState = useDevice();
console.log(deviceState.isMobile); // true/false
console.log(deviceState.deviceType); // 'desktop' | 'tablet' | 'phone'

// 🎨 画布管理
const canvasSize = useCanvas({ 
  containerRef, 
  canvasRef, 
  backgroundCanvasRef 
});
console.log(`画布尺寸: ${canvasSize.width}x${canvasSize.height}`);

// ⚙️ 统一配置
const mobileConfig = UNIFIED_CONFIG.adaptation.mobile;
const desktopConfig = UNIFIED_CONFIG.adaptation.desktop;
```

### 主要API分类
- 🔧 **[配置管理API](./docs/API_DOCUMENTATION.md#配置管理api)** - 设备配置、适配参数、性能设置
- 🏗️ **[核心管理器API](./docs/API_DOCUMENTATION.md#核心管理器api)** - 设备管理、画布管理、事件管理
- ⚛️ **[React Hooks API](./docs/API_DOCUMENTATION.md#react-hooks-api)** - 响应式适配、交互处理
- 🛠️ **[工具函数API](./docs/API_DOCUMENTATION.md#工具函数api)** - 几何计算、拼图适配、渲染优化

📖 **[完整API文档](./docs/API_DOCUMENTATION.md)** | 🚀 **[快速开始指南](./docs/GETTING_STARTED.md)** | 📚 **[文档中心](./docs/README.md)**

---

## 目录结构与模块分工

- `app/`：Next.js 路由、布局、API、性能仪表盘
- `components/`：核心 UI 组件、PuzzleCanvas（重构后仅编排各钩子与渲染）
- `contexts/`：全局状态管理（GameContext，含测试 API 挂载）
- `hooks/`：自定义钩子（响应式尺寸、设备检测、交互、适配、调试等）
- `e2e/`：Playwright 测试脚本（主流程、专项、临时）
- `utils/`：核心算法与工具（几何、绘制、拼图生成、分布、音效等）
- `types/`：核心类型定义（GameState、PuzzlePiece 等）
- `scripts/`：自动化归档脚本
- `playwright-test-logs/`：性能报告归档目录
- `public/`：静态资源（图片、音效）
- `docs/`：设计、配置、重构、测试等文档
- `animate-ui/backgrounds/bubble.tsx`：动态气泡背景特效组件，提升美术体验
- `texture-tile.png`：瓷砖气孔材质纹理，用于拼图块和目标形状的美术填充
- `app/test/page.tsx`：性能趋势仪表盘页面，支持开发/生产分组、对比、差异高亮、趋势分析，所有性能指标分项采集与分级，自动高亮环境差异
- `test-results/`：Playwright 测试原始结果目录（自动生成，存放原始测试结果文件，.gitkeep 保证目录同步，文件不上传）
- `playwright-report/`：Playwright 生成的 HTML 测试报告目录（自动生成，存放测试报告，内容可忽略，.gitkeep 保证目录同步，文件不上传）

详见 [项目结构文档](./docs/project_structure.md)

---

## 性能优化与基准

### 性能基准指标

项目通过自动化 E2E 测试持续监控以下关键性能指标：

- **形状生成时间**: ≤ 100ms（当前：66ms）
- **拼图生成时间**: ≤ 100ms（当前：39ms）
- **散开动画时间**: ≤ 200ms（当前：65ms）
- **平均帧率**: ≥ 30fps（当前：60fps）
- **页面加载时间**: ≤ 1500ms（当前：1319ms）

### 依赖版本管理策略

1. **性能关键依赖锁定**：Next.js、Lucide React、Motion 等核心依赖保持在经过验证的稳定版本
2. **渐进式更新**：新依赖更新前必须通过性能基准测试
3. **自动化监控**：每次测试运行都会生成性能报告，异常变化会被及时发现
4. **版本回退机制**：发现性能回归时可快速回退到已知良好版本

### 性能优化技术

- **形状生成优化**：点数控制在 30 个，平衡视觉质量与计算性能
- **碰撞检测优化**：`isPointInPolygon` 函数添加边界框预检查，大幅提升交互响应
- **渲染优化**：多层 Canvas 分离，减少不必要的重绘
- **内存管理**：智能缓存与清理机制，避免内存泄漏

---

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

---

## 运行测试与报告

```bash
# 主流程自动化测试与归档（推荐，先运行所有E2E测试，再自动归档性能与流程报告）
npm run test:e2e

# 仅运行 Playwright 测试（不归档）
npm run test

# UI 模式下运行测试，便于调试
tnpx playwright test --ui

# 查看最近一次生成的 HTML 测试报告
npm run test:report
```

- **性能趋势仪表盘**：访问 `/test` 页面，实时查看历史性能趋势与详细报告
- **专项/临时测试隔离**：所有临时测试存放于 `e2e/temp/`，主流程测试环境始终纯净
- **归档报告目录**：所有标准化 Markdown 报告归档于 `playwright-test-logs/`，便于前端聚合与趋势分析

- [📖 Playwright自动化测试闭环工程指南（中文）](./docs/automated_testing_workflow.cn.md) 
- [📖 Playwright E2E Closed-Loop Guide (EN)](./docs/automated_testing_workflow.en.md)

---

## 游戏流程

1. 选择形状类型（多边形/曲线/不规则）
2. 生成形状
3. 设置切割参数（次数和类型）
4. 切割形状
5. 散开拼图
6. 拖拽和旋转拼图，完成游戏
- 提示区内容严格按五步唯一流转，所有流程节点以提示区域为唯一判断标准，自动化测试脚本已同步适配。

---

## 🤝 参与贡献

我们欢迎所有形式的贡献！

### 🎯 贡献方式
- 🐛 **[报告Bug](https://github.com/recohcity/generative-puzzle/issues/new?template=bug_report.md)**
- 💡 **[功能建议](https://github.com/recohcity/generative-puzzle/issues/new?template=feature_request.md)**
- 📚 **[改进文档](https://github.com/recohcity/generative-puzzle/issues/new?template=docs_improvement.md)**
- 🔧 **[提交代码](./docs/CONTRIBUTING.md)**

### 📊 项目统计
- 🎮 **190个API接口** - 完整的游戏开发工具集
- 🧪 **100%测试覆盖** - 稳定可靠的代码质量
- 📱 **跨平台支持** - 桌面端、移动端完美适配
- ⚡ **高性能渲染** - 60fps流畅游戏体验

### 🛠️ 开发者工具
```bash
# API文档维护
npm run scan-api-changes    # 扫描API变更
npm run classify-apis       # API分类分析
npm run docs:check         # 文档完整性检查

# 项目结构
npm run generate-structure  # 生成项目结构文档

# 测试和性能
npm run test:e2e           # 端到端测试
npm run test:report        # 查看测试报告
```

### ✅ 贡献检查清单
1. **代码规范**：代码符合项目编码规范
2. **测试通过**：所有单元测试和 E2E 测试通过
3. **性能验证**：运行 `npm run test:e2e` 确保性能指标无回归
4. **文档更新**：相关文档已更新
5. **依赖管理**：如需更新依赖，请先进行性能基准测试

📖 **[详细贡献指南](./CONTRIBUTING.md)** | 🏗️ **[架构文档](./docs/project_structure.md)** | 📚 **[文档中心](./docs/README.md)**

### 依赖更新流程

如需更新关键依赖，请遵循以下流程：

1. **基准测试**：记录当前性能基准 `npm run test:e2e`
2. **更新依赖**：更新目标依赖版本
3. **性能验证**：再次运行测试，对比性能指标
4. **回归检查**：如有显著性能下降，考虑回退或寻找替代方案
5. **文档更新**：更新 README.md 中的版本说明

---

## 🌟 社区与支持

### 💬 交流渠道
- 💬 **[GitHub讨论区](https://github.com/recohcity/generative-puzzle/discussions)** - 技术讨论和问答
- 🐛 **[Issue跟踪](https://github.com/recohcity/generative-puzzle/issues)** - Bug报告和功能请求
- 📧 **[邮件联系](mailto:contact@citylivpark.com)** - 商务合作和技术咨询

### 📈 项目状态
- ✅ **活跃维护** - 定期更新和Bug修复
- 🔄 **持续集成** - 自动化测试和部署
- 📊 **性能监控** - 实时性能指标追踪
- 🌍 **开源友好** - 欢迎社区贡献

### 🏆 致谢
感谢所有贡献者和社区成员的支持！

[![Contributors](https://contrib.rocks/image?repo=recohcity/generative-puzzle)](https://github.com/recohcity/generative-puzzle/graphs/contributors)

---

## 📄 许可证

MIT License

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！ ⭐**

[🌟 Star项目](https://github.com/recohcity/generative-puzzle) | [🍴 Fork项目](https://github.com/recohcity/generative-puzzle/fork) | [📢 分享项目](https://twitter.com/intent/tweet?text=Check%20out%20this%20amazing%20puzzle%20game%20project!)

</div>