import {
  calculateTimeBonus,
  getHintAllowanceByCutCount,
  calculateHintScore,
  getDeviceMultiplier,
  calculateDifficultyMultiplier,
  getBaseScore,
  getBaseScoreByPieces,
  getBaseDifficultyMultiplierByPieces,
  getHintAllowance,
  calculateMinimumRotationsAtStart,
  calculateMinimumRotations,
  calculateRotationEfficiency,
  formatRotationDisplay,
  calculateRotationEfficiencyPercentage,
  calculateRemainingRotations,
  checkTimeRecord,
  validateScoreParams,
  calculateLiveScore,
  getRotationRating,
  getRotationRatingText,
  calculateRotationScoreByEfficiency,
  calculateRotationScore,
  calculateHintScoreFromStats,
  calculateScoreDelta,
  calculateFinalScore,
  updateStatsWithOptimalSolution,
  formatRankDisplay,
  getNewRecordBadge,
  calculateLeaderboardStats,
  calculateScoreWithLeaderboard,
  formatScore,
  formatTime,
  safeCalculateScore
} from '../ScoreCalculator';
import { GameStats, DifficultyConfig, PuzzlePiece, GameRecord, CutType, DifficultyLevel } from '@/types/puzzleTypes';

// 创建测试用的GameStats对象
const createTestStats = (overrides: Partial<GameStats> = {}): GameStats => ({
  gameStartTime: Date.now(),
  gameEndTime: Date.now() + 30000,
  totalDuration: 30,
  totalRotations: 5,
  hintUsageCount: 1,
  dragOperations: 10,
  difficulty: {
    cutCount: 3,
    cutType: 'straight' as CutType,
    actualPieces: 4,
    difficultyLevel: 'medium' as DifficultyLevel
  },
  minRotations: 3,
  rotationEfficiency: 0.6,
  hintAllowance: 4,
  baseScore: 1000,
  timeBonus: 200,
  timeBonusRank: 2,
  isTimeRecord: false,
  rotationScore: 50,
  hintScore: 0,
  difficultyMultiplier: 1.2,
  finalScore: 1500,
  deviceType: 'desktop' as const,
  canvasSize: { width: 640, height: 640 },
  ...overrides
});

// 创建测试用的DifficultyConfig对象
const createTestDifficulty = (overrides: Partial<DifficultyConfig> = {}): DifficultyConfig => ({
  cutCount: 3,
  cutType: 'straight' as CutType,
  actualPieces: 4,
  difficultyLevel: 'medium' as DifficultyLevel,
  ...overrides
});

// 创建测试用的PuzzlePiece对象
const createTestPiece = (rotation: number, isCompleted: boolean = false): PuzzlePiece => ({
  id: Math.random(),
  points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
  originalPoints: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
  rotation,
  originalRotation: 0,
  x: 100,
  y: 100,
  originalX: 100,
  originalY: 100,
  isCompleted,
  color: '#ff0000'
});

// 创建测试用的GameRecord对象
const createTestRecord = (overrides: Partial<GameRecord> = {}): GameRecord => ({
  timestamp: Date.now(),
  finalScore: 1500,
  totalDuration: 30,
  difficulty: createTestDifficulty(),
  deviceInfo: {
    type: 'desktop',
    screenWidth: 1920,
    screenHeight: 1080
  },
  totalRotations: 5,
  hintUsageCount: 1,
  dragOperations: 10,
  rotationEfficiency: 0.6,
  scoreBreakdown: {},
  gameStartTime: Date.now(),
  id: 'test-id',
  ...overrides
});

// Mock window对象用于设备检测测试
const mockWindow = (userAgent: string, width: number, height: number, touchSupport: boolean = false) => {
  Object.defineProperty(window, 'navigator', {
    writable: true,
    value: {
      userAgent,
      maxTouchPoints: touchSupport ? 1 : 0
    }
  });

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: height
  });

  if (touchSupport) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: {}
    });
  } else {
    delete (window as any).ontouchstart;
  }
};

describe('ScoreCalculator - 设备检测测试', () => {
  beforeEach(() => {
    // 重置window对象
    delete (window as any).ontouchstart;
  });

  test('桌面端应返回1.0系数', () => {
    mockWindow('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1920, 1080);
    expect(getDeviceMultiplier()).toBe(1.0);
  });

  test('移动端应返回1.1系数', () => {
    mockWindow('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 375, 667, true);
    expect(getDeviceMultiplier()).toBe(1.1);
  });

  test('iPad应返回1.0系数', () => {
    mockWindow('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)', 768, 1024, true);
    expect(getDeviceMultiplier()).toBe(1.0);
  });

  test('Android移动设备应返回1.1系数', () => {
    mockWindow('Mozilla/5.0 (Linux; Android 10)', 360, 640, true);
    expect(getDeviceMultiplier()).toBe(1.1);
  });

  test.skip('服务端渲染应返回1.0系数 (跳过 - 测试环境限制)', () => {
    // 在Jest测试环境中很难完全模拟服务端渲染环境
    // 实际代码中的逻辑是正确的：typeof window === 'undefined' 时返回1.0
    const originalWindow = global.window;
    delete (global as any).window;
    const result = getDeviceMultiplier();
    global.window = originalWindow;
    expect(result).toBe(1.0);
  });
});

describe('ScoreCalculator - 基础分数测试', () => {
  test('应返回正确的基础分数', () => {
    expect(getBaseScore(2)).toBe(800);
    expect(getBaseScore(3)).toBe(900);
    expect(getBaseScore(4)).toBe(1000);
    expect(getBaseScore(5)).toBe(1200);
    expect(getBaseScore(7)).toBe(1400);
    expect(getBaseScore(9)).toBe(1600);
    expect(getBaseScore(12)).toBe(1800);
    expect(getBaseScore(14)).toBe(2000);
  });

  test('未知拼图数量应返回默认分数1000', () => {
    expect(getBaseScore(999)).toBe(1000);
  });

  test('getBaseScoreByPieces应与getBaseScore一致', () => {
    expect(getBaseScoreByPieces(4)).toBe(getBaseScore(4));
    expect(getBaseScoreByPieces(7)).toBe(getBaseScore(7));
  });
});

describe('ScoreCalculator - 难度系数测试', () => {
  test('应返回正确的基础难度系数', () => {
    expect(getBaseDifficultyMultiplierByPieces(2)).toBe(1.0);
    expect(getBaseDifficultyMultiplierByPieces(3)).toBe(1.1);
    expect(getBaseDifficultyMultiplierByPieces(4)).toBe(1.2);
    expect(getBaseDifficultyMultiplierByPieces(5)).toBe(1.4);
    expect(getBaseDifficultyMultiplierByPieces(7)).toBe(1.6);
    expect(getBaseDifficultyMultiplierByPieces(9)).toBe(1.8);
    expect(getBaseDifficultyMultiplierByPieces(12)).toBe(2.2);
    expect(getBaseDifficultyMultiplierByPieces(14)).toBe(2.5);
  });

  test('未知拼图数量应返回默认系数1.0', () => {
    expect(getBaseDifficultyMultiplierByPieces(999)).toBe(1.0);
  });

  test('计算完整难度系数 - 直线切割桌面端', () => {
    mockWindow('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1920, 1080);
    const config = createTestDifficulty({ actualPieces: 4, cutType: CutType.Straight });
    expect(calculateDifficultyMultiplier(config)).toBe(1.2); // 1.2 * 1.0 * 1.0
  });

  test('计算完整难度系数 - 斜线切割移动端', () => {
    mockWindow('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 375, 667, true);
    const config = createTestDifficulty({ actualPieces: 4, cutType: CutType.Diagonal });
    expect(calculateDifficultyMultiplier(config)).toBe(1.584); // 1.2 * 1.2 * 1.1
  });
});

describe('ScoreCalculator - 提示赠送测试', () => {
  test('基于切割次数的提示赠送', () => {
    expect(getHintAllowanceByCutCount(1)).toBe(3);
    expect(getHintAllowanceByCutCount(2)).toBe(3);
    expect(getHintAllowanceByCutCount(3)).toBe(3);
    expect(getHintAllowanceByCutCount(4)).toBe(3);
    expect(getHintAllowanceByCutCount(5)).toBe(3);
    expect(getHintAllowanceByCutCount(6)).toBe(3);
    expect(getHintAllowanceByCutCount(7)).toBe(3);
    expect(getHintAllowanceByCutCount(8)).toBe(3);
  });

  test('未知切割次数应返回0', () => {
    expect(getHintAllowanceByCutCount(999)).toBe(0);
  });

  test('基于难度级别的提示赠送（兼容性）', () => {
    expect(getHintAllowance('easy')).toBe(3);
    expect(getHintAllowance('medium')).toBe(3);
    expect(getHintAllowance('hard')).toBe(3);
    expect(getHintAllowance('extreme')).toBe(3);
    expect(getHintAllowance('unknown')).toBe(0);
  });
});

describe('ScoreCalculator - 旋转计算测试', () => {
  test('计算最小旋转次数 - 基本情况', () => {
    const pieces = [
      createTestPiece(45),   // 需要3次逆时针旋转 (45/15 = 3)
      createTestPiece(180),  // 需要12次逆时针旋转 (180/15 = 12)
      createTestPiece(270),  // 需要6次顺时针旋转 ((360-270)/15 = 6)
    ];
    expect(calculateMinimumRotationsAtStart(pieces)).toBe(21); // 3 + 12 + 6
  });

  test('计算最小旋转次数 - 边界情况', () => {
    const pieces = [
      createTestPiece(0),    // 不需要旋转
      createTestPiece(15),   // 需要1次逆时针旋转
      createTestPiece(345),  // 需要1次顺时针旋转 ((360-345)/15 = 1)
    ];
    expect(calculateMinimumRotationsAtStart(pieces)).toBe(2); // 0 + 1 + 1
  });

  test('计算最小旋转次数 - 空数组', () => {
    expect(calculateMinimumRotationsAtStart([])).toBe(0);
  });

  test('计算旋转效率', () => {
    expect(calculateRotationEfficiency(5, 10)).toBe(0.5);
    expect(calculateRotationEfficiency(10, 10)).toBe(1.0);
    expect(calculateRotationEfficiency(0, 5)).toBe(0);
    expect(calculateRotationEfficiency(5, 0)).toBe(0);
    expect(calculateRotationEfficiency(0, 0)).toBe(1);
  });

  test('格式化旋转显示', () => {
    expect(formatRotationDisplay(6, 5)).toBe('旋转次数：6次（最佳：5次）');
    expect(formatRotationDisplay(10, 8)).toBe('旋转次数：10次（最佳：8次）');
  });

  test('计算旋转效率百分比', () => {
    expect(calculateRotationEfficiencyPercentage(5, 10)).toBe(50);
    expect(calculateRotationEfficiencyPercentage(10, 10)).toBe(100);
    expect(calculateRotationEfficiencyPercentage(0, 5)).toBe(100); // minRotations为0时返回100%
    expect(calculateRotationEfficiencyPercentage(5, 0)).toBe(0); // actualRotations为0且minRotations不为0时返回0
    expect(calculateRotationEfficiencyPercentage(0, 0)).toBe(100);
  });

  test('计算剩余旋转次数', () => {
    const pieces = [
      createTestPiece(45, false),   // 未完成，需要3次旋转
      createTestPiece(180, true),   // 已完成，不需要旋转
      createTestPiece(270, false),  // 未完成，需要6次旋转
    ];
    expect(calculateRemainingRotations(pieces)).toBe(9); // 3 + 0 + 6
  });
});

describe('ScoreCalculator - 旋转评级测试', () => {
  test('旋转效率评级', () => {
    expect(getRotationRating(100).rating).toBe('完美');
    expect(getRotationRating(90).rating).toBe('接近完美');
    expect(getRotationRating(70).rating).toBe('旋转有点多');
    expect(getRotationRating(50).rating).toBe('旋转太多了');
    expect(getRotationRating(30).rating).toBe('请减少旋转');
    expect(getRotationRating(10).rating).toBe('看清楚再旋转');
    expect(getRotationRating(-10).rating).toBe('效率过低');
  });

  test('旋转效率评级文本', () => {
    expect(getRotationRatingText(100)).toBe('完美');
    expect(getRotationRatingText(90)).toBe('接近完美');
    expect(getRotationRatingText(70)).toBe('旋转有点多');
    expect(getRotationRatingText(50)).toBe('旋转太多了');
    expect(getRotationRatingText(30)).toBe('请减少旋转');
    expect(getRotationRatingText(10)).toBe('看清楚再旋转');
    expect(getRotationRatingText(-10)).toBe('效率过低');
  });

  test('基于效率计算旋转分数', () => {
    expect(calculateRotationScoreByEfficiency(100)).toBe(200);
    expect(calculateRotationScoreByEfficiency(90)).toBe(100);
    expect(calculateRotationScoreByEfficiency(70)).toBe(50);
    expect(calculateRotationScoreByEfficiency(50)).toBe(-50);
    expect(calculateRotationScoreByEfficiency(30)).toBe(-100);
    expect(calculateRotationScoreByEfficiency(10)).toBe(-200);
  });
});

describe('ScoreCalculator - 速度奖励测试', () => {
  test('10秒内完成应获得400分奖励', () => {
    const stats = createTestStats({ totalDuration: 8 });
    const result = calculateTimeBonus(stats, []);
    expect(result.timeBonus).toBe(400);
  });

  test('30秒内完成应获得200分奖励', () => {
    const stats = createTestStats({ totalDuration: 25 });
    const result = calculateTimeBonus(stats, []);
    expect(result.timeBonus).toBe(200);
  });

  test('60秒内完成应获得100分奖励', () => {
    const stats = createTestStats({ totalDuration: 45 });
    const result = calculateTimeBonus(stats, []);
    expect(result.timeBonus).toBe(100);
  });

  test('90秒内完成应获得50分奖励', () => {
    const stats = createTestStats({ totalDuration: 75 });
    const result = calculateTimeBonus(stats, []);
    expect(result.timeBonus).toBe(50);
  });

  test('120秒内完成应获得10分奖励', () => {
    const stats = createTestStats({ totalDuration: 110 });
    const result = calculateTimeBonus(stats, []);
    expect(result.timeBonus).toBe(10);
  });

  test('超过120秒完成应获得0分奖励', () => {
    const stats = createTestStats({ totalDuration: 150 });
    const result = calculateTimeBonus(stats, []);
    expect(result.timeBonus).toBe(0);
  });

  test('边界值测试', () => {
    expect(calculateTimeBonus(createTestStats({ totalDuration: 10 }), []).timeBonus).toBe(400);
    expect(calculateTimeBonus(createTestStats({ totalDuration: 30 }), []).timeBonus).toBe(200);
    expect(calculateTimeBonus(createTestStats({ totalDuration: 120 }), []).timeBonus).toBe(10);
  });

  test('无效参数应返回0分', () => {
    const result = calculateTimeBonus(null as any, []);
    expect(result.timeBonus).toBe(0);
    expect(result.timeBonusRank).toBe(0);
    expect(result.isTimeRecord).toBe(false);
  });
});

describe('ScoreCalculator - 提示系统测试', () => {
  test('提示分数计算 - 未使用提示应获得奖励', () => {
    const score = calculateHintScore(0, 3);
    expect(score).toBe(300); // 零提示完成：+300分奖励
  });

  test('提示分数计算 - 在赠送范围内使用无惩罚', () => {
    expect(calculateHintScore(1, 3)).toBe(0); // 使用1次，无惩罚
    expect(calculateHintScore(2, 3)).toBe(0); // 使用2次，无惩罚
    expect(calculateHintScore(3, 3)).toBe(0); // 使用3次，无惩罚
  });

  test('提示分数计算 - 超出赠送次数应扣分', () => {
    expect(calculateHintScore(4, 3)).toBe(-25); // 超出1次，扣25分
    expect(calculateHintScore(5, 3)).toBe(-50); // 超出2次，扣50分
    expect(calculateHintScore(6, 3)).toBe(-75); // 超出3次，扣75分
  });
});
describe(
  'ScoreCalculator - 时间记录检测测试', () => {
    test('空排行榜应创造新记录', () => {
      const stats = createTestStats({ totalDuration: 30 });
      const result = checkTimeRecord(stats, []);
      expect(result.isNewRecord).toBe(true);
      expect(result.rank).toBe(1);
      expect(result.totalRecords).toBe(1);
    });

    test('创造新记录应返回正确信息', () => {
      const stats = createTestStats({ totalDuration: 20 });
      const leaderboard = [
        createTestRecord({ totalDuration: 30 }),
        createTestRecord({ totalDuration: 40 })
      ];
      const result = checkTimeRecord(stats, leaderboard);
      expect(result.isNewRecord).toBe(true);
      expect(result.previousBest).toBe(30);
      expect(result.improvement).toBe(10);
      expect(result.rank).toBe(1);
      expect(result.totalRecords).toBe(3);
    });

    test('未创造新记录应返回正确排名', () => {
      const stats = createTestStats({ totalDuration: 35 });
      const leaderboard = [
        createTestRecord({ totalDuration: 20 }),
        createTestRecord({ totalDuration: 30 }),
        createTestRecord({ totalDuration: 40 })
      ];
      const result = checkTimeRecord(stats, leaderboard);
      expect(result.isNewRecord).toBe(false);
      expect(result.rank).toBe(3);
      expect(result.totalRecords).toBe(4);
    });
  });

describe('ScoreCalculator - 参数验证测试', () => {
  test('有效参数应通过验证', () => {
    const stats = createTestStats();
    expect(validateScoreParams(stats)).toBe(true);
  });

  test('空参数应验证失败', () => {
    expect(validateScoreParams(null)).toBe(false);
    expect(validateScoreParams(undefined)).toBe(false);
    expect(validateScoreParams({} as any)).toBe(false);
  });

  test('缺少difficulty应验证失败', () => {
    const stats = { ...createTestStats() };
    delete (stats as any).difficulty;
    expect(validateScoreParams(stats)).toBe(false);
  });

  test('difficulty字段无效应验证失败', () => {
    const stats = createTestStats({ difficulty: null as any });
    expect(validateScoreParams(stats)).toBe(false);
  });

  test('缺少必要字段应验证失败', () => {
    const stats = { ...createTestStats() };
    delete (stats as any).totalRotations;
    expect(validateScoreParams(stats)).toBe(false);
  });
});

describe('ScoreCalculator - 实时分数计算测试', () => {
  test('正常情况应计算正确分数', () => {
    const stats = createTestStats({
      difficulty: { cutCount: 3, cutType: CutType.Straight, actualPieces: 4, difficultyLevel: 'medium' },
      totalDuration: 25,
      totalRotations: 5,
      minRotations: 3,
      hintUsageCount: 1
    });
    const score = calculateLiveScore(stats, []);
    expect(score).toBeGreaterThan(0);
  });

  test('空stats应返回0', () => {
    expect(calculateLiveScore(null as any, [])).toBe(0);
  });

  test('无效stats应返回0', () => {
    const invalidStats = { invalid: true } as any;
    expect(calculateLiveScore(invalidStats, [])).toBe(0);
  });

  test('minRotations为0时应跳过旋转分数计算', () => {
    const stats = createTestStats({ minRotations: 0 });
    const score = calculateLiveScore(stats, []);
    expect(score).toBeGreaterThan(0);
  });
});

describe('ScoreCalculator - 旋转分数计算测试', () => {
  test('正常旋转分数计算', () => {
    const stats = createTestStats({
      totalRotations: 10,
      minRotations: 5
    });
    const score = calculateRotationScore(stats);
    expect(score).toBe(-50); // 50%效率 -> -50分
  });

  test('无旋转时应返回0分', () => {
    const stats = createTestStats({ totalRotations: 0 });
    const score = calculateRotationScore(stats);
    expect(score).toBe(0);
  });

  test('无最小旋转数据时应返回0分', () => {
    const stats = createTestStats({ minRotations: 0 });
    const score = calculateRotationScore(stats);
    expect(score).toBe(0);
  });

  test('传入拼图片段重新计算最小旋转次数', () => {
    const stats = createTestStats({ minRotations: 0, totalRotations: 6 });
    const pieces = [createTestPiece(90)]; // 需要6次旋转
    const score = calculateRotationScore(stats, pieces);
    expect(score).toBe(200); // 100%效率 -> +200分
  });

  test('空stats应返回0', () => {
    expect(calculateRotationScore(null as any)).toBe(0);
  });
});

describe('ScoreCalculator - 提示分数计算测试', () => {
  test('基于GameStats计算提示分数', () => {
    const stats = createTestStats({
      hintUsageCount: 2,
      difficulty: { cutCount: 3, cutType: CutType.Straight, actualPieces: 4, difficultyLevel: 'medium' }
    });
    const score = calculateHintScoreFromStats(stats);
    expect(score).toBe(0); // 2次提示，在4次赠送范围内，无惩罚
  });

  test('超出赠送次数应扣分', () => {
    const stats = createTestStats({
      hintUsageCount: 6,
      difficulty: { cutCount: 3, cutType: CutType.Straight, actualPieces: 4, difficultyLevel: 'medium' }
    });
    const score = calculateHintScoreFromStats(stats);
    expect(score).toBe(-75); // 超出3次，扣75分
  });

  test('零提示应获得奖励', () => {
    const stats = createTestStats({
      hintUsageCount: 0,
      difficulty: { cutCount: 3, cutType: CutType.Straight, actualPieces: 4, difficultyLevel: 'medium' }
    });
    const score = calculateHintScoreFromStats(stats);
    expect(score).toBe(300); // 零提示奖励
  });
});

describe('ScoreCalculator - 分数变化计算测试', () => {
  test('游戏开始时应返回完整分数', () => {
    const newStats = createTestStats();
    const result = calculateScoreDelta(null, newStats, []);
    expect(result.delta).toBeGreaterThan(0);
    expect(result.newScore).toBeGreaterThan(0);
    expect(result.reason).toBe('游戏开始');
  });

  test('旋转操作应检测到变化', () => {
    const oldStats = createTestStats({ totalRotations: 5 });
    const newStats = createTestStats({ totalRotations: 6 });
    const result = calculateScoreDelta(oldStats, newStats, []);
    expect(result.reason).toBe('旋转操作');
  });

  test('使用提示应检测到变化', () => {
    const oldStats = createTestStats({ hintUsageCount: 1 });
    const newStats = createTestStats({ hintUsageCount: 2 });
    const result = calculateScoreDelta(oldStats, newStats, []);
    expect(result.reason).toBe('使用提示');
  });

  test('拖拽操作应检测到变化', () => {
    const oldStats = createTestStats({ dragOperations: 10 });
    const newStats = createTestStats({ dragOperations: 11 });
    const result = calculateScoreDelta(oldStats, newStats, []);
    expect(result.reason).toBe('拖拽操作');
  });

  test('时间更新应检测到变化', () => {
    const oldStats = createTestStats({ totalDuration: 30 });
    const newStats = createTestStats({ totalDuration: 31 });
    const result = calculateScoreDelta(oldStats, newStats, []);
    expect(result.reason).toBe('时间更新');
  });
});

describe('ScoreCalculator - 最终分数计算测试', () => {
  test('完整最终分数计算', () => {
    const stats = createTestStats({
      difficulty: { cutCount: 3, cutType: CutType.Straight, actualPieces: 4, difficultyLevel: 'medium' },
      totalDuration: 25,
      totalRotations: 6,
      minRotations: 3,
      hintUsageCount: 1
    });
    const pieces = [createTestPiece(0), createTestPiece(90)];
    const result = calculateFinalScore(stats, pieces, []);

    expect(result.baseScore).toBe(1000);
    expect(result.timeBonus).toBe(200);
    expect(result.finalScore).toBeGreaterThan(100);
    expect(result.difficultyMultiplier).toBe(1.32); // 1.2 * 1.1 (移动端系数)
  });

  test('空拼图片段应使用stats中的最小旋转次数', () => {
    const stats = createTestStats({ minRotations: 5 });
    const result = calculateFinalScore(stats, [], []);
    expect(result.minRotations).toBe(5);
  });

  test('异常情况应返回默认值', () => {
    const result = safeCalculateScore(() => {
      throw new Error('测试错误');
    }, { finalScore: 100 }, 'test');
    expect(result.finalScore).toBe(100);
  });
});

describe('ScoreCalculator - 统计更新测试', () => {
  test('更新最优解数据', () => {
    const stats = createTestStats({ minRotations: 0, rotationEfficiency: 0 });
    const pieces = [createTestPiece(90), createTestPiece(180)];
    const updated = updateStatsWithOptimalSolution(stats, pieces);

    expect(updated.minRotations).toBeGreaterThan(0);
    expect(updated.rotationEfficiency).toBeGreaterThan(0);
    expect(updated.hintAllowance).toBe(3); // cutCount=3 -> 3次赠送
  });
});

describe('ScoreCalculator - 格式化函数测试', () => {
  test('格式化排名显示', () => {
    expect(formatRankDisplay(1, 10)).toBe('第1名🏆');
    expect(formatRankDisplay(3, 10)).toBe('第3名');
    expect(formatRankDisplay(8, 10)).toBe('第8名 (共10名)');
  });

  test('获取新记录标识', () => {
    const newRecord = getNewRecordBadge({
      isNewRecord: true,
      previousBest: 40,
      improvement: 10
    });
    expect(newRecord.badge).toBe('🆕记录');
    expect(newRecord.shouldCelebrate).toBe(true);
    expect(newRecord.message).toContain('恭喜');
  });

  test('非新记录应返回空标识', () => {
    const noRecord = getNewRecordBadge({ isNewRecord: false });
    expect(noRecord.badge).toBe('');
    expect(noRecord.shouldCelebrate).toBe(false);
  });

  test('首个记录应有特殊消息', () => {
    const firstRecord = getNewRecordBadge({ isNewRecord: true });
    expect(firstRecord.message).toContain('首个记录');
  });

  test('格式化分数显示', () => {
    expect(formatScore(1234)).toBe('1,234');
    expect(formatScore(1234567)).toBe('1,234,567');
  });

  test('格式化时间显示', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(30)).toBe('00:30');
  });
});

describe('ScoreCalculator - 排行榜统计测试', () => {
  test('计算排行榜统计信息', () => {
    const stats = createTestStats({ totalDuration: 25 });
    const leaderboard = [createTestRecord({ totalDuration: 30 })];
    const result = calculateLeaderboardStats(stats, leaderboard);

    expect(result.timeBonus).toBe(200);
    expect(result.recordInfo.isNewRecord).toBe(true);
    expect(result.rankDisplay).toBe('第1名🏆');
    expect(result.recordBadge.shouldCelebrate).toBe(true);
  });

  test('集成排行榜数据的分数计算', () => {
    const stats = createTestStats();
    const pieces = [createTestPiece(0)];
    const leaderboard = [createTestRecord()];
    const result = calculateScoreWithLeaderboard(stats, pieces, leaderboard);

    expect(result.finalScore).toBeGreaterThan(0);
    expect(result.leaderboardStats).toBeDefined();
    expect(result.leaderboardStats.timeBonus).toBeGreaterThanOrEqual(0);
  });
});

describe('ScoreCalculator - 边界情况和异常处理测试', () => {
  test('负数角度应正确处理', () => {
    const pieces = [createTestPiece(-45)]; // 负角度
    const minRotations = calculateMinimumRotationsAtStart(pieces);
    expect(minRotations).toBeGreaterThanOrEqual(0);
  });

  test('超过360度角度应正确处理', () => {
    const pieces = [createTestPiece(450)]; // 超过360度
    const minRotations = calculateMinimumRotationsAtStart(pieces);
    expect(minRotations).toBeGreaterThanOrEqual(0);
  });

  test('极端效率值应正确处理', () => {
    expect(calculateRotationScoreByEfficiency(-50)).toBeLessThan(0);
    expect(calculateRotationScoreByEfficiency(150)).toBe(200); // 超过100%仍按100%计算
  });

  test('空数组和null值应安全处理', () => {
    expect(calculateMinimumRotations([])).toBe(0);
    expect(calculateMinimumRotations(null as any)).toBe(0);
    expect(calculateRemainingRotations([])).toBe(0);
    expect(calculateRemainingRotations(null as any)).toBe(0);
  });

  test('异常的GameStats字段应安全处理', () => {
    const invalidStats = {
      ...createTestStats(),
      totalRotations: -1, // 负数
      hintUsageCount: -1,  // 负数
      totalDuration: -1    // 负数
    };

    // 应该不会抛出异常
    expect(() => calculateLiveScore(invalidStats, [])).not.toThrow();
  });

  test('safeCalculateScore应捕获异常', () => {
    const result = safeCalculateScore(() => {
      throw new Error('测试异常');
    }, 'default', 'test');

    expect(result).toBe('default');
  });

  test('极端拼图数量应有合理默认值', () => {
    expect(getBaseScore(0)).toBe(1000);
    expect(getBaseScore(-1)).toBe(1000);
    expect(getBaseDifficultyMultiplierByPieces(0)).toBe(1.0);
    expect(getBaseDifficultyMultiplierByPieces(-1)).toBe(1.0);
  });

  test('应该处理minRotations为0的情况', () => {
    const statsWithZeroMinRotations = {
      ...createTestStats(),
      minRotations: 0
    };
    
    // 应该不会抛出异常，并返回合理的分数
    expect(() => calculateLiveScore(statsWithZeroMinRotations, [])).not.toThrow();
    const result = calculateLiveScore(statsWithZeroMinRotations, []);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(100); // 最小分数限制
  });

  test('应该处理minRotations为undefined的情况', () => {
    const statsWithUndefinedMinRotations = {
      ...createTestStats(),
      minRotations: undefined as any
    };
    
    // 应该不会抛出异常，并返回合理的分数
    expect(() => calculateLiveScore(statsWithUndefinedMinRotations, [])).not.toThrow();
    const result = calculateLiveScore(statsWithUndefinedMinRotations, []);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(100); // 最小分数限制
  });

  test('应该测试难度系数计算的所有分支', () => {
    // 测试对角切割类型
    const diagonalConfig: DifficultyConfig = {
      actualPieces: 4,
      cutType: CutType.Diagonal,
      cutCount: 3,
      difficultyLevel: 'medium'
    };
    const diagonalMultiplier = calculateDifficultyMultiplier(diagonalConfig);
    expect(diagonalMultiplier).toBeGreaterThan(1.0); // 对角切割应该有更高的系数

    // 测试直线切割类型
    const straightConfig: DifficultyConfig = {
      actualPieces: 4,
      cutType: CutType.Straight,
      cutCount: 3,
      difficultyLevel: 'medium'
    };
    const straightMultiplier = calculateDifficultyMultiplier(straightConfig);
    expect(straightMultiplier).toBeGreaterThan(0);
  });

  test('应该测试所有未覆盖的分支', () => {
    // 测试console.warn分支 - 无效拼图数量
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    getBaseScore(999); // 不存在的拼图数量
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[getBaseScore] 未找到拼图数量 999 对应的基础分数')
    );
    
    getBaseDifficultyMultiplierByPieces(999); // 不存在的拼图数量
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[getBaseDifficultyMultiplierByPieces] 未找到拼图数量 999 对应的难度系数')
    );
    
    consoleSpy.mockRestore();
  });
});