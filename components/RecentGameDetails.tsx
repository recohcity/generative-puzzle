"use client";

import { ArrowLeft } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";

// 使用GameDataManager内部的数据结构
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
  gameStartTime?: number; // 兼容字段
  id?: string; // 兼容字段
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

  const handleBack = () => {
    playButtonClickSound();
    onBack();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 获取切割类型显示名称
  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType;
    }
  };

  // 获取形状类型显示名称
  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  const getDifficultyText = (record: any): string => {
    const shapeName = getShapeDisplayName(record.difficulty?.shapeType);
    const cutTypeName = getCutTypeDisplayName(record.difficulty?.cutType);
    const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount });
    const piecesPart = `${record.difficulty?.actualPieces || 0}${t('stats.piecesUnit')}`;
    const parts = [levelText];
    if (shapeName) parts.push(shapeName);
    if (cutTypeName) parts.push(cutTypeName);
    parts.push(piecesPart);
    return parts.join(' · ');
  };

  // 获取速度奖励显示文本 - 使用动态速度奖励系统（v3.3）
  const getSpeedBonusText = (duration: number): string => {
    const { difficulty } = record;
    const pieceCount = difficulty?.actualPieces || 0;
    const difficultyLevel = difficulty?.cutCount || 1;
    
    // 获取速度奖励详细信息
    const speedDetails = getSpeedBonusDetails(duration, pieceCount, difficultyLevel);
    
    // 格式化时间显示（用于阈值）
    const formatTimeStr = (seconds: number): string => {
      if (seconds < 60) {
        return locale === 'en' ? `${seconds}s` : `${seconds}秒`;
      }
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return locale === 'en' 
        ? `${mins}m${secs > 0 ? `${secs}s` : ''}` 
        : `${mins}分${secs > 0 ? `${secs}秒` : ''}`;
    };
    
    // 根据当前等级生成描述文本
    if (speedDetails.currentLevel) {
      const levelNameMap: Record<string, { zh: string; en: string }> = {
        '极速': { zh: '极速', en: 'Extreme' },
        '快速': { zh: '快速', en: 'Fast' },
        '良好': { zh: '良好', en: 'Good' },
        '标准': { zh: '标准', en: 'Normal' },
        '一般': { zh: '一般', en: 'Slow' },
        '慢': { zh: '慢', en: 'Too Slow' }
      };
      
      const levelName = levelNameMap[speedDetails.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || speedDetails.currentLevel.name;
      
      // 如果是慢等级（无奖励），显示"超出X秒"
      if (speedDetails.currentLevel.name === '慢') {
        const timeStr = formatTimeStr(speedDetails.currentLevel.maxTime);
        return locale === 'en' 
          ? `${levelName} (exceeded ${timeStr})`
          : `${levelName}（超出${timeStr}）`;
      }
      
      // 其他等级显示"少于X秒内"
      const timeStr = formatTimeStr(speedDetails.currentLevel.maxTime);
      return locale === 'en' 
        ? `${levelName} (less than ${timeStr})`
        : `${levelName}（少于${timeStr}内）`;
    }
    
    return t('score.noReward') || '无速度奖励';
  };

  const rows = [
    { 
      label: t('score.breakdown.base'), 
      sub: getDifficultyText(record), 
      value: (record.scoreBreakdown?.baseScore || 0).toLocaleString(), 
      sign: '' 
    },
    { 
      label: t('score.breakdown.timeBonus'), 
      sub: getSpeedBonusText(record.totalDuration), 
      value: (record.scoreBreakdown?.timeBonus || 0).toLocaleString(), 
      sign: '+' 
    },
    { 
      label: t('score.breakdown.rotationScore'), 
      sub: `${record.totalRotations} / ${record.scoreBreakdown?.minRotations || 0}`, 
      value: Math.abs(record.scoreBreakdown?.rotationScore || 0).toLocaleString(), 
      sign: (record.scoreBreakdown?.rotationScore || 0) >= 0 ? '+' : '-' 
    },
    { 
      label: t('score.breakdown.hintScore'), 
      sub: `${record.hintUsageCount} / ${record.scoreBreakdown?.hintAllowance || 0}`, 
      value: Math.abs(record.scoreBreakdown?.hintScore || 0).toLocaleString(), 
      sign: (record.scoreBreakdown?.hintScore || 0) >= 0 ? '+' : '-' 
    },
  ];

  const subtotal = (record.scoreBreakdown?.baseScore || 0) + 
                   (record.scoreBreakdown?.timeBonus || 0) + 
                   (record.scoreBreakdown?.rotationScore || 0) + 
                   (record.scoreBreakdown?.hintScore || 0);

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

          {/* Hero score section */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
             <div className="flex flex-col gap-0.5">
                <span className="text-[#FFD5AB]/40 text-[10px] font-bold uppercase tracking-widest leading-none">
                   {formatTime(record.totalDuration)} · {getDifficultyText(record)}
                </span>
             </div>
             <div className="text-3xl font-black text-[#FFD5AB] tabular-nums tracking-tight leading-none">
               {record.finalScore.toLocaleString()}
             </div>
          </div>

          {/* Breakdown — flat list */}
          <div className="px-3 pb-3">
            <div className="h-px bg-white/10" />

            <div className="flex flex-col gap-1 py-1.5">
              {rows.map((row, i) => (
                <div key={i} className="flex items-baseline justify-between leading-none py-0.5">
                  <div className="flex-1 min-w-0 pr-2 flex items-baseline gap-1.5">
                    <span className="text-[#FFD5AB]/60 text-[11px] font-medium shrink-0">{row.label}</span>
                    <span className="text-[#FFD5AB]/25 text-[9px] truncate">{row.sub}</span>
                  </div>
                  <span className={cn('text-[11px] font-black tabular-nums shrink-0', (row.sign === '-' ? 'text-[#FF8A80]' : 'text-[#FFD5AB]'))}>
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
              <span className="text-[#FFD5AB] text-[22px] font-black tabular-nums tracking-tight">
                {record.finalScore.toLocaleString()}
              </span>
            </div>

            {/* Timestamp */}
            <div className="pt-1.5 text-center border-t border-white/5">
              <span className="text-[#FFD5AB]/20 text-[9px] leading-none uppercase tracking-tighter">
                {t('stats.gameTimeLabel') || (locale === 'zh-CN' ? '最近玩过：' : 'Played: ')} {new Date(record.gameStartTime || record.timestamp).toLocaleString(
                  locale === 'zh-CN' ? 'zh-CN' : 'en-US',
                  { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={handleBack}
        className="glass-btn-active w-full mt-2 shrink-0 h-10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        {t('leaderboard.backToLeaderboard') || '返回排行榜'}
      </button>
    </div>
  );
};

export default RecentGameDetails;