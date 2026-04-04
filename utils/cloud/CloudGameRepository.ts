import { isSupabaseConfigured, supabase } from "@/lib/supabase/browserClient";
import {
  CutType,
  DifficultyConfig,
  DifficultyLevel,
  GameRecord,
  ShapeType,
  type GameStats,
  ScoreBreakdown,
} from "@/types/puzzleTypes";
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
  };
};

const OFFLINE_QUEUE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;

type OfflineSession = {
  gameStats: GameStats;
  finalScore: number;
  scoreBreakdown: ScoreBreakdown | null;
};

import { ICloudGameRepository } from "./ICloudGameRepository";

class CloudGameRepositoryClass implements ICloudGameRepository {
  async getCurrentUserId(): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session?.user?.id ?? null;
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
    if (!isSupabaseConfigured || !supabase) return { skipped: true };
    const userId = await this.getCurrentUserId();

    if (!userId) {
      if (!skipQueue) this.addToOfflineQueue(params);
      return { skipped: true };
    }

    const gameEndTimeMs = params.gameStats.gameEndTime ?? Date.now();
    const difficultyLevel = params.gameStats.difficulty.difficultyLevel as DifficultyLevel;
    const durationMs = Math.max(0, Math.round(params.gameStats.totalDuration * 1000));
    const idempotencyKey = `${userId}-${gameEndTimeMs}-${difficultyLevel}-${Math.round(params.finalScore)}`;

    const { error } = await supabase.from("game_sessions").insert({
      user_id: userId,
      idempotency_key: idempotencyKey,
      difficulty: difficultyLevel,
      duration_ms: durationMs,
      score: Math.round(params.finalScore),
      moves: params.gameStats.totalRotations,
      client_created_at: new Date(gameEndTimeMs).toISOString(),
      metadata: {
        scoreBreakdown: params.scoreBreakdown,
        deviceType: params.gameStats.deviceType,
        canvasSize: params.gameStats.canvasSize,
        hintUsageCount: params.gameStats.hintUsageCount,
        dragOperations: params.gameStats.dragOperations,
        rotationEfficiency: params.gameStats.rotationEfficiency,
        gameStartTime: params.gameStats.gameStartTime,
      },
    });

    if (error) {
      if (error.code === "23505") return { skipped: false };
      if (!skipQueue) this.addToOfflineQueue(params);
      return { skipped: false, error };
    }

    return { skipped: false };
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

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineSession[] = [];

    for (const session of queue) {
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

  async fetchUserGameHistory(): Promise<GameRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("client_created_at", { ascending: false });

    if (error) return [];

    return (data ?? []).map((row: any) => {
      const difficultyLevel = row.difficulty as DifficultyLevel;
      return {
        timestamp: new Date(row.client_created_at).getTime(),
        finalScore: row.score,
        totalDuration: Math.round(row.duration_ms / 1000),
        difficulty: {
          difficultyLevel,
          cutCount: cutCountFromDifficultyLevel(difficultyLevel),
          cutType: CutType.Straight,
          actualPieces: getPieceCountByDifficulty(difficultyLevel),
          shapeType: ShapeType.Polygon,
        },
        deviceInfo: {
          type: row.metadata?.deviceType || "unknown",
          screenWidth: row.metadata?.canvasSize?.width || 0,
          screenHeight: row.metadata?.canvasSize?.height || 0,
        },
        totalRotations: row.moves || 0,
        hintUsageCount: row.metadata?.hintUsageCount || 0,
        dragOperations: row.metadata?.dragOperations || 0,
        rotationEfficiency: row.metadata?.rotationEfficiency || 1.0,
        scoreBreakdown: row.metadata?.scoreBreakdown || null,
        gameStartTime: row.metadata?.gameStartTime || (new Date(row.client_created_at).getTime() - row.duration_ms),
        id: row.id,
      };
    });
  }

  async migrateLocalHistoryToCloud(records: GameRecord[]): Promise<{ successCount: number; failedCount: number }> {
    if (!isSupabaseConfigured || !supabase) return { successCount: 0, failedCount: 0 };
    const userId = await this.getCurrentUserId();
    if (!userId) return { successCount: 0, failedCount: 0 };

    let successCount = 0;
    let failedCount = 0;

    for (const record of records) {
      const params = {
        gameStats: {
          gameStartTime: record.gameStartTime || record.timestamp - (record.totalDuration * 1000),
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
        finalScore: record.finalScore,
        scoreBreakdown: record.scoreBreakdown,
      };

      const result = await this.uploadGameSession(params, true);
      if (!result.error) successCount++;
      else failedCount++;
    }

    if (successCount > 0) console.log(`[CloudGameRepository] 历史记录迁移完成: 成功 ${successCount}`);
    return { successCount, failedCount };
  }

  async fetchPublicLeaderboard(difficulty: DifficultyLevel | "all" = "all"): Promise<GameRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const limit = 50;

    let query = supabase.from("leaderboards").select("*").order("best_score", { ascending: false }).limit(limit);
    if (difficulty !== "all") query = query.eq("difficulty", difficulty);

    const { data, error } = await query;
    if (error) return [];

    const rows = (data ?? []) as PublicLeaderboardRow[];
    return rows.map(mapPublicRowToGameRecord);
  }

  async deleteAllUserGameSessions(): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !supabase) return { success: false };
    const userId = await this.getCurrentUserId();
    if (!userId) return { success: false };

    const { error } = await supabase.from("game_sessions").delete().eq("user_id", userId);
    this.saveOfflineQueue([]);
    return { success: !error, error };
  }
}

export const CloudGameRepository = new CloudGameRepositoryClass();
