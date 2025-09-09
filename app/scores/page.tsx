'use client';

import { useEffect, useState } from 'react';
import { GameDataManager } from '@/utils/data/GameDataManager';

export default function ScoreManagementPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const refreshData = () => {
    const lb = GameDataManager.getLeaderboard();
    const hist = GameDataManager.getGameHistory();
    setLeaderboard(lb);
    setHistory(hist);
    console.log('刷新数据 - 排行榜:', lb, '历史:', hist);
  };

  useEffect(() => {
    setIsClient(true);
    refreshData();
  }, []);

  const clearAllData = () => {
    if (!confirm('确定要清除所有游戏数据吗？此操作不可恢复！')) {
      return;
    }

    console.log('🗑️ 开始清除数据...');

    try {
      // 直接清除localStorage
      localStorage.removeItem('puzzle-leaderboard');
      localStorage.removeItem('puzzle-history');

      // 验证清除结果
      const checkLeaderboard = localStorage.getItem('puzzle-leaderboard');
      const checkHistory = localStorage.getItem('puzzle-history');

      if (!checkLeaderboard && !checkHistory) {
        console.log('✅ 数据清除成功');
        setMessage('✅ 所有数据已清除');

        // 立即更新状态
        setLeaderboard([]);
        setHistory([]);

        // 再次刷新确保同步
        setTimeout(() => {
          refreshData();
          setMessage('');
        }, 1000);
      } else {
        console.error('❌ 数据清除不完整');
        setMessage('❌ 数据清除失败');
      }
    } catch (error) {
      console.error('❌ 清除数据时出错:', error);
      setMessage('❌ 清除数据时出错: ' + error);
    }
  };

  const getDifficultyTextFromRecord = (difficulty: any) => {
    const level = difficulty?.cutCount || 1;
    return `难度${level}`;
  };

  // 仅用于筛选标签的人类可读文案
  const getDifficultyFilterName = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      case 'extreme': return '极难';
      default: return difficulty;
    }
  };

  const filteredHistory = selectedDifficulty === 'all'
    ? history.slice(0, 20) // 显示最近20条记录
    : history.filter(record => record.difficulty?.difficultyLevel === selectedDifficulty).slice(0, 20);

  const showRecordDetail = (record: any) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRecord(null);
  };

  const getStorageSize = () => {
    if (!isClient) return 0; // 服务端渲染时返回0
    try {
      const leaderboardData = localStorage.getItem('puzzle-leaderboard') || '';
      const historyData = localStorage.getItem('puzzle-history') || '';
      return Math.round((leaderboardData.length + historyData.length) / 1024 * 100) / 100; // KB
    } catch {
      return 0;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">游戏成绩管理</h1>
        <p className="text-gray-600">查看和管理您的游戏历史记录与排行榜数据</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{message}</p>
        </div>
      )}

      {/* 操作按钮区域 */}
      <div className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={refreshData}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 刷新数据
        </button>

        <button
          onClick={clearAllData}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          🗑️ 清除所有数据
        </button>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">排行榜记录</h3>
          <p className="text-2xl font-bold text-blue-600">{leaderboard.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">历史记录</h3>
          <p className="text-2xl font-bold text-green-600">{history.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">存储大小</h3>
          <p className="text-2xl font-bold text-purple-600">{getStorageSize()} KB</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">最高分数</h3>
          <p className="text-2xl font-bold text-orange-600">
            {isClient && leaderboard.length > 0 ? leaderboard[0].finalScore : 0}
          </p>
        </div>
      </div>

      {/* 难度筛选 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          按难度筛选历史记录：
        </label>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
          <option value="extreme">极难</option>
        </select>
      </div>

      {/* 数据展示区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 个人最佳成绩 */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              🏆 个人最佳成绩
              <span className="ml-2 text-sm font-normal text-gray-500">({leaderboard.length} 条记录)</span>
            </h2>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无个人最佳成绩数据</p>
                <p className="text-sm text-gray-400 mt-1">完成游戏后将显示最佳成绩</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((record, index) => (
                  <div key={`leaderboard-${record.timestamp}-${index}`}
                    className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">{index + 1}</span>
                        <span className="text-xl font-bold">{record.finalScore}分</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
{getDifficultyTextFromRecord(record.difficulty)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>⏱️ 时长: {Math.floor(record.totalDuration / 60)}:{(record.totalDuration % 60).toString().padStart(2, '0')}</div>
                      <div>🔄 旋转: {record.totalRotations}次 | 💡 提示: {record.hintUsageCount}次</div>
                      <div>📅 {new Date(record.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 历史记录 */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              📚 历史记录
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredHistory.length} / {history.length} 条记录)
              </span>
            </h2>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
{selectedDifficulty === 'all' ? '暂无历史记录' : `暂无${getDifficultyFilterName(selectedDifficulty)}难度的记录`}
                </p>
                <p className="text-sm text-gray-400 mt-1">开始游戏来创建记录吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((record) => (
                  <div
                    key={record.timestamp}
                    className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => showRecordDetail(record)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold">{record.finalScore}分</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
{getDifficultyTextFromRecord(record.difficulty)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>⏱️ 时长: {Math.floor(record.totalDuration / 60)}:{(record.totalDuration % 60).toString().padStart(2, '0')}</div>
                      <div>🔄 旋转: {record.totalRotations}次 | 💡 提示: {record.hintUsageCount}次</div>
                      <div>📅 {new Date(record.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      点击查看详细信息 →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 技术信息 */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-gray-700">📊 存储信息</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• 存储位置: 浏览器本地存储 (localStorage)</p>
          <p>• 排行榜键名: puzzle-leaderboard</p>
          <p>• 历史记录键名: puzzle-history</p>
          <p>• 当前数据: 排行榜 {leaderboard.length} 条，历史 {history.length} 条</p>
          <p>• 存储大小: {getStorageSize()} KB</p>
        </div>
      </div>

      {/* 详细信息模态框 */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">游戏详细信息</h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-blue-800">🎯 游戏成绩</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">最终分数</span>
                      <p className="text-2xl font-bold text-blue-600">{selectedRecord.finalScore}分</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">难度级别</span>
<p className="text-lg font-semibold">{getDifficultyTextFromRecord(selectedRecord.difficulty)}</p>
                    </div>
                  </div>
                </div>

                {/* 时间统计 */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-green-800">⏱️ 时间统计</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">游戏时长</span>
                      <p className="text-lg font-semibold">
                        {Math.floor(selectedRecord.totalDuration / 60)}分{selectedRecord.totalDuration % 60}秒
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">完成时间</span>
                      <p className="text-lg font-semibold">
                        {new Date(selectedRecord.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 操作统计 */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-purple-800">🎮 操作统计</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">旋转次数</span>
                      <p className="text-lg font-semibold">{selectedRecord.totalRotations}次</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">使用提示</span>
                      <p className="text-lg font-semibold">{selectedRecord.hintUsageCount}次</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">拖拽操作</span>
                      <p className="text-lg font-semibold">{selectedRecord.dragOperations || 0}次</p>
                    </div>
                  </div>
                </div>

                {/* 效率分析 */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-orange-800">📊 效率分析</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">旋转效率</span>
                      <p className="text-lg font-semibold">
                        {((selectedRecord.rotationEfficiency || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">设备类型</span>
                      <p className="text-lg font-semibold">
                        {selectedRecord.deviceType === 'desktop' ? '桌面端' :
                          selectedRecord.deviceType === 'mobile-portrait' ? '手机竖屏' :
                            selectedRecord.deviceType === 'mobile-landscape' ? '手机横屏' :
                              selectedRecord.deviceType === 'ipad' ? 'iPad' : '未知'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 分数详情 */}
                {selectedRecord.scoreBreakdown && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 text-gray-800">💰 分数详情</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>基础分数:</span>
                        <span className="font-semibold">{selectedRecord.scoreBreakdown.baseScore}分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>时间奖励:</span>
                        <span className="font-semibold text-green-600">+{selectedRecord.scoreBreakdown.timeBonus}分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>旋转扣分:</span>
                        <span className="font-semibold text-red-600">{selectedRecord.scoreBreakdown.rotationScore}分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>提示扣分:</span>
                        <span className="font-semibold text-red-600">{selectedRecord.scoreBreakdown.hintScore}分</span>
                      </div>
                      <div className="flex justify-between">
                        <span>难度系数:</span>
                        <span className="font-semibold">×{selectedRecord.scoreBreakdown.difficultyMultiplier.toFixed(2)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>最终分数:</span>
                        <span className="text-blue-600">{selectedRecord.finalScore}分</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}