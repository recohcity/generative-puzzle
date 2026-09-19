import { GameStats, PuzzlePiece } from '../../types/puzzleTypes';
import { calculateNewRotationScore } from './RotationEfficiencyCalculator';

/**
 * 旋转效率/旋转分/最优旋转计算
 * 从 ScoreCalculator.ts 拆出（P2-3）
 */

/**
 * 计算最小旋转次数（统一规则文档 v3.1 算法）
 * 旋转最优解规则：
 * - 角度 ≤ 180°：使用逆时针旋转到 0°
 * - 角度 > 180°：使用顺时针旋转到 0°
 * - 每次旋转 15° 增量
 */
export const calculateMinimumRotationsAtStart = (pieces: PuzzlePiece[]): number => {
  if (!pieces || pieces.length === 0) {
    return 0;
  }

  return pieces.reduce((total, piece) => {
    let scatteredAngle = piece.rotation % 360;
    if (scatteredAngle < 0) {
      scatteredAngle += 360;
    }

    let minRotations: number;

    if (scatteredAngle <= 180) {
      minRotations = Math.ceil(scatteredAngle / 15);
    } else {
      const clockwiseAngle = 360 - scatteredAngle;
      minRotations = Math.ceil(clockwiseAngle / 15);
    }

    return total + minRotations;
  }, 0);
};

/**
 * 计算最小旋转次数（兼容性函数）
 */
export const calculateMinimumRotations = (pieces: PuzzlePiece[]): number => {
  return calculateMinimumRotationsAtStart(pieces);
};

/**
 * 计算旋转效率
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
 */
export const formatRotationDisplay = (
  actualRotations: number,
  minRotations: number
): string => {
  return `旋转次数：${actualRotations}次（最佳：${minRotations}次）`;
};

/**
 * 计算旋转效率百分比（0-100）
 */
export const calculateRotationEfficiencyPercentage = (
  minRotations: number,
  actualRotations: number
): number => {
  if (actualRotations === 0) {
    return minRotations === 0 ? 100 : 0;
  }

  if (minRotations === 0) {
    return 100;
  }

  return Math.min(100, Math.round((minRotations / actualRotations) * 100));
};

/**
 * 计算当前状态到完成状态的剩余旋转次数
 */
export const calculateRemainingRotations = (pieces: PuzzlePiece[]): number => {
  if (!pieces || pieces.length === 0) {
    return 0;
  }

  return pieces.reduce((total, piece) => {
    if (piece.isCompleted) {
      return total;
    }

    let currentAngle = piece.rotation % 360;
    if (currentAngle < 0) {
      currentAngle += 360;
    }

    let minRotations: number;

    if (currentAngle <= 180) {
      minRotations = Math.ceil(currentAngle / 15);
    } else {
      const clockwiseAngle = 360 - currentAngle;
      minRotations = Math.ceil(clockwiseAngle / 15);
    }

    return total + minRotations;
  }, 0);
};

/**
 * 旧的旋转效率分数计算算法（降级方案）
 */
const calculateLegacyRotationScore = (stats: GameStats, minRotations: number): number => {
  const rotationEfficiency = (minRotations / stats.totalRotations) * 100;

  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateLegacyRotationScore] 降级算法计算: 最小${minRotations}次, 实际${stats.totalRotations}次, 效率${rotationEfficiency.toFixed(1)}%`);

  let rotationScore = 0;
  if (rotationEfficiency >= 100) {
    rotationScore = 200;
  } else if (rotationEfficiency >= 80) {
    rotationScore = 100;
  } else if (rotationEfficiency >= 60) {
    rotationScore = 50;
  } else if (rotationEfficiency >= 40) {
    rotationScore = -50;
  } else if (rotationEfficiency >= 20) {
    rotationScore = -100;
  } else {
    rotationScore = -200;
  }

  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateLegacyRotationScore] 降级算法分数: ${rotationScore}`);
  return rotationScore;
};

/**
 * 计算旋转效率分数（新算法：完美旋转+500分，每超出1次-10分）
 */
export const calculateRotationScore = (stats: GameStats, pieces?: PuzzlePiece[]): number => {
  if (!stats) {
    console.error('[calculateRotationScore] stats为空');
    return 0;
  }

  let minRotations = stats.minRotations;

  if ((!minRotations || minRotations === 0) && pieces && pieces.length > 0) {
    minRotations = calculateMinimumRotations(pieces);
    if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateRotationScore] 重新计算最小旋转次数: ${minRotations}`);
  }

  if (stats.totalRotations === 0) {
    return 0;
  }

  if (!minRotations || minRotations === 0) {
    console.warn('[calculateRotationScore] 最小旋转次数为0，返回0分');
    return 0;
  }

  try {
    const newScore = calculateNewRotationScore(stats.totalRotations, minRotations);

    if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateRotationScore] 新算法计算结果: 最小${minRotations}次, 实际${stats.totalRotations}次, 分数${newScore}`);

    return newScore;
  } catch (error) {
    console.warn('[calculateRotationScore] 新算法失败，降级到旧算法:', error);

    try {
      return calculateLegacyRotationScore(stats, minRotations);
    } catch (legacyError) {
      console.error('[calculateRotationScore] 旧算法也失败:', legacyError);
      return 0;
    }
  }
};
