import { GameStats, GameRecord, DifficultyLevel, ScoreBreakdown } from "@generative-puzzle/game-core";

export interface ICloudGameRepository {
  getCurrentUserId(): Promise<string | null>;
  getOfflineQueue(): any[];
  saveOfflineQueue(queue: any[]): void;
  uploadGameSession(
    params: { gameStats: GameStats; finalScore: number; scoreBreakdown: ScoreBreakdown | null },
    skipQueue?: boolean
  ): Promise<{ skipped: boolean; error?: any }>;
  syncOfflineSessions(): Promise<{ successCount: number; failedCount: number }>;
  fetchUserGameHistory(): Promise<GameRecord[]>;
  fetchPublicLeaderboard(difficulty: DifficultyLevel): Promise<GameRecord[]>;
  migrateLocalHistoryToCloud(localHistory: GameRecord[]): Promise<{ successCount: number; failedCount: number }>;
  deleteAllUserGameSessions(): Promise<{ success: boolean; error?: any }>;
}
