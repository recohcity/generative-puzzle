"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useGame } from "@/contexts/GameContext";

const GameBoardDataContext = createContext<any>(null);
const GameBoardInteractionContext = createContext<any>(null);
const GameSessionContext = createContext<any>(null);
const GameUIContext = createContext<any>(null);

export function GameDomainProviders({ children }: { children: ReactNode }) {
  const game = useGame();
  const { state } = game;

  // 低频板块数据（形状/画布/生成）
  const boardDataValue = useMemo(
    () => ({
      originalShape: state.originalShape,
      puzzle: state.puzzle,
      originalPositions: state.originalPositions,
      canvasSize: state.canvasSize,
      baseCanvasSize: state.baseCanvasSize,
      generateShape: game.generateShape,
      generatePuzzle: game.generatePuzzle,
      scatterPuzzle: game.scatterPuzzle,
      calculatePieceBounds: game.calculatePieceBounds,
      ensurePieceInBounds: game.ensurePieceInBounds,
      dispatch: game.dispatch,
    }),
    [
      state.originalShape,
      state.puzzle,
      state.originalPositions,
      state.canvasSize,
      state.baseCanvasSize,
      game.generateShape,
      game.generatePuzzle,
      game.scatterPuzzle,
      game.calculatePieceBounds,
      game.ensurePieceInBounds,
      game.dispatch,
    ],
  );

  // 高频交互数据（选中/完成/旋转）
  const boardInteractionValue = useMemo(
    () => ({
      puzzle: state.puzzle,
      selectedPiece: state.selectedPiece,
      draggingPiece: state.draggingPiece,
      completedPieces: state.completedPieces,
      isScattered: state.isScattered,
      isCompleted: state.isCompleted,
      rotatePiece: game.rotatePiece,
      dispatch: game.dispatch,
    }),
    [
      state.puzzle,
      state.selectedPiece,
      state.draggingPiece,
      state.completedPieces,
      state.isScattered,
      state.isCompleted,
      game.rotatePiece,
      game.dispatch,
    ],
  );

  const sessionValue = useMemo(
    () => ({
      gameStats: state.gameStats,
      isGameActive: state.isGameActive,
      isGameComplete: state.isGameComplete,
      currentScore: state.currentScore,
      scoreBreakdown: state.scoreBreakdown,
      leaderboard: state.leaderboard,
      isNewRecord: state.isNewRecord,
      currentRank: state.currentRank,
      retryCurrentGame: game.retryCurrentGame,
      resetGame: game.resetGame,
      restartGame: game.restartGame,
      trackRotation: game.trackRotation,
      trackHintUsage: game.trackHintUsage,
      trackDragOperation: game.trackDragOperation,
      completeGame: game.completeGame,
      loadLeaderboard: game.loadLeaderboard,
      resetStats: game.resetStats,
    }),
    [
      state.gameStats,
      state.isGameActive,
      state.isGameComplete,
      state.currentScore,
      state.scoreBreakdown,
      state.leaderboard,
      state.isNewRecord,
      state.currentRank,
      game.retryCurrentGame,
      game.resetGame,
      game.restartGame,
      game.trackRotation,
      game.trackHintUsage,
      game.trackDragOperation,
      game.completeGame,
      game.loadLeaderboard,
      game.resetStats,
    ],
  );

  const uiValue = useMemo(
    () => ({
      shapeType: state.shapeType,
      pendingShapeType: state.pendingShapeType,
      cutType: state.cutType,
      cutCount: state.cutCount,
      showHint: state.showHint,
      showLeaderboard: state.showLeaderboard,
      angleDisplayMode: state.angleDisplayMode,
      temporaryAngleVisible: state.temporaryAngleVisible,
      showHintOutline: game.showHintOutline,
      hideLeaderboard: game.hideLeaderboard,
      dispatch: game.dispatch,
    }),
    [
      state.shapeType,
      state.pendingShapeType,
      state.cutType,
      state.cutCount,
      state.showHint,
      state.showLeaderboard,
      state.angleDisplayMode,
      state.temporaryAngleVisible,
      game.showHintOutline,
      game.hideLeaderboard,
      game.dispatch,
    ],
  );

  return (
    <GameBoardDataContext.Provider value={boardDataValue}>
      <GameBoardInteractionContext.Provider value={boardInteractionValue}>
        <GameSessionContext.Provider value={sessionValue}>
          <GameUIContext.Provider value={uiValue}>{children}</GameUIContext.Provider>
        </GameSessionContext.Provider>
      </GameBoardInteractionContext.Provider>
    </GameBoardDataContext.Provider>
  );
}

export function useGameBoardData() {
  const context = useContext(GameBoardDataContext);
  if (!context) throw new Error("useGameBoardData must be used within GameDomainProviders");
  return context;
}

export function useGameBoardInteraction() {
  const context = useContext(GameBoardInteractionContext);
  if (!context) throw new Error("useGameBoardInteraction must be used within GameDomainProviders");
  return context;
}

// 兼容过渡期：保留旧接口
export function useGameBoard() {
  const data = useGameBoardData();
  const interaction = useGameBoardInteraction();
  return { ...data, ...interaction };
}

export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) throw new Error("useGameSession must be used within GameDomainProviders");
  return context;
}

export function useGameUI() {
  const context = useContext(GameUIContext);
  if (!context) throw new Error("useGameUI must be used within GameDomainProviders");
  return context;
}
