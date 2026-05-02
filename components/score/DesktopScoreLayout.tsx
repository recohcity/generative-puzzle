import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStarRating, getBadges } from '@/utils/score/scoreVisualUtils';
import { getDifficultyMetadata } from '@/utils/difficulty/difficultyMetadata';

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
}) => {
  const { t, locale, getRandomCompletionMessage } = useTranslation();
  const fmt = (n: number) => String(n);

  // 计算星级和勋章
  const rank = calculateStarRating(currentScore, gameStats.difficulty?.cutCount || 1);
  const badges = getBadges(
    scoreBreakdown?.timeBonus || 0,
    scoreBreakdown?.rotationEfficiency || 0,
    gameStats.hintUsageCount || 0
  );

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
    return t('score.noReward') || '无';
  };

  const difficultyLine = (() => {
    const d = gameStats.difficulty;
    const parts = [t('difficulty.levelLabel', { level: d.cutCount })];
    const shape = getShapeTypeText(d.shapeType);
    if (shape) parts.push(shape);
    parts.push(`${d.actualPieces}${t('stats.piecesUnit') || '片'}`);
    return parts.join(' · ');
  })();

  const rows = scoreBreakdown ? [
    { label: t('score.breakdown.base'), sub: difficultyLine, value: fmt(scoreBreakdown.baseScore), sign: '' },
    { label: t('score.breakdown.timeBonus'), sub: `${t('score.breakdown.timeSpent')} ${gameStats.totalDuration}s · ${getSpeedBonusText(gameStats.totalDuration)}`, value: fmt(scoreBreakdown.timeBonus), sign: '+' },
    { label: t('score.breakdown.rotationScore'), sub: `${gameStats.totalRotations}/${gameStats.minRotations}`, value: fmt(Math.abs(scoreBreakdown.rotationScore)), sign: scoreBreakdown.rotationScore >= 0 ? '+' : '-' },
    { label: t('score.breakdown.hintScore'), sub: `${gameStats.hintUsageCount}/${scoreBreakdown.hintAllowance}`, value: fmt(Math.abs(scoreBreakdown.hintScore)), sign: scoreBreakdown.hintScore >= 0 ? '+' : '-' },
  ] : [];

  return (
    <div className="flex flex-col w-full gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 py-2 px-2">
      
      {/* 荣耀区 - 难度与描述 */}
      <div className="flex flex-col items-center">
        <div className="relative flex flex-col items-center">
          <div className="flex flex-col items-center">
            <div className="flex items-start gap-1.5">
              <span className="text-[9px] text-white/30 font-bold mt-1.5 uppercase tracking-widest">
                {t('score.breakdown.base')}
              </span>
              <Trophy className="w-10 h-10 drop-shadow-2xl text-brand-orange" />
              <span className="text-4xl font-black tracking-tighter drop-shadow-lg text-brand-peach">
                {t(getDifficultyMetadata(gameStats.difficulty?.cutCount || 1).nameKey)}
              </span>
            </div>
          </div>
          
          <p className="mt-2 text-white/40 text-[11px] font-medium tracking-wide max-w-[220px] text-center leading-relaxed">
            {t(getDifficultyMetadata(gameStats.difficulty?.cutCount || 1).descriptionKey)}
          </p>
        </div>
      </div>

      {/* 核心分数 - 现代无衬线（标准粗细） */}
      <div className="flex flex-col items-center">
        <span className="text-[56px] font-sans font-medium tracking-tighter text-brand-peach leading-none drop-shadow-2xl">
          {fmt(currentScore)}
        </span>
        {isNewRecord && (
          <span className="mt-2 px-2 py-0.5 bg-brand-peach text-brand-dark text-[10px] font-black rounded-md shadow-lg shadow-brand-peach/40 uppercase">
            {t('game.hints.newRecord')}
          </span>
        )}
      </div>

      {/* 能力成就勋章 - 纯净图标与文字 */}
      {badges.length > 0 && (
        <div className="flex justify-center gap-x-8 px-4">
          {badges.map((badge) => (
            <div key={badge.id} className={cn("flex flex-col items-center transition-all hover:scale-110", badge.colorClass)}>
              <span className="text-2xl mb-0.5 filter drop-shadow-md">{badge.icon}</span>
              <span className="text-[10px] font-black tracking-wider text-white/80 uppercase">
                {t(badge.labelKey)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 计分明细 - 单行极简设计 */}
      <div className="w-full flex flex-col gap-3 mt-1 px-2">
        <div className="h-px bg-white/5 w-full" />
        <div className="flex flex-col gap-2.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="text-white/60 font-bold text-[12px] tracking-wide">{row.label}</span>
                <span className="text-white/70 text-[10px] font-medium tracking-tight">• {row.sub}</span>
              </div>
              <span className={cn("tabular-nums font-sans text-[14px] font-bold", row.sign === '-' ? 'text-red-400' : 'text-brand-peach')}>
                {row.sign}{row.value}
              </span>
            </div>
          ))}
        </div>
        
        <div className="h-px bg-white/5 w-full" />
        
        <div className="flex items-center justify-between opacity-40">
          <span className="text-[10px] uppercase font-bold tracking-widest">{t('score.breakdown.multiplier')}</span>
          <span className="text-[13px] font-sans font-bold text-brand-peach">×{scoreBreakdown?.difficultyMultiplier.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default DesktopScoreLayout;