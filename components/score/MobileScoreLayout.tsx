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
    <div className="w-full flex-col animate-in fade-in zoom-in-95 duration-500">
      {/* 成绩详情标题 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="p-1.5 rounded-lg bg-[#FFD5AB]/20 border border-[#FFD5AB]/20">
          <Trophy className="w-4 h-4 text-[#FFD5AB]" />
        </div>
        <h2 className="text-premium-title text-sm font-black uppercase tracking-widest">{t('stats.currentGameScore')}</h2>
      </div>

      {/* 分数核心卡片 */}
      <div className="glass-panel p-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD5AB]/5 to-[#F68E5F]/5 pointer-events-none" />
        
        {scoreBreakdown ? (
          <div className="space-y-3">
            {/* 分数主显示 */}
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5 mb-4 relative overflow-hidden">
              <div className="text-4xl font-black text-premium-value tracking-tighter drop-shadow-xl">
                {formatScore(currentScore)}
              </div>
              <div className="text-[10px] text-premium-label opacity-40 uppercase tracking-widest mt-1">
                {t('score.breakdown.final')}
              </div>
            </div>

            {/* 详细计分项 - 更加紧凑且高级 */}
            <div className="space-y-2">
              {[
                { label: t('score.breakdown.base'), value: scoreBreakdown.baseScore, theme: "text-[#FFD5AB]", desc: getDifficultyWithShape(gameStats.difficulty) },
                { label: t('score.breakdown.timeBonus'), value: scoreBreakdown.timeBonus, theme: "text-green-400", desc: getSpeedRankText(gameStats.totalDuration), prefix: "+" },
                { label: t('score.breakdown.rotationScore'), value: scoreBreakdown.rotationScore, theme: scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400", desc: `${gameStats.totalRotations}回旋转`, prefix: scoreBreakdown.rotationScore > 0 ? "+" : "" },
                { label: t('score.breakdown.hintScore'), value: scoreBreakdown.hintScore, theme: scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400", desc: `${gameStats.hintUsageCount}/${scoreBreakdown.hintAllowance}次`, prefix: scoreBreakdown.hintScore > 0 ? "+" : "" }
              ].map((item, id) => (item.value !== 0 || id === 0) && (
                <div key={id} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-premium-label opacity-60 uppercase">{item.label}</span>
                    <span className="text-[9px] text-[#FFD5AB]/20 italic truncate max-w-[120px]">{item.desc}</span>
                  </div>
                  <span className={cn("text-sm font-black tabular-nums", item.theme)}>{item.prefix}{formatScore(item.value)}</span>
                </div>
              ))}
            </div>

            {/* 统计横栏 */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                 <span className="text-[8px] text-white/20 uppercase font-black mb-0.5">{t('score.breakdown.multiplier')}</span>
                 <span className="text-sm font-black text-[#FFD5AB]">×{formatMultiplier(scoreBreakdown.difficultyMultiplier)}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                 <span className="text-[8px] text-white/20 uppercase font-black mb-0.5">{t('stats.duration')}</span>
                 <span className="text-sm font-black text-[#FFD5AB] tabular-nums">
                    {Math.floor(gameStats.totalDuration / 60).toString().padStart(2, '0')}:
                    {(gameStats.totalDuration % 60).toString().padStart(2, '0')}
                 </span>
              </div>
            </div>
            
            {isNewRecord && (
              <div className="flex justify-center mt-3 scale-110">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-4 py-1 rounded-full text-[10px] font-black shadow-lg animate-pulse-slow uppercase tracking-wider">
                  <Star className="w-2.5 h-2.5 fill-[#232035]" />
                  {t('stats.newRecord')}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 简化版展示 */
          <div className="text-center py-6">
            <div className="text-4xl font-black text-premium-value mb-2 tracking-tighter">{formatScore(currentScore)}</div>
            <div className="text-[10px] text-premium-label opacity-40 uppercase tracking-[0.2em]">{t('score.breakdown.final')}</div>
            {isNewRecord && (
              <div className="flex justify-center mt-4">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#232035] px-4 py-1 rounded-full text-[10px] font-black shadow-xl animate-pulse-slow uppercase tracking-wider">
                  🏆 {t('leaderboard.rankFormat', { rank: currentRank || 1 })}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default MobileScoreLayout;