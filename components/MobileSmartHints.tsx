"use client";

import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTranslation } from '@/contexts/I18nContext';
import ScoreDisplay from '@/components/score/ScoreDisplay';

/**
 * 移动端智能提示组件
 * 显示游戏进度提示和完成时的成绩
 */
const MobileSmartHints: React.FC = () => {
  const { state } = useGame();
  const { t } = useTranslation();

  // 计算完成的拼图数量
  const completedPiecesCount = Array.isArray(state.completedPieces) 
    ? state.completedPieces.length 
    : 0;
  const totalPieces = state.puzzle?.length || 0;

  // 如果游戏完成，不在提示区域显示成绩（成绩将在其他地方显示）
  if (state.isCompleted && state.gameStats) {
    // 游戏完成时显示完成提示 - 优先显示新纪录
    if (state.isNewRecord) {
      return <span>{t('game.hints.newRecord')}</span>;
    } else {
      return <span>{t('game.hints.completed')}</span>;
    }
  }

  // 智能提示内容（与桌面端一致）
  let progressTip = '';
  if (state.originalShape.length === 0 && state.puzzle === null && state.cutType === "") {
    progressTip = t('game.hints.selectShape');
  } else if (state.originalShape.length > 0 && state.puzzle === null && state.cutType === "") {
    progressTip = t('game.hints.selectCutType');
  } else if (state.originalShape.length > 0 && state.puzzle === null && state.cutType !== "") {
    progressTip = t('game.hints.cutShape');
  } else if (state.puzzle !== null && !state.isScattered) {
    progressTip = t('game.hints.scatterPuzzle');
  } else if (state.puzzle !== null && state.isScattered && !state.isCompleted) {
    // 游戏进行中 - 使用移动端精简格式，避免换行
    const usedHints = state.gameStats?.hintUsageCount || 0;
    const allowedHints = state.gameStats?.hintAllowance || 0;
    
    // 移动端超精简格式，避免换行
    progressTip = t('game.hints.gameStats', {
      completed: completedPiecesCount,
      total: totalPieces,
      hints: usedHints,
      allowedHints: allowedHints
    });
  } else if (state.isCompleted) {
    // 游戏完成时显示完成提示 - 优先显示新纪录
    if (state.isNewRecord) {
      progressTip = t('game.hints.newRecord');
    } else {
      progressTip = t('game.hints.completed');
    }
  }

  // 如果没有提示内容，不显示
  if (!progressTip) {
    return null;
  }

  return (
    <span>{progressTip}</span>
  );
};

export default MobileSmartHints;