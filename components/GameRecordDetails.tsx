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
  
  // 统一各端主色调为与用户名一致的米金色
  const BRAND_GOLD = '#FFD5AB';

  const handleBack = () => { playButtonClickSound(); onBack(); };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSpeedDesc = (): string => {
    const pieceCount = record.difficulty?.actualPieces || 0;
    const difficultyLevel = record.difficulty?.cutCount || 1;
    const speedDetails = getSpeedBonusDetails(record.totalDuration, pieceCount, difficultyLevel);
    
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

  const subtotal = (record.scoreBreakdown?.baseScore || 0) +
    (record.scoreBreakdown?.timeBonus || 0) +
    (record.scoreBreakdown?.rotationScore || 0) +
    (record.scoreBreakdown?.hintScore || 0);

  const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount });
  const piecesPart = `${record.difficulty?.actualPieces || 0}${t('stats.piecesUnit') || '片'}`;
  const difficultyString = `${levelText} · ${piecesPart}`;

  const rows = [
    { label: t('score.breakdown.base'), sub: difficultyString, value: (record.scoreBreakdown?.baseScore || 0) },
    { label: t('score.breakdown.timeBonus'), sub: getSpeedDesc(), value: (record.scoreBreakdown?.timeBonus || 0) },
    { label: t('score.breakdown.rotationScore'), sub: `${record.totalRotations}/${record.scoreBreakdown?.minRotations || 0}`, value: Math.abs(record.scoreBreakdown?.rotationScore || 0), sign: (record.scoreBreakdown?.rotationScore || 0) >= 0 ? '+' : '-' },
    { label: t('score.breakdown.hintScore'), sub: `${record.hintUsageCount}/${record.scoreBreakdown?.hintAllowance || 0}`, value: Math.abs(record.scoreBreakdown?.hintScore || 0), sign: (record.scoreBreakdown?.hintScore || 0) >= 0 ? '+' : '-' },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">

      {/* 1. Header & Score in ONE line - font-medium, transparency removed */}
      <div className="flex items-center justify-between w-full px-0.5 mb-2.5 mt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 shrink-0" style={{ color: BRAND_GOLD }} />
          <h2 className="text-white/90 font-medium uppercase tracking-widest leading-none text-[12px]">
            {t('leaderboard.recentGameScore') || '本局成绩'}
          </h2>
        </div>
        <div className="tabular-nums tracking-tighter font-medium leading-none text-xl" style={{ color: BRAND_GOLD }}>
          {record.finalScore}
        </div>
      </div>

      {/* 2. Detail Card — transparent background per user request */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="rounded-2xl border border-white/10 bg-transparent p-4">
          <div className="space-y-4">
            {/* Detail rows */}
            <div className="space-y-1.5">
              {rows.map((row, i) => (
                <div key={i} className="flex items-baseline justify-between leading-none py-0.5">
                  <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-4 overflow-hidden">
                    <span className="text-white/60 text-[13px] font-medium shrink-0">{row.label}</span>
                    <span className="text-white/20 text-[11px] truncate uppercase font-medium">{row.sub}</span>
                  </div>
                  <span className="text-[14px] font-medium tabular-nums shrink-0" style={{ color: (row as any).sign === '-' ? '#FF8A80' : BRAND_GOLD }}>
                    {(row as any).sign || ''}{row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-white/10 w-full opacity-15 mt-1 mb-1" />

            {/* Subtotal */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between leading-none">
                <span className="text-white/30 text-[11px] font-medium uppercase tracking-wider">
                  {t('score.breakdown.subtotal')}
                </span>
                <span className="text-white/40 text-[13px] font-medium tabular-nums">
                  {subtotal}
                </span>
              </div>

              <div className="flex items-baseline justify-between leading-none">
                <span className="text-white/30 text-[11px] font-medium uppercase tracking-wider">
                  {t('score.breakdown.multiplier')}
                </span>
                <span className="text-[13px] font-medium tabular-nums" style={{ color: BRAND_GOLD, opacity: 0.8 }}>
                  ×{(record.scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}
                </span>
              </div>

              {/* Final Score */}
              <div className="border-t border-white/5 flex items-baseline justify-between pt-3 mt-1.5">
                <span className="text-white/60 text-[14px] font-medium uppercase tracking-widest">
                  {t('score.breakdown.final')}
                </span>
                <span className="text-lg font-medium tabular-nums tracking-tight leading-none" style={{ color: BRAND_GOLD }}>
                  {record.finalScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={handleBack}
        className="glass-btn-active w-full mt-3 shrink-0 h-10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        style={{ color: BRAND_GOLD }}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        {t('leaderboard.backToLeaderboard') || '返回'}
      </button>
    </div>
  );
};

export default GameRecordDetails;