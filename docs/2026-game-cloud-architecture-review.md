# game-cloud 架构评审报告

> **分支**: `game-cloud` (HEAD: `351a019`)
> **评审时间**: 2026-04-02
> **文档版本**: v1.0
> **评审范围**: 完整代码库静态分析，聚焦云端架构引入后的系统一致性

---

## 一、项目性质定位

| 维度 | 现状 |
|---|---|
| **类型** | 生成式拼图游戏 · 单机端升级为云端版 |
| **技术栈** | Next.js 15 (App Router) + React 19 + TypeScript 5 + Supabase (BaaS) |
| **部署方式** | Vercel（前端）+ Supabase Cloud（认证 + 数据库） |
| **用户规模** | 公开 Web 产品，多设备同步需求 |
| **演化轨迹** | `main` 单机版 → `game-only` 瘦身版 → `game-cloud` 云端接入 |

**根本矛盾**：`game-cloud` 是在单机架构上「贴片式」接入云能力，而非以云端为核心的重新设计。这是本次所有架构问题的根因。

---

## 二、评审框架（2026 行业标准）

本次评审对照以下现代 Web 应用架构标准：

| # | 维度 | 标准说明 |
|---|---|---|
| 1 | **关注点分离** | 每个模块职责单一，边界清晰 |
| 2 | **依赖方向原则** | 核心业务层不依赖基础设施层 |
| 3 | **类型安全** | 消除运行时 `any`，TypeScript 全面保障 |
| 4 | **状态管理规范** | 状态仅在合适的层持有，避免重复与漂移 |
| 5 | **云端优先设计** | 乐观更新、离线容错、幂等同步 |
| 6 | **安全纵深** | 最小权限，防止客户端信任问题 |
| 7 | **可测试性** | 逻辑与副作用分离，测试接口不污染生产 |

---

## 三、问题诊断

### 🔴 P0 — 致命缺陷（影响当前生产稳定性或数据安全）

---

### P0-1：`GameContext.tsx` — 2002 行的「上帝对象」，严重违反单一职责

**文件**: `contexts/GameContext.tsx`

该文件当前承担 **7 个完全不同的职责**，已超出任何合理的组件边界：

| 职责 | 代码行范围 |
|---|---|
| 游戏核心 Reducer（30+ Action 类型） | L114–971 |
| **云端同步逻辑（上传 / 登录 / 离线队列）** | L1031–1124 |
| 形状与拼图生成算法调用 | L1128–1406 |
| Canvas 物理边界计算与音频播放 | L1602–1916 |
| 全局测试 API 暴露（3 套 `window` 对象） | L1408–1513 |
| 开发调试工具注册 | L1977–2000 |
| Auth 状态监听与本地历史迁移 | L1081–1124 |

**代码证据**：

```typescript
// L1041 — 云端上传逻辑直接内嵌在 GameProvider 的 useEffect 中
(async () => {
  await CloudGameRepository.uploadGameSession({...});
})();

// L1084 — Auth 监听、离线同步、历史迁移全部混在同一 useEffect
supabase.auth.onAuthStateChange((event, session) => {
  CloudGameRepository.syncOfflineSessions();
  CloudGameRepository.migrateLocalHistoryToCloud(localHistory).then(...);
  CloudGameRepository.fetchUserGameHistory().then(...);
});
```

**风险**：
- 任何云端操作报错都可能波及游戏核心状态
- 云同步逻辑无法被单独测试
- 每次修改云逻辑都需要接触游戏 Reducer

---

### P0-2：Reducer 中**重复的 `RESTART_GAME` case** — 导致状态重置不完整

**文件**: `contexts/GameContext.tsx` L636–643 vs L758–773

```typescript
// 第一个 case（L636）— 清理字段不完整
case "RESTART_GAME": {
  return { ...state, gameStats: null, isGameActive: false, isGameComplete: false };
}

// ↑ JS switch 命中第一个 case 后立即退出
// ↓ 第二个 case（L758）永远不会被执行

case "RESTART_GAME": {
  return {
    ...state,
    gameStats: null, isGameActive: false, isGameComplete: false,
    isCompleted: false, currentScore: 0, scoreBreakdown: null,
    isNewRecord: false, currentRank: null,
    angleDisplayMode: state.cutCount <= 3 ? "always" : "conditional",
    temporaryAngleVisible: new Set<number>(),
  };
}
```

**JavaScript `switch` 语句始终命中第一个 `case` 并退出**。`currentScore`、`isNewRecord`、`currentRank`、`scoreBreakdown` 在重玩时不会被清零，可能造成成绩显示错乱。

---

### P0-3：`generateShape` 中存在**两段共计 120+ 行的不可达死代码**

**文件**: `contexts/GameContext.tsx` L1158–1210, L1241–1304

```typescript
// L1155 — 优化路径已提前 return，以下代码块永远不会执行
dispatch({ type: "SET_ORIGINAL_SHAPE", payload: shape });
return; // ← 提前退出

// L1158–1210 — 这段完整的形状缩放/居中逻辑是死代码（约 60 行）
const canvasMinDimension = Math.min(canvasWidth, canvasHeight);
const targetDiameter = canvasMinDimension * 0.4;
// ... 以下全部废弃
```

历次重构留下的「注释式代码」从未被删除，严重干扰后续维护者对代码流程的理解。

---

### 🟠 P1 — 严重缺陷（影响可维护性和数据一致性）

---

### P1-1：数据层存在**两套平行抽象**，职责边界模糊

| 层级 | 类 / 模块 | 问题 |
|---|---|---|
| 数据服务层 | `GameDataManager`（静态类） | 同时管理内存缓存 + localStorage，两者可能漂移 |
| 基础设施层 | `CloudGameRepository`（对象字面量） | 直接操作 localStorage，与 `GameDataManager` 职责重叠 |
| UI 层 | `app/scores/page.tsx` | **直接操作原始 `localStorage`**，绕过所有抽象层 |

**代码证据**：

```typescript
// CloudGameRepository.ts L62, L88-93
// 云端 Repository 直接持有并操作 localStorage key
const OFFLINE_QUEUE_KEY = "supabase-offline-game-sessions";
localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

// app/scores/page.tsx L92-100
// UI 页面直接操作存储底层，绕过 GameDataManager
localStorage.removeItem('puzzle-leaderboard');
localStorage.removeItem('puzzle-history');
localStorage.removeItem(`supabase_migration_done_${userId}`);
```

**风险**：localStorage 键名散落在 3 个文件中，任何一处字符串拼写错误都会造成数据丢失，且无法被 TypeScript 捕获。

---

### P1-2：云端同步**去重逻辑脆弱**，存在数据错判风险

**文件**: `utils/data/GameDataManager.ts` L227

```typescript
// 去重依据：时间戳差 ≤1ms 且分数相同
const exists = mergedHistory.some(
  local => Math.abs(local.timestamp - cloud.timestamp) <= 1
        && local.finalScore === cloud.finalScore
);
```

**问题**：
- 两端时间戳来源不同（本地 `Date.now()` vs 云端 `updated_at`），跨设备/时区时精度差异可能导致同一局游戏被判为两局，或不同游戏被误判为同一局
- `GameRecord` 已有 `id` 字段，却未被用作主键去重

---

### P1-3：**双重游戏完成路径**形成竞态风险

```
路径 A: useEffect (L1007) → 检测 completedPieces === puzzle.length → dispatch("GAME_COMPLETED")
路径 B: useEffect (L1927) → 检测 isCompleted → completeGame() → dispatch("COMPLETE_GAME")
```

两个 Reducer case 逻辑高度重复：

| Case | 保存本地记录 | 上传云端 | 分数计算 |
|---|---|---|---|
| `COMPLETE_GAME`（L584） | ❌ 不保存 | ❌ | ✅ |
| `GAME_COMPLETED`（L669） | ✅ 保存 | ✅ | ✅ |

路径 A 与路径 B 的 `useEffect` 监听条件存在重叠，可能造成双重触发或保存与上传的竞态。

---

### P1-4：**类型系统存在重大漏洞**

**① `scoreBreakdown: any`（多处）**

```typescript
// types/puzzleTypes.ts L261
export interface GameRecord {
  scoreBreakdown: any;  // ← 应为 ScoreBreakdown | null
}

// CloudGameRepository.ts L67
type OfflineSession = {
  scoreBreakdown: any;  // ← 同上
};
```

**② `validateGameRecord` 验证的是不存在的字段——永远返回 `false`**

```typescript
// types/puzzleTypes.ts L345-354
export const validateGameRecord = (record: any): record is GameRecord => {
  return (
    typeof record.playerName === 'string' &&  // GameRecord 无此字段！
    validateGameStats(record.stats) &&         // GameRecord 无此字段！
    record.completedAt instanceof Date         // GameRecord 无此字段！
  );
};
```

此函数逻辑与实际 `GameRecord` 接口完全不匹配，是已过期类型定义的残留，且无任何调用方。

**③ `StatsAction` 与 `GameAction` 重复定义**

```typescript
// types/puzzleTypes.ts L301–311 — StatsAction（约 80 行）
// types/puzzleTypes.ts L128–183 — GameAction（已包含 StatsAction 的全部类型）
```

两个联合类型内容重复，`StatsAction` 仅是 `GameAction` 的子集，冗余定义约 180 行。

---

### 🟡 P2 — 中等缺陷（影响性能与可扩展性）

---

### P2-1：Reducer **热路径中执行 `localStorage` 读操作**

**文件**: `contexts/GameContext.tsx` L537–541, L559–563, L293

```typescript
// 每次旋转拼图都执行一次 getItem + JSON.parse
case "TRACK_ROTATION": {
  const currentLeaderboard = GameDataManager.getLeaderboard(); // ← localStorage IO
  const updatedScore = calculateLiveScore(updatedGameStats, currentLeaderboard);
}

// 每次使用提示也执行同样操作
case "TRACK_HINT_USAGE": {
  const currentLeaderboard = GameDataManager.getLeaderboard(); // ← localStorage IO
}
```

Reducer 是同步的纯函数，对高频操作（快速连续旋转）引入 IO 会造成明显卡顿，同时违反 Redux/useReducer 的设计原则。

---

### P2-2：**3 套 `window` 全局调试对象**在生产构建中持续写入

**文件**: `contexts/GameContext.tsx` L1408–1513

```typescript
// useEffect 依赖整个 [state]，每次任何状态变化（含拖拽、旋转）都触发
useEffect(() => {
  (window as any).__gameStateForTests__ = { puzzle: state.puzzle, ... };  // 对象 1
  (window as any).__GAME_STATE__        = { originalShape: state.originalShape, ... }; // 对象 2
  (window as any).gameStateForDebug     = { puzzle: state.puzzle, ... };  // 对象 3
}, [state]); // ← 依赖整个 state
```

**问题**：
- 三个对象内容高度重叠，数据冗余
- 未隔离在开发环境，生产用户也执行此开销
- 每次拖拽都序列化大型 state 对象并写入 `window`

---

### P2-3：**双重 Auth 状态订阅**，无协调机制

**文件**：`components/auth/SupabaseAuthWidget.tsx` L33 + `contexts/GameContext.tsx` L1084

```typescript
// SupabaseAuthWidget — 组件级订阅（关注：UI 登录状态）
supabase.auth.onAuthStateChange((_event, session) => {
  setUserId(session?.user?.id ?? null);
});

// GameContext — Provider 级订阅（关注：数据同步）
supabase.auth.onAuthStateChange((event, session) => {
  CloudGameRepository.syncOfflineSessions();
  CloudGameRepository.migrateLocalHistoryToCloud(...);
});
```

用户登录时两个订阅同时触发，执行顺序无法保证，可能造成数据操作竞态。Supabase Auth 状态应集中在单一 React Context 中管理。

---

### P2-4：在 ESM 项目中使用 **`require()` 同步动态导入**

**文件**: `contexts/GameContext.tsx` L272, `core/ErrorHandlingService.ts` L469

```typescript
// GameContext.tsx — Reducer 内部（！）
const { getHintAllowanceByCutCount } = require("@/utils/score/ScoreCalculator");

// ErrorHandlingService.ts — async 方法内
const { validateConfig } = require('../src/config/index');
```

`package.json` 声明 `"type": "module"`，在 ESM 环境使用 `require()` 是非标准行为，依赖 bundler 兼容处理，存在潜在的运行时失败风险。

---

### 🟢 P3 — 轻微缺陷（代码规范与长期维护）

| # | 问题 | 文件位置 | 说明 |
|---|---|---|---|
| P3-1 | UI 层直接调用基础设施层 | `app/scores/page.tsx` | 缺少 service 层隔离，违反依赖方向 |
| P3-2 | `CloudGameRepository` 使用对象字面量 | `utils/cloud/CloudGameRepository.ts` | 无法 Mock、无法实现接口、不利于替换 BaaS |
| P3-3 | `cutCountFromDifficultyLevel` 逻辑重复 | `CloudGameRepository.ts` L22 | 与 `DifficultyUtils.ts` 同逻辑复制，两者将随时出现分叉 |
| P3-4 | 边界物理计算内嵌音频播放逻辑 | `GameContext.tsx` L1864 | 物理与音频完全不同的关注点，耦合在同一函数中 |
| P3-5 | `core/ErrorHandlingService` 与云层完全脱节 | `core/ErrorHandlingService.ts` | `GameContext` 直接用 `console.warn`，未接入已有的错误处理体系 |

---

## 四、重构方案

### 第一阶段：紧急修复（P0）— 约 2 小时，可立即执行

#### Fix-1：删除重复的 `RESTART_GAME` case

```diff
// contexts/GameContext.tsx — 删除 L636-643 的第一个不完整实现

- case "RESTART_GAME": {
-   return {
-     ...state,
-     gameStats: null,
-     isGameActive: false,
-     isGameComplete: false,
-   };
- }

  // 保留 L758 的完整版本（已包含所有需要重置的字段）
```

#### Fix-2：删除两段死代码块

```diff
// contexts/GameContext.tsx generateShape 函数中
  dispatch({ type: "SET_ORIGINAL_SHAPE", payload: shape });
  dispatch({ type: "SET_SHAPE_TYPE", payload: currentShapeType });
  return;

- // ↓ 以下约 60 行代码永远不会执行，直接删除
- const canvasMinDimension = Math.min(canvasWidth, canvasHeight);
- const targetDiameter = canvasMinDimension * 0.4;
- // ... （L1158-1210 全部删除）
```

#### Fix-3：标记废弃的 `validateGameRecord`

```typescript
// types/puzzleTypes.ts L345
/**
 * @deprecated 此函数验证的字段（playerName, stats, completedAt）与实际
 * GameRecord 接口不匹配，永远返回 false，不应使用。
 * 待重写为与当前 GameRecord 字段对齐的版本。
 */
export const validateGameRecord = (record: any): record is GameRecord => { ... }
```

---

### 第二阶段：架构解耦（P1）— 约 1–2 周

#### Refactor-1：统一 `localStorage` 键名管理

新建 `utils/storageKeys.ts`，作为唯一权威来源：

```typescript
// utils/storageKeys.ts
export const STORAGE_KEYS = {
  LEADERBOARD:       'puzzle-leaderboard',
  HISTORY:           'puzzle-history',
  VISITOR_COUNT:     'puzzle-visitor-count',
  GAME_START_COUNT:  'puzzle-game-start-count',
  OFFLINE_QUEUE:     'supabase-offline-game-sessions',
  MIGRATION_PREFIX:  'supabase_migration_done_',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
```

`GameDataManager`、`CloudGameRepository`、`scores/page.tsx` 三处全部改为引用此常量，消除字符串裸写。

---

#### Refactor-2：提取 `useCloudSync` hook，为 GameContext 瘦身

将所有云同步逻辑从 `GameContext.tsx` 中移出，新建 `hooks/useCloudSync.ts`：

```typescript
// hooks/useCloudSync.ts
export interface CloudSyncTriggers {
  isGameComplete: boolean;
  gameStats: GameStats | null;
  currentScore: number;
  scoreBreakdown: ScoreBreakdown | null;
  isGameActive: boolean;
}

export function useCloudSync(triggers: CloudSyncTriggers) {
  const uploadKeyRef = useRef<string | null>(null);

  // 1. 游戏完成后上传（防重复上传）
  useEffect(() => {
    if (!triggers.isGameComplete || !triggers.gameStats) return;
    const key = `${triggers.gameStats.gameStartTime}-${triggers.currentScore}`;
    if (uploadKeyRef.current === key) return;
    uploadKeyRef.current = key;
    CloudGameRepository.uploadGameSession({
      gameStats: triggers.gameStats,
      finalScore: triggers.currentScore,
      scoreBreakdown: triggers.scoreBreakdown ?? {},
    }).catch(e => console.warn('[useCloudSync] upload failed:', e));
  }, [triggers.isGameComplete, triggers.gameStats, triggers.currentScore]);

  // 2. 游戏开始时重置上传标记
  useEffect(() => {
    if (triggers.isGameActive) uploadKeyRef.current = null;
  }, [triggers.isGameActive]);

  // 3. 网络恢复时补同步
  useEffect(() => {
    const handleOnline = () => CloudGameRepository.syncOfflineSessions();
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) CloudGameRepository.syncOfflineSessions();
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}
```

`GameContext.tsx` 只需在 `GameProvider` 中调用此 hook，完全不感知 Supabase 的存在。

---

#### Refactor-3：提取 `AuthContext`，消除双重 Auth 订阅

新建 `contexts/AuthContext.tsx`：

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/browserClient';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setIsLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

`SupabaseAuthWidget` 和 `useCloudSync` 均消费此 Context，彻底消除双重订阅。

---

#### Refactor-4：改用 `id` 字段作为云端同步去重主键

```typescript
// utils/data/GameDataManager.ts — syncWithCloudRecords
static syncWithCloudRecords(cloudRecords: GameRecord[]): void {
  // 改为：以 id 为主键去重（时间戳仅作后备）
  const localHistory = this.getGameHistory();
  const localIds = new Set(localHistory.map(r => r.id).filter(Boolean));

  const newRecords = cloudRecords.filter(r => {
    if (r.id && localIds.has(r.id)) return false;  // id 精确去重
    // 后备：无 id 时仍使用时间戳+分数（兼容旧数据）
    return !localHistory.some(
      local => Math.abs(local.timestamp - r.timestamp) <= 1
            && local.finalScore === r.finalScore
    );
  });

  // ... 合并写入逻辑
}
```

---

### 第三阶段：类型强化（P1）— 约 3–5 天

#### Type-1：消除 `scoreBreakdown: any`

```typescript
// types/puzzleTypes.ts
export interface GameRecord {
  // ...
  scoreBreakdown: ScoreBreakdown | null;  // 替换 any
}

// CloudGameRepository.ts
type OfflineSession = {
  gameStats: GameStats;
  finalScore: number;
  scoreBreakdown: ScoreBreakdown | null;  // 替换 any
};
```

#### Type-2：删除冗余的 `StatsAction` 类型

```typescript
// types/puzzleTypes.ts
// 删除 L301-311 的 StatsAction 定义
// GameAction 联合类型（L128-183）已包含所有统计相关 Action
```

#### Type-3：将 `CloudGameRepository` 改为 Class，支持接口注入与 Mock

```typescript
// utils/cloud/ICloudGameRepository.ts — 新建接口
export interface ICloudGameRepository {
  uploadGameSession(params: UploadParams): Promise<UploadResult>;
  fetchUserGameHistory(): Promise<GameRecord[]>;
  fetchPublicLeaderboard(params?: LeaderboardParams): Promise<GameRecord[]>;
  syncOfflineSessions(): Promise<SyncResult>;
  migrateLocalHistoryToCloud(records: GameRecord[]): Promise<SyncResult>;
  deleteAllUserGameSessions(): Promise<{ success: boolean; error?: unknown }>;
}

// utils/cloud/CloudGameRepository.ts — 实现接口
export class CloudGameRepository implements ICloudGameRepository {
  constructor(private readonly client: SupabaseClient) {}
  // ...
}

// 导出单例（保持向后兼容）
export const cloudGameRepository = new CloudGameRepository(supabase!);
```

---

### 第四阶段：性能优化（P2）— 约 2 天

#### Perf-1：Reducer 热路径去除 `localStorage` IO

```typescript
// contexts/GameContext.tsx
// 修改前：每次旋转都读 localStorage
case "TRACK_ROTATION": {
  const currentLeaderboard = GameDataManager.getLeaderboard(); // ← IO
  const updatedScore = calculateLiveScore(updatedGameStats, currentLeaderboard);
}

// 修改后：直接使用 state 中已缓存的 leaderboard（无 IO）
case "TRACK_ROTATION": {
  const updatedScore = calculateLiveScore(updatedGameStats, state.leaderboard);
}
```

`state.leaderboard` 在游戏完成时由 `GAME_COMPLETED` 更新，无需每次旋转重新读取。

#### Perf-2：Debug 导出隔离到开发环境专用 hook

```typescript
// hooks/useDebugState.ts — 新建
export function useDebugState(state: GameState) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    // 三个冗余对象合并为一个
    (window as any).__gameState__ = {
      puzzle: state.puzzle,
      completedPieces: state.completedPieces,
      isCompleted: state.isCompleted,
      isScattered: state.isScattered,
    };
  }, [state.puzzle, state.completedPieces, state.isCompleted, state.isScattered]);
  // ↑ 精确依赖，而非整个 state 对象
}
```

---

## 五、评审总结

### 问题优先级汇总

| 优先级 | 问题 | 主要影响 | 工作量估算 |
|---|---|---|---|
| 🔴 P0 | 重复 `RESTART_GAME` case | **当前生产 Bug，状态重置不完整** | < 1h |
| 🔴 P0 | 两段共 120+ 行死代码块 | 维护陷阱，逻辑误判 | 1h |
| 🔴 P0 | `GameContext` 2002 行上帝对象 | 可维护性崩溃，可测试性为零 | 3–5 天 |
| 🟠 P1 | `localStorage` 键名散落 3 处 | 数据丢失风险，TypeScript 无法保护 | 2h |
| 🟠 P1 | 双重游戏完成路径（竞态） | 数据一致性问题 | 1 天 |
| 🟠 P1 | 云端去重逻辑脆弱 | 跨设备同步数据错判 | 半天 |
| 🟠 P1 | `scoreBreakdown: any` 漏洞 | 运行时类型不安全 | 1 天 |
| 🟠 P1 | `validateGameRecord` 字段全错 | 废弃的孤儿代码 | 1h |
| 🟡 P2 | Reducer 热路径 localStorage IO | 旋转操作性能下降 | 半天 |
| 🟡 P2 | 3 套 window 全局对象（生产） | 每次状态变化的序列化开销 | 2h |
| 🟡 P2 | 双重 Auth 订阅 | 登录时潜在数据竞态 | 1 天 |
| 🟡 P2 | `require()` 在 ESM 环境 | 潜在运行时失败 | 半天 |
| 🟢 P3 | `CloudGameRepository` 对象字面量 | 无法 Mock，不利于测试 | 2 天 |
| 🟢 P3 | `cutCountFromDifficultyLevel` 重复 | 逻辑漂移隐患 | 1h |
| 🟢 P3 | 物理计算内嵌音频逻辑 | 职责耦合 | 半天 |

---

### 建议执行顺序

```
Week 1（本周）
├── 立即执行：删除重复 case / 死代码 / 标记废弃函数（约 2h）
├── 建立 storageKeys.ts（约 2h）
└── 建立 AuthContext（约 4h）

Week 2
├── 提取 useCloudSync hook（GameContext 云逻辑迁移）
└── 修复 Reducer 热路径 IO + Debug hook 隔离

Week 3–4
├── 消除 scoreBreakdown: any / 删除 StatsAction 冗余
├── 云端去重改用 id 主键
└── CloudGameRepository 类化（为测试做准备）
```

---

### 关键结论

> **Supabase 的基础设施配置（RLS 策略、幂等键、离线队列机制）整体设计合理，属于云端正确实践。**
>
> **核心问题集中在前端架构层面**：云端能力以补丁方式叠加到单机 `GameContext` 上，而非经过系统性设计。本次评审的所有 P0/P1 问题均源于此。
>
> 建议以「提取 `useCloudSync` + 统一键名管理 + `AuthContext` 集中订阅」作为最小化手术的切入点，在不破坏现有功能的前提下还清最关键的架构债务。

---

*文档生成于 2026-04-02 | 评审工具：代码静态分析 + 行为路径追踪*
