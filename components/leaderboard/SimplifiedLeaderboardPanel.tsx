"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Clock, ShieldCheck } from "lucide-react";
import { useTranslation } from '@/contexts/I18nContext';
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useAuth } from "@/contexts/AuthContext";
import VirtualAuthWidget from "@/components/auth/VirtualAuthWidget";
import { GameDataManager } from '@/utils/data/GameDataManager';
import { LeaderboardSimplifier } from '@/utils/leaderboard/LeaderboardSimplifier';
import { LeaderboardItemStyles, LeaderboardItemContent } from './LeaderboardItemStyles';

// 使用统一的GameRecord类型
import { GameRecord } from '@generative-puzzle/game-core';

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
  const { user, isLoading: authLoading } = useAuth();
  
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

  // 获取难度显示文本（统一为数值等级）
  const getDifficultyLabel = (difficulty: { cutCount: number }): string => {
    return t('difficulty.levelLabel', { level: difficulty.cutCount });
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

  // 获取包含形状和切割类型的难度显示文本
  const getDifficultyWithDetails = (difficulty: any): string => {
    const levelText = getDifficultyLabel(difficulty);
    const shapeName = getShapeDisplayName(difficulty?.shapeType);
    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType);
    
    const parts = [levelText];
    if (shapeName) parts.push(shapeName);
    if (cutTypeName) parts.push(cutTypeName);
    
    return parts.join(' · ');
  };

  // 格式化日期显示
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return t('stats.justNow');
    } else if (diffInHours < 24) {
      return t('stats.hoursAgo', { hours: diffInHours });
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
        <div className="text-brand-peach">Loading...</div>
      </div>
    );
  }

  return (
    <div
      key={`simplified-leaderboard-${locale}`}
      className="p-1.5 bg-[#463E50] rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.2)] space-y-1 h-full flex flex-col relative"
    >
      {/* 侧边栏引导遮罩 */}
      {!user && !authLoading && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <VirtualAuthWidget onAuthSuccess={() => console.log('Auth success in simplified panel')} />
          </div>
        </div>
      )}

      {/* 滚动内容区域 */}
      <div className={`flex-1 overflow-y-auto space-y-1 ${!user && !authLoading ? 'grayscale' : ''}`}>
        {/* 简化的Top5个人最佳成绩 */}
        <div className="bg-[#2A2A2A] rounded-lg p-2 relative">
          {/* 关闭按钮 */}
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-brand-peach hover:text-white text-xs px-2 py-1 h-auto"
          >
            {t('common.close')}
          </Button>
          
          <h4 className="text-brand-peach font-medium mb-2 text-sm flex items-center gap-1 pr-12">
            <Trophy className="w-4 h-4" />
            {isMobile ? 'Top 3' : 'Top 5'}
          </h4>

          {simplifiedData.top5Records.length > 0 ? (
            <div className="space-y-1">
              {simplifiedData.top5Records.slice(0, isMobile ? 3 : 5).map((record, index) => {
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
                            <span className="text-lg text-white">
                              {LeaderboardSimplifier.getRankIcon(rank)}
                            </span>
                          </div>
                          <div className="flex flex-col flex-1">
                            {/* 第一行：分数（与名次字号一样大） */}
                            <div className={`text-lg font-medium ${
                              isPlayerNewEntry ? 'text-white' : 'text-brand-peach'
                            }`}>
                              {LeaderboardSimplifier.formatScore(record.finalScore)}
                            </div>
                            {/* 第二行：时间和难度（字号较小） */}
                            <div className="text-brand-peach opacity-70 truncate">
                              <span className="text-xs">{LeaderboardSimplifier.formatTime(record.totalDuration)} · </span>
                              <span className="text-[10px]">{getDifficultyWithDetails(record.difficulty)} · {record.difficulty.actualPieces}{t('stats.piecesUnit')}</span>
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
                          difficulty={getDifficultyWithDetails(record.difficulty)}
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
            <div className="text-brand-peach opacity-60 text-xs text-center py-4">
              {t('leaderboard.empty')}
            </div>
          )}
        </div>

        {/* 最近游戏记录区域 - 移动端使用极简格式 */}
        {lastGameRecord && (
          <div className="bg-[#2A2A2A] rounded-lg p-2">
            <h4 className="text-brand-peach font-medium mb-2 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t('stats.scoreHistory')}
            </h4>
            {isMobile ? (
              // 移动端极简格式
               <div className="flex items-center justify-between py-1 px-1 text-brand-peach">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎮</span>
                  <div className="text-xs flex-1 min-w-0">
                    <div className="truncate">{getDifficultyWithDetails(lastGameRecord.difficulty)} · {lastGameRecord.difficulty.actualPieces}{t('stats.piecesUnit')}</div>
                    <div className="opacity-60">{formatDate(lastGameRecord.timestamp)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-medium">
                    {LeaderboardSimplifier.formatScore(lastGameRecord.finalScore)}
                  </div>
                  <div className="text-xs opacity-60">
                    {LeaderboardSimplifier.formatTime(lastGameRecord.totalDuration)}
                  </div>
                </div>
              </div>
            ) : (
              // 桌面端详细格式
              <div
                className="relative p-4 rounded-lg bg-gradient-to-br from-[#3A3A3A] to-[#2D2D2D] hover:from-[#444] hover:to-[#333] cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-brand-peach group shadow-lg hover:shadow-xl"
                onClick={() => handleViewDetails(lastGameRecord)}
              >
                {/* 主要分数显示 */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-brand-peach font-mono mb-1 tracking-wider">
                    {LeaderboardSimplifier.formatScore(lastGameRecord.finalScore)}
                  </div>
                  <div className="text-sm text-brand-peach opacity-70 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {LeaderboardSimplifier.formatTime(lastGameRecord.totalDuration)}
                  </div>
                </div>

                {/* 游戏统计信息 */}
                <div className="flex items-center justify-center gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1 bg-brand-peach bg-opacity-10 px-2 py-1 rounded">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    <span className="text-brand-peach font-medium">{lastGameRecord.difficulty.actualPieces}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-brand-peach bg-opacity-10 px-2 py-1 rounded">
                    <span className="text-brand-peach font-medium">🔄 {lastGameRecord.totalRotations}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-brand-peach bg-opacity-10 px-2 py-1 rounded">
                    <span className="text-brand-peach font-medium">💡 {lastGameRecord.hintUsageCount}</span>
                  </div>
                </div>

                {/* 难度和日期信息 */}
                <div className="flex items-center justify-between pt-3 border-t border-[#555]">
                  <span className="px-3 py-1 bg-gradient-to-r from-brand-peach to-[#F4C2A1] text-brand-dark text-xs font-medium rounded-full">
                    {getDifficultyWithDetails(lastGameRecord.difficulty)}
                  </span>
                  <div className="text-xs text-brand-peach opacity-60">
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