'use client';

import { useEffect, useRef } from 'react';
import { CloudGameRepository } from '@/utils/cloud/CloudGameRepository';
import { GameDataManager } from '@/utils/data/GameDataManager';
import { GameAction, GameState, GameStats, validateGameStats, validateScoreBreakdown } from '@/types/puzzleTypes';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMigrationKey } from '@/utils/storageKeys';

/**
 * 云端同步钩子
 * 负责游戏完成后的上传、离线队列同步、登录后的数据迁移和多端对齐
 */
export function useCloudSync(state: GameState, dispatch: React.Dispatch<GameAction>) {
  const { user } = useAuth();
  const lastUploadedGameKeyRef = useRef<string | null>(null);

  // 1. 游戏完成后同步 (Session Upload)
  useEffect(() => {
    if (!state.isGameComplete || !state.gameStats) return;
    if (!state.gameStats.difficulty?.difficultyLevel) return;

    const gameEndTimeMs = state.gameStats.gameEndTime ?? Date.now();
    const diffLevel = state.gameStats.difficulty.difficultyLevel;
    const key = `${state.gameStats.gameStartTime}-${gameEndTimeMs}-${diffLevel}-${state.currentScore}`;
    
    if (lastUploadedGameKeyRef.current === key) return;
    lastUploadedGameKeyRef.current = key;

    (async () => {
      // 增加类型校验，防止坏数据污染云端
      const stats = state.gameStats;
      const breakdown = state.scoreBreakdown;

      if (!validateGameStats(stats)) {
        console.error("[useCloudSync] GameStats 校验失败，取消上传", stats);
        return;
      }

      if (breakdown && !validateScoreBreakdown(breakdown)) {
        console.error("[useCloudSync] ScoreBreakdown 校验失败，取消上传", breakdown);
        return;
      }

      try {
        await CloudGameRepository.uploadGameSession({
          gameStats: stats as GameStats,
          finalScore: state.currentScore,
          scoreBreakdown: breakdown ?? null,
        });
      } catch (e) {
        console.warn("[useCloudSync] 云端上传失败 (非致命):", e);
      }
    })();
  }, [state.isGameComplete, state.gameStats, state.currentScore, state.scoreBreakdown]);

  // 重置上传标记
  useEffect(() => {
    if (state.isGameActive) {
      lastUploadedGameKeyRef.current = null;
    }
  }, [state.isGameActive]);

  // 2. 离线同步 (Offline Queue Sync)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("[useCloudSync] 网络恢复，正在同步离线会话...");
      CloudGameRepository.syncOfflineSessions();
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) {
      CloudGameRepository.syncOfflineSessions();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // 3. 登录后同步与迁移 (Auth-driven Sync)
  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    console.log(`[useCloudSync] 用户已登录 (${userId})，执行数据对齐...`);

    // A. 同步离线队列
    CloudGameRepository.syncOfflineSessions();

    // B. 一次性本地数据迁移
    const migrationKey = getUserMigrationKey(userId);
    if (typeof window !== "undefined" && !localStorage.getItem(migrationKey)) {
      console.log("[useCloudSync] 触发一次性本地记录向云端迁移...");
      const localHistory = GameDataManager.getGameHistory();
      if (localHistory.length > 0) {
        CloudGameRepository.migrateLocalHistoryToCloud(localHistory).then((res) => {
          localStorage.setItem(migrationKey, "true");
          console.log(`[useCloudSync] 本地数据迁移完成: 成功 ${res.successCount}, 失败 ${res.failedCount}`);
        });
      } else {
        localStorage.setItem(migrationKey, "true");
      }
    }

    // C. 拉取云端最新数据进行多端合并
    CloudGameRepository.fetchUserGameHistory().then((cloudRecords) => {
      if (cloudRecords.length > 0) {
        GameDataManager.syncWithCloudRecords(cloudRecords);
        // 通知 UI 加载同步后的数据
        dispatch({ 
          type: "LOAD_LEADERBOARD", 
          payload: GameDataManager.getLeaderboard() 
        });
      }
    });
  }, [user, dispatch]);

  return null;
}
