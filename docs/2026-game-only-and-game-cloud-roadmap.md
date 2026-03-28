# Generative Puzzle 项目整改与演进完整方案（2026）

## 1. 文档目的

本方案用于指导 `generative-puzzle` 项目从当前“过度复杂的主干版本”平稳过渡到：

1. **纯游戏交付版（game-only）**：可独立运行、可发布、结构清爽。
2. **云端升级版（game-cloud）**：前端 + 服务端 + 用户数据多端一致。

并明确 GitHub Pages 发布策略、分支策略、执行顺序与风险控制。

---

## 2. 当前问题与整改目标

### 2.1 当前问题

`main` 版本中存在明显的“过度混合”问题：
- 游戏核心代码与测试体系、质量扫描、覆盖率、可视化报告、调试/临时产物等高度混杂。
- 工程目录噪音较大，降低日常迭代效率。
- 发布链路不够聚焦，交付版本与研发治理产物耦合。

### 2.2 整改目标

- 对 `main` 做**安全备份**，保留完整历史资产。
- 输出一个**纯游戏版**分支用于产品化交付。
- 采用 **`game-only -> build -> gh-pages`** 的 GitHub Pages 发布方式。
- 在新分支 `game-cloud` 上推进前后端一体化升级，采用 **Supabase 免费方案优先**。

---

## 3. 已确认决策（根据你的回复）

1. **GitHub Pages 发布方式**：
   - 采用推荐方案：`game-only -> build -> gh-pages`。
2. **未来架构选择**：
   - 倾向 **Supabase**（认证 + 数据 + Serverless 能力）。
3. **升级分支策略**：
   - 同意创建新分支：`game-cloud`（用于全新前后端版本演进）。

---

## 4. 分支与版本治理策略

建议采用以下长期稳定策略：

- `main`：保留当前完整工程（历史参考与治理资产基线）。
- `backup-main-YYYYMMDD`：一次性快照备份，防误操作与兜底回退。
- `game-only`：纯游戏交付版，专注前端单机可玩与轻量发布。
- `gh-pages`：仅存放静态构建产物，用于 GitHub Pages 线上站点。
- `game-cloud`：前后端重构版，面向账户体系与跨端数据一致。

---

## 5. 执行路线（最佳顺序）

> 原则：先“瘦身可交付”，再“云化升级”，避免多目标并行导致返工。

### 阶段 0：安全备份（先做）

**目标**：保证任何时候都可回滚。

- 基于当前 `main` 创建：`backup-main-YYYYMMDD`。
- 备份后，不直接在 `main` 做大规模清理。

**产出**：可回退的完整历史快照。

---

### 阶段 1：建立纯游戏分支 `game-only`

**目标**：产出可独立运行、结构清爽的纯游戏版本。

#### 1) 保留目录（建议）

- `app/`
- `components/`
- `core/`
- `contexts/`
- `hooks/`
- `utils/`（去除测试子目录）
- `types/`
- `constants/`
- `styles/`
- `lib/`（若被项目依赖）
- `public/`
- `package.json`、`package-lock.json`
- `next.config.*`、`tsconfig.json`、`postcss/tailwind` 配置等运行必需文件

#### 2) 移除/迁出目录（建议）

- `e2e/`
- `coverage/`
- `playwright-report/`
- `playwright-test-logs/`
- `test-results/`
- `quality-reports/`
- `src/quality-system/`
- `scripts/`（仅保留与运行/构建直接相关脚本，其他移除）
- `docs/Review`、`docs/reports` 中非交付必需报告
- `out/`、`temp/`、`debug-log/`
- `utils/**/__tests__/`、`components/**/__tests__/` 等测试目录

#### 3) 配置收敛

- 清理 `package.json` 中与测试/质量工具相关脚本（如 e2e、coverage、质量扫描）。
- 保留最低必要脚本：
  - `dev`
  - `build`
  - `start`（如需要）
  - `lint`（可保留基础 lint，避免完全失控）

#### 4) 验收标准

- 本地可运行：`npm run dev`
- 本地可构建：`npm run build`
- 页面核心流程可用：开始游戏、操作拼图、完成结算、历史读取（本地）

**产出**：`game-only` 可交付版本。

---

### 阶段 2：GitHub Pages 发布（已确定采用推荐方案）

**目标**：将 `game-only` 自动构建并发布到 `gh-pages`。

#### 发布链路

1. 在 `game-only` 提交变更。
2. CI 执行构建（静态导出）。
3. 将构建产物发布到 `gh-pages` 分支。
4. GitHub Pages Source 指向 `gh-pages`。

#### 要点

- `gh-pages` 只保存静态产物，保持发布分支整洁。
- 自定义域名继续使用同一仓库 Pages 设置。
- 保证构建产物中保留 `CNAME`（如已绑定域名）。

#### Next.js 静态发布注意事项

若目标是 GitHub Pages（纯静态托管）：
- 推荐采用静态导出模式（如 `output: 'export'`）。
- 避免依赖服务端运行时能力（SSR-only、Server Actions 依赖服务端存储等）。
- 校验静态资源路径与路由策略（必要时处理 `basePath`/`assetPrefix`）。

**产出**：可持续自动发布的纯游戏线上站点。

---

### 阶段 3：创建 `game-cloud` 并升级为前后端版本

**目标**：从单机前端演进到“账号体系 + 云端数据 + 多端一致”。

#### 架构方向（已确认倾向 Supabase）

- **认证**：Supabase Auth（邮箱/魔法链接/OAuth 可选）
- **数据库**：Supabase Postgres
- **后端能力**：Supabase Edge Functions（或 Next API Route + Supabase）
- **前端部署**：可继续 GitHub Pages（纯静态受限）或迁移 Vercel（更灵活）

> 建议：
> - `game-only` 保持 GitHub Pages（轻交付）。
> - `game-cloud` 可考虑 Vercel + Supabase（更适合认证和动态接口）。

#### 数据模型建议（首版）

- `profiles`：用户资料
- `game_sessions`：每局记录（难度、时长、操作、得分分解）
- `leaderboards`：聚合排行（可按难度/周/月）
- `user_settings`：偏好设置（音量、语言、视觉选项）

#### 迁移策略

1. 保留当前本地存储逻辑作为离线 fallback。
2. 引入登录后：本地数据一次性上云迁移。
3. 新局优先写云端，离线时写本地，联网后同步。

#### 验收标准

- 同一账号在多端可查看一致历史与榜单。
- 登录态稳定，失败重试与降级策略可用。
- 数据读写延迟可接受，核心体验不受阻。

**产出**：`game-cloud` 云端版本最小可用产品（MVP）。

---

## 6. 风险与控制

### 风险 1：瘦身时误删运行依赖
- **控制**：先备份分支；按“保留清单”逐批清理；每批执行 `dev/build` 验证。

### 风险 2：Pages 静态发布与 Next 特性不兼容
- **控制**：提前审查 SSR 依赖；采用静态导出；统一静态资源路径。

### 风险 3：云端升级过早引入复杂度
- **控制**：先完成 `game-only` 稳态交付，再并行 `game-cloud`。

### 风险 4：数据一致性与离线冲突
- **控制**：定义明确同步规则（时间戳 + 版本号 + 幂等写入）。

---

## 7. 里程碑建议（可执行）

### M1（1~2 天）
- 完成 `backup-main-*`
- 创建 `game-only`
- 初步清理目录与脚本
- 本地 `dev/build` 可过

### M2（1~2 天）
- 建立 `game-only -> gh-pages` 自动发布
- 完成自定义域名验证
- 线上可访问稳定

### M3（3~7 天）
- 创建 `game-cloud`
- 接入 Supabase Auth + 基础表结构
- 完成历史记录云端读写 MVP

### M4（持续迭代）
- 排行榜聚合、同步机制、账号体验优化
- 性能、容错、观测完善

---

## 8. 最终推荐结论

对于你当前项目状态，**最佳路线**是：

1. **先备份**（保护历史资产）；
2. **再瘦身为 `game-only`**（快速回到高效率交付）；
3. **用 `game-only -> build -> gh-pages` 发布**（稳定且整洁）；
4. **另起 `game-cloud` 走 Supabase 云化升级**（功能扩展与多端一致）。

该路线风险最低、收益最高，且最符合你“从复杂回归产品效率，再向云端能力升级”的目标。

---

## 9. 附：建议的下一步立即动作

1. 创建 `backup-main-YYYYMMDD`
2. 创建并切换 `game-only`
3. 按“保留/移除清单”执行第一轮清理
4. 修正构建配置，确保静态导出可用
5. 配置 `gh-pages` 发布流程
6. 创建 `game-cloud`，开始 Supabase 方案落地

---

（完）
