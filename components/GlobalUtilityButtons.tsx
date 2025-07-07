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
          <Volume2 className={iconSizeClass} width={24} height={24} strokeWidth={2} />
        ) : (
          <VolumeX className={iconSizeClass} width={24} height={24} strokeWidth={2} />
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
          <Minimize className={iconSizeClass} width={24} height={24} strokeWidth={2} />
        ) : (
          <Maximize className={iconSizeClass} width={24} height={24} strokeWidth={2} />
        )}
      </Button>
    </div>
  );
};

export default GlobalUtilityButtons; 