"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { GameRecord } from '@/types/puzzleTypes';

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

  return (
    <div className="flex flex-col h-full">
      {/* 成绩详情标题 */}
      <div className="mb-4">
        <h3 className="font-medium text-[#FFD5AB] mb-2 text-sm flex items-center gap-1">
          🏆 最近游戏成绩
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
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">{t('score.breakdown.base')}：{t(`difficulty.${record.difficulty.difficultyLevel}`)}</span>
                  <span className="text-[#FFD5AB]">{record.scoreBreakdown.baseScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">
                    {t('score.breakdown.timeBonus')}：{getSpeedRankText(record.scoreBreakdown.timeBonusRank)}
                  </span>
                  <span className="text-green-400">+{record.scoreBreakdown.timeBonus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">
                    {t('score.breakdown.rotationScore')}：{record.totalRotations}/{record.scoreBreakdown.minRotations || '?'}{t('leaderboard.timesUnit')}
                  </span>
                  <span className={record.scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400"}>
                    {record.scoreBreakdown.rotationScore >= 0 ? '+' : ''}{record.scoreBreakdown.rotationScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FFD5AB]">
                    {t('score.breakdown.hintScore')}：{record.hintUsageCount}/{record.scoreBreakdown.hintAllowance || 0}{t('leaderboard.timesUnit')}
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
                  <div className="flex justify-between mb-2">
                    <span className="text-[#FFD5AB]">{t('score.breakdown.multiplier')}：</span>
                    <span className="text-[#FFD5AB]">×{record.scoreBreakdown.difficultyMultiplier}</span>
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
          minHeight: 48,
          height: 48,
          padding: '0 16px',
          lineHeight: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        variant="ghost"
      >
        <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '6px', flexShrink: 0 }} strokeWidth={2} />
        {t('leaderboard.backToLeaderboard')}
      </Button>
    </div>
  );
};

export default GameRecordDetails;