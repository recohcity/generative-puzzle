import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { Trophy } from 'lucide-react';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from '@/lib/utils';

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

export const DesktopScoreLayout: React.FC<DesktopScoreLayoutProps> = ({
  gameStats,
  scoreBreakdown,
  currentScore,
  isNewRecord,
  onClose,
  embedded = false,
}) => {
  const { t, locale } = useTranslation();
  
  // 颜色通过 Tailwind Token (text-brand-peach) 和 CSS 变量 (var(--brand-peach)) 统一管理

  const formatScore = (score: number): string => score.toString();

  const getShapeTypeText = (shapeType?: string): string => {
    if (!shapeType) return '';
    try { return t(`game.shapes.names.${shapeType}`); } catch { return shapeType; }
  };

  const getSpeedBonusText = (duration: number): string => {
    const { difficulty } = gameStats;
    const speedDetails = getSpeedBonusDetails(duration, difficulty?.actualPieces || 0, difficulty?.cutCount || 1);
    
    if (speedDetails.currentLevel) {
      const map: Record<string, { zh: string; en: string }> = {
        '极速': { zh: '极速', en: 'Extreme' }, '快速': { zh: '快速', en: 'Fast' },
        '良好': { zh: '良好', en: 'Good' }, '标准': { zh: '标准', en: 'Normal' },
        '一般': { zh: '一般', en: 'Slow' }, '慢': { zh: '慢', en: 'Too Slow' },
      };
      return map[speedDetails.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || speedDetails.currentLevel.name;
    }
    return t('score.noReward') || '无奖励';
  };

  const subtotal = scoreBreakdown
    ? scoreBreakdown.baseScore + scoreBreakdown.timeBonus + scoreBreakdown.rotationScore + scoreBreakdown.hintScore
    : 0;

  const difficultyLine = (() => {
    const d = gameStats.difficulty;
    const parts = [t('difficulty.levelLabel', { level: d.cutCount })];
    const shape = getShapeTypeText(d.shapeType);
    if (shape) parts.push(shape);
    parts.push(`${d.actualPieces}${t('stats.piecesUnit') || '片'}`);
    return parts.join(' · ');
  })();

  const rows = scoreBreakdown ? [
    { label: t('score.breakdown.base'), sub: difficultyLine, value: formatScore(scoreBreakdown.baseScore), sign: '' },
    { label: t('score.breakdown.timeBonus'), sub: getSpeedBonusText(gameStats.totalDuration), value: formatScore(scoreBreakdown.timeBonus), sign: '+' },
    { label: t('score.breakdown.rotationScore'), sub: `${gameStats.totalRotations}/${gameStats.minRotations}`, value: formatScore(Math.abs(scoreBreakdown.rotationScore)), sign: scoreBreakdown.rotationScore >= 0 ? '+' : '-' },
    { label: t('score.breakdown.hintScore'), sub: `${gameStats.hintUsageCount}/${scoreBreakdown.hintAllowance}`, value: formatScore(Math.abs(scoreBreakdown.hintScore)), sign: scoreBreakdown.hintScore >= 0 ? '+' : '-' },
  ] : [];

  const renderContent = (isModal: boolean) => (
    <div className={cn("flex flex-col w-full animate-in fade-in duration-500", isModal ? "gap-2" : "gap-1")}>
      
      {/* Header Row - Removed transparency from Title and Icon */}
      <div className="flex items-center justify-between w-full px-1 mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Trophy className="shrink-0 text-brand-peach" size={16} />
          <h2 className="text-white/90 font-medium uppercase tracking-[0.1em] leading-none text-[12px] truncate">
            {t('stats.currentGameResult')}
          </h2>
          {isNewRecord && (
            <span className="bg-brand-peach/20 text-brand-peach px-1 py-0.5 rounded text-[8px] font-bold uppercase border border-brand-peach/30 leading-none shrink-0">
              NEW
            </span>
          )}
        </div>
        <div 
          className="tabular-nums tracking-tighter font-medium leading-none text-xl ml-2 shrink-0 text-brand-peach"
        >
          {formatScore(currentScore)}
        </div>
      </div>

      {/* Main Score Card — Border Only */}
      <div className={cn(
        "w-full border border-white/10 rounded-2xl bg-transparent mb-1",
        isModal ? "p-6" : "p-3.5 px-3" 
      )}>
        <div className="space-y-3">
          {/* Detail Rows */}
          <div className="space-y-1.5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-baseline justify-between leading-none py-0.5 w-full overflow-hidden">
                <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-1.5 overflow-hidden">
                  <span className="text-white/70 shrink-0 font-medium text-[12px]">
                    {row.label}
                  </span>
                  <span className="text-white/15 truncate uppercase font-medium text-[10px] hidden sm:inline">
                    {row.sub}
                  </span>
                </div>
                <span 
                  className={cn("tabular-nums shrink-0 font-medium text-[13px] text-right", row.sign === '-' ? 'text-red-400' : 'text-brand-peach')}
                >
                  {row.sign}{row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 w-full opacity-15" />

          {/* Subtotal & Final */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white/30 uppercase tracking-tight font-medium text-[10px]">
                {t('score.breakdown.subtotal')}
              </span>
              <span className="text-white/40 tabular-nums font-medium text-[12px]">
                {formatScore(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/30 uppercase tracking-tight font-medium text-[10px]">
                {t('score.breakdown.multiplier')}
              </span>
              <span className="tabular-nums font-medium text-[12px] text-brand-peach/80">
                ×{(scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}
              </span>
            </div>

            <div className="border-t border-white/5 flex items-baseline justify-between pt-2.5 mt-1">
              <span className="text-white/60 uppercase tracking-widest font-medium text-[12px]">
                {t('score.breakdown.final')}
              </span>
              <span 
                className="tabular-nums tracking-tight font-medium leading-none text-lg text-brand-peach"
              >
                {formatScore(currentScore)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {onClose && isModal && (
        <button 
          onClick={onClose} 
          className="mt-4 w-full h-10 rounded-xl bg-white/5 border border-white/10 text-brand-peach font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-xs"
        >
          {t('common.close') || 'Close'}
        </button>
      )}
    </div>
  );

  return (
    <div className={cn(embedded ? "w-full" : "max-w-lg mx-auto")}>
      {renderContent(!embedded)}
    </div>
  );
};

export default DesktopScoreLayout;