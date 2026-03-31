import { isSupabaseConfigured, supabase } from "@/lib/supabase/browserClient";
import {
  CutType,
  DifficultyConfig,
  DifficultyLevel,
  GameRecord,
  ShapeType,
  type GameStats,
} from "@/types/puzzleTypes";
import { getPieceCountByDifficulty } from "@/utils/difficulty/DifficultyUtils";

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
  // Reverse of calculateDifficultyLevel with representative values.
  switch (level) {
    case "easy":
      return 3; // <=3
    case "medium":
      return 6; // <=6
    case "hard":
      return 7; // <=7
    case "extreme":
      return 8; // >7
    case "expert":
      return 8; // compatibility bucket (we don't currently distinguish in UI)
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
    deviceInfo: {
      type: "desktop",
      screenWidth: 0,
      screenHeight: 0,
    },
    totalRotations: 0,
    hintUsageCount: 0,
    dragOperations: 0,
    rotationEfficiency: 1.0,
    scoreBreakdown: {},
  };
};

const OFFLINE_QUEUE_KEY = "supabase-offline-game-sessions";

type OfflineSession = {
  gameStats: GameStats;
  finalScore: number;
  scoreBreakdown: any;
};

export const CloudGameRepository = {
  async getCurrentUserId(): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[CloudGameRepository] getSession error:", error);
      return null;
    }
    return data.session?.user?.id ?? null;
  },

  /**
   * Internal method to get the offline queue from localStorage.
   */
  getOfflineQueue(): OfflineSession[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("[CloudGameRepository] Failed to read offline queue:", e);
      return [];
    }
  },

  /**
   * Internal method to save the offline queue to localStorage.
   */
  saveOfflineQueue(queue: OfflineSession[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("[CloudGameRepository] Failed to save offline queue:", e);
    }
  },

  /**
   * Uploads a game session to Supabase.
   * If it fails and skipQueue is false, it adds the session to the offline queue.
   */
  async uploadGameSession(
    params: {
      gameStats: GameStats;
      finalScore: number;
      scoreBreakdown: any;
    },
    skipQueue = false
  ): Promise<{ skipped: boolean; error?: any }> {
    if (!isSupabaseConfigured || !supabase) return { skipped: true };
    const userId = await this.getCurrentUserId();

    // If user is not logged in, we still want to queue it for later sync after login.
    if (!userId) {
      if (!skipQueue) {
        this.addToOfflineQueue(params);
      }
      return { skipped: true };
    }

    const gameEndTimeMs = params.gameStats.gameEndTime ?? Date.now();
    const difficultyLevel = params.gameStats.difficulty.difficultyLevel as DifficultyLevel;
    const durationMs = Math.max(0, Math.round(params.gameStats.totalDuration * 1000));

    // Deterministic idempotency to avoid duplicates on retries.
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
      // If it's a conflict/duplicate, it's technically a "success" for our sync logic.
      if (error.code === "23505") { // Unique violation
        return { skipped: false };
      }

      console.warn("[CloudGameRepository] uploadGameSession insert error:", error);
      if (!skipQueue) {
        this.addToOfflineQueue(params);
      }
      return { skipped: false, error };
    }

    return { skipped: false };
  },

  /**
   * Adds a session to the offline queue.
   */
  addToOfflineQueue(params: OfflineSession) {
    const queue = this.getOfflineQueue();
    // Simple check to avoid exact duplicates in queue
    const isDuplicate = queue.some(
      (s) =>
        s.gameStats.gameStartTime === params.gameStats.gameStartTime &&
        s.finalScore === params.finalScore
    );
    if (isDuplicate) return;

    queue.push(params);
    this.saveOfflineQueue(queue.slice(-50)); // Keep last 50 sessions
    console.log("[CloudGameRepository] Session added to offline queue.");
  },

  /**
   * Syncs all queued offline sessions to the cloud.
   * Usually called after login or when the app comes back online.
   */
  async syncOfflineSessions(): Promise<{ successCount: number; failedCount: number }> {
    if (!isSupabaseConfigured || !supabase) return { successCount: 0, failedCount: 0 };
    const userId = await this.getCurrentUserId();
    if (!userId) return { successCount: 0, failedCount: 0 };

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { successCount: 0, failedCount: 0 };

    console.log(`[CloudGameRepository] Syncing ${queue.length} offline sessions...`);
    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: OfflineSession[] = [];

    // Process sessions one by one.
    for (const session of queue) {
      const result = await this.uploadGameSession(session, true); // Don't re-queue if this fails
      if (!result.error) {
        successCount++;
      } else {
        // If it failed due to something else than duplicate, keep it in queue.
        failedCount++;
        remainingQueue.push(session);
      }
    }

    this.saveOfflineQueue(remainingQueue);
    console.log(`[CloudGameRepository] Sync complete. Success: ${successCount}, Failed: ${failedCount}`);
    return { successCount, failedCount };
  },

  /**
   * Fetches the current user's game history from the cloud.
   */
  async fetchUserGameHistory(): Promise<GameRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("client_created_at", { ascending: false });

    if (error) {
      console.warn("[CloudGameRepository] fetchUserGameHistory error:", error);
      return [];
    }

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
        scoreBreakdown: row.metadata?.scoreBreakdown || {},
        gameStartTime: row.metadata?.gameStartTime || (new Date(row.client_created_at).getTime() - row.duration_ms),
        id: row.id,
      };
    });
  },

  /**
   * Migrates local history records (from GameDataManager) to the cloud.
   */
  async migrateLocalHistoryToCloud(records: GameRecord[]): Promise<{ successCount: number; failedCount: number }> {
    if (!isSupabaseConfigured || !supabase) return { successCount: 0, failedCount: 0 };
    const userId = await this.getCurrentUserId();
    if (!userId) return { successCount: 0, failedCount: 0 };

    console.log(`[CloudGameRepository] Migrating ${records.length} local records to cloud...`);
    let successCount = 0;
    let failedCount = 0;

    for (const record of records) {
      // Reconstruct necessary fields for uploadGameSession.
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
          canvasSize: {
            width: record.deviceInfo?.screenWidth || 640,
            height: record.deviceInfo?.screenHeight || 640,
          },
        } as any,
        finalScore: record.finalScore,
        scoreBreakdown: record.scoreBreakdown,
      };

      const result = await this.uploadGameSession(params, true); // Use skipQueue=true to avoid redundant queuing
      if (!result.error) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    console.log(`[CloudGameRepository] Migration complete. Success: ${successCount}, Failed: ${failedCount}`);
    return { successCount, failedCount };
  },

  async fetchPublicLeaderboard(params?: {
    limit?: number;
    difficulty?: DifficultyLevel | "all";
  }): Promise<GameRecord[]> {

    if (!isSupabaseConfigured || !supabase) return [];
    const limit = params?.limit ?? 50;
    const difficulty = params?.difficulty ?? "all";

    let query = supabase
      .from("leaderboards")
      .select("*")
      .order("best_score", { ascending: false })
      .limit(limit);

    if (difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[CloudGameRepository] fetchPublicLeaderboard error:", error);
      return [];
    }

    const rows = (data ?? []) as PublicLeaderboardRow[];
    return rows.map(mapPublicRowToGameRecord);
  },
};


