'use client';

import { useEffect, useRef } from 'react';
import { CloudGameRepository } from '@/utils/cloud/CloudGameRepository';
import { GameDataManager } from '@/utils/data/GameDataManager';
import { GameAction, GameState, GameStats, validateGameStats, validateScoreBreakdown } from '@generative-puzzle/game-core';
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
    if (!user) {
      console.log("[useCloudSync] 用户未登录，跳过自动同步");
      return;
    }

    const userId = user.id;
    const migrationKey = getUserMigrationKey(userId);
    
    (async () => {
      console.log(`[useCloudSync] 🔄 用户已登录 (${userId})，启动全面数据对齐...`);

      // A. 同步离线队列 (处理故障恢复)
      try {
        await CloudGameRepository.syncOfflineSessions();
      } catch (e) {
        console.warn("[useCloudSync] 离线队列同步失败:", e);
      }

      // B. 本地历史迁移 (仅执行一次，除非显式重置)
      if (typeof window !== "undefined" && !localStorage.getItem(migrationKey)) {
        console.log("[useCloudSync] 🚀 触发首次登录本地记录迁移...");
        const localHistory = GameDataManager.getGameHistory();
        if (localHistory.length > 0) {
          const res = await CloudGameRepository.migrateLocalHistoryToCloud(localHistory);
          if (res.successCount > 0 || res.failedCount === 0) {
             localStorage.setItem(migrationKey, "true");
             console.log(`[useCloudSync] ✅ 迁移成功: ${res.successCount} 条`);
          }
        } else {
          localStorage.setItem(migrationKey, "true");
        }
      }

      // C. 拉取云端数据并合并
      try {
        const cloudRecords = await CloudGameRepository.fetchUserGameHistory();
        console.log(`[useCloudSync] ☁️ 已拉取云端记录: ${cloudRecords.length} 条`);
        
        // 无条件同步：即使云端为空（[]），也要传递给 syncWithCloudRecords，
        // 这样它就会执行 "如果云端为空则强制清空本地脏数据" 的逻辑。
        GameDataManager.syncWithCloudRecords(cloudRecords);
        
        // 重新从本地存储加载合并（或已清空）后的数据并更新 UI
        const mergedLeaderboard = GameDataManager.getLeaderboard();
        dispatch({ 
          type: "LOAD_LEADERBOARD", 
          payload: mergedLeaderboard
        });
        
        console.log("[useCloudSync] 🏁 数据同步完成，UI 已刷新");
      } catch (fetchErr) {
        console.error("[useCloudSync] 云端数据拉取失败:", fetchErr);
      }
    })();
  }, [user, dispatch]);

  return null;
}
