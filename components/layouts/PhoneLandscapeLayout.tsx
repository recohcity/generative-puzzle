"use client";

import React, { useState, useEffect } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import { MOBILE_ADAPTATION, calculateMobileLandscapeCanvasSize } from '@/constants/canvasAdaptation';

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

const getCanvasSize = () => {
  if (typeof window === 'undefined') return { canvasSize: 375, panelWidth: 375, canvasMargin: MOBILE_ADAPTATION.LANDSCAPE.CANVAS_MARGIN };
  
  const { canvasSize, panelWidth, canvasMargin } = calculateMobileLandscapeCanvasSize(
    window.innerWidth, 
    window.innerHeight
  );
  
  return { canvasSize, panelWidth, canvasMargin };
};

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
  // 响应式画布尺寸，类似竖屏布局
  const [canvasData, setCanvasData] = useState(() => getCanvasSize());
  useEffect(() => {
    const handleResize = () => setCanvasData(getCanvasSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { canvasSize, panelWidth, canvasMargin } = canvasData;

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
      {/* 左侧tab面板 - 宽度与画布一致 */}
      <div
        id="panel-container"
        style={{ 
          width: canvasSize, // 面板宽度与画布宽度一致
          minWidth: canvasSize, // 最小宽度也设为画布宽度
          maxWidth: canvasSize, // 最大宽度也设为画布宽度
          height: canvasSize, 
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
        style={{
          width: canvasSize,
          height: canvasSize,
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