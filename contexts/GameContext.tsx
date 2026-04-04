"use client";

import {
  useCallback,
  useReducer,
  useRef,
  createContext,
  useContext,
  useEffect,
} from "react";
import type { ReactNode } from "react";

import { ScatterPuzzle } from "@/utils/puzzle/ScatterPuzzle";
import { ShapeService } from "@/utils/shape/ShapeService";
import { PuzzleGenerator } from "@/utils/puzzle/PuzzleGenerator";
import { calculateCenter } from "@generative-puzzle/game-core";
import { adaptAllElements } from "@/utils/SimpleAdapter";
import { GameDataManager } from "@/utils/data/GameDataManager";
import {
  Point,
  PuzzlePiece,
  DraggingPiece,
  PieceBounds,
  GameState,
  GameContextProps,
  GameAction,
  ShapeType,
  CutType,
  CanvasSize,
  GameStats,
  GameRecord,
  DifficultyConfig,
} from "@generative-puzzle/game-core";
import {
  calculateFinalScore,
  calculateMinimumRotations,
  calculateLiveScore,
  getHintAllowanceByCutCount,
} from "@generative-puzzle/game-core";
import { calculateDifficultyLevel } from "@/utils/difficulty/DifficultyUtils";
import { CloudGameRepository } from "@/utils/cloud/CloudGameRepository";
import { playFinishSound } from "@/utils/rendering/soundEffects";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useDebugState } from "@/hooks/useDebugState";


// 获取设备类型的工具函数
const getDeviceType = ():
  | "desktop"
  | "mobile-portrait"
  | "mobile-landscape"
  | "ipad" => {
  if (typeof window === "undefined") return "desktop";

  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  // 检测移动设备
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isTouchDevice =
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  // iPad检测
  const isIPad =
    /iPad/i.test(userAgent) ||
    (isIOS && screenWidth >= 768) ||
    (isTouchDevice && screenWidth >= 768 && screenWidth <= 1366);

  if (isIPad) return "ipad";
  if (isMobile) {
    // 判断移动设备方向
    return screenHeight > screenWidth ? "mobile-portrait" : "mobile-landscape";
  }
  return "desktop";
};

// 使用从types/puzzleTypes.ts导入的GameAction类型
const initialState: GameState = {
  originalShape: [],
  puzzle: null,
  draggingPiece: null,
  selectedPiece: null,
  completedPieces: [],
  isCompleted: false,
  isScattered: false,
  showHint: false,
  shapeType: "" as any, // 初始无选中
  pendingShapeType: null,
  cutType: "",
  cutCount: 1,
  originalPositions: [],
  canvasSize: null, // 当前画布尺寸
  baseCanvasSize: null, // 基准画布尺寸
  // 角度显示增强功能初始状态
  angleDisplayMode: "always", // 默认始终显示（1-3次切割）
  temporaryAngleVisible: new Set<number>(), // 临时显示角度的拼图ID集合（复用现有showHint计时器）
  // 统计系统初始状态
  gameStats: null,
  isGameActive: false,
  isGameComplete: false,
  showLeaderboard: false,
  leaderboard: [],
  currentScore: 0,
  scoreBreakdown: null,
  isNewRecord: false,
  currentRank: null,
  deviceType: "desktop",
};

// 辅助函数：执行游戏完成逻辑（共享逻辑，避免漂移）
const executeGameCompletion = (
  state: GameState,
  dispatch: React.Dispatch<GameAction>
) => {
  if (!state.gameStats || !state.isGameActive) return;

  console.log("✅ [GameContext] 执行游戏完成逻辑!");

  // 1. 计算完成统计
  const gameEndTime = Date.now();
  const totalDuration = Math.round(
    (gameEndTime - state.gameStats.gameStartTime) / 1000
  );

  const completedStats: GameStats = {
    ...state.gameStats,
    gameEndTime,
    totalDuration,
  };

  // 2. 计算并持久化结果
  const currentLeaderboard = GameDataManager.getLeaderboard();
  const scoreBreakdown = calculateFinalScore(
    completedStats,
    state.puzzle || [],
    currentLeaderboard
  );
  const finalScore = scoreBreakdown.finalScore;

  const saveSuccess = GameDataManager.saveGameRecord(
    completedStats,
    finalScore,
    scoreBreakdown
  );

  let isNewRecord = false;
  let rank = 999;

  if (saveSuccess) {
    const recordCheck = GameDataManager.checkNewRecord({
      timestamp: gameEndTime,
      finalScore,
      totalDuration,
      difficulty: completedStats.difficulty,
      deviceType: completedStats.deviceType,
      totalRotations: completedStats.totalRotations,
      hintUsageCount: completedStats.hintUsageCount,
      dragOperations: completedStats.dragOperations,
      rotationEfficiency: completedStats.rotationEfficiency,
      scoreBreakdown,
    } as any);
    isNewRecord = recordCheck.isNewRecord;
    rank = recordCheck.rank;
  }

  const updatedLeaderboard = GameDataManager.getLeaderboard();

  // 3. 最终分派
  dispatch({
    type: "GAME_COMPLETED",
    payload: {
      gameStats: completedStats,
      finalScore,
      scoreBreakdown,
      isNewRecord,
      currentRank: rank,
      leaderboard: updatedLeaderboard,
    },
  });
};

// 辅助函数：计算打散拼图时的目标形状限制
const calculateScatterTarget = (originalShape: Point[] | null) => {
  if (!originalShape || originalShape.length === 0) return null;

  const bounds = originalShape.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const radius = Math.max((bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2) * 1.2;

  return {
    center: { x: centerX, y: centerY },
    radius: radius,
  };
};

function gameReducer(state: GameState, action: GameAction): GameState {
  // reducer 入口
  switch (action.type) {
    case "SET_ORIGINAL_SHAPE":
      // SET_ORIGINAL_SHAPE
      return { ...state, originalShape: action.payload };

    case "SET_PUZZLE": {
      // SET_PUZZLE - 拼图散开后重新计算最小旋转次数
      const newPuzzle = action.payload;
      const newMinRotations = calculateMinimumRotations(newPuzzle || []);

      console.log(
        `[SET_PUZZLE] 重新计算最小旋转次数: ${newMinRotations}, 拼图片段数: ${newPuzzle?.length || 0}`,
      );

      // 如果游戏已经开始，更新gameStats中的minRotations
      let updatedGameStats = state.gameStats;
      if (state.gameStats && newMinRotations > 0) {
        updatedGameStats = {
          ...state.gameStats,
          minRotations: newMinRotations,
        };
        console.log(
          `[SET_PUZZLE] 更新gameStats.minRotations: ${newMinRotations}`,
        );
      }

      return {
        ...state,
        puzzle: newPuzzle,
        gameStats: updatedGameStats,
      };
    }

    case "SET_DRAGGING_PIECE":
      return { ...state, draggingPiece: action.payload };
    case "SET_SELECTED_PIECE":
      return {
        ...state,
        selectedPiece: action.payload,
        showHint: false,
      };
    case "SET_COMPLETED_PIECES":
      const isNowCompleted =
        action.payload.length > 0 &&
        action.payload.length === state.puzzle?.length;
      return {
        ...state,
        completedPieces: action.payload,
        isCompleted: isNowCompleted,
      };
    case "ADD_COMPLETED_PIECE":
      if (state.completedPieces.includes(action.payload)) {
        return state;
      }
      const newCompletedPieces = [...state.completedPieces, action.payload];
      const isGameFinished = state.puzzle
        ? newCompletedPieces.length === state.puzzle.length
        : false;

      let updatedPuzzle = state.puzzle;
      if (state.puzzle && state.puzzle[action.payload]) {
        updatedPuzzle = [...state.puzzle];
        updatedPuzzle[action.payload] = {
          ...updatedPuzzle[action.payload],
          isCompleted: true,
        };
      }

      return {
        ...state,
        puzzle: updatedPuzzle,
        completedPieces: newCompletedPieces,
        isCompleted: isGameFinished,
      };
    case "SET_IS_COMPLETED":
      return { ...state, isCompleted: action.payload };
    case "SET_IS_SCATTERED":
      return { ...state, isScattered: action.payload };
    case "SET_SHOW_HINT":
      return { ...state, showHint: action.payload };
    case "SET_SHAPE_TYPE":
      return { ...state, shapeType: action.payload, pendingShapeType: null };
    case "SET_SHAPE_TYPE_WITHOUT_REGENERATE":
      return { ...state, pendingShapeType: action.payload };
    case "SET_CUT_TYPE":
      return { ...state, cutType: action.payload };
    case "SET_CUT_COUNT": {
      const newCutCount = action.payload;
      const newAngleDisplayMode = newCutCount <= 3 ? "always" : "conditional";

      // 切割次数改变时清除所有临时角度显示状态
      const newTemporaryAngleVisible = new Set<number>();

      return {
        ...state,
        cutCount: newCutCount,
        angleDisplayMode: newAngleDisplayMode,
        temporaryAngleVisible: newTemporaryAngleVisible,
      };
    }
    case "GENERATE_SHAPE":
      return { ...state };
    case "GENERATE_PUZZLE":
      return { ...state };
    case "SCATTER_PUZZLE": {
      // 散开拼图时启动游戏计时
      const gameStartTime = Date.now();

      const gameStats: GameStats = {
        gameStartTime,
        totalDuration: 0,
        totalRotations: 0,
        hintUsageCount: 0,
        dragOperations: 0,
        difficulty: {
          difficultyLevel: calculateDifficultyLevel(state.cutCount),
          cutType: state.cutType || CutType.Straight,
          cutCount: state.cutCount || 1,
          shapeType: state.shapeType, // 🆕 新增：形状类型（用于形状难度系数计算）
          // 🔧 修复：统一使用实际生成的拼图数量，支持cutGeneratorConfig.ts的动态数量
          actualPieces: (() => {
            const actualPuzzleLength = state.puzzle?.length || 0;
            const cutCount = state.cutCount || 1;

            // 使用实际生成的拼图数量（支持cutGeneratorConfig.ts的动态随机数量）
            if (actualPuzzleLength > 0) {
              return actualPuzzleLength;
            }

            // 如果没有拼图数据，使用基本的N+1公式作为后备
            return cutCount + 1;
          })(),
        },
        deviceType: (state.deviceType || "desktop") as
          | "desktop"
          | "mobile-portrait"
          | "mobile-landscape"
          | "ipad",
        canvasSize: {
          width: state.canvasSize?.width || 640,
          height: state.canvasSize?.height || 640,
        },
        minRotations: calculateMinimumRotations(state.puzzle || []), // 游戏开始时计算最小旋转次数
        hintAllowance: (() => {
          // 与统一计分配置保持一致：所有难度统一免费次数
          try {
            return getHintAllowanceByCutCount(state.cutCount || 1);
          } catch (e) {
            console.warn("[GameContext] 无法读取统一提示配置，使用默认3");
            return 3;
          }
        })(), // 统一计算提示次数
        rotationEfficiency: 0, // 将在游戏结束时计算
        // 分数相关字段初始化
        baseScore: 0,
        timeBonus: 0,
        timeBonusRank: 0,
        isTimeRecord: false,
        rotationScore: 0,
        hintScore: 0,
        difficultyMultiplier: 1.0,
        finalScore: 0,
      };

      // 使用注入的排行榜数据或当前状态下的排行榜数据
      const currentLeaderboard = action.payload?.leaderboard || state.leaderboard || [];
      const initialScore = calculateLiveScore(gameStats, currentLeaderboard);

      // 调试信息
      // 游戏启动汇总日志
      console.log(`[SCATTER_PUZZLE] Game started: ${gameStats.difficulty.actualPieces} pieces, Initial Score: ${initialScore}`);

      return {
        ...state,
        isScattered: true,
        gameStats,
        isGameActive: true,
        isGameComplete: false,
        currentScore: initialScore,
      };
    }
    case "ROTATE_PIECE": {
      if (!state.puzzle || state.selectedPiece === null) return state;
      const newPuzzle = [...state.puzzle];
      const piece = newPuzzle[state.selectedPiece];
      piece.rotation =
        (piece.rotation + (action.payload.clockwise ? 15 : -15) + 360) % 360;

      return {
        ...state,
        puzzle: newPuzzle,
      };
    }
    case "UPDATE_PIECE_POSITION": {
      if (!state.puzzle) return state;
      const positionUpdatedPuzzle = [...state.puzzle];
      const pieceToUpdate = positionUpdatedPuzzle[action.payload.index];

      pieceToUpdate.x += action.payload.dx;
      pieceToUpdate.y += action.payload.dy;

      pieceToUpdate.points = pieceToUpdate.points.map((point) => ({
        x: point.x + action.payload.dx,
        y: point.y + action.payload.dy,
        isOriginal: point.isOriginal,
      }));

      return {
        ...state,
        puzzle: positionUpdatedPuzzle,
      };
    }
    case "RESET_PIECE_TO_ORIGINAL": {
      if (!state.puzzle || !state.originalPositions) return state;
      const resetPuzzle = [...state.puzzle];
      const originalPiece = state.originalPositions[action.payload];

      resetPuzzle[action.payload] = {
        ...resetPuzzle[action.payload],
        x: originalPiece.x,
        y: originalPiece.y,
        rotation: originalPiece.originalRotation || originalPiece.rotation,
        points: JSON.parse(JSON.stringify(originalPiece.points)),
        originalX: originalPiece.x,
        originalY: originalPiece.y,
        originalRotation:
          originalPiece.originalRotation || originalPiece.rotation,
      };

      return { ...state, puzzle: resetPuzzle };
    }
    case "SHOW_HINT": {
      // 只显示提示，不更新统计（统计由TRACK_HINT_USAGE处理）
      return {
        ...state,
        showHint: true,
      };
    }
    case "HIDE_HINT":
      return { ...state, showHint: false };
    case "RESET_GAME":
      return {
        ...initialState,
        canvasSize: state.canvasSize,
        baseCanvasSize: state.baseCanvasSize,
      };
    case "SET_ORIGINAL_POSITIONS":
      return { ...state, originalPositions: action.payload };
    case "SET_SHAPE_OFFSET":
      return {
        ...state,
        lastShapeOffsetX: action.payload.offsetX,
        lastShapeOffsetY: action.payload.offsetY,
      };
    case "BATCH_UPDATE":
      return {
        ...state,
        puzzle: action.payload.puzzle,
        originalPositions: action.payload.originalPositions,
      };
    case "SYNC_ALL_POSITIONS":
      return {
        ...state,
        originalShape: action.payload.originalShape,
        puzzle: action.payload.puzzle,
        originalPositions: action.payload.originalPositions,
        lastShapeOffsetX: action.payload.shapeOffset.offsetX,
        lastShapeOffsetY: action.payload.shapeOffset.offsetY,
      };
    case "UPDATE_CANVAS_SIZE": {
      const newCanvasSize = action.payload.canvasSize;
      const skipAdaptation = action.payload.skipAdaptation || false;
      const forceUpdate = action.payload.forceUpdate || false;

      // 解冻专用：跳过适配，只更新画布尺寸
      if (skipAdaptation) {
        return {
          ...state,
          canvasSize: newCanvasSize,
        };
      }

      // 冻结保护：检测需要保护的情况
      const aspectRatio = newCanvasSize.width / newCanvasSize.height;
      const isExtremeRatio = aspectRatio > 3 || aspectRatio < 0.3;
      const currentSize = state.canvasSize;
      const hasSignificantChange =
        !currentSize ||
        Math.abs(newCanvasSize.width - currentSize.width) > 100 ||
        Math.abs(newCanvasSize.height - currentSize.height) > 100;
      const needsProtection =
        (isExtremeRatio || hasSignificantChange) && !forceUpdate;

      if (needsProtection) {
        return {
          ...state,
          canvasSize: newCanvasSize,
        };
      }

      // 尺寸无变化时跳过
      if (
        currentSize &&
        currentSize.width === newCanvasSize.width &&
        currentSize.height === newCanvasSize.height
      ) {
        return state;
      }

      // 无形状数据时仅更新尺寸
      if (!state.originalShape || state.originalShape.length === 0) {
        return {
          ...state,
          canvasSize: newCanvasSize,
        };
      }

      // 使用当前画布尺寸作为适配基准
      const fromSize = currentSize ||
        state.baseCanvasSize || { width: 640, height: 640 };
      const toSize = newCanvasSize;

      // 避免形状刚生成时的无效适配
      const isSameSize =
        fromSize.width === toSize.width && fromSize.height === toSize.height;
      const isInitialCall = !currentSize;

      if (
        !isSameSize &&
        !isInitialCall &&
        fromSize.width > 0 &&
        fromSize.height > 0
      ) {
        const adaptedOriginalShape = adaptAllElements(
          state.originalShape,
          fromSize,
          toSize,
        );
        const adaptedPuzzle = state.puzzle
          ? adaptAllElements(state.puzzle, fromSize, toSize)
          : state.puzzle;
        const adaptedOriginalPositions = state.originalPositions
          ? adaptAllElements(state.originalPositions, fromSize, toSize)
          : state.originalPositions;

        return {
          ...state,
          canvasSize: newCanvasSize,
          originalShape: adaptedOriginalShape,
          puzzle: adaptedPuzzle,
          originalPositions: adaptedOriginalPositions,
        };
      } else {
        return {
          ...state,
          canvasSize: newCanvasSize,
        };
      }
    }
    case "UPDATE_SHAPE_AND_PUZZLE":
      return {
        ...state,
        originalShape: action.payload.originalShape,
        puzzle: action.payload.puzzle,
      };
    case "NO_CHANGE":
      return state;
    case "SET_BASE_CANVAS_SIZE":
      return { ...state, baseCanvasSize: action.payload };
    case "MOVE_PIECE": {
      if (!state.puzzle) return state;
      const { pieceIndex, x, y } = action.payload;
      const puzzle = [...state.puzzle];
      const piece = puzzle[pieceIndex];
      if (!piece) return state;

      const oldCenter = calculateCenter(piece.points);
      const dx = x - oldCenter.x;
      const dy = y - oldCenter.y;

      piece.points = piece.points.map((p) => ({
        ...p,
        x: p.x + dx,
        y: p.y + dy,
      }));
      piece.x += dx;
      piece.y += dy;

      return { ...state, puzzle };
    }

    // ===== 统计系统Action处理 =====

    case "TRACK_ROTATION": {
      if (!state.gameStats || !state.isGameActive) return state;

      // 更新旋转统计和实时分数
      const updatedGameStats = {
        ...state.gameStats,
        totalRotations: state.gameStats.totalRotations + 1,
      };

      // 使用新的实时分数计算系统
      const updatedScore = calculateLiveScore(
        updatedGameStats,
        state.leaderboard,
      );

      return {
        ...state,
        gameStats: updatedGameStats,
        currentScore: updatedScore,
      };
    }

    case "TRACK_HINT_USAGE": {
      if (!state.gameStats || !state.isGameActive) return state;

      const updatedGameStats = {
        ...state.gameStats,
        hintUsageCount: state.gameStats.hintUsageCount + 1,
      };

      // 使用新的实时分数计算系统
      const updatedScore = calculateLiveScore(
        updatedGameStats,
        state.leaderboard,
      );

      return {
        ...state,
        gameStats: updatedGameStats,
        currentScore: updatedScore,
      };
    }

    case "TRACK_DRAG_OPERATION": {
      if (!state.gameStats || !state.isGameActive) return state;

      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          dragOperations: state.gameStats.dragOperations + 1,
        },
      };
    }



    case "SHOW_LEADERBOARD": {
      return {
        ...state,
        showLeaderboard: true,
      };
    }

    case "HIDE_LEADERBOARD": {
      return {
        ...state,
        showLeaderboard: false,
      };
    }

    case "LOAD_LEADERBOARD": {
      return {
        ...state,
        leaderboard: action.payload,
      };
    }



    case "GAME_COMPLETED": {
      const { 
        gameStats, 
        finalScore, 
        scoreBreakdown, 
        isNewRecord, 
        currentRank, 
        leaderboard 
      } = action.payload;

      return {
        ...state,
        gameStats,
        isGameActive: false,
        isGameComplete: true,
        isCompleted: true,
        currentScore: finalScore,
        scoreBreakdown,
        isNewRecord,
        currentRank,
        leaderboard,
      };
    }

    case "RESTART_GAME": {
      return {
        ...state,
        gameStats: null,
        isGameActive: false,
        isGameComplete: false,
        isCompleted: false,
        currentScore: 0,
        scoreBreakdown: null,
        isNewRecord: false,
        currentRank: null,
        // 重置角度显示状态
        angleDisplayMode: state.cutCount <= 3 ? "always" : "conditional",
        temporaryAngleVisible: new Set<number>(),
      };
    }

    case "RETRY_CURRENT_GAME": {
      const { scatteredPuzzle, leaderboard } = action.payload;

      // 创建新的游戏统计（从载荷中恢复，确保纯函数特性）
      const gameStartTime = Date.now();
      const gameStats: GameStats = {
        gameStartTime,
        totalDuration: 0,
        totalRotations: 0,
        hintUsageCount: 0,
        dragOperations: 0,
        difficulty: {
          difficultyLevel: calculateDifficultyLevel(state.cutCount),
          cutType: state.cutType || CutType.Straight,
          cutCount: state.cutCount || 1,
          shapeType: state.shapeType,
          actualPieces: scatteredPuzzle.length,
        },
        deviceType: (state.deviceType || "desktop") as any,
        canvasSize: state.canvasSize || { width: 640, height: 640 },
        minRotations: calculateMinimumRotations(scatteredPuzzle),
        hintAllowance: (() => {
          try {
            return getHintAllowanceByCutCount(state.cutCount || 1);
          } catch (e) {
            return 3;
          }
        })(),
        rotationEfficiency: 0,
        baseScore: 0,
        timeBonus: 0,
        timeBonusRank: 0,
        isTimeRecord: false,
        rotationScore: 0,
        hintScore: 0,
        difficultyMultiplier: 1.0,
        finalScore: 0,
      };

      const initialScore = calculateLiveScore(gameStats, leaderboard);

      return {
        ...state,
        puzzle: scatteredPuzzle as any,
        completedPieces: [],
        isCompleted: false,
        isScattered: true,
        gameStats,
        isGameActive: true,
        isGameComplete: false,
        currentScore: initialScore,
        scoreBreakdown: null,
        isNewRecord: false,
        currentRank: null,
        selectedPiece: null,
        draggingPiece: null,
        angleDisplayMode: state.cutCount <= 3 ? "always" : "conditional",
        temporaryAngleVisible: new Set<number>(),
      };
    }

    case "UPDATE_LIVE_SCORE": {
      return {
        ...state,
        currentScore: action.payload,
      };
    }

    case "UPDATE_GAME_STATS": {
      if (!state.gameStats) return state;

      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          ...action.payload,
        },
      };
    }

    case "RESET_STATS": {
      return {
        ...state,
        gameStats: null,
        isGameActive: false,
        isGameComplete: false,
        leaderboard: [],
      };
    }

    // ===== 角度显示增强功能Action处理 =====

    case "UPDATE_ANGLE_DISPLAY_MODE": {
      const cutCount = action.payload.cutCount;
      const newMode = cutCount <= 3 ? "always" : "conditional";

      // 切换模式时清除所有临时角度显示状态
      const newTemporaryAngleVisible = new Set<number>();

      return {
        ...state,
        angleDisplayMode: newMode,
        temporaryAngleVisible: newTemporaryAngleVisible,
      };
    }

    case "SET_TEMPORARY_ANGLE_VISIBLE": {
      const { pieceId } = action.payload;
      const newTemporaryAngleVisible = new Set(state.temporaryAngleVisible);

      // 添加到临时显示集合（复用现有showHint的4秒计时器）
      newTemporaryAngleVisible.add(pieceId);

      return {
        ...state,
        temporaryAngleVisible: newTemporaryAngleVisible,
      };
    }

    case "CLEAR_TEMPORARY_ANGLE_VISIBLE": {
      const { pieceId } = action.payload;
      const newTemporaryAngleVisible = new Set(state.temporaryAngleVisible);

      // 从临时显示集合中移除
      newTemporaryAngleVisible.delete(pieceId);

      return {
        ...state,
        temporaryAngleVisible: newTemporaryAngleVisible,
      };
    }

    case "CLEAR_ALL_TEMPORARY_ANGLE_VISIBLE": {
      return {
        ...state,
        temporaryAngleVisible: new Set<number>(),
      };
    }

    default:
      return state;
  }
}

export const GameContext = createContext<GameContextProps | undefined>(
  undefined,
);

// 在GameProvider组件中添加resetGame函数
export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 云端同步逻辑 (Refactored to separate hook)
  useCloudSync(state, dispatch);

  // 开发环境调试工具 (Refactored to separate hook)
  useDebugState(state, dispatch);

  // 初始化设备类型
  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch({ 
        type: "UPDATE_GAME_STATS", 
        payload: { deviceType: getDeviceType() } as any 
      });
    }
  }, [dispatch]);

  const rotatePiece = useCallback(
    (clockwise: boolean) => {
      dispatch({ type: "ROTATE_PIECE", payload: { clockwise } });
    },
    [dispatch],
  );

  useEffect(() => {
    console.log("🔍 [GameContext] 游戏完成检测:", {
      hasPuzzle: !!state.puzzle,
      completedPieces: state.completedPieces.length,
      totalPieces: state.puzzle?.length || 0,
      isCompleted: state.isCompleted,
      isGameActive: state.isGameActive,
      isGameComplete: state.isGameComplete,
    });

    // 检测游戏刚刚完成：所有拼图完成 + 游戏活跃 + 尚未处理完成状态
    if (
      state.puzzle &&
      state.completedPieces.length === state.puzzle.length &&
      state.puzzle.length > 0 &&
      state.isGameActive &&
      !state.isGameComplete
    ) {
      console.log("✅ [GameContext] 所有拼图已完成，自动触发完成!");
      
      // 1. 延迟播放完成音效
      setTimeout(() => {
        playFinishSound();
      }, 300);

      // 2. 执行共享的完成逻辑
      executeGameCompletion(state, dispatch);
    }
  }, [
    state.completedPieces,
    state.puzzle,
    state.isGameActive,
    state.isGameComplete,
  ]);




  const generateShape = useCallback(
    (shapeType?: ShapeType) => {
      const currentShapeType =
        shapeType || state.pendingShapeType || state.shapeType;

      const canvasSize = canvasRef.current
        ? {
            width: canvasRef.current.width || (state.canvasSize ? state.canvasSize.width : 640),
            height: canvasRef.current.height || (state.canvasSize ? state.canvasSize.height : 640),
          }
        : state.canvasSize;

      const { shape, actualCanvasSize } = ShapeService.generateShape(
        currentShapeType,
        canvasSize
      );

      if (shape.length > 0) {
        dispatch({ type: "SET_BASE_CANVAS_SIZE", payload: actualCanvasSize });
        dispatch({ type: "SET_ORIGINAL_SHAPE", payload: shape });
        dispatch({ type: "SET_SHAPE_TYPE", payload: currentShapeType });
      }
    },
    [state.shapeType, state.pendingShapeType, state.canvasSize, canvasRef, dispatch],
  );

  const puzzleRef = useRef(state.puzzle);
  useEffect(() => {
    puzzleRef.current = state.puzzle;
  }, [state.puzzle]);
  const generatePuzzle = useCallback(() => {
    if (!state.originalShape) return;

    const cutTypeString = state.cutType || "straight";
    const { pieces, originalPositions } = PuzzleGenerator.generatePuzzle(
      state.originalShape,
      cutTypeString,
      state.cutCount,
      state.shapeType,
    );

    dispatch({ type: "SET_PUZZLE", payload: pieces as any });
    dispatch({
      type: "SET_ORIGINAL_POSITIONS",
      payload: originalPositions as any,
    });
  }, [state.originalShape, state.cutType, state.cutCount, dispatch]);

  const scatterPuzzle = useCallback(() => {
    console.log("[scatterPuzzle] Function called");
    const puzzle = puzzleRef.current;
    console.log("[scatterPuzzle] Puzzle pieces:", puzzle?.length || 0);

    const canvasSize = state.canvasSize || { width: 640, height: 640 };
    let canvasWidth = canvasSize.width;
    let canvasHeight = canvasSize.height;

    if (canvasRef.current) {
      canvasWidth = canvasRef.current.width || canvasWidth;
      canvasHeight = canvasRef.current.height || canvasHeight;
    }

    if (!puzzle) {
      console.warn("Cannot scatter puzzle: No puzzle pieces generated");
      return;
    }
    if (state.isScattered) {
      console.warn("Puzzle already scattered");
      return;
    }
    const targetShape = calculateScatterTarget(state.originalShape);
    const scatteredPuzzle = ScatterPuzzle.scatterPuzzle(puzzle, {
      canvasSize: { width: canvasWidth, height: canvasHeight },
      targetShape: targetShape,
    });

    if (
      !scatteredPuzzle ||
      !Array.isArray(scatteredPuzzle) ||
      scatteredPuzzle.length === 0
    ) {
      return;
    }

    console.log(
      "[scatterPuzzle] About to dispatch SET_PUZZLE and SCATTER_PUZZLE",
    );
    dispatch({ type: "SET_PUZZLE", payload: scatteredPuzzle as any });
    console.log(
      "[scatterPuzzle] SET_PUZZLE dispatched, now dispatching SCATTER_PUZZLE",
    );
    dispatch({ 
      type: "SCATTER_PUZZLE", 
      payload: { leaderboard: GameDataManager.getLeaderboard() } 
    });
    console.log("[scatterPuzzle] SCATTER_PUZZLE dispatched");
    // 追踪游戏开启
    GameDataManager.trackGameStart();
  }, [state.isScattered, state.canvasSize, state.originalShape, dispatch]);


  const showHintOutline = useCallback(() => {
    dispatch({ type: "SHOW_HINT" });

    // 在高难度模式下（4-8次切割），同时激活角度临时显示
    if (state.cutCount > 3 && state.selectedPiece !== null) {
      dispatch({
        type: "SET_TEMPORARY_ANGLE_VISIBLE",
        payload: { pieceId: state.selectedPiece },
      });
    }

    setTimeout(() => {
      dispatch({ type: "HIDE_HINT" });
      // 同时清除角度临时显示
      dispatch({ type: "CLEAR_ALL_TEMPORARY_ANGLE_VISIBLE" });
    }, 4000); // 延长提示显示时间到4秒
  }, [dispatch, state.cutCount, state.selectedPiece]);

  const resetGame = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx)
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (backgroundCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext("2d");
      if (bgCtx)
        bgCtx.clearRect(
          0,
          0,
          backgroundCanvasRef.current.width,
          backgroundCanvasRef.current.height,
        );
    }
    dispatch({ type: "RESET_GAME" });
  }, []);

  // ===== 统计系统相关方法 =====

  const trackRotation = useCallback(() => {
    dispatch({ type: "TRACK_ROTATION" });
  }, [dispatch]);

  const trackHintUsage = useCallback(() => {
    dispatch({ type: "TRACK_HINT_USAGE" });
  }, [dispatch]);

  const trackDragOperation = useCallback(() => {
    dispatch({ type: "TRACK_DRAG_OPERATION" });
  }, [dispatch]);

  // completeGame 仅用于手动触发，逻辑与 useEffect 中的自动检测共享
  const completeGame = useCallback(
    () => {
      executeGameCompletion(state, dispatch);
    },
    [dispatch, state],
  );

  const restartGame = useCallback(() => {
    dispatch({ type: "RESTART_GAME" });
  }, [dispatch]);

  const retryCurrentGame = useCallback(() => {
    // 重玩本局：恢复至散开拼图时的状态，重新开始计时
    if (!state.puzzle || !state.originalShape || state.originalShape.length === 0) {
      console.warn("[retryCurrentGame] Cannot retry: No puzzle or shape");
      return;
    }

    const canvasSize = state.canvasSize || { width: 640, height: 640 };
    let canvasWidth = canvasSize.width;
    let canvasHeight = canvasSize.height;

    if (canvasRef.current) {
      canvasWidth = canvasRef.current.width || canvasWidth;
      canvasHeight = canvasRef.current.height || canvasHeight;
    }

    const targetShape = calculateScatterTarget(state.originalShape);

    const originalPuzzle = state.originalPositions || state.puzzle;
    const scatteredPuzzle = ScatterPuzzle.scatterPuzzle(originalPuzzle, {
      canvasSize: { width: canvasWidth, height: canvasHeight },
      targetShape: targetShape,
    });

    if (scatteredPuzzle && scatteredPuzzle.length > 0) {
      dispatch({ 
        type: "RETRY_CURRENT_GAME",
        payload: { 
          scatteredPuzzle: scatteredPuzzle as any,
          leaderboard: GameDataManager.getLeaderboard() 
        }
      });
    }
  }, [dispatch, state.puzzle, state.originalShape, state.originalPositions, state.canvasSize]);

  const showLeaderboard = useCallback(() => {
    dispatch({ type: "SHOW_LEADERBOARD" });
  }, [dispatch]);

  const hideLeaderboard = useCallback(() => {
    dispatch({ type: "HIDE_LEADERBOARD" });
  }, [dispatch]);

  const loadLeaderboard = useCallback(() => {
    dispatch({ 
      type: "LOAD_LEADERBOARD", 
      payload: GameDataManager.getLeaderboard() 
    });
  }, [dispatch]);

  const resetStats = useCallback(() => {
    dispatch({ type: "RESET_STATS" });
  }, [dispatch]);

  const playSnapSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3,
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const calculatePieceBounds = useCallback(
    (piece: PuzzlePiece): PieceBounds => {
      if (!piece.points || piece.points.length === 0) {
        return {
          minX: 0,
          maxX: 0,
          minY: 0,
          maxY: 0,
          width: 0,
          height: 0,
          centerX: 0,
          centerY: 0,
        };
      }
      const center = {
        x:
          piece.points.reduce((sum: number, p: Point) => sum + p.x, 0) /
          piece.points.length,
        y:
          piece.points.reduce((sum: number, p: Point) => sum + p.y, 0) /
          piece.points.length,
      };

      if (piece.rotation !== 0) {
        const rotatedPoints = piece.points.map((point) => {
          const dx = point.x - center.x;
          const dy = point.y - center.y;
          const angleRadians = (piece.rotation * Math.PI) / 180;
          const rotatedDx =
            dx * Math.cos(angleRadians) - dy * Math.sin(angleRadians);
          const rotatedDy =
            dx * Math.sin(angleRadians) + dy * Math.cos(angleRadians);
          return {
            x: center.x + rotatedDx,
            y: center.y + rotatedDy,
          };
        });
        const minX = Math.min(...rotatedPoints.map((p) => p.x));
        const maxX = Math.max(...rotatedPoints.map((p) => p.x));
        const minY = Math.min(...rotatedPoints.map((p) => p.y));
        const maxY = Math.max(...rotatedPoints.map((p) => p.y));
        const width = maxX - minX;
        const height = maxY - minY;

        return {
          minX,
          maxX,
          minY,
          maxY,
          width,
          height,
          centerX: center.x,
          centerY: center.y,
        };
      }

      const minX = Math.min(...piece.points.map((p) => p.x));
      const maxX = Math.max(...piece.points.map((p) => p.x));
      const minY = Math.min(...piece.points.map((p) => p.y));
      const maxY = Math.max(...piece.points.map((p) => p.y));
      const width = maxX - minX;
      const height = maxY - minY;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      return { minX, maxX, minY, maxY, width, height, centerX, centerY };
    },
    [],
  );

  const ensurePieceInBounds = useCallback(
    (piece: PuzzlePiece, dx: number, dy: number, safeMargin: number = 1) => {
      let canvasW = canvasRef.current?.width;
      let canvasH = canvasRef.current?.height;
      if (!canvasW || !canvasH) {
        canvasW = state.canvasSize ? state.canvasSize.width : 0;
        canvasH = state.canvasSize ? state.canvasSize.height : 0;
      }
      if (!canvasW || !canvasH) {
        console.warn("Canvas size not available for boundary check.");
        return { constrainedDx: dx, constrainedDy: dy, hitBoundary: false };
      }

      const currentBounds = calculatePieceBounds(piece);
      const potentialMinX = currentBounds.minX + dx;
      const potentialMaxX = currentBounds.maxX + dx;
      const potentialMinY = currentBounds.minY + dy;
      const potentialMaxY = currentBounds.maxY + dy;

      // 边界检测逻辑

      let constrainedDx = dx;
      let constrainedDy = dy;
      let hitBoundary = false; // 标记是否触碰边界

      // 增加回弹因子，使拼图回弹更明显
      const bounceBackFactor = 0.4;

      // 使用拼图尺寸的30%作为回弹距离基准
      const pieceSizeBasedBounce =
        Math.max(currentBounds.width, currentBounds.height) * 0.3;
      // 最大回弹距离限制(像素) - 确保回弹效果明显但不过度
      const maxBounceDistance = Math.min(
        Math.max(pieceSizeBasedBounce, 30),
        80,
      );

      // 计算需要修正的移动距离，使用真实画布边缘
      let correctionX = 0;
      let correctionY = 0;

      // 检查水平边界 - 使用画布真实边缘，仅保留1像素的缓冲防止渲染问题
      if (potentialMinX < safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = safeMargin - potentialMinX;
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
          correctionX = boundaryViolation; // 需要向右修正
          hitBoundary = true;
        }
      } else if (potentialMaxX > canvasW - safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = potentialMaxX - (canvasW - safeMargin);
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
          correctionX = -boundaryViolation; // 需要向左修正
          hitBoundary = true;
        }
      }

      // 检查垂直边界 - 使用画布真实边缘，仅保留1像素的缓冲防止渲染问题
      if (potentialMinY < safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = safeMargin - potentialMinY;
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
          correctionY = boundaryViolation; // 需要向下修正
          hitBoundary = true;
        }
      } else if (potentialMaxY > canvasH - safeMargin) {
        // 精确检测是否确实超出边界
        const boundaryViolation = potentialMaxY - (canvasH - safeMargin);
        // 只有当确实超出边界时才标记为碰撞
        if (boundaryViolation > 0.1) {
          correctionY = -boundaryViolation; // 需要向上修正
          hitBoundary = true;
        }
      }

      // 应用修正和回弹
      if (hitBoundary) {
        // 应用修正量，将拼图带回画布边缘
        constrainedDx = dx + correctionX;
        constrainedDy = dy + correctionY;

        // 计算回弹距离，与修正方向相反，但距离有限制
        // 使用Math.sign确保回弹方向正确，Math.min限制最大回弹距离
        const bounceX =
          Math.abs(correctionX) > 0
            ? -Math.sign(correctionX) *
            Math.min(
              Math.abs(correctionX) * bounceBackFactor,
              maxBounceDistance,
            )
            : 0;
        const bounceY =
          Math.abs(correctionY) > 0
            ? -Math.sign(correctionY) *
            Math.min(
              Math.abs(correctionY) * bounceBackFactor,
              maxBounceDistance,
            )
            : 0;

        // 应用回弹偏移
        constrainedDx += bounceX;
        constrainedDy += bounceY;

        // 再次进行边界检查，确保回弹没有导致再次超出边界
        const finalMinX = currentBounds.minX + constrainedDx;
        const finalMaxX = currentBounds.maxX + constrainedDx;
        const finalMinY = currentBounds.minY + constrainedDy;
        const finalMaxY = currentBounds.maxY + constrainedDy;

        let secondCorrection = false;

        if (finalMinX < safeMargin) {
          constrainedDx = safeMargin - currentBounds.minX;
          secondCorrection = true;
        }
        if (finalMaxX > canvasW - safeMargin) {
          constrainedDx = canvasW - safeMargin - currentBounds.maxX;
          secondCorrection = true;
        }
        if (finalMinY < safeMargin) {
          constrainedDy = safeMargin - currentBounds.minY;
          secondCorrection = true;
        }
        if (finalMaxY > canvasH - safeMargin) {
          constrainedDy = canvasH - safeMargin - currentBounds.maxY;
          secondCorrection = true;
        }

        if (secondCorrection) {
        }

        // 播放碰撞音效 - 仅在触碰边界时
        try {
          const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();

          // 创建主音频振荡器 - 低音碰撞声
          const oscillator1 = audioContext.createOscillator();
          const gainNode1 = audioContext.createGain();

          oscillator1.type = "sine";
          oscillator1.frequency.setValueAtTime(120, audioContext.currentTime); // 更低的音调
          gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode1.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.15,
          ); // 更快衰减

          oscillator1.connect(gainNode1);
          gainNode1.connect(audioContext.destination);

          // 创建次要振荡器 - 高音碰撞声
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();

          oscillator2.type = "sine";
          oscillator2.frequency.setValueAtTime(240, audioContext.currentTime); // 高一倍的音调
          gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1,
          ); // 更快衰减

          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);

          // 启动并停止振荡器
          oscillator1.start();
          oscillator2.start();
          oscillator1.stop(audioContext.currentTime + 0.15);
          oscillator2.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          console.log("Audio not supported");
        }
      } else {
        // 如果没有触碰边界，移动距离不受约束
        constrainedDx = dx;
        constrainedDy = dy;
      }

      return { constrainedDx, constrainedDy, hitBoundary };
    },
    [state.canvasSize, calculatePieceBounds, state.puzzle, canvasRef],
  );
  // 🗑️ updateCanvasSize函数已删除 - 画布尺寸统一由PuzzleCanvas管理
  const isCanvasReady = state.canvasSize
    ? state.canvasSize.width > 0 && state.canvasSize.height > 0
    : false;
  // 生成/分布拼图的 useEffect 依赖 isCanvasReady
  useEffect(() => {
    if (!isCanvasReady) return;
  }, [isCanvasReady, state.originalShape, state.cutType, state.cutCount]);

  const contextValue: GameContextProps = {
    state,
    dispatch,
    canvasRef,
    backgroundCanvasRef,
    generateShape,
    generatePuzzle,
    scatterPuzzle,
    rotatePiece,
    showHintOutline,
    resetGame,
    retryCurrentGame,
    calculatePieceBounds,
    ensurePieceInBounds,
    // 统计系统方法
    trackRotation,
    trackHintUsage,
    trackDragOperation,
    completeGame,
    restartGame,
    showLeaderboard,
    hideLeaderboard,
    loadLeaderboard,
    resetStats,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};


