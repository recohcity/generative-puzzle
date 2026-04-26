# 生成式拼图 (Generative Puzzle) - 项目 Wiki

欢迎访问 **Generative Puzzle** 工程维基。本文档旨在作为项目架构、技术栈和实现标准的唯一事实来源（截至 **2026 年 4 月**）。

---

## 🚀 1. 项目概览
一款现代化的生成式拼图游戏，具备实时云端同步、全球排行榜以及高性能响应式 UI。

- **核心目标**：在所有设备上提供无缝且震撼的拼图体验。
- **关键特性**：程序化拼图生成、多端设备同步、管理后台以及国际化支持。

---

## 🏗️ 2. 系统架构

项目采用 **整洁架构 (Clean Architecture)** 模式，并结合 **Monorepo** 结构，确保业务逻辑与基础设施之间的彻底解耦。

### 📦 Monorepo 结构
- **根目录 (Root)**：Next.js 应用（处理 UI、路由与云端集成）。
- **`packages/game-core`**：游戏的“大脑”。包含拼图生成、分数计算及 `GameReducer` 的纯 TypeScript 逻辑。
  - *约束*：必须保持无副作用，且对 Web/Cloud API 零依赖。

### 🛠️ 技术栈
- **前端框架**：[Next.js 15](https://nextjs.org/) + [React 19](https://react.dev/)
- **类型系统**：[TypeScript 5](https://www.typescriptlang.org/)
- **样式方案**：[Tailwind CSS](https://tailwindcss.com/) + 用于高级动画和毛玻璃效果的自定义 CSS。
- **云端底座**：[Supabase](https://supabase.com/)（身份验证、PostgreSQL、Edge Functions/RPC）。
- **状态管理**：React `useReducer`（纯逻辑）+ Context API（UI 状态）。
- **动画库**：Framer Motion & CSS 微动效。

---

## 📐 3. 开发标准

### 🎨 卓越的 UI/UX
- **响应式优先**：设计必须在以下场景完美运行：
  - 桌面端（大屏布局）。
  - 移动端竖屏（触控优化控件）。
  - 移动端横屏（紧凑布局与智能旋转提示）。
* **美学设计**：使用精选的 HSL 配色方案、渐变效果及现代字体（Inter/Roboto）打造高端视觉感。
* **交互体验**：核心动作必须具备视觉、听觉与触觉多重反馈（如：悬停效果、过渡动画，基于 Web Audio API 的边界碰撞音效补充，以及基于移动端 Web Vibration API 的真实设备物理震动，用于增强拼图碰撞边界与正确吸附时的手感体验）。

### ☁️ 云端一致性 (`useCloudSync`)
- 高频交互通过专门的 Hook 管理，处理：
  - 原子化状态上传。
  - 应对弱网环境的离线队列。
  - 通过 `idempotency_key` (幂等键) 防止分数重复提交。

### 🌍 国际化 (i18n)
- 所有面向用户的字符串必须外部化。
- 通过内置的 i18n 系统支持动态语言切换。

---

## 🔧 4. 核心模块

### 👤 身份验证与标识
- **Supabase Auth**：集成安全登录。
- **`VirtualAuthWidget`**：自定义响应式认证弹窗，针对移动端横屏和桌面端进行了深度优化。
- **`IdentityChip`**：位于侧边栏的紧凑型 UI 组件，实时展示用户状态。

### 🏆 排行榜
- **双流向支持**：同时支持个人“历史最佳”与“全球排行榜”。
- **实时同步**：全球排名通过 Supabase RPC 获取，确保高性能。
- **视觉风格**：统一使用文本型图标（颜色：#FFD5AB），维持品牌调性。

### 🛠️ 管理后台 (Admin Dashboard)
- **管理功能**：专用 UI 用于清理异常分数和管理用户账户。
- **可扩展性**：用户列表实现分页功能，以支持大规模玩家群体。
- **权限保护**：通过 Supabase RLS 严格限制为管理员角色。

---

## 🔄 5. 近期技术里程碑 (2026年4月)

- **UI 风格统一**：标准化了全应用的字体大小与排版规范。
- **UI 布局稳定性**：通过固定 PhoneTabPanel 高度（130px）和预留提示文字空间（Fixed Height Hint），彻底消除了移动端切换 Tab 和点选拼图时的画布跳动现象。
- **多维度感官反馈**：
    - **Android**：集成 Web Vibration API，实现边界碰撞与吸附成功的物理震动。
    - **iOS**：针对硬件限制，开发了高穿透性（Triangle Wave）碰撞音效作为触感替代，提升了 iOS 端的物理沉浸感。
- **控制台纯净化**：解决了 `Passive Event Listener` 导致的 `preventDefault` 报错，并通过禁用 `next/font` 预加载消除了 Chrome 的 Preload 警告，实现了生产环境零报错。
- **状态纯净化**：完成了 `GameReducer` 的重构，确保其 100% 纯净，所有 IO/localStorage 副作用均已移至 Effect。
- **排行榜优化**：解决了分数刷新延迟问题，并对排行榜所有组件进行了本地化处理。
- **管理端增强**：添加了分页处理，并缩小了全局统计卡片以提升阅读体验。

---

## 📚 6. 开发者资源
- **快速上手**：执行 `npm install` 随后输入 `npm run dev`。
- **历史文档**：查看 `docs/archive/` 了解早期的设计决策。
- **部署发布**：通过 Vercel 实现自动 CI/CD。

---
*最后更新：2026-04-09 | 由 Antigravity 自动生成*
