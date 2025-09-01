import { GameDataManager } from '../data/GameDataManager';
import { DifficultyLevel } from '@/types/puzzleTypes';
import { ALL_DIFFICULTY_LEVELS, getPieceCountByDifficulty, getDifficultyMultiplier } from '@/utils/difficulty/DifficultyUtils';

/**
 * 游戏数据工具集
 * 用于开发和测试时检查数据保存和读取状态
 */
export class GameDataTools {
  /**
   * 生成测试数据
   */
  static generateTestData(count = 5) {
    console.group(`🧪 生成 ${count} 条测试数据`);
    
    const difficulties = ALL_DIFFICULTY_LEVELS;
    
    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[i % difficulties.length];
      const baseScore = 1000 + Math.random() * 1000;
      const duration = 60 + Math.random() * 120;
      const rotations = Math.floor(Math.random() * 10) + 1;
      const hints = Math.floor(Math.random() * 5);
      
      const gameStats = {
        gameStartTime: Date.now() - Math.random() * 86400000, // 随机时间（24小时内）
        totalDuration: Math.floor(duration),
        totalRotations: rotations,
        hintUsageCount: hints,
        dragOperations: Math.floor(Math.random() * 20) + 5,
        rotationEfficiency: Math.random() * 0.5 + 0.5,
        difficulty: {
          difficultyLevel: difficulty,
          actualPieces: getPieceCountByDifficulty(difficulty)
        },
        deviceInfo: {
          isMobile: Math.random() > 0.5,
          screenSize: { width: 1920, height: 1080 }
        }
      };
      
      const scoreBreakdown = {
        baseScore: Math.floor(baseScore),
        timeBonus: Math.floor(Math.random() * 300),
        rotationScore: -rotations * 10,
        hintScore: -hints * 50,
        finalScore: Math.floor(baseScore + Math.random() * 300 - rotations * 10 - hints * 50)
      };
      
      const success = GameDataManager.saveGameRecord(gameStats as any, scoreBreakdown.finalScore, scoreBreakdown);
      
      if (success) {
        console.log(`✅ 测试数据 ${i + 1}: 分数 ${scoreBreakdown.finalScore}, 难度 ${difficulty}`);
      } else {
        console.error(`❌ 测试数据 ${i + 1} 保存失败`);
      }
    }
    
    console.groupEnd();
  }

  /**
   * 打印当前排行榜状态
   */
  static printLeaderboard(difficulty?: DifficultyLevel) {
    console.group('🏆 个人最佳成绩状态');
    
    const leaderboard = GameDataManager.getLeaderboard(difficulty);
    
    if (leaderboard.length === 0) {
      console.log('📭 暂无个人最佳成绩数据');
    } else {
      console.log(`📊 共有 ${leaderboard.length} 条记录${difficulty ? ` (难度: ${difficulty})` : ''}`);
      
      leaderboard.forEach((record, index) => {
        console.log(`${index + 1}. 分数: ${record.finalScore.toLocaleString()}, 时长: ${this.formatTime(record.totalDuration)}, 难度: ${record.difficulty.difficultyLevel}`);
      });
    }
    
    console.groupEnd();
  }

  /**
   * 打印游戏历史记录
   */
  static printGameHistory(limit = 10) {
    console.group('📚 游戏历史记录');
    
    const history = GameDataManager.getGameHistory();
    
    if (history.length === 0) {
      console.log('📭 暂无历史记录');
    } else {
      console.log(`📊 共有 ${history.length} 条历史记录`);
      
      history.slice(0, limit).forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString();
        console.log(`${index + 1}. ${date} - 分数: ${record.finalScore.toLocaleString()}, 时长: ${this.formatTime(record.totalDuration)}`);
      });
      
      if (history.length > limit) {
        console.log(`... 还有 ${history.length - limit} 条记录`);
      }
    }
    
    console.groupEnd();
  }

  /**
   * 清除所有数据
   */
  static clearAllData() {
    console.group('🗑️ 清除所有数据');
    
    try {
      localStorage.removeItem('puzzle-leaderboard');
      localStorage.removeItem('puzzle-history');
      console.log('✅ 所有数据已清除');
    } catch (error) {
      console.error('❌ 清除数据时出错:', error);
    }
    
    console.groupEnd();
  }

  /**
   * 完整的数据报告
   */
  static generateReport() {
    console.group('📋 完整数据报告');
    
    this.printLeaderboard();
    this.printGameHistory(5);
    
    console.groupEnd();
  }

  /**
   * 格式化时间显示
   */
  private static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// 在开发环境中将数据工具添加到全局对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).GameDataTools = GameDataTools;
  console.log('🔧 GameDataTools 已添加到 window.GameDataTools');
  console.log('可用方法: generateTestData(), printLeaderboard(), printGameHistory(), generateReport(), clearAllData()');
}