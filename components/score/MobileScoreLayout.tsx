import React from 'react';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { useTranslation } from '@/contexts/I18nContext';
import { getSpeedBonusDescription, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { cn } from "@/lib/utils";


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
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[#F68E5F] text-sm">🏆</span>
        <h2 className="text-premium-title text-sm">{t('stats.currentGameScore')}</h2>
      </div>

      {/* 极限紧凑分数详情卡片 - 减少内边距 */}
      <div className="glass-card p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD5AB]/5 to-[#F68E5F]/5 pointer-events-none" />
        {scoreBreakdown ? (
          <div className="space-y-1.5">
            {/* 难度基础 */}
            <div className="flex justify-between items-center bg-white/5 p-1.5 px-2 rounded-lg border border-white/5">
              <span className="text-premium-label text-xs flex items-center gap-1 flex-1 min-w-0">
                <span className="opacity-60">{t('score.breakdown.base')}</span>
                <span className="text-[10px] truncate ml-1 opacity-40">{getDifficultyWithShape(gameStats.difficulty)}</span>
              </span>
              <span className="text-premium-value text-xs font-bold flex-shrink-0 ml-1">{formatScore(scoreBreakdown.baseScore)}</span>
            </div>

            {/* 速度奖励 */}
            {scoreBreakdown.timeBonus > 0 && (
              <div className="flex justify-between items-center bg-white/5 p-1.5 px-2 rounded-lg border border-white/5">
                <span className="text-premium-label text-xs">
                  <span className="opacity-60">{t('score.breakdown.timeBonus')}</span>
                  <span className="text-[10px] ml-2 opacity-40">{getSpeedRankText(gameStats.totalDuration)}</span>
                </span>
                <span className="text-green-400 text-xs font-black">+{formatScore(scoreBreakdown.timeBonus)}</span>
              </div>
            )}

            {/* 旋转技巧 */}
            <div className="flex justify-between items-center bg-white/5 p-1.5 px-2 rounded-lg border border-white/5">
              <span className="text-premium-label text-xs">
                <span className="opacity-60">{t('score.breakdown.rotationScore')}</span>
                <span className="text-[10px] ml-2 opacity-40">{gameStats.totalRotations}/{gameStats.minRotations}</span>
              </span>
              <span className={cn("text-xs font-black", scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400")}>
                {scoreBreakdown.rotationScore >= 0 ? '+' : ''}{formatScore(scoreBreakdown.rotationScore)}
              </span>
            </div>

            {/* 提示使用 */}
            <div className="flex justify-between items-center bg-white/5 p-1.5 px-2 rounded-lg border border-white/5">
              <span className="text-premium-label text-xs">
                <span className="opacity-60">{t('score.breakdown.hintScore')}</span>
                <span className="text-[10px] ml-2 opacity-40">{gameStats.hintUsageCount}/{scoreBreakdown.hintAllowance}</span>
              </span>
              <span className={cn("text-xs font-black", scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400")}>
                {scoreBreakdown.hintScore >= 0 ? '+' : ''}{formatScore(scoreBreakdown.hintScore)}
              </span>
            </div>

            {/* 小计 */}
            <div className="flex justify-between items-center">
              <span className="text-premium-label text-xs opacity-60">{t('score.breakdown.subtotal')}：</span>
              <span className="text-premium-value text-xs font-bold">
                {formatScore(scoreBreakdown.baseScore + scoreBreakdown.timeBonus + scoreBreakdown.rotationScore + scoreBreakdown.hintScore)}
              </span>
            </div>

            {/* 难度系数 - 单行紧凑显示，防止英文换行 */}
            <div className="flex justify-between items-center">
              <span className="text-premium-label text-[10px] flex items-center gap-0.5 flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                <span className="flex-shrink-0 opacity-60">{t('score.breakdown.multiplier')}：</span>
                <span className="truncate opacity-30">{getMultiplierBreakdown(gameStats.difficulty, scoreBreakdown.difficultyMultiplier)}</span>
              </span>
              <span className="text-[#F68E5F] text-xs font-black flex-shrink-0 ml-1">×{formatMultiplier(scoreBreakdown.difficultyMultiplier)}</span>
            </div>

            {/* 最终得分 */}
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/10">
              <span className="text-premium-label font-bold text-sm">{t('score.breakdown.final')}：</span>
              <span className="text-premium-value text-lg font-black">{formatScore(currentScore)}</span>
            </div>
            
            {isNewRecord && (
              <div className="flex justify-center mt-2">
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-3 py-1 rounded-full text-[10px] font-black shadow-lg animate-pulse-slow uppercase tracking-wide">
                  🌟 {t('stats.newRecord')}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 简化显示（无分数分解数据时） */
          <div className="text-center">
            <div className="text-premium-value text-2xl font-black mb-1">{formatScore(currentScore)}</div>
            <div className="text-premium-label text-xs opacity-60">{t('score.breakdown.final')}</div>
            {isNewRecord && (
              <div className="flex justify-center mt-2">
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-3 py-1 rounded-full text-[10px] font-black shadow-lg animate-pulse-slow uppercase tracking-wide">
                  🌟 {t('leaderboard.rankFormat', { rank: currentRank || 1 })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileScoreLayout;