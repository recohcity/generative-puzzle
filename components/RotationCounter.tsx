"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { calculateRemainingRotations, formatRotationDisplay } from '@/utils/score/ScoreCalculator';

/**
 * RotationCounter组件 - 实时旋转次数显示
 * 显示格式：旋转次数：6次（最佳：5次）
 * 与GameTimer和LiveScore组件保持样式一致性
 */
const RotationCounter: React.FC = () => {
  const { state } = useGame();
  const [displayText, setDisplayText] = useState<string>('旋转次数：0次（最佳：0次）');
  const animationFrameRef = useRef<number | null>(null);

  // 更新旋转次数显示
  const updateRotationDisplay = React.useCallback(() => {
    if (!state.gameStats || !state.isGameActive) {
      setDisplayText('旋转次数：0次（最佳：0次）');
      return;
    }

    const actualRotations = state.gameStats.totalRotations;
    const minRotations = state.gameStats.minRotations;
    
    // 计算剩余旋转次数（如果有拼图数据）
    let remainingRotations = 0;
    if (state.puzzle && state.puzzle.length > 0) {
      remainingRotations = calculateRemainingRotations(state.puzzle);
    }
    
    // 使用格式化函数生成显示文本，并添加剩余次数信息
    const baseText = formatRotationDisplay(actualRotations, minRotations);
    const displayTextWithRemaining = remainingRotations > 0 
      ? `${baseText} | 剩余：${remainingRotations}次`
      : baseText;
    
    setDisplayText(displayTextWithRemaining);
  }, [state.gameStats, state.isGameActive, state.puzzle]);

  // 监听旋转次数变化和拼图状态变化
  useEffect(() => {
    updateRotationDisplay();
  }, [state.gameStats?.totalRotations, state.gameStats?.minRotations, state.isGameActive, state.puzzle, state.completedPieces, updateRotationDisplay]);

  // 游戏重置时重置显示
  useEffect(() => {
    if (!state.gameStats && !state.isGameActive) {
      setDisplayText('旋转次数：0次（最佳：0次）');
    }
  }, [state.gameStats, state.isGameActive]);

  // 清理动画
  useEffect(() => {
    const currentAnimationFrame = animationFrameRef.current;
    return () => {
      if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
      }
    };
  }, []);

  // 与GameTimer和LiveScore保持一致的样式
  const style: React.CSSProperties = {
    position: 'absolute',
    top: '80px', // 位于LiveScore下方
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFD5AB',
    padding: '8px 16px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 213, 171, 0.2)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  return (
    <div
      style={style}
      data-testid="rotation-counter"
      aria-label={displayText}
    >
      {displayText}
    </div>
  );
};

export default RotationCounter;