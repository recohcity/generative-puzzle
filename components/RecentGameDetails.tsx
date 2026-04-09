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
    <div className="flex flex-col h-full">
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1 custom-scrollbar">
        {/* 本局成绩 - 与GameRecordDetails完全一致 */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h4 className="text-[#FFB17A] font-bold mb-4 text-sm flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {t('stats.scoreHistory')}
          </h4>

          {/* 最终得分和游戏时长 - 统一格式 */}
          <div className="text-center mb-6 p-4 bg-gradient-to-br from-[#FFD5AB]/10 to-[#F68E5F]/10 rounded-xl border border-[#FFD5AB]/20">
            <div className="text-4xl font-black text-[#FFD5AB] mb-1 tracking-tighter drop-shadow-sm">
              {record.finalScore.toLocaleString()}
            </div>
            <div className="text-xs text-[#FFD5AB]/60 font-bold uppercase tracking-widest">
              {t('score.breakdown.gameDuration')}：{formatTime(record.totalDuration)}
            </div>
          </div>

          {/* 分数构成 - 统一格式 */}
          {record.scoreBreakdown && (
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="space-y-2.5 text-xs text-[#FFD5AB]/80">
                <div className="flex justify-between items-center">
                  <span className="flex flex-col">
                    <span className="font-bold text-[#FFD5AB] opacity-60 uppercase text-[10px] tracking-widest mb-0.5">{t('score.breakdown.base')}</span>
                    <span className="text-[10px] leading-tight text-[#FFD5AB]/40">{(() => {
                      const shapeName = getShapeDisplayName(record.difficulty?.shapeType);
                      const cutTypeName = getCutTypeDisplayName(record.difficulty?.cutType);
                      const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount });
                      const piecesPart = `${record.difficulty?.actualPieces || 0}${t('stats.piecesUnit')}`;
                      const parts = [levelText];
                      if (shapeName) parts.push(shapeName);
                      if (cutTypeName) parts.push(cutTypeName);
                      parts.push(piecesPart);
                      return parts.join(' · ');
                    })()}</span>
                  </span>
                  <span className="text-sm font-black text-[#FFD5AB]">{record.scoreBreakdown.baseScore}</span>
                </div>
                
                <div className="flex justify-between items-center py-1 border-t border-white/5">
                  <span className="flex flex-col">
                    <span className="font-bold text-[#FFD5AB] opacity-60 uppercase text-[10px] tracking-widest mb-0.5">{t('score.breakdown.timeBonus')}</span>
                    <span className="text-[10px] text-[#FFD5AB]/40">{getSpeedBonusText(record.totalDuration)}</span>
                  </span>
                  <span className="text-sm font-black text-green-400">+{record.scoreBreakdown.timeBonus}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-white/5">
                  <span className="flex flex-col">
                    <span className="font-bold text-[#FFD5AB] opacity-60 uppercase text-[10px] tracking-widest mb-0.5">{t('score.breakdown.rotationScore')}</span>
                    <span className="text-[10px] text-[#FFD5AB]/40">{record.totalRotations}/{record.scoreBreakdown.minRotations}（{record.totalRotations === record.scoreBreakdown.minRotations ? t('rotation.perfect') : t('rotation.excess', { count: record.totalRotations - record.scoreBreakdown.minRotations })}）</span>
                  </span>
                  <span className={cn("text-sm font-black", record.scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400")}>
                    {record.scoreBreakdown.rotationScore >= 0 ? '+' : ''}{record.scoreBreakdown.rotationScore}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-white/5">
                  <span className="flex flex-col">
                    <span className="font-bold text-[#FFD5AB] opacity-60 uppercase text-[10px] tracking-widest mb-0.5">{t('score.breakdown.hintScore')}</span>
                    <span className="text-[10px] text-[#FFD5AB]/40">{record.hintUsageCount}/{record.scoreBreakdown.hintAllowance || 0}{t('leaderboard.timesUnit')}</span>
                  </span>
                  <span className={cn("text-sm font-black", record.scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400")}>
                    {record.scoreBreakdown.hintScore >= 0 ? '+' : ''}{record.scoreBreakdown.hintScore}
                  </span>
                </div>

                <div className="border-t-2 border-white/10 pt-3 mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#FFD5AB] opacity-60 uppercase text-[10px] tracking-widest">{t('score.breakdown.multiplier')}</span>
                    <span className="text-sm font-black text-[#FFD5AB]">×{record.scoreBreakdown.difficultyMultiplier.toFixed(2)}</span>
                  </div>
                  <div className="text-[#FFD5AB]/40 text-[9px] text-right italic leading-none">
                    ({getMultiplierBreakdown(record.difficulty, record.scoreBreakdown.difficultyMultiplier)})
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/10">
                    <span className="text-sm font-black text-[#FFB17A] uppercase tracking-tighter">{t('score.breakdown.final')}</span>
                    <span className="text-xl font-black text-[#FFD5AB] tracking-tighter">{record.finalScore.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 游戏时间 */}
          <div className="mt-3 text-center">
            <div className="text-sm text-[#FFD5AB] opacity-80">
              {t('score.breakdown.gameTime')}：{new Date(record.gameStartTime || record.timestamp).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 返回按钮 - 与切割形状按钮样式完全一致 */}
      <Button
        onClick={handleBack}
        className="w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md"
        style={{
          fontSize: '14px',
          borderRadius: '14px',
          minHeight: 36,
          height: 36,
          padding: '0 16px',
          lineHeight: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        variant="ghost"
      >
        <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '8px', flexShrink: 0 }} strokeWidth={2} />
        <span style={{ fontSize: '14px' }}>{t('leaderboard.backToLeaderboard')}</span>
      </Button>
    </div>
  );
};

export default RecentGameDetails;