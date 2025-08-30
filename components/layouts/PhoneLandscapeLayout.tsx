"use client";

import React, { useRef, useMemo } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import MobileSmartHints from "@/components/MobileSmartHints";
import { MOBILE_ADAPTATION } from '@/src/config/adaptationConfig';
import { calculateMobileLandscapeCanvasSize } from '@/constants/canvasAdaptation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface PhoneLandscapeLayoutProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  activeTab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls';
  onTabChange: (tab: 'shape' | 'puzzle' | 'cut' | 'scatter' | 'controls') => void;
  goToNextTab: () => void;
  goToFirstTab: () => void;
}

const PhoneLandscapeLayout: React.FC<PhoneLandscapeLayoutProps> = ({
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
  const { canvasSizeValue, canvasMargin, panelWidth } = useMemo(() => {
    const landscapeResult = calculateMobileLandscapeCanvasSize(device.screenWidth, device.screenHeight);
    const canvasSizeValue = landscapeResult.canvasSize;
    const canvasMargin = MOBILE_ADAPTATION.LANDSCAPE.CANVAS_MARGIN;

    // 智能计算面板宽度：优先使用画布尺寸，如果空间不够则使用原始计算值
    const idealPanelWidth = canvasSizeValue; // 理想情况下与画布尺寸一致
    const totalRequiredWidth = idealPanelWidth + canvasSizeValue + canvasMargin * 3; // 面板 + 画布 + 3个边距
    const availableWidth = device.screenWidth;
    const hasEnoughSpace = availableWidth >= totalRequiredWidth;

    // 如果空间足够，使用理想宽度；否则使用原始计算的宽度
    const panelWidth = hasEnoughSpace ? idealPanelWidth : landscapeResult.panelWidth;
    
    return { canvasSizeValue, canvasMargin, panelWidth };
  }, [device.screenWidth, device.screenHeight]);

  // 横屏画布尺寸计算调试输出已移除

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflow: 'auto',
      paddingTop: MOBILE_ADAPTATION.LANDSCAPE.SAFE_AREA_TOP,
      paddingBottom: MOBILE_ADAPTATION.LANDSCAPE.SAFE_AREA_BOTTOM,
      paddingLeft: canvasMargin,
      paddingRight: canvasMargin,
    }}>
      {/* 🎯 优化：画布移至左侧，提升用户体验连贯性 */}
      <div
        ref={containerRef}
        style={{
          width: canvasSizeValue,
          height: canvasSizeValue,
          marginRight: 5, // 画布和面板间距设为5px
          marginTop: 0,   // 移除顶部边距，避免重复间距
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 24,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 智能提示区域 - 使用统一覆盖元素样式 */}
        <div className="overlay-element smart-hints-overlay top-2">
          <MobileSmartHints />
        </div>
        <PuzzleCanvas />
      </div>
      {/* 🎯 优化：控制面板移至右侧，符合移动端交互习惯 */}
      <div
        id="panel-container"
        style={{
          width: panelWidth, // 使用计算出的面板宽度
          minWidth: panelWidth, // 最小宽度
          maxWidth: panelWidth, // 最大宽度
          height: canvasSizeValue,
          display: 'flex',
          alignItems: 'flex-start',
          marginTop: 0,   // 移除顶部边距，避免重复间距
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
          style={{ height: '100%', width: '100%' }}
          isLandscape={true}
        />
      </div>
    </div>
  );
};

export default PhoneLandscapeLayout;