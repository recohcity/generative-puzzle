"use client";

import React, { useEffect, useRef, useState } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import ShapeControls from "@/components/ShapeControls";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import ActionButtons from "@/components/ActionButtons";
import RestartButton from "@/components/RestartButton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";

import { DESKTOP_ADAPTATION } from '@/src/config/adaptationConfig';
import { calculateDesktopCanvasSize } from '@/constants/canvasAdaptation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useTranslation } from '@/contexts/I18nContext';
import ScoreDisplay from '@/components/score/ScoreDisplay';
import LeaderboardPanel from '@/components/leaderboard/LeaderboardPanel';
import RecentGameDetails from '@/components/RecentGameDetails';
import { GameDataManager } from '@/utils/data/GameDataManager';
import { getSpeedBonusDescription, getSpeedBonusDetails } from '@generative-puzzle/game-core';

interface DesktopLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  goToNextTab: () => void; // For ShapeControls and DesktopPuzzleSettings
  // deviceType: string; // Potentially needed for minor variations if tablet also uses this
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  goToNextTab,
  // deviceType
}) => {
  // const titleSizeClass = deviceType === 'tablet' ? 'text-lg' : 'text-xl'; // Example if tablet uses this with variation
  const titleSizeClass = 'text-xl'; // Assuming desktop for now

  // 从GameContext获取state和resetGame函数，以及翻译函数
  const { state, resetGame, retryCurrentGame } = useGame();
  const { t, locale } = useTranslation();

  // 个人最佳成绩显示状态
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRecentGameDetails, setShowRecentGameDetails] = useState(false);
  const [selectedGameRecord, setSelectedGameRecord] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // 计算拼图完成进度
  const totalPieces = (state.puzzle ?? []).length;
  const completedPiecesCount = (state.completedPieces ?? []).length;
  // const puzzleProgressText = totalPieces > 0 ? `${completedPiecesCount} / ${totalPieces} 块拼图已完成` : '';

  // 智能提示内容（新版流程）- 使用翻译
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
    // 游戏进行中 - 使用翻译的统计信息格式（隐藏旋转次数以增强挑战性）
    const usedHints = state.gameStats?.hintUsageCount || 0;
    const allowedHints = state.gameStats?.hintAllowance || 0;
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

  // 处理重新开始按钮点击（重开游戏）
  const handleDesktopResetGame = () => {
    playButtonClickSound();
    resetGame();
  };

  // 处理重玩本局按钮点击
  const handleRetryCurrentGame = () => {
    playButtonClickSound();
    retryCurrentGame();
  };

  // 获取形状显示名称
  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  // 获取切割类型显示名称
  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType;
    }
  };

  // 获取包含形状和切割类型的难度显示文本
  const getDifficultyWithShape = (difficulty: any): string => {
    const shapeName = getShapeDisplayName(difficulty?.shapeType);
    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType);
    const difficultyLevel = t('difficulty.levelLabel', { level: difficulty.cutCount });
    const piecesPart = `${difficulty.actualPieces}${t('stats.piecesUnit')}`;

    const parts = [difficultyLevel];
    if (shapeName) parts.push(shapeName);
    if (cutTypeName) parts.push(cutTypeName);
    parts.push(piecesPart);

    return parts.join(' · ');
  };

  // 获取切割类型系数
  const getCutTypeMultiplier = (cutType?: string): number => {
    const multipliers: Record<string, number> = {
      'straight': 1.0,
      'diagonal': 1.15,
      'curve': 1.25
    };
    return multipliers[cutType || 'straight'] || 1.0;
  };

  // 获取形状类型系数
  const getShapeTypeMultiplier = (shapeType?: string): number => {
    const multipliers: Record<string, number> = {
      'polygon': 1.0,
      'cloud': 1.1,
      'jagged': 1.05
    };
    return multipliers[shapeType || 'polygon'] || 1.0;
  };

  // 获取难度系数分解显示
  const getMultiplierBreakdown = (difficulty: any, multiplier: number): string => {
    const cutMult = getCutTypeMultiplier(difficulty?.cutType);
    const shapeMult = getShapeTypeMultiplier(difficulty?.shapeType);
    // 设备系数通常是1.0（桌面端）或1.1（移动端），这里假设为1.0（桌面端）
    const deviceMult = 1.0;
    // 反推基础系数
    const baseMult = multiplier / cutMult / shapeMult / deviceMult;

    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType) || t('cutType.straight');
    const shapeName = getShapeDisplayName(difficulty?.shapeType) || t('game.shapes.names.polygon');
    const baseLabel = t('score.breakdown.baseMultiplier');

    return `${baseLabel}${baseMult.toFixed(2)} × ${cutTypeName}${cutMult.toFixed(2)} × ${shapeName}${shapeMult.toFixed(2)}`;
  };

  // 格式化时间显示
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取速度奖励显示文本 - 使用动态速度奖励系统（v3.3）
  const getSpeedBonusText = (duration: number): string => {
    if (!state.gameStats) {
      return '';
    }
    const { difficulty } = state.gameStats;
    const pieceCount = difficulty?.actualPieces || 0;
    const difficultyLevel = difficulty?.cutCount || 1;

    // 获取速度奖励详细信息
    const speedDetails = getSpeedBonusDetails(duration, pieceCount, difficultyLevel);

    // 格式化时间显示（用于阈值）
    const formatTimeStr = (seconds: number): string => {
      if (seconds < 60) {
        return locale === 'en' ? `${seconds}s` : `${seconds}秒`;
      }
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return locale === 'en'
        ? `${mins}m${secs > 0 ? `${secs}s` : ''}`
        : `${mins}分${secs > 0 ? `${secs}秒` : ''}`;
    };

    // 根据当前等级生成描述文本
    if (speedDetails.currentLevel) {
      const levelNameMap: Record<string, { zh: string; en: string }> = {
        '极速': { zh: '极速', en: 'Extreme' },
        '快速': { zh: '快速', en: 'Fast' },
        '良好': { zh: '良好', en: 'Good' },
        '标准': { zh: '标准', en: 'Normal' },
        '一般': { zh: '一般', en: 'Slow' },
        '慢': { zh: '慢', en: 'Too Slow' }
      };

      const levelName = levelNameMap[speedDetails.currentLevel.name]?.[locale === 'en' ? 'en' : 'zh'] || speedDetails.currentLevel.name;

      // 如果是慢等级（无奖励），显示"超出X秒"
      if (speedDetails.currentLevel.name === '慢') {
        const timeStr = formatTimeStr(speedDetails.currentLevel.maxTime);
        return locale === 'en'
          ? `${levelName} (exceeded ${timeStr})`
          : `${levelName}（超出${timeStr}）`;
      }

      // 其他等级显示"少于X秒内"
      const timeStr = formatTimeStr(speedDetails.currentLevel.maxTime);
      return locale === 'en'
        ? `${levelName} (less than ${timeStr})`
        : `${levelName}（少于${timeStr}内）`;
    }

    // 如果没有匹配的等级（理论上不应该发生）
    const avgTimePerPiece = difficultyLevel <= 2 ? 3 : difficultyLevel <= 4 ? 5 : difficultyLevel <= 6 ? 8 : 15;
    const baseTime = pieceCount * avgTimePerPiece;
    const slowThreshold = Math.round(baseTime * 1.5);
    const timeStr = formatTimeStr(slowThreshold);
    return locale === 'en'
      ? `Too Slow (exceeded ${timeStr})`
      : `慢（超出${timeStr}）`;
  };

  // 新增：桌面端控制按钮和重置按钮高度常量
  const DESKTOP_CONTROL_BUTTON_HEIGHT = 36; // 提示/左转/右转（桌面端）
  const DESKTOP_RESTART_BUTTON_HEIGHT = 40; // 重新开始（桌面端）

  // 动态计算画布尺寸
  const [canvasSize, setCanvasSize] = useState(560); // 默认560
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // 使用统一设备检测系统获取屏幕尺寸
  const device = useDeviceDetection();
  const windowWidth = device.screenWidth;
  const windowHeight = device.screenHeight;

  // 使用统一计算函数（现在返回计算好的边距）
  const calculationResult = calculateDesktopCanvasSize(windowWidth, windowHeight);
  const { canvasSize: canvasSizeFinal, panelHeight, actualPanelWidth, actualLeftRightMargin } = calculationResult;

  // 计算布局参数
  const { TOP_BOTTOM_MARGIN, LEFT_RIGHT_MARGIN, CANVAS_PANEL_GAP, MIN_PANEL_WIDTH } = DESKTOP_ADAPTATION;

  // 调试信息已关闭 - 避免控制台日志过多
  // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  //   const contentWidth = actualPanelWidth + CANVAS_PANEL_GAP + canvasSizeFinal;
  //   console.log('桌面端布局调试信息:', {
  //     windowSize: `${windowWidth}x${windowHeight}`,
  //     canvasSize: canvasSizeFinal,
  //     margins: { 
  //       top: TOP_BOTTOM_MARGIN, 
  //       leftRight: actualLeftRightMargin,
  //       original: LEFT_RIGHT_MARGIN 
  //     },
  //     contentWidth: contentWidth,
  //     totalUsedWidth: actualLeftRightMargin * 2 + contentWidth,
  //     isUltraWide: windowWidth > windowHeight * 2,
  //     adaptationStrategy: '新安全边距模式',
  //   });
  // }
  // 面板缩放比例
  // panelScale极限下限提升为0.4，保证内容极限压缩但不至于不可用
  const panelScale = Math.max(0.4, Math.min(canvasSizeFinal / 560, 1.0));

  // 面板内容区padding、gap极限压缩
  // 极限压缩下锁定为精确像素，否则自适应
  const panelContentPadding = panelScale <= 0.5 ? 10 : 10;
  const panelContentGap = panelScale <= 0.5 ? 10 : Math.max(2, Math.min(6, 16 * panelScale));

  // 移除统一的事件管理系统，使用原生事件监听

  useEffect(() => {
    function updateLayout() {
      // 触发重渲染
      setCanvasSize(Math.max(320, canvasSizeFinal));
      if (leftPanelRef.current) {
        leftPanelRef.current.style.height = panelHeight + 'px';
        leftPanelRef.current.style.width = actualPanelWidth + 'px';
      }
    }

    updateLayout();

    // 使用原生事件监听替代eventManager
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLayout, 200); // 200ms防抖
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [canvasSizeFinal, actualPanelWidth, panelHeight]);



  return (
    <div style={{
      minWidth: '100vw',
      minHeight: '100dvh', // 使用 dvh 适配移动端浏览器地址栏

      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      paddingTop: TOP_BOTTOM_MARGIN,
      paddingBottom: TOP_BOTTOM_MARGIN,
      paddingLeft: actualLeftRightMargin,
      paddingRight: actualLeftRightMargin,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: CANVAS_PANEL_GAP,
        justifyContent: 'center',
        boxSizing: 'border-box',
        maxWidth: '100%',
        // 确保内容在超宽屏幕下居中，不贴边
        width: 'fit-content',
      }}>
        {/* Left Game Area - 优化后的主要内容区域 */}
        <div
          style={{
            width: canvasSizeFinal,
            height: canvasSizeFinal,
            position: 'relative',
            boxSizing: 'content-box',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {/* 装饰层，视觉效果 */}
          <div
            className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none', // 只做装饰
              zIndex: 1
            }}
          />
          {/* 智能提示区域和画布本体 */}
          <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 2 }}>
            {progressTip && (
              <div
                className="overlay-element smart-hints-overlay"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: 'auto',
                  maxWidth: '90%',
                }}
              >
                {progressTip}
              </div>
            )}
            <PuzzleCanvas />
          </div>
        </div>

        {/* Right Control Panel - 优化后的控制面板 */}
        <div
          ref={leftPanelRef}
          className="flex-shrink-0"
          style={{
            height: panelHeight,
            width: actualPanelWidth,
            minWidth: MIN_PANEL_WIDTH,
            // 去除marginTop/marginLeft，完全由外层padding控制
            ...(panelScale <= 0.5 ? { '--panel-scale': 0.4 } : { '--panel-scale': panelScale })
          } as React.CSSProperties}
        >
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30 h-full flex flex-col overflow-auto"
            style={{ padding: panelContentPadding, fontSize: panelScale <= 0.5 ? 16 : 'calc(16px * var(--panel-scale))', gap: panelContentGap }}
          >
            <div className="flex flex-col mb-1 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-[#FFB17A]" style={{ fontSize: 18, marginTop: 0, marginBottom: 0 }}>{t('game.title')}</h1>
                <GlobalUtilityButtons
                  isMusicPlaying={isMusicPlaying}
                  isFullscreen={isFullscreen}
                  onToggleMusic={onToggleMusic}
                  onToggleFullscreen={onToggleFullscreen}
                  onToggleLeaderboard={() => {
                    if (showLeaderboard) {
                      // 关闭
                      console.log('[DesktopLayout] 关闭');
                      setShowLeaderboard(false);
                    } else {
                      // 打开个人最佳成绩，加载最新数据
                      console.log('[DesktopLayout] 打开个人最佳成绩，加载数据...');
                      const data = GameDataManager.getLeaderboard();
                      const history = GameDataManager.getGameHistory();
                      console.log('[DesktopLayout] 个人最佳成绩数据:', data);
                      console.log('[DesktopLayout] 历史数据:', history);
                      setLeaderboardData(data);
                      setHistoryData(history);
                      setShowLeaderboard(true);
                    }
                  }}
                  isLeaderboardOpen={showLeaderboard}
                />
              </div>

            </div>
            <div className="space-y-4 flex-1 pr-1 -mr-1">
              {/* 根据状态显示不同的面板内容 */}
              {showRecentGameDetails ? (
                // 最近游戏详情显示
                <RecentGameDetails
                  record={selectedGameRecord}
                  onBack={() => {
                    setShowRecentGameDetails(false);
                    setSelectedGameRecord(null);
                    setShowLeaderboard(true);
                  }}
                />
              ) : showLeaderboard ? (
                // 个人最佳成绩显示 - 隐藏所有游戏设置，只显示个人最佳成绩
                <LeaderboardPanel
                  key={`desktop-leaderboard-${t('game.leaderboard.title')}`}
                  leaderboard={leaderboardData}
                  history={historyData}
                  onClose={() => setShowLeaderboard(false)}
                  panelScale={panelScale}
                  isMusicPlaying={isMusicPlaying}
                  isFullscreen={isFullscreen}
                  onToggleMusic={onToggleMusic}
                  onToggleFullscreen={onToggleFullscreen}
                  onShowLeaderboard={() => {
                    if (showLeaderboard) {
                      // 关闭
                      console.log('[DesktopLayout] 关闭');
                      setShowLeaderboard(false);
                    } else {
                      // 打开个人最佳成绩，加载最新数据
                      console.log('[DesktopLayout] 打开个人最佳成绩，加载数据...');
                      const data = GameDataManager.getLeaderboard();
                      const history = GameDataManager.getGameHistory();
                      console.log('[DesktopLayout] 个人最佳成绩数据:', data);
                      console.log('[DesktopLayout] 历史数据:', history);
                      setLeaderboardData(data);
                      setHistoryData(history);
                      setShowLeaderboard(true);
                    }
                  }}
                  onViewRecentGame={(record) => {
                    console.log('[DesktopLayout] 显示最近游戏详情:', record);
                    setSelectedGameRecord(record);
                    setShowLeaderboard(false);
                    setShowRecentGameDetails(true);
                  }}
                />
              ) : state.isCompleted && state.gameStats ? (
                // 游戏完成时 - 隐藏所有游戏控制按钮，显示完整成绩详情
                <div className="flex flex-col h-full">
                  {/* 成绩详情直接在游戏名称下展示 */}
                  <div className="mb-4">
                    <h3 className="font-medium text-[#FFD5AB] mb-2" style={{ fontSize: panelScale <= 0.5 ? 16 : 'calc(0.9rem * var(--panel-scale))' }}>
                      🏆 {t('stats.gameComplete')}
                    </h3>
                  </div>

                  {/* 滚动内容区域 */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ fontSize: panelScale <= 0.5 ? 12 : 'calc(0.75rem * var(--panel-scale))' }}>
                    {/* 本局成绩 */}
                    <div className="bg-[#2A2A2A] rounded-lg p-3">
                      <h4 className="text-[#FFD5AB] font-medium mb-3 text-sm flex items-center gap-1">
                        🏆 {t('stats.currentGameScore')}
                      </h4>

                      {/* 最终得分和游戏时长 - 统一格式 */}
                      <div className="text-center mb-4 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
                        <div className="text-3xl font-bold text-blue-300 mb-1 tracking-wider">
                          {(state.scoreBreakdown?.finalScore || state.currentScore).toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-200 opacity-90 font-medium">
                          {t('score.breakdown.gameDuration')}：{Math.floor(state.gameStats.totalDuration / 60).toString().padStart(2, '0')}:
                          {(state.gameStats.totalDuration % 60).toString().padStart(2, '0')}
                        </div>
                        {state.isNewRecord && (
                          <div className="mt-2">
                            <div className="inline-flex items-center gap-1 bg-yellow-500/30 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                              🌟 {t('stats.newRecord')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 分数构成 - 统一格式 */}
                      {state.scoreBreakdown && (
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[#FFD5AB] flex items-center gap-1">
                                <span>{t('score.breakdown.base')}：</span>
                                <span className="text-[10px] leading-tight">{getDifficultyWithShape(state.gameStats.difficulty)}</span>
                              </span>
                              <span className="text-[#FFD5AB]">{state.scoreBreakdown.baseScore}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#FFD5AB]">
                                {t('score.breakdown.timeBonus')}：<span className="text-[10px]">{getSpeedBonusText(state.gameStats.totalDuration)}</span>
                              </span>
                              <span className="text-green-400">+{state.scoreBreakdown.timeBonus}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#FFD5AB]">
                                {t('score.breakdown.rotationScore')}：<span className="text-[10px]">{state.gameStats.totalRotations}/{state.gameStats.minRotations}（{state.gameStats.totalRotations === state.gameStats.minRotations ? t('rotation.perfect') : t('rotation.excess', { count: state.gameStats.totalRotations - state.gameStats.minRotations })}）</span>
                              </span>
                              <span className={state.scoreBreakdown.rotationScore >= 0 ? "text-green-400" : "text-red-400"}>
                                {state.scoreBreakdown.rotationScore >= 0 ? '+' : ''}{state.scoreBreakdown.rotationScore}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#FFD5AB]">
                                {t('score.breakdown.hintScore')}：<span className="text-[10px]">{state.gameStats.hintUsageCount}/{state.scoreBreakdown.hintAllowance || 0}{t('leaderboard.timesUnit')}</span>
                              </span>
                              <span className={state.scoreBreakdown.hintScore >= 0 ? "text-green-400" : "text-red-400"}>
                                {state.scoreBreakdown.hintScore >= 0 ? '+' : ''}{state.scoreBreakdown.hintScore}
                              </span>
                            </div>
                            <div className="border-t border-white/20 pt-2 mt-3">
                              <div className="flex justify-between mb-1">
                                <span className="text-[#FFD5AB]">{t('score.breakdown.subtotal')}：</span>
                                <span className="text-[#FFD5AB]">{(state.scoreBreakdown.baseScore + state.scoreBreakdown.timeBonus + state.scoreBreakdown.rotationScore + state.scoreBreakdown.hintScore)}</span>
                              </div>
                              <div className="flex flex-col mb-2">
                                <div className="flex justify-between">
                                  <span className="text-[#FFD5AB]">{t('score.breakdown.multiplier')}：</span>
                                  <span className="text-[#FFD5AB]">×{state.scoreBreakdown.difficultyMultiplier.toFixed(2)}</span>
                                </div>
                                <div className="text-[#FFD5AB]/70 text-[10px] text-right mt-0.5">
                                  ({getMultiplierBreakdown(state.gameStats.difficulty, state.scoreBreakdown.difficultyMultiplier)})
                                </div>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span className="text-[#FFD5AB]">{t('score.breakdown.final')}：</span>
                                <span className="text-blue-300">{state.currentScore.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 游戏时间 */}
                      <div className="mt-3 text-center">
                        <div className="text-sm text-[#FFD5AB] opacity-80">
                          {t('score.breakdown.gameTime')}：{new Date(state.gameStats.gameStartTime).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* 重玩本局和重开游戏按钮 */}
                  <div className="flex flex-col gap-2 mt-4">
                    <RestartButton
                      onClick={handleRetryCurrentGame}
                      icon="retry"
                      style={{ height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}
                    >
                      {t('game.controls.retryCurrent')}
                    </RestartButton>
                    <RestartButton
                      onClick={handleDesktopResetGame}
                      icon="refresh"
                      style={{ height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}
                    >
                      {t('game.controls.restartGame')}
                    </RestartButton>
                  </div>
                </div>
              ) : (
                // 正常游戏状态显示控制面板
                <>
                  {/* 游戏设置部分 */}
                  <ShapeControls goToNextTab={goToNextTab} />
                  <PuzzleControlsCutType goToNextTab={goToNextTab} />
                  <PuzzleControlsCutCount goToNextTab={goToNextTab} />
                  <PuzzleControlsScatter goToNextTab={goToNextTab} />

                  {/* 控制按钮部分 */}
                  <h3 className="font-medium mt-4 mb-3 text-[#FFD5AB]" style={{ fontSize: panelScale <= 0.5 ? 16 : 'calc(0.9rem * var(--panel-scale))' }}>{t('game.controls.title')}</h3>
                  <ActionButtons layout="desktop" buttonHeight={DESKTOP_CONTROL_BUTTON_HEIGHT} />
                  {/* 正常游戏状态下显示重玩本局和重开游戏按钮 */}
                  <div className="flex flex-row gap-2 mt-4">
                    <RestartButton
                      onClick={handleRetryCurrentGame}
                      icon="retry"
                      style={{ flex: 1, height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}
                    >
                      {t('game.controls.retryCurrent')}
                    </RestartButton>
                    <RestartButton
                      onClick={handleDesktopResetGame}
                      icon="refresh"
                      style={{ flex: 1, height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}
                    >
                      {t('game.controls.restartGame')}
                    </RestartButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout; 