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
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { playButtonClickSound } from "@/utils/rendering/soundEffects";

import { DESKTOP_ADAPTATION } from '@/src/config/adaptationConfig';
import { calculateDesktopCanvasSize } from '@/constants/canvasAdaptation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useTranslation } from '@/contexts/I18nContext';
import ScoreDisplay from '@/components/score/ScoreDisplay';
import DesktopScoreLayout from '@/components/score/DesktopScoreLayout';
import LeaderboardPanel from '@/components/leaderboard/LeaderboardPanel';
import RecentGameDetails from '@/components/RecentGameDetails';
import GameRecordDetails from '@/components/GameRecordDetails';
import { GameDataManager } from '@/utils/data/GameDataManager';
import { getSpeedBonusDescription, getSpeedBonusDetails } from '@generative-puzzle/game-core';
import IdentityChip from '@/components/auth/IdentityChip';

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
    const usedHints = state.gameStats?.hintUsageCount || 0;
    const allowedHints = state.gameStats?.hintAllowance || 0;
    progressTip = t('game.hints.gameStats', {
      completed: completedPiecesCount,
      total: totalPieces,
      hints: usedHints,
      allowedHints: allowedHints
    });
  } else if (state.isCompleted) {
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

  // 桌面端控制按钮和重置按钮高度常量
  const DESKTOP_CONTROL_BUTTON_HEIGHT = 36;
  const DESKTOP_RESTART_BUTTON_HEIGHT = 40;

  // 动态计算画布尺寸
  const [canvasSize, setCanvasSize] = useState(560);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const device = useDeviceDetection();
  const windowWidth = device.screenWidth;
  const windowHeight = device.screenHeight;

  const calculationResult = calculateDesktopCanvasSize(windowWidth, windowHeight);
  const { canvasSize: canvasSizeFinal, panelHeight, actualPanelWidth, actualLeftRightMargin } = calculationResult;

  const { TOP_BOTTOM_MARGIN, LEFT_RIGHT_MARGIN, CANVAS_PANEL_GAP, MIN_PANEL_WIDTH } = DESKTOP_ADAPTATION;

  const panelScale = Math.max(0.4, Math.min(canvasSizeFinal / 560, 1.0));
  const panelContentPadding = 10;
  const panelContentGap = panelScale <= 0.5 ? 10 : Math.max(2, Math.min(6, 16 * panelScale));

  useEffect(() => {
    function updateLayout() {
      setCanvasSize(Math.max(320, canvasSizeFinal));
      if (leftPanelRef.current) {
        leftPanelRef.current.style.height = panelHeight + 'px';
        leftPanelRef.current.style.width = actualPanelWidth + 'px';
      }
    }
    updateLayout();
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLayout, 200);
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
      minHeight: '100dvh',
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
        width: 'fit-content',
      }}>
        <div style={{
          width: canvasSizeFinal,
          height: canvasSizeFinal,
          position: 'relative',
          boxSizing: 'content-box',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30"
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
          />
          <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 2 }}>
            {progressTip && (
              <div className="overlay-element smart-hints-overlay" style={{ display: 'flex', justifyContent: 'center', width: 'auto', maxWidth: '90%' }}>
                {progressTip}
              </div>
            )}
            <PuzzleCanvas />
          </div>
        </div>

        <div ref={leftPanelRef} className="flex-shrink-0"
          style={{ height: panelHeight, width: actualPanelWidth, minWidth: MIN_PANEL_WIDTH, ...(panelScale <= 0.5 ? { '--panel-scale': 0.4 } : { '--panel-scale': panelScale }) } as React.CSSProperties}
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
                      setShowLeaderboard(false);
                    } else {
                      const data = GameDataManager.getLeaderboard();
                      const history = GameDataManager.getGameHistory();
                      setLeaderboardData(data);
                      setHistoryData(history);
                      setShowLeaderboard(true);
                    }
                  }}
                  isLeaderboardOpen={showLeaderboard}
                />
              </div>

              <div className="mt-2 group">
                <IdentityChip 
                  panelScale={panelScale} 
                  isPanelOpen={showLeaderboard}
                  onClose={() => setShowLeaderboard(false)}
                  onClick={() => {
                    if (!showLeaderboard) {
                      const data = GameDataManager.getLeaderboard();
                      const history = GameDataManager.getGameHistory();
                      setLeaderboardData(data);
                      setHistoryData(history);
                      setShowLeaderboard(true);
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-4 flex-1 pr-1 -mr-1">
              {showRecentGameDetails ? (
                <RecentGameDetails
                  record={selectedGameRecord}
                  onBack={() => {
                    setShowRecentGameDetails(false);
                    setSelectedGameRecord(null);
                    setShowLeaderboard(true);
                  }}
                />
              ) : showLeaderboard ? (
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
                      setShowLeaderboard(false);
                    } else {
                      const data = GameDataManager.getLeaderboard();
                      const history = GameDataManager.getGameHistory();
                      setLeaderboardData(data);
                      setHistoryData(history);
                      setShowLeaderboard(true);
                    }
                  }}
                  onViewRecentGame={(record) => {
                    setSelectedGameRecord(record);
                    setShowLeaderboard(false);
                    setShowRecentGameDetails(true);
                  }}
                />
              ) : state.isCompleted && state.gameStats ? (
                // 游戏完成时 - 统一调用 DesktopScoreLayout 组件，保持 UI 一致性
                <div className="flex flex-col h-full min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <DesktopScoreLayout
                      gameStats={state.gameStats}
                      scoreBreakdown={state.scoreBreakdown || undefined}
                      currentScore={state.currentScore}
                      isNewRecord={state.isNewRecord}
                      currentRank={state.currentRank ?? undefined}
                      embedded={true}
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                    <RestartButton onClick={handleRetryCurrentGame} icon="retry" style={{ height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}>
                      {t('game.controls.retryCurrent')}
                    </RestartButton>
                    <RestartButton onClick={handleDesktopResetGame} icon="refresh" style={{ height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}>
                      {t('game.controls.restartGame')}
                    </RestartButton>
                  </div>
                </div>
              ) : (
                <>
                  <ShapeControls goToNextTab={goToNextTab} />
                  <PuzzleControlsCutType goToNextTab={goToNextTab} />
                  <PuzzleControlsCutCount goToNextTab={goToNextTab} />
                  <PuzzleControlsScatter goToNextTab={goToNextTab} />
                  <h2 id="section-game-controls" className="text-premium-title mt-4 mb-3" style={{ fontSize: panelScale <= 0.5 ? 16 : 'calc(0.9rem * var(--panel-scale))' }}>{t('game.controls.title')}</h2>
                  <ActionButtons layout="desktop" buttonHeight={DESKTOP_CONTROL_BUTTON_HEIGHT} />
                  <div className="flex flex-row gap-2 mt-4">
                    <RestartButton onClick={handleRetryCurrentGame} icon="retry" style={{ flex: 1, height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}>
                      {t('game.controls.retryCurrent')}
                    </RestartButton>
                    <RestartButton onClick={handleDesktopResetGame} icon="refresh" style={{ flex: 1, height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}>
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