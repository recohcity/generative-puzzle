import React from 'react';
import { GameStats, ScoreBreakdown, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { useTranslation } from '@/contexts/I18nContext';
import { cn } from "@/lib/utils";
import { Trophy, Star, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { calculateStarRating, getBadges } from '@/utils/score/scoreVisualUtils';
import { getDifficultyMetadata } from '@/utils/difficulty/difficultyMetadata';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface MobileScoreLayoutProps {
  gameStats: GameStats;
  currentScore: number;
  scoreBreakdown?: ScoreBreakdown;
  isNewRecord?: boolean;
  currentRank?: number;
  isLandscape?: boolean;
  hideHeader?: boolean;
  onRetry?: () => void;
  onRestart?: () => void;
}

export const MobileScoreLayout: React.FC<MobileScoreLayoutProps> = ({
  gameStats,
  currentScore,
  scoreBreakdown,
  isNewRecord,
  isLandscape = false,
  hideHeader = false,
  onRetry,
  onRestart,
}) => {
  const { t, locale, getRandomCompletionMessage } = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);
  const device = useDeviceDetection();
  const isPhone = device.deviceType === 'phone';

  const fmt = (n: number) => n.toString();
  
  // 计算星级和勋章
  const rank = calculateStarRating(currentScore, gameStats.difficulty?.cutCount || 1);
  const badges = getBadges(
    scoreBreakdown?.timeBonus || 0,
    scoreBreakdown?.rotationEfficiency || 0,
    gameStats.hintUsageCount || 0
  );

  const getShape = (s?: string) => { try { return s ? t(`game.shapes.names.${s}`) : ''; } catch { return s || ''; } };

  const getSpeedLevelText = (duration: number): string => {
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
    const shape = getShape(d.shapeType);
    if (shape) parts.push(shape);
    parts.push(`${d.actualPieces}${t('stats.piecesUnit') || '片'}`);
    return parts.join(' · ');
  })();
  
  const rows = scoreBreakdown ? [
    { label: t('score.breakdown.base'), sub: difficultyLine, value: fmt(scoreBreakdown.baseScore), sign: '' },
    { label: t('score.breakdown.timeBonus'), sub: `${t('score.breakdown.timeSpent')} ${gameStats.totalDuration}s · ${getSpeedLevelText(gameStats.totalDuration)}`, value: fmt(scoreBreakdown.timeBonus), sign: '+' },
    { label: t('score.breakdown.rotationScore'), sub: `${gameStats.totalRotations}/${gameStats.minRotations}`, value: fmt(Math.abs(scoreBreakdown.rotationScore)), sign: scoreBreakdown.rotationScore >= 0 ? '+' : '-' },
    { label: t('score.breakdown.hintScore'), sub: `${gameStats.hintUsageCount}/${scoreBreakdown.hintAllowance}`, value: fmt(Math.abs(scoreBreakdown.hintScore)), sign: scoreBreakdown.hintScore >= 0 ? '+' : '-' },
  ] : [];

  if (isLandscape) {
    const diffMeta = getDifficultyMetadata(gameStats.difficulty?.cutCount || 1);
    return (
      <div className="flex flex-row items-stretch w-full gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 py-1 min-h-[220px]">
        {/* Zone 1: 左侧 - 奖杯荣誉 (精致化) */}
        <div className="flex-[0.5] flex flex-col items-center justify-start pt-4 pr-3 border-r border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
            <Trophy className="w-8 h-8 text-brand-dark relative" />
          </div>
        </div>

        {/* Zone 2: 中间 - 核心成就区 (极致紧凑与样式统一) */}
        <div className="flex-[2] flex flex-col items-center justify-center px-4 border-r border-white/5 py-1 gap-2">
          <div className="flex flex-col items-center">
            <div className="flex items-start gap-1.5">
              <span className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-widest">{t('score.breakdown.base')}</span>
              <h2 className={cn("text-4xl font-black tracking-tighter drop-shadow-sm leading-none text-brand-peach")}>
                {t(diffMeta.nameKey)}
              </h2>
            </div>
            <p className="mt-1 text-white/30 text-[9px] font-medium tracking-wide text-center leading-tight max-w-[180px]">
              {t(diffMeta.descriptionKey)}
            </p>
          </div>

          <div className="flex flex-col items-center mt-1">
            <div className="relative flex flex-col items-center">
              <span className="text-[56px] font-sans font-medium tracking-tighter text-white tabular-nums drop-shadow-[0_8px_24px_rgba(255,255,255,0.15)] leading-none">
                {fmt(currentScore)}
              </span>
              {isNewRecord && (
                <span className="mt-1 px-1.5 py-0.5 bg-brand-peach text-brand-dark text-[7px] font-black rounded-md shadow-lg shadow-brand-peach/40 uppercase">
                  {t('game.hints.newRecord')}
                </span>
              )}
            </div>
          </div>
          
          {/* 勋章墙 (Zone 2 底部 - 文字放大) */}
          <div className="flex gap-8 mt-1">
            {badges.map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center gap-0.5 opacity-80">
                <span className="text-xl filter drop-shadow-sm">{badge.icon}</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter whitespace-nowrap">
                  {badge.id === 'speed' ? '速度' : badge.id === 'accuracy' ? '空间推理' : '专注力'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone 3: 右侧 - 明细与按钮 (扩容布局) */}
        <div className="flex-[2.5] flex flex-col justify-between pl-6 py-1">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">{t('score.breakdown.title')}</span>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-white/60 font-bold tracking-wide">{row.label}</span>
                    <span className="text-[10px] text-white/70 font-medium tracking-tight">• {row.sub}</span>
                  </div>
                  <span className={cn("text-[13px] font-sans font-bold", row.sign === '-' ? 'text-red-400' : 'text-brand-peach')}>
                    {row.sign}{row.value}
                  </span>
                </div>
              ))}
              <div className="pt-1.5 mt-1 border-t border-white/5 flex justify-between items-center opacity-40">
                <span className="text-[9px] font-bold uppercase tracking-widest">{t('score.breakdown.multiplier')}</span>
                <span className="text-[13px] font-sans font-bold text-brand-amber">×{(gameStats.difficultyMultiplier || 1).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 右侧交互 (Zone 3 底部) */}
          <div className="flex flex-row gap-2 mt-4">
            <button 
              onClick={onRetry}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold text-[10px] hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <RefreshCw size={12} className="rotate-180" />
              {t('game.controls.retryCurrent')}
            </button>
            <button 
              onClick={onRestart}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-brand-peach/10 border border-brand-peach/20 text-brand-peach font-bold text-[10px] hover:bg-brand-peach/20 transition-all active:scale-[0.98]"
            >
              <RefreshCw size={12} />
              {t('game.controls.restartGame')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center w-full gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700", hideHeader ? "py-0" : "py-2")}>
      {/* 荣耀区 - 难度与描述 (Desktop Parity) */}
      {!hideHeader && (
        <div className="flex flex-col items-center">
          <div className="relative group flex flex-col items-center">
            <span className="absolute -top-3 left-0 text-[8px] text-white/30 font-black tracking-widest uppercase">
              {t('score.breakdown.base')}
            </span>
            <div className="flex items-center gap-3">
              <Trophy className={cn("w-10 h-10 drop-shadow-xl text-brand-orange")} />
              <span className={cn("text-4xl font-black tracking-tighter drop-shadow-md text-brand-peach")}>
                {t(getDifficultyMetadata(gameStats.difficulty?.cutCount || 1).nameKey)}
              </span>
            </div>
          </div>
          
          <p className="mt-2 text-white/40 text-[11px] font-medium tracking-wide max-w-[200px] text-center leading-relaxed">
            {t(getDifficultyMetadata(gameStats.difficulty?.cutCount || 1).descriptionKey)}
          </p>
        </div>
      )}

      {/* 核心分数 - 标准无衬线 (Unified with Landscape) */}
      <div className="flex flex-col items-center py-1">
        <span className="text-[56px] font-sans font-medium tracking-tighter text-brand-peach leading-none tabular-nums drop-shadow-lg">
          {fmt(currentScore)}
        </span>
        {isNewRecord && (
          <span className="mt-2 px-2 py-0.5 bg-brand-peach text-brand-dark text-[10px] font-black rounded-md shadow-lg shadow-brand-peach/40 uppercase">
            {t('game.hints.newRecord')}
          </span>
        )}
      </div>

      {/* 能力成就勋章 - 紧凑呈现 (Unified) */}
      {badges.length > 0 && (
        <div className="flex justify-center gap-x-10 px-2 mt-1">
          {badges.map((badge) => (
            <div key={badge.id} className={cn("flex flex-col items-center", badge.colorClass)}>
              <span className="text-3xl mb-0.5 filter drop-shadow-sm">{badge.icon}</span>
              <span className="text-[10px] font-black tracking-widest uppercase text-white/70">
                {t(badge.labelKey)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 计分明细 - 单行专业排版 (Unified Style) */}
      <div className="w-full flex flex-col gap-4 mt-2 px-1">
        <div className="h-px bg-white/5 w-full" />
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/60 font-bold text-[12px] tracking-wide">{row.label}</span>
                <span className="text-white/70 text-[10px] font-medium tracking-tight">• {row.sub}</span>
              </div>
              <span className={cn("text-[13px] font-sans font-bold", row.sign === '-' ? 'text-red-400' : 'text-brand-peach')}>
                {row.sign}{row.value}
              </span>
            </div>
          ))}
        </div>
        
        <div className="h-px bg-white/5 w-full mt-1" />
        
        <div className="flex items-center justify-between opacity-30">
          <span className="text-[9px] uppercase font-bold tracking-widest">{t('score.breakdown.multiplier')}</span>
          <span className="text-[13px] font-sans font-bold text-brand-peach">×{(scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default MobileScoreLayout;