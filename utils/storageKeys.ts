/**
 * 统一的 localStorage 键名管理
 * 防止键名分散导致的数据丢失或同步错误
 */

export const STORAGE_KEYS = {
  // 核心数据 (Core Data)
  LEADERBOARD: 'puzzle-leaderboard',
  HISTORY: 'puzzle-history',
  
  // 统计数据 (Stats)
  VISITOR_COUNT: 'puzzle-visitor-count',
  GAME_START_COUNT: 'puzzle-game-start-count',
  
  // 云端同步 (Cloud Sync)
  OFFLINE_QUEUE: 'supabase-offline-game-sessions',
  MIGRATION_PREFIX: 'supabase_migration_done_',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * 获取带用户前缀的键名（用于多账号迁移标记）
 */
export const getUserMigrationKey = (userId: string) => `${STORAGE_KEYS.MIGRATION_PREFIX}${userId}`;
