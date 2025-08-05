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
      minHeight: '100vh',
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
        </div>
      </div>
  );
};

export default DesktopLayout; 