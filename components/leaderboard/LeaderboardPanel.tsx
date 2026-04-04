"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { useTranslation } from '@/contexts/I18nContext';
import { playButtonClickSound } from "@/utils/rendering/soundEffects";

import GameRecordDetails from '@/components/GameRecordDetails';

import { GameRecord, DifficultyLevel } from '@generative-puzzle/game-core';

interface LeaderboardPanelProps {
  leaderboard: GameRecord[];
  history?: GameRecord[]; // 添加历史数据
  onClose: () => void;
  panelScale?: number;
  // 添加功能按钮的props
  isMusicPlaying?: boolean;
  isFullscreen?: boolean;
  onToggleMusic?: () => void;
  onToggleFullscreen?: () => void;
  onShowLeaderboard?: () => void;
  onViewRecentGame?: (record: GameRecord) => void; // 新增：查看最近游戏详情
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  leaderboard,
  history = [],
  onClose,
  panelScale = 1.0,
  isMusicPlaying = true,
  isFullscreen = false,
  onToggleMusic,
  onToggleFullscreen,
  onShowLeaderboard,
  onViewRecentGame
}) => {
  const { t, locale, isLoading } = useTranslation();

  const [selectedRecord, setSelectedRecord] = useState<GameRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 获取难度显示文本（统一为数值等级）
  const getDifficultyText = (difficulty: { cutCount?: number } | undefined): string => {
    const level = difficulty?.cutCount || 1;
    return t('difficulty.levelLabel', { level });
  };

  // 获取形状显示名称
  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  // 获取切割类型显示名称
  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType;
    }
  };

  // 获取包含形状和切割类型的难度文本
  const getDifficultyWithShape = (difficulty: any): string => {
    const shapeName = getShapeDisplayName(difficulty?.shapeType);
    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType);
    const difficultyLevel = getDifficultyText(difficulty);
    
    const parts = [difficultyLevel];
    if (shapeName) parts.push(shapeName);
    if (cutTypeName) parts.push(cutTypeName);
    
    return parts.join(' · ');
  };


  // 统一所有难度的个人最佳成绩数据，只显示前5名
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.slice(0, 5);
  }, [leaderboard]);

  // 计算速度排名（基于完成时间）
  const speedRankings = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) {
      return new Map<number, number>();
    }
    
    // 按完成时间排序，找出最快的前5名
    const sortedByTime = [...leaderboard].sort((a, b) => a.totalDuration - b.totalDuration);
    const speedRankings = new Map<number, number>();
    
    sortedByTime.slice(0, 5).forEach((record, index) => {
      speedRankings.set(record.timestamp, index + 1);
    });
    
    return speedRankings;
  }, [leaderboard]);

  // 处理历史记录数据 - 按时间排序，最新的在前
  const sortedHistory = useMemo(() => {
    const historyData = history.length > 0 ? history : leaderboard;
    return historyData
      .slice() // 创建副本避免修改原数组
      .sort((a, b) => b.timestamp - a.timestamp) // 按时间戳降序排序
      .slice(0, 1); // 只显示最近1条记录
  }, [history, leaderboard]);

  // 显示记录详情
  const showRecordDetails = (record: GameRecord) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  // 显示最近游戏详情 - 桌面端使用回调，移动端使用内部状态
  const showRecentGameDetails = (record: GameRecord) => {
    console.log('[LeaderboardPanel] 点击最近游戏记录:', record);
    if (onViewRecentGame) {
      // 桌面端：使用回调在右侧面板显示
      console.log('[LeaderboardPanel] 使用桌面端回调显示详情');
      onViewRecentGame(record);
    } else {
      // 移动端：使用内部状态显示
      console.log('[LeaderboardPanel] 使用移动端内部状态显示详情');
      setSelectedRecord(record);
      setShowDetails(true);
    }
  };

  // 关闭详情
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedRecord(null);
  };

  // 获取排名图标 - 使用与移动端一致的奖章图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      case 4:
        return '4';
      case 5:
        return '5';
      default:
        return rank.toString();
    }
  };

  // 格式化时间显示
  const formatTime = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 格式化分数显示
  const formatScore = (score: number) => {
    return score.toLocaleString();
  };



  // 获取速度标识
  const getSpeedBadge = (speedRank: number | undefined) => {
    try {
      if (!speedRank || speedRank < 1 || speedRank > 5) return null;
      
      const speedText = t(`leaderboard.speedRankFormat.${speedRank}`);
      const badges = {
        1: { icon: '⚡', text: speedText, color: 'text-yellow-400' },
        2: { icon: '🚀', text: speedText, color: 'text-blue-400' },
        3: { icon: '💨', text: speedText, color: 'text-green-400' },
        4: { icon: '🏃', text: speedText, color: 'text-purple-400' },
        5: { icon: '🎯', text: speedText, color: 'text-orange-400' }
      };
      
      return badges[speedRank as keyof typeof badges] || null;
    } catch (error) {
      console.error('[LeaderboardPanel] getSpeedBadge error:', error);
      return null;
    }
  };



  const baseFontSize = panelScale <= 0.5 ? 12 : Math.max(12, 14 * panelScale);
  const titleFontSize = panelScale <= 0.5 ? 16 : Math.max(16, 18 * panelScale);
  const buttonFontSize = panelScale <= 0.5 ? 11 : Math.max(11, 12 * panelScale);

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
      key={`leaderboard-${locale}`}
      className="flex flex-col h-full"
    >
      {/* 个人最佳成绩列表 */}
      <div className="flex-1 overflow-auto space-y-4">
        {/* Top 5 个人最佳成绩 */}
        <div className="bg-[#2A2A2A] rounded-lg p-3 relative">
          {/* 关闭按钮 - 移动到卡片右上角 */}
          <Button
            onClick={() => {
              playButtonClickSound();
              onClose();
            }}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-[#FFD5AB] hover:text-white text-xs px-2 py-1 h-auto"
            style={{ fontSize: buttonFontSize }}
          >
            {t('game.leaderboard.close')}
          </Button>
          
          <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1 pr-12">
            <Trophy className="w-4 h-4" />
            {t('leaderboard.title')}
          </h4>
          {filteredLeaderboard.length === 0 ? (
            <div 
              className="text-center text-[#FFD5AB] opacity-70 py-8"
              style={{ fontSize: baseFontSize }}
            >
              <div className="mb-2">🏆</div>
              <div>{t('leaderboard.empty')}</div>
              <div className="text-xs mt-1 opacity-60">{t('leaderboard.emptyHint')}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeaderboard.slice(0, 5).map((record, index) => (
                <div
                  key={`${record.timestamp}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-black bg-opacity-20 border border-[#FFD5AB] border-opacity-20"
                >
                  {/* 排名图标 */}
                  <div className="flex items-center justify-center w-6 h-10">
                    <span className="text-2xl text-white">
                      {getRankIcon(index + 1)}
                    </span>
                  </div>
                  
                  {/* 游戏信息 - 一行布局 */}
                  <div className="flex-1 min-w-0 text-[#FFD5AB] opacity-70 truncate">
                    <span className="text-xs">{formatTime(record.totalDuration)} · </span>
                    <span className="text-[10px]">{getDifficultyWithShape(record.difficulty)} · {record.difficulty.actualPieces}{t('stats.piecesUnit')}</span>
                  </div>
                  
                  {/* 分数 - 加粗大号 */}
                  <div className="text-[#FFD5AB] text-base font-bold">
                    {formatScore(record.finalScore)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近游戏历史 */}
        <div className="bg-[#2A2A2A] rounded-lg p-3">
          <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('stats.scoreHistory')}
          </h4>
          {sortedHistory.length === 0 ? (
            <div 
              className="text-center text-[#FFD5AB] opacity-70 py-6"
              style={{ fontSize: baseFontSize }}
            >
              <div className="mb-2">⏱️</div>
              <div>{t('stats.noData')}</div>
              <div className="text-xs mt-1 opacity-60">{t('leaderboard.emptyHint')}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHistory.map((record, index) => (
                <div 
                  key={`recent-${record.timestamp}-${index}`}
                  className="flex items-center justify-between p-2 rounded bg-[#333] hover:bg-[#444] cursor-pointer transition-colors text-xs"
                  onClick={() => showRecentGameDetails(record)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#555] flex items-center justify-center text-xs font-bold text-[#FFD5AB]">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-[#FFD5AB] font-medium">{formatScore(record.finalScore)}</div>
                      <div className="text-[#FFD5AB] opacity-60 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          ⏱️ {formatTime(record.totalDuration)}
                        </span>
                        <span className="flex items-center gap-1">
                          🔄 {record.totalRotations}
                        </span>
                        <span className="flex items-center gap-1">
                          💡 {record.hintUsageCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[#FFD5AB] opacity-60 text-xs">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 详情显示 */}
      {showDetails && selectedRecord && (
        <div className="absolute inset-0 bg-[#463E50] z-10">
          <GameRecordDetails 
            record={selectedRecord} 
            onBack={closeDetails}
          />
        </div>
      )}
    </div>
  );
};

export default LeaderboardPanel;