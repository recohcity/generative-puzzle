# Generative Puzzle 架构与代码全貌体检报告

**版本**：v1.5.19 封板时点

**日期**：2026-09-19

**对象**：单人长期科研项目，Next.js 15 + React 19 + Supabase 在线拼图



***

## 一、概览



| 指标              | 数值                                       | 评价             |
| --------------- | ---------------------------------------- | -------------- |
| TS/TSX 文件       | 147                                      | 中型             |
| 总代码行            | 31,269                                   | 单人项目合理规模       |
| 生产依赖            | 15                                       | 精简（无重框架捆绑）     |
| 开发依赖            | 39                                       | 正常             |
| TODO/FIXME/HACK | 0                                        | 干净             |
| API 路由          | 1（keep-alive）                            | 静态化为主          |
| e2e 测试          | 2 文件 / 210 行                             | 轻量冒烟（刻意反对自嗨覆盖） |
| CI job          | 3（build / verify-cutting / smoke-mobile） | 全绿             |

**技术栈**：Next 15.5.14 · React 19 · Supabase JS 2.101 · lucide-react 0.454 · TypeScript



***

## 二、分层架构（自上而下）



```
┌─────────────────────────────────────────────────┐

│ app/                    Next.js App Router      │

│   ├─ page.tsx           主页（拼图游戏）        │

│   ├─ scores/            排行榜页                │

│   └─ api/keep-alive     保活（唯一 API）        │

├─────────────────────────────────────────────────┤

│ components/  (41 文件 / 8,405 行)               │

│   layout/   双栏布局（Desktop/PhoneTab）         │

│   canvas/   PuzzleCanvas（渲染画布）             │

│   panel/    右侧控制面板 / 本地排行榜            │

│   score/    结算页（Desktop/Mobile/旋转显示）    │

│   auth/     虚拟账号组件                        │

│   controls/ 按钮组（动作/难度/切割类型）        │

│   leaderboard/ 云端排行榜                       │

├─────────────────────────────────────────────────┤

│ contexts/  (3 文件 / 1,484 行)                   │

│   GameContext.tsx       全局游戏状态机           │

│   AuthContext           用户会话                │

│   I18nContext           双语切换                │

├─────────────────────────────────────────────────┤

│ hooks/  (11 文件 / 2,097 行)                    │

│   usePuzzleInteractions  拖拽/旋转交互（811 行） │

├─────────────────────────────────────────────────┤

│ services/  (12 文件 / 4,453 行)                 │

│   EventManager          事件总线（754 行）      │

│   cloud/                Supabase 仓储           │

├─────────────────────────────────────────────────┤

│ utils/  (50 文件 / 9,049 行)                    │

│   puzzle/       切割引擎入口（PuzzleGenerator） │

│   puzzle/graph/ 图网络族（放射）                 │

│   rendering/    Canvas 绘制/音效/纹理          │

│   score/         分数工具                       │

│   difficulty/   难度档位                       │

│   leaderboard/   排行榜                         │

│   cloud/         云端仓储                       │

│   data/          本地存储 GameDataManager       │

├─────────────────────────────────────────────────┤

│ packages/game-core/  (6 文件 / 2,876 行)        │

│   src/utils/geometry/                                   │

│     IncrementalCutter   纯 TS 几何核心（无框架） │

│     puzzleGeometry      通用几何               │

│   src/utils/score/                                      │

│     ScoreCalculator     分数算法（1,292 行）    │

│   src/types/             CutType 枚举           │

└─────────────────────────────────────────────────┘
```



***

## 三、代码分布热力



| 目录                  | 文件 | 行数    | 占比  | 评价               |
| ------------------- | -- | ----- | --- | ---------------- |
| utils/              | 50 | 9,049 | 29% | 最厚（切割 + 渲染 + 数据） |
| components/         | 41 | 8,405 | 27% | UI 层             |
| services/           | 12 | 4,453 | 14% | 事件 + 云端          |
| packages/game-core/ | 6  | 2,876 | 9%  | **架构亮点**         |
| hooks/              | 11 | 2,097 | 7%  | 交互               |
| contexts/           | 3  | 1,484 | 5%  | 状态机              |
| app/                | 4  | 651   | 2%  | 路由               |
| src/                | 7  | 743   | 2%  | i18n + config    |
| e2e/                | 2  | 210   | 1%  | 冒烟               |
| constants/          | 2  | 569   | 2%  | 常量               |



***

## 四、最大文件（潜在巨石）



| 行数    | 文件                                          | 职责        | 风险                       |
| ----- | ------------------------------------------- | --------- | ------------------------ |
| 1,292 | `packages/game-core/.../ScoreCalculator.ts` | 分数算法      | 中（职责单一但长）                |
| 1,210 | `contexts/GameContext.tsx`                  | 全局状态机     | **高**（状态 + 持久化 + 分发混在一起） |
| 938   | `components/layout/PhoneTabPanel.tsx`       | 手机布局      | 中（UI 巨石）                 |
| 811   | `hooks/usePuzzleInteractions.ts`            | 拖拽 / 旋转   | 中                        |
| 754   | `services/EventManager.ts`                  | 事件总线      | 低                        |
| 732   | `utils/puzzle/ScatterPuzzle.ts`             | 散开动画      | 低                        |
| 689   | `utils/rendering/puzzleDrawing.ts`          | Canvas 绘制 | 低                        |
| 685   | `components/layout/DesktopLayout.tsx`       | 桌面布局      | 低                        |



***

## 五、健康信号（亮点）



1. **几何核心独立成包**：`packages/game-core` 零框架依赖，可移植到任何项目 —— 这是本项目最大的架构资产。

2. **双族引擎并存自洽**：直线 / 斜线族（一次性生成切割线）与增量顺序切割族（曲线 / S 弯 / 折线 / 嵌齿逐刀）各自独立，不强行合并。

3. **CI 三 job 防线**：build + 切割一致性验证（10 类型 × 8 档）+ 移动端冒烟 ——**封板前必过**。

4. **0 TODO/FIXME**：无技术债标记（说明每次重构都真清干净，不是留着以后再说）。

5. **生产依赖 15 个**：无冗余框架捆绑。

6. **确定性验证**：verify\_extension 已注入 deterministic PRNG，CI 不再偶发假失败。

7. **单人项目纪律**：一版一提交、真机三端验收、反对自嗨式高覆盖测试。



***

## 六、技术债与风险



| 项                         | 现状                              | 影响      | 建议                                                    |
| ------------------------- | ------------------------------- | ------- | ----------------------------------------------------- |
| **GameContext 1,210 行**   | 状态机 + 持久化 + dispatch + 完成逻辑混在一起 | 改状态易出回归 | P2：拆出 `useGameCompletion` / `useGamePersistence` hook |
| **PhoneTabPanel 938 行**   | 手机布局单文件                         | 阅读成本高   | P2：按 tab 拆子组件                                         |
| **首次加载用户信息慢**             | Supabase 查询串行～5s                | 首屏体验    | P1：用户信息预取 / 骨架屏                                       |
| **dev overlay "1 Issue"** | 桌面 dev 右下角                      | 非阻断     | 可忽略                                                   |
| **21 dev 依赖漏洞**           | 全在构建工具链                         | 不影响生产   | 下次大版本升级自然消化                                           |
| **650 极端矮视口**             | 按钮 22px 触控下限                    | 边缘设备    | 已知边界，不改                                               |
| **demos/\_archive/**      | 旧 demo 残留                       | 不影响运行   | P2：可删                                                 |



***

## 七、建议优先级

### P0（不动）



* 当前架构已稳定，1.5.19 封板验证通过 ——**不建议为优化而优化**。

### P1（下个迭代择机）



1. **GameContext 拆分**：把游戏完成逻辑（`executeGameCompletion`）和持久化（GameDataManager 调用）抽成独立 hook，状态机本身只保留 reducer。

2. **用户信息加载优化**：Supabase 首屏查询加并行预取或骨架屏，消除～5s 等待。

### P2（空闲时）



1. PhoneTabPanel 按 tab 拆 3 个子组件。

2. 删除 `demos/_archive/`（旧 demo 已被 `demos/demo.html` 取代）。

3. ScoreCalculator 内部分文件（旋转 / 时间 / 提示 / 难度系数四个评分模块各一文件）。



***

## 八、一句话总结

\*\* 这是一个经过多轮重构、几何核心独立成包、CI 三 job 把关、单人项目纪律严明的中型项目。\*\* 最大的架构资产是 `packages/game-core` 纯 TS 几何引擎；最大的技术债是 GameContext 巨石；无阻断性风险，不建议现在动结构，下个迭代再做 P1 拆分即可。