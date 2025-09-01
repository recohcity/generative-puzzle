// Re-export ShapeType and CutType from ./types
// export { ShapeType, CutType } from "./types"

// 难度级别类型
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme' | 'expert';

// Define types
export interface Point {
  x: number
  y: number
  isOriginal?: boolean
  [key: string]: unknown; // 添加索引签名以兼容Scalable接口
}

export interface PuzzlePiece {
  id: number;
  points: Point[]
  originalPoints: Point[]
  rotation: number
  originalRotation: number
  x: number
  y: number
  originalX: number
  originalY: number
  normalizedX?: number; // Added for adaptation
  normalizedY?: number; // Added for adaptation
  isCompleted: boolean;
  color?: string;
  [key: string]: unknown; // 添加索引签名以兼容Scalable接口
}

export interface DraggingPiece {
  index: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
}

// 画布尺寸类型
export interface CanvasSize {
  width: number;
  height: number;
}

// 添加一个接口描述边界信息
export interface PieceBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface GameState {
  originalShape: Point[] // 当前显示的形状（可能已适配）
  puzzle: PuzzlePiece[] | null
  draggingPiece: DraggingPiece | null
  selectedPiece: number | null
  completedPieces: number[]
  isCompleted: boolean
  isScattered: boolean
  showHint: boolean
  shapeType: ShapeType
  pendingShapeType: ShapeType | null // 待生成的形状类型
  cutType: CutType | ""
  cutCount: number
  originalPositions: PuzzlePiece[]
  lastShapeOffsetX?: number
  lastShapeOffsetY?: number
  // 添加画布尺寸信息，用于边界检查
  canvasSize: CanvasSize | null
  // 🔑 关键修复：保存形状生成时的基准画布尺寸，用于正确的适配计算
  baseCanvasSize: CanvasSize | null;
  
  // ===== 角度显示增强功能状态 =====
  angleDisplayMode: 'always' | 'conditional'; // 角度显示模式：始终显示或条件显示
  temporaryAngleVisible: Set<number>; // 临时显示角度的拼图ID集合（复用现有showHint计时器）
  
  // ===== 分数统计系统状态 =====
  gameStats: GameStats | null;
  isGameActive: boolean;
  isGameComplete: boolean;
  showLeaderboard: boolean;
  leaderboard: GameRecord[];
  currentScore: number;
  scoreBreakdown: ScoreBreakdown | null;
  isNewRecord: boolean;
  currentRank: number | null;
  deviceType?: 'desktop' | 'mobile-portrait' | 'mobile-landscape' | 'ipad';
}

// 更新GameContextProps接口
export interface GameContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  generateShape: (shapeType?: ShapeType) => void;
  generatePuzzle: () => void;
  scatterPuzzle: () => void;
  rotatePiece: (clockwise: boolean) => void;
  showHintOutline: () => void;
  resetGame: () => void;
  calculatePieceBounds: (piece: PuzzlePiece) => PieceBounds;
  ensurePieceInBounds: (piece: PuzzlePiece, dx: number, dy: number, safeMargin?: number) => {
    constrainedDx: number;
    constrainedDy: number;
    hitBoundary: boolean;
  };
  // 统计系统方法
  trackRotation: () => void;
  trackHintUsage: () => void;
  trackDragOperation: () => void;
  completeGame: (playerName?: string) => void;
  restartGame: () => void;
  showLeaderboard: () => void;
  hideLeaderboard: () => void;
  loadLeaderboard: () => void;
  resetStats: () => void;
}

// 扩展GameAction类型，包含统计相关的Action
export type GameAction = 
  | { type: "SET_ORIGINAL_SHAPE"; payload: Point[] }
  | { type: "SET_PUZZLE"; payload: PuzzlePiece[] | null }
  | { type: "SET_ORIGINAL_POSITIONS"; payload: PuzzlePiece[] }
  | { type: "SET_DRAGGING_PIECE"; payload: DraggingPiece | null }
  | { type: "SET_SELECTED_PIECE"; payload: number | null }
  | { type: "SET_COMPLETED_PIECES"; payload: number[] }
  | { type: "ADD_COMPLETED_PIECE"; payload: number }
  | { type: "SET_IS_SCATTERED"; payload: boolean }
  | { type: "SET_IS_COMPLETED"; payload: boolean }
  | { type: "SET_SHOW_HINT"; payload: boolean }
  | { type: "SET_SHAPE_TYPE_WITHOUT_REGENERATE"; payload: ShapeType | null }
  | { type: "SET_SHAPE_OFFSET"; payload: { offsetX: number; offsetY: number } }
  | { type: "GENERATE_SHAPE" }
  | { type: "GENERATE_PUZZLE" }
  | { type: "SCATTER_PUZZLE" }
  | { type: "ROTATE_PIECE"; payload: { clockwise: boolean } }
  | { type: "UPDATE_PIECE_POSITION"; payload: { index: number; x: number; y: number; dx: number; dy: number } }
  | { type: "RESET_PIECE_TO_ORIGINAL"; payload: number }
  | { type: "SHOW_HINT" }
  | { type: "HIDE_HINT" }
  | { type: "RESET_GAME" }
  | { type: "SET_SHAPE_TYPE"; payload: ShapeType }
  | { type: "SET_PENDING_SHAPE_TYPE"; payload: ShapeType | null }
  | { type: "SET_CUT_TYPE"; payload: CutType }
  | { type: "GAME_COMPLETED" }
  | { type: "RESTART_GAME" }
  | { type: "SHOW_LEADERBOARD" }
  | { type: "HIDE_LEADERBOARD" }
  | { type: "UPDATE_LIVE_SCORE"; payload: number }
  | { type: "UPDATE_GAME_STATS"; payload: Partial<GameStats> }
  | { type: "SET_CUT_COUNT"; payload: number }
  | { type: "BATCH_UPDATE"; payload: { puzzle: PuzzlePiece[]; originalPositions: PuzzlePiece[] } }
  | { type: "SYNC_ALL_POSITIONS"; payload: { originalShape: Point[]; puzzle: PuzzlePiece[]; originalPositions: PuzzlePiece[]; shapeOffset: { offsetX: number; offsetY: number } } }
  | { type: "UPDATE_CANVAS_SIZE"; payload: { canvasSize: CanvasSize; scale: number; orientation: string; skipAdaptation?: boolean; forceUpdate?: boolean } }
  | { type: "UPDATE_SHAPE_AND_PUZZLE"; payload: { originalShape: Point[]; puzzle: PuzzlePiece[] } }
  | { type: "SET_BASE_CANVAS_SIZE"; payload: CanvasSize }
  | { type: "NO_CHANGE" }
  | { type: "MOVE_PIECE"; payload: { pieceIndex: number; x: number; y: number } }
  // 统计相关的Action
  | { type: 'START_GAME_TRACKING'; payload: { difficulty: DifficultyConfig } }
  | { type: 'TRACK_ROTATION' }
  | { type: 'TRACK_HINT_USAGE' }
  | { type: 'TRACK_DRAG_OPERATION' }
  | { type: 'COMPLETE_GAME'; payload: { playerName?: string } }
  | { type: 'RESTART_GAME' }
  | { type: 'SHOW_LEADERBOARD' }
  | { type: 'HIDE_LEADERBOARD' }
  | { type: 'LOAD_LEADERBOARD' }
  | { type: 'RESET_STATS' }
  // 角度显示增强功能相关的Action
  | { type: 'UPDATE_ANGLE_DISPLAY_MODE'; payload: { cutCount: number } }
  | { type: 'SET_TEMPORARY_ANGLE_VISIBLE'; payload: { pieceId: number } }
  | { type: 'CLEAR_TEMPORARY_ANGLE_VISIBLE'; payload: { pieceId: number } }
  | { type: 'CLEAR_ALL_TEMPORARY_ANGLE_VISIBLE' };

// 直接在本文件内定义并导出 ShapeType 和 CutType
export enum ShapeType {
  Polygon = "polygon",
  Cloud = "cloud",
  Jagged = "jagged",
}

export enum CutType {
  Straight = "straight",
  Diagonal = "diagonal",
  Curve = "curve",
}

import React from 'react';

// ===== 分数统计系统类型定义 =====

// 难度配置接口
export interface DifficultyConfig {
  cutCount: number;        // 1-8次切割
  cutType: CutType;        // 切割类型
  actualPieces: number;    // 实际产生的拼图数量
  difficultyLevel: DifficultyLevel; // 难度级别
}

// 游戏统计数据接口
export interface GameStats {
  // 时间统计
  gameStartTime: number;
  gameEndTime?: number;
  totalDuration: number; // 秒

  // 操作统计
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;

  // 难度信息
  difficulty: DifficultyConfig;

  // 最优解数据
  minRotations: number;      // 最小旋转次数（完美解）
  rotationEfficiency: number; // 旋转效率 (最小次数/实际次数)
  hintAllowance: number;     // 难度对应的赠送提示次数

  // 分数计算
  baseScore: number;
  timeBonus: number;         // 基于排行榜的时间奖励
  timeBonusRank: number;     // 时间排名（1-5，0表示未进榜）
  isTimeRecord: boolean;     // 是否创造了时间记录
  rotationScore: number;     // 旋转效率分数（可正可负）
  hintScore: number;         // 提示使用分数（可正可负）
  difficultyMultiplier: number;
  finalScore: number;

  // 设备信息
  deviceType: 'desktop' | 'mobile-portrait' | 'mobile-landscape' | 'ipad' | 'mobile' | 'tablet';
  canvasSize: { width: number; height: number };
}

// 游戏记录接口 - 与GameDataManager实际使用的结构保持一致
export interface GameRecord {
  timestamp: number;
  finalScore: number;
  totalDuration: number;
  difficulty: DifficultyConfig;
  deviceInfo: {
    type: string;
    screenWidth: number;
    screenHeight: number;
  };
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;
  rotationEfficiency: number;
  scoreBreakdown: any;
  gameStartTime?: number;
  id?: string;
}

// 旋转效率评级接口
export interface RotationRating {
  rating: string;
  description: string;
  color: string;
  score: number;
}

// 分数分解接口
export interface ScoreBreakdown {
  baseScore: number;
  timeBonus: number;           // 基于排行榜的时间奖励
  timeBonusRank: number;       // 时间排名（1-5，0表示未进榜）
  isTimeRecord: boolean;       // 是否创造了时间记录
  rotationScore: number;       // 旋转效率分数
  rotationEfficiency: number;  // 旋转效率百分比
  minRotations: number;        // 最小旋转次数
  hintScore: number;          // 提示使用分数
  hintAllowance: number;      // 赠送提示次数
  difficultyMultiplier: number;
  finalScore: number;
}

// 存储数据结构接口
export interface StorageData {
  leaderboard: GameRecord[];
  personalBests: Record<string, GameRecord>; // 按难度级别存储
  gameHistory: GameRecord[]; // 最近50场游戏
  settings: {
    playerName: string;
    showRealTimeScore: boolean;
  };
}

// 统计相关的Action类型
export type StatsAction = 
  | { type: 'START_GAME_TRACKING'; payload: { difficulty: DifficultyConfig } }
  | { type: 'TRACK_ROTATION' }
  | { type: 'TRACK_HINT_USAGE' }
  | { type: 'TRACK_DRAG_OPERATION' }
  | { type: 'COMPLETE_GAME'; payload: { playerName?: string } }
  | { type: 'RESTART_GAME' }
  | { type: 'SHOW_LEADERBOARD' }
  | { type: 'HIDE_LEADERBOARD' }
  | { type: 'LOAD_LEADERBOARD' }
  | { type: 'RESET_STATS' };

// 类型验证函数
export const validateGameStats = (stats: any): stats is GameStats => {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    typeof stats.gameStartTime === 'number' &&
    typeof stats.totalDuration === 'number' &&
    typeof stats.totalRotations === 'number' &&
    typeof stats.hintUsageCount === 'number' &&
    typeof stats.dragOperations === 'number' &&
    typeof stats.difficulty === 'object' &&
    typeof stats.difficulty.cutCount === 'number' &&
    typeof stats.difficulty.cutType === 'string' &&
    typeof stats.difficulty.actualPieces === 'number' &&
    typeof stats.difficulty.difficultyLevel === 'string' &&
    typeof stats.minRotations === 'number' &&
    typeof stats.rotationEfficiency === 'number' &&
    typeof stats.hintAllowance === 'number' &&
    typeof stats.baseScore === 'number' &&
    typeof stats.timeBonus === 'number' &&
    typeof stats.timeBonusRank === 'number' &&
    typeof stats.isTimeRecord === 'boolean' &&
    typeof stats.rotationScore === 'number' &&
    typeof stats.hintScore === 'number' &&
    typeof stats.dragPenalty === 'number' &&
    typeof stats.difficultyMultiplier === 'number' &&
    typeof stats.finalScore === 'number' &&
    typeof stats.deviceType === 'string' &&
    typeof stats.canvasSize === 'object'
  );
};

export const validateGameRecord = (record: any): record is GameRecord => {
  return (
    typeof record === 'object' &&
    record !== null &&
    typeof record.id === 'string' &&
    typeof record.playerName === 'string' &&
    validateGameStats(record.stats) &&
    record.completedAt instanceof Date &&
    typeof record.isPersonalBest === 'boolean'
  );
};

export const validateScoreBreakdown = (breakdown: any): breakdown is ScoreBreakdown => {
  return (
    typeof breakdown === 'object' &&
    breakdown !== null &&
    typeof breakdown.baseScore === 'number' &&
    typeof breakdown.timeBonus === 'number' &&
    typeof breakdown.timeBonusRank === 'number' &&
    typeof breakdown.isTimeRecord === 'boolean' &&
    typeof breakdown.rotationScore === 'number' &&
    typeof breakdown.rotationEfficiency === 'number' &&
    typeof breakdown.minRotations === 'number' &&
    typeof breakdown.hintScore === 'number' &&
    typeof breakdown.hintAllowance === 'number' &&
    typeof breakdown.dragPenalty === 'number' &&
    typeof breakdown.difficultyMultiplier === 'number' &&
    typeof breakdown.finalScore === 'number'
  );
};

export const validateStorageData = (data: any): data is StorageData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.leaderboard) &&
    data.leaderboard.every(validateGameRecord) &&
    typeof data.personalBests === 'object' &&
    Array.isArray(data.gameHistory) &&
    data.gameHistory.every(validateGameRecord) &&
    typeof data.settings === 'object' &&
    typeof data.settings.playerName === 'string' &&
    typeof data.settings.showRealTimeScore === 'boolean'
  );
};

// 工具函数：创建默认的GameStats
export const createDefaultGameStats = (difficulty: DifficultyConfig): GameStats => {
  return {
    gameStartTime: Date.now(),
    totalDuration: 0,
    totalRotations: 0,
    hintUsageCount: 0,
    dragOperations: 0,
    difficulty,
    minRotations: 0,
    rotationEfficiency: 1,
    hintAllowance: 0,
    baseScore: 0,
    timeBonus: 0,
    timeBonusRank: 0,
    isTimeRecord: false,
    rotationScore: 0,
    hintScore: 0,
    difficultyMultiplier: 1,
    finalScore: 0,
    deviceType: 'desktop',
    canvasSize: { width: 640, height: 640 }
  };
};

// 工具函数：创建默认的存储数据
export const createDefaultStorageData = (): StorageData => {
  return {
    leaderboard: [],
    personalBests: {},
    gameHistory: [],
    settings: {
      playerName: '玩家',
      showRealTimeScore: true
    }
  };
}; 