"use client";

import { Button } from "@/components/ui/button";
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

  // 获取切割类型系数
  const getCutTypeMultiplier = (cutType?: string): number => {
    const multipliers: Record<string, number> = {
      'straight': 1.0,
      'diagonal': 1.15,
      'curve': 1.25
    };
    return multipliers[cutType || 'straight'] || 1.0;
  };

  // 获取形状类型系数
  const getShapeTypeMultiplier = (shapeType?: string): number => {
    const multipliers: Record<string, number> = {
      'polygon': 1.0,
      'cloud': 1.1,
      'jagged': 1.05
    };
    return multipliers[shapeType || 'polygon'] || 1.0;
  };

  // 获取难度系数分解显示
  const getMultiplierBreakdown = (difficulty: any, multiplier: number): string => {
    const cutMult = getCutTypeMultiplier(difficulty?.cutType);
    const shapeMult = getShapeTypeMultiplier(difficulty?.shapeType);
    const baseMult = multiplier / cutMult / shapeMult;
    
    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType) || (locale === 'en' ? 'Straight' : '直线');
    const shapeName = getShapeDisplayName(difficulty?.shapeType) || (locale === 'en' ? 'Polygon' : '多边形');
    const baseLabel = t('score.breakdown.baseMultiplier') || (locale === 'en' ? 'Base' : '基础');
    
    return `${baseLabel}${baseMult.toFixed(2)} × ${cutTypeName}${cutMult.toFixed(2)} × ${shapeName}${shapeMult.toFixed(2)}`;
  };

  const subtotal = (record.scoreBreakdown?.baseScore || 0) + 
                  (record.scoreBreakdown?.timeBonus || 0) + 
                  (record.scoreBreakdown?.rotationScore || 0) + 
                  (record.scoreBreakdown?.hintScore || 0);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 成绩详情标题 */}
      <div className="mb-6 shrink-0">
        <h2 className="text-premium-title font-black text-sm flex items-center gap-3 uppercase tracking-[0.2em]">
          <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
          {t('leaderboard.scoreDetails') || '最近一次游戏成绩'}
        </h2>
      </div>
      
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5 pb-4">
        {/* 分数主展示区 */}
        <div className="glass-panel p-6 mb-6 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD5AB]/5 to-[#F68E5F]/5 pointer-events-none" />
          <div className="absolute -top-4 -right-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <Trophy className="w-32 h-32" />
          </div>
          
          <div className="text-5xl font-black text-premium-value mb-2 tracking-tighter drop-shadow-2xl">
            {record.finalScore.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-premium-label opacity-60 font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3 text-[#FFD5AB]/40" />
            {t('score.breakdown.gameDuration') || '游戏时长'}：{formatTime(record.totalDuration)}
          </div>
        </div>

        {/* 详细计分明细 */}
        <div className="glass-card bg-black/40 border-white/5 p-6 space-y-6">
          {/* 明细条目 */}
          {[
            { 
              label: t('score.breakdown.base'), 
              value: record.scoreBreakdown?.baseScore, 
              theme: "text-[#FFD5AB]", 
              desc: (() => {
                const shapeName = getShapeDisplayName(record.difficulty?.shapeType);
                const cutTypeName = getCutTypeDisplayName(record.difficulty?.cutType);
                const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount });
                const piecesPart = `${record.difficulty?.actualPieces || 0}P`;
                return [levelText, shapeName, cutTypeName, piecesPart].filter(Boolean).join(' · ');
              })()
            },
            { 
              label: t('score.breakdown.timeBonus'), 
              value: record.scoreBreakdown?.timeBonus, 
              theme: "text-green-400", 
              desc: "速度加成奖励", 
              prefix: "+" 
            },
            { 
              label: t('score.breakdown.rotationScore'), 
              value: record.scoreBreakdown?.rotationScore, 
              theme: (record.scoreBreakdown?.rotationScore || 0) >= 0 ? "text-green-400" : "text-red-400", 
              desc: `${record.totalRotations}回旋转记录`, 
              prefix: (record.scoreBreakdown?.rotationScore || 0) > 0 ? "+" : "" 
            },
            { 
              label: t('score.breakdown.hintScore'), 
              value: record.scoreBreakdown?.hintScore, 
              theme: (record.scoreBreakdown?.hintScore || 0) >= 0 ? "text-green-400" : "text-red-400", 
              desc: `${record.hintUsageCount}/${record.scoreBreakdown?.hintAllowance || 0}次提示使用`, 
              prefix: (record.scoreBreakdown?.hintScore || 0) > 0 ? "+" : "" 
            }
          ].map((item, id) => (item.value !== undefined &&
            <div key={id} className="flex justify-between items-start group">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-premium-label group-hover:text-[#FFD5AB] transition-colors">{item.label}</div>
                <div className="text-[10px] text-white/20 italic leading-none">{item.desc}</div>
              </div>
              <div className={cn("text-base font-black tabular-nums tracking-tighter", item.theme)}>
                {item.prefix}{item.value.toLocaleString()}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/5 space-y-5">
            {/* 小计 */}
            <div className="flex justify-between items-center opacity-60">
              <div className="text-xs font-bold text-premium-label uppercase tracking-widest">{t('score.breakdown.subtotal') || '小计'}</div>
              <div className="text-lg font-black text-premium-value tabular-nums">
                {subtotal.toLocaleString()}
              </div>
            </div>

            {/* 难度系数 */}
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-premium-label">{t('score.breakdown.multiplier')}</div>
                <div className="text-[9px] text-white/30 italic leading-none opacity-40">
                  ({getMultiplierBreakdown(record.difficulty, record.scoreBreakdown?.difficultyMultiplier || 1)})
                </div>
              </div>
              <div className="text-2xl font-black text-[#FFD5AB] group-hover:scale-105 transition-transform">
                ×{record.scoreBreakdown?.difficultyMultiplier.toFixed(2)}
              </div>
            </div>

            {/* 最终得分 */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
              <div className="text-xl font-black text-premium-title uppercase tracking-tighter">{t('score.breakdown.final') || '最终得分'}</div>
              <div className="text-4xl font-black text-[#F68E5F] tracking-tighter drop-shadow-[0_0_15px_rgba(246,142,95,0.3)]">
                {record.finalScore.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 底部时间脚注 */}
        <div className="mt-8 text-center pt-4 opacity-30">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
            {t('score.breakdown.gameTime') || '游戏时间'}
          </div>
          <div className="text-xs font-medium">
            {new Date(record.gameStartTime || record.timestamp).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
               year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      </div>
      
      {/* 返回按钮 */}
      <button
        onClick={handleBack}
        className="w-full h-12 rounded-2xl bg-[#F68E5F] hover:bg-[#F47B42] text-[#232035] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#F68E5F]/20 mt-4 shrink-0 uppercase tracking-widest text-sm"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={3} />
        {t('leaderboard.backToLeaderboard') || '返回排行榜'}
      </button>
    </div>
  );
};

export default GameRecordDetails;