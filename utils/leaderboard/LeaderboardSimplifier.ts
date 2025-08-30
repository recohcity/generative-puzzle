/**
 * 排行榜简化处理工具
 * 统一榜单数据，只显示前5名，并检测玩家新入榜成绩
 */

import { GameRecord } from '@/types/puzzleTypes';

interface SimplifiedLeaderboardData {
  top5Records: GameRecord[];
  playerNewEntry: GameRecord | null;
  totalRecords: number;
  lastUpdated: number;
}

export class LeaderboardSimplifier {
  /**
   * 统一所有难度成绩到单一榜单
   */
  static unifyLeaderboard(records: GameRecord[]): GameRecord[] {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    // 按总分降序排列所有成绩
    return records
      .filter(record => record && typeof record.finalScore === 'number')
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 获取前5名成绩
   */
  static getTop5Records(records: GameRecord[]): GameRecord[] {
    const unifiedRecords = this.unifyLeaderboard(records);
    return unifiedRecords.slice(0, 5);
  }

  /**
   * 检测玩家最新入榜成绩
   * @param records 所有成绩记录
   * @param lastGameTimestamp 最后一次游戏的时间戳
   * @param recentThreshold 最近时间阈值（毫秒），默认5分钟
   */
  static detectPlayerNewEntry(
    records: GameRecord[], 
    lastGameTimestamp: number | null,
    recentThreshold: number = 5 * 60 * 1000
  ): GameRecord | null {
    if (!lastGameTimestamp || !records || records.length === 0) {
      return null;
    }

    const top5Records = this.getTop5Records(records);
    
    // 检查最新游戏是否在前5名中
    const playerInTop5 = top5Records.find(record => 
      record.timestamp === lastGameTimestamp || 
      record.gameStartTime === lastGameTimestamp
    );

    if (!playerInTop5) {
      return null;
    }

    // 检查是否为最近完成的游戏
    const isRecent = Date.now() - lastGameTimestamp < recentThreshold;
    
    return isRecent ? playerInTop5 : null;
  }

  /**
   * 获取玩家在榜单中的位置
   */
  static getPlayerRankPosition(records: GameRecord[], playerRecord: GameRecord): number {
    const unifiedRecords = this.unifyLeaderboard(records);
    const index = unifiedRecords.findIndex(record => {
      const timestampMatch = record.timestamp === playerRecord.timestamp;
      const gameStartTimeMatch = record.gameStartTime && playerRecord.gameStartTime && 
                                record.gameStartTime === playerRecord.gameStartTime;
      return timestampMatch || gameStartTimeMatch;
    });
    

    
    return index >= 0 ? index + 1 : -1;
  }

  /**
   * 处理完整的简化榜单数据
   */
  static processSimplifiedLeaderboard(
    records: GameRecord[], 
    lastGameTimestamp: number | null = null
  ): SimplifiedLeaderboardData {
    const top5Records = this.getTop5Records(records);
    const playerNewEntry = this.detectPlayerNewEntry(records, lastGameTimestamp);
    
    return {
      top5Records,
      playerNewEntry,
      totalRecords: records.length,
      lastUpdated: Date.now()
    };
  }

  /**
   * 格式化时间显示
   */
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化分数显示
   */
  static formatScore(score: number): string {
    return score.toLocaleString();
  }

  /**
   * 获取排名图标
   */
  static getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈"; 
      case 3: return "🥉";
      default: return `${rank}`;
    }
  }

  /**
   * 获取速度奖励排名（基于完成时间）- 已弃用
   * 注意：为避免与分数排名混淆，不再显示速度排名信息
   */
  static getSpeedRankings(records: GameRecord[]): Map<number, number> {
    // 保留方法以维持兼容性，但不再使用
    return new Map<number, number>();
  }

  /**
   * 获取速度奖励显示文本 - 已弃用
   * 注意：为避免与分数排名混淆，不再显示速度排名文本
   */
  static getSpeedRankText(rank: number): string {
    // 不再显示速度排名文本，避免与分数排名混淆
    return '';
  }

  /**
   * 获取速度奖励分数（基于完成时间）
   * 按照新的速度奖励规则计算
   */
  static getSpeedBonus(duration: number): number {
    if (duration <= 10) {
      return 400; // 10秒内完成：400分
    } else if (duration <= 30) {
      return 200; // 30秒内完成：200分
    } else if (duration <= 60) {
      return 100; // 1分钟内完成：100分
    } else if (duration <= 90) {
      return 50;  // 1分30秒内完成：50分
    } else if (duration <= 120) {
      return 10;  // 2分钟内完成：10分
    } else {
      return 0;   // 超过2分钟：0分
    }
  }
}