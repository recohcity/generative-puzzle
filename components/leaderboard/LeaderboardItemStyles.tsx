/**
 * 排行榜条目样式组件
 * 提供普通成绩和玩家新入榜成绩的不同视觉样式
 */

import React from 'react';
import { LeaderboardSimplifier } from '@/utils/leaderboard/LeaderboardSimplifier';

export interface LeaderboardItemStylesProps {
  children: React.ReactNode;
  isPlayerNewEntry?: boolean;
  rank: number;
  className?: string;
}

/**
 * 排行榜条目样式包装器
 */
export const LeaderboardItemStyles: React.FC<LeaderboardItemStylesProps> = ({
  children,
  isPlayerNewEntry = false,
  rank,
  className = ''
}) => {
  // 基础样式
  const baseStyles = "flex items-center justify-between p-2 rounded-lg transition-all duration-300";
  
  // 普通成绩样式
  const normalStyles = "bg-black bg-opacity-20 border border-[#FFD5AB] border-opacity-20";
  
  // 玩家新入榜成绩高亮样式
  const playerNewEntryStyles = `
    bg-gradient-to-r from-[#FFD5AB]/30 via-[#FFD5AB]/20 to-[#FFD5AB]/30
    border-2 border-[#FFD5AB]/60
    shadow-lg shadow-[#FFD5AB]/20
    animate-pulse-glow
  `;
  
  // 根据排名获取特殊样式
  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return "ring-2 ring-yellow-400/30";
      case 2:
        return "ring-2 ring-gray-300/30";
      case 3:
        return "ring-2 ring-orange-600/30";
      default:
        return "";
    }
  };
  
  const finalStyles = `
    ${baseStyles}
    ${isPlayerNewEntry ? playerNewEntryStyles : normalStyles}
    ${getRankStyles(rank)}
    ${className}
  `.replace(/\s+/g, ' ').trim();
  
  return (
    <div className={finalStyles}>
      {children}
      {/* 玩家新入榜成绩的额外视觉效果 */}
      {isPlayerNewEntry && (
        <>
          {/* 底部光晕效果 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD5AB] to-transparent opacity-50 rounded-b-lg animate-pulse" />
          {/* 新入榜标识 */}
          <div className="absolute -top-1 -right-1 bg-[#FFD5AB] text-[#2A2A2A] text-xs px-2 py-0.5 rounded-full font-medium shadow-lg animate-bounce">
            NEW
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 排行榜条目内容组件
 */
export interface LeaderboardItemContentProps {
  rank: number;
  score: number;
  duration: number;
  difficulty: string;
  pieces: number;
  date: string;
  isPlayerNewEntry?: boolean;
  onViewDetails?: () => void;
}

export const LeaderboardItemContent: React.FC<LeaderboardItemContentProps> = ({
  rank,
  score,
  duration,
  difficulty,
  pieces,
  date,
  isPlayerNewEntry = false,
  onViewDetails
}) => {
  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 格式化分数
  const formatScore = (score: number) => {
    return score.toLocaleString();
  };
  
  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return rank.toString();
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-3 flex-1">
        {/* 排名图标 - 按2行高度显示 */}
        <div className={`w-8 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
          rank === 1 ? 'bg-yellow-500 text-black' :
          rank === 2 ? 'bg-gray-400 text-black' :
          rank === 3 ? 'bg-orange-600 text-white' :
          'bg-[#555] text-white'
        }`}>
          {getRankIcon(rank)}
        </div>
        
        {/* 成绩信息 - 2行布局 */}
        <div className="flex-1 min-w-0">
          {/* 第一行：分数（与名次字号一样大） */}
          <div className={`text-lg font-medium truncate ${
            isPlayerNewEntry ? 'text-white/80' : 'text-[#FFD5AB]'
          }`}>
            {formatScore(score)}
          </div>
          {/* 第二行：时间和难度（字号较小） */}
          <div className={`text-xs truncate ${
            isPlayerNewEntry ? 'text-[#FFD5AB] opacity-90' : 'text-[#FFD5AB] opacity-60'
          }`}>
            {formatTime(duration)} · {difficulty}：{pieces}片
          </div>
        </div>
      </div>
      
      {/* 日期和操作 */}
      <div className="text-right">
        <div className={`text-xs ${
          isPlayerNewEntry ? 'text-[#FFD5AB] opacity-90' : 'text-[#FFD5AB] opacity-60'
        }`}>
          {date}
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-xs text-[#FFD5AB] hover:text-white mt-1 transition-colors"
          >
            详情
          </button>
        )}
      </div>
    </>
  );
};

export default LeaderboardItemStyles;