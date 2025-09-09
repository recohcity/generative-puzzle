import React from 'react';
import ShapeControls from "@/components/ShapeControls";
import PuzzleControlsCutType from "@/components/PuzzleControlsCutType";
import PuzzleControlsCutCount from "@/components/PuzzleControlsCutCount";
import PuzzleControlsScatter from "@/components/PuzzleControlsScatter";
import GlobalUtilityButtons from "@/components/GlobalUtilityButtons";
import RestartButton from "@/components/RestartButton";
import { Button } from "@/components/ui/button";
import MobileScoreLayout from "@/components/score/MobileScoreLayout";
import { GameDataManager } from '@/utils/data/GameDataManager';
import { Lightbulb, RotateCcw, RotateCw, Trophy } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { playRotateSound, playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useTranslation } from '@/contexts/I18nContext';
import { useAngleDisplay } from '@/utils/angleDisplay';

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

// tabLabels 将通过翻译函数动态获取

// 主标题样式
const TITLE_CLASS = "font-bold text-[#FFB17A] text-lg md:text-xl leading-tight"; // 主标题字号、颜色、粗细

// 分区标题样式
const SECTION_TITLE_CLASS = "font-semibold text-[#FFD5AB] text-md mb-1 leading-snug "; // 分区标题字号、颜色、粗细、下边距优化为4px

// 卡片内小标题样式
const CARD_TITLE_CLASS = "text-xs font-medium mb-2 text-[#FFD5AB] leading-tight text-center"; // 卡片内小标题字号、颜色、粗细、下边距优化为8px

// tab按钮样式
const TAB_BUTTON_CLASS = "flex-1 px-0 py-1 text-sm font-medium mx-0 transition-colors text-center"; // flex-1 让按钮均分

// 卡片容器样式
const CARD_CLASS = "p-2 bg-[#463E50] rounded-4xl shadow-md w-full mb-1"; // 卡片padding、背景、圆角、阴影、下边距优化为4px

// 分区容器样式
const SECTION_CLASS = "mb-1"; // 分区下边距

// 面板根容器样式 - 横屏模式优化内边距
const PANEL_CLASS_BASE = "bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30 h-full w-full flex flex-col gap-2"; // 基础样式，gap从4减少到2 (8px)
const PANEL_PADDING_PORTRAIT = "p-3"; // 竖屏模式的内边距 (从24px减少到12px)
const PANEL_PADDING_LANDSCAPE = "px-3 py-2"; // 横屏模式的内边距 (水平12px，垂直8px)

// 新增：可调内容区水平padding参数
const CONTENT_HORIZONTAL_PADDING = 0; // 可根据需要调整
// 横屏模式tab容器的特殊padding设置 - 最大化优化，让tab容器接近画布宽度
const TAB_CONTAINER_HORIZONTAL_PADDING_LANDSCAPE = -60; // 横屏模式下tab容器最大化扩展，获得接近画布的宽度

// 新增：移动端/桌面端各类按钮高度常量
const TAB_BUTTON_HEIGHT = 36; // tab按钮
const TAB_BUTTON_FONT_SIZE = 12; // tab按钮字体大小（竖屏）
const TAB_BUTTON_FONT_SIZE_LANDSCAPE = 14; // tab按钮字体大小（横屏）
const TAB_BUTTON_HEIGHT_LANDSCAPE = 40; // 横屏模式tab按钮高度（稍微增加）
const SHAPE_BUTTON_HEIGHT = 60; // 形状按钮
const MOBILE_SHAPE_BUTTON_FONT_SIZE = 14; // 形状按钮文字字号（移动端）
const CUT_TYPE_BUTTON_HEIGHT = 36; // 直线/斜线按钮
const NUMBER_BUTTON_HEIGHT = 28; // 数字按钮
const ACTION_BUTTON_HEIGHT = 36; // 切割形状、散开拼图
// 新增：独立控制按钮高度
const MOBILE_CONTROL_BUTTON_HEIGHT = 36; // 控制按钮高度（更矮）
const MOBILE_CONTROL_BUTTON_FONT_SIZE = 14; // 控制按钮字号
const MOBILE_RESTART_BUTTON_HEIGHT = 36; // 重新开始按钮高度（更矮）
const MOBILE_RESTART_BUTTON_FONT_SIZE = 14; // 重新开始按钮字号
const MOBILE_RESTART_ICON_SIZE = 18; // 重新开始按钮图标
const DESKTOP_CONTROL_BUTTON_HEIGHT = 36; // 提示/左转/右转（桌面端）
const DESKTOP_RESTART_BUTTON_HEIGHT = 36; // 重新开始（桌面端）

// 移除：移动端按钮统一高度
// const MOBILE_BUTTON_HEIGHT = 40; // px，可根据需求调整

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
  // 新增：引入游戏核心逻辑和翻译
  const { state, rotatePiece, showHintOutline, resetGame, trackHintUsage, trackRotation } = useGame();
  const { t } = useTranslation();

  // 角度显示增强功能
  const {
    shouldShowAngle,
    getDisplayState,
    isTemporaryDisplay,
    needsHintEnhancement
  } = useAngleDisplay();

  // 榜单显示状态
  const [showLeaderboard, setShowLeaderboard] = React.useState(false);
  const [leaderboardData, setLeaderboardData] = React.useState<any[]>([]);
  const [historyData, setHistoryData] = React.useState<any[]>([]);

  // 加载个人最佳成绩数据
  React.useEffect(() => {
    const data = GameDataManager.getLeaderboard();
    const history = GameDataManager.getGameHistory();
    setLeaderboardData(data);
    setHistoryData(history);
  }, []);

  // 处理榜单切换
  const handleToggleLeaderboard = () => {
    if (showLeaderboard) {
      // 关闭个人最佳成绩
      setShowLeaderboard(false);
    } else {
      // 打开个人最佳成绩，加载最新数据
      const data = GameDataManager.getLeaderboard();
      const history = GameDataManager.getGameHistory();
      setLeaderboardData(data);
      setHistoryData(history);
      setShowLeaderboard(true);
    }
  };

  // 处理榜单关闭（保留用于个人最佳成绩内部的关闭按钮）
  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
  };

  // 动态获取tab标签
  const getTabLabel = (tab: string) => {
    return t(`game.tabs.${tab}`);
  };

  // 按照 ActionButtons 的禁用逻辑
  const isHintDisabled = !state.isScattered || state.selectedPiece === null || state.completedPieces.includes(state.selectedPiece ?? -1);
  const isRotateDisabled = !state.isScattered || state.selectedPiece === null || state.isCompleted;

  // 按钮点击事件
  const handleShowHint = () => {
    playButtonClickSound();
    showHintOutline();

    // 统计追踪：记录提示使用
    try {
      trackHintUsage();
    } catch (error) {
      // 静默处理统计追踪错误
    }
  };
  const handleRotateLeft = () => {
    playRotateSound();
    rotatePiece(false);

    // 统计追踪：记录旋转操作
    try {
      trackRotation();
    } catch (error) {
      // 静默处理统计追踪错误
    }
  };
  const handleRotateRight = () => {
    playRotateSound();
    rotatePiece(true);

    // 统计追踪：记录旋转操作
    try {
      trackRotation();
    } catch (error) {
      // 静默处理统计追踪错误
    }
  };
  const handleRestart = () => {
    // 检查是否在游戏过程中（需要确认）
    const isGameInProgress = state.isGameActive && state.puzzle && state.isScattered && !state.isCompleted;

    if (isGameInProgress) {
      // 游戏过程中需要确认
      const confirmed = window.confirm(t('game.controls.restartConfirm'));
      if (!confirmed) {
        return; // 用户取消，不执行重新开始
      }
    }

    // 执行重新开始
    resetGame();
    if (goToFirstTab) goToFirstTab();
    // 防止 tab 切换后形状按钮卡住 active 状态（移动端）
    setTimeout(() => {
      document.querySelectorAll('button').forEach(btn => {
        btn.style.pointerEvents = 'none';
      });
      setTimeout(() => {
        document.querySelectorAll('button').forEach(btn => {
          btn.style.pointerEvents = '';
        });
      }, 100);
    }, 0);
  };

  // 移动端不使用独立的个人最佳成绩面板，而是直接在控制面板中显示

  // 游戏完成时的特殊处理 - 保留基本功能
  const isGameCompleted = state.isCompleted && state.gameStats;

  return (
    <div
      className={`${PANEL_CLASS_BASE} ${isLandscape ? PANEL_PADDING_LANDSCAPE : PANEL_PADDING_PORTRAIT}`}
      style={style}
    >
      {/* 顶部标题和全局按钮 */}
      <div className="flex items-center justify-between mb-0">
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

      {/* 个人最佳成绩显示区域 - 点击奖杯后在游戏名称下方显示 */}
      {showLeaderboard && (
        <div className="mb-1">
          <div className="bg-[#2A2A2A] rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-[#FFD5AB] text-sm font-medium">{t('leaderboard.title')}</span>
              </div>
              <button
                onClick={handleToggleLeaderboard}
                className="text-[#FFD5AB] hover:text-white text-xs px-2 py-1 rounded transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
            {/* 个人最佳成绩条目 - 显示名次、分数、时间、难度、拼图数量 */}
            <div className="space-y-0.5">
              {leaderboardData.slice(0, 5).map((record, index) => {
                const rank = index + 1;
                const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank.toString();

                // 格式化时间显示
                const formatTime = (duration: number) => {
                  const minutes = Math.floor(duration / 60);
                  const seconds = Math.floor(duration % 60);
                  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                };

                // 获取难度显示文本
                const getDifficultyText = (difficulty: { cutCount?: number; difficultyLevel?: string } | undefined): string => {
                  if (!difficulty) return t('difficulty.levelLabel', { level: 1 });
                  return t('difficulty.levelLabel', { level: difficulty.cutCount || 1 });
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

                // 获取包含形状的难度文本
                const getDifficultyWithShape = (difficulty: any): string => {
                  const shapeName = getShapeDisplayName(difficulty?.shapeType);
                  const difficultyLevel = getDifficultyText(difficulty);
                  return shapeName ? `${shapeName}·${difficultyLevel}` : difficultyLevel;
                };

                return (
                  <div key={record.id || record.timestamp} className="flex items-center gap-2 py-1 px-2 bg-[#1A1A1A] rounded border border-[#333]">
                    {/* 排名图标 */}
                    <div className="flex items-center justify-center w-8 h-8">
                      <span className="text-xl text-white">
                        {rankIcon}
                      </span>
                    </div>

                    {/* 游戏信息 - 一行布局 */}
                    <div className="flex-1 min-w-0 text-xs text-[#FFD5AB] opacity-70">
{formatTime(record.totalDuration || 0)} • {getDifficultyWithShape(record.difficulty)} • {record.difficulty?.actualPieces || 0}{t('stats.piecesUnit')}
                    </div>

                    {/* 分数 - 加粗大号 */}
                    <div className="text-[#FFD5AB] text-base font-bold">
                      {record.finalScore?.toLocaleString() || 0}
                    </div>
                  </div>
                );
              })}

              {leaderboardData.length === 0 && (
                <div className="text-[#FFD5AB] opacity-60 text-xs text-center py-4">
                  {t('leaderboard.empty')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Tab按钮与内容区间距最小化 - 游戏完成时或显示个人最佳成绩时隐藏 */}
      {!isGameCompleted && !showLeaderboard && (
        <div
          className="mb-0"
          style={{
            paddingLeft: CONTENT_HORIZONTAL_PADDING,
            paddingRight: CONTENT_HORIZONTAL_PADDING,
          }}
        >
          <div
            className="flex w-full bg-[#2A283E] rounded-xl overflow-x-hidden whitespace-nowrap scrollbar-hide"
            style={{
              height: isLandscape ? TAB_BUTTON_HEIGHT_LANDSCAPE : TAB_BUTTON_HEIGHT,
              minHeight: isLandscape ? TAB_BUTTON_HEIGHT_LANDSCAPE : TAB_BUTTON_HEIGHT,
              maxHeight: isLandscape ? TAB_BUTTON_HEIGHT_LANDSCAPE : TAB_BUTTON_HEIGHT,
            }}
          >
            {(['shape', 'puzzle', 'cut', 'scatter', 'controls'] as const).map((tab) => (
              <button
                key={tab}
                className={
                  TAB_BUTTON_CLASS +
                  (activeTab === tab
                    ? ' bg-[#F68E5F] text-white shadow'
                    : ' text-[#FFD5AB] hover:bg-[#463E50]')
                }
                data-testid={`tab-${tab}-button`}
                onClick={() => onTabChange(tab)}
                style={{
                  outline: 'none',
                  border: 'none',
                  height: '100%',
                  minHeight: 0,
                  maxHeight: '100%',
                  borderRadius: 0,
                  padding: 0,
                  fontSize: isLandscape ? TAB_BUTTON_FONT_SIZE_LANDSCAPE : TAB_BUTTON_FONT_SIZE,
                  fontWeight: 500,
                  lineHeight: 1,
                  overflow: 'hidden',
                }}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 显示个人最佳成绩时隐藏游戏控制，否则显示正常的游戏控制或完成成绩 */}
      {!showLeaderboard && (
        <div style={{
          paddingLeft: CONTENT_HORIZONTAL_PADDING,
          paddingRight: CONTENT_HORIZONTAL_PADDING,
          width: '100%',
          marginTop: isGameCompleted ? 8 : 0  // 游戏完成时增加上边距，因为没有tab菜单
        }}>
          {isGameCompleted ? (
            /* 游戏完成时显示成绩 - 移动端紧凑样式 */
            <div className="flex flex-col h-full">
              {/* 成绩显示区域 - 紧凑布局 */}
              <div className="flex-1 overflow-y-auto">
                <MobileScoreLayout
                  gameStats={state.gameStats!}
                  currentScore={state.currentScore}
                  scoreBreakdown={state.scoreBreakdown || undefined}
                  isNewRecord={state.isNewRecord}
                />
              </div>
              {/* 重新开始按钮 - 固定在底部，减少间距 */}
              <div className="mt-1 flex-shrink-0">
                <RestartButton
                  onClick={handleRestart}
                  height={MOBILE_RESTART_BUTTON_HEIGHT}
                  fontSize={MOBILE_RESTART_BUTTON_FONT_SIZE}
                  iconSize={MOBILE_RESTART_ICON_SIZE}
                  style={{ width: '100%', minHeight: 0, paddingTop: 0, paddingBottom: 0, lineHeight: 1 }}
                  className="min-h-0 p-0 leading-none"
                />
              </div>
            </div>
          ) : (
            /* 正常游戏流程的控制面板 */
            <>
              {(activeTab === 'shape' || activeTab === 'puzzle' || activeTab === 'cut' || activeTab === 'scatter') && (
                <div className={SECTION_CLASS + ' mt-0'}>
                  {/* 分区标题已上移，这里不再渲染 */}
                  {activeTab === 'shape' && (
                    <div className="flex flex-col items-center">
                      <h4 className={CARD_TITLE_CLASS}>{t('game.shapes.title')}</h4>
                      <ShapeControls goToNextTab={goToNextTab} buttonHeight={SHAPE_BUTTON_HEIGHT} fontSize={MOBILE_SHAPE_BUTTON_FONT_SIZE} />
                    </div>
                  )}
                  {activeTab === 'puzzle' && (
                    <div className="flex flex-col items-center">
                      <h4 className={CARD_TITLE_CLASS}>{t('game.cutType.title')}</h4>
                      <PuzzleControlsCutType goToNextTab={goToNextTab} buttonHeight={CUT_TYPE_BUTTON_HEIGHT} />
                    </div>
                  )}
                  {activeTab === 'cut' && (
                    <div className="flex flex-col items-center px-3">
                      <h4 className={CARD_TITLE_CLASS}>{t('game.cutCount.title')}</h4>
                      <div className="max-w-[290px] w-full mx-auto">
                        <PuzzleControlsCutCount goToNextTab={goToNextTab} buttonHeight={NUMBER_BUTTON_HEIGHT} actionButtonHeight={ACTION_BUTTON_HEIGHT} />
                      </div>
                    </div>
                  )}
                  {activeTab === 'scatter' && (
                    <div className="flex flex-col items-center">
                      <h4 className={CARD_TITLE_CLASS}>{t('game.scatter.title')}</h4>
                      <PuzzleControlsScatter goToNextTab={goToNextTab} buttonHeight={ACTION_BUTTON_HEIGHT} />
                    </div>
                  )}
                </div>
              )}
              {/* 游戏控制分区 */}
              {activeTab === 'controls' && (
                <div className={SECTION_CLASS + ' mt-0'}>
                  <div className="flex flex-col items-center">
                    {/* 控制按钮组（移动端专用，使用与桌面端一致的图标） */}
                    <div className="flex w-full mb-2" style={{ gap: '8px' }}>
                      <Button
                        style={{
                          height: MOBILE_CONTROL_BUTTON_HEIGHT,
                          minHeight: 0,
                          fontSize: MOBILE_CONTROL_BUTTON_FONT_SIZE,
                          borderRadius: 14,
                          padding: 0,
                          lineHeight: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: '1 1 0%', // 确保等宽分布
                          width: 0, // 重置宽度让flex生效
                        }}
                        className={
                          `bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md min-h-0 p-0 leading-none` +
                          ` disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-[#F68E5F]`
                        }
                        variant="ghost"
                        onClick={handleShowHint}
                        disabled={isHintDisabled}
                        title={t('game.controls.hint')}
                      >
                        <Lightbulb style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
                      </Button>
                      <Button
                        style={{
                          height: MOBILE_CONTROL_BUTTON_HEIGHT,
                          minHeight: 0,
                          fontSize: MOBILE_CONTROL_BUTTON_FONT_SIZE,
                          borderRadius: 14,
                          padding: 0,
                          lineHeight: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: '1 1 0%', // 确保等宽分布
                          width: 0, // 重置宽度让flex生效
                        }}
                        className={
                          `bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md min-h-0 p-0 leading-none` +
                          ` disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-[#F68E5F]`
                        }
                        variant="ghost"
                        onClick={handleRotateLeft}
                        disabled={isRotateDisabled}
                        title={t('game.controls.rotateLeft')}
                      >
                        <RotateCcw style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
                      </Button>
                      <Button
                        style={{
                          height: MOBILE_CONTROL_BUTTON_HEIGHT,
                          minHeight: 0,
                          fontSize: MOBILE_CONTROL_BUTTON_FONT_SIZE,
                          borderRadius: 14,
                          padding: 0,
                          lineHeight: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: '1 1 0%', // 确保等宽分布
                          width: 0, // 重置宽度让flex生效
                        }}
                        className={
                          `bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md min-h-0 p-0 leading-none` +
                          ` disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-[#F68E5F]`
                        }
                        variant="ghost"
                        onClick={handleRotateRight}
                        disabled={isRotateDisabled}
                        title={t('game.controls.rotateRight')}
                      >
                        <RotateCw style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
                      </Button>
                    </div>

                    {/* 拼图角度提示信息 - 增强版 */}
                    {state.selectedPiece !== null && state.puzzle && (
                      <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '10px', color: '#FFD5AB', fontWeight: 500 }}>
                        {shouldShowAngle(state.selectedPiece) ? (
                          <>
                            <div className={isTemporaryDisplay() ? 'animate-pulse' : ''}>
                              {isTemporaryDisplay()
                                ? t('game.controls.angleTemporary', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                                : t('game.controls.currentAngle', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                              }
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '2px', marginBottom: '10px', color: '#FFD5AB', fontWeight: 500 }}>
                              {isTemporaryDisplay()
                                ? t('game.controls.hintRevealedAngle')
                                : t('game.controls.rotateInstruction')
                              }
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '12px', marginTop: '2px', marginBottom: '10px', color: '#FFD5AB', opacity: 0.6, fontWeight: 500 }}>
                            {needsHintEnhancement() ? t('game.controls.useHintToReveal') : t('game.controls.rotateInstruction')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 重新开始按钮（移动端专用） */}
                    <RestartButton
                      onClick={handleRestart}
                      height={MOBILE_RESTART_BUTTON_HEIGHT}
                      fontSize={MOBILE_RESTART_BUTTON_FONT_SIZE}
                      iconSize={MOBILE_RESTART_ICON_SIZE}
                      style={{ width: '100%', minHeight: 0, paddingTop: 0, paddingBottom: 0, lineHeight: 1 }}
                      className="min-h-0 p-0 leading-none"
                    />

                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 版权信息 - 移动端控制面板底部 */}
      <div className="mt-auto pt-2 border-t border-white/10">
        <div className="text-white text-xs text-center leading-relaxed opacity-60">
          <div>recoh AI project | generative puzzle V{process.env.APP_VERSION || '1.3.51'} </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneTabPanel;