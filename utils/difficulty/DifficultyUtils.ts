/**
 * 难度系统统一工具函数
 * 提供统一的难度级别处理逻辑
 */

import { DifficultyLevel } from '@/types/puzzleTypes';

/**
 * 根据切割次数计算难度级别
 */
export const calculateDifficultyLevel = (cutCount: number): DifficultyLevel => {
  if (cutCount <= 2) return 'easy';
  if (cutCount <= 4) return 'medium';
  if (cutCount <= 6) return 'hard';
  return 'extreme';
};

/**
 * 根据难度级别获取实际拼图数量
 */
export const getPieceCountByDifficulty = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'easy': return 4;
    case 'medium': return 6;
    case 'hard': return 8;
    case 'extreme': return 12;
  }
};

/**
 * 根据难度级别获取难度系数
 */
export const getDifficultyMultiplier = (difficulty: DifficultyLevel): number => {
  switch (difficulty) {
    case 'easy': return 1.0;
    case 'medium': return 1.2;
    case 'hard': return 1.5;
    case 'extreme': return 2.0;
  }
};

/**
 * 所有支持的难度级别
 */
export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard', 'extreme'];

/**
 * 验证难度级别是否有效
 */
export const isValidDifficultyLevel = (difficulty: string): difficulty is DifficultyLevel => {
  return ALL_DIFFICULTY_LEVELS.includes(difficulty as DifficultyLevel);
};