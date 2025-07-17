"use client";

import React, { useMemo, useState, useEffect } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import { MOBILE_ADAPTATION, calculateMobilePortraitCanvasSize } from '@/constants/canvasAdaptation';

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

const getCanvasSize = () => {
  if (typeof window === 'undefined') return { canvasSize: 320, canvasMargin: MOBILE_ADAPTATION.PORTRAIT.CANVAS_MARGIN };
  
  // 使用新的固定面板高度
  const panelHeight = MOBILE_ADAPTATION.PORTRAIT.PANEL_HEIGHT;
  const { canvasSize, canvasMargin } = calculateMobilePortraitCanvasSize(
    window.innerWidth, 
    window.innerHeight, 
    panelHeight
  );
  
  return { canvasSize, canvasMargin };
};

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
  // 响应式画布尺寸
  const [canvasData, setCanvasData] = useState(() => getCanvasSize());
  useEffect(() => {
    const handleResize = () => setCanvasData(getCanvasSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { canvasSize, canvasMargin } = canvasData;
  const canvasWidth = canvasSize;
  const canvasHeight = canvasSize; // 保证正方形

  return (
    <div 
      className="flex flex-col items-center min-h-screen w-full" 
      style={{ 
        background: 'none',
        paddingTop: MOBILE_ADAPTATION.PORTRAIT.SAFE_AREA_TOP,
        paddingBottom: MOBILE_ADAPTATION.PORTRAIT.SAFE_AREA_BOTTOM,
      }}
    >
      {/* 画布区域 */}
      <div
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
        <PuzzleCanvas />
      </div>
      {/* 底部tab面板 */}
      <div
        id="panel-container"
        className="order-2 flex flex-col items-center gap-4 pt-2 pb-4 w-full"
        style={{ 
          width: canvasWidth,
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
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default PhonePortraitLayout; 