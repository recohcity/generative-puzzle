"use client";

import { ArrowLeft } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface StoredGameRecord {
  timestamp: number;
  finalScore: number;
  totalDuration: number;
  difficulty: any;
  deviceInfo: any;
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;
  rotationEfficiency: number;
  scoreBreakdown: any;
  gameStartTime?: number;
  id?: string;
}

interface RecentGameDetailsProps {
  record: StoredGameRecord;
  onBack: () => void;
}

const RecentGameDetails: React.FC<RecentGameDetailsProps> = ({
  record,
  onBack
}) => {
  const { t, locale } = useTranslation();
  const [isLandscape, setIsLandscape] = useState(false);

  // 分数统一使用与用户名一致的米金色
  const SCORE_COLOR = '#FFD5AB';

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleBack = () => {
    playButtonClickSound();
    onBack();
  };

  const getDifficultyText = (record: any): string => {
    const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount });
    const pieceCount = record.difficulty?.actualPieces || 0;
    return `${levelText} · ${pieceCount}${t('stats.piecesUnit')}`;
  };

  const getSpeedBonusText = (duration: number): string => {
    const { difficulty } = record;
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
    return t('score.noReward') || '无';
  };

  const rows = [
    { label: t('score.breakdown.base'), sub: getDifficultyText(record), value: (record.scoreBreakdown?.baseScore || 0), sign: '' },
    { label: t('score.breakdown.timeBonus'), sub: getSpeedBonusText(record.totalDuration), value: (record.scoreBreakdown?.timeBonus || 0), sign: '+' },
    { label: t('score.breakdown.rotationScore'), sub: `${record.totalRotations}/${record.scoreBreakdown?.minRotations || 0}`, value: Math.abs(record.scoreBreakdown?.rotationScore || 0), sign: (record.scoreBreakdown?.rotationScore || 0) >= 0 ? '+' : '-' },
    { label: t('score.breakdown.hintScore'), sub: `${record.hintUsageCount}/${record.scoreBreakdown?.hintAllowance || 0}`, value: Math.abs(record.scoreBreakdown?.hintScore || 0), sign: (record.scoreBreakdown?.hintScore || 0) >= 0 ? '+' : '-' },
  ];

  const subtotal = (record.scoreBreakdown?.baseScore || 0) + (record.scoreBreakdown?.timeBonus || 0) + (record.scoreBreakdown?.rotationScore || 0) + (record.scoreBreakdown?.hintScore || 0);

  return (
    <div className={cn(
      "flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300",
      isLandscape ? "gap-0" : "gap-0.5"
    )}>
      
      {/* 顶部单行设计：标题 + 分数 */}
      <div className={cn("w-full flex items-center justify-between px-0.5", isLandscape ? "mb-0" : "mb-0.5")}>
         <h2 className={cn(
           "text-white/40 font-medium uppercase tracking-tight leading-none",
           isLandscape ? "text-[7px]" : "text-[10px]"
         )}>
           🏆 {t('leaderboard.recentGameScore') || '本局成绩'}
         </h2>
         <div 
          className={cn("tabular-nums tracking-tighter leading-none font-black", isLandscape ? "text-base" : "text-xl")} 
          style={{ color: SCORE_COLOR }}
        >
          {record.finalScore}
        </div>
      </div>

      <div className={cn(
        "border border-white/5 rounded-xl flex flex-col items-center bg-white/[0.01]",
        isLandscape ? "p-1 px-2" : "p-2"
      )}>
        
        {/* 数据面板内容 */}
        <div className="w-full">
          <div className="space-y-0">
            {rows.map((row, i) => (
              <div key={i} className={cn("flex items-baseline justify-between leading-tight", isLandscape ? "py-0" : "py-0.5")}>
                <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-2 overflow-hidden">
                  <span className={cn("text-white/60 shrink-0", isLandscape ? "text-[8px]" : "text-[11px]")}>{row.label}</span>
                  <span className={cn("text-white/20 truncate uppercase", isLandscape ? "text-[7px]" : "text-[9px]")}>{row.sub}</span>
                </div>
                <span className={cn("tabular-nums shrink-0 font-medium", isLandscape ? "text-[9px]" : "text-[12px]") } style={{ color: row.sign === '-' ? '#FF8A80' : SCORE_COLOR }}>
                  {row.sign}{row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 w-full opacity-20 mt-0.5 mb-0.5" />

          <div className="space-y-0">
             <div className="flex items-center justify-between leading-tight">
                <span className={cn("text-white/20 uppercase tracking-tight", isLandscape ? "text-[7px]" : "text-[9px]")}>{t('score.breakdown.subtotal')}</span>
                <span className={cn("text-white/30 tabular-nums font-medium", isLandscape ? "text-[8px]" : "text-[11px]")}>{subtotal}</span>
             </div>

             <div className="flex items-center justify-between leading-tight">
                <span className={cn("text-white/20 uppercase tracking-tight", isLandscape ? "text-[7px]" : "text-[9px]")}>{t('score.breakdown.multiplier')}</span>
                <span className={cn("tabular-nums font-medium", isLandscape ? "text-[8px]" : "text-[11px]") } style={{ color: SCORE_COLOR, opacity: 0.8 }}>
                  ×{(record.scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}
                </span>
             </div>

             <div className={cn("flex items-baseline justify-between pt-0.5 border-t border-white/5 mt-0.5")}>
                <span className={cn("text-white/40 uppercase tracking-normal font-medium", isLandscape ? "text-[8px]" : "text-[11px]")}>{t('score.breakdown.final')}</span>
                <span className={cn("tabular-nums tracking-tight leading-none font-medium", isLandscape ? "text-[10px]" : "text-[14px]")} style={{ color: SCORE_COLOR }}>
                  {record.finalScore}
                </span>
             </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleBack}
        className={cn(
          "glass-btn-active w-full shrink-0 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-0.5",
          isLandscape ? "h-5 text-[7px]" : "h-8 text-[9px]"
        )}
        style={{ color: SCORE_COLOR }}
      >
        <ArrowLeft className={isLandscape ? "w-2 h-2" : "w-3 h-3"} strokeWidth={2.5} />
        {t('leaderboard.backToLeaderboard') || '返回'}
      </button>

    </div>
  );
};

export default RecentGameDetails;