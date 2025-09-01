import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown } from '@/types/puzzleTypes';
import { Trophy, Clock, RotateCw, Lightbulb, Move, X, Star } from 'lucide-react';
import { calculateRotationEfficiencyPercentage } from '@/utils/score/ScoreCalculator';
import { RotationEfficiencyCalculator } from '@/utils/score/RotationEfficiencyCalculator';

import './animations.css';

interface DesktopScoreLayoutProps {
  gameStats: GameStats;
  scoreBreakdown?: ScoreBreakdown;
  currentScore: number;
  isNewRecord?: boolean;
  currentRank?: number;
  onClose?: () => void;
  showAnimation?: boolean;
  embedded?: boolean;
}

/**
 * 桌面端详细分数展示布局
 * 显示完整的分数计算过程和详细统计信息
 */
export const DesktopScoreLayout: React.FC<DesktopScoreLayoutProps> = ({
  gameStats,
  scoreBreakdown,
  currentScore,
  isNewRecord,
  currentRank,
  onClose,
  showAnimation = true,
  embedded = false
}) => {
  const { t } = useTranslation();

  // 格式化时间显示
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化分数显示
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  // 获取分数颜色类名
  const getScoreColorClass = (score: number): string => {
    if (score > 0) return 'text-green-600';
    if (score < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // 获取效率百分比
  const getEfficiencyPercentage = (actual: number, optimal: number): number => {
    if (optimal === 0) return 100;
    return Math.round((optimal / actual) * 100);
  };

  // 获取旋转效率评级文本 - 使用新算法
  const getRotationRatingTextForDisplay = (actual: number, optimal: number): string => {
    if (!optimal || optimal === 0) return '未知';
    
    try {
      const result = RotationEfficiencyCalculator.calculateScore(actual, optimal);
      return result.isPerfect ? '完美' : `超出${result.excessRotations}次`;
    } catch (error) {
      // 降级到简化的显示方式
      const efficiency = calculateRotationEfficiencyPercentage(actual, optimal);
      if (efficiency >= 100) return '完美';
      if (efficiency >= 80) return '接近完美';
      if (efficiency >= 60) return '旋转有点多';
      if (efficiency >= 40) return '旋转太多了';
      if (efficiency >= 20) return '请减少旋转';
      return '看清楚再旋转';
    }
  };

  // 获取难度描述
  const getDifficultyDescription = (difficulty: any): string => {
    const levelMap = {
      'easy': '简单',
      'medium': '中等', 
      'hard': '困难',
      'extreme': '极难'
    };
    return levelMap[difficulty.difficultyLevel as keyof typeof levelMap] || '未知';
  };

  // 获取切割类型文本
  const getCutTypeText = (cutType: string): string => { 
    return cutType === 'diagonal' ? '斜线' : '直线';
  };

  // 获取设备类型文本
  const getDeviceTypeText = (deviceType?: string): string => {
    if (!deviceType) return '桌面端';
    if (deviceType.includes('mobile')) return '移动端';
    if (deviceType.includes('ipad')) return 'iPad';
    return '桌面端';
  };

  // 获取速度奖励显示文本 - 显示实际游戏时长和奖励条件
  const getSpeedBonusText = (duration: number): string => {
    const actualTime = formatDuration(duration);
    
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

  // 嵌入模式使用简洁样式，模态模式使用完整样式
  const containerClass = embedded 
    ? "desktop-score-layout-embedded" 
    : "desktop-score-layout bg-white rounded-lg shadow-xl max-w-2xl mx-auto";

  return (
    <div className={containerClass}>
      {/* 标题栏 */}
      <div className={embedded 
        ? "flex items-center justify-between mb-4" 
        : "flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50"
      }>
        <div className="flex items-center gap-3">
          <Trophy className={embedded ? "w-5 h-5 text-yellow-500" : "w-8 h-8 text-yellow-500"} />
          <div>
            <h2 id="score-display-title" className={embedded 
              ? "text-lg font-bold text-[#FFD5AB]" 
              : "text-2xl font-bold text-gray-800"
            }>
              {t('stats.gameComplete')}
            </h2>
            {isNewRecord && (
              <div className="flex items-center gap-2 mt-1 newRecordAnimation">
                <Star className="w-5 h-5 text-yellow-500 rankBadgeAnimation" />
                <span className="text-sm font-medium text-yellow-700">
                  {t('score.newRecord')} - {t('leaderboard.rank', { rank: currentRank || 1 })}
                </span>
              </div>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* 最终分数展示 */}
        <div className="text-center">
          <div className={`text-4xl font-bold text-blue-600 mb-2 ${showAnimation ? 'scoreCountUpAnimation' : ''}`}>
            {formatScore(currentScore)}
          </div>
          <div className="text-lg text-gray-600">
            {t('score.final')}
          </div>
        </div>

        {/* 游戏统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className={`bg-blue-50 rounded-lg p-4 text-center interactiveCard ${showAnimation ? 'statsCardAnimation animationDelay1' : ''}`}>
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-600">
              {formatDuration(gameStats.totalDuration)}
            </div>
            <div className="text-sm text-gray-600">{t('stats.duration')}</div>
          </div>

          <div className={`bg-green-50 rounded-lg p-4 text-center interactiveCard ${showAnimation ? 'statsCardAnimation animationDelay2' : ''}`}>
            <RotateCw className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-600">
              {gameStats.totalRotations}
              {gameStats.minRotations > 0 && (
                <span className="text-sm text-gray-500 ml-1">
                  / {gameStats.minRotations}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{t('stats.rotations')}</div>
            {gameStats.minRotations > 0 && (
              <div className="text-xs text-green-700 mt-1">
                {getEfficiencyPercentage(gameStats.totalRotations, gameStats.minRotations)}% {t('stats.efficiency.short')}
              </div>
            )}
          </div>

          <div className={`bg-yellow-50 rounded-lg p-4 text-center interactiveCard ${showAnimation ? 'statsCardAnimation animationDelay3' : ''} ${gameStats.hintUsageCount === 0 && gameStats.hintAllowance > 0 ? 'perfectGameHighlight' : ''}`}>
            <Lightbulb className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-yellow-600">
              {gameStats.hintUsageCount}
              {gameStats.hintAllowance > 0 && (
                <span className="text-sm text-gray-500 ml-1">
                  / {gameStats.hintAllowance}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{t('stats.hints')}</div>
            {gameStats.hintUsageCount === 0 && gameStats.hintAllowance > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-yellow-700 mt-1">
                <Trophy className="w-3 h-3" />
                {t('stats.perfectHints')}
              </div>
            )}
          </div>

          <div className={`bg-purple-50 rounded-lg p-4 text-center interactiveCard ${showAnimation ? 'statsCardAnimation animationDelay4' : ''}`}>
            <Move className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-purple-600">
              {gameStats.dragOperations}
            </div>
            <div className="text-sm text-gray-600">{t('stats.drags')}</div>
          </div>
        </div>

        {/* 分数详情 - 按设计文档格式 */}
        {scoreBreakdown && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📊 分数详情
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="text-gray-700">游戏时长：{formatDuration(gameStats.totalDuration)}</div>
              <div className="text-gray-700">基础分数：{formatScore(scoreBreakdown.baseScore)}</div>
              <div className="text-gray-700">
                速度奖励：{scoreBreakdown.timeBonus > 0 ? '+' : ''}{formatScore(scoreBreakdown.timeBonus)}
                {/* 显示基于新规则的速度奖励说明 */}
                {scoreBreakdown.timeBonus > 0 && (
                  <span className="text-green-600">（{getSpeedBonusText(gameStats.totalDuration)}）</span>
                )}
              </div>
              <div className="text-gray-700">
                旋转评分：{scoreBreakdown.rotationScore > 0 ? '+' : ''}{formatScore(scoreBreakdown.rotationScore)}
                （{gameStats.totalRotations}/{gameStats.minRotations || '?'}，{getRotationRatingTextForDisplay(gameStats.totalRotations, gameStats.minRotations)}）
              </div>
              <div className="text-gray-700">
                提示使用：{scoreBreakdown.hintScore > 0 ? '+' : ''}{formatScore(scoreBreakdown.hintScore)}
                （{gameStats.hintUsageCount}/{gameStats.hintAllowance || 0}次）
              </div>
              
              <div className="border-t pt-2 mt-3">
                <div className="text-center text-gray-400 text-xs mb-2">─────────────────</div>
                <div className="text-gray-700">小计：{formatScore(
                  scoreBreakdown.baseScore + 
                  scoreBreakdown.timeBonus + 
                  scoreBreakdown.rotationScore + 
                  scoreBreakdown.hintScore
                )}</div>
                <div className="text-gray-700">
                  难度{getDifficultyDescription(gameStats.difficulty)}：{gameStats.difficulty.actualPieces}片+{getCutTypeText(gameStats.difficulty.cutType)}+{getDeviceTypeText(gameStats.deviceType)}
                </div>
                <div className="text-gray-700">难度系数：×{scoreBreakdown.difficultyMultiplier}</div>
                <div className="text-lg font-bold text-blue-600 mt-2">最终得分：{formatScore(scoreBreakdown.finalScore)}</div>
              </div>
            </div>
          </div>
        )}

        {/* 榜单提示 */}
        {isNewRecord && currentRank && currentRank <= 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-yellow-800 font-bold text-lg flex items-center justify-center gap-2">
              🎉 恭喜！您的成绩已进入排行榜！
            </div>
            <div className="text-yellow-700 mt-2">
              🏆 排名：第{currentRank}名
            </div>
            <div className="text-yellow-600 text-sm mt-1">
              点击排行榜按钮查看完整榜单
            </div>
          </div>
        )}

        {/* 游戏信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('stats.difficulty')}</span>
              <span className="font-medium">{t(`difficulty.${gameStats.difficulty.difficultyLevel}`)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('stats.cutType')}</span>
              <span className="font-medium">{t(`cutType.${gameStats.difficulty.cutType}`)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('stats.pieces')}</span>
              <span className="font-medium">{gameStats.difficulty.actualPieces}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('stats.device')}</span>
              <span className="font-medium capitalize">{gameStats.deviceType || 'desktop'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopScoreLayout;