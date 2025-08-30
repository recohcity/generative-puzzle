/**
 * 清除游戏数据的简单工具
 */
export function clearAllGameData() {
  try {
    // 清除localStorage中的游戏数据
    localStorage.removeItem('puzzle-leaderboard');
    localStorage.removeItem('puzzle-history');
    
    console.log('✅ 游戏数据已清除');
    console.log('📊 排行榜数据已清除');
    console.log('📚 历史记录已清除');
    
    return true;
  } catch (error) {
    console.error('❌ 清除数据失败:', error);
    return false;
  }
}

/**
 * 检查当前数据状态
 */
export function checkGameDataStatus() {
  try {
    const leaderboardData = localStorage.getItem('puzzle-leaderboard');
    const historyData = localStorage.getItem('puzzle-history');
    
    console.log('📊 排行榜数据状态:', leaderboardData ? `有数据 (${JSON.parse(leaderboardData).length}条)` : '无数据');
    console.log('📚 历史数据状态:', historyData ? `有数据 (${JSON.parse(historyData).length}条)` : '无数据');
    
    if (leaderboardData) {
      const leaderboard = JSON.parse(leaderboardData);
      console.log('排行榜详情:', leaderboard);
    }
    
    if (historyData) {
      const history = JSON.parse(historyData);
      console.log('历史记录详情:', history);
    }
    
    return {
      hasLeaderboard: !!leaderboardData,
      hasHistory: !!historyData,
      leaderboardCount: leaderboardData ? JSON.parse(leaderboardData).length : 0,
      historyCount: historyData ? JSON.parse(historyData).length : 0
    };
  } catch (error) {
    console.error('❌ 检查数据状态失败:', error);
    return null;
  }
}

// 在开发环境中添加到全局对象
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearAllGameData = clearAllGameData;
  (window as any).checkGameDataStatus = checkGameDataStatus;
  console.log('🔧 游戏数据工具已添加到全局对象');
  console.log('使用方法:');
  console.log('  window.clearAllGameData() - 清除所有数据');
  console.log('  window.checkGameDataStatus() - 检查数据状态');
}