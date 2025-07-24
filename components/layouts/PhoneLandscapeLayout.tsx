"use client";

import React, { useRef } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import { MOBILE_ADAPTATION, calculateMobileLandscapeCanvasSize } from '@/constants/canvasAdaptation';
import { useCanvas, useDevice } from '@/providers/hooks';

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
  const device = useDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 直接使用适配常量计算画布尺寸，不依赖useCanvas
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
  
  console.log('📱 横屏画布尺寸计算:', {
    screenSize: `${device.screenWidth}x${device.screenHeight}`,
    canvasSize: canvasSizeValue,
    originalPanelWidth: landscapeResult.panelWidth,
    idealPanelWidth,
    actualPanelWidth: panelWidth,
    totalRequiredWidth,
    availableWidth,
    hasEnoughSpace,
    strategy: hasEnoughSpace ? '使用理想宽度(与画布一致)' : '使用原始计算宽度',
    debug: landscapeResult.debug
  });
  
  // 仍然需要useCanvas来管理canvas元素
  const canvasSize = useCanvas({ 
    containerRef, 
    canvasRef, 
    backgroundCanvasRef 
  });


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
      {/* 左侧tab面板 - 使用计算出的面板宽度 */}
      <div
        id="panel-container"
        style={{ 
          width: panelWidth, // 使用计算出的面板宽度
          minWidth: panelWidth, // 最小宽度
          maxWidth: panelWidth, // 最大宽度
          height: canvasSizeValue, 
          display: 'flex', 
          alignItems: 'flex-start',
          marginTop: canvasMargin,
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
      {/* 右侧画布区域 */}
      <div
        ref={containerRef}
        style={{
          width: canvasSizeValue,
          height: canvasSizeValue,
          marginLeft: canvasMargin,
          marginTop: canvasMargin,
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
        <PuzzleCanvas />
      </div>
    </div>
  );
};

export default PhoneLandscapeLayout; 