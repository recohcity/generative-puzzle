import { ShapeType, CutType, DifficultyConfig } from '../../types/puzzleTypes';

/**
 * 难度/基础分/形状/设备/切割类型倍率
 * 从 ScoreCalculator.ts 拆出（P2-3）
 */

// 基于统一规则文档 v3.1 的基础分数表
const BASE_SCORES_BY_DIFFICULTY: Record<number, number> = {
  1: 500,
  2: 800,
  3: 1200,
  4: 1800,
  5: 2500,
  6: 3500,
  7: 5000,
  8: 8000
};

// 基于统一规则文档 v3.1 的难度系数表
const DIFFICULTY_MULTIPLIERS_BY_LEVEL: Record<number, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 1.8,
  5: 2.2,
  6: 2.8,
  7: 3.5,
  8: 5.0
};

/**
 * 获取形状难度系数（v3.2 平衡优化版）
 */
export const getShapeMultiplier = (shapeType?: ShapeType | string): number => {
  if (!shapeType) {
    console.warn('[getShapeMultiplier] 形状类型为空，使用默认系数1.0');
    return 1.0;
  }

  const shapeMultipliers: Record<string, number> = {
    [ShapeType.Polygon]: 1.0,
    [ShapeType.Cloud]: 1.1,
    [ShapeType.Jagged]: 1.05,
  };

  const multiplier = shapeMultipliers[shapeType] || 1.0;
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[getShapeMultiplier] 形状类型 ${shapeType} -> 形状系数 ${multiplier}`);
  return multiplier;
};

/**
 * 获取设备难度系数（v3.1）
 * 移动端 1.1，桌面端和 iPad 1.0
 */
export const getDeviceMultiplier = (): number => {
  if (typeof window === 'undefined') {
    return 1.0;
  }

  const userAgent = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  const isIPad = /iPad/i.test(userAgent) ||
    (isIOS && screenWidth >= 768) ||
    (isTouchDevice && screenWidth >= 768 && screenWidth <= 1366 &&
      (screenHeight >= 1024 || (screenWidth >= 1024 && screenHeight >= 768)));

  const isMobileDevice = isMobile && !isIPad;

  if (isMobileDevice) {
    return 1.1;
  }

  return 1.0;
};

// 切割类型难度系数（v3.2 平衡优化版）
const CUT_TYPE_MULTIPLIERS: Record<string, number> = {
  [CutType.Straight]: 1.0,
  [CutType.Diagonal]: 1.15,
  [CutType.Radial]: 1.25,
  [CutType.ThroughCurve]: 1.3,
  [CutType.MosaicRandom]: 1.35,
  [CutType.ConcavoConvex]: 1.4,
  [CutType.Jigsaw]: 1.3,
  [CutType.SCurve]: 1.2,
  [CutType.Zigzag]: 1.2,
  [CutType.Hex]: 1.35,
};

/**
 * 计算难度系数（v3.2 平衡优化版）
 */
export const calculateDifficultyMultiplier = (config: DifficultyConfig): number => {
  const baseMultiplier = DIFFICULTY_MULTIPLIERS_BY_LEVEL[config.cutCount] || 1.0;
  const cutTypeMultiplier = CUT_TYPE_MULTIPLIERS[config.cutType] || 1.0;
  const deviceMultiplier = getDeviceMultiplier();
  const shapeMultiplier = getShapeMultiplier(config.shapeType);

  const finalMultiplier = baseMultiplier * cutTypeMultiplier * deviceMultiplier * shapeMultiplier;

  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateDifficultyMultiplier] 难度级别 ${config.cutCount} -> 基础系数 ${baseMultiplier}`);
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateDifficultyMultiplier] 切割类型 ${config.cutType} -> 切割系数 ${cutTypeMultiplier}`);
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateDifficultyMultiplier] 设备系数 ${deviceMultiplier}`);
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateDifficultyMultiplier] 形状系数 ${shapeMultiplier}`);
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[calculateDifficultyMultiplier] 最终系数 ${finalMultiplier}`);

  return finalMultiplier;
};

/**
 * 获取基础分数（严格按v2文档表格1）
 */
export const getBaseScore = (difficultyLevel: number): number => {
  const baseScore = BASE_SCORES_BY_DIFFICULTY[difficultyLevel] || 1000;
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[getBaseScore] 难度级别 ${difficultyLevel} -> 基础分数 ${baseScore}`);
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
  const multiplier = Math.min(2.0, 1.0 + (actualPieces - 10) * 0.1);
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[getBaseDifficultyMultiplierByPieces] 拼图数量 ${actualPieces} -> 难度系数 ${multiplier}`);
  return multiplier;
};
