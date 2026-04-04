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
- [x] 首次发布验证：
  - [x] 页面可访问
  - [x] 主流程可玩（开始、拼图、结算）
  - [x] `www.citylivepark.com` 正常

---

## E. 阶段 3：启动 game-cloud（下一步）

- [x] 从 `game-only` 或指定基线创建 `game-cloud`
- [x] 建立 Supabase 项目（`dev` / `prod`）
- [x] 接入 Supabase Auth（Email + Magic Link）
- [x] 配置 Auth Redirect URL（本地 / 预发 / 生产）
- [x] 建表：`profiles` / `game_sessions` / `user_settings` / `leaderboards`（或视图）
- [x] 为 `game_sessions` 建索引（`user_id, created_at`）
- [x] 开启并验证 RLS：
  - [x] 私有表仅允许 `auth.uid() = user_id` 读写
  - [x] 匿名用户无法读取私有数据
  - [x] 排行榜仅开放必要只读字段
- [x] 前端接入 `@supabase/supabase-js` 与环境变量
- [x] 实现登录/登出/Session 恢复
- [x] 实现历史记录云端读写（在线）
- [x] 实现离线队列与联网补同步（离线 -> 在线）
- [x] 完成登录后本地历史一次性迁移上云

- [x] **E. 完成多端一致验证（同账号双设备）**
  - [x] 手动通过 Chrome/Arc 或手机/电脑登录相同邮箱测试
  - [x] 验证“刷新”场景下的数据增量同步
  - [x] 确保重复记录在同步时能够正确去重

### E-1. game-cloud 部署（前端）

- [x] 选择部署平台（建议 `Vercel`）
- [x] 配置 `Preview` / `Production` 环境变量
- [x] 绑定域名并验证 HTTPS
- [x] 验证登录回调 URL 与正式域名一致

### E-2. game-cloud 部署（服务端 / Supabase）

- [x] 应用 schema migration（建表、索引、策略）
- [x] 校验 RLS 在生产环境已启用
- [x] 校验策略：跨用户数据不可读写
- [x] 准备回滚 SQL（策略/字段回滚）

### E-3. 发布后冒烟验证

- [x] 登录成功并可读取个人资料
- [x] 新开一局后可写入 `game_sessions`
- [x] 第二设备登录后可看到同一条记录
- [x] 离线完成一局，联网后自动补同步成功

- [x] 同步失败时可重试且不影响继续游戏

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
- Supabase MVP SQL：`docs/game-cloud-supabase-mvp.sql`

---

（完）
