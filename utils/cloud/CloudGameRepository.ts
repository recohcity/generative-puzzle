import { isSupabaseConfigured, supabase } from "@/lib/supabase/browserClient";
import {
  CutType,
  DifficultyConfig,
  DifficultyLevel,
  GameRecord,
  ShapeType,
  type GameStats,
  ScoreBreakdown,
} from "@generative-puzzle/game-core";
import { getPieceCountByDifficulty } from "@/utils/difficulty/DifficultyUtils";
import { STORAGE_KEYS } from "@/utils/storageKeys";

type PublicLeaderboardRow = {
  user_id: string;
  display_name: string | null;
  difficulty: string; // difficultyLevel
  best_score: number | null;
  best_duration_ms: number | null;
  sessions_count: number | null;
  updated_at: string | null;
};

const cutCountFromDifficultyLevel = (level: DifficultyLevel): number => {
  switch (level) {
    case "easy": return 3;
    case "medium": return 6;
    case "hard": return 7;
    case "extreme": return 8;
    case "expert": return 8;
  }
};

const mapPublicRowToGameRecord = (row: PublicLeaderboardRow): GameRecord => {
  const difficultyLevel = row.difficulty as DifficultyLevel;
  const cutCount = cutCountFromDifficultyLevel(difficultyLevel);
  const actualPieces = getPieceCountByDifficulty(difficultyLevel);

  const updatedAtMs = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
  const bestDurationSeconds = row.best_duration_ms
    ? Math.max(0, Math.round(row.best_duration_ms / 1000))
    : 0;

  return {
    timestamp: updatedAtMs,
    finalScore: row.best_score ?? 0,
    totalDuration: bestDurationSeconds,
    difficulty: {
      difficultyLevel,
      cutCount,
      cutType: CutType.Straight,
      actualPieces,
      shapeType: ShapeType.Polygon,
    },
    deviceInfo: { type: "desktop", screenWidth: 0, screenHeight: 0 },
    totalRotations: 0,
    hintUsageCount: 0,
    dragOperations: 0,
    rotationEfficiency: 1.0,
    scoreBreakdown: null,
    id: row.user_id,
    nickname: row.display_name,
    displayName: row.display_name,
    sessionsCount: row.sessions_count ?? 0,
  } as GameRecord & { displayName?: string | null; nickname?: string | null; sessionsCount?: number };
};

const OFFLINE_QUEUE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;

type OfflineSession = {
  gameStats: GameStats;
  finalScore: number;
  scoreBreakdown: ScoreBreakdown | null;
};

import { ICloudGameRepository } from "./ICloudGameRepository";

class CloudGameRepositoryClass implements ICloudGameRepository {
  private consecutiveErrors = 0;
  private lastErrorTime = 0;
  private readonly MELT_COOLDOWN_MS = 30000; // 30秒熔断期
  private readonly MAX_CONSECUTIVE_ERRORS = 3;

  private isMelted(): boolean {
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      const now = Date.now();
      if (now - this.lastErrorTime < this.MELT_COOLDOWN_MS) {
        return true;
      }
      // 冷却期结束，重置一部分错误计数，尝试“半开”重连
      this.consecutiveErrors = 1; 
    }
    return false;
  }

  private handleNetworkError(e: any, context: string) {
    const isFetchError = e instanceof Error && (
      e.message.includes('fetch') || 
      e.message.includes('Network') ||
      e.name === 'TypeError'
    );

    if (isFetchError) {
      this.consecutiveErrors++;
      this.lastErrorTime = Date.now();
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        console.warn(`[CloudGameRepository] 网络请求异常(熔断锁定): ${context}`, e.message);
      } else {
        console.error(`[CloudGameRepository] 网络请求失败: ${context}`, e.message);
      }
    } else {
      console.error(`[CloudGameRepository] 业务处理异常: ${context}`, e);
    }
  }

  async getCurrentUserId(): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase || this.isMelted()) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // Auth 错误不一定是网络错误，不需要触发强熔断，但记录日志
        return null;
      }
      this.consecutiveErrors = 0; // 成功一次，重置
      return data.session?.user?.id ?? null;
    } catch (e) {
      this.handleNetworkError(e, "getCurrentUserId");
      return null;
    }
  }

  getOfflineQueue(): OfflineSession[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveOfflineQueue(queue: OfflineSession[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {}
  }

  async uploadGameSession(
    params: { gameStats: GameStats; finalScore: number; scoreBreakdown: ScoreBreakdown | null },
    skipQueue = false
  ): Promise<{ skipped: boolean; error?: any }> {
    if (!isSupabaseConfigured || !supabase || this.isMelted()) return { skipped: true };
    const userId = await this.getCurrentUserId();

    if (!userId) {
      if (!skipQueue) this.addToOfflineQueue(params);
      return { skipped: true };
    }

    try {
      const gameEndTimeMs = params.gameStats.gameEndTime ?? Date.now();
      const diff = params.gameStats.difficulty;
      const difficultyLevel = diff.difficultyLevel as DifficultyLevel;
      const durationMs = Math.max(0, Math.round(params.gameStats.totalDuration * 1000));
      
      const idempotencyKey = `${userId}-${gameEndTimeMs}-${difficultyLevel}-${diff?.cutCount}-${diff?.cutType}-${diff?.shapeType}-${Math.round(params.finalScore)}`;

      // 预检：如果幂等键已存在，静默跳过（避免 409 Conflict 出现在控制台）
      const { data: existing } = await supabase
        .from("game_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .limit(1);
      
      if (existing && existing.length > 0) {
        return { skipped: false }; // 已存在，静默成功
      }

      const safeNum = (val: any) => (Number.isFinite(val) ? Math.round(val) : 0);
      const safeFloat = (val: any) => (Number.isFinite(val) ? val : 0);

      // 注意：game_sessions 表中没有 cut_count/cut_type/shape_type 列
      // 这些精度字段统一存入 metadata JSONB
      const { error } = await supabase.from("game_sessions").insert({
        user_id: userId,
        idempotency_key: idempotencyKey,
        difficulty: (difficultyLevel as string).toLowerCase(),
        duration_ms: safeNum(durationMs),
        score: safeNum(params.finalScore),
        moves: safeNum(params.gameStats?.totalRotations),
        client_created_at: new Date(gameEndTimeMs).toISOString(),
        metadata: {
          cutCount: safeNum(diff?.cutCount),
          cutType: diff?.cutType || 'straight',
          shapeType: diff?.shapeType || 'polygon',
          scoreBreakdown: params.scoreBreakdown || {},
          deviceType: params.gameStats.deviceType || 'unknown',
          canvasSize: params.gameStats.canvasSize || { width: 0, height: 0 },
          hintUsageCount: safeNum(params.gameStats.hintUsageCount),
          dragOperations: safeNum(params.gameStats.dragOperations),
          rotationEfficiency: safeFloat(params.gameStats.rotationEfficiency),
          gameStartTime: safeNum(params.gameStats.gameStartTime),
        },
      });

      if (error) {
        if (error.code === "23505") return { skipped: false };
        if (!skipQueue) this.addToOfflineQueue(params);
        return { skipped: false, error };
      }

      // 更新用户的最高分记录 (best_score)
      try {
        const { data: profile } = await supabase
          .from("player_profiles")
          .select("best_score")
          .eq("id", userId)
          .single();

        if (profile && params.finalScore > profile.best_score) {
          await supabase
            .from("player_profiles")
            .update({ best_score: params.finalScore })
            .eq("id", userId);
        }
      } catch (profileUpdateErr) {
        // 内部静默失败
      }

      this.consecutiveErrors = 0;
      return { skipped: false };
    } catch (e) {
      this.handleNetworkError(e, "uploadGameSession");
      if (!skipQueue) this.addToOfflineQueue(params);
      return { skipped: false, error: e };
    }
  }

  addToOfflineQueue(session: { gameStats: GameStats; finalScore: number; scoreBreakdown: ScoreBreakdown | null }) {
    const queue = this.getOfflineQueue();
    const isDuplicate = queue.some(
      (s) => s.gameStats.gameStartTime === session.gameStats.gameStartTime && s.finalScore === session.finalScore
    );
    if (isDuplicate) return;

    queue.push(session);
    this.saveOfflineQueue(queue.slice(-50));
  }

  async syncOfflineSessions(): Promise<{ successCount: number; failedCount: number }> {
    if (!isSupabaseConfigured || !supabase) return { successCount: 0, failedCount: 0 };
    const userId = await this.getCurrentUserId();
    if (!userId) return { successCount: 0, failedCount: 0 };

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { successCount: 0, failedCount: 0 };

    // 获取云端已有的记录，避免 409
    const existingKeys = await this.fetchExistingIdempotencyKeys();

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineSession[] = [];

    for (const session of queue) {
      const gameEndTimeMs = session.gameStats.gameEndTime ?? Date.now();
      const difficultyLevel = session.gameStats.difficulty.difficultyLevel;
      const idempotencyKey = `${userId}-${gameEndTimeMs}-${difficultyLevel}-${Math.round(session.finalScore)}`;

      if (existingKeys.has(idempotencyKey)) {
        successCount++;
        continue;
      }

      const result = await this.uploadGameSession(session, true);
      if (!result.error) successCount++;
      else {
        failedCount++;
        remainingQueue.push(session);
      }
    }

    this.saveOfflineQueue(remainingQueue);
    if (successCount > 0) console.log(`[CloudGameRepository] 离线同步完成: 成功 ${successCount}, 失败 ${failedCount}`);
    return { successCount, failedCount };
  }

  /**
   * 获取当前用户在云端已有的所有幂等键，用于上传前过滤，避免 409 错误
   */
  private async fetchExistingIdempotencyKeys(): Promise<Set<string>> {
    if (!isSupabaseConfigured || !supabase || this.isMelted()) return new Set();
    const userId = await this.getCurrentUserId();
    if (!userId) return new Set();

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("idempotency_key")
        .eq("user_id", userId);

      if (error) {
        return new Set();
      }

      this.consecutiveErrors = 0;
      return new Set((data || []).map((row: any) => row.idempotency_key));
    } catch (e) {
      this.handleNetworkError(e, "fetchExistingIdempotencyKeys");
      return new Set();
    }
  }

  async fetchUserGameHistory(): Promise<GameRecord[]> {
    if (!isSupabaseConfigured || !supabase || this.isMelted()) return [];
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("client_created_at", { ascending: false });

      if (error) return [];

      this.consecutiveErrors = 0;
      return (data ?? []).map((row: any) => {
        const difficultyLevel = row.difficulty as DifficultyLevel;
        // 精度字段从 metadata JSONB 中读取
        const meta = row.metadata || {};
        return {
          timestamp: new Date(row.client_created_at).getTime(),
          finalScore: row.score,
          totalDuration: Math.round(row.duration_ms / 1000),
          difficulty: {
            difficultyLevel,
            cutCount: meta.cutCount || cutCountFromDifficultyLevel(difficultyLevel),
            cutType: (meta.cutType as any) || CutType.Straight,
            actualPieces: (meta.cutCount ? meta.cutCount + 1 : getPieceCountByDifficulty(difficultyLevel)),
            shapeType: (meta.shapeType as any) || ShapeType.Polygon,
          },
          totalRotations: row.moves || 0,
          id: row.id,
        } as any;
      });
    } catch (e) {
      this.handleNetworkError(e, "fetchUserGameHistory");
      return [];
    }
  }

  async migrateLocalHistoryToCloud(records: GameRecord[]): Promise<{ successCount: number; failedCount: number }> {
    if (!isSupabaseConfigured || !supabase) return { successCount: 0, failedCount: 0 };
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn("[CloudGameRepository] 迁移失败: 未找到当前用户ID");
      return { successCount: 0, failedCount: 0 };
    }

    // 1. 获取云端已有的记录，用于静默过滤
    const existingKeys = await this.fetchExistingIdempotencyKeys();
    console.log(`[CloudGameRepository] 开始为用户 ${userId} 迁移 ${records.length} 条本地历史成绩 (已同步: ${existingKeys.size})...`);

    let successCount = 0;
    let failedCount = 0;

    // 按时间升序排序，确保最高分更新逻辑按顺序执行
    const sortedRecords = [...records].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    for (const record of sortedRecords) {
      const gameEndTimeMs = record.timestamp;
      const difficultyLevel = record.difficulty.difficultyLevel;
      const finalScore = record.finalScore || 0;
      
      // 构造幂等键进行本地比对
      const idempotencyKey = `${userId}-${gameEndTimeMs}-${difficultyLevel}-${Math.round(finalScore)}`;
      if (existingKeys.has(idempotencyKey)) {
        // 静默跳过，不再发送网络请求，避免控制台 409
        successCount++;
        continue;
      }

      const startTime = record.gameStartTime || (record.timestamp - (record.totalDuration * 1000));
      
      const params = {
        gameStats: {
          gameStartTime: startTime,
          gameEndTime: record.timestamp,
          totalDuration: record.totalDuration,
          difficulty: record.difficulty,
          totalRotations: record.totalRotations,
          hintUsageCount: record.hintUsageCount,
          dragOperations: record.dragOperations,
          rotationEfficiency: record.rotationEfficiency,
          deviceType: record.deviceInfo?.type || "desktop",
          canvasSize: { width: record.deviceInfo?.screenWidth || 640, height: record.deviceInfo?.screenHeight || 640 },
        } as any,
        finalScore: (record.finalScore || 0),
        scoreBreakdown: record.scoreBreakdown || null,
      };

      try {
        const result = await this.uploadGameSession(params, true);
        if (!result.error) {
          successCount++;
        } else if (result.error.code === "23505") {
          // 已经存在，视为同步成功（幂等）
          successCount++;
        } else {
          console.warn(`[CloudGameRepository] 记录迁移失败 (TS: ${record.timestamp}):`, result.error);
          failedCount++;
        }
      } catch (err) {
        console.error("[CloudGameRepository] 迁移异常:", err);
        failedCount++;
      }
    }

    if (successCount > 0) {
      console.log(`[CloudGameRepository] 历史记录迁移完成: 成功 ${successCount}, 失败 ${failedCount}`);
    }
    return { successCount, failedCount };
  }

  async fetchPublicLeaderboard(difficulty: DifficultyLevel | "all" = "all"): Promise<GameRecord[]> {
    if (!isSupabaseConfigured || !supabase || this.isMelted()) return [];
    try {
      const limit = 50;

      let query = supabase.from("leaderboards").select("*").order("best_score", { ascending: false }).limit(limit);
      if (difficulty !== "all") query = query.eq("difficulty", difficulty);

      const { data, error } = await query;
      if (error) return [];

      this.consecutiveErrors = 0;
      const rows = (data ?? []) as PublicLeaderboardRow[];
      return rows.map(mapPublicRowToGameRecord);
    } catch (e) {
      this.handleNetworkError(e, "fetchPublicLeaderboard");
      return [];
    }
  }

  async clearGameRecordsRPC(): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !supabase) return { success: false };
    const userId = await this.getCurrentUserId();
    if (!userId) return { success: false };

    // 调用部署在服务端的 Security Definer RPC 进行合规级清理
    const { error } = await supabase.rpc('clear_user_game_sessions');
    this.saveOfflineQueue([]);
    return { success: !error, error };
  }

  // === Administrative Methods (Internal Use) ===

  /**
   * 获取所有玩家简要信息 (管理端专用)
   */
  async adminFetchAllProfiles(): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const { data, error } = await supabase
      .from("player_profiles")
      .select("*")
      .order("best_score", { ascending: false });
    
    if (error) {
      console.error("[Admin] Fetch profiles failed:", error);
      return [];
    }
    return data || [];
  }

  /**
   * 删除特定用户的所有游戏记录
   */
  async adminDeleteUserScores(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    const { error } = await supabase
      .from("game_sessions")
      .delete()
      .eq("user_id", userId);
    
    if (error) return false;

    // 清除该用户的汇总排行榜记录
    await supabase
      .from("public_leaderboard_entries")
      .delete()
      .eq("user_id", userId);

    // 同时重置该用户的最高分
    await supabase
      .from("player_profiles")
      .update({ best_score: 0 })
      .eq("id", userId);

    return true;
  }

  /**
   * 彻底注销用户身份并清除所有关联数据
   */
  async adminDeleteUserCompletely(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    
    // 1. 删除所有成绩记录
    await supabase.from("game_sessions").delete().eq("user_id", userId);
    
    // 2. 清除汇总排行榜
    await supabase.from("public_leaderboard_entries").delete().eq("user_id", userId);
    
    // 3. 删除用户档案
    const { error } = await supabase.from("player_profiles").delete().eq("id", userId);
    
    return !error;
  }
}

export const CloudGameRepository = new CloudGameRepositoryClass();
