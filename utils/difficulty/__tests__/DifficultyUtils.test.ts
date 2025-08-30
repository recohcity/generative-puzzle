/**
 * DifficultyUtils 单元测试
 * 目标：提升测试覆盖率至95%以上
 */

import {
  calculateDifficultyLevel,
  getPieceCountByDifficulty,
  getDifficultyMultiplier,
  ALL_DIFFICULTY_LEVELS,
  isValidDifficultyLevel
} from '../DifficultyUtils';
import type { DifficultyLevel } from '@/types/puzzleTypes';

describe('DifficultyUtils', () => {
  describe('calculateDifficultyLevel', () => {
    it('应该根据切割次数计算正确的难度级别', () => {
      // 测试边界值和各种情况
      expect(calculateDifficultyLevel(0)).toBe('easy');
      expect(calculateDifficultyLevel(1)).toBe('easy');
      expect(calculateDifficultyLevel(2)).toBe('easy');
      expect(calculateDifficultyLevel(3)).toBe('medium');
      expect(calculateDifficultyLevel(4)).toBe('medium');
      expect(calculateDifficultyLevel(5)).toBe('hard');
      expect(calculateDifficultyLevel(6)).toBe('hard');
      expect(calculateDifficultyLevel(7)).toBe('extreme');
      expect(calculateDifficultyLevel(10)).toBe('extreme');
      expect(calculateDifficultyLevel(100)).toBe('extreme');
    });

    it('应该处理负数切割次数', () => {
      expect(calculateDifficultyLevel(-1)).toBe('easy');
      expect(calculateDifficultyLevel(-10)).toBe('easy');
    });
  });

  describe('getPieceCountByDifficulty', () => {
    it('应该为每个难度级别返回正确的拼图数量', () => {
      expect(getPieceCountByDifficulty('easy')).toBe(4);
      expect(getPieceCountByDifficulty('medium')).toBe(6);
      expect(getPieceCountByDifficulty('hard')).toBe(8);
      expect(getPieceCountByDifficulty('extreme')).toBe(12);
    });

    it('应该覆盖所有难度级别的switch分支', () => {
      const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'extreme'];
      const expectedCounts = [4, 6, 8, 12];
      
      difficulties.forEach((difficulty, index) => {
        expect(getPieceCountByDifficulty(difficulty)).toBe(expectedCounts[index]);
      });
    });
  });

  describe('getDifficultyMultiplier', () => {
    it('应该为每个难度级别返回正确的难度系数', () => {
      expect(getDifficultyMultiplier('easy')).toBe(1.0);
      expect(getDifficultyMultiplier('medium')).toBe(1.2);
      expect(getDifficultyMultiplier('hard')).toBe(1.5);
      expect(getDifficultyMultiplier('extreme')).toBe(2.0);
    });

    it('应该覆盖所有难度级别的switch分支', () => {
      const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'extreme'];
      const expectedMultipliers = [1.0, 1.2, 1.5, 2.0];
      
      difficulties.forEach((difficulty, index) => {
        expect(getDifficultyMultiplier(difficulty)).toBe(expectedMultipliers[index]);
      });
    });
  });

  describe('ALL_DIFFICULTY_LEVELS', () => {
    it('应该包含所有支持的难度级别', () => {
      expect(ALL_DIFFICULTY_LEVELS).toEqual(['easy', 'medium', 'hard', 'extreme']);
      expect(ALL_DIFFICULTY_LEVELS).toHaveLength(4);
    });

    it('应该包含正确的类型', () => {
      ALL_DIFFICULTY_LEVELS.forEach(level => {
        expect(typeof level).toBe('string');
        expect(['easy', 'medium', 'hard', 'extreme']).toContain(level);
      });
    });
  });

  describe('isValidDifficultyLevel', () => {
    it('应该验证有效的难度级别', () => {
      expect(isValidDifficultyLevel('easy')).toBe(true);
      expect(isValidDifficultyLevel('medium')).toBe(true);
      expect(isValidDifficultyLevel('hard')).toBe(true);
      expect(isValidDifficultyLevel('extreme')).toBe(true);
    });

    it('应该拒绝无效的难度级别', () => {
      expect(isValidDifficultyLevel('invalid')).toBe(false);
      expect(isValidDifficultyLevel('')).toBe(false);
      expect(isValidDifficultyLevel('EASY')).toBe(false);
      expect(isValidDifficultyLevel('Easy')).toBe(false);
      expect(isValidDifficultyLevel('easy ')).toBe(false);
      expect(isValidDifficultyLevel(' easy')).toBe(false);
    });

    it('应该处理边界情况', () => {
      expect(isValidDifficultyLevel('')).toBe(false);
      expect(isValidDifficultyLevel('   ')).toBe(false);
      expect(isValidDifficultyLevel('easy,medium')).toBe(false);
      expect(isValidDifficultyLevel('easy medium')).toBe(false);
    });

    it('应该具有正确的类型保护功能', () => {
      const testString = 'easy';
      if (isValidDifficultyLevel(testString)) {
        // 在这个分支中，TypeScript应该知道testString是DifficultyLevel类型
        const difficulty: DifficultyLevel = testString; // 这应该不报错
        expect(difficulty).toBe('easy');
      }
    });
  });

  describe('集成测试', () => {
    it('应该能够完整处理难度级别流程', () => {
      const cutCount = 5;
      const difficulty = calculateDifficultyLevel(cutCount);
      
      expect(difficulty).toBe('hard');
      expect(isValidDifficultyLevel(difficulty)).toBe(true);
      expect(getPieceCountByDifficulty(difficulty)).toBe(8);
      expect(getDifficultyMultiplier(difficulty)).toBe(1.5);
    });

    it('应该处理极端情况', () => {
      const extremeCutCount = 100;
      const difficulty = calculateDifficultyLevel(extremeCutCount);
      
      expect(difficulty).toBe('extreme');
      expect(isValidDifficultyLevel(difficulty)).toBe(true);
      expect(getPieceCountByDifficulty(difficulty)).toBe(12);
      expect(getDifficultyMultiplier(difficulty)).toBe(2.0);
    });

    it('应该处理简单情况', () => {
      const easyCutCount = 1;
      const difficulty = calculateDifficultyLevel(easyCutCount);
      
      expect(difficulty).toBe('easy');
      expect(isValidDifficultyLevel(difficulty)).toBe(true);
      expect(getPieceCountByDifficulty(difficulty)).toBe(4);
      expect(getDifficultyMultiplier(difficulty)).toBe(1.0);
    });
  });

  describe('边界值测试', () => {
    it('应该正确处理难度级别的边界值', () => {
      // 测试每个难度级别的边界值
      expect(calculateDifficultyLevel(2)).toBe('easy'); // easy的上限
      expect(calculateDifficultyLevel(3)).toBe('medium'); // medium的下限
      expect(calculateDifficultyLevel(4)).toBe('medium'); // medium的上限
      expect(calculateDifficultyLevel(5)).toBe('hard'); // hard的下限
      expect(calculateDifficultyLevel(6)).toBe('hard'); // hard的上限
      expect(calculateDifficultyLevel(7)).toBe('extreme'); // extreme的下限
    });

    it('应该处理零和负数切割次数', () => {
      expect(calculateDifficultyLevel(0)).toBe('easy');
      expect(calculateDifficultyLevel(-1)).toBe('easy');
      expect(calculateDifficultyLevel(-100)).toBe('easy');
    });
  });

  describe('类型安全测试', () => {
    it('应该确保所有函数返回正确的类型', () => {
      const cutCount = 3;
      const difficulty = calculateDifficultyLevel(cutCount);
      
      // 验证返回类型
      expect(typeof difficulty).toBe('string');
      expect(['easy', 'medium', 'hard', 'extreme']).toContain(difficulty);
      
      // 验证其他函数的返回类型
      expect(typeof getPieceCountByDifficulty(difficulty)).toBe('number');
      expect(typeof getDifficultyMultiplier(difficulty)).toBe('number');
      expect(typeof isValidDifficultyLevel(difficulty)).toBe('boolean');
    });
  });
});
