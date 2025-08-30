/**
 * LeaderboardSimplifier 测试套件
 * 测试排行榜简化处理工具的所有功能
 */

import { LeaderboardSimplifier } from '../LeaderboardSimplifier';
import { GameRecord, DifficultyConfig, CutType, DifficultyLevel } from '@/types/puzzleTypes';

// 创建测试用的GameRecord工厂函数
let timestampCounter = 1000000; // 全局计数器确保每个记录有唯一的timestamp

const createGameRecord = (overrides: Partial<GameRecord> = {}): GameRecord => {
  const defaultDifficulty: DifficultyConfig = {
    cutCount: 2,
    cutType: CutType.Straight,
    actualPieces: 4,
    difficultyLevel: 'easy' as DifficultyLevel
  };

  const uniqueTimestamp = timestampCounter++;
  
  return {
    timestamp: uniqueTimestamp,
    finalScore: 1000,
    totalDuration: 60,
    difficulty: defaultDifficulty,
    deviceInfo: {
      type: 'desktop',
      screenWidth: 1920,
      screenHeight: 1080
    },
    totalRotations: 5,
    hintUsageCount: 1,
    dragOperations: 10,
    rotationEfficiency: 0.8,
    scoreBreakdown: {},
    gameStartTime: uniqueTimestamp,
    id: 'test-id',
    ...overrides
  };
};

describe('LeaderboardSimplifier', () => {
  describe('unifyLeaderboard', () => {
    it('应该按总分降序排列所有成绩', () => {
      const records = [
        createGameRecord({ finalScore: 500 }),
        createGameRecord({ finalScore: 1500 }),
        createGameRecord({ finalScore: 1000 })
      ];

      const result = LeaderboardSimplifier.unifyLeaderboard(records);

      expect(result).toHaveLength(3);
      expect(result[0].finalScore).toBe(1500);
      expect(result[1].finalScore).toBe(1000);
      expect(result[2].finalScore).toBe(500);
    });

    it('应该过滤掉无效的记录', () => {
      const records = [
        createGameRecord({ finalScore: 1000 }),
        null as any,
        undefined as any,
        createGameRecord({ finalScore: undefined as any }),
        createGameRecord({ finalScore: 500 })
      ];

      const result = LeaderboardSimplifier.unifyLeaderboard(records);

      expect(result).toHaveLength(2);
      expect(result[0].finalScore).toBe(1000);
      expect(result[1].finalScore).toBe(500);
    });

    it('应该处理空数组', () => {
      const result = LeaderboardSimplifier.unifyLeaderboard([]);
      expect(result).toEqual([]);
    });

    it('应该处理null和undefined输入', () => {
      expect(LeaderboardSimplifier.unifyLeaderboard(null as any)).toEqual([]);
      expect(LeaderboardSimplifier.unifyLeaderboard(undefined as any)).toEqual([]);
    });

    it('应该处理非数组输入', () => {
      expect(LeaderboardSimplifier.unifyLeaderboard('not-array' as any)).toEqual([]);
      expect(LeaderboardSimplifier.unifyLeaderboard({} as any)).toEqual([]);
    });
  });

  describe('getTop5Records', () => {
    it('应该返回前5名成绩', () => {
      const records = Array.from({ length: 10 }, (_, i) => 
        createGameRecord({ finalScore: 1000 - i * 100 })
      );

      const result = LeaderboardSimplifier.getTop5Records(records);

      expect(result).toHaveLength(5);
      expect(result[0].finalScore).toBe(1000);
      expect(result[4].finalScore).toBe(600);
    });

    it('应该处理少于5条记录的情况', () => {
      const records = [
        createGameRecord({ finalScore: 1000 }),
        createGameRecord({ finalScore: 800 })
      ];

      const result = LeaderboardSimplifier.getTop5Records(records);

      expect(result).toHaveLength(2);
      expect(result[0].finalScore).toBe(1000);
      expect(result[1].finalScore).toBe(800);
    });

    it('应该处理空数组', () => {
      const result = LeaderboardSimplifier.getTop5Records([]);
      expect(result).toEqual([]);
    });
  });

  describe('detectPlayerNewEntry', () => {
    const now = Date.now();
    const recentTimestamp = now - 2 * 60 * 1000; // 2分钟前
    const oldTimestamp = now - 10 * 60 * 1000; // 10分钟前

    it('应该检测到玩家最新入榜成绩', () => {
      const records = [
        createGameRecord({ finalScore: 1500, timestamp: recentTimestamp }),
        createGameRecord({ finalScore: 1000, timestamp: oldTimestamp }),
        createGameRecord({ finalScore: 800, timestamp: oldTimestamp })
      ];

      const result = LeaderboardSimplifier.detectPlayerNewEntry(records, recentTimestamp);

      expect(result).not.toBeNull();
      expect(result?.finalScore).toBe(1500);
      expect(result?.timestamp).toBe(recentTimestamp);
    });

    it('应该使用gameStartTime进行匹配', () => {
      const records = [
        createGameRecord({ 
          finalScore: 1500, 
          timestamp: now,
          gameStartTime: recentTimestamp 
        })
      ];

      const result = LeaderboardSimplifier.detectPlayerNewEntry(records, recentTimestamp);

      expect(result).not.toBeNull();
      expect(result?.finalScore).toBe(1500);
    });

    it('应该忽略超过时间阈值的成绩', () => {
      const records = [
        createGameRecord({ finalScore: 1500, timestamp: oldTimestamp })
      ];

      const result = LeaderboardSimplifier.detectPlayerNewEntry(records, oldTimestamp);

      expect(result).toBeNull();
    });

    it('应该忽略不在前5名的成绩', () => {
      const records = Array.from({ length: 10 }, (_, i) => 
        createGameRecord({ 
          finalScore: 2000 - i * 100,
          timestamp: i === 9 ? recentTimestamp : oldTimestamp
        })
      );

      const result = LeaderboardSimplifier.detectPlayerNewEntry(records, recentTimestamp);

      expect(result).toBeNull();
    });

    it('应该处理null和undefined输入', () => {
      const records = [createGameRecord({ finalScore: 1000 })];

      expect(LeaderboardSimplifier.detectPlayerNewEntry(records, null)).toBeNull();
      expect(LeaderboardSimplifier.detectPlayerNewEntry([], recentTimestamp)).toBeNull();
      expect(LeaderboardSimplifier.detectPlayerNewEntry(null as any, recentTimestamp)).toBeNull();
    });

    it('应该使用自定义时间阈值', () => {
      const customThreshold = 1 * 60 * 1000; // 1分钟
      const records = [
        createGameRecord({ finalScore: 1500, timestamp: recentTimestamp })
      ];

      const result = LeaderboardSimplifier.detectPlayerNewEntry(
        records, 
        recentTimestamp, 
        customThreshold
      );

      expect(result).toBeNull(); // 2分钟前的记录超过了1分钟阈值
    });
  });

  describe('getPlayerRankPosition', () => {
    it('应该返回玩家在榜单中的正确位置', () => {
      const targetRecord = createGameRecord({ finalScore: 800, timestamp: 12345 });
      const records = [
        createGameRecord({ finalScore: 1500, timestamp: 11111 }),
        createGameRecord({ finalScore: 1000, timestamp: 22222 }),
        targetRecord, // 800分，应该排第3
        createGameRecord({ finalScore: 600, timestamp: 33333 })
      ];

      // 先验证unifyLeaderboard的排序结果
      const unified = LeaderboardSimplifier.unifyLeaderboard(records);
      expect(unified[0].finalScore).toBe(1500);
      expect(unified[1].finalScore).toBe(1000);
      expect(unified[2].finalScore).toBe(800);
      expect(unified[3].finalScore).toBe(600);

      const result = LeaderboardSimplifier.getPlayerRankPosition(records, targetRecord);

      expect(result).toBe(3); // 第3名（从1开始计数）
    });

    it('应该通过gameStartTime匹配记录', () => {
      const gameStartTime = 54321;
      const targetRecord = createGameRecord({ 
        finalScore: 800, 
        timestamp: 12345,
        gameStartTime 
      });
      const records = [
        createGameRecord({ finalScore: 1000 }),
        createGameRecord({ 
          finalScore: 800, 
          timestamp: 99999, // 不同的timestamp
          gameStartTime // 但相同的gameStartTime
        })
      ];

      const result = LeaderboardSimplifier.getPlayerRankPosition(records, targetRecord);

      expect(result).toBe(2);
    });

    it('应该在找不到记录时返回-1', () => {
      const targetRecord = createGameRecord({ finalScore: 800, timestamp: 99999 }); // 不存在的timestamp
      const records = [
        createGameRecord({ finalScore: 1000, timestamp: 11111 }),
        createGameRecord({ finalScore: 600, timestamp: 22222 })
      ];

      const result = LeaderboardSimplifier.getPlayerRankPosition(records, targetRecord);

      expect(result).toBe(-1);
    });

    it('应该处理空记录数组', () => {
      const targetRecord = createGameRecord({ finalScore: 800 });
      const result = LeaderboardSimplifier.getPlayerRankPosition([], targetRecord);

      expect(result).toBe(-1);
    });
  });

  describe('processSimplifiedLeaderboard', () => {
    it('应该返回完整的简化榜单数据', () => {
      const now = Date.now();
      const recentTimestamp = now - 2 * 60 * 1000;
      const records = Array.from({ length: 10 }, (_, i) => 
        createGameRecord({ 
          finalScore: 2000 - i * 100,
          timestamp: i === 0 ? recentTimestamp : now - 10 * 60 * 1000
        })
      );

      const result = LeaderboardSimplifier.processSimplifiedLeaderboard(records, recentTimestamp);

      expect(result.top5Records).toHaveLength(5);
      expect(result.top5Records[0].finalScore).toBe(2000);
      expect(result.playerNewEntry).not.toBeNull();
      expect(result.playerNewEntry?.finalScore).toBe(2000);
      expect(result.totalRecords).toBe(10);
      expect(result.lastUpdated).toBeGreaterThanOrEqual(now);
    });

    it('应该处理没有新入榜成绩的情况', () => {
      const records = [
        createGameRecord({ finalScore: 1000 }),
        createGameRecord({ finalScore: 800 })
      ];

      const result = LeaderboardSimplifier.processSimplifiedLeaderboard(records);

      expect(result.top5Records).toHaveLength(2);
      expect(result.playerNewEntry).toBeNull();
      expect(result.totalRecords).toBe(2);
    });
  });

  describe('formatTime', () => {
    it('应该正确格式化时间', () => {
      expect(LeaderboardSimplifier.formatTime(65)).toBe('01:05');
      expect(LeaderboardSimplifier.formatTime(120)).toBe('02:00');
      expect(LeaderboardSimplifier.formatTime(0)).toBe('00:00');
      expect(LeaderboardSimplifier.formatTime(599)).toBe('09:59');
    });

    it('应该处理小数秒数', () => {
      expect(LeaderboardSimplifier.formatTime(65.7)).toBe('01:05');
      expect(LeaderboardSimplifier.formatTime(59.9)).toBe('00:59');
    });

    it('应该处理大于10分钟的时间', () => {
      expect(LeaderboardSimplifier.formatTime(661)).toBe('11:01');
      expect(LeaderboardSimplifier.formatTime(3599)).toBe('59:59');
    });
  });

  describe('formatScore', () => {
    it('应该正确格式化分数', () => {
      expect(LeaderboardSimplifier.formatScore(1000)).toBe('1,000');
      expect(LeaderboardSimplifier.formatScore(1234567)).toBe('1,234,567');
      expect(LeaderboardSimplifier.formatScore(0)).toBe('0');
      expect(LeaderboardSimplifier.formatScore(999)).toBe('999');
    });

    it('应该处理负数', () => {
      expect(LeaderboardSimplifier.formatScore(-1000)).toBe('-1,000');
    });

    it('应该处理小数', () => {
      expect(LeaderboardSimplifier.formatScore(1000.5)).toBe('1,000.5');
    });
  });

  describe('getRankIcon', () => {
    it('应该返回正确的排名图标', () => {
      expect(LeaderboardSimplifier.getRankIcon(1)).toBe('🥇');
      expect(LeaderboardSimplifier.getRankIcon(2)).toBe('🥈');
      expect(LeaderboardSimplifier.getRankIcon(3)).toBe('🥉');
      expect(LeaderboardSimplifier.getRankIcon(4)).toBe('4');
      expect(LeaderboardSimplifier.getRankIcon(10)).toBe('10');
    });

    it('应该处理边界值', () => {
      expect(LeaderboardSimplifier.getRankIcon(0)).toBe('0');
      expect(LeaderboardSimplifier.getRankIcon(-1)).toBe('-1');
    });
  });

  describe('getSpeedRankings (已弃用)', () => {
    it('应该返回空的Map', () => {
      const records = [createGameRecord({ totalDuration: 30 })];
      const result = LeaderboardSimplifier.getSpeedRankings(records);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('getSpeedRankText (已弃用)', () => {
    it('应该返回空字符串', () => {
      expect(LeaderboardSimplifier.getSpeedRankText(1)).toBe('');
      expect(LeaderboardSimplifier.getSpeedRankText(5)).toBe('');
    });
  });

  describe('getSpeedBonus', () => {
    it('应该根据完成时间返回正确的速度奖励', () => {
      expect(LeaderboardSimplifier.getSpeedBonus(5)).toBe(400);   // 10秒内
      expect(LeaderboardSimplifier.getSpeedBonus(10)).toBe(400);  // 正好10秒
      expect(LeaderboardSimplifier.getSpeedBonus(25)).toBe(200);  // 30秒内
      expect(LeaderboardSimplifier.getSpeedBonus(30)).toBe(200);  // 正好30秒
      expect(LeaderboardSimplifier.getSpeedBonus(45)).toBe(100);  // 1分钟内
      expect(LeaderboardSimplifier.getSpeedBonus(60)).toBe(100);  // 正好1分钟
      expect(LeaderboardSimplifier.getSpeedBonus(75)).toBe(50);   // 1分30秒内
      expect(LeaderboardSimplifier.getSpeedBonus(90)).toBe(50);   // 正好1分30秒
      expect(LeaderboardSimplifier.getSpeedBonus(105)).toBe(10);  // 2分钟内
      expect(LeaderboardSimplifier.getSpeedBonus(120)).toBe(10);  // 正好2分钟
      expect(LeaderboardSimplifier.getSpeedBonus(150)).toBe(0);   // 超过2分钟
    });

    it('应该处理边界值', () => {
      expect(LeaderboardSimplifier.getSpeedBonus(0)).toBe(400);
      expect(LeaderboardSimplifier.getSpeedBonus(10.1)).toBe(200);
      expect(LeaderboardSimplifier.getSpeedBonus(30.1)).toBe(100);
      expect(LeaderboardSimplifier.getSpeedBonus(60.1)).toBe(50);
      expect(LeaderboardSimplifier.getSpeedBonus(90.1)).toBe(10);
      expect(LeaderboardSimplifier.getSpeedBonus(120.1)).toBe(0);
    });

    it('应该处理负数和异常值', () => {
      expect(LeaderboardSimplifier.getSpeedBonus(-1)).toBe(400);
      expect(LeaderboardSimplifier.getSpeedBonus(NaN)).toBe(0);
      expect(LeaderboardSimplifier.getSpeedBonus(Infinity)).toBe(0);
    });
  });

  // 集成测试
  describe('集成测试', () => {
    it('应该正确处理完整的排行榜流程', () => {
      const now = Date.now();
      const recentTimestamp = now - 2 * 60 * 1000;
      
      // 创建混合的游戏记录，确保timestamp唯一
      const records = [
        createGameRecord({ finalScore: 2000, timestamp: now - 10 * 60 * 1000 }),
        createGameRecord({ finalScore: 1800, timestamp: recentTimestamp }), // 新入榜
        createGameRecord({ finalScore: 1500, timestamp: now - 15 * 60 * 1000 }),
        createGameRecord({ finalScore: 1200, timestamp: now - 20 * 60 * 1000 }),
        createGameRecord({ finalScore: 1000, timestamp: now - 25 * 60 * 1000 }),
        createGameRecord({ finalScore: 800, timestamp: now - 30 * 60 * 1000 }),
        createGameRecord({ finalScore: 600, timestamp: now - 35 * 60 * 1000 })
      ];

      // 处理简化榜单
      const result = LeaderboardSimplifier.processSimplifiedLeaderboard(records, recentTimestamp);

      // 验证前5名
      expect(result.top5Records).toHaveLength(5);
      expect(result.top5Records[0].finalScore).toBe(2000);
      expect(result.top5Records[1].finalScore).toBe(1800);
      expect(result.top5Records[4].finalScore).toBe(1000);

      // 验证新入榜检测
      expect(result.playerNewEntry).not.toBeNull();
      expect(result.playerNewEntry?.finalScore).toBe(1800);
      expect(result.playerNewEntry?.timestamp).toBe(recentTimestamp);

      // 验证排名位置 - 1800分应该排第2名
      const playerRank = LeaderboardSimplifier.getPlayerRankPosition(records, result.playerNewEntry!);
      expect(playerRank).toBe(2);

      // 验证格式化功能
      expect(LeaderboardSimplifier.formatScore(result.playerNewEntry!.finalScore)).toBe('1,800');
      expect(LeaderboardSimplifier.formatTime(result.playerNewEntry!.totalDuration)).toBe('01:00');
      expect(LeaderboardSimplifier.getRankIcon(playerRank)).toBe('🥈');
    });

    it('应该处理边缘情况的组合', () => {
      // 测试空记录、无效记录、边界时间等组合情况
      const records = [
        null as any,
        createGameRecord({ finalScore: undefined as any }),
        createGameRecord({ finalScore: 1000, timestamp: Date.now() - 10 * 60 * 1000 })
      ];

      const result = LeaderboardSimplifier.processSimplifiedLeaderboard(records, null);

      expect(result.top5Records).toHaveLength(1);
      expect(result.playerNewEntry).toBeNull();
      expect(result.totalRecords).toBe(3); // 包含无效记录的总数
    });
  });
});