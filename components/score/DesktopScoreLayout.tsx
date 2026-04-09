import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { Trophy, Star } from 'lucide-react';
import { calculateRotationEfficiencyPercentage, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { RotationEfficiencyCalculator } from '@generative-puzzle/game-core';
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
  currentRank,
  onClose,
  showAnimation = true,
  embedded = false,
}) => {
  const { t, locale } = useTranslation();

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatScore = (score: number): string => score.toLocaleString();

  const getCutTypeText = (cutType: string): string => {
    try { return t(`cutType.${cutType}`); } catch { return cutType; }
  };

  const getShapeTypeText = (shapeType?: string): string => {
    if (!shapeType) return '';
    try { return t(`game.shapes.names.${shapeType}`); } catch { return shapeType; }
  };

  const getCutTypeMultiplier = (cutType?: string): number => {
    const m: Record<string, number> = { straight: 1.0, diagonal: 1.15, curve: 1.25 };
    return m[cutType || 'straight'] || 1.0;
  };

  const getShapeTypeMultiplier = (shapeType?: string): number => {
    const m: Record<string, number> = { polygon: 1.0, cloud: 1.1, jagged: 1.05 };
    return m[shapeType || 'polygon'] || 1.0;
  };

  const getMultiplierBreakdown = (difficulty: any, multiplier: number): string => {
    const cutMult = getCutTypeMultiplier(difficulty.cutType);
    const shapeMult = getShapeTypeMultiplier(difficulty.shapeType);
    const baseMult = multiplier / cutMult / shapeMult;
    const baseLabel = t('score.breakdown.baseMultiplier');
    return `${baseLabel}${baseMult.toFixed(2)} × ${getCutTypeText(difficulty.cutType)}${cutMult.toFixed(2)} × ${getShapeTypeText(difficulty.shapeType)}${shapeMult.toFixed(2)}`;
  };

  const getRotationRatingText = (actual: number, optimal: number): string => {
    if (!optimal) return '';
    try {
      const result = RotationEfficiencyCalculator.calculateScore(actual, optimal);
      if (result.isPerfect) return t('rotation.perfect') || (locale === 'en' ? 'Perfect' : '完美');
      return t('rotation.excess', { count: result.excessRotations }) || `超出${result.excessRotations}次`;
    } catch {
      const eff = calculateRotationEfficiencyPercentage(actual, optimal);
      return eff >= 100 ? (locale === 'en' ? 'Perfect' : '完美') : (locale === 'en' ? `+${actual - optimal}` : `超出${actual - optimal}次`);
    }
  };

  const getSpeedBonusText = (duration: number): string => {
    const { difficulty } = gameStats;
    const speedDetails = getSpeedBonusDetails(duration, difficulty?.actualPieces || 0, difficulty?.cutCount || 1);
    const fmtTime = (s: number) => {
      if (s < 60) return locale === 'en' ? `${s}s` : `${s}秒`;
      const m = Math.floor(s / 60), r = s % 60;
      return locale === 'en' ? `${m}m${r > 0 ? `${r}s` : ''}` : `${m}分${r > 0 ? `${r}秒` : ''}`;
    };
    if (speedDetails.currentLevel) {
      const map: Record<string, { zh: string; en: string }> = {
        '极速': { zh: '极速', en: 'Extreme' }, '快速': { zh: '快速', en: 'Fast' },
        '良好': { zh: '良好', en: 'Good' }, '标准': { zh: '标准', en: 'Normal' },
        '一般': { zh: '一般', en: 'Slow' }, '慢': { zh: '慢', en: 'Too Slow' },
      };
      const name = map[speedDetails.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || speedDetails.currentLevel.name;
      return locale === 'en' ? `${name} (under ${fmtTime(speedDetails.currentLevel.maxTime)})` : `${name}（少于${fmtTime(speedDetails.currentLevel.maxTime)}内）`;
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
    const cut = getCutTypeText(d.cutType);
    if (shape) parts.push(shape);
    if (cut) parts.push(cut);
    parts.push(`${d.actualPieces}${t('stats.piecesUnit') || '片'}`);
    return parts.join(' · ');
  })();

  const gameTimestamp = new Date(gameStats.gameStartTime || Date.now()).toLocaleString(
    locale === 'zh-CN' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );

  const rows = scoreBreakdown ? [
    {
      label: t('score.breakdown.base') || '难度得分',
      sub: difficultyLine,
      value: formatScore(scoreBreakdown.baseScore),
      color: 'text-[#FFD5AB]',
      sign: '',
    },
    {
      label: t('score.breakdown.timeBonus') || '速度加成',
      sub: getSpeedBonusText(gameStats.totalDuration),
      value: formatScore(scoreBreakdown.timeBonus),
      color: 'text-[#FFD5AB]',
      sign: '+',
    },
    {
      label: t('score.breakdown.rotationScore') || '旋转',
      sub: `${gameStats.totalRotations} / ${gameStats.minRotations || 0} · ${getRotationRatingText(gameStats.totalRotations, gameStats.minRotations)}`,
      value: formatScore(scoreBreakdown.rotationScore),
      color: scoreBreakdown.rotationScore >= 0 ? 'text-[#FFD5AB]' : 'text-[#FF8A80]',
      sign: scoreBreakdown.rotationScore >= 0 ? '+' : '',
    },
    {
      label: t('score.breakdown.hintScore') || '提示',
      sub: `${gameStats.hintUsageCount} / ${gameStats.hintAllowance || 0}${t('leaderboard.timesUnit') || '次'}`,
      value: formatScore(scoreBreakdown.hintScore),
      color: scoreBreakdown.hintScore >= 0 ? 'text-[#FFD5AB]' : 'text-[#FF8A80]',
      sign: scoreBreakdown.hintScore >= 0 ? '+' : '',
    },
  ] : [];

  /* ─── EMBEDDED mode (inside desktop side panel) ─── */
  if (embedded) {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
          <h2 className="text-premium-title text-sm uppercase tracking-widest">
            {t('stats.gameComplete')}
          </h2>
          {isNewRecord && (
            <div className="ml-auto inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-2.5 py-0.5 rounded-full text-[10px] font-black animate-pulse-slow uppercase tracking-wide">
              <Star className="w-3 h-3" />
              {t('score.newRecord') || 'New Record'}
            </div>
          )}
        </div>

        {/* Card — no backdrop-blur */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          {/* Hero score */}
          <div className="pt-5 pb-3 px-4 text-center">
            <div className={cn('text-4xl font-black text-[#FFD5AB] tracking-tight tabular-nums', showAnimation && 'scoreCountUpAnimation')}>
              {formatScore(currentScore)}
            </div>
            <div className="text-[#FFD5AB]/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">
              {formatDuration(gameStats.totalDuration)} · {difficultyLine}
            </div>
          </div>

          {/* Breakdown */}
          {scoreBreakdown && (
            <div className="px-4 pb-4">
              <div className="h-px bg-white/8 mb-3" />

              {rows.map((row, i) => (
                <div key={i} className="flex items-baseline justify-between py-1.5">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[#FFD5AB]/60 text-xs font-medium">{row.label}</span>
                    <span className="text-[#FFD5AB]/25 text-[10px] ml-1.5 truncate">{row.sub}</span>
                  </div>
                  <span className={cn('text-xs font-black tabular-nums shrink-0', row.color)}>
                    {row.sign}{row.value}
                  </span>
                </div>
              ))}

              <div className="h-px bg-white/8 mt-1 mb-2" />
              <div className="flex items-baseline justify-between py-1">
                <span className="text-[#FFD5AB]/50 text-xs font-bold uppercase tracking-widest">
                  {t('score.breakdown.subtotal') || '小计'}
                </span>
                <span className="text-[#FFD5AB]/70 text-xs font-black tabular-nums">
                  {formatScore(subtotal)}
                </span>
              </div>

              <div className="flex items-start justify-between py-1">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-[#FFD5AB]/50 text-xs font-bold uppercase tracking-widest">
                    {t('score.breakdown.multiplier') || '难度系数'}
                  </span>
                  <div className="text-[#FFD5AB]/20 text-[10px] leading-tight mt-0.5 truncate italic">
                    {getMultiplierBreakdown(gameStats.difficulty, scoreBreakdown.difficultyMultiplier)}
                  </div>
                </div>
                <span className="text-[#F68E5F] text-xs font-black tabular-nums shrink-0">
                  ×{scoreBreakdown.difficultyMultiplier.toFixed(2)}
                </span>
              </div>

              <div className="h-px bg-white/8 mt-1 mb-2" />
              <div className="flex items-baseline justify-between py-1.5">
                <span className="text-[#FFD5AB] text-sm font-black uppercase tracking-widest">
                  {t('score.breakdown.final') || '最终得分'}
                </span>
                <span className="text-[#FFD5AB] text-xl font-black tabular-nums tracking-tight">
                  {formatScore(currentScore)}
                </span>
              </div>

              <div className="pt-2 pb-0.5 text-center">
                <span className="text-[#FFD5AB]/20 text-[10px] tracking-widest">{gameTimestamp}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── MODAL mode ─── */
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-0 overflow-hidden max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 id="score-display-title" className="text-premium-title text-sm uppercase tracking-widest">
            {t('stats.gameComplete')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isNewRecord && (
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-2.5 py-0.5 rounded-full text-[10px] font-black animate-pulse-slow uppercase">
              <Star className="w-3 h-3" /> {t('score.newRecord')}
            </div>
          )}
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#FFD5AB]/40 hover:text-[#FFD5AB] hover:bg-white/10 transition-all text-sm" aria-label={t('common.close') || 'Close'}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="pb-3 px-5 text-center">
        <div className={cn('text-4xl font-black text-[#FFD5AB] tracking-tight tabular-nums', showAnimation && 'scoreCountUpAnimation')}>
          {formatScore(currentScore)}
        </div>
        <div className="text-[#FFD5AB]/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">
          {formatDuration(gameStats.totalDuration)} · {difficultyLine}
        </div>
      </div>

      {/* Breakdown */}
      {scoreBreakdown && (
        <div className="px-5 pb-5">
          <div className="h-px bg-white/8 mb-3" />
          {rows.map((row, i) => (
            <div key={i} className="flex items-baseline justify-between py-1.5">
              <div className="flex-1 min-w-0 pr-2">
                <span className="text-[#FFD5AB]/60 text-xs font-medium">{row.label}</span>
                <span className="text-[#FFD5AB]/25 text-[10px] ml-1.5 truncate">{row.sub}</span>
              </div>
              <span className={cn('text-xs font-black tabular-nums shrink-0', row.color)}>
                {row.sign}{row.value}
              </span>
            </div>
          ))}
          <div className="h-px bg-white/8 mt-1 mb-2" />
          <div className="flex items-baseline justify-between py-1">
            <span className="text-[#FFD5AB]/50 text-xs font-bold uppercase tracking-widest">{t('score.breakdown.subtotal') || '小计'}</span>
            <span className="text-[#FFD5AB]/70 text-xs font-black tabular-nums">{formatScore(subtotal)}</span>
          </div>
          <div className="flex items-start justify-between py-1">
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-[#FFD5AB]/50 text-xs font-bold uppercase tracking-widest">{t('score.breakdown.multiplier') || '难度系数'}</span>
              <div className="text-[#FFD5AB]/20 text-[10px] leading-tight mt-0.5 truncate italic">
                {getMultiplierBreakdown(gameStats.difficulty, scoreBreakdown.difficultyMultiplier)}
              </div>
            </div>
            <span className="text-[#F68E5F] text-xs font-black tabular-nums shrink-0">×{scoreBreakdown.difficultyMultiplier.toFixed(2)}</span>
          </div>
          <div className="h-px bg-white/8 mt-1 mb-2" />
          <div className="flex items-baseline justify-between py-1.5">
            <span className="text-[#FFD5AB] text-sm font-black uppercase tracking-widest">{t('score.breakdown.final') || '最终得分'}</span>
            <span className="text-[#FFD5AB] text-xl font-black tabular-nums tracking-tight">{formatScore(currentScore)}</span>
          </div>
          <div className="pt-2 pb-0.5 text-center">
            <span className="text-[#FFD5AB]/20 text-[10px] tracking-widest">{gameTimestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopScoreLayout;