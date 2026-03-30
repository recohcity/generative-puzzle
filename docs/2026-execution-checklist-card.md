# 2026 执行清单卡片（1页）

> 用途：按顺序执行，不偏离分支职责与发布策略。

---

## A. 分支职责

- [x] 已确认
- `main`：完整历史基线（不再承担纯游戏发布）。
- `backup-main-YYYYMMDD`：安全快照。
- `game-only`：纯游戏开发与交付。
- `gh-pages`：仅静态产物发布分支。
- `game-cloud`：下一阶段云端重构。

---

## B. 阶段 0：安全备份

- [x] `git checkout main`
- [x] `git pull`
- [x] `git checkout -b backup-main-$(date +%Y%m%d)`
- [x] 推送备份分支到远端

---

## C. 阶段 1：建立 game-only 并瘦身

- [x] 从 `main` 创建 `game-only`
- [x] 删除测试/报告/产物目录（按清单分批）
- [ ] 删除源码测试文件前先 dry-run 预览
- [x] 收敛 `package.json` 脚本（仅保留 dev/build/start/lint）
- [x] 每批删除后验证：
  - [x] `npm run dev`
  - [x] `BUILD_STATIC=true npm run build`
- [ ] 若误删，立即回滚并重试：
  - [ ] 单路径恢复：`git restore <path>`
  - [ ] 当前批次整体撤销：`git restore --worktree --staged .`
- [x] 每批验证通过后小步提交（便于精确回退）

---

## D. 阶段 2：切换发布到 gh-pages（当前域名：`www.citylivepark.com`）

- [x] 在 `game-only` 添加工作流：`.github/workflows/deploy-game-only-pages.yml`
- [x] Actions 构建命令确认：`BUILD_STATIC=true npm run build`
- [x] 发布目录确认：`out/`
- [x] 检查是否存在旧的 `main` 发布工作流，避免双通道发布冲突
- [x] GitHub Pages Source 改为 `gh-pages`
- [x] 自定义域名保持 `www.citylivepark.com`，并确认发布产物保留 `CNAME`（如已使用）
- [ ] 首次发布验证：
  - [x] 页面可访问
  - [ ] 主流程可玩（开始、拼图、结算）
  - [x] `www.citylivepark.com` 正常

---

## E. 阶段 3：启动 game-cloud（下一步）

- [ ] 从 `game-only` 或指定基线创建 `game-cloud`
- [ ] 接入 Supabase（Auth + Postgres）
- [ ] 设计表：`profiles` / `game_sessions` / `leaderboards` / `user_settings`
- [ ] 完成账号登录与历史记录云同步 MVP

---

## F. 发布异常快速回滚

- [ ] 定位异常提交 SHA
- [ ] 在 `game-only` 执行 `git revert <sha>`
- [ ] `git push` 触发自动重新部署

---

## G. 文档入口

- 路线图：`docs/2026-game-only-and-game-cloud-roadmap.md`
- 瘦身清单：`docs/2026-game-only-slimming-checklist.md`
- 发布手册：`docs/2026-game-only-gh-pages-deploy-manual.md`

---

（完）
