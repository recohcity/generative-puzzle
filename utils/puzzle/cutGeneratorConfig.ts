/**
 * 切割线生成器配置模块
 * 集中管理所有配置参数，消除魔法数字
 */

export const CUT_GENERATOR_CONFIG = {
  // 算法性能参数
  MAX_ATTEMPTS: 50,
  EARLY_EXIT_THRESHOLD: 0.8,

  // 验证参数
  CENTER_DISTANCE_THRESHOLD: 100,
  MIN_CUT_DISTANCE: 15,

  // 重试参数
  EXTRA_CUT_ATTEMPTS: 20,
  CENTER_CUT_ATTEMPTS: 15,
  MEDIUM_DIFFICULTY_ATTEMPTS: 10,

  // 几何参数
  EXTENSION_FACTOR: 0.75,
  DIAGONAL_FACTOR: 1.2,
  BOUNDS_EXTENSION: 0.2,

  // 随机性参数
  RANDOM_CUT_PROBABILITY: 0.7,
  PERPENDICULAR_CUT_PROBABILITY: 0.3,
  VERTICAL_CUT_PROBABILITY: 0.5,

  // 偏移参数
  CENTER_OFFSET_RANGE: 30,
  HIGH_DIFFICULTY_OFFSET: 60,
  ANGLE_OFFSET_RANGE: 0.15,

  // 难度级别配置
  // 🔧 重要：targetCuts 是切割线数量，不是切割次数！
  // 切割线数量决定难度级别，实际拼图数量是随机的
  // 重新设计：每个难度都有合理的拼图数量区间
  DIFFICULTY_SETTINGS: {
    1: {
      targetCuts: 2,  // 2条切割线 → 3-4块拼图（入门）
      centerProbability: 0.9,
      useCenter: true,
      label: '入门难度',
      pieceRange: { min: 3, max: 4 },
      baseScore: 500
    },
    2: {
      targetCuts: 3,  // 3条切割线 → 4-6块拼图（简单）
      centerProbability: 0.8,
      useCenter: true,
      label: '简单难度',
      pieceRange: { min: 4, max: 6 },
      baseScore: 800
    },
    3: {
      targetCuts: 4,  // 4条切割线 → 5-8块拼图（初级）
      centerProbability: 0.7,
      useCenter: true,
      label: '初级难度',
      pieceRange: { min: 5, max: 8 },
      baseScore: 1200
    },
    4: {
      targetCuts: 6,  // 6条切割线 → 7-12块拼图（中级）
      centerProbability: 0.6,
      useCenter: false,
      label: '中级难度',
      pieceRange: { min: 7, max: 12 },
      baseScore: 1800
    },
    5: {
      targetCuts: 8,  // 8条切割线 → 9-16块拼图（中高级）
      centerProbability: 0.5,
      useCenter: false,
      label: '中高级难度',
      pieceRange: { min: 9, max: 16 },
      baseScore: 2500
    },
    6: {
      targetCuts: 10, // 10条切割线 → 11-20块拼图（高级）
      centerProbability: 0.4,
      useCenter: false,
      label: '高级难度',
      pieceRange: { min: 11, max: 20 },
      baseScore: 3500
    },
    7: {
      targetCuts: 12, // 12条切割线 → 13-24块拼图（专家）
      centerProbability: 0.3,
      useCenter: false,
      label: '专家难度',
      pieceRange: { min: 13, max: 24 },
      baseScore: 5000
    },
    8: {
      targetCuts: 15, // 15条切割线 → 16-30块拼图（大师）
      centerProbability: 0.2,
      useCenter: false,
      label: '大师难度',
      pieceRange: { min: 16, max: 30 },
      baseScore: 8000
    }
  } as const,

  // 难度阈值
  THRESHOLDS: {
    LOW_DIFFICULTY: 3,
    MEDIUM_DIFFICULTY: 6,
    HIGH_DIFFICULTY: 7,
    EXTREME_DIFFICULTY: 8
  }
} as const;

// 导出常用配置
export const DIFFICULTY_SETTINGS = CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;
export const MAX_ATTEMPTS = CUT_GENERATOR_CONFIG.MAX_ATTEMPTS;
export const EARLY_EXIT_THRESHOLD = CUT_GENERATOR_CONFIG.EARLY_EXIT_THRESHOLD;

export type DifficultyLevel = keyof typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;
export type DifficultySettings = typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS[DifficultyLevel];

// 新增类型定义
export interface PieceRange {
  min: number;
  max: number;
}

export interface EnhancedDifficultySettings {
  targetCuts: number;
  centerProbability: number;
  useCenter: boolean;
  label: string;
  pieceRange: PieceRange;
  baseScore: number;
}