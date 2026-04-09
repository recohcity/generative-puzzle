import React from 'react';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { Trophy, Clock, RotateCw, Lightbulb, Star, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MobileScoreLayoutProps {
  gameStats: GameStats;
  currentScore: number;
  scoreBreakdown?: ScoreBreakdown;
  isNewRecord?: boolean;
  currentRank?: number;
}

/**
 * 移动端紧凑成绩展示布局 - 升级为 Premium Glassmorphism
 */
export const MobileScoreLayout: React.FC<MobileScoreLayoutProps> = ({
  gameStats,
  currentScore,
  scoreBreakdown,
  isNewRecord,
  currentRank
}) => {
  const { t, locale } = useTranslation();

  const getDifficultyText = (difficulty: any): string => t('difficulty.levelLabel', { level: difficulty.cutCount });

  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType;
    }
  };

  const getDifficultyWithShape = (difficulty: any): string => {
    const shapeName = getShapeDisplayName(difficulty.shapeType);
    const cutTypeName = getCutTypeDisplayName(difficulty.cutType);
    const piecesPart = `${difficulty.actualPieces}${t('stats.piecesUnit')}`;
    return [shapeName, cutTypeName, piecesPart].filter(Boolean).join(' · ');
  };

  const formatScore = (score: number): string => score.toLocaleString();

  const getSpeedRankText = (duration: number): string => {
    const { difficulty } = gameStats;
    const pieceCount = difficulty?.actualPieces || 0;
    const difficultyLevel = difficulty?.cutCount || 1;
    const speedDetails = getSpeedBonusDetails(duration, pieceCount, difficultyLevel);

    if (speedDetails.currentLevel) {
      const levelNameMap: Record<string, { zh: string; en: string }> = {
        '极速': { zh: '极速', en: 'Extreme' },
        '快速': { zh: '快速', en: 'Fast' },
        '良好': { zh: '良好', en: 'Good' },
        '标准': { zh: '标准', en: 'Normal' },
        '一般': { zh: '一般', en: 'Slow' },
        '慢': { zh: '慢', en: 'Slow' }
      };
      return levelNameMap[speedDetails.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || speedDetails.currentLevel.name;
    }
    return 'NORMAL';
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 状态徽章 */}
      {isNewRecord && (
        <div className="mb-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-500/30 px-4 py-1.5 rounded-full animate-bounce">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
            {t('score.newRecord')} · {t('leaderboard.rank', { rank: currentRank || 1 })}
          </span>
        </div>
      )}

      {/* 主分数值 */}
      <div className="text-center mb-6">
        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD5AB] to-[#F68E5F] tracking-tighter tabular-nums drop-shadow-xl">
          {formatScore(currentScore)}
        </div>
        <div className="text-premium-label text-[10px] opacity-40 uppercase tracking-[0.4em] mt-1">{t('score.final')}</div>
      </div>

      {/* 玻璃态成绩详情卡片 */}
      <div className="w-full glass-card p-4 relative overflow-hidden space-y-3.5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD5AB]/5 to-[#F68E5F]/5 pointer-events-none" />
        
        {scoreBreakdown ? (
          <>
            {/* 列表条目 */}
            {[
              { icon: Zap, label: t('score.breakdown.base'), detail: getDifficultyText(gameStats.difficulty), sub: getDifficultyWithShape(gameStats.difficulty), score: scoreBreakdown.baseScore, color: "text-[#FFD5AB]" },
              { icon: Clock, label: t('score.breakdown.timeBonus'), detail: getSpeedRankText(gameStats.totalDuration), sub: t('score.breakdown.timeBonus'), score: scoreBreakdown.timeBonus, color: "text-green-400", isBonus: true },
              { icon: RotateCw, label: t('score.breakdown.rotationScore'), detail: `${gameStats.totalRotations} 次`, sub: t('score.breakdown.rotationScore'), score: scoreBreakdown.rotationScore, color: scoreBreakdown.rotationScore < 0 ? "text-red-400" : "text-blue-400" },
              { icon: Lightbulb, label: t('score.breakdown.hintScore'), detail: `${gameStats.hintUsageCount} 次`, sub: t('score.breakdown.hintScore'), score: scoreBreakdown.hintScore, color: scoreBreakdown.hintScore < 0 ? "text-red-400" : "text-yellow-400" }
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <row.icon className={cn("w-4 h-4 opacity-70", row.color)} />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <div className="text-premium-label text-[9px] opacity-40 uppercase tracking-tight">{row.label}</div>
                    <div className="text-[#FFD5AB] text-[11px] font-bold truncate">{row.detail} <span className="text-[9px] opacity-20 font-normal">({row.sub})</span></div>
                  </div>
                </div>
                <div className={cn("text-xs font-black tabular-nums shrink-0", row.isBonus ? "text-green-400" : (row.score < 0 ? "text-red-400" : "text-[#FFD5AB]/80"))}>
                  {row.score > 0 ? '+' : ''}{formatScore(row.score)}
                </div>
              </div>
            ))}

            <div className="h-[1px] bg-white/10 mx-1" />

            {/* 难度系数 - 下方 */}
            <div className="flex justify-between items-center px-2">
              <span className="text-premium-label text-[10px] opacity-40 uppercase tracking-widest">{t('score.breakdown.multiplier')}</span>
              <span className="text-[#F68E5F] text-lg font-black tracking-tighter">×{scoreBreakdown.difficultyMultiplier.toFixed(2)}</span>
            </div>
          </>
        ) : (
          /* 简化版兜底 */
          <div className="py-6 text-center opacity-40 italic text-xs">
            {t('common.loading')}...
          </div>
        )}
      </div>

      {/* 底部小字 */}
      <div className="mt-4 flex items-center justify-center gap-4 opacity-20">
         <div className="text-[8px] font-bold uppercase tracking-[0.2em]">{getCutTypeDisplayName(gameStats.difficulty.cutType)} Mode</div>
         <div className="w-1 h-1 rounded-full bg-white" />
         <div className="text-[8px] font-bold uppercase tracking-[0.2em]">{formatDuration(gameStats.totalDuration)}</div>
      </div>
    </div>
  );
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default MobileScoreLayout;