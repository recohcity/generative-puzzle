"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

interface GlobalUtilityButtonsProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  buttonSize?: 'small' | 'default'; // For phone landscape variation
}

const GlobalUtilityButtons: React.FC<GlobalUtilityButtonsProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  buttonSize = 'default',
}) => {
  const iconSizeClass = '!w-6 !h-6 shrink-0';
  const buttonClass = `rounded-full ${buttonSize === 'small' ? 'w-6 h-6' : 'w-8 h-8'} text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors bg-[#3D3852] shadow-md border border-white/30`;
  const iconSize = 12;
  const buttonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    minWidth: '32px',
    minHeight: '32px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // background, boxShadow, border 由 class 控制
  };

  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <Button
        onClick={onToggleMusic}
        
        variant="ghost"
        size="icon"
        className={buttonClass}
        style={buttonStyle}
        aria-label={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
        title={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
      >
        {isMusicPlaying ? (
          <Volume2 width={iconSize} height={iconSize} strokeWidth={2} />
        ) : (
          <VolumeX width={iconSize} height={iconSize} strokeWidth={2} />
        )}
      </Button>
      <Button
        onClick={onToggleFullscreen}
        variant="ghost"
        size="icon"
        className={buttonClass}
        style={buttonStyle}
        aria-label={isFullscreen ? "退出全屏" : "全屏"}
        title={isFullscreen ? "退出全屏" : "全屏"}
      >
        {isFullscreen ? (
          <Minimize width={iconSize} height={iconSize} strokeWidth={2} />
        ) : (
          <Maximize width={iconSize} height={iconSize} strokeWidth={2} />
        )}
      </Button>
    </div>
  );
};

export default GlobalUtilityButtons; 