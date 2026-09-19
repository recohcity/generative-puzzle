/**
 * 游戏完成逻辑（从 GameContext 抽出，纯函数，无 React 依赖）
 *
 * 输入：当前 state + dispatch
 * 输出：无（通过 dispatch 触发 GAME_COMPLETED）
 *
 * 职责：算分 → 持久化 → 判断新纪录 → 分派完成 action
 */
import { GameDataManager } from "@/utils/data/GameDataManager";
import {
  calculateFinalScore,
} from "@generative-puzzle/game-core";
import type {
  GameState,
  GameAction,
  GameStats,
} from "@generative-puzzle/game-core";

export const executeGameCompletion = (
  state: GameState,
  dispatch: React.Dispatch<GameAction>
) => {
  // 1. 状态锁：如果已经标记为完成，则不再执行
  if (!state.gameStats || !state.isGameActive || state.isGameComplete) return;

  // 1. 计算完成统计
  const gameEndTime = Date.now();
  const totalDuration = Math.round(
    (gameEndTime - state.gameStats.gameStartTime) / 1000
  );

  const completedStats: GameStats = {
    ...state.gameStats,
    gameEndTime,
    totalDuration,
  };

  // 2. 计算并持久化结果
  const currentLeaderboard = GameDataManager.getLeaderboard();
  const scoreBreakdown = calculateFinalScore(
    completedStats,
    state.puzzle || [],
    currentLeaderboard
  );
  const finalScore = scoreBreakdown.finalScore;

  // 写回旋转效率（ScoreCalculator 返回 0-100 百分比，归一化为 0-1 小数，供勋章判定）
  completedStats.rotationEfficiency = Math.min(1, Math.max(0, scoreBreakdown.rotationEfficiency / 100));

  const saveSuccess = GameDataManager.saveGameRecord(
    completedStats,
    finalScore,
    scoreBreakdown
  );

  let isNewRecord = false;
  let rank = 999;

  if (saveSuccess) {
    const recordCheck = GameDataManager.checkNewRecord({
      timestamp: gameEndTime,
      finalScore,
      totalDuration,
      difficulty: completedStats.difficulty,
      deviceType: completedStats.deviceType,
      totalRotations: completedStats.totalRotations,
      hintUsageCount: completedStats.hintUsageCount,
      dragOperations: completedStats.dragOperations,
      rotationEfficiency: completedStats.rotationEfficiency,
      scoreBreakdown,
    } as any);
    isNewRecord = recordCheck.isNewRecord;
    rank = recordCheck.rank;
  }

  const updatedLeaderboard = GameDataManager.getLeaderboard();

  // 3. 最终分派
  dispatch({
    type: "GAME_COMPLETED",
    payload: {
      gameStats: completedStats,
      finalScore,
      scoreBreakdown,
      isNewRecord,
      currentRank: rank,
      leaderboard: updatedLeaderboard,
    },
  });
};
