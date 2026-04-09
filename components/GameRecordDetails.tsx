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
      <div className="mb-4 shrink-0">
        <h3 className="font-bold text-[#FFB17A] text-sm flex items-center gap-2 uppercase tracking-widest">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {t('leaderboard.scoreDetails') || '最近一次游戏成绩'}
        </h3>
      </div>
      
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {/* 分数总览区域 - 深蓝色调 */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl mb-4 text-center">
          <div className="text-4xl font-black text-[#A5D8FF] mb-1 tracking-tight drop-shadow-lg">
            {record.finalScore.toLocaleString()}
          </div>
          <div className="text-xs text-[#A5D8FF]/60 font-bold uppercase tracking-widest">
            {t('score.breakdown.gameDuration') || '游戏时长'}：{formatTime(record.totalDuration)}
          </div>
        </div>

        {/* 详细计分卡片 - 深色卡片 */}
        <div className="bg-[#1A1A1A]/95 border border-white/5 rounded-2xl p-5 space-y-5 shadow-2xl">
          {/* 难度得分 */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-white/90 font-bold text-sm mb-1">{t('score.breakdown.base') || '难度'}：</div>
              <div className="text-[11px] text-white/30 leading-tight">
                {(() => {
                  const shapeName = getShapeDisplayName(record.difficulty?.shapeType);
                  const cutTypeName = getCutTypeDisplayName(record.difficulty?.cutType);
                  const levelText = t('difficulty.levelLabel', { level: record.difficulty.cutCount }) || `难度${record.difficulty.cutCount}`;
                  const piecesPart = `${record.difficulty?.actualPieces || 0}${t('stats.piecesUnit') || '片'}`;
                  const parts = [levelText];
                  if (shapeName) parts.push(shapeName);
                  if (cutTypeName) parts.push(cutTypeName);
                  parts.push(piecesPart);
                  return parts.join(' · ');
                })()}
              </div>
            </div>
            <div className="text-white/90 font-black text-base tabular-nums">
              {record.scoreBreakdown?.baseScore || 0}
            </div>
          </div>

          {/* 速度加成 */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-white/90 font-bold text-sm mb-1">{t('score.breakdown.timeBonus') || '速度'}：</div>
              <div className="text-[11px] text-white/30 leading-tight">
                {(() => {
                  const pieceCount = record.difficulty?.actualPieces || 0;
                  const difficultyLevel = record.difficulty?.cutCount || 1;
                  const speedDetails = getSpeedBonusDetails(record.totalDuration, pieceCount, difficultyLevel);
                  
                  const formatTimeStr = (seconds: number): string => {
                    if (seconds < 60) return locale === 'en' ? `${seconds}s` : `${seconds}秒`;
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    return locale === 'en' ? `${mins}m${secs > 0 ? `${secs}s` : ''}` : `${mins}分${secs > 0 ? `${secs}秒` : ''}`;
                  };
                  
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
                    const timeStr = formatTimeStr(speedDetails.currentLevel.maxTime);
                    return locale === 'en' ? `${levelName} (under ${timeStr})` : `${levelName}（少于${timeStr}内）`;
                  }
                  return t('score.noReward') || '无奖励';
                })()}
              </div>
            </div>
            <div className="text-green-400 font-black text-base tabular-nums">
              +{record.scoreBreakdown?.timeBonus || 0}
            </div>
          </div>

          {/* 旋转扣分/加成 */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-white/90 font-bold text-sm mb-1">{t('score.breakdown.rotationScore') || '旋转'}：</div>
              <div className="text-[11px] text-white/30 leading-tight">
                {record.totalRotations}/{record.scoreBreakdown?.minRotations || 0}（{record.totalRotations === record.scoreBreakdown?.minRotations ? (t('rotation.perfect') || '完美') : (t('rotation.excess', { count: record.totalRotations - (record.scoreBreakdown?.minRotations || 0) }) || `超出${record.totalRotations - (record.scoreBreakdown?.minRotations || 0)}次`)}）
              </div>
            </div>
            <div className={cn("font-black text-base tabular-nums", (record.scoreBreakdown?.rotationScore || 0) >= 0 ? "text-green-400" : "text-red-400")}>
              {(record.scoreBreakdown?.rotationScore || 0) >= 0 ? '+' : ''}{record.scoreBreakdown?.rotationScore || 0}
            </div>
          </div>

          {/* 提示扣分/加成 */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-white/90 font-bold text-sm mb-1">{t('score.breakdown.hintScore') || '提示'}：</div>
              <div className="text-[11px] text-white/30 leading-tight">
                {record.hintUsageCount}/{record.scoreBreakdown?.hintAllowance || 0}{t('leaderboard.timesUnit') || '次'}
              </div>
            </div>
            <div className={cn("font-black text-base tabular-nums", (record.scoreBreakdown?.hintScore || 0) >= 0 ? "text-green-400" : "text-red-400")}>
              {(record.scoreBreakdown?.hintScore || 0) >= 0 ? '+' : ''}{record.scoreBreakdown?.hintScore || 0}
            </div>
          </div>

          <div className="h-[1px] bg-white/5 my-2" />

          {/* 小计 */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-white font-bold text-base">{t('score.breakdown.subtotal') || '小计'}：</div>
            <div className="text-white font-black text-xl tabular-nums">
              {subtotal.toLocaleString()}
            </div>
          </div>

          {/* 难度系数 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-white font-bold text-base">{t('score.breakdown.multiplier') || '难度系数'}：</div>
              <div className="text-[#FFD5AB] font-black text-xl tabular-nums">
                ×{record.scoreBreakdown?.difficultyMultiplier.toFixed(2)}
              </div>
            </div>
            <div className="text-white/20 text-[10px] text-right italic leading-none">
              ({getMultiplierBreakdown(record.difficulty, record.scoreBreakdown?.difficultyMultiplier || 1)})
            </div>
          </div>

          {/* 最终得分 - 大字突出 */}
          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <div className="text-white font-black text-lg uppercase tracking-tighter">{t('score.breakdown.final') || '最终得分'}：</div>
            <div className="text-2xl font-black text-[#A5D8FF] tracking-tight tabular-nums">
              {record.finalScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 底部时间脚注 */}
        <div className="mt-8 text-center pb-2">
          <div className="text-[12px] text-white/30 font-medium tracking-widest leading-loose">
            {t('score.breakdown.gameTime') || '游戏时间'}：{new Date(record.gameStartTime || record.timestamp).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
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
      
      {/* 返回按钮 */}
      <Button
        onClick={handleBack}
        className="w-full bg-[#fa8231] hover:bg-[#eb4d4b] text-white shadow-xl mt-2 shrink-0 h-11 rounded-xl font-bold transition-all text-sm uppercase tracking-widest"
        variant="ghost"
      >
        <ArrowLeft className="w-5 h-5 mr-1" strokeWidth={3} />
        {t('leaderboard.backToLeaderboard') || '返回排行榜'}
      </Button>
    </div>
  );
};

export default GameRecordDetails;