/**
 * 提示系统：配置/额度/提示分
 * 从 ScoreCalculator.ts 拆出（P2-3）
 */

// 提示系统统一配置参数（所有难度统一 3 次免费提示）
let HINT_CONFIG = {
  freeHintsPerGame: 3,
  zeroHintBonus: 500,
  excessHintPenalty: 25
};

// 对外暴露配置更新方法，便于运行时或测试时调整
export const setHintConfig = (config: Partial<typeof HINT_CONFIG>) => {
  HINT_CONFIG = { ...HINT_CONFIG, ...config };
};

/**
 * 获取提示次数赠送（兼容性函数 - 基于难度级别）
 */
export const getHintAllowance = (_difficultyLevel: string): number => {
  return HINT_CONFIG.freeHintsPerGame;
};

/**
 * 基于切割次数获取提示赠送次数（严格按v2文档表格1）
 */
export const getHintAllowanceByCutCount = (_cutCount: number): number => {
  const allowance = HINT_CONFIG.freeHintsPerGame;
  if (typeof window !== "undefined" && (window as any).DEBUG) console.log(`[getHintAllowanceByCutCount] 统一赠送 -> 提示赠送 ${allowance}次`);
  return allowance;
};

/**
 * 计算提示使用分数（明确三种情况）- 按设计文档v2规则
 */
export const calculateHintScore = (actualHints: number, allowance: number): number => {
  if (actualHints === 0) {
    return HINT_CONFIG.zeroHintBonus;
  }

  if (actualHints <= allowance) {
    return 0;
  }

  const excessHints = actualHints - allowance;
  return -excessHints * HINT_CONFIG.excessHintPenalty;
};

/**
 * 计算提示使用分数（GameStats版本，按设计文档v2）
 */
export const calculateHintScoreFromStats = (stats: { hintUsageCount: number; difficulty: { cutCount: number } }): number => {
  const allowance = getHintAllowanceByCutCount(stats.difficulty.cutCount);
  const hintScore = calculateHintScore(stats.hintUsageCount, allowance);
  return hintScore;
};
