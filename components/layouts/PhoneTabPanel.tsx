import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ShapeControls from "@/components/ShapeControls";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RestartButton from "@/components/RestartButton";
import { Button } from "@/components/ui/button";
import MobileScoreLayout from "@/components/score/MobileScoreLayout";
import { GameDataManager } from '@/utils/data/GameDataManager';
import { Lightbulb, RotateCcw, RotateCw, Trophy, User, X, Globe, History as HistoryIcon, Loader2, RefreshCw } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { playRotateSound, playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { useAngleDisplay } from '@/utils/angleDisplay';
import { useAuth } from '@/contexts/AuthContext';
import VirtualAuthWidget from '@/components/auth/VirtualAuthWidget';
import { VirtualAuthService, PlayerProfile } from '@/utils/cloud/VirtualAuthService';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { CloudGameRepository } from "@/utils/cloud/CloudGameRepository";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { getDifficultyMetadata } from '@/utils/difficulty/difficultyMetadata';

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
const TITLE_CLASS = "text-premium-title text-lg leading-tight whitespace-nowrap text-zoom-lock";

// card标题样式
const CARD_TITLE_CLASS = "text-premium-label text-[11px] mb-2 leading-tight text-center opacity-70";

// tab按钮样式 — flex居中，transition-colors 避免字体属性被过渡动画干扰
const TAB_BUTTON_CLASS = "flex-1 h-full px-0 text-sm font-bold transition-colors duration-200 text-center flex items-center justify-center";

// 分区容器样式
const SECTION_CLASS = "mb-1";

// 面板根容器样式
const PANEL_CLASS_BASE = "glass-panel h-full w-full flex flex-col overflow-hidden";
const PANEL_PADDING_PORTRAIT = "p-2.5 pt-1.5";
const PANEL_PADDING_LANDSCAPE = "px-3 py-2";

const CONTENT_HORIZONTAL_PADDING = 0;

const TAB_BUTTON_HEIGHT_BASE = 32;
const TAB_BUTTON_FONT_SIZE_BASE = 12;
const TAB_BUTTON_FONT_SIZE_LANDSCAPE_BASE = 12;
const TAB_BUTTON_HEIGHT_LANDSCAPE_BASE = 32;
const SHAPE_BUTTON_HEIGHT_BASE = 60;
const MOBILE_SHAPE_BUTTON_FONT_SIZE_BASE = 14;
const CUT_TYPE_BUTTON_HEIGHT_BASE = 40;
const NUMBER_BUTTON_HEIGHT_BASE = 28;
const ACTION_BUTTON_HEIGHT_BASE = 40;
const MOBILE_CONTROL_BUTTON_HEIGHT_BASE = 40;
const MOBILE_CONTROL_BUTTON_FONT_SIZE_BASE = 14;
const MOBILE_RESTART_BUTTON_HEIGHT_BASE = 40;
const MOBILE_RESTART_FONT_SIZE_BASE = 14;
const MOBILE_RESTART_ICON_SIZE_BASE = 18;

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
  const device = useDeviceDetection();

  // 🎯 极限小屏适配逻辑 (Extreme small screen adaptation)
  const isUltraSmall = device.screenWidth < 360;
  
  const TAB_BUTTON_HEIGHT = isUltraSmall ? 28 : TAB_BUTTON_HEIGHT_BASE;
  const TAB_BUTTON_FONT_SIZE = isUltraSmall ? 10 : TAB_BUTTON_FONT_SIZE_BASE;
  const TAB_BUTTON_FONT_SIZE_LANDSCAPE = isUltraSmall ? 10 : TAB_BUTTON_FONT_SIZE_LANDSCAPE_BASE;
  const TAB_BUTTON_HEIGHT_LANDSCAPE = isUltraSmall ? 28 : TAB_BUTTON_HEIGHT_LANDSCAPE_BASE;
  const SHAPE_BUTTON_HEIGHT = isUltraSmall ? 52 : SHAPE_BUTTON_HEIGHT_BASE;
  const MOBILE_SHAPE_BUTTON_FONT_SIZE = isUltraSmall ? 12 : MOBILE_SHAPE_BUTTON_FONT_SIZE_BASE;
  const CUT_TYPE_BUTTON_HEIGHT = isLandscape ? 32 : (isUltraSmall ? 36 : CUT_TYPE_BUTTON_HEIGHT_BASE);
  const NUMBER_BUTTON_HEIGHT = isUltraSmall ? 24 : NUMBER_BUTTON_HEIGHT_BASE;
  const ACTION_BUTTON_HEIGHT = isLandscape ? 32 : (isUltraSmall ? 36 : ACTION_BUTTON_HEIGHT_BASE);
  const MOBILE_CONTROL_BUTTON_HEIGHT = isLandscape ? 32 : (isUltraSmall ? 36 : MOBILE_CONTROL_BUTTON_HEIGHT_BASE);
  const MOBILE_CONTROL_BUTTON_FONT_SIZE = isLandscape ? 11 : (isUltraSmall ? 12 : MOBILE_CONTROL_BUTTON_FONT_SIZE_BASE);
  const MOBILE_RESTART_BUTTON_HEIGHT = isLandscape ? 32 : (isUltraSmall ? 36 : MOBILE_RESTART_BUTTON_HEIGHT_BASE);
  const MOBILE_RESTART_FONT_SIZE = isLandscape ? 11 : (isUltraSmall ? 12 : MOBILE_RESTART_FONT_SIZE_BASE);
  const MOBILE_RESTART_ICON_SIZE = isLandscape ? 14 : (isUltraSmall ? 16 : MOBILE_RESTART_ICON_SIZE_BASE);

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
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [userProfile, setUserProfile] = useState<Omit<PlayerProfile, 'virtual_email'> | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 游戏完成时不自动弹出，改为面板内展示摘要，手动点击查看详细
  useEffect(() => {
    if (state.isCompleted && state.gameStats) {
      // setShowScoreModal(true); // 🎯 优化：禁用自动弹出
    } else {
      setShowScoreModal(false);
    }
  }, [state.isCompleted, state.gameStats]);

  // 加载用户 Profile
  useEffect(() => {
    if (user) {
      VirtualAuthService.getCurrentProfile()
        .then(p => setUserProfile(p))
        .catch(() => setUserProfile(null));
    } else {
      setUserProfile(null);
      setShowUserPanel(false);
    }
  }, [user]);

  const handleToggleUserPanel = () => {
    if (!user) {
      // 未登录：触发登录弹窗
      handleToggleLeaderboard();
    } else {
      setShowUserPanel(prev => !prev);
    }
  };

  const handleUserPanelLogout = async () => {
    await signOut();
    setShowUserPanel(false);
  };

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

  const uniqueGlobalData = useMemo(() => {
    if (!globalLeaderboard.length) return [];
    
    return Array.from(
      globalLeaderboard.reduce((map, record) => {
        const key = record.id || (record as any).nickname || (record as any).userId;
        const existing = map.get(key);
        if (!existing || record.finalScore > existing.finalScore) {
          map.set(key, record);
        }
        return map;
      }, new Map<string, any>()).values()
    ).sort((a: any, b: any) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [globalLeaderboard]);

  const [showRestartDialog, setShowRestartDialog] = useState(false);

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
      setShowRestartDialog(true);
      return;
    }
    executeRestart();
  };

  const executeRestart = () => {
    setShowRestartDialog(false);
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
      className={cn(
        PANEL_CLASS_BASE,
        isLandscape 
          ? PANEL_PADDING_LANDSCAPE 
          : (isGameCompleted ? "p-2 pt-1" : PANEL_PADDING_PORTRAIT),
        isLandscape 
          ? "gap-1" 
          : (isGameCompleted ? "gap-0.5" : "gap-2")
      )}
      style={style}
    >
      {/* 始终显示游戏标题和全局功能按钮 */}
      <div className="flex items-center justify-between mb-0.5 gap-2">
        {/* 使用 SVG text 完全免疫安卓微信 textZoom 暴力缩放，确保中英文永不被放大截断 */}
        <svg viewBox="0 0 200 24" className="h-[22px] w-[183px] max-w-[55%] shrink min-w-0 text-brand-amber filter drop-shadow-sm">
          <text x="0" y="18" fill="currentColor" fontSize="18" fontWeight="normal" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="0">
            {t('game.title')}
          </text>
        </svg>
        <div className="flex-shrink-0">
          <GlobalUtilityButtons
            isMusicPlaying={isMusicPlaying}
            isFullscreen={isFullscreen}
            onToggleMusic={onToggleMusic}
            onToggleFullscreen={onToggleFullscreen}
            onToggleLeaderboard={handleToggleLeaderboard}
            isLeaderboardOpen={showLeaderboard}
            onToggleUser={handleToggleUserPanel}
            isLoggedIn={!!user}
            isUserPanelOpen={showUserPanel || (!user && showLeaderboard)}
          />
        </div>
      </div>


      {/* 登录弹窗 - 未登录时 */}
      {isMounted && typeof document !== 'undefined' && !user && createPortal(
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) {
                  handleToggleLeaderboard();
                }
              }}
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

      {/* 用户面板弹窗 - 已登录时 */}
      {isMounted && typeof document !== 'undefined' && !!user && createPortal(
        <AnimatePresence>
          {showUserPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setShowUserPanel(false);
              }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/20 backdrop-blur-3xl cursor-pointer"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center gap-6 outline-none cursor-default w-full max-w-[300px]"
              >

                {/* 用户头像 */}
                <div className="flex justify-center mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                    <User className="w-6 h-6 text-brand-dark relative" />
                  </div>
                </div>

                {/* 昵称 */}
                <div className="text-center">
                  <div className="text-sm font-bold text-center text-brand-amber tracking-tight uppercase mb-1">
                    {userProfile?.nickname || t('auth.loading')}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                    <span className="text-white/50 text-xs">{t('auth.loggedIn') || '已登录'}</span>
                  </div>
                </div>

                {/* 退出按钮 */}
                <button
                  onClick={handleUserPanelLogout}
                  className="w-full py-3 rounded-2xl bg-white/10 border border-white/15 text-white/80 font-medium text-sm hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300 transition-all"
                >
                  {t('auth.logout') || '退出登录'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 游戏结算全屏弹窗 */}
      {isMounted && typeof document !== 'undefined' && isGameCompleted && createPortal(
        <AnimatePresence>
          {showScoreModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setShowScoreModal(false);
              }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/20 backdrop-blur-xl cursor-pointer"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl relative flex flex-col outline-none w-full max-h-[82vh] cursor-default",
                  isLandscape ? "rounded-[2rem] max-w-[620px]" : "rounded-[2.5rem] max-w-[360px]"
                )}
              >
                <div className={cn("flex flex-col h-full", isLandscape ? "p-4" : "p-6")}>
                  {/* 顶部标准图标 (同 Auth 弹窗) - 仅在竖屏显示，横屏由 MobileScoreLayout 内部三栏接管 */}
                  {!isLandscape && (
                    <div className="flex flex-col items-center mb-6 shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative mb-4">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                        <Trophy className="w-8 h-8 text-brand-dark relative" />
                      </div>
                      
                      {/* 标题区：难度(小) + 禅(大) 顶部齐平 */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[10px] text-white/30 font-bold mt-1.5 uppercase tracking-widest">{t('score.breakdown.base')}</span>
                          <h2 className={cn("text-5xl font-black tracking-tighter drop-shadow-sm leading-none text-brand-peach")}>
                            {t(getDifficultyMetadata(state.gameStats!.difficulty.level).nameKey)}
                          </h2>
                        </div>
                        <p className="mt-2 text-white/30 text-[11px] font-medium tracking-wide">
                          {t(getDifficultyMetadata(state.gameStats!.difficulty.level).descriptionKey)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar mb-4 pr-1">
                    <MobileScoreLayout 
                      gameStats={state.gameStats!} 
                      currentScore={state.currentScore} 
                      scoreBreakdown={state.scoreBreakdown || undefined} 
                      isNewRecord={state.isNewRecord} 
                      isLandscape={isLandscape}
                      hideHeader={true}
                      onRetry={handleRetryCurrent}
                      onRestart={handleRestart}
                    />
                  </div>

                  {!isLandscape && (
                    <div className="flex-shrink-0 flex flex-row gap-3 pt-4 border-t border-white/5">
                      <RestartButton onClick={handleRetryCurrent} icon="retry" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }} fontSize={MOBILE_RESTART_FONT_SIZE} iconSize={MOBILE_RESTART_ICON_SIZE}>{t('game.controls.retryCurrent')}</RestartButton>
                      <RestartButton onClick={handleRestart} icon="refresh" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }} fontSize={MOBILE_RESTART_FONT_SIZE} iconSize={MOBILE_RESTART_ICON_SIZE}>{t('game.controls.restartGame')}</RestartButton>
                    </div>
                  )}
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
          <div className="flex w-full bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden no-scrollbar whitespace-nowrap items-center" style={{ height: isLandscape ? TAB_BUTTON_HEIGHT_LANDSCAPE : TAB_BUTTON_HEIGHT }}>
            {(['shape', 'puzzle', 'cut', 'scatter', 'controls'] as const).map((tab, idx, arr) => (
              <React.Fragment key={tab}>
                {idx > 0 && (
                  <div 
                    className={cn(
                      "w-[1px] h-full shrink-0 bg-white/10 transition-opacity duration-300",
                      (activeTab === tab || activeTab === arr[idx - 1]) ? "opacity-0" : "opacity-100"
                    )} 
                  />
                )}
                <button 
                  className={cn(
                    TAB_BUTTON_CLASS, 
                    "focus:outline-none border-none",
                    activeTab === tab 
                      ? 'bg-gradient-to-br from-brand-peach to-brand-orange text-brand-dark shadow-[0_2px_10px_rgba(246,142,95,0.2)] active:brightness-95 z-10' 
                      : 'text-brand-peach/60 active:bg-white/5'
                  )} 
                  onClick={() => onTabChange(tab)} 
                  style={{ fontSize: isLandscape ? TAB_BUTTON_FONT_SIZE_LANDSCAPE : TAB_BUTTON_FONT_SIZE }}
                >
                  {getTabLabel(tab)}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 核心面板：要么显示游戏控制/结算，要么显示个人最佳成绩 */}
      <div style={{ paddingLeft: CONTENT_HORIZONTAL_PADDING, paddingRight: CONTENT_HORIZONTAL_PADDING, width: '100%', marginTop: (isGameCompleted || showLeaderboard) ? 0 : 0, flex: 1, overflow: 'hidden' }} className="no-scrollbar">
        {showLeaderboard && user ? (
          /* 已登录状态：在面板内显示成绩榜单 (精准复刻桌面版 parity 设计) */
          <div 
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col pt-0"
            style={{ height: isLandscape ? 160 : TAB_BUTTON_HEIGHT + (isUltraSmall ? 134 : 140) - 2 }}
          >
            <div className={cn("rounded-2xl flex flex-col flex-1 min-h-0 relative overflow-x-hidden", isLandscape ? "p-1" : "pt-0.5 pb-1 px-2")}>
              {/* 顶部标签切换器 + 关闭按钮 (极度紧凑布局) */}
              <div className="flex items-center justify-between mb-1 shrink-0 px-0.5 h-7">
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setActiveLeaderboardTab('personal');
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 h-7 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                      activeLeaderboardTab === 'personal' ? "glass-btn-active" : "glass-btn-inactive"
                    )}
                  >
                    <User className={cn("w-3 h-3 shrink-0", activeLeaderboardTab === 'personal' ? "text-brand-dark" : "text-current")} />
                    <span>{t('game.leaderboard.tabs.personal')}</span>
                  </button>
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setActiveLeaderboardTab('global');
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 h-7 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                      activeLeaderboardTab === 'global' ? "glass-btn-active" : "glass-btn-inactive"
                    )}
                  >
                    <Globe className={cn("w-3 h-3 shrink-0", activeLeaderboardTab === 'global' ? "text-brand-dark" : "text-current")} />
                    <span>{t('game.leaderboard.tabs.global')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 h-7">
                  {activeLeaderboardTab === 'global' ? (
                    <button
                      onClick={fetchGlobalData}
                      disabled={isGlobalLoading}
                      className="w-7 h-7 m-0 p-0 flex items-center justify-center text-brand-peach/50 hover:text-brand-peach transition-all disabled:opacity-40 border-none bg-transparent"
                    >
                      {isGlobalLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCw className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <div className="w-7 h-7" />
                  )}
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
                      className="flex flex-col pt-0"
                    >
                      {/* 个人最佳容器 */}
                      <div className="space-y-0.5">
                          {leaderboardData.length > 0 ? (
                            leaderboardData.slice(0, 3).map((record, index) => {
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
                                  "flex items-center gap-2.5 px-2.5 bg-white/[0.06] rounded-xl border border-white/10 hover:border-brand-peach/40 hover:bg-white/[0.10] transition-all active:scale-[0.98]",
                                  "py-1"
                                )}>
                                  <div className={cn(
                                    "flex items-center justify-center shrink-0 font-medium rounded-lg transition-all",
                                    "w-6 h-6",
                                    isTop3 ? "text-xl bg-transparent" : "bg-white/10 text-brand-peach/70 text-xs"
                                  )}>
                                    {medal || index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden">
                                    <div className="text-[10px] text-brand-peach/40 font-medium truncate">
                                      {subtitle}
                                    </div>
                                    <div className="text-[15px] font-medium tabular-nums tracking-tighter shrink-0" style={{ color: 'var(--brand-peach)' }}>
                                      {record.finalScore?.toString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-20 flex items-center justify-center">
                              <p className="text-[10px] text-white/20 uppercase font-bold">{t('leaderboard.empty')}</p>
                            </div>
                          )}
                        </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="global-tab"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col pt-0"
                    >
                      {isGlobalLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          <span className="text-white/20 text-[10px] uppercase font-bold">{t('game.leaderboard.loadingGlobal')}</span>
                        </div>
                      ) : globalLeaderboard.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Globe className="w-6 h-6 mb-1.5 opacity-10" />
                          <div className="text-white/30 text-[10px] uppercase font-bold">{t('game.leaderboard.empty')}</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {uniqueGlobalData.slice(0, 3).map((record: any, index: number) => {
                            const r = record as any;
                            const difficultyKey = record.difficulty?.difficultyLevel;
                            const difficultyLabel = difficultyKey ? t(`difficulty.${difficultyKey}`) : '';
                            const playerName = r.nickname || r.displayName || t('game.leaderboard.anonymous');
                            const sessions = r.sessionsCount ?? 0;
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                            return (
                              <div
                                key={`global-${record.id || index}`}
                                className={cn(
                                  "flex items-center gap-2.5 px-2.5 bg-white/[0.06] rounded-xl border border-white/10 hover:border-brand-peach/40 hover:bg-white/[0.10] transition-all active:scale-[0.98] overflow-hidden",
                                  "py-1"
                                )}
                              >
                                {/* Rank — same as personal tab */}
                                <div className={cn(
                                  "flex items-center justify-center shrink-0 font-medium rounded-lg transition-all",
                                  "w-6 h-6",
                                  index < 3 ? "text-xl bg-transparent" : "bg-white/10 text-brand-peach/70 text-xs"
                                )}>
                                  {medal || index + 1}
                                </div>
                                {/* Content row — Single line optimized */}
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-1 overflow-hidden">
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    <span className="text-brand-peach/90 text-[11px] font-medium truncate shrink-0 max-w-[65px]">
                                      {playerName}
                                    </span>
                                    {difficultyLabel && (
                                      <span className="text-[9px] text-brand-peach/30 font-medium truncate opacity-80">
                                        · {difficultyLabel}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="text-[15px] font-medium tabular-nums tracking-tighter" style={{ color: 'var(--brand-peach)' }}>
                                      {record.finalScore?.toString()}
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
          /* 游戏结算界面 - 统一横竖屏：单行全量摘要 */
          <div className="flex flex-col justify-start w-full pt-1" style={{ height: isLandscape ? 160 : TAB_BUTTON_HEIGHT + (isUltraSmall ? 134 : 140) - 2 }}>
            <div className="flex flex-col gap-4 mt-1.5">
              <div className="flex items-start justify-between w-full px-1">
                {/* 左侧：难度荣誉组合 (顶部齐平) */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-1.5">
                    {t('score.breakdown.base')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Trophy className={cn("w-9 h-9 drop-shadow-xl text-brand-orange")} />
                    <span className={cn("text-3xl font-black tracking-tighter drop-shadow-md text-brand-peach")}>
                      {t(getDifficultyMetadata(state.gameStats!.difficulty.level).nameKey)}
                    </span>
                  </div>
                </div>
                
                {/* 右侧：分数与标签 (顶部齐平) */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-1.5">
                    {t('stats.score')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-sans font-medium text-brand-peach leading-none tabular-nums drop-shadow-lg">
                      {state.currentScore}
                    </span>
                    {state.isNewRecord && (
                      <span className="text-[9px] bg-brand-peach text-brand-dark font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter animate-pulse h-fit">
                        {t('score.newRecord') || 'NEW'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 px-1">
                {/* 标准宽度按钮 - 与下方按钮对齐 */}
                <div className="w-full">
                  <button 
                    onClick={() => setShowScoreModal(true)} 
                    className="glass-btn-active w-full rounded-2xl font-bold text-brand-dark flex items-center justify-center gap-1.5 shadow-[0_5px_15px_rgba(246,142,95,0.2)] transition-transform active:scale-[0.98] py-3"
                    style={{ height: MOBILE_RESTART_BUTTON_HEIGHT + 2, fontSize: MOBILE_RESTART_FONT_SIZE + 1 }}
                  >
                    <Trophy size={MOBILE_RESTART_ICON_SIZE + 2} className="text-brand-orange" />
                    {t('stats.viewDetailedScore')}
                  </button>
                </div>
                <div className="flex flex-row gap-2 w-full px-1">
                  <RestartButton onClick={handleRetryCurrent} icon="retry" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }} fontSize={MOBILE_RESTART_FONT_SIZE} iconSize={MOBILE_RESTART_ICON_SIZE}>{t('game.controls.retryCurrent')}</RestartButton>
                  <RestartButton onClick={handleRestart} icon="refresh" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }} fontSize={MOBILE_RESTART_FONT_SIZE} iconSize={MOBILE_RESTART_ICON_SIZE}>{t('game.controls.restartGame')}</RestartButton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 游戏控制面板内容 - 统一固定高度，防止切换Tab时画布跳动 */
          <div className="flex flex-col justify-start w-full pt-2" style={{ height: isLandscape ? 160 : TAB_BUTTON_HEIGHT + (isUltraSmall ? 134 : 140) - 2 }}>
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
                <div className="flex flex-col items-center w-full">
                  {/* 提示信息容器（单行显示），预留固定高度防止按钮跳动 */}
                  <div className="text-center px-2 flex flex-row justify-center items-center h-[16px] w-full mb-0.5">
                    {state.selectedPiece !== null && state.puzzle && (
                      shouldShowAngle(state.selectedPiece) ? (
                        <div className={cn("flex items-center justify-center gap-1.5 text-[11px] leading-none", isTemporaryDisplay() ? 'animate-pulse' : '')}>
                          <span className="text-premium-value font-medium whitespace-nowrap">
                            {isTemporaryDisplay()
                              ? t('game.controls.angleTemporary', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                              : t('game.controls.currentAngle', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                            }
                          </span>
                          <span className="text-premium-label opacity-70 whitespace-nowrap">
                            {isTemporaryDisplay()
                              ? t('game.controls.hintRevealedAngle')
                              : t('game.controls.rotateInstruction')
                            }
                          </span>
                        </div>
                      ) : (
                        <div className="text-premium-label text-[11px] opacity-60 leading-none">
                          {needsHintEnhancement() ? t('game.controls.useHintToReveal') : t('game.controls.rotateInstruction')}
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex w-full gap-2 mb-1">
                    <Button style={{ height: MOBILE_CONTROL_BUTTON_HEIGHT, flex: 1 }} className="glass-btn-active p-0" onClick={handleShowHint} disabled={isHintDisabled}><Lightbulb style={{ width: 18, height: 18 }} /></Button>
                    <Button style={{ height: MOBILE_CONTROL_BUTTON_HEIGHT, flex: 1 }} className="glass-btn-active p-0" onClick={handleRotateLeft} disabled={isRotateDisabled}><RotateCcw style={{ width: 18, height: 18 }} /></Button>
                    <Button style={{ height: MOBILE_CONTROL_BUTTON_HEIGHT, flex: 1 }} className="glass-btn-active p-0" onClick={handleRotateRight} disabled={isRotateDisabled}><RotateCw style={{ width: 18, height: 18 }} /></Button>
                  </div>
                  
                  <div className="flex flex-row gap-2 w-full">
                    <RestartButton onClick={handleRetryCurrent} icon="retry" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }}>{t('game.controls.retryCurrent')}</RestartButton>
                    <RestartButton onClick={handleRestart} icon="refresh" height={MOBILE_RESTART_BUTTON_HEIGHT} style={{ flex: 1 }}>{t('game.controls.restartGame')}</RestartButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-1 pb-2">
        <div className="text-white text-[10px] text-center opacity-40">
          recoh AI project 2026 | generative puzzle V{process.env.APP_VERSION || '1.3.51'}
        </div>
      </div>

      {/* Modern non-blocking restart confirmation */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent className="bg-white/10 backdrop-blur-2xl border-white/15 text-white w-[90%] sm:w-full rounded-[2rem] shadow-2xl">
          <AlertDialogHeader className="flex flex-col items-center sm:items-center sm:text-center">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                <RefreshCw className="w-6 h-6 text-brand-dark relative" />
              </div>
            </div>
            <AlertDialogTitle className="text-brand-peach font-bold">{t('game.controls.restartGame')}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {t('game.controls.restartConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white/70 transition-all rounded-xl">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeRestart}
              className="bg-gradient-to-r from-brand-peach to-brand-orange text-brand-dark font-medium transition-all shadow-lg shadow-brand-orange/20 rounded-xl hover:brightness-110"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhoneTabPanel;