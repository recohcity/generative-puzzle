"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import styles from './LiveScore.module.css';

interface LiveScoreProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * LiveScore组件 - 实时分数显示
 * 显示在画布右上角，实现千分位分隔符和数字滚动动画
 * 与GameTimer组件保持样式一致性
 */
export const LiveScore: React.FC<LiveScoreProps> = ({ className = '', style = {} }) => {
  const { state } = useGame();
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const targetScoreRef = useRef<number>(0);
  const currentScoreRef = useRef<number>(0);
  const animationStartRef = useRef<number>(0);

  // 格式化数字为千分位分隔符格式
  const formatScore = useCallback((score: number): string => {
    return Math.floor(score).toLocaleString('zh-CN');
  }, []);

  // 数字滚动动画
  const animateScore = useCallback((timestamp: number) => {
    if (!animationStartRef.current) {
      animationStartRef.current = timestamp;
    }

    const elapsed = timestamp - animationStartRef.current;
    const duration = 800; // 动画持续时间800ms
    const progress = Math.min(elapsed / duration, 1);

    // 使用easeOutCubic缓动函数
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOutCubic(progress);

    const startScore = currentScoreRef.current;
    const targetScore = targetScoreRef.current;
    const currentAnimatedScore = startScore + (targetScore - startScore) * easedProgress;

    setDisplayScore(currentAnimatedScore);

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animateScore);
    } else {
      // 动画完成
      setDisplayScore(targetScore);
      currentScoreRef.current = targetScore;
      setIsAnimating(false);
      animationStartRef.current = 0;
    }
  }, []);

  // 启动分数动画
  const startScoreAnimation = useCallback((newScore: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    targetScoreRef.current = newScore;
    setIsAnimating(true);
    animationStartRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animateScore);
  }, [animateScore]);

  // 监听分数变化
  useEffect(() => {
    const newScore = state.currentScore || 0;
    
    // 如果分数有变化且不是初始状态，启动动画（包括游戏完成状态）
    if (newScore !== currentScoreRef.current && (state.gameStats || state.isGameActive || state.isGameComplete)) {
      if (currentScoreRef.current === 0) {
        // 初始设置，不需要动画
        setDisplayScore(newScore);
        currentScoreRef.current = newScore;
        targetScoreRef.current = newScore;
      } else {
        // 分数变化，启动动画
        startScoreAnimation(newScore);
      }
    }
  }, [state.currentScore, state.gameStats, state.isGameActive, state.isGameComplete, startScoreAnimation]);

  // 游戏重置时重置分数（但游戏完成时保持显示最终分数）
  useEffect(() => {
    if (!state.gameStats && !state.isGameActive && !state.isGameComplete) {
      setDisplayScore(0);
      currentScoreRef.current = 0;
      targetScoreRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsAnimating(false);
    }
  }, [state.gameStats, state.isGameActive, state.isGameComplete]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 始终显示分数，即使在游戏初始状态

  return (
    <div
      className={`${styles.liveScore} ${isAnimating ? styles.animating : ''} ${className}`}
      style={style}
      data-testid="live-score"
      aria-label={`当前分数: ${formatScore(displayScore)}`}
    >
      {formatScore(displayScore)}
    </div>
  );
};

export default LiveScore;