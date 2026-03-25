"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSession } from '@/contexts/GameDomainContexts';
import styles from './GameTimer.module.css';

interface GameTimerProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * GameTimer组件 - 游戏计时器
 * 显示在画布左上角，格式为mm:ss（如04:23）
 * 使用requestAnimationFrame优化性能
 */
export const GameTimer: React.FC<GameTimerProps> = ({ className = '', style = {} }) => {
  const { gameStats, isGameActive, isGameComplete } = useGameSession();
  const [displayTime, setDisplayTime] = useState('00:00');
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // 格式化时间为mm:ss格式
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // 使用requestAnimationFrame优化的时间更新
  const updateTimer = useCallback(() => {
    if (!gameStats || !isGameActive || isGameComplete) {
      return;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - gameStats.gameStartTime) / 1000);
    
    // 只在秒数变化时更新显示，避免不必要的重渲染
    if (elapsed !== lastUpdateRef.current) {
      setDisplayTime(formatTime(elapsed));
      lastUpdateRef.current = elapsed;
    }

    // 继续下一帧更新
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [gameStats, isGameActive, isGameComplete, formatTime]);

  // 启动和停止计时器
  useEffect(() => {
    if (gameStats && isGameActive && !isGameComplete) {
      // 游戏进行中，启动计时器
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      // 游戏未开始或已完成，停止计时器
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // 显示最终时间或重置时间
      if (gameStats && isGameComplete) {
        setDisplayTime(formatTime(gameStats.totalDuration));
      } else if (!gameStats && !isGameActive) {
        setDisplayTime('00:00');
      }
    }

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameStats, isGameActive, isGameComplete, updateTimer, formatTime]);

  // 始终显示计时器，即使在游戏初始状态

  return (
    <div
      className={`${styles.gameTimer} ${className}`}
      style={style}
      data-testid="game-timer"
      aria-label={`游戏时间: ${displayTime}`}
    >
      {displayTime}
    </div>
  );
};

export default GameTimer;