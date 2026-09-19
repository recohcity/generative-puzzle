import { GameStats, ScoreBreakdown, GameRecord, PuzzlePiece } from '../../types/puzzleTypes';

// === Re-export 子模块公共 API（外部 import 路径不变）===
export {
  calculateDifficultyMultiplier,
  getBaseScore,
  getBaseScoreByPieces,
  getBaseDifficultyMultiplierByPieces,
  getShapeMultiplier,
  getDeviceMultiplier
} from './difficultyMultiplier';

export {
  setHintConfig,
  getHintAllowance,
  getHintAllowanceByCutCount,
  calculateHintScore,
  calculateHintScoreFromStats
} from './hintScore';

export {
  calculateMinimumRotationsAtStart,
  calculateMinimumRotations,
  calculateRotationEfficiency,
  formatRotationDisplay,
  calculateRotationEfficiencyPercentage,
  calculateRemainingRotations,
  calculateRotationScore
} from './rotationScore';

export {
  calculateDynamicTimeBonusThresholds,
  checkTimeRecord,
  calculateTimeBonus,
  getSpeedBonusDescription,
  getSpeedBonusDetails
} from './timeBonus';

// === 内部依赖（从子模块 import，不 re-export）===
import {
  calculateDifficultyMultiplier,
  getBaseScore
} from './difficultyMultiplier';

import {
  getHintAllowanceByCutCount,
  calculateHintScore,
  calculateHintScoreFromStats
} from './hintScore';

import {
  calculateMinimumRotations,
  calculateRotationEfficiency,
  calculateRotationScore
} from './rotationScore';

import {
  calculateTimeBonus,
  checkTimeRecord
} from './timeBonus';

/**
 * 生成式拼图游戏 - 分数计算引擎
 * 基于统一规则文档 v3.4
 *
 * 最终公式：
 * finalScore = (baseScore + timeBonus + rotationScore + hintScore) × difficultyMultiplier
 *
 * P2-3 拆分：
 * - 难度/倍率 → difficultyMultiplier.ts
 * - 提示 → hintScore.ts
 * - 旋转 → rotationScore.ts
 * - 时间奖励 → timeBonus.ts
 * - 本文件保留：总分计算/格式化/排行榜/工具 + re-export 所有公共 API
 */

/** 验证分数计算参数 */
export const validateScoreParams = (stats: GameStats | null | undefined): stats is GameStats => {
  if (!stats || typeof stats !== 'object') { console.error('[validateScoreParams] stats为空或不是对象:', stats); return false; }
  if (!stats.difficulty || typeof stats.difficulty !== 'object') { console.error('[validateScoreParams] difficulty无效:', stats.difficulty); return false; }
  if (typeof stats.difficulty.actualPieces !== 'number') { console.error('[validateScoreParams] difficulty.actualPieces无效:', stats.difficulty.actualPieces); return false; }
  if (typeof stats.difficulty.cutCount !== 'number') { console.error('[validateScoreParams] difficulty.cutCount无效:', stats.difficulty.cutCount); return false; }
  if (typeof stats.totalRotations !== 'number') { console.error('[validateScoreParams] totalRotations无效:', stats.totalRotations); return false; }
  if (typeof stats.hintUsageCount !== 'number') { console.error('[validateScoreParams] hintUsageCount无效:', stats.hintUsageCount); return false; }
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log('[validateScoreParams] 验证通过');
  return true;
};

/** 安全的分数计算包装器 */
export const safeCalculateScore = <T>(calculator: () => T, defaultValue: T, errorContext: string): T => {
  try { return calculator(); }
  catch (error) { console.warn(`分数计算错误 (${errorContext}):`, error); return defaultValue; }
};

/** 计算实时分数 */
export const calculateLiveScore = (stats: GameStats, leaderboard: GameRecord[] = []): number => {
  if (!stats) { console.error('[calculateLiveScore] stats参数为空或undefined'); return 0; }
  if (!validateScoreParams(stats)) { console.error('[calculateLiveScore] 数据验证失败'); return 0; }

  return safeCalculateScore(() => {
    const baseScore = getBaseScore(stats.difficulty.cutCount);
    const timeBonus = calculateTimeBonus(stats, leaderboard).timeBonus;

    let rotationScore = 0;
    if (stats.minRotations && stats.minRotations > 0) {
      rotationScore = calculateRotationScore(stats);
    }

    const hintScore = calculateHintScoreFromStats(stats);
    const subtotal = baseScore + timeBonus + rotationScore + hintScore;
    const liveScore = Math.max(100, Math.round(subtotal));

    if (subtotal < 100) console.warn('[calculateLiveScore] 分数被Math.max(100, ...)限制！原始小计:', subtotal);
    return liveScore;
  }, 0, 'calculateLiveScore');
};

/** 计算增量分数变化 */
export const calculateScoreDelta = (
  oldStats: GameStats | null,
  newStats: GameStats,
  leaderboard: GameRecord[] = []
): { delta: number; newScore: number; reason: string } => {
  const newScore = calculateLiveScore(newStats, leaderboard);
  if (!oldStats) return { delta: newScore, newScore, reason: '游戏开始' };

  const oldScore = calculateLiveScore(oldStats, leaderboard);
  const delta = newScore - oldScore;

  let reason = '';
  if (newStats.totalRotations !== oldStats.totalRotations) reason = '旋转操作';
  else if (newStats.hintUsageCount !== oldStats.hintUsageCount) reason = '使用提示';
  else if (newStats.dragOperations !== oldStats.dragOperations) reason = '拖拽操作';
  else if (newStats.totalDuration !== oldStats.totalDuration) reason = '时间更新';
  else reason = '数据更新';

  return { delta, newScore, reason };
};

/** 性能监控装饰器 */
export const withPerformanceMonitoring = <T extends any[], R>(fn: (...args: T) => R, name: string): ((...args: T) => R) => {
  return (...args: T): R => {
    const start = performance.now();
    const result = fn(...args);
    const dur = performance.now() - start;
    if (dur > 10) console.warn(`分数计算性能警告: ${name} 耗时 ${dur.toFixed(2)}ms`);
    return result;
  };
};

/** 带性能监控的实时分数计算 */
export const calculateLiveScoreWithMonitoring = withPerformanceMonitoring(calculateLiveScore, 'calculateLiveScore');

/** 格式化分数显示 */
export const formatScore = (score: number): string => score.toLocaleString('zh-CN');

/** 格式化时间显示（MM:SS） */
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/** 防抖函数 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/** 实时分数更新优化器 */
export const createLiveScoreUpdater = (
  updateCallback: (score: number, delta: number, reason: string) => void,
  debounceMs: number = 100
) => {
  let lastStats: GameStats | null = null;
  const debouncedUpdate = debounce((stats: GameStats, leaderboard: GameRecord[]) => {
    const result = calculateScoreDelta(lastStats, stats, leaderboard);
    updateCallback(result.newScore, result.delta, result.reason);
    lastStats = { ...stats };
  }, debounceMs);

  return {
    updateScore: (stats: GameStats, leaderboard: GameRecord[] = []) => debouncedUpdate(stats, leaderboard),
    reset: () => { lastStats = null; }
  };
};

/** 计算最终分数（完整版） */
export const calculateFinalScore = (
  stats: GameStats,
  pieces: PuzzlePiece[],
  currentLeaderboard: GameRecord[] = []
): ScoreBreakdown => {
  return safeCalculateScore(() => {
    const baseScore = getBaseScore(stats.difficulty.cutCount);
    const timeBonusResult = calculateTimeBonus(stats, currentLeaderboard);
    const minRotations = stats.minRotations || calculateMinimumRotations(pieces);
    const rotationEfficiency = calculateRotationEfficiency(minRotations, stats.totalRotations);
    const rotationScore = calculateRotationScore({ ...stats, minRotations }, pieces);
    const hintAllowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);
    const hintScore = calculateHintScore(stats.hintUsageCount, hintAllowance);
    const difficultyMultiplier = calculateDifficultyMultiplier(stats.difficulty);

    const subtotal = baseScore + timeBonusResult.timeBonus + rotationScore + hintScore;
    const finalScore = Math.max(100, Math.round(subtotal * difficultyMultiplier));

    return {
      baseScore,
      timeBonus: timeBonusResult.timeBonus,
      timeBonusRank: timeBonusResult.timeBonusRank,
      isTimeRecord: timeBonusResult.isTimeRecord,
      rotationScore,
      rotationEfficiency,
      minRotations,
      hintScore,
      hintAllowance,
      difficultyMultiplier,
      finalScore
    };
  }, {
    baseScore: 0, timeBonus: 0, timeBonusRank: 0, isTimeRecord: false,
    rotationScore: 0, rotationEfficiency: 0, minRotations: 0,
    hintScore: 0, hintAllowance: 0, difficultyMultiplier: 1, finalScore: 100
  }, 'calculateFinalScore');
};

/** 更新GameStats中的最优解数据 */
export const updateStatsWithOptimalSolution = (stats: GameStats, pieces: PuzzlePiece[]): GameStats => {
  const minRotations = calculateMinimumRotations(pieces);
  const rotationEfficiency = calculateRotationEfficiency(minRotations, stats.totalRotations);
  const hintAllowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);
  return { ...stats, minRotations, rotationEfficiency, hintAllowance };
};

/** 格式化排名显示 */
export const formatRankDisplay = (rank: number, totalRecords: number): string => {
  if (rank === 1) return '第1名🏆';
  if (rank <= 5) return `第${rank}名`;
  return `第${rank}名 (共${totalRecords}名)`;
};

/** 获取新记录标识 */
export const getNewRecordBadge = (recordInfo: {
  isNewRecord: boolean;
  previousBest?: number;
  improvement?: number;
}): { badge: string; message: string; shouldCelebrate: boolean } => {
  if (!recordInfo.isNewRecord) return { badge: '', message: '', shouldCelebrate: false };

  if (recordInfo.previousBest && recordInfo.improvement) {
    const t = formatTime(recordInfo.improvement);
    return { badge: '🆕记录', message: `恭喜！您创造了新记录，比之前最佳成绩快了${t}！`, shouldCelebrate: true };
  }
  return { badge: '🆕记录', message: '恭喜！您创造了该难度的首个记录！', shouldCelebrate: true };
};

/** 计算排行榜统计信息 */
export const calculateLeaderboardStats = (
  stats: GameStats,
  currentLeaderboard: GameRecord[]
): {
  timeBonus: number;
  timeBonusRank: number;
  isTimeRecord: boolean;
  recordInfo: ReturnType<typeof checkTimeRecord>;
  rankDisplay: string;
  recordBadge: ReturnType<typeof getNewRecordBadge>;
} => {
  const timeBonusResult = calculateTimeBonus(stats, currentLeaderboard);
  const recordInfo = checkTimeRecord(stats, currentLeaderboard);
  const rankDisplay = formatRankDisplay(recordInfo.rank, recordInfo.totalRecords);
  const recordBadge = getNewRecordBadge(recordInfo);
  return {
    timeBonus: timeBonusResult.timeBonus,
    timeBonusRank: timeBonusResult.timeBonusRank,
    isTimeRecord: timeBonusResult.isTimeRecord,
    recordInfo,
    rankDisplay,
    recordBadge
  };
};

/** 集成排行榜数据的增强分数计算 */
export const calculateScoreWithLeaderboard = (
  stats: GameStats,
  pieces: PuzzlePiece[],
  currentLeaderboard: GameRecord[]
): ScoreBreakdown & { leaderboardStats: ReturnType<typeof calculateLeaderboardStats> } => {
  const scoreBreakdown = calculateFinalScore(stats, pieces, currentLeaderboard);
  const leaderboardStats = calculateLeaderboardStats(stats, currentLeaderboard);
  return { ...scoreBreakdown, leaderboardStats };
};
