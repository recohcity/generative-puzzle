/**
 * 游戏数据管理器
 * 负责本地存储的读写操作、数据验证和错误处理
 */

import { GameRecord, GameStats, DifficultyLevel, DifficultyConfig, CutType, ScoreBreakdown } from '@generative-puzzle/game-core';
import { STORAGE_KEYS } from '@/utils/storageKeys';

export class GameDataManager {
  private static readonly LEADERBOARD_KEY = STORAGE_KEYS.LEADERBOARD;
  private static readonly GAME_HISTORY_KEY = STORAGE_KEYS.HISTORY;
  private static readonly VISITOR_COUNT_KEY = STORAGE_KEYS.VISITOR_COUNT;
  private static readonly GAME_START_COUNT_KEY = STORAGE_KEYS.GAME_START_COUNT;
  private static readonly MAX_LEADERBOARD_RECORDS = 5;
  private static readonly MAX_HISTORY_RECORDS = 50;

  private static memoryLeaderboard: GameRecord[] = [];
  private static memoryHistory: GameRecord[] = [];

  private static migrateGameRecord(record: any): GameRecord {
    const cutTypeValue = record.difficulty?.cutType || 'straight';
    const difficulty: DifficultyConfig = {
      difficultyLevel: (record.difficulty?.difficultyLevel || 'medium') as DifficultyLevel,
      cutType: cutTypeValue === 'straight' ? CutType.Straight : CutType.Diagonal,
      cutCount: record.difficulty?.cutCount || 2,
      actualPieces: record.difficulty?.actualPieces || 4,
      shapeType: record.difficulty?.shapeType || record.shapeType || undefined
    };

    return {
      timestamp: record.timestamp || Date.now(),
      finalScore: record.finalScore || 0,
      totalDuration: record.totalDuration || 0,
      difficulty,
      deviceInfo: record.deviceInfo || { type: 'desktop', screenWidth: 1024, screenHeight: 768 },
      totalRotations: record.totalRotations || 0,
      hintUsageCount: record.hintUsageCount || 0,
      dragOperations: record.dragOperations || 0,
      rotationEfficiency: record.rotationEfficiency || 1.0,
      scoreBreakdown: record.scoreBreakdown || {},
      gameStartTime: record.gameStartTime,
      id: record.id
    };
  }

  static saveGameRecord(gameStats: GameStats, finalScore: number, scoreBreakdown: ScoreBreakdown | null): boolean {
    try {
      const record: GameRecord = {
        timestamp: Date.now(),
        finalScore,
        totalDuration: gameStats.totalDuration,
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

      if (!this.validateGameRecord(record)) return false;

      this.addToHistory(record);
      this.updateLeaderboard(record);
      return true;
    } catch (error) {
      return false;
    }
  }

  static getLeaderboard(difficulty?: DifficultyLevel): GameRecord[] {
    try {
      const stored = localStorage.getItem(this.LEADERBOARD_KEY);
      let leaderboard: GameRecord[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          leaderboard = parsed.map(record => this.migrateGameRecord(record)).filter(record => this.validateGameRecord(record));
        }
      }

      if (leaderboard.length === 0 && this.memoryLeaderboard.length > 0) leaderboard = this.memoryLeaderboard;
      leaderboard.sort((a, b) => b.finalScore - a.finalScore);
      if (difficulty) leaderboard = leaderboard.filter(record => record.difficulty.difficultyLevel === difficulty);

      return leaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
    } catch (error) {
      return this.memoryLeaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
    }
  }

  static getGameHistory(): GameRecord[] {
    try {
      const stored = localStorage.getItem(this.GAME_HISTORY_KEY);
      let history: GameRecord[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          history = parsed.map(record => this.migrateGameRecord(record)).filter(record => this.validateGameRecord(record));
        }
      }

      if (history.length === 0 && this.memoryHistory.length > 0) history = this.memoryHistory;
      history.sort((a, b) => b.timestamp - a.timestamp);
      return history.slice(0, this.MAX_HISTORY_RECORDS);
    } catch (error) {
      return this.memoryHistory.slice(0, this.MAX_HISTORY_RECORDS);
    }
  }

  static getLastGameRecord(): GameRecord | null {
    const history = this.getGameHistory();
    return history.length > 0 ? history[0] : null;
  }

  static checkNewRecord(record: GameRecord): { isNewRecord: boolean; rank: number } {
    const allHistoryRecords = this.getGameHistory();
    const allRecords = [...allHistoryRecords, record].sort((a, b) => b.finalScore - a.finalScore);
    const rank = allRecords.findIndex(r => r.timestamp === record.timestamp) + 1;
    return { isNewRecord: rank <= this.MAX_LEADERBOARD_RECORDS, rank };
  }

  static clearAllData(): boolean {
    try {
      localStorage.removeItem(this.LEADERBOARD_KEY);
      localStorage.removeItem(this.GAME_HISTORY_KEY);
      this.memoryLeaderboard = [];
      this.memoryHistory = [];
      return true;
    } catch (error) {
      return false;
    }
  }

  private static addToHistory(record: GameRecord): void {
    try {
      let history = this.getGameHistory();
      history.unshift(record);
      history = history.slice(0, this.MAX_HISTORY_RECORDS);
      localStorage.setItem(this.GAME_HISTORY_KEY, JSON.stringify(history));
      this.memoryHistory = history;
    } catch (error) {
      this.memoryHistory.unshift(record);
      this.memoryHistory = this.memoryHistory.slice(0, this.MAX_HISTORY_RECORDS);
    }
  }

  private static updateLeaderboard(record: GameRecord): void {
    try {
      // 1. 获取最新列表（优先使用内存中的，防止同步循环中读取到旧的 localStorage 值）
      let leaderboard = [...this.getLeaderboard()];
      
      // 2. 生成核心业绩指纹（分数 + 时长 + 步数 + 块数）
      // 强制取整，消除 JS 浮点数与数据库整数之间的微小刻度差异，严格比对 cutCount 避免不同难度相同分数被误判为重复
      const getFingerprint = (r: GameRecord) => 
        `${Math.round(r.finalScore || 0)}-${Math.round(r.totalDuration || 0)}-${Math.round(r.totalRotations || 0)}-${r.difficulty?.cutCount || 1}`;
      
      const newFingerprint = getFingerprint(record);
      
      // 3. 查重：ID 匹配或核心业绩指纹匹配
      const isDuplicate = leaderboard.some(r => 
        (record.id && r.id === record.id) || 
        (getFingerprint(r) === newFingerprint)
      );
      
      if (isDuplicate) return;
      
      // 4. 插入并排序
      leaderboard.push(record);
      leaderboard.sort((a, b) => b.finalScore - a.finalScore);
      leaderboard = leaderboard.slice(0, this.MAX_LEADERBOARD_RECORDS);
      
      // 5. 持久化
      this.memoryLeaderboard = leaderboard;
      localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (error) {
      console.error("[GameDataManager] Update leaderboard failed:", error);
    }
  }

  private static validateGameRecord(record: any): record is GameRecord {
    if (!record || typeof record !== 'object') return false;
    const requiredFields = ['timestamp', 'finalScore', 'totalDuration', 'difficulty', 'totalRotations', 'hintUsageCount', 'dragOperations'];
    for (const field of requiredFields) { if (!(field in record)) return false; }
    if (typeof record.timestamp !== 'number' || typeof record.finalScore !== 'number') return false;
    if (!record.difficulty || typeof record.difficulty !== 'object') return false;
    return true;
  }

  static getDataStats(): { leaderboardCount: number; historyCount: number; storageUsed: number; isStorageAvailable: boolean; } {
    try {
      const leaderboard = this.getLeaderboard();
      const history = this.getGameHistory();
      let storageUsed = 0;
      let isStorageAvailable = true;
      try {
        const leaderboardData = localStorage.getItem(this.LEADERBOARD_KEY) || '';
        const historyData = localStorage.getItem(this.GAME_HISTORY_KEY) || '';
        storageUsed = (leaderboardData.length + historyData.length) * 2;
      } catch { isStorageAvailable = false; }
      return { leaderboardCount: leaderboard.length, historyCount: history.length, storageUsed, isStorageAvailable };
    } catch (error) {
      return { leaderboardCount: 0, historyCount: 0, storageUsed: 0, isStorageAvailable: false };
    }
  }

  static trackVisitor(): void {
    try {
      const current = parseInt(localStorage.getItem(this.VISITOR_COUNT_KEY) || '0');
      if (typeof window !== 'undefined' && !sessionStorage.getItem('puzzle-visited')) {
        localStorage.setItem(this.VISITOR_COUNT_KEY, (current + 1).toString());
        sessionStorage.setItem('puzzle-visited', 'true');
      }
    } catch (e) {}
  }

  static trackGameStart(): void {
    try {
      const current = parseInt(localStorage.getItem(this.GAME_START_COUNT_KEY) || '0');
      localStorage.setItem(this.GAME_START_COUNT_KEY, (current + 1).toString());
    } catch (e) {}
  }

  static getGlobalStats() {
    try {
      return {
        visitorCount: parseInt(localStorage.getItem(this.VISITOR_COUNT_KEY) || '0'),
        gameStartCount: parseInt(localStorage.getItem(this.GAME_START_COUNT_KEY) || '0'),
        historyCount: this.getGameHistory().length
      };
    } catch (e) { return { visitorCount: 0, gameStartCount: 0, historyCount: 0 }; }
  }

  static syncWithCloudRecords(cloudRecords: GameRecord[]): void {
    try {
      // 1. 绝对真理规则：如果云端明确返回空数据集，意味着后台管理员清空了数据，此时本地必须严格跟随抹除脏数据
      if (!cloudRecords || cloudRecords.length === 0) {
        console.warn("[GameDataManager] ⚠️ 云端数据为空，强制清空本地可能残留的脏数据");
        this.memoryHistory = [];
        this.memoryLeaderboard = [];
        localStorage.removeItem(this.GAME_HISTORY_KEY);
        localStorage.removeItem(this.LEADERBOARD_KEY);
        return;
      }

      // 2. 严格比对法：容忍 2 秒的时间差计算误差，精准核对同难度
      const isSameMatch = (local: GameRecord, cloud: GameRecord) => {
        if (local.id && cloud.id && local.id === cloud.id) return true;
        const timeDiff = Math.abs(local.timestamp - cloud.timestamp);
        return timeDiff <= 2000 && 
               local.finalScore === cloud.finalScore && 
               local.difficulty?.cutCount === cloud.difficulty?.cutCount;
      };

      // 3. 直接以云端数据为底本重构本列表，避免长期的幻影叠加
      let unmergedLocalHistoryCount = 0;
      let newMergedHistory = [...cloudRecords];
      let localHistory = this.getGameHistory();
      
      // 补偿：只保留云端不存在的额外本地记录（可能是离线断网时生成的还没上云的）
      for (const local of localHistory) {
        if (!newMergedHistory.some(cr => isSameMatch(local, cr))) {
          newMergedHistory.push(local);
          unmergedLocalHistoryCount++;
        }
      }

      newMergedHistory.sort((a, b) => b.timestamp - a.timestamp);
      const finalH = newMergedHistory.slice(0, this.MAX_HISTORY_RECORDS);
      localStorage.setItem(this.GAME_HISTORY_KEY, JSON.stringify(finalH));
      this.memoryHistory = finalH;

      // 同样的思想刷新排行榜
      let newMergedL = [...cloudRecords];
      let localL = this.getLeaderboard();
      for (const local of localL) {
        if (!newMergedL.some(cr => isSameMatch(local, cr))) {
          newMergedL.push(local);
        }
      }

      newMergedL.sort((a, b) => b.finalScore - a.finalScore);
      const finalL = newMergedL.slice(0, this.MAX_LEADERBOARD_RECORDS);
      localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(finalL));
      this.memoryLeaderboard = finalL;

      console.log(`[GameDataManager] 🔄 云端同步重组完毕。采用云端基准 ${cloudRecords.length}条，补偿本地 ${unmergedLocalHistoryCount}条`);
    } catch (error) {
      console.error("[GameDataManager] 云端数据同步异常:", error);
    }
  }
}