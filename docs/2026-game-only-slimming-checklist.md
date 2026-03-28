# game-only 瘦身逐项删除清单（含命令顺序）

> 适用项目：`generative-puzzle`
>
> 目标：在 `game-only` 分支将项目瘦身为“纯游戏可运行、可构建、可发布”的交付版本。

---

## 1. 执行原则

1. **先备份再删**：任何清理动作前，先创建备份分支。
2. **分批删除、分批验证**：每删除一批目录后，立即执行运行/构建验证。
3. **只删非交付资产**：测试、覆盖率、报告、临时产物优先移除。
4. **不在 `main` 直接大改**：所有瘦身在 `game-only` 完成。

---

## 2. 保留清单（不要删）

以下目录/文件是纯游戏版的主干资产，默认保留：

- `app/`
- `components/`
- `core/`
- `contexts/`
- `hooks/`
- `utils/`（但删除内部测试目录）
- `types/`
- `constants/`
- `styles/`
- `lib/`
- `public/`
- `package.json`
- `package-lock.json`
- `next.config.*`
- `tsconfig.json`
- `next-env.d.ts`
- `postcss.config.*`
- `tailwind.config.*`
- `README.md`（可后续精简）
- `LICENSE`

---

## 3. 删除清单（建议顺序）

### 第 1 批：测试与报告产物目录

- `coverage/`
- `playwright-report/`
- `playwright-test-logs/`
- `test-results/`
- `quality-reports/`
- `out/`
- `temp/`
- `debug-log/`

### 第 2 批：测试工程目录

- `e2e/`
- `src/quality-system/`

### 第 3 批：测试脚本与质量脚本

- `scripts/`（如需保留单个运行脚本，请改为“按文件删”）

### 第 4 批：源码中的测试子目录

- `utils/**/__tests__/`
- `components/**/__tests__/`
- 其他 `__tests__/` 或 `*.test.*` / `*.spec.*`

### 第 5 批：文档冗余清理（按需）

- `docs/Review/`
- `docs/reports/` 中非必要质量报告
- 历史整改报告（如仅保留路线图文档即可）

---

## 4. 推荐命令顺序（可直接执行）

> 以下命令默认在仓库根目录执行。

### 4.1 创建备份与工作分支

```bash
git checkout main
git pull
git checkout -b backup-main-$(date +%Y%m%d)
git checkout main
git checkout -b game-only
```

### 4.2 删除第 1 批目录（产物/报告）

```bash
rm -rf coverage playwright-report playwright-test-logs test-results quality-reports out temp debug-log
```

### 4.3 删除第 2 批目录（测试工程）

```bash
rm -rf e2e src/quality-system
```

### 4.4 删除第 3 批目录（脚本）

> 如果你确定 `scripts/` 仅用于测试/质量流程：

```bash
rm -rf scripts
```

> 如果只想部分删除，请手动保留与构建直接相关脚本。

### 4.5 删除第 4 批（测试文件）

```bash
find utils components -type d -name "__tests__" -prune -exec rm -rf {} +
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) -delete
```

### 4.6 清理依赖与脚本（`package.json`）

手工编辑 `package.json`，将脚本收敛到最小集合：
- `dev`
- `build`
- `start`（可选）
- `lint`（建议保留）

删除示例（按你的实际脚本名）：
- `test:e2e`
- `test:unit`
- `test:coverage`
- `quality:check`
- 以及各种 `cicd`, `report`, `scan` 相关脚本

然后安装锁文件更新：

```bash
npm install
```

### 4.7 分批验证（必须）

```bash
npm run dev
npm run build
```

如构建失败，优先检查：
- 是否删掉了运行期必需模块
- `next.config.*` 的静态导出配置
- 页面是否引用了已删除测试工具代码

### 4.8 提交瘦身版本

```bash
git add .
git commit -m "chore: slim project to game-only delivery baseline"
```

---

## 5. 验收标准（完成判定）

满足以下条件即视为“game-only 瘦身完成”：

1. `npm run dev` 可启动并正常游玩。
2. `npm run build` 成功。
3. 仓库内无测试、覆盖率、质量报告、临时产物目录。
4. 目录结构清晰，交付资产聚焦游戏本体。

---

## 6. 常见问题与处理

### Q1：删除后页面报模块找不到
- 说明误删运行依赖。
- 用 `git restore <path>` 恢复对应目录/文件，再重新验证。

### Q2：Next.js 构建可过，但 Pages 打开白屏
- 多数是静态资源路径或路由基路径问题。
- 在 `next.config.*` 中检查 `output`, `images.unoptimized`, `basePath`, `assetPrefix`。

### Q3：是否要彻底移除 lint？
- 不建议。保留基础 lint 可防止快速劣化。

---

## 7. 建议后续动作

瘦身完成后，立即进入发布链路文档：
- `docs/2026-game-only-gh-pages-deploy-manual.md`

并创建升级分支：

```bash
git checkout game-only
git checkout -b game-cloud
```

---

（完）
