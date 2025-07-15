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
  
  // 从GameContext获取state和resetGame函数
  const { state, resetGame } = useGame();
  
  // 计算拼图完成进度
  const totalPieces = (state.puzzle ?? []).length;
  const completedPiecesCount = (state.completedPieces ?? []).length;
  // const puzzleProgressText = totalPieces > 0 ? `${completedPiecesCount} / ${totalPieces} 块拼图已完成` : '';

  // 智能提示内容（新版流程）
  let progressTip = '';
  if (state.originalShape.length === 0 && state.puzzle === null && state.cutType === "") {
    progressTip = "请点击生成你喜欢的形状";
  } else if (state.originalShape.length > 0 && state.puzzle === null && state.cutType === "") {
    progressTip = "请选择切割类型";
  } else if (state.originalShape.length > 0 && state.puzzle === null && state.cutType !== "") {
    progressTip = "请切割形状";
  } else if (state.puzzle !== null && !state.isScattered) {
    progressTip = "请散开拼图，开始游戏";
  } else if (state.puzzle !== null && state.isScattered) {
    progressTip = `${completedPiecesCount} / ${totalPieces} 块拼图已完成`;
  }

  // 处理重新开始按钮点击
  const handleDesktopResetGame = () => {
    playButtonClickSound();
    resetGame();
  };

  // 新增：桌面端控制按钮和重置按钮高度常量
  const DESKTOP_CONTROL_BUTTON_HEIGHT = 36; // 提示/左转/右转（桌面端）
  const DESKTOP_RESTART_BUTTON_HEIGHT = 40; // 重新开始（桌面端）

  // 新增：动态正方形画布尺寸
  const [canvasSize, setCanvasSize] = useState(560); // 默认560
  const leftPanelRef = useRef<HTMLDivElement>(null);
  // 适配参数
  const minEdgeMargin = 10;
  const bottomSafeMargin = 60; // 新增底部安全区
  const canvasPanelGap = 10;
  const minPanelWidth = 280;
  const panelWidth = 350;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  let actualPanelWidth = panelWidth;
  let availableWidth = windowWidth - 2 * minEdgeMargin - actualPanelWidth - canvasPanelGap;
  let availableHeight = windowHeight - minEdgeMargin - bottomSafeMargin; // 修正：底部安全区
  if (availableWidth < availableHeight) {
    actualPanelWidth = Math.max(minPanelWidth, windowWidth - 2 * minEdgeMargin - availableHeight - canvasPanelGap);
    availableWidth = windowWidth - 2 * minEdgeMargin - actualPanelWidth - canvasPanelGap;
    if (availableWidth < availableHeight) {
      availableHeight = availableWidth;
    }
  }
  const canvasSizeFinal = Math.max(320, Math.min(availableHeight, availableWidth));
  const panelHeight = canvasSizeFinal;
  // 内容实际宽高
  const contentWidth = minEdgeMargin + actualPanelWidth + canvasPanelGap + canvasSizeFinal + minEdgeMargin;
  const contentHeight = minEdgeMargin + canvasSizeFinal + minEdgeMargin;
  const extraWidth = Math.max(0, windowWidth - contentWidth);
  const extraHeight = Math.max(0, windowHeight - contentHeight);
  const paddingLeft = minEdgeMargin + Math.floor(extraWidth / 2);
  const paddingRight = minEdgeMargin + Math.ceil(extraWidth / 2);
  const paddingTop = minEdgeMargin + Math.floor(extraHeight / 2);
  const paddingBottom = minEdgeMargin + Math.ceil(extraHeight / 2);
  // 面板缩放比例
  // panelScale极限下限提升为0.4，保证内容极限压缩但不至于不可用
  const panelScale = Math.max(0.4, Math.min(canvasSizeFinal / 560, 1.0));

  // 面板内容区padding、gap极限压缩
  // 极限压缩下锁定为精确像素，否则自适应
  const panelContentPadding = panelScale <= 0.5 ? 10 : 10;
  const panelContentGap = panelScale <= 0.5 ? 10 : Math.max(2, Math.min(6, 16 * panelScale));

  // 监听resize
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
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [canvasSizeFinal, actualPanelWidth, panelHeight]);

  return (
    <div style={{
      minWidth: '100vw',
      boxSizing: 'border-box',
      paddingTop: minEdgeMargin,
      paddingBottom: bottomSafeMargin, // 保证底部安全区
      paddingLeft: minEdgeMargin,
      paddingRight: minEdgeMargin,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        marginTop: 0,
        marginBottom: 'auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: canvasPanelGap,
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        {/* Left Control Panel */}
        <div
          ref={leftPanelRef}
          className="flex-shrink-0"
          style={{
            height: panelHeight,
            width: actualPanelWidth,
            minWidth: minPanelWidth,
            // 去除marginTop/marginLeft，完全由外层padding控制
            ...(panelScale <= 0.5 ? { '--panel-scale': 0.4 } : { '--panel-scale': panelScale })
          } as React.CSSProperties}
        >
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/30 h-full flex flex-col overflow-auto"
            style={{ padding: panelContentPadding, fontSize: panelScale <= 0.5 ? 16 : 'calc(16px * var(--panel-scale))', gap: panelContentGap }}
          >
            <div className="flex flex-col mb-1 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-[#FFB17A]" style={{ fontSize: 18, marginTop: 0, marginBottom: 0 }}>生成式拼图游戏</h1>
                <GlobalUtilityButtons 
                  isMusicPlaying={isMusicPlaying}
                  isFullscreen={isFullscreen}
                  onToggleMusic={onToggleMusic}
                  onToggleFullscreen={onToggleFullscreen}
                />
              </div>
              <h3 className="font-medium text-[#FFD5AB]" style={{ fontSize: 14, marginTop: 1, marginBottom: 1 }}>生成拼图</h3>
            </div>
            <div className="space-y-4 flex-1 pr-1 -mr-1">
              <ShapeControls goToNextTab={goToNextTab} /> 
              <PuzzleControlsCutType goToNextTab={goToNextTab} />
              <PuzzleControlsCutCount goToNextTab={goToNextTab} />
              <PuzzleControlsScatter goToNextTab={goToNextTab} />
              <h3 className="font-medium mt-4 mb-3 text-[#FFD5AB]" style={{ fontSize: panelScale <= 0.5 ? 16 : 'calc(0.9rem * var(--panel-scale))' }}>游戏控制</h3>
              <ActionButtons layout="desktop" buttonHeight={DESKTOP_CONTROL_BUTTON_HEIGHT} />
              <RestartButton
                onClick={handleDesktopResetGame}
                style={{ height: DESKTOP_RESTART_BUTTON_HEIGHT, fontSize: panelScale <= 0.5 ? 14 : 'calc(0.95rem * var(--panel-scale))' }}
              />
            </div>
          </div>
        </div>

        {/* Right Game Area */}
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
                className="absolute font-medium text-white bg-black/30 px-4 py-2 rounded-full z-10"
                style={{
                  fontSize: 12,
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
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
      </div>
    </div>
  );
};

export default DesktopLayout; 