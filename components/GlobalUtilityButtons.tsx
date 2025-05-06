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
  const iconSizeClass = buttonSize === 'small' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonClass = `rounded-full ${buttonSize === 'small' ? 'w-6 h-6' : 'w-8 h-8'} text-[#FFB17A] hover:text-[#F26419] hover:bg-[#463E50] transition-colors`;

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={onToggleMusic}
        variant="ghost"
        size="icon"
        className={buttonClass}
        aria-label={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
        title={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
      >
        {isMusicPlaying ? (
          <Volume2 className={iconSizeClass} />
        ) : (
          <VolumeX className={iconSizeClass} />
        )}
      </Button>
      <Button
        onClick={onToggleFullscreen}
        variant="ghost"
        size="icon"
        className={buttonClass}
        aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
        title={isFullscreen ? "退出全屏" : "进入全屏"}
      >
        {isFullscreen ? (
          <Minimize className={iconSizeClass} />
        ) : (
          <Maximize className={iconSizeClass} />
        )}
      </Button>
    </div>
  );
};

export default GlobalUtilityButtons; 