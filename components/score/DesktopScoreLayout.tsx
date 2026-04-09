import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { GameStats, ScoreBreakdown } from '@generative-puzzle/game-core';
import { Trophy, Clock, RotateCw, Lightbulb, Move, X, Star } from 'lucide-react';
import { calculateRotationEfficiencyPercentage, getSpeedBonusDescription, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import { RotationEfficiencyCalculator } from '@generative-puzzle/game-core';

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
    <div className={cn(
      "flex flex-col animate-in fade-in zoom-in-95 duration-500",
      embedded ? "bg-transparent" : "glass-panel p-6 max-w-2xl mx-auto"
    )}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FFD5AB]/20 to-[#F68E5F]/20 border border-[#FFD5AB]/20 shadow-lg">
            <Trophy className="w-8 h-8 text-[#FFD5AB]" />
          </div>
          <div>
            <h2 id="score-display-title" className="text-2xl font-black text-premium-title uppercase tracking-tighter">
              {t('stats.gameComplete')}
            </h2>
            {isNewRecord && (
              <div className="flex items-center gap-2 mt-1.5 animate-bounce">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">
                  {t('score.newRecord')} · {t('leaderboard.rank', { rank: currentRank || 1 })}
                </span>
              </div>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-full transition-all group active:scale-95"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6 text-[#FFD5AB]/40 group-hover:text-[#FFD5AB]" />
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* 最终分数展示 - 极具冲击力的大字 */}
        <div className="relative py-10 rounded-3xl bg-gradient-to-br from-[#FFD5AB]/5 to-[#F68E5F]/5 border border-white/5 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD5AB]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="text-center relative z-10">
            <div className={cn(
              "text-7xl font-black text-premium-value tracking-tighter drop-shadow-2xl mb-2",
              showAnimation && "scoreCountUpAnimation"
            )}>
              {formatScore(currentScore)}
            </div>
            <div className="text-sm text-premium-label opacity-60">
              {t('score.final')}
            </div>
          </div>
        </div>

        {/* 游戏统计概览 - 网格卡片 */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Clock, value: formatDuration(gameStats.totalDuration), label: t('stats.duration'), color: "text-[#FFD5AB]" },
            { 
              icon: RotateCw, 
              value: gameStats.totalRotations, 
              sub: gameStats.minRotations > 0 ? `/ ${gameStats.minRotations}` : null,
              label: t('stats.rotations'), 
              color: "text-[#F68E5F]",
              extra: gameStats.minRotations > 0 ? `${getEfficiencyPercentage(gameStats.totalRotations, gameStats.minRotations)}%效率` : null
            },
            { 
              icon: Lightbulb, 
              value: gameStats.hintUsageCount, 
              sub: gameStats.hintAllowance > 0 ? `/ ${gameStats.hintAllowance}` : null,
              label: t('stats.hints'), 
              color: "text-blue-400",
              perfect: gameStats.hintUsageCount === 0 && gameStats.hintAllowance > 0
            },
            { icon: Move, value: gameStats.dragOperations, label: t('stats.drags'), color: "text-purple-400" }
          ].map((stat, i) => (stat &&
            <div key={i} className={cn(
              "glass-card p-4 text-center transition-all hover:translate-y-[-4px] group",
              stat.perfect && "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
            )}>
              <stat.icon className={cn("w-5 h-5 mx-auto mb-3 opacity-60 group-hover:opacity-100 transition-opacity", stat.color)} />
              <div className="flex items-baseline justify-center gap-0.5">
                <div className={cn("text-xl font-black tracking-tight", stat.color)}>
                  {stat.value}
                </div>
                {stat.sub && <span className="text-[10px] text-white/20 font-bold">{stat.sub}</span>}
              </div>
              <div className="text-[10px] text-premium-label mt-1">{stat.label}</div>
              {stat.extra && <div className="text-[9px] font-bold text-white/30 mt-1 uppercase">{stat.extra}</div>}
              {stat.perfect && (
                <div className="flex items-center justify-center gap-1 text-[9px] font-black text-yellow-500 mt-2 uppercase tracking-tighter animate-pulse">
                  <Star className="w-2.5 h-2.5 fill-yellow-500" />
                  {t('stats.perfectHints')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 分数详情 - 深度明细 */}
        {scoreBreakdown && (
          <div className="glass-card overflow-hidden bg-black/20 p-6">
            <h3 className="text-xs font-black text-premium-title uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#FFD5AB]/30"></span>
              {locale === 'en' ? 'Score Breakdown' : '分数明细'}
              <span className="flex-1 h-[1px] bg-[#FFD5AB]/30"></span>
            </h3>
            
            <div className="space-y-4">
              {/* 明细条目组件 */}
              {[
                { label: t('score.breakdown.base'), value: scoreBreakdown.baseScore, theme: "text-[#FFD5AB]", desc: `${getDifficultyLabel(gameStats.difficulty)} · ${getShapeTypeText(gameStats.difficulty.shapeType)} · ${getCutTypeText(gameStats.difficulty.cutType)}` },
                { label: t('score.breakdown.timeBonus'), value: scoreBreakdown.timeBonus, theme: "text-green-400", desc: getSpeedBonusText(gameStats.totalDuration), prefix: "+" },
                { label: t('score.breakdown.rotationScore'), value: scoreBreakdown.rotationScore, theme: scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400", desc: `${gameStats.totalRotations}/${gameStats.minRotations} (${getRotationRatingTextForDisplay(gameStats.totalRotations, gameStats.minRotations)})`, prefix: scoreBreakdown.rotationScore > 0 ? "+" : "" },
                { label: t('score.breakdown.hintScore'), value: scoreBreakdown.hintScore, theme: scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400", desc: `${gameStats.hintUsageCount}/${gameStats.hintAllowance}次`, prefix: scoreBreakdown.hintScore > 0 ? "+" : "" }
              ].map((item, id) => (
                <div key={id} className="flex justify-between items-start group">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-premium-label group-hover:text-[#FFD5AB] transition-colors">{item.label}</div>
                    <div className="text-[10px] text-white/20 italic">{item.desc}</div>
                  </div>
                  <div className={cn("text-lg font-black tabular-nums tracking-tighter", item.theme)}>
                    {item.prefix}{formatScore(item.value)}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-premium-label">{t('score.breakdown.multiplier')}</div>
                    <div className="text-[9px] text-white/30 italic">({getMultiplierBreakdown(gameStats.difficulty, scoreBreakdown.difficultyMultiplier)})</div>
                  </div>
                  <div className="text-2xl font-black text-[#FFD5AB] group-hover:scale-110 transition-transform">
                    ×{scoreBreakdown.difficultyMultiplier.toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div className="text-xl font-black text-premium-title uppercase tracking-tighter">
                    {t('score.breakdown.final')}
                  </div>
                  <div className="text-4xl font-black text-[#F68E5F] tracking-tighter drop-shadow-[0_0_15px_rgba(246,142,95,0.3)]">
                    {formatScore(scoreBreakdown.finalScore)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 游戏参数脚注 */}
        <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-none mb-1">{t('stats.pieces')}</span>
              <span className="text-xs font-bold text-[#FFD5AB]">{gameStats.difficulty.actualPieces}P</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-none mb-1">{t('stats.device')}</span>
              <span className="text-xs font-bold text-[#FFD5AB] uppercase">{getDeviceTypeText(gameStats.deviceType)}</span>
            </div>
          </div>
          <div className="text-[10px] text-white/30 font-medium tracking-tighter italic">
            {new Date(gameStats.gameStartTime).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopScoreLayout;