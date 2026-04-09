import React from 'react';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";

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

  const getShape = (s?: string) => { try { return s ? t(`game.shapes.names.${s}`) : ''; } catch { return s || ''; } };
  const getCut = (c?: string) => { try { return c ? t(`cutType.${c}`) : ''; } catch { return c || ''; } };
  const getDiffLine = (d: any) => {
    const p = [t('difficulty.levelLabel', { level: d.cutCount })];
    const s = getShape(d.shapeType); if (s) p.push(s);
    const c = getCut(d.cutType); if (c) p.push(c);
    p.push(`${d.actualPieces}${t('stats.piecesUnit')}`);
    return p.join(' · ');
  };

  const fmt = (n: number) => n.toLocaleString();
  const fmtDur = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getSpeedText = (dur: number) => {
    const sd = getSpeedBonusDetails(dur, gameStats.difficulty?.actualPieces || 0, gameStats.difficulty?.cutCount || 1);
    if (!sd.currentLevel) return t('score.noReward') || '无奖励';
    const fmtT = (s: number) => s < 60 ? `${s}${locale === 'en' ? 's' : '秒'}` : `${Math.floor(s / 60)}${locale === 'en' ? 'm' : '分'}`;
    const names: Record<string, { zh: string; en: string }> = {
      '极速': { zh: '极速', en: 'Extreme' }, '快速': { zh: '快速', en: 'Fast' },
      '良好': { zh: '良好', en: 'Good' }, '标准': { zh: '标准', en: 'Normal' },
      '一般': { zh: '一般', en: 'Slow' }, '慢': { zh: '慢', en: 'Too Slow' },
    };
    const name = names[sd.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || sd.currentLevel.name;
    return `${name} <${fmtT(sd.currentLevel.maxTime)}`;
  };

  const diff = getDiffLine(gameStats.difficulty);
  const subtotal = scoreBreakdown
    ? scoreBreakdown.baseScore + scoreBreakdown.timeBonus + scoreBreakdown.rotationScore + scoreBreakdown.hintScore : 0;
  const ts = new Date(gameStats.gameStartTime || Date.now()).toLocaleString(
    locale === 'zh-CN' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );

  const rows = scoreBreakdown ? [
    { label: t('score.breakdown.base'), sub: diff, value: fmt(scoreBreakdown.baseScore), pos: true, sign: '' },
    { label: t('score.breakdown.timeBonus'), sub: getSpeedText(gameStats.totalDuration), value: fmt(scoreBreakdown.timeBonus), pos: true, sign: '+' },
    { label: t('score.breakdown.rotationScore'), sub: `${gameStats.totalRotations}/${gameStats.minRotations}`, value: fmt(scoreBreakdown.rotationScore), pos: scoreBreakdown.rotationScore >= 0, sign: scoreBreakdown.rotationScore >= 0 ? '+' : '' },
    { label: t('score.breakdown.hintScore'), sub: `${gameStats.hintUsageCount}/${scoreBreakdown.hintAllowance}`, value: fmt(scoreBreakdown.hintScore), pos: scoreBreakdown.hintScore >= 0, sign: scoreBreakdown.hintScore >= 0 ? '+' : '' },
  ] : [];

  // Divider — no margin, pure 1px line
  const HR = () => <div className="h-px bg-white/10 w-full" />;

  /* ──────────────────────────────────────────
     Shared compact row
  ────────────────────────────────────────── */
  const Row = ({ label, sub, value, pos, sign }: typeof rows[0]) => (
    <div className="flex items-baseline justify-between leading-tight">
      <div className="flex items-baseline gap-1 flex-1 min-w-0 pr-1">
        <span className="text-[#FFD5AB]/60 text-[11px] font-medium shrink-0 leading-none">{label}</span>
        <span className="text-[#FFD5AB]/25 text-[9px] truncate leading-none">{sub}</span>
      </div>
      <span className={cn('text-[11px] font-black tabular-nums shrink-0 leading-none', pos ? 'text-[#FFD5AB]' : 'text-[#FF8A80]')}>
        {sign}{value}
      </span>
    </div>
  );

  /* ══════════════════════════════════════════
     LANDSCAPE — ultra-compact single column
  ══════════════════════════════════════════ */
  if (isLandscape) {
    return (
      <div className="w-full h-full rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col px-3 pt-1.5 pb-0.5 gap-0">

        {/* Header - ultra tiny */}
        <div className="flex items-center justify-between shrink-0 leading-none mb-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[9px]">🏆</span>
            <span className="text-[#FFD5AB]/50 text-[9px] font-bold uppercase tracking-widest leading-none">
              {t('stats.currentGameScore')}
            </span>
            {isNewRecord && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-1 rounded text-[7px] font-black uppercase leading-none">
                🌟
              </span>
            )}
          </div>
          <span className="text-[16px] font-black text-[#FFD5AB] tabular-nums tracking-tight leading-none">
            {fmt(currentScore)}
          </span>
        </div>

        {/* Rows - NO HR dividers to save space, minimal leading */}
        <div className="flex flex-col gap-0 flex-1 overflow-hidden">
          {rows.map((r, i) => (
            <div key={i} className="leading-[1.1]">
               <Row {...r} />
            </div>
          ))}
          
          {scoreBreakdown && (
            <div className="flex flex-col gap-0">
              {/* Subtotal */}
              <div className="flex items-baseline justify-between leading-none py-[1px]">
                <span className="text-[#FFD5AB]/50 text-[9px] font-bold uppercase tracking-wider leading-none">{t('score.breakdown.subtotal')}</span>
                <span className="text-[#FFD5AB]/70 text-[9px] font-black tabular-nums leading-none">{fmt(subtotal)}</span>
              </div>
              {/* Multiplier */}
              <div className="flex items-baseline justify-between leading-none py-[1px]">
                <span className="text-[#FFD5AB]/50 text-[9px] font-bold uppercase tracking-wider leading-none">{t('score.breakdown.multiplier')}</span>
                <span className="text-[#F68E5F] text-[9px] font-black tabular-nums leading-none">
                  ×{scoreBreakdown.difficultyMultiplier.toFixed(2)}
                </span>
              </div>
              {/* Final - Highlighted */}
              <div className="flex items-baseline justify-between leading-none py-[1px] mt-0.5 border-t border-white/5">
                <span className="text-[#FFD5AB] text-[10px] font-black uppercase tracking-widest leading-none">{t('score.breakdown.final')}</span>
                <span className="text-[#FFD5AB] text-[14px] font-black tabular-nums leading-none">{fmt(currentScore)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     PORTRAIT — title+score in one header row,
     all rows at minimum height, fits ~250px
  ══════════════════════════════════════════ */
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

        {/* Header: 🏆 label left | score right */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <div className="flex items-center gap-1 leading-none">
            <span className="text-[12px] leading-none">🏆</span>
            <span className="text-[#FFD5AB]/55 text-[10px] font-bold uppercase tracking-widest leading-none">
              {t('stats.currentGameScore')}
            </span>
            {isNewRecord && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-1 rounded text-[8px] font-black uppercase ml-0.5">
                🌟
              </span>
            )}
          </div>
          <span className="text-[20px] font-black text-[#FFD5AB] tabular-nums tracking-tight leading-none">
            {fmt(currentScore)}
          </span>
        </div>

        {/* Breakdown */}
        {scoreBreakdown && (
          <div className="px-3 pb-2.5 flex flex-col gap-0">
            <HR />
            <div className="flex flex-col gap-[4px] pt-[4px]">
              {rows.map((r, i) => <Row key={i} {...r} />)}
            </div>
            <div className="mt-[4px]"><HR /></div>
            <div className="flex flex-col gap-[4px] pt-[4px]">
              {/* Subtotal */}
              <div className="flex items-baseline justify-between leading-none">
                <span className="text-[#FFD5AB]/50 text-[10px] font-bold uppercase tracking-wider leading-none">{t('score.breakdown.subtotal')}</span>
                <span className="text-[#FFD5AB]/70 text-[10px] font-black tabular-nums leading-none">{fmt(subtotal)}</span>
              </div>
              {/* Multiplier — value only, no formula */}
              <div className="flex items-baseline justify-between leading-none">
                <span className="text-[#FFD5AB]/50 text-[10px] font-bold uppercase tracking-wider leading-none">{t('score.breakdown.multiplier')}</span>
                <span className="text-[#F68E5F] text-[10px] font-black tabular-nums leading-none">
                  ×{scoreBreakdown.difficultyMultiplier.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-[4px]"><HR /></div>
            {/* Final */}
            <div className="flex items-baseline justify-between pt-[4px] leading-none">
              <span className="text-[#FFD5AB] text-[12px] font-black uppercase tracking-widest leading-none">{t('score.breakdown.final')}</span>
              <span className="text-[#FFD5AB] text-[16px] font-black tabular-nums tracking-tight leading-none">{fmt(currentScore)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileScoreLayout;