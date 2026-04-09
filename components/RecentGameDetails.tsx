"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDescription, getSpeedBonusDetails } from '@generative-puzzle/game-core';
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
    // 反推基础系数
    const baseMult = multiplier / cutMult / shapeMult;
    
    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType) || t('cutType.straight');
    const shapeName = getShapeDisplayName(difficulty?.shapeType) || t('game.shapes.names.polygon');
    const baseLabel = t('score.breakdown.baseMultiplier');
    
    return `${baseLabel}${baseMult.toFixed(2)} × ${cutTypeName}${cutMult.toFixed(2)} × ${shapeName}${shapeMult.toFixed(2)}`;
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
    
    // 如果没有匹配的等级（理论上不应该发生）
    const avgTimePerPiece = difficultyLevel <= 2 ? 3 : difficultyLevel <= 4 ? 5 : difficultyLevel <= 6 ? 8 : 15;
    const baseTime = pieceCount * avgTimePerPiece;
    const slowThreshold = Math.round(baseTime * 1.5);
    const timeStr = formatTimeStr(slowThreshold);
    return locale === 'en' 
      ? `Too Slow (exceeded ${timeStr})`
      : `慢（超出${timeStr}）`;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-0.5 pb-4">
        {/* 本局成绩卡片 */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD5AB]/5 to-[#F68E5F]/5 pointer-events-none" />
          
          <h4 className="text-premium-title font-black mb-6 text-sm flex items-center gap-3 uppercase tracking-[0.2em]">
            <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            {t('stats.scoreHistory')}
          </h4>

          {/* 核心分数区域 - 极简主义的高级感 */}
          <div className="text-center mb-8 py-8 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Trophy className="w-24 h-24" />
            </div>
            <div className="text-5xl font-black text-premium-value tracking-tighter mb-2 drop-shadow-2xl">
              {record.finalScore.toLocaleString()}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-premium-label opacity-60 font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {t('score.breakdown.gameDuration')}：{formatTime(record.totalDuration)}
            </div>
          </div>

          {/* 分数详细分解 - 与游戏完结界面统一 */}
          {record.scoreBreakdown && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-premium-label opacity-40 uppercase tracking-[0.2em] flex items-center gap-2">
                {t('score.breakdown.details') || 'BREAKDOWN'}
                <span className="flex-1 h-[1px] bg-white/5"></span>
              </h3>

              <div className="space-y-3">
                {[
                  { 
                    label: t('score.breakdown.base'), 
                    value: record.scoreBreakdown.baseScore, 
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
                    value: record.scoreBreakdown.timeBonus, 
                    theme: "text-green-400", 
                    desc: getSpeedBonusText(record.totalDuration), 
                    prefix: "+" 
                  },
                  { 
                    label: t('score.breakdown.rotationScore'), 
                    value: record.scoreBreakdown.rotationScore, 
                    theme: record.scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400", 
                    desc: `${record.totalRotations}旋转 (${record.totalRotations === record.scoreBreakdown.minRotations ? t('rotation.perfect') : t('rotation.excess', { count: record.totalRotations - record.scoreBreakdown.minRotations })})`, 
                    prefix: record.scoreBreakdown.rotationScore > 0 ? "+" : "" 
                  },
                  { 
                    label: t('score.breakdown.hintScore'), 
                    value: record.scoreBreakdown.hintScore, 
                    theme: record.scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400", 
                    desc: `${record.hintUsageCount}/${record.scoreBreakdown.hintAllowance || 0}次提示`, 
                    prefix: record.scoreBreakdown.hintScore > 0 ? "+" : "" 
                  }
                ].map((item, id) => (
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

                <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-premium-label">{t('score.breakdown.multiplier')}</div>
                      <div className="text-[9px] text-white/30 italic leading-none opacity-60">({getMultiplierBreakdown(record.difficulty, record.scoreBreakdown.difficultyMultiplier)})</div>
                    </div>
                    <div className="text-2xl font-black text-[#FFD5AB] group-hover:scale-105 transition-transform">
                      ×{record.scoreBreakdown.difficultyMultiplier.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-2">
                    <div className="text-xl font-black text-premium-title uppercase tracking-tighter">
                      {t('score.breakdown.final')}
                    </div>
                    <div className="text-3xl font-black text-[#F68E5F] tracking-tighter drop-shadow-[0_0_15px_rgba(246,142,95,0.3)]">
                      {record.finalScore.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 游戏时间脚注 */}
          <div className="mt-8 text-center pt-4 border-t border-white/5">
            <div className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] mb-1">
              {t('score.breakdown.gameTime')}
            </div>
            <div className="text-xs text-premium-label opacity-60">
              {new Date(record.gameStartTime || record.timestamp).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 返回按钮 */}
      <button
        onClick={handleBack}
        className="w-full h-12 rounded-2xl bg-[#F68E5F] hover:bg-[#F47B42] text-[#232035] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#F68E5F]/20 mt-4 shrink-0 uppercase tracking-widest text-sm"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={3} />
        {t('leaderboard.backToLeaderboard')}
      </button>
    </div>
  );
  );
};

export default RecentGameDetails;