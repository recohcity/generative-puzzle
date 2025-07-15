"use client";

import React, { useMemo } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";

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

const getCanvasWidth = () => {
  if (typeof window === 'undefined') return 320;
  return Math.max(220, Math.min(window.innerWidth - 30, 500));
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
  const canvasWidth = useMemo(() => getCanvasWidth(), []);

  return (
    <div className="flex flex-col items-center min-h-screen w-full" style={{ background: 'none' }}>
      {/* 画布区域 */}
      <div
        className="order-1 bg-white/20 backdrop-blur-sm rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-white/30 overflow-hidden"
        style={{
          width: canvasWidth,
          height: canvasWidth,
          maxWidth: canvasWidth,
          maxHeight: canvasWidth,
          margin: '0 auto',
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
      <div className="order-2 flex flex-col items-center gap-4 pt-2 pb-4 w-full" style={{ marginBottom: 15, width: canvasWidth }}>
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