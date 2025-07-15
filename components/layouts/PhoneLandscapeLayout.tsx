"use client";

import React, { useMemo } from 'react';
import PuzzleCanvas from "@/components/PuzzleCanvas";
import PhoneTabPanel from "./PhoneTabPanel";

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

const PANEL_MARGIN = 10;
const BOTTOM_SAFE_MARGIN = 20;
const MIN_PANEL_WIDTH = 220;
const MAX_PANEL_WIDTH = 600;

const getCanvasSize = () => {
  if (typeof window === 'undefined') return 375;
  const h = window.innerHeight - PANEL_MARGIN * 2 - BOTTOM_SAFE_MARGIN;
  const w = window.innerWidth - MIN_PANEL_WIDTH - PANEL_MARGIN * 2;
  return Math.max(220, Math.min(h, w));
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
  const canvasSize = useMemo(() => getCanvasSize(), []);
  const panelWidth = canvasSize;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', paddingBottom: BOTTOM_SAFE_MARGIN }}>
      {/* 左侧tab面板 */}
      <div style={{ width: panelWidth, minWidth: MIN_PANEL_WIDTH, maxWidth: MAX_PANEL_WIDTH, height: canvasSize, display: 'flex', alignItems: 'flex-start', marginBottom: BOTTOM_SAFE_MARGIN }}>
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
          marginLeft: 16,
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