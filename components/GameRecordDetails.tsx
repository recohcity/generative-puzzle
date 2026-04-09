"use client";

import { ArrowLeft, Trophy } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { GameRecord } from '@generative-puzzle/game-core';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";

interface GameRecordDetailsProps {
  record: GameRecord;
  onBack: () => void;
}

const GameRecordDetails: React.FC<GameRecordDetailsProps> = ({ record, onBack }) => {
  const { t, locale } = useTranslation();

  const handleBack = () => { playButtonClickSound(); onBack(); };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try { return t(`cutType.${cutType}`); } catch { return cutType; }
  };

  const getShapeDisplayName = (shapeType?: string): string => {
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
    const cutMult = getCutTypeMultiplier(difficulty?.cutType);
    const shapeMult = getShapeTypeMultiplier(difficulty?.shapeType);
    const baseMult = multiplier / cutMult / shapeMult;
    const cutName = getCutTypeDisplayName(difficulty?.cutType) || (locale === 'en' ? 'Straight' : '直线');
    const shapeName = getShapeDisplayName(difficulty?.shapeType) || (locale === 'en' ? 'Polygon' : '多边形');
    const baseLabel = t('score.breakdown.baseMultiplier') || (locale === 'en' ? 'Base' : '基础');
    return `${baseLabel}${baseMult.toFixed(2)} × ${cutName}${cutMult.toFixed(2)} × ${shapeName}${shapeMult.toFixed(2)}`;
  };

  const getSpeedDesc = (): string => {
    const pieceCount = record.difficulty?.actualPieces || 0;
    const difficultyLevel = record.difficulty?.cutCount || 1;
    const speedDetails = getSpeedBonusDetails(record.totalDuration, pieceCount, difficultyLevel);
    const fmt = (s: number) => {
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
      return locale === 'en' ? `${name} (under ${fmt(speedDetails.currentLevel.maxTime)})` : `${name}（少于${fmt(speedDetails.currentLevel.maxTime)}内）`;
    }
    return t('score.noReward') || '无奖励';
  };

  const subtotal = (record.scoreBreakdown?.baseScore || 0) +
    (record.scoreBreakdown?.timeBonus || 0) +
    (record.scoreBreakdown?.rotationScore || 0) +
    (record.scoreBreakdown?.hintScore || 0);

  const shapeName = getShapeDisplayName(record.difficulty?.shapeType);
  const cutTypeName = getCutTypeDisplayName(record.difficulty?.cutType);
  const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount });
  const piecesPart = `${record.difficulty?.actualPieces || 0}${t('stats.piecesUnit') || '片'}`;
  const diffParts = [levelText, ...(shapeName ? [shapeName] : []), ...(cutTypeName ? [cutTypeName] : []), piecesPart];
  const difficultyString = diffParts.join(' · ');

  const rotationDiff = record.totalRotations - (record.scoreBreakdown?.minRotations || 0);
  const rotationIsPositive = (record.scoreBreakdown?.rotationScore || 0) >= 0;
  const hintIsPositive = (record.scoreBreakdown?.hintScore || 0) >= 0;

  const rotationSub = `${record.totalRotations} / ${record.scoreBreakdown?.minRotations || 0}${rotationDiff === 0
    ? ` · ${t('rotation.perfect') || '完美'}`
    : ` · ${t('rotation.excess', { count: rotationDiff }) || `超出${rotationDiff}次`}`}`;

  const rows = [
    {
      label: t('score.breakdown.base') || '难度得分',
      sub: difficultyString,
      value: (record.scoreBreakdown?.baseScore || 0).toLocaleString(),
      color: 'text-[#FFD5AB]',
      sign: '',
    },
    {
      label: t('score.breakdown.timeBonus') || '速度加成',
      sub: getSpeedDesc(),
      value: (record.scoreBreakdown?.timeBonus || 0).toLocaleString(),
      color: 'text-[#FFD5AB]',
      sign: '+',
    },
    {
      label: t('score.breakdown.rotationScore') || '旋转',
      sub: rotationSub,
      value: (record.scoreBreakdown?.rotationScore || 0).toLocaleString(),
      color: rotationIsPositive ? 'text-[#FFD5AB]' : 'text-[#FF8A80]',
      sign: rotationIsPositive ? '+' : '',
    },
    {
      label: t('score.breakdown.hintScore') || '提示',
      sub: `${record.hintUsageCount} / ${record.scoreBreakdown?.hintAllowance || 0}${t('leaderboard.timesUnit') || '次'}`,
      value: (record.scoreBreakdown?.hintScore || 0).toLocaleString(),
      color: hintIsPositive ? 'text-[#FFD5AB]' : 'text-[#FF8A80]',
      sign: hintIsPositive ? '+' : '',
    },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">

      {/* ── Header ── */}
      <div className="mb-2 shrink-0">
        <h2 className="text-[#FFD5AB]/80 text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-widest leading-none">
          <span className="text-xs">🏆</span>
          {t('leaderboard.recentGameScore') || t('leaderboard.scoreDetails')}
        </h2>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-1">

        {/* Unified Card Design */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          {/* Hero score section - matching MobileScoreLayout portrait header */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
             <div className="flex flex-col gap-0.5">
                <span className="text-[#FFD5AB]/40 text-[9px] font-bold uppercase tracking-widest leading-none">
                   {formatTime(record.totalDuration)} · {difficultyString}
                </span>
             </div>
             <div className="text-[20px] font-black text-[#FFD5AB] tabular-nums tracking-tight leading-none">
               {record.finalScore.toLocaleString()}
             </div>
          </div>

          {/* Breakdown — flat list - matching MobileScoreLayout */}
          <div className="px-3 pb-3">
            <div className="h-px bg-white/10" />

            <div className="flex flex-col gap-1 py-1">
              {rows.map((row, i) => (
                <div key={i} className="flex items-baseline justify-between leading-none py-0.5">
                  <div className="flex-1 min-w-0 pr-2 flex items-baseline gap-1.5">
                    <span className="text-[#FFD5AB]/60 text-[11px] font-medium shrink-0">{row.label}</span>
                    <span className="text-[#FFD5AB]/25 text-[9px] truncate">{row.sub}</span>
                  </div>
                  <span className={cn('text-[11px] font-black tabular-nums shrink-0', row.color)}>
                    {row.sign}{row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal & Multiplier */}
            <div className="h-px bg-white/10" />
            <div className="flex flex-col gap-1 py-1.5">
               <div className="flex items-baseline justify-between leading-none">
                 <span className="text-[#FFD5AB]/50 text-[10px] font-bold uppercase tracking-wider">
                   {t('score.breakdown.subtotal')}
                 </span>
                 <span className="text-[#FFD5AB]/70 text-[10px] font-black tabular-nums">
                   {subtotal.toLocaleString()}
                 </span>
               </div>

               <div className="flex items-baseline justify-between leading-none">
                 <span className="text-[#FFD5AB]/50 text-[10px] font-bold uppercase tracking-wider">
                   {t('score.breakdown.multiplier')}
                 </span>
                 <span className="text-[#F68E5F] text-[10px] font-black tabular-nums">
                   ×{(record.scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}
                 </span>
               </div>
            </div>

            {/* Final */}
            <div className="h-px bg-white/10" />
            <div className="flex items-baseline justify-between py-2 leading-none">
              <span className="text-[#FFD5AB] text-[12px] font-black uppercase tracking-widest">
                {t('score.breakdown.final')}
              </span>
              <span className="text-[#FFD5AB] text-[18px] font-black tabular-nums tracking-tight">
                {record.finalScore.toLocaleString()}
              </span>
            </div>

            {/* Timestamp flush to bottom */}
            <div className="pt-1 text-center border-t border-white/5">
              <span className="text-[#FFD5AB]/20 text-[8px] leading-none uppercase tracking-tighter">
                {t('stats.gameTimeLabel') || (locale === 'en' ? 'Game Time' : '完成时间')} {new Date(record.gameStartTime || record.timestamp).toLocaleString(
                  locale === 'zh-CN' ? 'zh-CN' : 'en-US',
                  { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Back button ── */}
      <button
        onClick={handleBack}
        className="glass-btn-active w-full mt-2 shrink-0 h-10 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        {t('leaderboard.backToLeaderboard') || '返回排行榜'}
      </button>
    </div>
  );
};

export default GameRecordDetails;