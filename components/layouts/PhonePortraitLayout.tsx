"use client";

import React, { useRef } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";
import { MOBILE_ADAPTATION } from '@/constants/canvasAdaptation';
import { useCanvas, useDevice } from '@/providers/hooks';

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
  const canvasWidth = canvasSize?.width || 320;
  const canvasHeight = canvasSize?.height || 320;
  const canvasMargin = MOBILE_ADAPTATION.PORTRAIT.CANVAS_MARGIN;

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