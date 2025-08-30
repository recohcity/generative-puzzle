import { GameStats, DifficultyConfig, ScoreBreakdown, GameRecord, PuzzlePiece, RotationRating } from '@/types/puzzleTypes';

/**
 * 分数计算引擎
 * 提供完整的分数计算功能，包括难度系数、实时分数和最终分数计算
 */

// 难度系数映射表（基于实际拼图数量）- 按设计文档v2更新
const PIECE_MULTIPLIERS: Record<number, number> = {
  2: 1.0,   // 1次切割 -> 2片 (简单)
  3: 1.1,   // 2次切割 -> 3片 (简单)
  4: 1.2,   // 3次切割 -> 4片 (简单)
  5: 1.4,   // 4次切割 -> 5片 (中等)
  7: 1.6,   // 5次切割 -> 7片 (中等)
  9: 1.8,   // 6次切割 -> 9片 (中等)
  12: 2.2,  // 7次切割 -> 12片 (困难)
  14: 2.5   // 8次切割 -> 14片 (极难)
};

// 基础分数映射表（按设计文档v2）
const BASE_SCORES: Record<number, number> = {
  2: 800,    // 1次切割 -> 2片
  3: 900,    // 2次切割 -> 3片
  4: 1000,   // 3次切割 -> 4片
  5: 1200,   // 4次切割 -> 5片
  7: 1400,   // 5次切割 -> 7片
  9: 1600,   // 6次切割 -> 9片
  12: 1800,  // 7次切割 -> 12片
  14: 2000   // 8次切割 -> 14片
};

// 速度奖励分数表（基于完成时间）
const TIME_BONUS_THRESHOLDS = [
  { maxTime: 10, bonus: 400, description: '10秒内完成' },
  { maxTime: 30, bonus: 200, description: '30秒内完成' },
  { maxTime: 60, bonus: 100, description: '60秒内完成' },
  { maxTime: 90, bonus: 50, description: '1分30秒内完成' },
  { maxTime: 120, bonus: 10, description: '2分钟内完成' },
] as const;

// 提示次数赠送表（基于切割次数）
const HINT_ALLOWANCES_BY_CUT_COUNT: Record<number, number> = {
  1: 3,  // 1次切割 -> 3次提示
  2: 3,  // 2次切割 -> 3次提示
  3: 3,  // 3次切割 -> 3次提示
  4: 3,  // 4次切割 -> 3次提示
  5: 3,  // 5次切割 -> 3次提示
  6: 3,  // 6次切割 -> 3次提示
  7: 3,  // 7次切割 -> 3次提示
  8: 3   // 8次切割 -> 3次提示
};

// 兼容性：基于难度级别的提示赠送表
const HINT_ALLOWANCES: Record<string, number> = {
  'easy': 3,     // 简单：3次
  'medium': 3,   // 中等：3次
  'hard': 3,     // 困难：3次
  'extreme': 3   // 极难：3次
};

/**
 * 获取设备难度系数
 * 集成现有的设备检测逻辑，统一移动端系数为1.1
 * 与useDeviceDetection保持一致的检测逻辑
 */
export const getDeviceMultiplier = (): number => {
  // 检测设备类型
  if (typeof window === 'undefined') {
    return 1.0; // 服务端渲染默认值
  }

  const userAgent = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 检测移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  // iPad检测（与useDeviceDetection保持一致）
  const isIPad = /iPad/i.test(userAgent) ||
    (isIOS && screenWidth >= 768) ||
    (isTouchDevice && screenWidth >= 768 && screenWidth <= 1366 &&
      (screenHeight >= 1024 || (screenWidth >= 1024 && screenHeight >= 768)));

  // 移动设备检测（包括横屏和竖屏，但排除iPad）
  const isMobileDevice = isMobile && !isIPad;

  if (isMobileDevice) {
    return 1.1; // 移动设备统一系数：1.1倍（包括横屏和竖屏）
  }

  return 1.0; // 桌面端和iPad：1.0倍系数
};

/**
 * 计算难度系数（严格按v2文档表格1）
 */
export const calculateDifficultyMultiplier = (config: DifficultyConfig): number => {
  // 基础难度系数（直接从表格获取）
  const pieceMultiplier = PIECE_MULTIPLIERS[config.actualPieces] || 1.0;

  // 切割类型系数
  const cutTypeMultiplier = config.cutType === 'diagonal' ? 1.2 : 1.0;

  // 设备适配系数
  const deviceMultiplier = getDeviceMultiplier();

  const finalMultiplier = pieceMultiplier * cutTypeMultiplier * deviceMultiplier;

  console.log(`[calculateDifficultyMultiplier] 拼图数量 ${config.actualPieces} -> 基础系数 ${pieceMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 切割类型 ${config.cutType} -> 切割系数 ${cutTypeMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 设备系数 ${deviceMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 最终系数 ${finalMultiplier}`);

  return finalMultiplier;
};

/**
 * 获取基础分数（严格按v2文档表格1）
 */
export const getBaseScore = (actualPieces: number): number => {
  const score = BASE_SCORES[actualPieces];
  if (!score) {
    console.warn(`[getBaseScore] 未找到拼图数量 ${actualPieces} 对应的基础分数，使用默认值1000`);
    return 1000;
  }
  console.log(`[getBaseScore] 拼图数量 ${actualPieces} -> 基础分数 ${score}`);
  return score;
};

/**
 * 基于拼图数量获取基础分数（v2文档函数名）
 */
export const getBaseScoreByPieces = (actualPieces: number): number => {
  return getBaseScore(actualPieces);
};

/**
 * 基于拼图数量获取基础难度系数（严格按v2文档表格1）
 */
export const getBaseDifficultyMultiplierByPieces = (actualPieces: number): number => {
  const multiplier = PIECE_MULTIPLIERS[actualPieces];
  if (!multiplier) {
    console.warn(`[getBaseDifficultyMultiplierByPieces] 未找到拼图数量 ${actualPieces} 对应的难度系数，使用默认值1.0`);
    return 1.0;
  }
  console.log(`[getBaseDifficultyMultiplierByPieces] 拼图数量 ${actualPieces} -> 难度系数 ${multiplier}`);
  return multiplier;
};

/**
 * 获取提示次数赠送（兼容性函数 - 基于难度级别）
 */
export const getHintAllowance = (difficultyLevel: string): number => {
  return HINT_ALLOWANCES[difficultyLevel] || 0;
};

/**
 * 基于切割次数获取提示赠送次数（严格按v2文档表格1）
 */
export const getHintAllowanceByCutCount = (cutCount: number): number => {
  const allowance = HINT_ALLOWANCES_BY_CUT_COUNT[cutCount];
  if (allowance === undefined) {
    console.warn(`[getHintAllowanceByCutCount] 未找到切割次数 ${cutCount} 对应的提示赠送，使用默认值0`);
    return 0;
  }
  console.log(`[getHintAllowanceByCutCount] 切割次数 ${cutCount} -> 提示赠送 ${allowance}次`);
  return allowance;
};

/**
 * 计算拼图散开后到完成状态的最小旋转次数（严格按V2文档定义）
 * 
 * 规则：
 * - 如果拼图角度小于180度，使用逆时针旋转实现角度归0
 * - 如果拼图角度大于180度，使用顺时针旋转实现角度归0
 * - 这是游戏开始时就应该计算并存储的值
 * - 计算合计所有散开的拼图角度归0所需最小旋转次数
 */
export const calculateMinimumRotationsAtStart = (pieces: PuzzlePiece[]): number => {
  if (!pieces || pieces.length === 0) {
    return 0;
  }

  return pieces.reduce((total, piece) => {
    // 散开后的初始角度（标准化到0-360度范围）
    let scatteredAngle = piece.rotation % 360;
    if (scatteredAngle < 0) {
      scatteredAngle += 360;
    }

    // 目标角度是0度（完成状态）
    // 计算最小旋转次数
    let minRotations: number;

    if (scatteredAngle <= 180) {
      // 角度小于等于180度：使用逆时针旋转到0度
      minRotations = Math.ceil(scatteredAngle / 15);
    } else {
      // 角度大于180度：使用顺时针旋转到0度
      const clockwiseAngle = 360 - scatteredAngle;
      minRotations = Math.ceil(clockwiseAngle / 15);
    }

    return total + minRotations;
  }, 0);
};

/**
 * 计算最小旋转次数（兼容性函数）
 * 基于每个拼图片段从当前角度到目标角度的最小旋转次数
 * 按照精确定义：≤180度用逆时针，>180度用顺时针
 */
export const calculateMinimumRotations = (pieces: PuzzlePiece[]): number => {
  return calculateMinimumRotationsAtStart(pieces);
};

/**
 * 计算旋转效率
 * 基于最小旋转次数和实际旋转次数
 */
export const calculateRotationEfficiency = (minRotations: number, actualRotations: number): number => {
  if (actualRotations === 0) {
    return minRotations === 0 ? 1 : 0;
  }

  if (minRotations === 0) {
    return actualRotations === 0 ? 1 : 0;
  }

  return Math.min(1, minRotations / actualRotations);
};

/**
 * 格式化旋转次数显示
 * 显示格式：旋转次数：6次（最佳：5次）
 */
export const formatRotationDisplay = (
  actualRotations: number,
  minRotations: number
): string => {
  return `旋转次数：${actualRotations}次（最佳：${minRotations}次）`;
};

/**
 * 计算旋转效率百分比
 * 返回0-100的百分比值
 */
export const calculateRotationEfficiencyPercentage = (
  minRotations: number,
  actualRotations: number
): number => {
  if (actualRotations === 0) {
    return minRotations === 0 ? 100 : 0;
  }

  if (minRotations === 0) {
    return 100; // 不需要旋转的情况下效率为100%
  }

  return Math.min(100, Math.round((minRotations / actualRotations) * 100));
};

/**
 * 计算当前状态到完成状态的剩余旋转次数（严格按V2文档定义）
 * 用于实时显示和最终计算
 */
export const calculateRemainingRotations = (pieces: PuzzlePiece[]): number => {
  if (!pieces || pieces.length === 0) {
    return 0;
  }

  return pieces.reduce((total, piece) => {
    if (piece.isCompleted) {
      return total; // 已完成的拼图不需要旋转
    }

    // 当前角度（标准化到0-360度范围）
    let currentAngle = piece.rotation % 360;
    if (currentAngle < 0) {
      currentAngle += 360;
    }

    // 目标角度是0度
    // 计算最小旋转次数
    let minRotations: number;

    if (currentAngle <= 180) {
      // 使用逆时针旋转
      minRotations = Math.ceil(currentAngle / 15);
    } else {
      // 使用顺时针旋转
      const clockwiseAngle = 360 - currentAngle;
      minRotations = Math.ceil(clockwiseAngle / 15);
    }

    return total + minRotations;
  }, 0);
};

/**
 * 检测是否创造时间记录
 * 检查当前完成时间是否创造了同难度的新记录
 */
export const checkTimeRecord = (stats: GameStats, currentLeaderboard: GameRecord[]): {
  isNewRecord: boolean;
  previousBest?: number;
  improvement?: number;
  rank: number;
  totalRecords: number;
} => {
  const { difficulty, totalDuration } = stats;

  // 获取同难度的排行榜记录，按完成时间排序
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

  // 计算当前时间的排名
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
 * 基于完成时间给予奖励分数，时间越短奖励越高
 */
export const calculateTimeBonus = (
  stats: GameStats,
  _currentLeaderboard?: GameRecord[] // 保留参数兼容性，但标记为未使用
): {
  timeBonus: number;
  timeBonusRank: number;
  isTimeRecord: boolean;
} => {
  // 参数验证
  if (!stats || !stats.difficulty) {
    console.error('[calculateTimeBonus] stats或difficulty为空');
    return { timeBonus: 0, timeBonusRank: 0, isTimeRecord: false };
  }

  const { totalDuration } = stats;

  console.log(`[calculateTimeBonus] 速度奖励计算: 游戏时长${totalDuration}秒`);

  // 基于游戏时长给予奖励分数
  let timeBonus = 0;
  let bonusDescription = '';

  // 使用阈值表计算奖励
  for (const threshold of TIME_BONUS_THRESHOLDS) {
    if (totalDuration <= threshold.maxTime) {
      timeBonus = threshold.bonus;
      bonusDescription = threshold.description;
      break;
    }
  }

  // 如果没有匹配任何阈值，则无奖励
  if (timeBonus === 0) {
    bonusDescription = '超过2分钟';
  }

  console.log(`[calculateTimeBonus] ${bonusDescription}: +${timeBonus}分`);

  return {
    timeBonus,
    timeBonusRank: 0, // 当前版本不基于排名
    isTimeRecord: false // 当前版本不判断记录
  };
};

/**
 * 验证分数计算参数（添加详细验证和调试）
 */
export const validateScoreParams = (stats: GameStats | null | undefined): stats is GameStats => {
  if (!stats || typeof stats !== 'object') {
    console.error('[validateScoreParams] stats为空或不是对象:', stats);
    return false;
  }

  if (!stats.difficulty || typeof stats.difficulty !== 'object') {
    console.error('[validateScoreParams] difficulty无效:', stats.difficulty);
    return false;
  }

  if (typeof stats.difficulty.actualPieces !== 'number') {
    console.error('[validateScoreParams] difficulty.actualPieces无效:', stats.difficulty.actualPieces);
    return false;
  }

  if (typeof stats.difficulty.cutCount !== 'number') {
    console.error('[validateScoreParams] difficulty.cutCount无效:', stats.difficulty.cutCount);
    return false;
  }

  if (typeof stats.totalRotations !== 'number') {
    console.error('[validateScoreParams] totalRotations无效:', stats.totalRotations);
    return false;
  }

  if (typeof stats.hintUsageCount !== 'number') {
    console.error('[validateScoreParams] hintUsageCount无效:', stats.hintUsageCount);
    return false;
  }

  console.log('[validateScoreParams] 验证通过');
  return true;
};

/**
 * 计算实时分数（严格按v2文档，添加详细调试）
 */
export const calculateLiveScore = (stats: GameStats, leaderboard: GameRecord[] = []): number => {
  // 首先检查stats是否存在
  if (!stats) {
    console.error('[calculateLiveScore] stats参数为空或undefined');
    return 0;
  }

  console.log('[calculateLiveScore] 开始计算，输入数据:', {
    stats: stats,
    hasStats: !!stats,
    hasDifficulty: !!(stats && stats.difficulty),
    actualPieces: stats?.difficulty?.actualPieces,
    cutCount: stats?.difficulty?.cutCount,
    cutType: stats?.difficulty?.cutType,
    totalRotations: stats?.totalRotations,
    hintUsageCount: stats?.hintUsageCount,
    minRotations: stats?.minRotations
  });

  if (!validateScoreParams(stats)) {
    console.error('[calculateLiveScore] 数据验证失败');
    return 0;
  }

  return safeCalculateScore(() => {
    // 1. 基础分数
    const baseScore = getBaseScore(stats.difficulty.actualPieces);
    console.log('[calculateLiveScore] 1. 基础分数:', baseScore);

    // 2. 速度奖励
    const timeBonus = calculateTimeBonus(stats, leaderboard).timeBonus;
    console.log('[calculateLiveScore] 2. 速度奖励:', timeBonus);

    // 3. 旋转效率分数
    // 如果minRotations为0，说明数据丢失，暂时返回0分避免错误计算
    let rotationScore = 0;
    if (stats.minRotations && stats.minRotations > 0) {
      rotationScore = calculateRotationScore(stats);
    } else {
      console.warn('[calculateLiveScore] minRotations为0或undefined，跳过旋转分数计算');
    }
    console.log('[calculateLiveScore] 3. 旋转分数:', rotationScore);

    // 4. 提示使用分数
    const hintScore = calculateHintScoreFromStats(stats);
    console.log('[calculateLiveScore] 4. 提示分数:', hintScore);

    // 5. 小计
    const subtotal = baseScore + timeBonus + rotationScore + hintScore;
    console.log('[calculateLiveScore] 5. 小计:', subtotal);

    // 6. 难度系数
    const difficultyMultiplier = calculateDifficultyMultiplier(stats.difficulty);
    console.log('[calculateLiveScore] 6. 难度系数:', difficultyMultiplier);

    // 7. 实时分数应该显示小计，不应用难度系数
    // 难度系数只在最终分数计算时应用（游戏完成后）
    const liveScore = Math.max(100, Math.round(subtotal));
    console.log('[calculateLiveScore] 7. 实时分数（小计）:', liveScore);
    console.log('[calculateLiveScore] 注意：实时分数不应用难度系数，难度系数只在游戏完成时应用');

    // 检查是否被Math.max限制
    if (subtotal < 100) {
      console.warn('[calculateLiveScore] 警告：分数被Math.max(100, ...)限制！原始小计:', subtotal);
    }

    return liveScore;
  }, 0, 'calculateLiveScore');
};

/**
 * 获取旋转效率评级（严格按V2文档规则）
 * 基于效率百分比返回评级信息
 */
export const getRotationRating = (efficiency: number): RotationRating => {
  if (efficiency >= 100) {
    return {
      rating: '完美',
      description: '完美旋转',
      color: 'gold',
      score: 200
    };
  } else if (efficiency >= 80) {
    return {
      rating: '接近完美',
      description: '接近完美',
      color: 'green',
      score: 100
    };
  } else if (efficiency >= 60) {
    return {
      rating: '旋转有点多',
      description: '旋转有点多',
      color: 'orange',
      score: 50
    };
  } else if (efficiency >= 40) {
    return {
      rating: '旋转太多了',
      description: '旋转太多了',
      color: 'red',
      score: -50
    };
  } else if (efficiency >= 20) {
    return {
      rating: '请减少旋转',
      description: '请减少旋转',
      color: 'darkred',
      score: -100
    };
  } else if (efficiency >= 0) {
    return {
      rating: '看清楚再旋转',
      description: '看清楚再旋转',
      color: 'darkred',
      score: -200
    };
  } else {
    return {
      rating: '效率过低',
      description: '效率过低',
      color: 'darkred',
      score: -200
    };
  }
};

/**
 * 获取旋转效率评级文本（严格按V2文档规则）
 */
export const getRotationRatingText = (efficiency: number): string => {
  if (efficiency >= 100) return '完美';
  if (efficiency >= 80) return '接近完美';
  if (efficiency >= 60) return '旋转有点多';
  if (efficiency >= 40) return '旋转太多了';
  if (efficiency >= 20) return '请减少旋转';
  if (efficiency >= 0) return '看清楚再旋转';
  return '效率过低';
};

/**
 * 基于旋转效率计算分数（严格按V2文档规则）
 */
export const calculateRotationScoreByEfficiency = (efficiency: number): number => {
  if (efficiency >= 100) return 200;      // 完美：+200分
  if (efficiency >= 80) return 100;       // 接近完美：+100分
  if (efficiency >= 60) return 50;        // 旋转有点多：+50分
  if (efficiency >= 40) return -50;       // 旋转太多了：-50分
  if (efficiency >= 20) return -100;      // 请减少旋转：-100分
  if (efficiency >= 0) return -200;       // 看清楚再旋转：-200分
  // 效率过低：扣分
  const excessRotations = Math.ceil((100 - efficiency) / 10);
  return -excessRotations * 10; // 每10%效率损失扣10分
};





/**
 * 计算旋转效率分数
 * 支持传入拼图片段数组来计算最小旋转次数，或使用已计算的minRotations
 */
export const calculateRotationScore = (stats: GameStats, pieces?: PuzzlePiece[]): number => {
  // 参数验证
  if (!stats) {
    console.error('[calculateRotationScore] stats为空');
    return 0;
  }

  let minRotations = stats.minRotations;

  // 只有在stats.minRotations为空或0时，才重新计算最小旋转次数
  // 避免游戏完成时重新计算导致得到0的问题
  if ((!minRotations || minRotations === 0) && pieces && pieces.length > 0) {
    minRotations = calculateMinimumRotations(pieces);
    console.log(`[calculateRotationScore] 重新计算最小旋转次数: ${minRotations}`);
  }

  // 如果还没有旋转数据，返回0分（不奖励不惩罚）
  if (stats.totalRotations === 0) {
    return 0;
  }

  // 如果没有最小旋转数据，也返回0分
  if (!minRotations || minRotations === 0) {
    console.warn('[calculateRotationScore] 最小旋转次数为0，返回0分');
    return 0;
  }

  // 计算旋转效率百分比
  const rotationEfficiency = (minRotations / stats.totalRotations) * 100;

  console.log(`[calculateRotationScore] 旋转数据: 最小${minRotations}次, 实际${stats.totalRotations}次, 效率${rotationEfficiency.toFixed(1)}%`);

  // 使用评级系统计算分数
  const rotationScore = calculateRotationScoreByEfficiency(rotationEfficiency);
  console.log(`[calculateRotationScore] 旋转分数: ${rotationScore}`);

  return rotationScore;
};

/**
 * 计算提示使用分数（明确三种情况）- 按设计文档v2规则
 */
export const calculateHintScore = (actualHints: number, allowance: number): number => {
  if (actualHints === 0) {
    // 情况1：没有使用提示 - 高额奖励分数
    return 300; // 零提示完成：+300分奖励（提升刺激性）
  }

  if (actualHints <= allowance) {
    // 情况2：使用了提示但没有超过赠送次数 - 无惩罚
    return 0; // 在赠送范围内：无惩罚无奖励
  }

  // 情况3：超过了赠送次数 - 扣分惩罚
  const excessHints = actualHints - allowance;
  return -excessHints * 25; // 每次超出扣25分
};

/**
 * 计算提示使用分数（GameStats版本，按设计文档v2）
 */
export const calculateHintScoreFromStats = (stats: GameStats): number => {
  // 按设计文档v2：基于切割次数计算提示赠送，不是基于难度级别！
  const allowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);
  const hintScore = calculateHintScore(stats.hintUsageCount, allowance);

  console.log('[calculateHintScoreFromStats] Debug:', {
    hintUsageCount: stats.hintUsageCount,
    cutCount: stats.difficulty.cutCount,
    allowance: allowance,
    hintScore: hintScore
  });

  return hintScore;
};

/**
 * 计算增量分数变化
 * 优化性能，只计算变化的部分
 */
export const calculateScoreDelta = (
  oldStats: GameStats | null,
  newStats: GameStats,
  leaderboard: GameRecord[] = []
): {
  delta: number;
  newScore: number;
  reason: string;
} => {
  const newScore = calculateLiveScore(newStats, leaderboard);

  if (!oldStats) {
    return {
      delta: newScore,
      newScore,
      reason: '游戏开始'
    };
  }

  const oldScore = calculateLiveScore(oldStats, leaderboard);
  const delta = newScore - oldScore;

  // 确定变化原因
  let reason = '';
  if (newStats.totalRotations !== oldStats.totalRotations) {
    reason = '旋转操作';
  } else if (newStats.hintUsageCount !== oldStats.hintUsageCount) {
    reason = '使用提示';
  } else if (newStats.dragOperations !== oldStats.dragOperations) {
    reason = '拖拽操作';
  } else if (newStats.totalDuration !== oldStats.totalDuration) {
    reason = '时间更新';
  } else {
    reason = '数据更新';
  }

  return {
    delta,
    newScore,
    reason
  };
};

/**
 * 性能监控装饰器
 */
export const withPerformanceMonitoring = <T extends any[], R>(
  fn: (...args: T) => R,
  name: string
): ((...args: T) => R) => {
  return (...args: T): R => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // 如果计算时间超过10ms，记录警告
    if (duration > 10) {
      console.warn(`分数计算性能警告: ${name} 耗时 ${duration.toFixed(2)}ms`);
    }

    return result;
  };
};

/**
 * 带性能监控的实时分数计算
 */
export const calculateLiveScoreWithMonitoring = withPerformanceMonitoring(
  calculateLiveScore,
  'calculateLiveScore'
);

/**
 * 安全的分数计算包装器
 * 提供错误处理和默认值
 */
export const safeCalculateScore = <T>(
  calculator: () => T,
  defaultValue: T,
  errorContext: string
): T => {
  try {
    return calculator();
  } catch (error) {
    console.warn(`分数计算错误 (${errorContext}):`, error);
    return defaultValue;
  }
};

/**
 * 格式化分数显示
 * 使用千分位分隔符格式化数字
 */
export const formatScore = (score: number): string => {
  return score.toLocaleString('zh-CN');
};

/**
 * 格式化时间显示
 * 转换秒数为MM:SS格式
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * 防抖函数
 * 用于优化实时分数更新的性能
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * 实时分数更新优化器
 * 结合防抖和增量计算，提供高性能的实时分数更新
 */
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
    updateScore: (stats: GameStats, leaderboard: GameRecord[] = []) => {
      debouncedUpdate(stats, leaderboard);
    },
    reset: () => {
      lastStats = null;
    }
  };
};

/**
 * 计算最终分数（完整版）
 * 集成所有评分系统，包括最优解计算
 * 
 * @param stats 游戏统计数据
 * @param pieces 拼图片段数组
 * @param currentLeaderboard 当前排行榜数据
 */
export const calculateFinalScore = (
  stats: GameStats,
  pieces: PuzzlePiece[],
  currentLeaderboard: GameRecord[] = []
): ScoreBreakdown => {
  return safeCalculateScore(() => {
    // 基础分数
    const baseScore = getBaseScore(stats.difficulty.actualPieces);

    // 基于排行榜的速度奖励系统
    console.log(`[calculateFinalScore] 调用calculateTimeBonus，排行榜记录数: ${currentLeaderboard?.length || 0}`);
    if (currentLeaderboard && currentLeaderboard.length > 0) {
      console.log(`[calculateFinalScore] 排行榜前3条:`, currentLeaderboard.slice(0, 3).map(r => `${r.finalScore}分-${r.totalDuration}秒`));
    }

    const timeBonusResult = calculateTimeBonus(stats, currentLeaderboard);

    // 使用游戏开始时保存的最小旋转次数，而不是重新计算
    // 因为游戏完成时拼图片段角度已经是0度，重新计算会得到0
    const minRotations = stats.minRotations || calculateMinimumRotations(pieces);
    console.log(`[calculateFinalScore] 使用最小旋转次数: ${minRotations} (来源: ${stats.minRotations ? '游戏开始时保存' : '重新计算'}), 拼图片段数: ${pieces.length}`);

    // 旋转效率评分（基于最优解）
    const rotationEfficiency = calculateRotationEfficiency(minRotations, stats.totalRotations);
    console.log(`[calculateFinalScore] 旋转效率: ${rotationEfficiency.toFixed(1)}%, 实际旋转: ${stats.totalRotations}次`);

    const rotationScore = calculateRotationScore({ ...stats, minRotations }, pieces);
    console.log(`[calculateFinalScore] 旋转分数: ${rotationScore}`);

    // 提示使用评分（基于切割次数，按设计文档v2）
    const hintAllowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);
    const hintScore = calculateHintScore(stats.hintUsageCount, hintAllowance);

    // 删除拖拽操作惩罚（根据用户反馈）
    // 原因：每位玩家的操作方式不一样，鼠标和手指的速度节奏不一样
    // 整体计时已经能够计算玩家的操作时长，无需对拖拽进行苛刻扣分

    // 难度系数
    const difficultyMultiplier = calculateDifficultyMultiplier(stats.difficulty);

    // 最终分数计算
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
    baseScore: 0,
    timeBonus: 0,
    timeBonusRank: 0,
    isTimeRecord: false,
    rotationScore: 0,
    rotationEfficiency: 0,
    minRotations: 0,
    hintScore: 0,
    hintAllowance: 0,
    difficultyMultiplier: 1,
    finalScore: 100
  }, 'calculateFinalScore');
};

/**
 * 更新GameStats中的最优解数据
 * 基于拼图片段计算并更新最小旋转次数和效率
 */
export const updateStatsWithOptimalSolution = (stats: GameStats, pieces: PuzzlePiece[]): GameStats => {
  const minRotations = calculateMinimumRotations(pieces);
  const rotationEfficiency = calculateRotationEfficiency(minRotations, stats.totalRotations);
  const hintAllowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);

  return {
    ...stats,
    minRotations,
    rotationEfficiency,
    hintAllowance
  };
};

/**
 * 格式化排名显示
 * 将排名转换为显示文本
 */
export const formatRankDisplay = (rank: number, totalRecords: number): string => {
  if (rank === 1) {
    return '第1名🏆';
  } else if (rank <= 5) {
    return `第${rank}名`;
  } else {
    return `第${rank}名 (共${totalRecords}名)`;
  }
};

/**
 * 获取新记录标识
 * 返回新记录的显示标识和庆祝信息
 */
export const getNewRecordBadge = (recordInfo: {
  isNewRecord: boolean;
  previousBest?: number;
  improvement?: number;
}): {
  badge: string;
  message: string;
  shouldCelebrate: boolean;
} => {
  if (!recordInfo.isNewRecord) {
    return {
      badge: '',
      message: '',
      shouldCelebrate: false
    };
  }

  if (recordInfo.previousBest && recordInfo.improvement) {
    const improvementText = formatTime(recordInfo.improvement);
    return {
      badge: '🆕记录',
      message: `恭喜！您创造了新记录，比之前最佳成绩快了${improvementText}！`,
      shouldCelebrate: true
    };
  } else {
    return {
      badge: '🆕记录',
      message: '恭喜！您创造了该难度的首个记录！',
      shouldCelebrate: true
    };
  }
};

/**
 * 计算排行榜统计信息
 * 提供完整的排行榜相关数据
 */
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

/**
 * 集成排行榜数据的增强分数计算
 * 提供完整的排行榜集成分数计算
 */
export const calculateScoreWithLeaderboard = (
  stats: GameStats,
  pieces: PuzzlePiece[],
  currentLeaderboard: GameRecord[]
): ScoreBreakdown & {
  leaderboardStats: ReturnType<typeof calculateLeaderboardStats>;
} => {
  const scoreBreakdown = calculateFinalScore(stats, pieces, currentLeaderboard);
  const leaderboardStats = calculateLeaderboardStats(stats, currentLeaderboard);

  return {
    ...scoreBreakdown,
    leaderboardStats
  };
};