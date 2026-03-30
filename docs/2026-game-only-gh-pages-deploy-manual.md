# game-only -> gh-pages 发布标准操作手册（含 GitHub Actions 模板）

> 目标：将 `game-only` 分支的纯游戏版本自动构建，并发布到 `gh-pages` 分支，用于 GitHub Pages 托管。

---

## 1. 发布架构说明（过渡期）

当前仓库处于发布过渡期：
- 现状：历史上 `main` 可直接用于 GitHub Pages 发布。
- 目标：切换为 `game-only -> build -> gh-pages`。

采用已确认链路：

- 开发分支：`game-only`
- 发布分支：`gh-pages`（仅静态产物）
- 站点来源：GitHub Pages 指向 `gh-pages`

**优势**：
- 发布分支干净（只存产物）
- 主开发分支可持续迭代
- 与 `main` / `game-cloud` 完全解耦

---

## 2. 前置条件检查

### 2.1 Next.js 可静态导出（匹配当前项目配置）

当前项目 `next.config.mjs` 为**条件静态导出**：
- 当 `NODE_ENV=production` 且 `BUILD_STATIC=true` 时，启用：
  - `output: 'export'`
  - `trailingSlash: true`

因此发布构建必须显式使用：

```bash
BUILD_STATIC=true npm run build
```

同时确保：
- `images.unoptimized: true` 已启用（当前项目已配置）
- 页面不依赖纯服务端运行时能力（SSR-only）

### 2.2 本地构建验证

在 `game-only` 分支执行：

```bash
npm install
BUILD_STATIC=true npm run build
```

确认输出目录（Next 静态导出常见为 `out/`）。

---

## 3. 一次性仓库配置

### 3.1 创建 `gh-pages` 分支（若不存在）

```bash
git checkout --orphan gh-pages
git rm -rf .
echo "# gh-pages" > README.md
git add README.md
git commit -m "chore: initialize gh-pages branch"
git push -u origin gh-pages
git checkout game-only
```

### 3.2 GitHub Pages 设置

仓库 Settings -> Pages：
- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`

> 如果后续用 Actions 官方 Pages 部署方式，也可切换为 “GitHub Actions”。

### 3.3 自定义域名（如已使用）

- 在 Pages 设置中填写 Custom domain。
- 如需在产物中固化，确保部署包含 `CNAME` 文件。

---

## 4. GitHub Actions 自动发布（推荐模板）

在 `game-only` 分支创建文件：
- `.github/workflows/deploy-game-only-pages.yml`

内容如下：

```yaml
name: Deploy game-only to gh-pages

on:
  push:
    branches:
      - game-only
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: BUILD_STATIC=true npm run build

      # 可选：如果你需要自定义域名，取消注释并修改域名
      # - name: Add CNAME
      #   run: echo "www.your-domain.com" > out/CNAME

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
          publish_branch: gh-pages
          force_orphan: true
```

---

## 5. 首次发布操作顺序

```bash
git checkout game-only
git add .github/workflows/deploy-game-only-pages.yml
git commit -m "ci: add game-only to gh-pages deployment workflow"
git push -u origin game-only
```

推送后：
1. 进入 GitHub Actions 查看工作流是否成功。
2. 成功后检查 `gh-pages` 分支是否更新。
3. 打开 GitHub Pages 站点验证。

---

## 6. 日常发布流程（标准）

1. 在 `game-only` 开发与提交。
2. `git push` 到 `game-only`。
3. Actions 自动构建并发布到 `gh-pages`。
4. 线上自动更新。

无需手工切换到 `gh-pages`。

---

## 7. 失败排查手册

### 场景 A：Actions 构建失败
重点检查：
- Node 版本是否兼容（建议 Node 20）
- `npm ci` 是否因锁文件冲突失败
- `npm run build` 是否引用了服务端能力

### 场景 B：部署成功但页面 404 / 白屏
重点检查：
- 构建命令是否使用 `BUILD_STATIC=true npm run build`
- `next.config.*` 中 `output: 'export'` 是否生效
- 静态资源路径是否正确（必要时设置 `basePath`/`assetPrefix`）
- 是否存在客户端路由直达路径刷新问题

### 场景 C：域名访问异常
重点检查：
- Pages Custom domain 是否正确
- DNS 是否生效（CNAME/A 记录）
- `CNAME` 文件是否被发布覆盖或缺失

---

## 8. 与后续 `game-cloud` 的关系

建议长期保持：
- `game-only`：持续发布静态单机版（GitHub Pages）
- `game-cloud`：前后端增强版（推荐 Vercel + Supabase）

这样可以同时拥有：
1. 轻量稳定可访问的静态版本；
2. 持续演进的云端版本。

---

## 9. 回滚策略

若某次发布有问题：
1. 回滚 `game-only` 到上一个稳定提交；
2. 推送后自动触发重新部署；
3. `gh-pages` 将被稳定版本覆盖。

```bash
git checkout game-only
git log --oneline
git revert <bad_commit_sha>
git push
```

---

## 10. 最小检查清单（上线前）

- [ ] 本地 `BUILD_STATIC=true npm run build` 成功
- [ ] Actions 构建日志无错误
- [ ] `gh-pages` 分支产物已更新
- [ ] 页面可访问、主流程可玩
- [ ] 自定义域名可正常访问（如启用）

---

（完）
