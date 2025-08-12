/**
 * 切割线生成器配置模块
 * 集中管理所有配置参数，消除魔法数字
 */

export const CUT_GENERATOR_CONFIG = {
  // 算法性能参数
  MAX_ATTEMPTS: 50,
  EARLY_EXIT_THRESHOLD: 0.8,
  
  // 验证参数
  CENTER_DISTANCE_THRESHOLD: 100,
  MIN_CUT_DISTANCE: 15,
  
  // 重试参数
  EXTRA_CUT_ATTEMPTS: 20,
  CENTER_CUT_ATTEMPTS: 15,
  MEDIUM_DIFFICULTY_ATTEMPTS: 10,
  
  // 几何参数
  EXTENSION_FACTOR: 0.75,
  DIAGONAL_FACTOR: 1.2,
  BOUNDS_EXTENSION: 0.2,
  
  // 随机性参数
  RANDOM_CUT_PROBABILITY: 0.7,
  PERPENDICULAR_CUT_PROBABILITY: 0.3,
  VERTICAL_CUT_PROBABILITY: 0.5,
  
  // 偏移参数
  CENTER_OFFSET_RANGE: 30,
  HIGH_DIFFICULTY_OFFSET: 60,
  ANGLE_OFFSET_RANGE: 0.15,
  
  // 难度级别配置
  DIFFICULTY_SETTINGS: {
    1: { 
      targetCuts: 1, 
      centerProbability: 0.85, 
      useCenter: true,
      label: '低难度'
    },
    2: { 
      targetCuts: 2, 
      centerProbability: 0.75, 
      useCenter: true,
      label: '低难度'
    },
    3: { 
      targetCuts: 3, 
      centerProbability: 0.65, 
      useCenter: true,
      label: '低难度'
    },
    4: { 
      targetCuts: 4, 
      centerProbability: 0.6, 
      useCenter: false,
      label: '中低难度'
    },
    5: { 
      targetCuts: 6, 
      centerProbability: 0.5, 
      useCenter: false,
      label: '中难度'
    },
    6: { 
      targetCuts: 8, 
      centerProbability: 0.4, 
      useCenter: false,
      label: '中高难度'
    },
    7: { 
      targetCuts: 11, 
      centerProbability: 0.3, 
      useCenter: false,
      label: '高难度'
    },
    8: { 
      targetCuts: 14, 
      centerProbability: 0.2, 
      useCenter: false,
      label: '最高难度'
    }
  } as const,
  
  // 难度阈值
  THRESHOLDS: {
    LOW_DIFFICULTY: 3,
    MEDIUM_DIFFICULTY: 6,
    HIGH_DIFFICULTY: 7,
    EXTREME_DIFFICULTY: 8
  }
} as const;

// 导出常用配置
export const DIFFICULTY_SETTINGS = CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;
export const MAX_ATTEMPTS = CUT_GENERATOR_CONFIG.MAX_ATTEMPTS;
export const EARLY_EXIT_THRESHOLD = CUT_GENERATOR_CONFIG.EARLY_EXIT_THRESHOLD;

export type DifficultyLevel = keyof typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;
export type DifficultySettings = typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS[DifficultyLevel];