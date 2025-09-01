"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';

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

  // 获取速度奖励显示文本 - 显示实际游戏时长和奖励条件
  const getSpeedBonusText = (duration: number): string => {
    const actualTime = formatTime(duration);

    if (duration <= 10) {
      return `${actualTime} (${t('score.speedBonus.within10s')})`;
    } else if (duration <= 30) {
      return `${actualTime} (${t('score.speedBonus.within30s')})`;
    } else if (duration <= 60) {
      return `${actualTime} (${t('score.speedBonus.within1min')})`;
    } else if (duration <= 90) {
      return `${actualTime} (${t('score.speedBonus.within1min30s')})`;
    } else if (duration <= 120) {
      return `${actualTime} (${t('score.speedBonus.within2min')})`;
    } else {
      return `${actualTime} (${t('score.speedBonus.over2min')})`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 滚动内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-3 text-xs">
        {/* 本局成绩 - 与GameRecordDetails完全一致 */}
        <div className="bg-[#2A2A2A] rounded-lg p-3">
          <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1">
            🏆 最近一次游戏成绩
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
                    {t('score.breakdown.timeBonus')}：{record.scoreBreakdown.timeBonus > 0 ? getSpeedBonusText(record.totalDuration) : t('score.noReward')}
                  </span>
                  <span className="text-green-400">+{record.scoreBreakdown.timeBonus}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[#FFD5AB] flex-1 min-w-0">
                    <span className="block">{t('score.breakdown.rotationScore')}：{record.totalRotations}/{record.scoreBreakdown.minRotations}（{record.totalRotations === record.scoreBreakdown.minRotations ? t('rotation.perfect') : t('rotation.excess', { count: record.totalRotations - record.scoreBreakdown.minRotations })}）
                    </span>
                  </span>
                  <span className={`${record.scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400"} ml-2 flex-shrink-0`}>
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