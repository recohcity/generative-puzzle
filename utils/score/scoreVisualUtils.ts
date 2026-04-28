/**
 * 拼图评分视觉等级辅助工具
 */

export type StarRating = 0 | 1 | 2 | 3;

export interface PerformanceRank {
  stars: StarRating;
  labelKey: string;
  colorClass: string;
}

/**
 * 根据得分和难度计算星级
 */
export const calculateStarRating = (score: number, difficultyLevel: number): PerformanceRank => {
  const baseReference = 1500;
  const expectedScore = baseReference * (1 + (difficultyLevel - 1) * 0.5);
  
  if (score >= expectedScore * 1.5) {
    return { stars: 3, labelKey: 'score.rank.legendary', colorClass: 'text-brand-orange' };
  } else if (score >= expectedScore * 1.0) {
    return { stars: 2, labelKey: 'score.rank.excellent', colorClass: 'text-brand-amber' };
  } else if (score >= expectedScore * 0.6) {
    return { stars: 1, labelKey: 'score.rank.good', colorClass: 'text-brand-peach' };
  } else {
    return { stars: 1, labelKey: 'score.rank.cleared', colorClass: 'text-white/40' };
  }
};

export interface BadgeInfo {
  id: string;
  icon: string;
  labelKey: string;
  colorClass: string;
  active: boolean;
}

/**
 * 获取成就勋章信息 - 统一品牌色系
 */
export const getBadges = (
  timeBonus: number, 
  rotationEfficiency: number, 
  hintsUsed: number
): BadgeInfo[] => {
  return [
    {
      id: 'speed',
      icon: '⚡',
      labelKey: 'score.badges.speedster',
      colorClass: 'text-brand-orange',
      active: timeBonus > 0
    },
    {
      id: 'accuracy',
      icon: '🎯',
      labelKey: 'score.badges.deadshot',
      colorClass: 'text-brand-amber',
      active: rotationEfficiency > 0.9
    },
    {
      id: 'focus',
      icon: '🧘',
      labelKey: 'score.badges.focus',
      colorClass: 'text-brand-peach',
      active: hintsUsed === 0
    }
  ].filter(b => b.active);
};
