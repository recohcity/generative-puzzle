import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown } from '@/types/puzzleTypes';
import { Trophy, Clock, RotateCw, Lightbulb, Move, X, Star } from 'lucide-react';
import { calculateRotationEfficiencyPercentage, getSpeedBonusDescription, getSpeedBonusDetails } from '@/utils/score/ScoreCalculator';
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
  const { t, locale } = useTranslation();

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

  // 获取难度显示：改为数值等级
  const getDifficultyLabel = (difficulty: any): string => {
    // 使用i18n：中文 -> 难度{level}；英文 -> Level {level}
    return t('difficulty.levelLabel', { level: difficulty.cutCount });
  };

  // 获取切割类型文本（使用i18n）
  const getCutTypeText = (cutType: string): string => { 
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType === 'diagonal' ? '斜线' : cutType === 'curve' ? '曲线' : '直线';
    }
  };

  // 获取形状类型文本（使用i18n）
  const getShapeTypeText = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  // 获取设备类型文本
  const getDeviceTypeText = (deviceType?: string): string => {
    if (!deviceType) return '桌面端';
    if (deviceType.includes('mobile')) return '移动端';
    if (deviceType.includes('ipad')) return 'iPad';
    return '桌面端';
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
    const cutMult = getCutTypeMultiplier(difficulty.cutType);
    const shapeMult = getShapeTypeMultiplier(difficulty.shapeType);
    // 设备系数通常是1.0（桌面端）或1.1（移动端），这里假设为1.0（桌面端）
    // 如果需要精确计算，应该从 gameStats.deviceType 获取
    const deviceMult = 1.0; // 桌面端默认值
    // 反推基础系数：multiplier = baseMult * cutMult * shapeMult * deviceMult
    const baseMult = multiplier / cutMult / shapeMult / deviceMult;
    
    const cutTypeName = getCutTypeText(difficulty.cutType) || t('cutType.straight');
    const shapeName = getShapeTypeText(difficulty.shapeType) || t('game.shapes.names.polygon');
    const baseLabel = t('score.breakdown.baseMultiplier');
    
    return `${baseLabel}${baseMult.toFixed(2)} × ${cutTypeName}${cutMult.toFixed(2)} × ${shapeName}${shapeMult.toFixed(2)}`;
  };

  // 获取速度奖励显示文本 - 使用动态速度奖励系统（v3.3）
  const getSpeedBonusText = (duration: number): string => {
    const { difficulty } = gameStats;
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
                  <span className="text-green-600 text-[10px]">（{getSpeedBonusText(gameStats.totalDuration)}）</span>
                )}
                {/* 速度奖励详细说明 */}
                {(() => {
                  const { difficulty } = gameStats;
                  const pieceCount = difficulty?.actualPieces || 0;
                  const difficultyLevel = difficulty?.cutCount || 1;
                  const speedDetails = getSpeedBonusDetails(gameStats.totalDuration, pieceCount, difficultyLevel);
                  
                  // 格式化时间显示
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
                  
                  // 等级名称翻译
                  const getLevelName = (name: string): string => {
                    const levelMap: Record<string, { zh: string; en: string }> = {
                      '极速': { zh: '极速', en: 'Extreme' },
                      '快速': { zh: '快速', en: 'Fast' },
                      '良好': { zh: '良好', en: 'Good' },
                      '标准': { zh: '标准', en: 'Normal' },
                      '一般': { zh: '一般', en: 'Slow' }
                    };
                    return locale === 'en' ? (levelMap[name]?.en || name) : (levelMap[name]?.zh || name);
                  };
                  
                  return (
                    <div className="mt-2 ml-4 text-[10px] text-gray-500 border-l-2 border-gray-200 pl-3">
                      <div className="font-semibold text-gray-600 mb-1">{t('score.speedBonus.levelsTitle')}</div>
                      <div className="space-y-0.5">
                        {speedDetails.allLevels.map((level, index) => {
                          const isCurrent = speedDetails.currentLevel?.name === level.name;
                          const timeStr = formatTimeStr(level.maxTime);
                          const levelName = getLevelName(level.name);
                          const completeText = locale === 'en' ? 'complete within' : '内完成';
                          return (
                            <div key={index} className={isCurrent ? 'text-green-600 font-semibold' : ''}>
                              {isCurrent && '✓ '}
                              {levelName}：{timeStr}{completeText} → +{level.bonus}{locale === 'en' ? 'pts' : '分'}
                            </div>
                          );
                        })}
                      </div>
                      {speedDetails.nextLevel && speedDetails.timeToNextLevel !== null && speedDetails.timeToNextLevel > 0 && (
                        <div className="mt-2 text-blue-600">
                          💡 {locale === 'en' 
                            ? `Need ${formatTimeStr(speedDetails.timeToNextLevel)} more for next level (${getLevelName(speedDetails.nextLevel.name)})`
                            : `距离下一等级（${getLevelName(speedDetails.nextLevel.name)}）还需：${formatTimeStr(speedDetails.timeToNextLevel)}`}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="text-gray-700">
                旋转评分：{scoreBreakdown.rotationScore > 0 ? '+' : ''}{formatScore(scoreBreakdown.rotationScore)}
                <span className="text-[10px]">（{gameStats.totalRotations}/{gameStats.minRotations || '?'}，{getRotationRatingTextForDisplay(gameStats.totalRotations, gameStats.minRotations)}）</span>
              </div>
              <div className="text-gray-700">
                提示使用：{scoreBreakdown.hintScore > 0 ? '+' : ''}{formatScore(scoreBreakdown.hintScore)}
                <span className="text-[10px]">（{gameStats.hintUsageCount}/{gameStats.hintAllowance || 0}次）</span>
              </div>
              
              <div className="border-t pt-2 mt-3">
                <div className="text-center text-gray-400 text-xs mb-2">─────────────────</div>
                <div className="text-gray-700">小计：{formatScore(
                  scoreBreakdown.baseScore + 
                  scoreBreakdown.timeBonus + 
                  scoreBreakdown.rotationScore + 
                  scoreBreakdown.hintScore
                )}</div>
                <div className="text-gray-700 flex items-center gap-1">
                  <span>{getDifficultyLabel(gameStats.difficulty)}：</span>
                  <span className="text-[10px] leading-tight">{getShapeTypeText(gameStats.difficulty.shapeType) || '多边形'} · {getCutTypeText(gameStats.difficulty.cutType)} · {gameStats.difficulty.actualPieces}片</span>
                </div>
                <div className="text-gray-700">
                  难度系数：×{scoreBreakdown.difficultyMultiplier.toFixed(2)}
                  <span className="text-gray-500 text-[10px] ml-2">
                    ({getMultiplierBreakdown(gameStats.difficulty, scoreBreakdown.difficultyMultiplier)})
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-600 mt-2">最终得分：{formatScore(scoreBreakdown.finalScore)}</div>
              </div>
            </div>
          </div>
        )}

        {/* 榜单提示 */}
        {isNewRecord && currentRank && currentRank <= 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-yellow-800 font-bold text-lg flex items-center justify-center gap-2">
              🎉 恭喜！您的成绩已进入个人最佳成绩！
            </div>
            <div className="text-yellow-700 mt-2">
              🏆 排名：第{currentRank}名
            </div>
            <div className="text-yellow-600 text-sm mt-1">
              点击个人最佳成绩按钮查看完整榜单
            </div>
          </div>
        )}

        {/* 游戏信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('stats.difficulty')}</span>
              <span className="font-medium">{getDifficultyLabel(gameStats.difficulty)}</span>
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