"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Clock } from "lucide-react";
import { useTranslation } from '@/contexts/I18nContext';
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { GameDataManager } from '@/utils/data/GameDataManager';
import { LeaderboardSimplifier } from '@/utils/leaderboard/LeaderboardSimplifier';
import { LeaderboardItemStyles, LeaderboardItemContent } from './LeaderboardItemStyles';

// 使用统一的GameRecord类型
import { GameRecord } from '@/types/puzzleTypes';

interface SimplifiedLeaderboardPanelProps {
  onClose: () => void;
  onViewDetails?: (record: GameRecord) => void;
  isMobile?: boolean;
}

const SimplifiedLeaderboardPanel: React.FC<SimplifiedLeaderboardPanelProps> = ({ 
  onClose, 
  onViewDetails,
  isMobile = false 
}) => {
  const { t, locale, isLoading } = useTranslation();
  
  const [leaderboardData, setLeaderboardData] = useState<GameRecord[]>([]);
  const [lastGameRecord, setLastGameRecord] = useState<GameRecord | null>(null);

  // 加载数据
  useEffect(() => {
    // 获取所有历史记录用于准确的排名计算
    const allRecords = GameDataManager.getGameHistory();
    const lastGame = GameDataManager.getLastGameRecord();
    
    setLeaderboardData(allRecords);
    setLastGameRecord(lastGame);
  }, []);

  // 处理简化榜单数据 - 只显示前5名，不区分难度
  const simplifiedData = useMemo(() => {
    const lastGameTimestamp = lastGameRecord?.timestamp || lastGameRecord?.gameStartTime || null;
    return LeaderboardSimplifier.processSimplifiedLeaderboard(leaderboardData, lastGameTimestamp);
  }, [leaderboardData, lastGameRecord]);

  // 获取难度显示文本
  const getDifficultyText = (difficulty: string): string => {
    const levelMap: Record<string, string> = {
      'easy': '简单',
      'medium': '中等', 
      'hard': '困难',
      'extreme': '极难'
    };
    return levelMap[difficulty] || difficulty;
  };

  // 格式化日期显示
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 处理关闭
  const handleClose = () => {
    playButtonClickSound();
    onClose();
  };

  // 处理查看详情
  const handleViewDetails = (record: GameRecord) => {
    playButtonClickSound();
    if (onViewDetails) {
      onViewDetails(record);
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
      key={`simplified-leaderboard-${locale}`}
      className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] space-y-1 h-full flex flex-col"
    >
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {/* 简化的Top5排行榜 */}
        <div className="bg-[#2A2A2A] rounded-lg p-2 relative">
          {/* 关闭按钮 */}
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-[#FFD5AB] hover:text-white text-xs px-2 py-1 h-auto"
          >
            关闭
          </Button>
          
          <h4 className="text-[#FFD5AB] font-medium mb-2 text-sm flex items-center gap-1 pr-12">
            <Trophy className="w-4 h-4" />
            前5名
          </h4>

          {simplifiedData.top5Records.length > 0 ? (
            <div className="space-y-1">
              {simplifiedData.top5Records.map((record, index) => {
                const rank = index + 1;
                const isPlayerNewEntry = simplifiedData.playerNewEntry?.timestamp === record.timestamp;
                
                return (
                  <div key={record.id || record.timestamp} className="relative">
                    {isMobile ? (
                      // 移动端2行格式：名次和分数同行，时间难度另一行
                      <div className={`flex items-center justify-between py-2 px-2 rounded-lg ${
                        isPlayerNewEntry 
                          ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/30' 
                          : 'bg-[#1A1A1A] border border-[#333]'
                      }`}>
                        <div className="flex items-center gap-3 flex-1">
                          {/* 排名图标 - 按2行高度显示 */}
                          <div className="flex items-center justify-center w-8 h-10">
                            <span className="text-lg">
                              {LeaderboardSimplifier.getRankIcon(rank)}
                            </span>
                          </div>
                          <div className="flex flex-col flex-1">
                            {/* 第一行：分数（与名次字号一样大） */}
                            <div className={`text-lg font-medium ${
                              isPlayerNewEntry ? 'text-white' : 'text-[#FFD5AB]'
                            }`}>
                              {LeaderboardSimplifier.formatScore(record.finalScore)}
                            </div>
                            {/* 第二行：时间和难度（字号较小） */}
                            <div className="text-xs text-[#FFD5AB] opacity-70">
                              {LeaderboardSimplifier.formatTime(record.totalDuration)} • {getDifficultyText(record.difficulty.difficultyLevel)}：{record.difficulty.actualPieces}片
                            </div>
                          </div>
                        </div>
                        {isPlayerNewEntry && (
                          <div className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-bold">
                            NEW
                          </div>
                        )}
                      </div>
                    ) : (
                      // 桌面端保持卡片格式
                      <LeaderboardItemStyles
                        isPlayerNewEntry={isPlayerNewEntry}
                        rank={rank}
                      >
                        <LeaderboardItemContent
                          rank={rank}
                          score={record.finalScore}
                          duration={record.totalDuration}
                          difficulty={getDifficultyText(record.difficulty.difficultyLevel)}
                          pieces={record.difficulty.actualPieces}
                          date={formatDate(record.timestamp)}
                          isPlayerNewEntry={isPlayerNewEntry}
                          onViewDetails={onViewDetails ? () => handleViewDetails(record) : undefined}
                        />
                      </LeaderboardItemStyles>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[#FFD5AB] opacity-60 text-xs text-center py-4">
              暂无排行榜数据
            </div>
          )}
        </div>

        {/* 最近游戏记录区域 - 移动端使用极简格式 */}
        {lastGameRecord && (
          <div className="bg-[#2A2A2A] rounded-lg p-2">
            <h4 className="text-[#FFD5AB] font-medium mb-2 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              最近游戏
            </h4>
            {isMobile ? (
              // 移动端极简格式
              <div className="flex items-center justify-between py-1 px-1 text-[#FFD5AB]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎮</span>
                  <div className="text-xs">
                    <div>{getDifficultyText(lastGameRecord.difficulty.difficultyLevel)} • {lastGameRecord.difficulty.actualPieces}片</div>
                    <div className="opacity-60">{formatDate(lastGameRecord.timestamp)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-medium">
                    {LeaderboardSimplifier.formatScore(lastGameRecord.finalScore)}分
                  </div>
                  <div className="text-xs opacity-60">
                    {LeaderboardSimplifier.formatTime(lastGameRecord.totalDuration)}
                  </div>
                </div>
              </div>
            ) : (
              // 桌面端详细格式
              <div
                className="relative p-4 rounded-lg bg-gradient-to-br from-[#3A3A3A] to-[#2D2D2D] hover:from-[#444] hover:to-[#333] cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-[#FFD5AB] group shadow-lg hover:shadow-xl"
                onClick={() => handleViewDetails(lastGameRecord)}
              >
                {/* 主要分数显示 */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-[#FFD5AB] font-mono mb-1 tracking-wider">
                    {LeaderboardSimplifier.formatScore(lastGameRecord.finalScore)}
                  </div>
                  <div className="text-sm text-[#FFD5AB] opacity-70 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {LeaderboardSimplifier.formatTime(lastGameRecord.totalDuration)}
                  </div>
                </div>

                {/* 游戏统计信息 */}
                <div className="flex items-center justify-center gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    <span className="text-[#FFD5AB] font-medium">{lastGameRecord.difficulty.actualPieces}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                    <span className="text-[#FFD5AB] font-medium">🔄 {lastGameRecord.totalRotations}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#FFD5AB] bg-opacity-10 px-2 py-1 rounded">
                    <span className="text-[#FFD5AB] font-medium">💡 {lastGameRecord.hintUsageCount}</span>
                  </div>
                </div>

                {/* 难度和日期信息 */}
                <div className="flex items-center justify-between pt-3 border-t border-[#555]">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#FFD5AB] to-[#F4C2A1] text-[#2A2A2A] text-xs font-medium rounded-full">
                    {getDifficultyText(lastGameRecord.difficulty.difficultyLevel)}
                  </span>
                  <div className="text-xs text-[#FFD5AB] opacity-60">
                    {formatDate(lastGameRecord.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedLeaderboardPanel;