"use client";

import React, { useRef, useMemo } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import MobileSmartHints from "@/components/MobileSmartHints";
import { MOBILE_ADAPTATION } from '@/src/config/adaptationConfig';
import { calculateMobilePortraitCanvasSize } from '@/constants/canvasAdaptation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from "@/lib/utils";
import { useGame } from "@/contexts/GameContext";

interface PhonePortraitLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
}

const PhonePortraitLayout: React.FC<PhonePortraitLayoutProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  activeTab,
  onTabChange,
  goToNextTab,
  goToFirstTab,
}) => {
  // 使用统一的设备检测和画布管理系统
  const device = useDeviceDetection();
  const { state } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  const isCompleted = state.isCompleted;

  // 直接使用适配常量计算画布尺寸，不依赖useCanvas
  // 使用 useMemo 确保屏幕旋转时能够重新计算
  const { canvasSizeValue, canvasWidth, canvasHeight, canvasMargin } = useMemo(() => {
    // 🎯 修复：移除游戏完成时对画布尺寸的模拟调整，保持布局一致性
    const portraitResult = calculateMobilePortraitCanvasSize(
      device.screenWidth,
      device.screenHeight
    );

    const canvasSizeValue = portraitResult.canvasSize;
    const canvasWidth = canvasSizeValue;
    const canvasHeight = canvasSizeValue;
    const canvasMargin = MOBILE_ADAPTATION.PORTRAIT.CANVAS_MARGIN;

    return { canvasSizeValue, canvasWidth, canvasHeight, canvasMargin };
  }, [device.screenWidth, device.screenHeight]);

  // 竖屏画布尺寸计算完成

  // 🎯 优化：仅在 iPad 且处于竖屏模式时增加顶部间距，防止横屏溢出
  const isTabletPortrait = (device.deviceType === 'tablet' || (device.screenWidth >= 768 && device.screenWidth <= 1024)) && device.isPortrait;

  return (
    <div
      className={cn(
        "flex flex-col items-center min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden no-scrollbar",
        state.draggingPiece ? "dragging-active" : ""
      )}
      style={{
        background: 'none',
        paddingTop: isTabletPortrait ? 60 : (device.isWeChat ? 80 : 48),
        // 使用 CSS 原生安全区变量适配安卓系统导航栏，避免硬编码导致溢出
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      {/* 🎯 极致布局：将画布与面板间距收窄至 5px 极简状态 */}
      <div className="flex flex-col items-center w-full my-auto shrink-0 space-y-0">
        <div
          ref={containerRef}
          className="order-1 bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 overflow-hidden transition-all duration-500"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            maxWidth: canvasWidth,
            maxHeight: canvasHeight,
            // 🎯 顶部保留 margin，底部彻底归零，由 panel-container 的 marginTop 统一控制间距
            margin: `${canvasMargin}px auto 0 auto`,
            boxSizing: 'border-box',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
          }}
        >
          {/* 智能提示区域 - 使用统一覆盖元素样式 */}
          <div className="overlay-element smart-hints-overlay top-2">
            <MobileSmartHints />
          </div>
          <PuzzleCanvas />
        </div>
        { }
        <div
          id="panel-container"
          className="order-2 flex flex-col items-center gap-0 pb-4 w-full"
          style={{
            width: canvasWidth,
            // 🎯 极其窄的间距设置：结算时0px，平时2px
            marginTop: isCompleted ? 0 : 2,
            paddingTop: 0, // 移除额外的顶部padding
          }}
        >
          <PhoneTabPanel
            activeTab={activeTab}
            onTabChange={onTabChange}
            goToNextTab={goToNextTab}
            goToFirstTab={goToFirstTab}
            isMusicPlaying={isMusicPlaying}
            isFullscreen={isFullscreen}
            onToggleMusic={onToggleMusic}
            onToggleFullscreen={onToggleFullscreen}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};


export default PhonePortraitLayout;