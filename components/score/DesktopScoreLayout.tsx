import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { Trophy, Clock, RotateCw, Lightbulb, Move, X, Star, Layers, Activity } from 'lucide-react';
import { calculateRotationEfficiencyPercentage, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { RotationEfficiencyCalculator } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";

import './animations.css';

interface DesktopScoreLayoutProps {
  gameStats: GameStats;
  scoreBreakdown?: ScoreBreakdown;
  currentScore: number;
  isNewRecord?: boolean;
  currentRank?: number;
  onClose?: () => void;
  showAnimation?: boolean;
  embedded?: boolean;
}

/**
 * 桌面端详细分数展示布局 - 升级为 Premium Glassmorphism
 */
export const DesktopScoreLayout: React.FC<DesktopScoreLayoutProps> = ({
  gameStats,
  scoreBreakdown,
  currentScore,
  isNewRecord,
  currentRank,
  onClose,
  showAnimation = true,
  embedded = false
}) => {
  const { t, locale } = useTranslation();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatScore = (score: number): string => score.toLocaleString();

  const getDifficultyLabel = (difficulty: any): string => t('difficulty.levelLabel', { level: difficulty.cutCount });

  const getCutTypeText = (cutType: string): string => { 
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType === 'diagonal' ? '斜线' : cutType === 'curve' ? '曲线' : '直线';
    }
  };

  const getShapeTypeText = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  const getSpeedBonusText = (duration: number): string => {
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
        '慢': { zh: '慢', en: 'Too Slow' }
      };
      return levelNameMap[speedDetails.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || speedDetails.currentLevel.name;
    }
    return 'STANDARD';
  };

  const containerClass = cn(
    "relative flex flex-col overflow-hidden transition-all duration-500",
    embedded 
      ? "bg-transparent w-full" 
      : "glass-panel max-w-2xl mx-auto shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-white/10"
  );

  return (
    <div className={containerClass}>
      {/* 炫酷背景光效 (仅模态模式) */}
      {!embedded && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#FFD5AB]/10 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#F68E5F]/10 rounded-full blur-[100px] animate-pulse-slow" />
        </div>
      )}

      {/* 标题栏 */}
      <div className={cn(
        "relative z-10 flex items-center justify-between p-6 shrink-0",
        !embedded && "border-b border-white/10 bg-white/5"
      )}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(246,142,95,0.4)]">
            <Trophy className="w-7 h-7 text-white drop-shadow-md" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#FFD5AB] tracking-wider uppercase">
              {t('stats.gameComplete')}
            </h2>
            {isNewRecord && (
              <div className="flex items-center gap-1.5 mt-0.5 animate-bounce">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                  {t('score.newRecord')} · {t('leaderboard.rank', { rank: currentRank || 1 })}
                </span>
              </div>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 transition-all group"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-[#FFD5AB]/60 group-hover:text-[#FFD5AB] group-hover:rotate-90 transition-all" />
          </button>
        )}
      </div>

      <div className="relative z-10 p-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
        {/* 最终得分大火花 */}
        <div className="text-center py-4 relative">
          <div className="inline-block relative">
             <div className="absolute inset-0 bg-[#FFD5AB]/20 blur-2xl rounded-full scale-150 animate-pulse" />
             <div className="relative text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD5AB] via-[#FFD5AB] to-[#F68E5F] tracking-tighter tabular-nums drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]">
               {showAnimation ? <span className="scoreCountUpAnimation">{formatScore(currentScore)}</span> : formatScore(currentScore)}
             </div>
          </div>
          <div className="text-premium-label mt-2 tracking-[0.3em] opacity-40 uppercase text-xs">
            {t('score.final')}
          </div>
        </div>

        {/* 核心数据网格 */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Clock, color: "from-blue-400 to-blue-600", val: formatDuration(gameStats.totalDuration), label: t('stats.duration') },
            { icon: RotateCw, color: "from-green-400 to-green-600", val: gameStats.totalRotations, sub: gameStats.minRotations ? `/ ${gameStats.minRotations}` : "", label: t('stats.rotations') },
            { icon: Lightbulb, color: "from-yellow-400 to-yellow-600", val: gameStats.hintUsageCount, sub: gameStats.hintAllowance ? `/ ${gameStats.hintAllowance}` : "", label: t('stats.hints') },
            { icon: Move, color: "from-purple-400 to-purple-600", val: gameStats.dragOperations, label: t('stats.drags') }
          ].map((item, i) => (
             <div key={i} className="glass-card p-4 text-center group hover:bg-white/[0.08] transition-all duration-300">
               <div className={cn("w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center bg-gradient-to-br border border-white/10 shadow-lg group-hover:scale-110 transition-transform", item.color)}>
                 <item.icon className="w-5 h-5 text-white" />
               </div>
               <div className="text-lg font-black text-[#FFD5AB] tabular-nums">
                 {item.val} <span className="text-[10px] opacity-30 font-medium">{item.sub}</span>
               </div>
               <div className="text-[9px] text-premium-label opacity-40 uppercase tracking-wider mt-1">{item.label}</div>
             </div>
          ))}
        </div>

        {/* 计分分解 - 重点美化 */}
        {scoreBreakdown && (
          <div className="glass-panel border-white/5 bg-black/20 p-6 space-y-5">
            <h3 className="text-premium-title text-sm flex items-center gap-2 uppercase tracking-widest px-1">
              <Activity className="w-4 h-4 text-[#F68E5F]" />
              {t('score.details') || '分数分解'}
            </h3>
            
            <div className="space-y-3">
              {/* 各项明细 */}
              {[
                { label: t('score.breakdown.base'), sub: getDifficultyLabel(gameStats.difficulty), score: scoreBreakdown.baseScore, icon: Layers, iconColor: "text-blue-400" },
                { label: t('score.breakdown.timeBonus'), sub: getSpeedBonusText(gameStats.totalDuration), score: scoreBreakdown.timeBonus, icon: Clock, iconColor: "text-green-400", isBonus: true },
                { label: t('score.breakdown.rotationScore'), sub: `${gameStats.totalRotations} 次`, score: scoreBreakdown.rotationScore, icon: RotateCw, iconColor: "text-blue-300" },
                { label: t('score.breakdown.hintScore'), sub: `${gameStats.hintUsageCount} 次`, score: scoreBreakdown.hintScore, icon: Lightbulb, iconColor: "text-yellow-400" }
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <row.icon className={cn("w-4 h-4 opacity-70", row.iconColor)} />
                    <div>
                      <div className="text-premium-label text-[10px] opacity-40 uppercase">{row.label}</div>
                      <div className="text-[#FFD5AB] text-xs font-bold">{row.sub}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-sm tabular-nums",
                    row.isBonus ? "text-green-400" : (row.score < 0 ? "text-red-400" : "text-[#FFD5AB]/90")
                  )}>
                    {row.score > 0 ? '+' : ''}{formatScore(row.score)}
                  </div>
                </div>
              ))}

              <div className="h-[1px] bg-white/10 my-4" />

              {/* 难度系数区块 */}
              <div className="flex items-center justify-between px-3">
                <div className="flex flex-col">
                  <span className="text-premium-label text-[11px] opacity-60 uppercase">{t('score.breakdown.multiplier')}</span>
                  <span className="text-[9px] text-[#FFD5AB]/20 italic">{getShapeTypeText(gameStats.difficulty.shapeType)} · {getCutTypeText(gameStats.difficulty.cutType)}</span>
                </div>
                <div className="text-[#F68E5F] font-black text-2xl tracking-tighter">
                  ×{scoreBreakdown.difficultyMultiplier.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 底部信息提示 */}
        <div className="flex items-center justify-between px-2 opacity-30 text-[9px] font-bold text-premium-label uppercase tracking-widest">
           <span>{t('stats.pieces')}: {gameStats.difficulty.actualPieces}P</span>
           <span>|</span>
           <span>{t('stats.device')}: {gameStats.deviceType || 'PC'}</span>
           <span>|</span>
           <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default DesktopScoreLayout;