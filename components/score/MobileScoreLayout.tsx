import React from 'react';
import { GameStats, ScoreBreakdown } from '@/types/puzzleTypes';
import { useTranslation } from '@/contexts/I18nContext';

interface MobileScoreLayoutProps {
  gameStats: GameStats;
  currentScore: number;
  scoreBreakdown?: ScoreBreakdown;
  isNewRecord?: boolean;
  currentRank?: number;
}

/**
 * 移动端紧凑成绩展示布局
 * 优化字体大小和行距，适配正方形面板空间
 */
export const MobileScoreLayout: React.FC<MobileScoreLayoutProps> = ({
  gameStats,
  currentScore,
  scoreBreakdown,
  isNewRecord,
  currentRank
}) => {
  const { t } = useTranslation();
  // 获取难度描述
  const getDifficultyText = (difficulty: any): string => {
    return t(`difficulty.${difficulty.difficultyLevel}`) || t('difficulty.easy');
  };

  // 格式化分数显示
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  // 格式化难度系数，保留小数点后2位
  const formatMultiplier = (multiplier: number): string => {
    return multiplier.toFixed(2);
  };

  // 获取速度奖励显示文本 - 基于新的速度奖励规则
  const getSpeedRankText = (duration: number): string => {
    if (duration <= 10) {
      return t('score.speedBonus.within10s');
    } else if (duration <= 30) {
      return t('score.speedBonus.within30s');
    } else if (duration <= 60) {
      return t('score.speedBonus.within1min');
    } else if (duration <= 90) {
      return t('score.speedBonus.within1min30s');
    } else if (duration <= 120) {
      return t('score.speedBonus.within2min');
    } else {
      return t('score.speedBonus.over2min');
    }
  };

  return (
    <div className="w-full">
      {/* 超紧凑标题区域 */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-yellow-400 text-sm">🏆</span>
        <h3 className="text-[#FFD5AB] text-sm font-medium">{t('stats.currentGameScore')}</h3>
      </div>

      {/* 超紧凑分数详情卡片 - 黑色背景与重新开始按钮一致 */}
      <div className="bg-[#1E1A2A] rounded-xl p-2.5">
        {scoreBreakdown ? (
          <div className="space-y-1">
            {/* 难度基础 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">{t('score.breakdown.base')}：{getDifficultyText(gameStats.difficulty)}</span>
              <span className="text-[#FFD5AB] text-xs font-medium">{formatScore(scoreBreakdown.baseScore)}</span>
            </div>

            {/* 速度奖励 */}
            {scoreBreakdown.timeBonus > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[#FFD5AB] text-xs">{t('score.breakdown.timeBonus')}：{getSpeedRankText(gameStats.totalDuration)}</span>
                <span className="text-green-400 text-xs font-medium">+{formatScore(scoreBreakdown.timeBonus)}</span>
              </div>
            )}

            {/* 旋转技巧 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">{t('score.breakdown.rotationScore')}：{gameStats.totalRotations}/{scoreBreakdown.minRotations}{t('leaderboard.timesUnit')}</span>
              <span className={`text-xs font-medium ${scoreBreakdown.rotationScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {scoreBreakdown.rotationScore >= 0 ? '+' : ''}{formatScore(scoreBreakdown.rotationScore)}
              </span>
            </div>

            {/* 提示使用 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">{t('score.breakdown.hintScore')}：{gameStats.hintUsageCount}/{scoreBreakdown.hintAllowance}{t('leaderboard.timesUnit')}</span>
              <span className={`text-xs font-medium ${scoreBreakdown.hintScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {scoreBreakdown.hintScore >= 0 ? '+' : ''}{formatScore(scoreBreakdown.hintScore)}
              </span>
            </div>

            {/* 超紧凑分隔线 */}
            <div className="border-t border-[#FFD5AB]/30 my-1"></div>

            {/* 小计 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">{t('score.breakdown.subtotal')}：</span>
              <span className="text-[#FFD5AB] text-xs font-medium">
                {formatScore(scoreBreakdown.baseScore + scoreBreakdown.timeBonus + scoreBreakdown.rotationScore + scoreBreakdown.hintScore)}
              </span>
            </div>

            {/* 难度系数 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">{t('score.breakdown.multiplier')}：</span>
              <span className="text-[#FFD5AB] text-xs font-medium">×{formatMultiplier(scoreBreakdown.difficultyMultiplier)}</span>
            </div>

            {/* 最终得分 */}
            <div className="flex justify-between items-center pt-1 border-t border-[#FFD5AB]/30">
              <span className="text-blue-300 text-sm font-bold">{t('score.breakdown.final')}：</span>
              <span className="text-blue-300 text-sm font-bold">{formatScore(currentScore)}</span>
            </div>
          </div>
        ) : (
          /* 简化显示（无分数分解数据时） */
          <div className="text-center">
            <div className="text-blue-300 text-xl font-bold mb-1">{formatScore(currentScore)}</div>
            <div className="text-[#FFD5AB] text-xs">{t('score.breakdown.final')}</div>
            {isNewRecord && (
              <div className="text-yellow-400 text-xs mt-1">🌟 {t('leaderboard.rankFormat', { rank: currentRank || 1 })}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileScoreLayout;