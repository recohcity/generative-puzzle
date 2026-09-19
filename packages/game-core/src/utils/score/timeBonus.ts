import { GameStats, GameRecord } from '../../types/puzzleTypes';

/**
 * 时间奖励/速度描述/时间记录检查
 * 从 ScoreCalculator.ts 拆出（P2-3）
 */

/**
 * 根据难度级别获取每片拼图的平均完成时间（秒）
 */
const getAverageTimePerPiece = (difficultyLevel: number): number => {
  if (difficultyLevel <= 2) return 5;
  if (difficultyLevel <= 4) return 7;
  if (difficultyLevel <= 6) return 10;
  return 18;
};

/**
 * 根据难度级别获取基础奖励分数倍数
 */
const getBaseBonusMultiplier = (difficultyLevel: number): number => {
  if (difficultyLevel <= 2) return 1.0;
  if (difficultyLevel <= 4) return 1.2;
  if (difficultyLevel <= 6) return 1.5;
  return 2.0;
};

/**
 * 计算动态速度奖励阈值（v3.4）
 */
export const calculateDynamicTimeBonusThresholds = (
  pieceCount: number,
  difficultyLevel: number
): Array<{ maxTime: number; bonus: number; description: string }> => {
  const avgTimePerPiece = getAverageTimePerPiece(difficultyLevel);
  const baseTime = pieceCount * avgTimePerPiece;
  const bonusMultiplier = getBaseBonusMultiplier(difficultyLevel);

  const baseBonuses = {
    supreme: 1000,
    excellent: 600,
    fast: 400,
    good: 300,
    normal: 200,
    slow: 100
  };

  return [
    {
      maxTime: Math.round(baseTime * 0.8),
      bonus: Math.round(baseBonuses.supreme * bonusMultiplier),
      description: `光速（少于${Math.round(baseTime * 0.8)}秒内）`
    },
    {
      maxTime: Math.round(baseTime * 1.0),
      bonus: Math.round(baseBonuses.excellent * bonusMultiplier),
      description: `极速（少于${Math.round(baseTime * 1.0)}秒内）`
    },
    {
      maxTime: Math.round(baseTime * 1.3),
      bonus: Math.round(baseBonuses.fast * bonusMultiplier),
      description: `快速（少于${Math.round(baseTime * 1.3)}秒内）`
    },
    {
      maxTime: Math.round(baseTime * 1.6),
      bonus: Math.round(baseBonuses.good * bonusMultiplier),
      description: `良好（少于${Math.round(baseTime * 1.6)}秒内）`
    },
    {
      maxTime: Math.round(baseTime * 2.0),
      bonus: Math.round(baseBonuses.normal * bonusMultiplier),
      description: `标准（少于${Math.round(baseTime * 2.0)}秒内）`
    },
    {
      maxTime: Math.round(baseTime * 2.5),
      bonus: Math.round(baseBonuses.slow * bonusMultiplier),
      description: `一般（少于${Math.round(baseTime * 2.5)}秒内）`
    }
  ];
};

/**
 * 检测是否创造时间记录
 */
export const checkTimeRecord = (stats: GameStats, currentLeaderboard: GameRecord[]): {
  isNewRecord: boolean;
  previousBest?: number;
  improvement?: number;
  rank: number;
  totalRecords: number;
} => {
  const { difficulty, totalDuration } = stats;

  const sameLevel = currentLeaderboard
    .filter(record => record.difficulty.difficultyLevel === difficulty.difficultyLevel)
    .sort((a, b) => a.totalDuration - b.totalDuration);

  if (sameLevel.length === 0) {
    return {
      isNewRecord: true,
      rank: 1,
      totalRecords: 1
    };
  }

  const currentBest = sameLevel[0].totalDuration;
  if (totalDuration < currentBest) {
    return {
      isNewRecord: true,
      previousBest: currentBest,
      improvement: currentBest - totalDuration,
      rank: 1,
      totalRecords: sameLevel.length + 1
    };
  }

  let rank = 1;
  for (const record of sameLevel) {
    if (totalDuration > record.totalDuration) {
      rank++;
    }
  }

  return {
    isNewRecord: false,
    rank,
    totalRecords: sameLevel.length + 1
  };
};

/**
 * 计算速度奖励
 */
export const calculateTimeBonus = (
  stats: GameStats,
  _currentLeaderboard?: GameRecord[]
): {
  timeBonus: number;
  timeBonusRank: number;
  isTimeRecord: boolean;
} => {
  if (!stats || !stats.difficulty) {
    console.error('[calculateTimeBonus] stats或difficulty为空');
    return { timeBonus: 0, timeBonusRank: 0, isTimeRecord: false };
  }

  const { totalDuration, difficulty } = stats;
  const { cutCount, actualPieces } = difficulty;

  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateTimeBonus] 速度奖励计算: 游戏时长${totalDuration}秒, 难度${cutCount}, 拼图${actualPieces}片`);

  const thresholds = calculateDynamicTimeBonusThresholds(actualPieces, cutCount);

  const avgTimePerPiece = getAverageTimePerPiece(cutCount);
  const baseTime = actualPieces * avgTimePerPiece;

  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateTimeBonus] 动态阈值计算: 拼图${actualPieces}片 × ${avgTimePerPiece}秒/片 = 基础时间${baseTime}秒`);

  let timeBonus = 0;
  let bonusDescription = '';

  for (const threshold of thresholds) {
    if (totalDuration <= threshold.maxTime) {
      timeBonus = threshold.bonus;
      bonusDescription = threshold.description;
      break;
    }
  }

  if (timeBonus === 0) {
    const maxTime = Math.round(baseTime * 1.5);
    bonusDescription = `超过${maxTime}秒（${Math.round(maxTime / 60)}分钟）`;
  }

  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateTimeBonus] ${bonusDescription}: +${timeBonus}分`);

  return {
    timeBonus,
    timeBonusRank: 0,
    isTimeRecord: false
  };
};

/**
 * 获取速度奖励描述文本（v3.4）
 */
export const getSpeedBonusDescription = (
  duration: number,
  pieceCount: number,
  difficultyLevel: number
): string => {
  const speedDetails = getSpeedBonusDetails(duration, pieceCount, difficultyLevel);

  if (speedDetails.currentLevel) {
    return speedDetails.currentLevel.description;
  }

  const avgTimePerPiece = getAverageTimePerPiece(difficultyLevel);
  const baseTime = pieceCount * avgTimePerPiece;
  const slowThreshold = Math.round(baseTime * 1.5);
  const minutes = Math.floor(slowThreshold / 60);
  const seconds = slowThreshold % 60;
  if (minutes > 0) {
    return `慢（超出${minutes}分${seconds}秒）`;
  }
  return `慢（超出${slowThreshold}秒）`;
};

/**
 * 获取速度奖励详细信息（v3.4）
 */
export const getSpeedBonusDetails = (
  duration: number,
  pieceCount: number,
  difficultyLevel: number
): {
  currentLevel: { name: string; maxTime: number; bonus: number; description: string } | null;
  nextLevel: { name: string; maxTime: number; bonus: number; description: string } | null;
  allLevels: Array<{ name: string; maxTime: number; bonus: number; description: string }>;
  slowLevel: { name: string; maxTime: number; bonus: number; description: string } | null;
  timeToNextLevel: number | null;
} => {
  const thresholds = calculateDynamicTimeBonusThresholds(pieceCount, difficultyLevel);
  const avgTimePerPiece = getAverageTimePerPiece(difficultyLevel);
  const baseTime = pieceCount * avgTimePerPiece;
  const slowThreshold = Math.round(baseTime * 1.5);

  const levelNames = ['光速', '极速', '快速', '良好', '标准', '一般'];

  let currentLevelIndex = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (duration <= thresholds[i].maxTime) {
      currentLevelIndex = i;
      break;
    }
  }

  const allLevels = thresholds.map((threshold, index) => ({
    name: levelNames[index],
    maxTime: threshold.maxTime,
    bonus: threshold.bonus,
    description: threshold.description
  }));

  const slowLevel: { name: string; maxTime: number; bonus: number; description: string } | null =
    duration > slowThreshold ? {
      name: '慢',
      maxTime: slowThreshold,
      bonus: 0,
      description: `慢（超出${slowThreshold}秒）`
    } : null;

  const currentLevel = currentLevelIndex >= 0 ? allLevels[currentLevelIndex] : (slowLevel || null);
  const nextLevel = currentLevelIndex >= 0 && currentLevelIndex > 0 ? allLevels[currentLevelIndex - 1] : null;
  const timeToNextLevel = nextLevel ? Math.max(0, nextLevel.maxTime - duration) : null;

  return {
    currentLevel,
    nextLevel,
    allLevels,
    slowLevel,
    timeToNextLevel
  };
};
