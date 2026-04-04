"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { GameRecord } from '@generative-puzzle/game-core';
import { getSpeedBonusDescription, getSpeedBonusDetails } from '@generative-puzzle/game-core';


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

  // 获取速度奖励显示文本
  const getSpeedRankText = (rank: number): string => {
    if (rank <= 0 || rank > 5) return t('leaderboard.noRanking');
    
    const speedTexts: Record<number, string> = {
      1: '最快',
      2: '第2快',
      3: '第3快',
      4: '第4快',
      5: '第5快'
    };
    
    return speedTexts[rank] || t('leaderboard.noRanking');
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

  return (
    <div className="flex flex-col h-full">
      {/* 成绩详情标题 */}
      <div className="mb-4">
        <h3 className="font-medium text-[#FFD5AB] mb-2 text-sm flex items-center gap-1">
          🏆 {t('stats.scoreHistory')}
        </h3>
      </div>
      
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 text-xs">
        {/* 本局成绩 */}
        <div className="bg-[#2A2A2A] rounded-lg p-3">
          <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1">
            🏆 游戏成绩
          </h4>
          
          {/* 最终得分和游戏时长 - 统一格式 */}
          <div className="text-center mb-4 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
            <div className="text-3xl font-bold text-blue-300 mb-1 tracking-wider">
              {record.finalScore.toLocaleString()}
            </div>
            <div className="text-sm text-blue-200 opacity-90 font-medium">
              {t('score.breakdown.gameDuration')}：{formatTime(record.totalDuration)}
            </div>
          </div>
          
          {/* 分数构成 - 统一格式 */}
          {record.scoreBreakdown && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#FFD5AB] flex items-center gap-1">
                    <span>{t('score.breakdown.base')}：</span>
                    <span className="text-[10px] leading-tight">{(() => {
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
                  <span className="text-[#FFD5AB]">{record.scoreBreakdown.baseScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">
                    {t('score.breakdown.timeBonus')}：{(() => {
                      const pieceCount = record.difficulty?.actualPieces || 0;
                      const difficultyLevel = record.difficulty?.cutCount || 1;
                      const speedDetails = getSpeedBonusDetails(record.totalDuration, pieceCount, difficultyLevel);
                      
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
                      
                      return t('score.noReward');
                    })()}
                  </span>
                  <span className="text-green-400">+{record.scoreBreakdown.timeBonus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">
                    {t('score.breakdown.rotationScore')}：<span className="text-[10px]">{record.totalRotations}/{record.scoreBreakdown.minRotations}（{record.totalRotations === record.scoreBreakdown.minRotations ? t('rotation.perfect') : t('rotation.excess', { count: record.totalRotations - record.scoreBreakdown.minRotations })}）</span>
                  </span>
                  <span className={record.scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400"}>
                    {record.scoreBreakdown.rotationScore >= 0 ? '+' : ''}{record.scoreBreakdown.rotationScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">
                    {t('score.breakdown.hintScore')}：<span className="text-[10px]">{record.hintUsageCount}/{record.scoreBreakdown.hintAllowance || 0}{t('leaderboard.timesUnit')}</span>
                  </span>
                  <span className={record.scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400"}>
                    {record.scoreBreakdown.hintScore >= 0 ? '+' : ''}{record.scoreBreakdown.hintScore}
                  </span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#FFD5AB]">{t('score.breakdown.subtotal')}：</span>
                    <span className="text-[#FFD5AB]">{(record.scoreBreakdown.baseScore + record.scoreBreakdown.timeBonus + record.scoreBreakdown.rotationScore + record.scoreBreakdown.hintScore)}</span>
                  </div>
                  <div className="flex flex-col mb-2">
                    <div className="flex justify-between">
                      <span className="text-[#FFD5AB]">{t('score.breakdown.multiplier')}：</span>
                      <span className="text-[#FFD5AB]">×{record.scoreBreakdown.difficultyMultiplier.toFixed(2)}</span>
                    </div>
                    <div className="text-[#FFD5AB]/70 text-[10px] text-right mt-0.5">
                      ({getMultiplierBreakdown(record.difficulty, record.scoreBreakdown.difficultyMultiplier)})
                    </div>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-[#FFD5AB]">{t('score.breakdown.final')}：</span>
                    <span className="text-blue-300">{record.finalScore.toLocaleString()}</span>
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
      
      {/* 返回按钮 - 使用与切割形状按钮一致的样式 */}
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
        {t('leaderboard.backToLeaderboard')}
      </Button>
    </div>
  );
};

export default GameRecordDetails;