import { GameStats, DifficultyConfig, ScoreBreakdown, GameRecord, PuzzlePiece, ShapeType, CutType } from '@/types/puzzleTypes';
import { calculateNewRotationScore } from './RotationEfficiencyCalculator';

/**
 * 生成式拼图游戏 - 分数计算引擎
 * 基于统一规则文档 v3.4 (docs/game-rules-unified.md)
 * 
 * 核心特性：
 * - 基于难度级别（1-8）的固定基础分数和系数
 * - 动态速度奖励系统（v3.4：基于实际测试数据优化的时间阈值和奖励分数）
 * - v3.0 旋转效率算法（完美+500分，超出-10分/次）
 * - 统一提示系统（3次免费，零提示+500分）
 * - 形状难度系数（多边形1.0，云朵1.1，锯齿1.05）
 * - 设备适配系数（移动端1.1，桌面端和iPad 1.0）
 * 
 * 最终公式：
 * finalScore = (baseScore + timeBonus + rotationScore + hintScore) × difficultyMultiplier
 * difficultyMultiplier = baseDifficultyMultiplier × cutTypeMultiplier × deviceMultiplier × shapeMultiplier
 * 
 * 速度奖励公式（v3.4）：
 * timeBonus = calculateDynamicTimeBonusThresholds(pieceCount, difficultyLevel)
 * 基础时间 = pieceCount × getAverageTimePerPiece(difficultyLevel)
 * 优化：基于实际测试数据（难度1，4片，极限22秒）调整阈值倍数
 * 奖励分数 = baseBonus × getBaseBonusMultiplier(difficultyLevel)
 */

// 基于统一规则文档 v3.1 的基础分数表（与 cutGeneratorConfig.ts 保持一致）
// 难度级别 1-8 对应的固定基础分数
const BASE_SCORES_BY_DIFFICULTY: Record<number, number> = {
  1: 500,    // 难度1 -> 基础分500
  2: 800,    // 难度2 -> 基础分800
  3: 1200,   // 难度3 -> 基础分1200
  4: 1800,   // 难度4 -> 基础分1800
  5: 2500,   // 难度5 -> 基础分2500
  6: 3500,   // 难度6 -> 基础分3500
  7: 5000,   // 难度7 -> 基础分5000
  8: 8000    // 难度8 -> 基础分8000
};

// 基于统一规则文档 v3.1 的难度系数表
const DIFFICULTY_MULTIPLIERS_BY_LEVEL: Record<number, number> = {
  1: 1.0,    // 难度1 -> 系数1.0
  2: 1.2,    // 难度2 -> 系数1.2
  3: 1.5,    // 难度3 -> 系数1.5
  4: 1.8,    // 难度4 -> 系数1.8
  5: 2.2,    // 难度5 -> 系数2.2
  6: 2.8,    // 难度6 -> 系数2.8
  7: 3.5,    // 难度7 -> 系数3.5
  8: 5.0     // 难度8 -> 系数5.0
};

/**
 * 动态速度奖励系统（v3.4）
 * 基于难度级别和拼图数量计算合理的时间阈值和奖励分数
 * 优化：基于实际测试数据调整每片平均时间和阈值倍数，使其更符合实际游戏体验
 * 
 * 设计理念：
 * - 每片平均时间随难度递增：难度越高，每片所需时间越长
 * - 基础时间 = 拼图数量 × 每片平均时间
 * - 速度奖励阈值 = 基础时间 × 倍数（0.3倍、0.5倍、0.7倍、1.0倍、1.5倍）
 * - 奖励分数随难度递增：难度越高，奖励分数越高
 * 
 * 示例（难度8，30片拼图）：
 * - 每片平均时间：15秒
 * - 基础时间：30 × 15 = 450秒（7.5分钟）
 * - 极速奖励（0.3倍）：135秒（2分15秒）内完成 → +1200分
 * - 快速奖励（0.5倍）：225秒（3分45秒）内完成 → +800分
 * - 良好奖励（0.7倍）：315秒（5分15秒）内完成 → +600分
 * - 标准奖励（1.0倍）：450秒（7分30秒）内完成 → +400分
 * - 一般奖励（1.5倍）：675秒（11分15秒）内完成 → +200分
 */

/**
 * 根据难度级别获取每片拼图的平均完成时间（秒）
 * 基于实际测试数据优化：
 * - 难度1，4片，极限完成时间约22秒
 * - 考虑操作延迟和界面交互，实际平均时间会更高
 */
const getAverageTimePerPiece = (difficultyLevel: number): number => {
  // 难度越高，每片所需时间越长
  if (difficultyLevel <= 2) return 5;   // 难度1-2: 5秒/片（优化：从3秒调整为5秒，更符合实际）
  if (difficultyLevel <= 4) return 7;   // 难度3-4: 7秒/片（优化：从5秒调整为7秒）
  if (difficultyLevel <= 6) return 10;  // 难度5-6: 10秒/片（优化：从8秒调整为10秒）
  return 18;                             // 难度7-8: 18秒/片（优化：从15秒调整为18秒）
};

/**
 * 根据难度级别获取基础奖励分数倍数
 */
const getBaseBonusMultiplier = (difficultyLevel: number): number => {
  // 难度越高，奖励分数越高
  if (difficultyLevel <= 2) return 1.0;   // 难度1-2: 基础倍数
  if (difficultyLevel <= 4) return 1.2;   // 难度3-4: 1.2倍
  if (difficultyLevel <= 6) return 1.5;   // 难度5-6: 1.5倍
  return 2.0;                              // 难度7-8: 2.0倍
};

/**
 * 计算动态速度奖励阈值
 * @param pieceCount 拼图数量
 * @param difficultyLevel 难度级别（1-8）
 * @returns 速度奖励阈值数组
 */
const calculateDynamicTimeBonusThresholds = (
  pieceCount: number,
  difficultyLevel: number
): Array<{ maxTime: number; bonus: number; description: string }> => {
  const avgTimePerPiece = getAverageTimePerPiece(difficultyLevel);
  const baseTime = pieceCount * avgTimePerPiece;
  const bonusMultiplier = getBaseBonusMultiplier(difficultyLevel);

  // 基础奖励分数（乘以难度倍数）
  const baseBonuses = {
    excellent: 600,  // 极速（1.0倍基础时间，基于实际测试优化）
    fast: 400,       // 快速（1.3倍基础时间）
    good: 300,       // 良好（1.6倍基础时间）
    normal: 200,     // 标准（2.0倍基础时间）
    slow: 100        // 一般（2.5倍基础时间）
  };

  // 优化后的阈值倍数（基于实际测试数据：难度1，4片，极限22秒）
  // 基础时间 = 4 × 5 = 20秒，极速阈值 = 20 × 1.0 = 20秒（接近22秒极限）
  return [
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

// 提示系统统一配置参数（所有难度统一 3 次免费提示）
let HINT_CONFIG = {
  freeHintsPerGame: 3,      // 所有难度的免费提示次数
  zeroHintBonus: 500,       // 零提示奖励分数
  excessHintPenalty: 25     // 超出每次的扣分
};

// 对外暴露配置更新方法，便于运行时或测试时调整
export const setHintConfig = (config: Partial<typeof HINT_CONFIG>) => {
  HINT_CONFIG = { ...HINT_CONFIG, ...config };
};

/**
 * 获取形状难度系数（统一规则文档 v3.2 - 平衡优化版）
 * 
 * 形状难度系数表（基于实际游戏体验重新评估）：
 * - 多边形 (Polygon): 1.0 - 标准难度，边缘规则，适合新手
 * - 云朵形 (Cloud): 1.1 - 曲线边缘增加匹配难度，初级挑战
 * - 锯齿形 (Jagged): 1.05 - 虽然边缘不规则，但独特形状反而更容易识别
 * 
 * 设计理念：
 * - 锯齿形的不规则边缘让每块拼图形状更独特，实际上降低了识别难度
 * - 云朵形的柔和曲线让拼图块边缘相似，匹配时需要更仔细判断
 * 
 * @param shapeType 形状类型
 * @returns 形状难度系数
 */
export const getShapeMultiplier = (shapeType?: ShapeType | string): number => {
  // 处理可能的 undefined 或空值
  if (!shapeType) {
    console.warn('[getShapeMultiplier] 形状类型为空，使用默认系数1.0');
    return 1.0;
  }

  // 形状难度系数映射（v3.2 平衡优化）
  const shapeMultipliers: Record<string, number> = {
    [ShapeType.Polygon]: 1.0,   // 多边形：标准难度
    [ShapeType.Cloud]: 1.1,     // 云朵形：增加10%难度（曲线边缘增加匹配难度）
    [ShapeType.Jagged]: 1.05,   // 锯齿形：增加5%难度（独特形状反而更容易识别）
  };

  const multiplier = shapeMultipliers[shapeType] || 1.0;
  console.log(`[getShapeMultiplier] 形状类型 ${shapeType} -> 形状系数 ${multiplier}`);
  return multiplier;
};

/**
 * 获取设备难度系数（统一规则文档 v3.1）
 * 
 * 设备难度系数表：
 * - 桌面端: 1.0 - 标准难度
 * - iPad: 1.0 - 标准难度
 * - 移动端（横屏+竖屏）: 1.1 - 统一 1.1 倍雾度
 * 
 * 与 useDeviceDetection 保持一致的检测逻辑
 * 
 * @returns 设备难度系数
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
 * 切割类型难度系数（v3.2 平衡优化版）
 * 
 * 基于实际游戏体验重新评估：
 * - 直线 (Straight): 1.0 - 基准难度，方形/矩形拼图，边缘容易对齐
 * - 斜线 (Diagonal): 1.15 - 三角形/菱形拼图，边缘稍难对齐但形状独特
 * - 曲线 (Curve): 1.25 - 扇形拼图，曲线边缘需要更精确的旋转角度
 * 
 * 设计理念：
 * - 曲线切割现在与直线/斜线产生相似数量的拼图（修复后）
 * - 曲线边缘确实增加了对齐难度，但扇形拼图形状相似度高也增加了识别难度
 * - 斜线切割的三角形拼图形状独特，实际识别难度不如想象中高
 */
const CUT_TYPE_MULTIPLIERS: Record<string, number> = {
  [CutType.Straight]: 1.0,   // 直线：标准难度
  [CutType.Diagonal]: 1.15,  // 斜线：增加15%难度
  [CutType.Curve]: 1.25,     // 曲线：增加25%难度（从1.5降低）
};

/**
 * 计算难度系数（v3.2 平衡优化版）
 */
export const calculateDifficultyMultiplier = (config: DifficultyConfig): number => {
  // 🔧 重新设计：基于难度级别获取基础系数
  const baseMultiplier = DIFFICULTY_MULTIPLIERS_BY_LEVEL[config.cutCount] || 1.0;

  // 切割类型系数（v3.2 平衡优化）
  const cutTypeMultiplier = CUT_TYPE_MULTIPLIERS[config.cutType] || 1.0;

  // 设备适配系数
  const deviceMultiplier = getDeviceMultiplier();

  // 形状难度系数
  const shapeMultiplier = getShapeMultiplier(config.shapeType);

  const finalMultiplier = baseMultiplier * cutTypeMultiplier * deviceMultiplier * shapeMultiplier;

  console.log(`[calculateDifficultyMultiplier] 难度级别 ${config.cutCount} -> 基础系数 ${baseMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 切割类型 ${config.cutType} -> 切割系数 ${cutTypeMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 设备系数 ${deviceMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 形状系数 ${shapeMultiplier}`);
  console.log(`[calculateDifficultyMultiplier] 最终系数 ${finalMultiplier}`);

  return finalMultiplier;
};

/**
 * 获取基础分数（严格按v2文档表格1）
 */
export const getBaseScore = (difficultyLevel: number): number => {
  // 🔧 重新设计：基于难度级别获取基础分数
  const baseScore = BASE_SCORES_BY_DIFFICULTY[difficultyLevel] || 1000;
  console.log(`[getBaseScore] 难度级别 ${difficultyLevel} -> 基础分数 ${baseScore}`);
  return baseScore;
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
  // 简化处理，基于拼图数量计算难度系数
  const multiplier = Math.min(2.0, 1.0 + (actualPieces - 10) * 0.1); // 拼图越多，难度系数越高，最高2.0
  console.log(`[getBaseDifficultyMultiplierByPieces] 拼图数量 ${actualPieces} -> 难度系数 ${multiplier}`);
  return multiplier;
};

/**
 * 获取提示次数赠送（兼容性函数 - 基于难度级别）
 */
export const getHintAllowance = (_difficultyLevel: string): number => {
  // 统一为全局配置，不再区分难度
  return HINT_CONFIG.freeHintsPerGame;
};

/**
 * 基于切割次数获取提示赠送次数（严格按v2文档表格1）
 */
export const getHintAllowanceByCutCount = (_cutCount: number): number => {
  // 统一为全局配置，不再区分切割次数
  const allowance = HINT_CONFIG.freeHintsPerGame;
  console.log(`[getHintAllowanceByCutCount] 统一赠送 -> 提示赠送 ${allowance}次`);
  return allowance;
};

/**
 * 计算最小旋转次数（统一规则文档 v3.1 算法）
 * 
 * 旋转最优解规则：
 * - 角度 ≤ 180°：使用逆时针旋转到 0°
 * - 角度 > 180°：使用顺时针旋转到 0°
 * - 每次旋转 15° 增量
 * 
 * 注意：这是游戏开始时就应该计算并存储的值
 * 
 * @param pieces 拼图片段数组
 * @returns 所有片段的最小旋转次数总和
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

  const { totalDuration, difficulty } = stats;
  const { cutCount, actualPieces } = difficulty;

  console.log(`[calculateTimeBonus] 速度奖励计算: 游戏时长${totalDuration}秒, 难度${cutCount}, 拼图${actualPieces}片`);

  // 使用动态速度奖励系统（v3.4）
  // 基于难度级别和拼图数量计算合理的时间阈值（已优化）
  const thresholds = calculateDynamicTimeBonusThresholds(actualPieces, cutCount);
  
  // 计算基础时间（用于日志显示）
  const avgTimePerPiece = getAverageTimePerPiece(cutCount);
  const baseTime = actualPieces * avgTimePerPiece;
  
  console.log(`[calculateTimeBonus] 动态阈值计算: 拼图${actualPieces}片 × ${avgTimePerPiece}秒/片 = 基础时间${baseTime}秒`);

  // 基于游戏时长给予奖励分数
  let timeBonus = 0;
  let bonusDescription = '';

  // 使用动态阈值表计算奖励
  for (const threshold of thresholds) {
    if (totalDuration <= threshold.maxTime) {
      timeBonus = threshold.bonus;
      bonusDescription = threshold.description;
      break;
    }
  }

  // 如果没有匹配任何阈值，则无奖励
  if (timeBonus === 0) {
    const maxTime = Math.round(baseTime * 1.5);
    bonusDescription = `超过${maxTime}秒（${Math.round(maxTime / 60)}分钟）`;
  }

  console.log(`[calculateTimeBonus] ${bonusDescription}: +${timeBonus}分`);

  return {
    timeBonus,
    timeBonusRank: 0, // 当前版本不基于排名
    isTimeRecord: false // 当前版本不判断记录
  };
};

/**
 * 获取速度奖励描述文本（v3.4 动态奖励版）
 * 用于在UI中显示速度奖励的详细说明
 * 
 * @param duration 游戏时长（秒）
 * @param pieceCount 拼图数量
 * @param difficultyLevel 难度级别（1-8）
 * @returns 速度奖励描述文本
 */
export const getSpeedBonusDescription = (
  duration: number,
  pieceCount: number,
  difficultyLevel: number
): string => {
  const speedDetails = getSpeedBonusDetails(duration, pieceCount, difficultyLevel);
  
  // 如果有当前等级（包括慢等级），返回描述
  if (speedDetails.currentLevel) {
    return speedDetails.currentLevel.description;
  }
  
  // 如果没有匹配的等级（理论上不应该发生）
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
 * 获取速度奖励详细信息（v3.4 动态奖励版）
 * 返回当前等级、下一个等级、所有等级列表等信息
 * 
 * @param duration 游戏时长（秒）
 * @param pieceCount 拼图数量
 * @param difficultyLevel 难度级别（1-8）
 * @returns 速度奖励详细信息对象
 */
export const getSpeedBonusDetails = (
  duration: number,
  pieceCount: number,
  difficultyLevel: number
): {
  currentLevel: { name: string; maxTime: number; bonus: number; description: string } | null;
  nextLevel: { name: string; maxTime: number; bonus: number; description: string } | null;
  allLevels: Array<{ name: string; maxTime: number; bonus: number; description: string }>;
  slowLevel: { name: string; maxTime: number; bonus: number; description: string } | null; // 慢等级（超出2.5倍基础时间）
  timeToNextLevel: number | null; // 距离下一个等级的时间差距（秒）
} => {
  const thresholds = calculateDynamicTimeBonusThresholds(pieceCount, difficultyLevel);
  const avgTimePerPiece = getAverageTimePerPiece(difficultyLevel);
  const baseTime = pieceCount * avgTimePerPiece;
  const slowThreshold = Math.round(baseTime * 1.5);
  
  // 等级名称映射（移除"完成"字样）
  const levelNames = ['极速', '快速', '良好', '标准', '一般'];
  
  // 找到当前等级
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
  
  // 慢等级（超出2.5倍基础时间，无奖励）
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
    const baseScore = getBaseScore(stats.difficulty.cutCount);
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

// 注意：旧的旋转效率评分函数已移除
// 现在使用 RotationEfficiencyCalculator 中的新算法
// 新算法：完美旋转+500分，每超出1次-10分





/**
 * 计算旋转效率分数（已更新为新算法）
 * 新算法：完美旋转+500分，每超出1次-10分
 * 支持传入拼图片段数组来计算最小旋转次数，或使用已计算的minRotations
 * 保持函数签名不变，确保向后兼容性，添加降级机制
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

  try {
    // 使用新算法计算旋转分数
    const newScore = calculateNewRotationScore(stats.totalRotations, minRotations);

    console.log(`[calculateRotationScore] 新算法计算结果: 最小${minRotations}次, 实际${stats.totalRotations}次, 分数${newScore}`);

    return newScore;
  } catch (error) {
    // 降级机制：新算法失败时回退到旧算法
    console.warn('[calculateRotationScore] 新算法失败，降级到旧算法:', error);

    try {
      return calculateLegacyRotationScore(stats, minRotations);
    } catch (legacyError) {
      console.error('[calculateRotationScore] 旧算法也失败:', legacyError);
      return 0;
    }
  }
};

/**
 * 旧的旋转效率分数计算算法（降级方案）
 * 简化的降级算法，避免依赖已删除的函数
 */
const calculateLegacyRotationScore = (stats: GameStats, minRotations: number): number => {
  // 计算旋转效率百分比
  const rotationEfficiency = (minRotations / stats.totalRotations) * 100;

  console.log(`[calculateLegacyRotationScore] 降级算法计算: 最小${minRotations}次, 实际${stats.totalRotations}次, 效率${rotationEfficiency.toFixed(1)}%`);

  // 简化的降级评分逻辑
  let rotationScore = 0;
  if (rotationEfficiency >= 100) {
    rotationScore = 200;      // 完美：+200分
  } else if (rotationEfficiency >= 80) {
    rotationScore = 100;      // 接近完美：+100分
  } else if (rotationEfficiency >= 60) {
    rotationScore = 50;       // 旋转有点多：+50分
  } else if (rotationEfficiency >= 40) {
    rotationScore = -50;      // 旋转太多了：-50分
  } else if (rotationEfficiency >= 20) {
    rotationScore = -100;     // 请减少旋转：-100分
  } else {
    rotationScore = -200;     // 看清楚再旋转：-200分
  }

  console.log(`[calculateLegacyRotationScore] 降级算法分数: ${rotationScore}`);
  return rotationScore;
};

/**
 * 计算提示使用分数（明确三种情况）- 按设计文档v2规则
 */
export const calculateHintScore = (actualHints: number, allowance: number): number => {
  if (actualHints === 0) {
    // 情况1：没有使用提示 - 高额奖励分数
    return HINT_CONFIG.zeroHintBonus; // 统一为可配置
  }

  if (actualHints <= allowance) {
    // 情况2：使用了提示但没有超过赠送次数 - 无惩罚
    return 0; // 在赠送范围内：无惩罚无奖励
  }

  // 情况3：超过了赠送次数 - 扣分惩罚
  const excessHints = actualHints - allowance;
  return -excessHints * HINT_CONFIG.excessHintPenalty; // 统一为可配置
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
    const baseScore = getBaseScore(stats.difficulty.cutCount);

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