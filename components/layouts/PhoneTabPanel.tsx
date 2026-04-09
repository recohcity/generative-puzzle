import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ShapeControls from "@/components/ShapeControls";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";
import RestartButton from "@/components/RestartButton";
import { Button } from "@/components/ui/button";
import MobileScoreLayout from "@/components/score/MobileScoreLayout";
import { GameDataManager } from '@/utils/data/GameDataManager';
import { Lightbulb, RotateCcw, RotateCw, Trophy, User, X, Globe, History as HistoryIcon, Loader2 } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { playRotateSound, playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { useAngleDisplay } from '@/utils/angleDisplay';
import IdentityChip from '@/components/auth/IdentityChip';
import { useAuth } from '@/contexts/AuthContext';
import VirtualAuthWidget from '@/components/auth/VirtualAuthWidget';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { CloudGameRepository } from "@/utils/cloud/CloudGameRepository";

interface PhoneTabPanelProps {
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  style?: React.CSSProperties;
  isLandscape?: boolean;
}

// 主标题样式（横竖屏统一字号）
const TITLE_CLASS = "text-premium-title text-lg leading-tight whitespace-nowrap";

// card标题样式
const CARD_TITLE_CLASS = "text-premium-label text-[11px] mb-2 leading-tight text-center opacity-70";

// tab按钮样式
const TAB_BUTTON_CLASS = "flex-1 px-0 py-1 text-sm font-bold transition-all text-center";

// 分区容器样式
const SECTION_CLASS = "mb-1";

// 面板根容器样式
const PANEL_CLASS_BASE = "glass-panel h-full w-full flex flex-col overflow-hidden";
const PANEL_PADDING_PORTRAIT = "p-2.5";
const PANEL_PADDING_LANDSCAPE = "px-3 py-2";

const CONTENT_HORIZONTAL_PADDING = 0;

const TAB_BUTTON_HEIGHT = 32;
const TAB_BUTTON_FONT_SIZE = 12;
const TAB_BUTTON_FONT_SIZE_LANDSCAPE = 12;
const TAB_BUTTON_HEIGHT_LANDSCAPE = 32;
const SHAPE_BUTTON_HEIGHT = 60;
const MOBILE_SHAPE_BUTTON_FONT_SIZE = 14;
const CUT_TYPE_BUTTON_HEIGHT = 36;
const NUMBER_BUTTON_HEIGHT = 28;
const ACTION_BUTTON_HEIGHT = 36;
const MOBILE_CONTROL_BUTTON_HEIGHT = 36;
const MOBILE_CONTROL_BUTTON_FONT_SIZE = 14;
const MOBILE_RESTART_BUTTON_HEIGHT = 36;
const MOBILE_RESTART_BUTTON_FONT_SIZE = 14;
const MOBILE_RESTART_ICON_SIZE = 18;

const PhoneTabPanel: React.FC<PhoneTabPanelProps> = ({
  activeTab,
  onTabChange,
  goToNextTab,
  goToFirstTab,
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  style,
  isLandscape = false
}) => {
  const { state, rotatePiece, showHintOutline, resetGame, retryCurrentGame, trackHintUsage, trackRotation } = useGame();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const {
    shouldShowAngle,
    isTemporaryDisplay,
    needsHintEnhancement
  } = useAngleDisplay();

  const [showLeaderboard, setShowLeaderboard] = React.useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = React.useState<'personal' | 'global'>('personal');
  const [leaderboardData, setLeaderboardData] = React.useState<any[]>([]);
  const [historyData, setHistoryData] = React.useState<any[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchGlobalData = useCallback(async () => {
    try {
      setIsGlobalLoading(true);
      const data = await CloudGameRepository.fetchPublicLeaderboard("all");
      setGlobalLeaderboard(data);
    } catch (error) {
      console.error("[PhoneTabPanel] Failed to fetch global leaderboard:", error);
    } finally {
      setIsGlobalLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const data = GameDataManager.getLeaderboard();
    const history = GameDataManager.getGameHistory();
    setLeaderboardData(data);
    setHistoryData(history);
  }, []);

  useEffect(() => {
    if (activeLeaderboardTab === 'global' && globalLeaderboard.length === 0) {
      fetchGlobalData();
    }
  }, [activeLeaderboardTab, globalLeaderboard.length, fetchGlobalData]);

  const handleToggleLeaderboard = () => {
    if (!showLeaderboard) {
      const data = GameDataManager.getLeaderboard();
      const history = GameDataManager.getGameHistory();
      setLeaderboardData(data);
      setHistoryData(history);
      setActiveLeaderboardTab('personal');
    }
    setShowLeaderboard(!showLeaderboard);
    
    // 强制重置视口缩放 (Force viewport reset)
    setTimeout(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        setTimeout(() => {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
        }, 300);
      }
    }, 100);
  };


  const getTabLabel = (tab: string) => {
    return t(`game.tabs.${tab}`);
  };

  const isHintDisabled = !state.isScattered || state.selectedPiece === null || state.completedPieces.includes(state.selectedPiece ?? -1);
  const isRotateDisabled = !state.isScattered || state.selectedPiece === null || state.isCompleted;

  const handleShowHint = () => {
    playButtonClickSound();
    showHintOutline();
    try { trackHintUsage(); } catch (e) { }
  };

  const handleRotateLeft = () => {
    playRotateSound();
    rotatePiece(false);
    try { trackRotation(); } catch (e) { }
  };

  const handleRotateRight = () => {
    playRotateSound();
    rotatePiece(true);
    try { trackRotation(); } catch (e) { }
  };

  const handleRetryCurrent = () => {
    playButtonClickSound();
    retryCurrentGame();
  };

  const handleRestart = () => {
    const isGameInProgress = state.isGameActive && state.puzzle && state.isScattered && !state.isCompleted;
    if (isGameInProgress) {
      if (!window.confirm(t('game.controls.restartConfirm'))) return;
    }
    resetGame();
    if (goToFirstTab) goToFirstTab();
    setTimeout(() => {
      document.querySelectorAll('button').forEach(btn => { (btn as HTMLElement).style.pointerEvents = 'none'; });
      setTimeout(() => {
        document.querySelectorAll('button').forEach(btn => { (btn as HTMLElement).style.pointerEvents = ''; });
      }, 100);
    }, 0);
  };

  const isGameCompleted = state.isCompleted && state.gameStats;

  return (
    <div
      className={`${PANEL_CLASS_BASE} ${isLandscape ? PANEL_PADDING_LANDSCAPE : PANEL_PADDING_PORTRAIT} ${isLandscape ? 'gap-1' : 'gap-2'}`}
      style={style}
    >
      <div className="flex items-center justify-between mb-1">
        <h1 className={TITLE_CLASS}>{t('game.title')}</h1>
        <GlobalUtilityButtons
          isMusicPlaying={isMusicPlaying}
          isFullscreen={isFullscreen}
          onToggleMusic={onToggleMusic}
          onToggleFullscreen={onToggleFullscreen}
          onToggleLeaderboard={handleToggleLeaderboard}
          isLeaderboardOpen={showLeaderboard}
        />
      </div>

      {!showLeaderboard && (
        <div className="mb-0.5 mt-0">
          <IdentityChip
            panelScale={isLandscape ? 0.7 : 0.8}
            isPanelOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            onClick={handleToggleLeaderboard}
          />
        </div>
      )}

      {/* 身份验证弹窗 - 仅限未登录用户 */}
      {isMounted && typeof document !== 'undefined' && !user && createPortal(
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleToggleLeaderboard}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/20 backdrop-blur-3xl cursor-pointer"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "bg-white/10 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden flex flex-col outline-none cursor-default transition-all duration-300",
                  isLandscape
                    ? "w-[540px] max-w-[90vw] h-[310px]"
                    : "w-full max-w-[340px] h-[450px]"
                )}
              >
                <div className="bg-transparent rounded-[2.5rem] shrink-0 h-full">
                  <VirtualAuthWidget onAuthSuccess={() => setShowLeaderboard(false)} isLandscape={isLandscape} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 游戏面板主内容区 */}
      {!isGameCompleted && !showLeaderboard && (
        <div className="mb-0" style={{ paddingLeft: CONTENT_HORIZONTAL_PADDING, paddingRight: CONTENT_HORIZONTAL_PADDING }}>
          <div className="flex w-full bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden no-scrollbar whitespace-nowrap" style={{ height: isLandscape ? TAB_BUTTON_HEIGHT_LANDSCAPE : TAB_BUTTON_HEIGHT }}>
            {(['shape', 'puzzle', 'cut', 'scatter', 'controls'] as const).map((tab) => (
              <button key={tab} className={cn(TAB_BUTTON_CLASS, activeTab === tab ? 'glass-btn-active z-10' : 'text-premium-label opacity-60')} onClick={() => onTabChange(tab)} style={{ fontSize: isLandscape ? TAB_BUTTON_FONT_SIZE_LANDSCAPE : TAB_BUTTON_FONT_SIZE }}>
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 核心面板：要么显示游戏控制/结算，要么显示个人最佳成绩 */}
      <div style={{ paddingLeft: CONTENT_HORIZONTAL_PADDING, paddingRight: CONTENT_HORIZONTAL_PADDING, width: '100%', marginTop: (isGameCompleted || showLeaderboard) ? 2 : 0, flex: 1, overflow: 'hidden' }} className="no-scrollbar">
        {showLeaderboard && user ? (
          /* 已登录状态：在面板内显示成绩榜单 (精准复刻桌面版 parity 设计) */
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col pt-0">
            <div className={cn("rounded-2xl flex flex-col flex-1 min-h-0 relative overflow-hidden", isLandscape ? "p-1.5" : "p-3")}>
              {/* 顶部标签切换器 + 关闭按钮 (紧凑布局) */}
              <div className="flex items-center justify-between mb-1 shrink-0 px-0.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setActiveLeaderboardTab('personal');
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-xl text-[12.5px] font-black transition-all",
                      activeLeaderboardTab === 'personal' ? "glass-btn-active" : "glass-btn-inactive"
                    )}
                  >
                    <User className={cn("w-3.5 h-3.5", activeLeaderboardTab === 'personal' ? "text-[#232035]" : "text-current")} />
                    <span>{t('game.leaderboard.tabs.personal')}</span>
                  </button>
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setActiveLeaderboardTab('global');
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-xl text-[12.5px] font-black transition-all",
                      activeLeaderboardTab === 'global' ? "glass-btn-active" : "glass-btn-inactive"
                    )}
                  >
                    <Globe className={cn("w-3.5 h-3.5", activeLeaderboardTab === 'global' ? "text-[#232035]" : "text-current")} />
                    <span>{t('game.leaderboard.tabs.global')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {activeLeaderboardTab === 'global' && (
                    <button
                      onClick={fetchGlobalData}
                      disabled={isGlobalLoading}
                      className={cn(
                        "text-[11px] text-[#FFD5AB] font-medium hover:text-white transition-colors px-2 py-1 flex items-center gap-1",
                        isGlobalLoading && "opacity-50"
                      )}
                    >
                      {isGlobalLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : null}
                      {t('game.leaderboard.refresh')}
                    </button>
                  )}
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="text-[11px] text-[#FFD5AB] font-medium hover:text-white transition-colors px-2 py-1"
                  >
                    {t('game.leaderboard.close')}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-0.5 overscroll-contain">
                <AnimatePresence mode="wait">
                  {activeLeaderboardTab === 'personal' ? (
                    <motion.div
                      key="personal-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      {/* 个人最佳容器 */}
                      <div className="rounded-xl p-2 bg-white/[0.04]">
                        <div className="space-y-0.5">
                          {leaderboardData.length > 0 ? (
                            leaderboardData.slice(0, 5).map((record, index) => {
                              const isTop3 = index < 3;
                              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                              const subtitle = [
                                `${Math.floor(record.totalDuration / 60).toString().padStart(2, '0')}:${(record.totalDuration % 60).toString().padStart(2, '0')}`,
                                t('difficulty.levelLabel', { level: record.difficulty?.cutCount || 1 }),
                                t(`game.shapes.names.${record.difficulty?.shapeType}`),
                                `${record.difficulty?.actualPieces || 0}${t('stats.piecesUnit')}`
                              ].filter(Boolean).join(' · ');

                              return (
                                <div key={record.id || record.timestamp} className={cn(
                                  "flex items-center gap-3 px-3 bg-white/[0.06] rounded-xl border border-white/10 hover:border-[#FFD5AB]/40 hover:bg-white/[0.10] transition-all active:scale-[0.98]",
                                  isLandscape ? "py-1" : "py-1.5"
                                )}>
                                  <div className={cn(
                                    "flex items-center justify-center w-7 h-7 shrink-0 font-bold rounded-lg transition-all",
                                    isTop3 ? "text-2xl bg-transparent" : "bg-white/10 text-[#FFD5AB]/70 text-sm"
                                  )}>
                                    {medal || index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden">
                                    <div className="text-[10px] text-[#FFD5AB]/40 font-bold truncate">
                                      {subtitle}
                                    </div>
                                    <div className="text-white text-[15px] font-bold tabular-nums tracking-tighter shrink-0">
                                      {record.finalScore?.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-20 flex items-center justify-center">
                              <p className="text-[10px] text-white/20 uppercase font-bold">{t('game.leaderboard.empty')}</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="global-tab"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="rounded-xl px-2 py-2 bg-white/[0.04]"
                    >
                      {isGlobalLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                          <span className="text-white/20 text-[10px] uppercase font-bold">{t('game.leaderboard.loadingGlobal')}</span>
                        </div>
                      ) : globalLeaderboard.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                          <Globe className="w-8 h-8 mb-2 opacity-10" />
                          <div className="text-white/30 text-[10px] uppercase font-bold">{t('game.leaderboard.empty')}</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {globalLeaderboard.slice(0, 5).map((record, index) => {
                            const r = record as any;
                            const difficultyKey = record.difficulty?.difficultyLevel;
                            const difficultyLabel = difficultyKey ? t(`difficulty.${difficultyKey}`) : '';
                            const playerName = r.nickname || r.displayName || t('game.leaderboard.anonymous');
                            const sessions = r.sessionsCount ?? 0;
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                            const subtitle = [playerName, difficultyLabel].filter(Boolean).join(' · ');
                            return (
                              <div
                                key={`global-${record.id || index}`}
                                className={cn(
                                  "flex items-center gap-3 px-3 bg-white/[0.06] rounded-xl border border-white/10 hover:border-[#FFD5AB]/40 hover:bg-white/[0.10] transition-all active:scale-[0.98] overflow-hidden",
                                  isLandscape ? "py-1" : "py-1.5"
                                )}
                              >
                                {/* Rank — same as personal tab */}
                                <div className={cn(
                                  "flex items-center justify-center w-7 h-7 shrink-0 font-bold rounded-lg transition-all",
                                  index < 3 ? "text-2xl bg-transparent" : "bg-white/10 text-[#FFD5AB]/70 text-sm"
                                )}>
                                  {medal || index + 1}
                                </div>
                                {/* Content row — Single line optimized */}
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden">
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    <span className="text-[#FFD5AB]/90 text-[12px] font-bold truncate shrink-0 max-w-[65px]">
                                      {playerName}
                                    </span>
                                    {difficultyLabel && (
                                      <span className="text-[9px] text-[#FFD5AB]/30 font-bold truncate opacity-80">
                                        · {difficultyLabel}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="text-white text-[15px] font-black tabular-nums tracking-tighter">
                                      {record.finalScore?.toLocaleString()}
                                    </div>
                                    <div className="text-[#FFD5AB]/20 text-[9px] font-bold tabular-nums">
                                      {sessions}{t('game.leaderboard.sessionsUnit')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        ) : isGameCompleted ? (
          /* 游戏结算界面 */
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto min-h-0">
              <MobileScoreLayout gameStats={state.gameStats!} currentScore={state.currentScore} scoreBreakdown={state.scoreBreakdown || undefined} isNewRecord={state.isNewRecord} isLandscape={isLandscape} />
            </div>
            <div className="flex-shrink-0 flex flex-row gap-2 mt-2">
              <RestartButton onClick={handleRetryCurrent} icon="retry" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }}>{t('game.controls.retryCurrent')}</RestartButton>
              <RestartButton onClick={handleRestart} icon="refresh" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }}>{t('game.controls.restartGame')}</RestartButton>
            </div>
          </div>
        ) : (
          /* 游戏控制面板内容 */
          <>
            {(activeTab === 'shape' || activeTab === 'puzzle' || activeTab === 'cut' || activeTab === 'scatter') && (
              <div className={SECTION_CLASS}>
                {activeTab === 'shape' && (
                  <div className="flex flex-col items-center">
                    <h2 className={CARD_TITLE_CLASS}>{t('game.shapes.title')}</h2>
                    <ShapeControls goToNextTab={goToNextTab} buttonHeight={SHAPE_BUTTON_HEIGHT} fontSize={MOBILE_SHAPE_BUTTON_FONT_SIZE} />
                  </div>
                )}
                {activeTab === 'puzzle' && (
                  <div className="flex flex-col items-center">
                    <h2 className={CARD_TITLE_CLASS}>{t('game.cutType.title')}</h2>
                    <PuzzleControlsCutType goToNextTab={goToNextTab} buttonHeight={CUT_TYPE_BUTTON_HEIGHT} />
                  </div>
                )}
                {activeTab === 'cut' && (
                  <div className="flex flex-col items-center px-3">
                    <h2 className={CARD_TITLE_CLASS}>{t('game.cutCount.title')}</h2>
                    <div className="max-w-[290px] w-full mx-auto">
                      <PuzzleControlsCutCount goToNextTab={goToNextTab} buttonHeight={NUMBER_BUTTON_HEIGHT} actionButtonHeight={ACTION_BUTTON_HEIGHT} />
                    </div>
                  </div>
                )}
                {activeTab === 'scatter' && (
                  <div className="flex flex-col items-center">
                    <h2 className={CARD_TITLE_CLASS}>{t('game.scatter.title')}</h2>
                    <PuzzleControlsScatter goToNextTab={goToNextTab} buttonHeight={ACTION_BUTTON_HEIGHT} />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'controls' && (
              <div className={SECTION_CLASS}>
                <div className="flex flex-col items-center">
                  <div className="flex w-full mb-2 gap-2">
                    <Button style={{ height: MOBILE_CONTROL_BUTTON_HEIGHT, flex: 1 }} className="glass-btn-active p-0" onClick={handleShowHint} disabled={isHintDisabled}><Lightbulb className="w-4 h-4" /></Button>
                    <Button style={{ height: MOBILE_CONTROL_BUTTON_HEIGHT, flex: 1 }} className="glass-btn-active p-0" onClick={handleRotateLeft} disabled={isRotateDisabled}><RotateCcw className="w-4 h-4" /></Button>
                    <Button style={{ height: MOBILE_CONTROL_BUTTON_HEIGHT, flex: 1 }} className="glass-btn-active p-0" onClick={handleRotateRight} disabled={isRotateDisabled}><RotateCw className="w-4 h-4" /></Button>
                  </div>
                  {state.selectedPiece !== null && state.puzzle && (
                    <div className="text-center mt-2 px-4 whitespace-normal">
                      {shouldShowAngle(state.selectedPiece) ? (
                        <>
                          <div className={cn("text-premium-value text-sm font-bold", isTemporaryDisplay() ? 'animate-pulse' : '')}>
                            {isTemporaryDisplay()
                              ? t('game.controls.angleTemporary', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                              : t('game.controls.currentAngle', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                            }
                          </div>
                          <div className="text-premium-label text-[11px] mt-1 opacity-70 leading-relaxed">
                            {isTemporaryDisplay()
                              ? t('game.controls.hintRevealedAngle')
                              : t('game.controls.rotateInstruction')
                            }
                          </div>
                        </>
                      ) : (
                        <div className="text-premium-label text-[11px] mt-1 opacity-60 leading-relaxed">
                          {needsHintEnhancement() ? t('game.controls.useHintToReveal') : t('game.controls.rotateInstruction')}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-row gap-2 mt-2 w-full">
                    <RestartButton onClick={handleRetryCurrent} icon="retry" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }}>{t('game.controls.retryCurrent')}</RestartButton>
                    <RestartButton onClick={handleRestart} icon="refresh" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }}>{t('game.controls.restartGame')}</RestartButton>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isGameCompleted && (
        <div className="mt-auto pt-1 pb-2">
          <div className="text-white text-[10px] text-center opacity-40">
            recoh AI project 2026 | generative puzzle V{process.env.APP_VERSION || '1.3.51'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneTabPanel;