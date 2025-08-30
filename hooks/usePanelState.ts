"use client";

import { useState } from 'react';
// 使用GameDataManager内部的数据结构
interface StoredGameRecord {
  timestamp: number;
  finalScore: number;
  totalDuration: number;
  difficulty: any;
  deviceInfo: any;
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;
  rotationEfficiency: number;
  scoreBreakdown: any;
  gameStartTime?: number; // 兼容字段
  id?: string; // 兼容字段
}

export type PanelView = 'game' | 'leaderboard' | 'details' | 'recent-game';

export interface PanelState {
  currentView: PanelView;
  selectedRecord: StoredGameRecord | null;
}

export const usePanelState = () => {
  const [panelState, setPanelState] = useState<PanelState>({
    currentView: 'game',
    selectedRecord: null,
  });

  const showGamePanel = () => {
    setPanelState({
      currentView: 'game',
      selectedRecord: null,
    });
  };

  const showLeaderboard = () => {
    setPanelState({
      currentView: 'leaderboard',
      selectedRecord: null,
    });
  };

  const showRecordDetails = (record: StoredGameRecord) => {
    setPanelState({
      currentView: 'details',
      selectedRecord: record,
    });
  };

  const showRecentGameDetails = (record: StoredGameRecord) => {
    console.log('[usePanelState] showRecentGameDetails 被调用:', record);
    setPanelState({
      currentView: 'recent-game',
      selectedRecord: record,
    });
  };

  return {
    panelState,
    showGamePanel,
    showLeaderboard,
    showRecordDetails,
    showRecentGameDetails,
  };
};