"use client";

import React, { useRef } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import { MOBILE_ADAPTATION } from '@/constants/canvasAdaptation';
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
  
  // 使用统一的画布管理系统
  const canvasSize = useCanvas({ 
    containerRef, 
    canvasRef, 
    backgroundCanvasRef 
  });
  
  // 使用统一画布管理系统的尺寸，如果没有则使用默认值
  const canvasSizeValue = canvasSize?.width || 375;
  const canvasMargin = MOBILE_ADAPTATION.LANDSCAPE.CANVAS_MARGIN;

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
          width: canvasSizeValue, // 面板宽度与画布宽度一致
          minWidth: canvasSizeValue, // 最小宽度也设为画布宽度
          maxWidth: canvasSizeValue, // 最大宽度也设为画布宽度
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