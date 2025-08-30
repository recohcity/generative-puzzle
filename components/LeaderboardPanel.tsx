"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Clock, RotateCcw, Lightbulb } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { GameDataManager } from "@/utils/data/GameDataManager";
import { useState, useEffect, useMemo } from "react";

// 使用GameDataManager内部的数据结构
interface StoredGameRecord {
  timestamp: number;
  finalScore: number;
  totalDuration: number;
  difficulty: any;
  deviceInfo: any;
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;
  rotationEfficiency: number;
  scoreBreakdown: any;
  gameStartTime?: number; // 兼容字段
  id?: string; // 兼容字段
}

interface LeaderboardPanelProps {
  leaderboard?: StoredGameRecord[]; // 可选的外部数据
  onBack: () => void;
  onViewDetails: (record: StoredGameRecord) => void;
  onViewRecentGame?: (record: StoredGameRecord) => void;
  panelScale?: number;
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ onBack, onViewDetails, onViewRecentGame }) => {
  const { t, locale, isLoading } = useTranslation();

  const [recentGame, setRecentGame] = useState<StoredGameRecord | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // 转换GameRecord到StoredGameRecord格式
  const convertGameRecord = (gameRecord: any): StoredGameRecord | null => {
    if (!gameRecord) return null;

    // 如果已经是StoredGameRecord格式，直接返回
    if (gameRecord.timestamp && gameRecord.finalScore) {
      return gameRecord;
    }

    // 如果是GameRecord格式，进行转换
    if (gameRecord.stats) {
      return {
        timestamp: gameRecord.completedAt ? new Date(gameRecord.completedAt).getTime() : Date.now(),
        finalScore: gameRecord.stats.finalScore || 0,
        totalDuration: gameRecord.stats.totalDuration || 0,
        difficulty: gameRecord.stats.difficulty || {},
        deviceInfo: {
          type: gameRecord.stats.deviceType || 'desktop',
          screenWidth: gameRecord.stats.canvasSize?.width || 1024,
          screenHeight: gameRecord.stats.canvasSize?.height || 768
        },
        totalRotations: gameRecord.stats.totalRotations || 0,
        hintUsageCount: gameRecord.stats.hintUsageCount || 0,
        dragOperations: gameRecord.stats.dragOperations || 0,
        rotationEfficiency: gameRecord.stats.rotationEfficiency || 1,
        scoreBreakdown: {
          baseScore: gameRecord.stats.baseScore || 0,
          timeBonus: gameRecord.stats.timeBonus || 0,
          rotationScore: gameRecord.stats.rotationScore || 0,
          hintScore: gameRecord.stats.hintScore || 0,
          difficultyMultiplier: gameRecord.stats.difficultyMultiplier || 1,
          finalScore: gameRecord.stats.finalScore || 0
        },
        gameStartTime: gameRecord.stats.gameStartTime,
        id: gameRecord.id
      };
    }

    return null;
  };

  // 原始排行榜数据
  const [originalLeaderboard, setOriginalLeaderboard] = useState<StoredGameRecord[]>([]);

  // 筛选后的排行榜数据
  const filteredLeaderboard = useMemo(() => {
    if (selectedDifficulty === 'all') {
      return originalLeaderboard;
    }
    return originalLeaderboard.filter(record =>
      record.difficulty.difficultyLevel === selectedDifficulty
    );
  }, [originalLeaderboard, selectedDifficulty]);

  useEffect(() => {
    // 加载排行榜数据
    console.log('[LeaderboardPanel] 开始加载数据...');
    const topRecords = GameDataManager.getLeaderboard();
    const lastGame = GameDataManager.getLastGameRecord();

    console.log('[LeaderboardPanel] 排行榜数据:', topRecords);
    console.log('[LeaderboardPanel] 最近游戏记录:', lastGame);

    // 转换排行榜数据
    const convertedLeaderboard = topRecords.map(record => convertGameRecord(record)).filter(Boolean) as StoredGameRecord[];
    setOriginalLeaderboard(convertedLeaderboard);

    // 转换最近游戏记录
    const convertedRecentGame = convertGameRecord(lastGame);
    setRecentGame(convertedRecentGame);
  }, []);

  const handleBack = () => {
    playButtonClickSound();
    onBack();
  };



  const handleViewRecentGame = (record: StoredGameRecord) => {
    console.log('[LeaderboardPanel] 点击最近游戏记录:', record);
    console.log('[LeaderboardPanel] onViewRecentGame 函数存在:', !!onViewRecentGame);
    playButtonClickSound();
    if (onViewRecentGame) {
      console.log('[LeaderboardPanel] 调用 onViewRecentGame');
      onViewRecentGame(record);
    } else {
      console.log('[LeaderboardPanel] 回退到 onViewDetails');
      onViewDetails(record);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `${index + 1}`;
    }
  };

  // 如果翻译系统还在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#FFD5AB]">Loading...</div>
      </div>
    );
  }

  return (
    <div
      key={`old-leaderboard-${locale}`}
      className="p-3 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] space-y-3 h-full flex flex-col"
    >


      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Top5 排行榜 */}
        <div className="bg-[#2A2A2A] rounded-lg p-3 relative">
          {/* 关闭按钮 - 移动到卡片右上角 */}
          <Button
            onClick={handleBack}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-[#FFD5AB] hover:text-white text-xs px-2 py-1 h-auto"
          >
            关闭
          </Button>
          
          <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1 pr-12">
            <Trophy className="w-4 h-4" />
            Top 5
          </h4>

          {/* 难度筛选按钮 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {(['all', 'easy', 'medium', 'hard', 'extreme'] as const).map((difficulty) => (
              <Button
                key={difficulty}
                onClick={() => {
                  playButtonClickSound();
                  setSelectedDifficulty(difficulty);
                }}
                variant={selectedDifficulty === difficulty ? "default" : "ghost"}
                size="sm"
                className={`text-xs px-2 py-1 ${selectedDifficulty === difficulty
                  ? 'bg-[#F68E5F] text-white'
                  : 'text-[#FFD5AB] hover:text-white hover:bg-[#F68E5F]'
                  }`}
                style={{ fontSize: '11px' }}
              >
                {difficulty === 'all' ? '全部' :
                  difficulty === 'easy' ? '简单' :
                    difficulty === 'medium' ? '中等' :
                      difficulty === 'hard' ? '困难' :
                        difficulty === 'extreme' ? '极难' : difficulty}
              </Button>
            ))}
          </div>

          {filteredLeaderboard.length > 0 ? (
            <div className="space-y-2">
              {filteredLeaderboard.slice(0, 5).map((record, index) => (
                <div
                  key={record.id || record.timestamp}
                  className="flex items-center justify-between p-2 rounded bg-[#333] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                          'bg-[#555] text-[#FFD5AB]'
                      }`}>
                      {getRankIcon(index)}
                    </span>
                    <div>
                      <div className="text-[#FFD5AB] font-medium">{record.finalScore.toLocaleString()}</div>
                      <div className="text-[#FFD5AB] opacity-60">
                        {formatTime(record.totalDuration)} • {record.difficulty.difficultyLevel}
                      </div>
                    </div>
                  </div>
                  <div className="text-[#FFD5AB] opacity-60 text-xs">
                    {new Date(record.gameStartTime || record.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#FFD5AB] opacity-60 text-xs text-center py-4">
              暂无排行榜数据
            </div>
          )}
        </div>

        {/* 最近一次游戏记录 - 优化版 */}
        <div className="bg-[#2A2A2A] rounded-lg p-3">
          <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {t('stats.scoreHistory') || '最近一次游戏记录'}
          </h4>
          {recentGame ? (
            <div
              className="relative p-4 rounded-lg bg-gradient-to-br from-[#3A3A3A] to-[#2D2D2D] hover:from-[#444] hover:to-[#333] cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-[#FFD5AB] group shadow-lg hover:shadow-xl"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[LeaderboardPanel] 点击事件触发');
                handleViewRecentGame(recentGame);
              }}
            >
              {/* 点击提示 - 右上角 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg animate-bounce">👆</div>
                  <div className="text-xs text-[#FFD5AB] whitespace-nowrap bg-[#FFD5AB] bg-opacity-20 px-2 py-1 rounded">
                    {t('stats.viewDetails') || '查看详情'}
                  </div>
                </div>
              </div>

              {/* 主要分数显示 */}
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-[#FFD5AB] font-mono mb-1 tracking-wider">
                  {recentGame.finalScore.toLocaleString()}
                </div>
                <div className="text-sm text-[#FFD5AB] opacity-70 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(recentGame.totalDuration)}
                </div>
              </div>

              {/* 游戏统计信息 - 紧凑布局 */}
              <div className="flex items-center justify-center gap-4 mb-3 text-xs">
                <div className="flex items-center gap-1 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-[#FFD5AB] font-medium">{recentGame.difficulty.actualPieces}</span>
                </div>
                <div className="flex items-center gap-1 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                  <RotateCcw className="w-3 h-3 text-blue-400" />
                  <span className="text-[#FFD5AB] font-medium">{recentGame.totalRotations}</span>
                </div>
                <div className="flex items-center gap-1 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                  <Lightbulb className="w-3 h-3 text-green-400" />
                  <span className="text-[#FFD5AB] font-medium">{recentGame.hintUsageCount}</span>
                </div>
              </div>

              {/* 难度和日期信息 */}
              <div className="flex items-center justify-between pt-3 border-t border-[#555]">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#FFD5AB] to-[#F4C2A1] text-[#2A2A2A] text-xs font-medium rounded-full">
                    {t(`difficulty.${recentGame.difficulty.difficultyLevel}`) || recentGame.difficulty.difficultyLevel}
                  </span>
                  <span className="text-xs text-[#FFD5AB] opacity-70 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                    {t(`cutType.${recentGame.difficulty.cutType}`) || recentGame.difficulty.cutType}
                  </span>
                </div>
                <div className="text-xs text-[#FFD5AB] opacity-60">
                  {(() => {
                    const date = new Date(recentGame.gameStartTime || recentGame.timestamp);
                    const now = new Date();
                    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

                    if (diffInHours < 1) {
                      return '刚刚';
                    } else if (diffInHours < 24) {
                      return `${diffInHours}小时前`;
                    } else {
                      return date.toLocaleDateString();
                    }
                  })()}
                </div>
              </div>

              {/* 悬停效果 - 底部光晕 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD5AB] to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-b-lg"></div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-50">🎮</div>
              <div className="text-[#FFD5AB] opacity-60 text-sm">
                {t('leaderboard.empty') || '暂无游戏记录'}
              </div>
              <div className="text-[#FFD5AB] opacity-40 text-xs mt-1">
                完成一局游戏后将显示记录
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPanel;