"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/contexts/I18nContext';

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
  const { t } = useTranslation();
  const iconSizeClass = '!w-6 !h-6 shrink-0';
  const buttonClass = `rounded-full ${buttonSize === 'small' ? 'w-6 h-6' : 'w-8 h-8'} text-[#F68E5F] bg-[#1E1A2A] hover:bg-[#141022] active:bg-[#2A283E] transition-colors border-none shadow-none`;
  const iconSize = 12;
  const buttonStyle = {
    width: '26px',
    height: '26px',
    borderRadius: '16px',
    minWidth: '26px',
    minHeight: '26px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1E1A2A',
    boxShadow: 'none',
    border: 'none',
    color: '#F68E5F',
    opacity: 1,
  };

  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <LanguageSwitcher 
        variant="iconOnly" 
        size={buttonSize === 'small' ? 'small' : 'default'} 
      />
      <Button
        onClick={onToggleMusic}
        variant="ghost"
        size="icon"
        className={buttonClass}
        style={buttonStyle}
        data-testid="toggle-music-button"
        aria-label={isMusicPlaying ? t('game.audio.toggleOff') : t('game.audio.toggleOn')}
        title={isMusicPlaying ? t('game.audio.toggleOff') : t('game.audio.toggleOn')}
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
        data-testid="toggle-fullscreen-button"
        aria-label={isFullscreen ? t('game.fullscreen.exit') : t('game.fullscreen.enter')}
        title={isFullscreen ? t('game.fullscreen.exit') : t('game.fullscreen.enter')}
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