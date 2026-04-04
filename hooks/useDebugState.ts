'use client';

import { useEffect } from 'react';
import { GameState, GameAction } from '@/types/puzzleTypes';
import { GameDataManager } from '@/utils/data/GameDataManager';
import { CloudGameRepository } from '@/utils/cloud/CloudGameRepository';

/**
 * 调试状态钩子
 * 仅在开发环境下将游戏状态和调度器暴露给 window 对象，方便控制台调试
 */
export function useDebugState(state: GameState, dispatch: React.Dispatch<GameAction>) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    // 1. 暴露核心状态
    (window as any).__GAME_STATE__ = state;
    (window as any).gameContextDispatch = dispatch;

    // 2. 暴露测试工具 API
    (window as any).testAPI = {
      state,
      dispatch,
      selectPiece: (pieceIndex: number) => 
        dispatch({ type: 'SET_SELECTED_PIECE', payload: pieceIndex }),
      markAsCompleted: (pieceId: number) => 
        dispatch({ type: 'ADD_COMPLETED_PIECE', payload: pieceId }),
      rotate: (clockwise: boolean) => 
        dispatch({ type: 'TRACK_ROTATION' }), // 模拟旋转统计触发
      clearData: () => {
        const success = GameDataManager.clearAllData();
        if (success) console.log("🗑️ 游戏数据已清除！");
        return success;
      }
    };

    // 3. 暴露仓库类
    (window as any).GameDataManager = GameDataManager;
    (window as any).CloudGameRepository = CloudGameRepository;

    // 打印加载提示（仅在首次加载或核心改变时）
    if (!(window as any).__DEBUG_TOOLS_LOADED__) {
      console.log("🔧 [useDebugState] 开发调试工具已加载 (window.testAPI, window.__GAME_STATE__)");
      (window as any).__DEBUG_TOOLS_LOADED__ = true;
    }
  }, [state, dispatch]);
}
