"use client";

import React, { useRef, useMemo } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import MobileSmartHints from "@/components/MobileSmartHints";
import { MOBILE_ADAPTATION } from '@/src/config/adaptationConfig';
import { calculateMobilePortraitCanvasSize } from '@/constants/canvasAdaptation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // 直接使用适配常量计算画布尺寸，不依赖useCanvas
  // 使用 useMemo 确保屏幕旋转时能够重新计算
  const { canvasSizeValue, canvasWidth, canvasHeight, canvasMargin } = useMemo(() => {
    const portraitResult = calculateMobilePortraitCanvasSize(device.screenWidth, device.screenHeight);
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
      className="flex flex-col items-center min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden no-scrollbar"
      style={{
        background: 'none',
        // 🎯 再次深度调优：针对 100dvh 下的竖长屏幕，给予充裕的顶部空间 (100px)
        // 普通移动端同步提升到 48px，确保视觉平衡，利用下方的空白空间。
        paddingTop: isTabletPortrait ? 60 : (device.isWeChat ? 100 : 48), 
        paddingBottom: Math.max(MOBILE_ADAPTATION.PORTRAIT.SAFE_AREA_BOTTOM, 40),
      }}
    >
      <div className="flex flex-col items-center w-full my-auto shrink-0 space-y-2">
      <div
        ref={containerRef}
        className="order-1 bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 overflow-hidden"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          maxWidth: canvasWidth,
          maxHeight: canvasHeight,
          margin: `${canvasMargin}px auto`,
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
      {}
      <div
        id="panel-container"
        className="order-2 flex flex-col items-center gap-4 pb-4 w-full"
        style={{
          width: canvasWidth,
          marginTop: device.isWeChat ? 6 : 4, // 收窄间距，为下方统计/榜单面板腾出更多展示空间
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