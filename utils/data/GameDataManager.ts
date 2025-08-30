/**
 * 游戏数据管理器
 * 负责本地存储的读写操作、数据验证和错误处理
 */

import { GameRecord, GameStats, DifficultyLevel, DifficultyConfig, CutType } from '@/types/puzzleTypes';

export class GameDataManager {
  private static readonly LEADERBOARD_KEY = 'puzzle-leaderboard';
  private static readonly GAME_HISTORY_KEY = 'puzzle-history';
  private static readonly MAX_LEADERBOARD_RECORDS = 5;
  private static readonly MAX_HISTORY_RECORDS = 50;

  // 内存缓存作为fallback
  private static memoryLeaderboard: GameRecord[] = [];
  private static memoryHistory: GameRecord[] = [];

  /**
   * 迁移旧数据格式到新格式
   */
  private static migrateGameRecord(record: any): GameRecord {
    // 确保 difficulty 对象存在且包含所有必需字段
    const cutTypeValue = record.difficulty?.cutType || 'straight';
    const difficulty: DifficultyConfig = {
      difficultyLevel: (record.difficulty?.difficultyLevel || 'medium') as DifficultyLevel,
      cutType: cutTypeValue === 'straight' ? CutType.Straight : CutType.Diagonal,
      cutCount: record.difficulty?.cutCount || 2,
      actualPieces: record.difficulty?.actualPieces || 4
    };

    const migratedRecord: GameRecord = {
      timestamp: record.timestamp || Date.now(),
      finalScore: record.finalScore || 0,
      totalDuration: record.totalDuration || 0,
      difficulty,
      deviceInfo: record.deviceInfo || {
        type: 'desktop',
        screenWidth: 1024,
        screenHeight: 768
      },
      totalRotations: record.totalRotations || 0,
      hintUsageCount: record.hintUsageCount || 0,
      dragOperations: record.dragOperations || 0,
      rotationEfficiency: record.rotationEfficiency || 1.0,
      scoreBreakdown: record.scoreBreakdown || {},
      gameStartTime: record.gameStartTime,
      id: record.id
    };

    return migratedRecord;
  }

  /**
   * 保存游戏记录
   */
  static saveGameRecord(gameStats: GameStats, finalScore: number, scoreBreakdown: any): boolean {
    try {
      console.log('[GameDataManager] 开始保存游戏记录:', { gameStats, finalScore, scoreBreakdown });
      
      const record: GameRecord = {
        timestamp: Date.now(),
        finalScore,
        totalDuration: gameStats.totalDuration, // 已经是秒
        difficulty: gameStats.difficulty,
        deviceInfo: {
          type: gameStats.deviceType || 'desktop',
          screenWidth: gameStats.canvasSize?.width || 1024,
          screenHeight: gameStats.canvasSize?.height || 768
        },
        totalRotations: gameStats.totalRotations,
        hintUsageCount: gameStats.hintUsageCount,
        dragOperations: gameStats.dragOperations,
        rotationEfficiency: gameStats.rotationEfficiency,
        scoreBreakdown
      };

      console.log('[GameDataManager] 创建的记录:', record);

      // 验证记录数据
      if (!this.validateGameRecord(record)) {
        console.warn('[GameDataManager] 无效的游戏记录数据，但仍尝试保存');
      }

      // 保存到历史记录
      this.addToHistory(record);

      // 更新排行榜
      this.updateLeaderboard(record);

      console.log('[GameDataManager] 游戏记录保存成功');
      return true;
    } catch (error) {
      console.error('[GameDataManager] 保存游戏记录失败:', error);
      return false;
    }
  }

  /**
   * 获取排行榜数据
   */
  static getLeaderboard(difficulty?: DifficultyLevel): GameRecord[] {
    try {
      const stored = localStorage.getItem(this.LEADERBOARD_KEY);
      let leaderboard: GameRecord[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // 迁移旧数据格式
          const migratedRecords = parsed.map(record => this.migrateGameRecord(record));
          leaderboard = migratedRecords.filter(record => this.validateGameRecord(record));
        }
      }

      // 如果本地存储失败，使用内存缓存
      if (leaderboard.length === 0 && this.memoryLeaderboard.length > 0) {
        leaderboard = this.memoryLeaderboard;
      }

      // 按分数排序
      leaderboard.sort((a, b) => b.finalScore - a.finalScore);

      // 按难度筛选
      if (difficulty) {
        leaderboard = leaderboard.filter(record => record.difficulty.difficultyLevel === difficulty);
      }

      return leaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
    } catch (error) {
      console.error('[GameDataManager] 获取排行榜失败:', error);
      return this.memoryLeaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
    }
  }

  /**
   * 获取游戏历史记录
   */
  static getGameHistory(): GameRecord[] {
    try {
      const stored = localStorage.getItem(this.GAME_HISTORY_KEY);
      let history: GameRecord[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // 迁移旧数据格式
          const migratedRecords = parsed.map(record => this.migrateGameRecord(record));
          history = migratedRecords.filter(record => this.validateGameRecord(record));
        }
      }

      // 如果本地存储失败，使用内存缓存
      if (history.length === 0 && this.memoryHistory.length > 0) {
        history = this.memoryHistory;
      }

      // 按时间排序（最新的在前）
      history.sort((a, b) => b.timestamp - a.timestamp);

      return history.slice(0, this.MAX_HISTORY_RECORDS);
    } catch (error) {
      console.error('[GameDataManager] 获取游戏历史失败:', error);
      return this.memoryHistory.slice(0, this.MAX_HISTORY_RECORDS);
    }
  }

  /**
   * 获取最近一次游戏记录
   */
  static getLastGameRecord(): GameRecord | null {
    try {
      const history = this.getGameHistory();
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      console.error('[GameDataManager] 获取最近游戏记录失败:', error);
      return null;
    }
  }

  /**
   * 检查是否创造新记录
   */
  static checkNewRecord(record: GameRecord): { isNewRecord: boolean; rank: number } {
    try {
      // 获取所有历史记录（不限制数量）来计算准确排名
      const allHistoryRecords = this.getGameHistory();
      
      // 将新记录加入并按分数排序
      const allRecords = [...allHistoryRecords, record].sort((a, b) => b.finalScore - a.finalScore);
      const rank = allRecords.findIndex(r => r.timestamp === record.timestamp) + 1;
      
      // 检查是否进入前5名
      const isNewRecord = rank <= this.MAX_LEADERBOARD_RECORDS;
      
      return { isNewRecord, rank };
    } catch (error) {
      console.error('[GameDataManager] 检查新记录失败:', error);
      return { isNewRecord: false, rank: 999 };
    }
  }

  /**
   * 清除所有数据
   */
  static clearAllData(): boolean {
    try {
      localStorage.removeItem(this.LEADERBOARD_KEY);
      localStorage.removeItem(this.GAME_HISTORY_KEY);
      this.memoryLeaderboard = [];
      this.memoryHistory = [];
      return true;
    } catch (error) {
      console.error('[GameDataManager] 清除数据失败:', error);
      return false;
    }
  }

  /**
   * 添加到历史记录
   */
  private static addToHistory(record: GameRecord): void {
    try {
      let history = this.getGameHistory();
      
      // 添加新记录
      history.unshift(record);
      
      // 限制记录数量
      history = history.slice(0, this.MAX_HISTORY_RECORDS);
      
      // 保存到本地存储
      localStorage.setItem(this.GAME_HISTORY_KEY, JSON.stringify(history));
      
      // 更新内存缓存
      this.memoryHistory = history;
    } catch (error) {
      console.error('[GameDataManager] 添加历史记录失败:', error);
      // 至少保存到内存
      this.memoryHistory.unshift(record);
      this.memoryHistory = this.memoryHistory.slice(0, this.MAX_HISTORY_RECORDS);
    }
  }

  /**
   * 更新排行榜
   */
  private static updateLeaderboard(record: GameRecord): void {
    try {
      let leaderboard = this.getLeaderboard();
      
      // 添加新记录
      leaderboard.push(record);
      
      // 按分数排序
      leaderboard.sort((a, b) => b.finalScore - a.finalScore);
      
      // 限制记录数量
      leaderboard = leaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
      
      // 保存到本地存储
      localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
      
      // 更新内存缓存
      this.memoryLeaderboard = leaderboard;
    } catch (error) {
      console.error('[GameDataManager] 更新排行榜失败:', error);
      // 至少保存到内存
      this.memoryLeaderboard.push(record);
      this.memoryLeaderboard.sort((a, b) => b.finalScore - a.finalScore);
      this.memoryLeaderboard = this.memoryLeaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
    }
  }

  /**
   * 验证游戏记录数据
   */
  private static validateGameRecord(record: any): record is GameRecord {
    if (!record || typeof record !== 'object') {
      console.warn('[GameDataManager] 记录不是对象:', record);
      return false;
    }

    // 检查必需字段
    const requiredFields = [
      'timestamp', 'finalScore', 'totalDuration', 'difficulty',
      'totalRotations', 'hintUsageCount', 'dragOperations'
    ];

    for (const field of requiredFields) {
      if (!(field in record)) {
        console.warn(`[GameDataManager] 缺少必需字段: ${field}`, record);
        return false;
      }
    }

    // 检查数据类型
    if (typeof record.timestamp !== 'number' ||
        typeof record.finalScore !== 'number' ||
        typeof record.totalDuration !== 'number' ||
        typeof record.totalRotations !== 'number' ||
        typeof record.hintUsageCount !== 'number' ||
        typeof record.dragOperations !== 'number') {
      console.warn('[GameDataManager] 数据类型不正确:', {
        timestamp: typeof record.timestamp,
        finalScore: typeof record.finalScore,
        totalDuration: typeof record.totalDuration,
        totalRotations: typeof record.totalRotations,
        hintUsageCount: typeof record.hintUsageCount,
        dragOperations: typeof record.dragOperations
      });
      return false;
    }

    // 检查难度信息（放宽验证）
    if (!record.difficulty || typeof record.difficulty !== 'object') {
      console.warn('[GameDataManager] 难度信息无效:', record.difficulty);
      return false;
    }

    // 基本验证通过
    return true;
  }

  /**
   * 获取数据统计信息
   */
  static getDataStats(): {
    leaderboardCount: number;
    historyCount: number;
    storageUsed: number;
    isStorageAvailable: boolean;
  } {
    try {
      const leaderboard = this.getLeaderboard();
      const history = this.getGameHistory();
      
      let storageUsed = 0;
      let isStorageAvailable = true;
      
      try {
        const leaderboardData = localStorage.getItem(this.LEADERBOARD_KEY) || '';
        const historyData = localStorage.getItem(this.GAME_HISTORY_KEY) || '';
        storageUsed = (leaderboardData.length + historyData.length) * 2; // 估算字节数
      } catch {
        isStorageAvailable = false;
      }

      return {
        leaderboardCount: leaderboard.length,
        historyCount: history.length,
        storageUsed,
        isStorageAvailable
      };
    } catch (error) {
      console.error('[GameDataManager] 获取数据统计失败:', error);
      return {
        leaderboardCount: 0,
        historyCount: 0,
        storageUsed: 0,
        isStorageAvailable: false
      };
    }
  }

  /**
   * 生成测试数据（开发用）
   */
  static generateTestData(): boolean {
    try {
      const testRecords = [
        {
          timestamp: Date.now() - 3600000, // 1小时前
          finalScore: 2500,
          totalDuration: 180, // 3分钟
          difficulty: { difficultyLevel: 'medium' as DifficultyLevel, cutType: CutType.Straight, cutCount: 4, actualPieces: 6 },
          deviceInfo: { type: 'desktop', screenWidth: 1920, screenHeight: 1080 },
          totalRotations: 8,
          hintUsageCount: 1,
          dragOperations: 15,
          rotationEfficiency: 0.75,
          scoreBreakdown: { baseScore: 2000, timeBonus: 500, finalScore: 2500 }
        },
        {
          timestamp: Date.now() - 7200000, // 2小时前
          finalScore: 2200,
          totalDuration: 240, // 4分钟
          difficulty: { difficultyLevel: 'hard' as DifficultyLevel, cutType: CutType.Diagonal, cutCount: 6, actualPieces: 8 },
          deviceInfo: { type: 'desktop', screenWidth: 1920, screenHeight: 1080 },
          totalRotations: 12,
          hintUsageCount: 2,
          dragOperations: 20,
          rotationEfficiency: 0.67,
          scoreBreakdown: { baseScore: 1800, timeBonus: 400, finalScore: 2200 }
        },
        {
          timestamp: Date.now() - 10800000, // 3小时前
          finalScore: 1800,
          totalDuration: 120, // 2分钟
          difficulty: { difficultyLevel: 'easy' as DifficultyLevel, cutType: CutType.Straight, cutCount: 2, actualPieces: 4 },
          deviceInfo: { type: 'mobile', screenWidth: 375, screenHeight: 667 },
          totalRotations: 4,
          hintUsageCount: 0,
          dragOperations: 8,
          rotationEfficiency: 1.0,
          scoreBreakdown: { baseScore: 1500, timeBonus: 300, finalScore: 1800 }
        }
      ];

      // 直接保存到localStorage
      localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(testRecords));
      localStorage.setItem(this.GAME_HISTORY_KEY, JSON.stringify(testRecords));
      
      // 更新内存缓存
      this.memoryLeaderboard = testRecords;
      this.memoryHistory = testRecords;

      console.log('[GameDataManager] 测试数据生成成功:', testRecords);
      return true;
    } catch (error) {
      console.error('[GameDataManager] 生成测试数据失败:', error);
      return false;
    }
  }
}