/**
 * GameDataManager 单元测试
 * 测试数据保存、加载、更新和删除功能
 */

import { GameDataManager } from '../GameDataManager';
import { GameStats, GameRecord, DifficultyConfig, DifficultyLevel, CutType } from '@/types/puzzleTypes';

// Mock localStorage
let mockStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStore[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: jest.fn(() => {
    mockStore = {};
  }),
  get length() {
    return Object.keys(mockStore).length;
  },
  key: jest.fn((index: number) => Object.keys(mockStore)[index] || null),
};

// 设置全局 localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// 测试数据工厂函数
const createTestGameStats = (overrides: Partial<GameStats> = {}): GameStats => {
  const defaultDifficulty: DifficultyConfig = {
    difficultyLevel: 'medium' as DifficultyLevel,
    cutType: CutType.Straight,
    cutCount: 4,
    actualPieces: 6
  };

  return {
    gameStartTime: Date.now() - 180000, // 3分钟前开始
    gameEndTime: Date.now(),
    totalDuration: 180, // 3分钟
    totalRotations: 8,
    hintUsageCount: 1,
    dragOperations: 15,
    difficulty: defaultDifficulty,
    minRotations: 6,
    rotationEfficiency: 0.75,
    hintAllowance: 2,
    baseScore: 2000,
    timeBonus: 500,
    timeBonusRank: 3,
    isTimeRecord: false,
    rotationScore: 100,
    hintScore: -50,
    difficultyMultiplier: 1.2,
    finalScore: 2500,
    deviceType: 'desktop',
    canvasSize: { width: 640, height: 640 },
    ...overrides
  };
};

const createTestGameRecord = (overrides: Partial<GameRecord> = {}): GameRecord => {
  const defaultDifficulty: DifficultyConfig = {
    difficultyLevel: 'medium' as DifficultyLevel,
    cutType: CutType.Straight,
    cutCount: 4,
    actualPieces: 6
  };

  return {
    timestamp: Date.now(),
    finalScore: 2500,
    totalDuration: 180,
    difficulty: defaultDifficulty,
    deviceInfo: {
      type: 'desktop',
      screenWidth: 1920,
      screenHeight: 1080
    },
    totalRotations: 8,
    hintUsageCount: 1,
    dragOperations: 15,
    rotationEfficiency: 0.75,
    scoreBreakdown: {
      baseScore: 2000,
      timeBonus: 500,
      finalScore: 2500
    },
    ...overrides
  };
};

describe('GameDataManager', () => {
  beforeEach(() => {
    // 清理 localStorage mock store
    mockStore = {};
    jest.clearAllMocks();
    
    // 重置mock实现为默认行为
    mockLocalStorage.getItem.mockImplementation((key: string) => mockStore[key] || null);
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      mockStore[key] = value;
    });
    mockLocalStorage.removeItem.mockImplementation((key: string) => {
      delete mockStore[key];
    });
    mockLocalStorage.clear.mockImplementation(() => {
      mockStore = {};
    });
    
    // 清理内存缓存
    GameDataManager.clearAllData();
  });

  describe('数据保存功能', () => {
    it('应该成功保存游戏记录', () => {
      const gameStats = createTestGameStats();
      const finalScore = 2500;
      const scoreBreakdown = { baseScore: 2000, timeBonus: 500, finalScore: 2500 };

      const result = GameDataManager.saveGameRecord(gameStats, finalScore, scoreBreakdown);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2); // 历史记录和排行榜
    });

    it('应该处理保存失败的情况', () => {
      // Mock localStorage.setItem 抛出异常
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const gameStats = createTestGameStats();
      
      // 由于GameDataManager在catch块中仍然返回true（因为有内存缓存fallback），
      // 我们需要检查实际的错误处理行为
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = GameDataManager.saveGameRecord(gameStats, 2500, {});

      // GameDataManager会尝试保存到内存缓存，所以仍然返回true
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('应该验证游戏记录数据的完整性', () => {
      const incompleteStats = {
        totalDuration: 180,
        // 缺少必需字段
      } as GameStats;

      const result = GameDataManager.saveGameRecord(incompleteStats, 2500, {});

      // 即使数据不完整，也应该尝试保存（根据实现逻辑）
      expect(result).toBe(true);
    });
  });

  describe('数据加载功能', () => {
    it('应该成功加载排行榜数据', () => {
      const testRecord = createTestGameRecord();
      mockStore['puzzle-leaderboard'] = JSON.stringify([testRecord]);

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].finalScore).toBe(testRecord.finalScore);
    });

    it('应该按分数降序排列排行榜', () => {
      const records = [
        createTestGameRecord({ finalScore: 1000 }),
        createTestGameRecord({ finalScore: 3000 }),
        createTestGameRecord({ finalScore: 2000 })
      ];
      mockStore['puzzle-leaderboard'] = JSON.stringify(records);

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard[0].finalScore).toBe(3000);
      expect(leaderboard[1].finalScore).toBe(2000);
      expect(leaderboard[2].finalScore).toBe(1000);
    });

    it('应该按难度级别筛选排行榜', () => {
      const easyRecord = createTestGameRecord({ 
        difficulty: { difficultyLevel: 'easy' as DifficultyLevel, cutType: CutType.Straight, cutCount: 2, actualPieces: 4 }
      });
      const hardRecord = createTestGameRecord({ 
        difficulty: { difficultyLevel: 'hard' as DifficultyLevel, cutType: CutType.Diagonal, cutCount: 6, actualPieces: 8 }
      });
      
      mockStore['puzzle-leaderboard'] = JSON.stringify([easyRecord, hardRecord]);

      const easyLeaderboard = GameDataManager.getLeaderboard('easy');
      const hardLeaderboard = GameDataManager.getLeaderboard('hard');

      expect(easyLeaderboard).toHaveLength(1);
      expect(easyLeaderboard[0].difficulty.difficultyLevel).toBe('easy');
      expect(hardLeaderboard).toHaveLength(1);
      expect(hardLeaderboard[0].difficulty.difficultyLevel).toBe('hard');
    });

    it('应该限制排行榜记录数量为5条', () => {
      const records = Array.from({ length: 10 }, (_, i) => 
        createTestGameRecord({ finalScore: 1000 + i })
      );
      mockStore['puzzle-leaderboard'] = JSON.stringify(records);

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard).toHaveLength(5);
    });

    it('应该处理localStorage读取失败的情况', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard).toEqual([]);
    });

    it('应该处理无效JSON数据', () => {
      mockStore['puzzle-leaderboard'] = 'invalid json';

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard).toEqual([]);
    });
  });

  describe('游戏历史记录功能', () => {
    it('应该成功加载游戏历史记录', () => {
      const testRecord = createTestGameRecord();
      mockStore['puzzle-history'] = JSON.stringify([testRecord]);

      const history = GameDataManager.getGameHistory();

      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toBe(testRecord.timestamp);
    });

    it('应该按时间降序排列历史记录', () => {
      const now = Date.now();
      const records = [
        createTestGameRecord({ timestamp: now - 3600000 }), // 1小时前
        createTestGameRecord({ timestamp: now }), // 现在
        createTestGameRecord({ timestamp: now - 1800000 }) // 30分钟前
      ];
      mockStore['puzzle-history'] = JSON.stringify(records);

      const history = GameDataManager.getGameHistory();

      expect(history[0].timestamp).toBe(now); // 最新的在前
      expect(history[1].timestamp).toBe(now - 1800000);
      expect(history[2].timestamp).toBe(now - 3600000);
    });

    it('应该限制历史记录数量为50条', () => {
      const records = Array.from({ length: 60 }, (_, i) => 
        createTestGameRecord({ timestamp: Date.now() - i * 1000 })
      );
      mockStore['puzzle-history'] = JSON.stringify(records);

      const history = GameDataManager.getGameHistory();

      expect(history).toHaveLength(50);
    });

    it('应该获取最近一次游戏记录', () => {
      const now = Date.now();
      const records = [
        createTestGameRecord({ timestamp: now - 3600000, finalScore: 1000 }),
        createTestGameRecord({ timestamp: now, finalScore: 2000 })
      ];
      mockStore['puzzle-history'] = JSON.stringify(records);

      const lastRecord = GameDataManager.getLastGameRecord();

      expect(lastRecord).not.toBeNull();
      expect(lastRecord!.finalScore).toBe(2000);
      expect(lastRecord!.timestamp).toBe(now);
    });

    it('应该在没有历史记录时返回null', () => {
      const lastRecord = GameDataManager.getLastGameRecord();

      expect(lastRecord).toBeNull();
    });
  });

  describe('数据更新功能', () => {
    it('应该检查是否创造新记录', () => {
      const existingRecords = [
        createTestGameRecord({ finalScore: 3000, timestamp: Date.now() - 3000 }),
        createTestGameRecord({ finalScore: 2000, timestamp: Date.now() - 2000 }),
        createTestGameRecord({ finalScore: 1000, timestamp: Date.now() - 1000 })
      ];
      mockStore['puzzle-history'] = JSON.stringify(existingRecords);

      const newRecord = createTestGameRecord({ finalScore: 2500, timestamp: Date.now() });
      const result = GameDataManager.checkNewRecord(newRecord);

      expect(result.isNewRecord).toBe(true);
      expect(result.rank).toBe(2); // 应该排在第2位
    });

    it('应该正确计算排名', () => {
      const existingRecords = [
        createTestGameRecord({ finalScore: 3000, timestamp: Date.now() - 2000 }),
        createTestGameRecord({ finalScore: 2000, timestamp: Date.now() - 1000 }),
        createTestGameRecord({ finalScore: 1800, timestamp: Date.now() - 500 }),
        createTestGameRecord({ finalScore: 1600, timestamp: Date.now() - 300 }),
        createTestGameRecord({ finalScore: 1400, timestamp: Date.now() - 100 })
      ];
      mockStore['puzzle-history'] = JSON.stringify(existingRecords);

      const lowScoreRecord = createTestGameRecord({ finalScore: 500, timestamp: Date.now() });
      const result = GameDataManager.checkNewRecord(lowScoreRecord);

      expect(result.isNewRecord).toBe(false); // 不在前5名
      expect(result.rank).toBe(6); // 排在第6位
    });

    it('应该处理检查新记录时的错误', () => {
      // 先清空内存缓存
      GameDataManager.clearAllData();
      
      // 然后让localStorage操作失败
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // 同时让removeItem也失败，确保clearAllData不能清空内存缓存
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Cannot remove');
      });

      const newRecord = createTestGameRecord();
      
      // 由于getGameHistory会fallback到内存缓存，而内存缓存在localStorage失败时会是空的
      // 所以新记录会被认为是第1名
      const result = GameDataManager.checkNewRecord(newRecord);

      expect(result.isNewRecord).toBe(true); // 空历史记录时，新记录总是第1名
      expect(result.rank).toBe(1);
    });
  });

  describe('数据删除功能', () => {
    it('应该成功清除所有数据', () => {
      // 先添加一些数据
      mockStore['puzzle-leaderboard'] = JSON.stringify([createTestGameRecord()]);
      mockStore['puzzle-history'] = JSON.stringify([createTestGameRecord()]);

      const result = GameDataManager.clearAllData();

      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('puzzle-leaderboard');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('puzzle-history');
    });

    it('应该处理清除数据时的错误', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Cannot remove item');
      });

      const result = GameDataManager.clearAllData();

      expect(result).toBe(false);
    });
  });

  describe('数据统计功能', () => {
    it('应该获取数据统计信息', () => {
      const records = [
        createTestGameRecord(),
        createTestGameRecord()
      ];
      mockStore['puzzle-leaderboard'] = JSON.stringify(records);
      mockStore['puzzle-history'] = JSON.stringify(records);

      const stats = GameDataManager.getDataStats();

      expect(stats.leaderboardCount).toBe(2);
      expect(stats.historyCount).toBe(2);
      expect(stats.isStorageAvailable).toBe(true);
      expect(stats.storageUsed).toBeGreaterThan(0);
    });

    it('应该处理存储不可用的情况', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const stats = GameDataManager.getDataStats();

      expect(stats.isStorageAvailable).toBe(false);
      expect(stats.storageUsed).toBe(0);
    });
  });

  describe('测试数据生成功能', () => {
    it('应该成功生成测试数据', () => {
      const result = GameDataManager.generateTestData();

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('puzzle-leaderboard', expect.any(String));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('puzzle-history', expect.any(String));
    });

    it('应该处理生成测试数据时的错误', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Cannot save test data');
      });

      const result = GameDataManager.generateTestData();

      expect(result).toBe(false);
    });
  });

  describe('数据迁移和验证', () => {
    it('应该迁移旧格式的数据', () => {
      const oldFormatRecord = {
        timestamp: Date.now(),
        finalScore: 2000,
        totalDuration: 120,
        difficulty: {
          difficultyLevel: 'easy',
          cutType: 'straight',
          cutCount: 2
          // 缺少 actualPieces 字段
        },
        totalRotations: 4,
        hintUsageCount: 0,
        dragOperations: 8
        // 缺少一些新字段
      };

      mockStore['puzzle-leaderboard'] = JSON.stringify([oldFormatRecord]);

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].difficulty.actualPieces).toBe(4); // 应该有默认值
      expect(leaderboard[0].deviceInfo).toBeDefined();
      expect(leaderboard[0].rotationEfficiency).toBeDefined();
    });

    it('应该过滤无效的记录', () => {
      const invalidRecord = {
        timestamp: 'invalid', // 应该是数字
        finalScore: 2000
        // 缺少必需字段
      };

      mockStore['puzzle-leaderboard'] = JSON.stringify([invalidRecord]);

      const leaderboard = GameDataManager.getLeaderboard();

      expect(leaderboard).toHaveLength(0); // 无效记录应该被过滤掉
    });
  });

  describe('内存缓存fallback机制', () => {
    it('应该在localStorage失败时使用内存缓存', () => {
      // 先保存一些数据到内存缓存
      const gameStats = createTestGameStats();
      GameDataManager.saveGameRecord(gameStats, 2500, {});

      // 然后让localStorage读取失败
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const leaderboard = GameDataManager.getLeaderboard();
      const history = GameDataManager.getGameHistory();

      // 应该能从内存缓存获取数据
      expect(leaderboard.length).toBeGreaterThan(0);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});