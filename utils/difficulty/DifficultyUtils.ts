/**
 * 难度系统统一工具函数
 * 与cutGeneratorConfig.ts保持完全一致，支持动态拼图数量
 */

import { DifficultyLevel } from '@/types/puzzleTypes';

/**
 * 根据切割次数计算难度级别（与cutGeneratorConfig.ts保持一致）
 */
export const calculateDifficultyLevel = (cutCount: number): DifficultyLevel => {
  if (cutCount <= 3) return 'easy';      // 1-3次切割：简单
  if (cutCount <= 6) return 'medium';    // 4-6次切割：中等
  if (cutCount <= 7) return 'hard';      // 7次切割：困难
  return 'extreme';                      // 8次切割：极难
};

/**
 * 根据难度级别获取预期拼图数量范围（兼容性函数，已废弃）
 * @deprecated 请使用cutGeneratorConfig.ts的动态数量系统
 */
export const getPieceCountByDifficulty = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'easy': return 4;     // 1-3次切割的预期范围
    case 'medium': return 6;   // 4-6次切割的预期范围
    case 'hard': return 8;     // 7次切割的预期范围
    case 'extreme': return 12; // 8次切割的预期范围
    case 'expert': return 16;  // 保留兼容性
  }
};

/**
 * 根据难度级别获取难度系数（兼容性函数，已废弃）
 * @deprecated 请使用ScoreCalculator.ts中基于切割次数的系统
 */
export const getDifficultyMultiplier = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'easy': return 1.0;
    case 'medium': return 1.2;
    case 'hard': return 1.5;
    case 'extreme': return 2.0;
    case 'expert': return 2.5;
  }
};

/**
 * 所有支持的难度级别
 */
export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard', 'extreme', 'expert'];

/**
 * 验证难度级别是否有效
 */
export const isValidDifficultyLevel = (difficulty: string): difficulty is DifficultyLevel => {
  return ALL_DIFFICULTY_LEVELS.includes(difficulty as DifficultyLevel);
};