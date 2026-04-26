import React from 'react';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface MobileScoreLayoutProps {
  gameStats: GameStats;
  currentScore: number;
  scoreBreakdown?: ScoreBreakdown;
  isNewRecord?: boolean;
  currentRank?: number;
  isLandscape?: boolean;
}

export const MobileScoreLayout: React.FC<MobileScoreLayoutProps> = ({
  gameStats,
  currentScore,
  scoreBreakdown,
  isNewRecord,
  isLandscape = false,
}) => {
  const { t, locale } = useTranslation();

  // 颜色通过 Tailwind Token (text-brand-peach) 统一管理

  const getShape = (s?: string) => { try { return s ? t(`game.shapes.names.${s}`) : ''; } catch { return s || ''; } };
  
  const getDiffLine = (d: any) => {
    const levelText = t('difficulty.levelLabel', { level: d.cutCount });
    const pieceCount = d.actualPieces || 0;
    const shapeName = getShape(d.shapeType);
    return `${levelText} · ${shapeName ? shapeName + ' · ' : ''}${pieceCount}${t('stats.piecesUnit')}`;
  };

  const fmt = (n: number) => n.toString();

  const getSpeedText = (dur: number) => {
    const sd = getSpeedBonusDetails(dur, gameStats.difficulty?.actualPieces || 0, gameStats.difficulty?.cutCount || 1);
    if (!sd.currentLevel) return t('score.noReward') || '无';
    
    const levelNameMap: Record<string, { zh: string; en: string }> = {
      '极速': { zh: '极速', en: 'Extreme' },
      '快速': { zh: '快速', en: 'Fast' },
      '良好': { zh: '良好', en: 'Good' },
      '标准': { zh: '标准', en: 'Normal' },
      '一般': { zh: '一般', en: 'Slow' },
      '慢': { zh: '慢', en: 'Too Slow' }
    };
    return levelNameMap[sd.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || sd.currentLevel.name;
  };

  const diffStr = getDiffLine(gameStats.difficulty);
  const subtotal = scoreBreakdown
    ? scoreBreakdown.baseScore + scoreBreakdown.timeBonus + scoreBreakdown.rotationScore + scoreBreakdown.hintScore : 0;

  const rows = scoreBreakdown ? [
    { label: t('score.breakdown.base'), sub: diffStr, value: fmt(scoreBreakdown.baseScore), sign: '' },
    { label: t('score.breakdown.timeBonus'), sub: getSpeedText(gameStats.totalDuration), value: fmt(scoreBreakdown.timeBonus), sign: '+' },
    { label: t('score.breakdown.rotationScore'), sub: `${gameStats.totalRotations}/${gameStats.minRotations}`, value: fmt(Math.abs(scoreBreakdown.rotationScore)), sign: (scoreBreakdown.rotationScore >= 0 ? '+' : '-') },
    { label: t('score.breakdown.hintScore'), sub: `${gameStats.hintUsageCount}/${scoreBreakdown.hintAllowance}`, value: fmt(Math.abs(scoreBreakdown.hintScore)), sign: (scoreBreakdown.hintScore >= 0 ? '+' : '-') },
  ] : [];

  return (
    <div className={cn(
      "flex flex-col items-center w-full animate-in fade-in duration-500",
      isLandscape ? "gap-0" : "gap-1"
    )}>
      
      {/* 标题与分数并排一行 - 图标对齐桌面端 & 横屏字号拉齐 */}
      <div className={cn("w-full flex items-center justify-between px-0.5", isLandscape ? "mb-0" : "mb-0")}>
        <div className="flex items-center gap-1.5 min-w-0">
           <Trophy className="shrink-0 text-brand-peach" size={16} />
           <h3 className="text-white/90 font-normal whitespace-nowrap text-[14px]">
             {t('stats.currentGameResult')}
           </h3>
           {isNewRecord && (
             <span className="bg-brand-peach/20 text-brand-peach px-1 py-0.5 rounded font-normal text-[8px] leading-none shrink-0">
               NEW
             </span>
           )}
        </div>
        <div 
          className="tabular-nums tracking-tighter font-medium leading-none text-xl text-brand-peach"
        >
          {fmt(currentScore)}
        </div>
      </div>

      {/* 成绩明细外边框容器 - 仅留边框 */}
      <div className={cn(
        "w-full border border-white/10 rounded-2xl bg-transparent",
        isLandscape ? "p-3 px-3.5" : "p-2.5"
      )}>
        <div className={isLandscape ? "space-y-1.5" : "space-y-1"}>
          {/* 明细行 */}
          <div className="space-y-0">
            {rows.map((row, i) => (
              <div key={i} className="flex items-baseline justify-between leading-none py-0.5 overflow-hidden">
                <div className="flex items-baseline gap-2 flex-1 min-w-0 pr-1.5 overflow-hidden">
                  <span className="text-white/70 shrink-0 font-medium text-[12px]">
                    {row.label}
                  </span>
                  <span className="text-white/15 truncate uppercase font-medium text-[10px] hidden sm:inline">
                    {row.sub}
                  </span>
                </div>
                <span 
                  className={cn("tabular-nums shrink-0 font-medium text-[13px]", row.sign === '-' ? 'text-red-400' : 'text-brand-peach')}
                >
                  {row.sign}{row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 w-full opacity-15" />

          {/* 结算与系数 */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between leading-tight">
              <span className="text-white/25 uppercase tracking-tight font-medium text-[10px]">
                {t('score.breakdown.subtotal')}
              </span>
              <span className="text-white/30 tabular-nums font-medium text-[11px]">
                {fmt(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between leading-tight">
              <span className="text-white/25 uppercase tracking-tight font-medium text-[10px]">
                {t('score.breakdown.multiplier')}
              </span>
              <span className="tabular-nums font-medium text-[11px] text-brand-peach/70">
                ×{(scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}
              </span>
            </div>

            {/* 底部最终得分 */}
            <div className="flex items-baseline justify-between pt-1 border-t border-white/5 mt-0">
              <span className="text-white/50 uppercase tracking-tight font-medium text-[12px]">
                {t('score.breakdown.final')}
              </span>
              <span 
                className="tabular-nums tracking-tight font-medium text-[16px] text-brand-peach"
              >
                {fmt(currentScore)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileScoreLayout;