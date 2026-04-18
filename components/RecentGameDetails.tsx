"use client";

import { ArrowLeft, Trophy } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";

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

  // 统一配色 (#FFD5AB)
  const BRAND_GOLD = '#FFD5AB';

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
    <div className="flex flex-col h-full animate-in fade-in duration-500 gap-1">
      
      {/* 顶部单行设计：标题 + 分数 - 字体字号对齐 DesktopScoreLayout */}
      <div className="w-full flex items-center justify-between px-1 mb-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Trophy className="shrink-0" size={16} style={{ color: BRAND_GOLD }} />
          <h2 className="text-white/90 font-medium uppercase tracking-[0.1em] leading-none text-[12px] truncate">
            {t('leaderboard.recentGameScore') || '本局成绩'}
          </h2>
        </div>
        <div 
          className="tabular-nums tracking-tighter leading-none font-medium text-xl ml-2 shrink-0" 
          style={{ color: BRAND_GOLD }}
        >
          {record.finalScore}
        </div>
      </div>

      <div className="w-full border border-white/10 rounded-2xl bg-transparent p-3.5 px-3 mb-1">
        
        {/* 数据面板内容 */}
        <div className="space-y-3">
          {/* 明细行 */}
          <div className="space-y-1.5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-baseline justify-between leading-none py-0.5 w-full overflow-hidden">
                <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-1.5 overflow-hidden">
                  <span className="text-white/70 shrink-0 font-medium text-[12px]">{row.label}</span>
                  <span className="text-white/15 truncate uppercase font-medium text-[10px] hidden sm:inline">{row.sub}</span>
                </div>
                <span className="tabular-nums shrink-0 font-medium text-[13px] text-right" style={{ color: row.sign === '-' ? '#FF8A80' : BRAND_GOLD }}>
                  {row.sign}{row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 w-full opacity-15" />

          {/* 结算与系数 */}
          <div className="space-y-1.5">
             <div className="flex items-center justify-between">
                <span className="text-white/30 uppercase tracking-tight font-medium text-[10px]">{t('score.breakdown.subtotal')}</span>
                <span className="text-white/40 tabular-nums font-medium text-[12px]">{subtotal}</span>
             </div>

             <div className="flex items-center justify-between">
                <span className="text-white/30 uppercase tracking-tight font-medium text-[10px]">{t('score.breakdown.multiplier')}</span>
                <span className="tabular-nums font-medium text-[12px]" style={{ color: BRAND_GOLD, opacity: 0.8 }}>
                  ×{(record.scoreBreakdown?.difficultyMultiplier || 1).toFixed(2)}
                </span>
             </div>

             <div className="border-t border-white/5 flex items-baseline justify-between pt-2.5 mt-1">
                <span className="text-white/60 uppercase tracking-widest font-medium text-[12px]">{t('score.breakdown.final')}</span>
                <span className="tabular-nums tracking-tight leading-none font-medium text-lg" style={{ color: BRAND_GOLD }}>
                  {record.finalScore}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* 返回按钮 - 对齐结算页操作按钮风格 */}
      <button
        onClick={handleBack}
        className="glass-btn-inactive glass-btn-sheen w-full mt-3 shrink-0 h-10 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        style={{ color: BRAND_GOLD }}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        {t('leaderboard.backToLeaderboard') || '返回'}
      </button>

    </div>
  );
};

export default RecentGameDetails;