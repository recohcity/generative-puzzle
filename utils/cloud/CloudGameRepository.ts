import { supabase } from "@/lib/supabase/browserClient";
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

export const CloudGameRepository = {
  async getCurrentUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[CloudGameRepository] getSession error:", error);
      return null;
    }
    return data.session?.user?.id ?? null;
  },

  async uploadGameSession(params: {
    gameStats: GameStats;
    finalScore: number;
    scoreBreakdown: any;
  }): Promise<{ skipped: boolean }> {
    const userId = await this.getCurrentUserId();
    if (!userId) return { skipped: true };

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
        // keep payload small for MVP; add more fields later if needed
      },
    });

    if (error) {
      console.warn("[CloudGameRepository] uploadGameSession insert error:", error);
      // Don't block gameplay; conflict/duplicate should be non-fatal.
      return { skipped: false };
    }

    return { skipped: false };
  },

  async fetchPublicLeaderboard(params?: {
    limit?: number;
    difficulty?: DifficultyLevel | "all";
  }): Promise<GameRecord[]> {
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

