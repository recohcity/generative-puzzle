import React from 'react';
import { GameStats, ScoreBreakdown } from '@/types/puzzleTypes';
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDescription, getSpeedBonusDetails } from '@/utils/score/ScoreCalculator';


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
  const { t, locale } = useTranslation();
  // 获取难度显示：改为数值等级
  const getDifficultyText = (difficulty: any): string => {
    return t('difficulty.levelLabel', { level: difficulty.cutCount });
  };

  // 获取形状显示名称
  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    // 使用新的形状名称翻译
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      // 降级方案：使用默认名称
      return shapeType;
    }
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

  // 获取包含形状和切割类型的难度显示文本
  const getDifficultyWithShape = (difficulty: any): string => {
    const difficultyLevel = getDifficultyText(difficulty);
    const shapeName = getShapeDisplayName(difficulty.shapeType);
    const cutTypeName = getCutTypeDisplayName(difficulty.cutType);
    const piecesPart = `${difficulty.actualPieces}${t('stats.piecesUnit')}`;

    const parts = [difficultyLevel];
    if (shapeName) parts.push(shapeName);
    if (cutTypeName) parts.push(cutTypeName);
    parts.push(piecesPart);

    return parts.join(' · ');
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
    // 反推基础系数（基础系数 = 最终系数 / 切割系数 / 形状系数）
    const baseMult = multiplier / cutMult / shapeMult;

    const cutTypeName = getCutTypeDisplayName(difficulty.cutType) || t('cutType.straight');
    const shapeName = getShapeDisplayName(difficulty.shapeType) || t('game.shapes.names.polygon');
    const baseLabel = t('score.breakdown.baseMultiplier');

    return `${baseLabel}${baseMult.toFixed(2)}×${cutTypeName}${cutMult.toFixed(2)}×${shapeName}${shapeMult.toFixed(2)}`;
  };

  // 格式化分数显示
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  // 格式化难度系数，保留小数点后2位
  const formatMultiplier = (multiplier: number): string => {
    return multiplier.toFixed(2);
  };

  // 获取速度奖励显示文本 - 使用动态速度奖励系统（v3.3）
  const getSpeedRankText = (duration: number): string => {
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

  return (
    <div className="w-full">
      {/* 极限紧凑标题区域 */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-yellow-400 text-sm">🏆</span>
        <h3 className="text-[#FFD5AB] text-sm font-medium">{t('stats.currentGameScore')}</h3>
      </div>

      {/* 极限紧凑分数详情卡片 - 减少内边距 */}
      <div className="bg-[#1E1A2A] rounded-xl p-1.5">
        {scoreBreakdown ? (
          <div className="space-y-1">
            {/* 难度基础 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs flex items-center gap-1 flex-1 min-w-0">
                <span>{t('score.breakdown.base')}：</span>
                <span className="text-xs truncate">{getDifficultyWithShape(gameStats.difficulty)}</span>
              </span>
              <span className="text-[#FFD5AB] text-xs font-medium flex-shrink-0 ml-1">{formatScore(scoreBreakdown.baseScore)}</span>
            </div>

            {/* 速度奖励 */}
            {scoreBreakdown.timeBonus > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[#FFD5AB] text-xs">
                  {t('score.breakdown.timeBonus')}：<span className="text-xs">{getSpeedRankText(gameStats.totalDuration)}</span>
                </span>
                <span className="text-green-400 text-xs font-medium">+{formatScore(scoreBreakdown.timeBonus)}</span>
              </div>
            )}

            {/* 旋转技巧 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">
                {t('score.breakdown.rotationScore')}：<span className="text-xs">{gameStats.totalRotations}/{gameStats.minRotations}（{gameStats.totalRotations === gameStats.minRotations ? t('rotation.perfect') : t('rotation.excess', { count: gameStats.totalRotations - gameStats.minRotations })}）</span>
              </span>
              <span className={`text-xs font-medium ${scoreBreakdown.rotationScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {scoreBreakdown.rotationScore >= 0 ? '+' : ''}{formatScore(scoreBreakdown.rotationScore)}
              </span>
            </div>

            {/* 提示使用 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs">
                {t('score.breakdown.hintScore')}：<span className="text-xs">{gameStats.hintUsageCount}/{scoreBreakdown.hintAllowance}{t('leaderboard.timesUnit')}</span>
              </span>
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

            {/* 难度系数 - 单行紧凑显示，防止英文换行 */}
            <div className="flex justify-between items-center">
              <span className="text-[#FFD5AB] text-xs flex items-center gap-0.5 flex-1 min-w-0 whitespace-nowrap">
                <span className="flex-shrink-0">{t('score.breakdown.multiplier')}：</span>
                <span className="text-xs truncate">({getMultiplierBreakdown(gameStats.difficulty, scoreBreakdown.difficultyMultiplier)})</span>
              </span>
              <span className="text-[#FFD5AB] text-xs font-medium flex-shrink-0 ml-1">×{formatMultiplier(scoreBreakdown.difficultyMultiplier)}</span>
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