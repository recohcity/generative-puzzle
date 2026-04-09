"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Timer, RotateCw, HelpCircle, Layers, Star } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { GameRecord } from '@generative-puzzle/game-core';
import { getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";

interface GameRecordDetailsProps {
  record: GameRecord;
  onBack: () => void;
}

const GameRecordDetails: React.FC<GameRecordDetailsProps> = ({ 
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

  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType;
    }
  };

  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  const getSpeedDisplay = () => {
    const pieceCount = record.difficulty?.actualPieces || 0;
    const difficultyLevel = record.difficulty?.cutCount || 1;
    const speedDetails = getSpeedBonusDetails(record.totalDuration, pieceCount, difficultyLevel);
    
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
    return t('score.noReward') || '无记录';
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 p-2">
      {/* 成绩详情标题 */}
      <div className="mb-4 shrink-0 px-2 pt-1">
        <h2 className="text-premium-title text-sm flex items-center gap-2 uppercase tracking-[0.2em]">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {t('leaderboard.scoreDetails') || '最近一次游戏成绩'}
        </h2>
      </div>
      
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5 pb-4 space-y-4">
        {/* 分数总览区域 - 极致玻璃态 */}
        <div className="glass-panel p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD5AB]/10 to-[#F68E5F]/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-5xl font-black text-[#FFD5AB] mb-2 tracking-tighter drop-shadow-[0_4px_12px_rgba(246,142,95,0.4)]">
              {record.finalScore.toLocaleString()}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-premium-label text-[10px] tracking-widest uppercase">
              <Timer className="w-3 h-3 text-[#F68E5F]" />
              {t('game.leaderboard.time') || '时间'}：{formatTime(record.totalDuration)}
            </div>
          </div>
        </div>

        {/* 详细计分列表 */}
        <div className="space-y-2.5">
          {/* 难度维度 */}
          <div className="glass-card p-4 flex items-center gap-4 group hover:bg-white/[0.08] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#F68E5F]/20 flex items-center justify-center shrink-0 border border-[#F68E5F]/30 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5 text-[#FFD5AB]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-premium-label text-[10px] mb-0.5 opacity-60">{t('score.breakdown.base') || '难度基础'}</div>
              <div className="text-[#FFD5AB] font-bold text-sm truncate">
                {t('difficulty.levelLabel', { level: record.difficulty.cutCount })} · {getShapeDisplayName(record.difficulty?.shapeType)} · {getCutTypeDisplayName(record.difficulty?.cutType)}
              </div>
            </div>
            <div className="text-premium-value text-lg font-black tabular-nums">
              {record.scoreBreakdown?.baseScore || 0}
            </div>
          </div>

          {/* 速度维度 */}
          <div className="glass-card p-4 flex items-center gap-4 group hover:bg-white/[0.08] transition-all">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-premium-label text-[10px] mb-0.5 opacity-60">{t('score.breakdown.timeBonus') || '速度奖励'}</div>
              <div className="text-green-400/90 font-bold text-sm">
                {getSpeedDisplay()}
              </div>
            </div>
            <div className="text-green-400 font-black text-lg tabular-nums">
              +{record.scoreBreakdown?.timeBonus || 0}
            </div>
          </div>

          {/* 交互精度维度 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="glass-card p-4 flex flex-col gap-2 group hover:bg-white/[0.08] transition-all">
              <div className="flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-premium-label text-[9px] opacity-60 uppercase">{t('score.breakdown.rotationScore') || '旋转'}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-white/40 text-[10px] tabular-nums">{record.totalRotations} 次</span>
                <span className={cn("font-black text-sm", (record.scoreBreakdown?.rotationScore || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                  {(record.scoreBreakdown?.rotationScore || 0) >= 0 ? '+' : ''}{record.scoreBreakdown?.rotationScore || 0}
                </span>
              </div>
            </div>
            <div className="glass-card p-4 flex flex-col gap-2 group hover:bg-white/[0.08] transition-all">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-premium-label text-[9px] opacity-60 uppercase">{t('score.breakdown.hintScore') || '提示'}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-white/40 text-[10px] tabular-nums">{record.hintUsageCount} 次</span>
                <span className={cn("font-black text-sm", (record.scoreBreakdown?.hintScore || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                  {(record.scoreBreakdown?.hintScore || 0) >= 0 ? '+' : ''}{record.scoreBreakdown?.hintScore || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 难度系数区块 */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="text-premium-label text-[10px] opacity-40">{t('score.breakdown.multiplier') || '难度等效系数'}</div>
            <div className="text-[#F68E5F] font-black text-lg">×{record.scoreBreakdown?.difficultyMultiplier.toFixed(2)}</div>
          </div>
        </div>

        {/* 底部时间戳 */}
        <div className="text-center pb-2 opacity-30">
          <div className="text-[10px] text-premium-label uppercase tracking-widest">
            {new Date(record.gameStartTime || record.timestamp).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
      
      {/* 返回按钮 - 统一橙色玻璃态 */}
      <Button
        onClick={handleBack}
        className="glass-btn-active w-full shadow-lg shadow-[#F68E5F]/20 h-12 rounded-2xl text-[13px] uppercase tracking-[0.1em] mt-2 group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        {t('leaderboard.backToLeaderboard') || '返回'}
      </Button>
    </div>
  );
};

export default GameRecordDetails;