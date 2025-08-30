"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Maximize, Minimize, Trophy } from "lucide-react";
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/contexts/I18nContext';
import { playButtonClickSound } from "@/utils/rendering/soundEffects";

interface GlobalUtilityButtonsProps {
  isMusicPlaying: boolean;
  isFullscreen: boolean;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  onToggleLeaderboard?: () => void;
  isLeaderboardOpen?: boolean;
  buttonSize?: 'small' | 'default'; // For phone landscape variation
}

const GlobalUtilityButtons: React.FC<GlobalUtilityButtonsProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  onToggleLeaderboard,
  isLeaderboardOpen = false,
  buttonSize = 'default',
}) => {
  const { t } = useTranslation();
  const buttonClass = `rounded-full ${buttonSize === 'small' ? 'w-6 h-6' : 'w-8 h-8'} border-none shadow-none cursor-pointer utility-button-fixed`;
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
    backgroundColor: '#1E1A2A',
    boxShadow: 'none',
    border: 'none',
    color: '#F68E5F',
    opacity: 1,
    transition: 'none',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  } as React.CSSProperties;

  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <LanguageSwitcher
        variant="iconOnly"
        size={buttonSize === 'small' ? 'small' : 'default'}
      />
      {onToggleLeaderboard && (
        <Button
          onClick={() => {
            playButtonClickSound();
            onToggleLeaderboard();
          }}
          variant="ghost"
          size="icon"
          className={buttonClass}
          style={{
            ...buttonStyle,
            backgroundColor: isLeaderboardOpen ? '#F68E5F' : '#1E1A2A',
            color: isLeaderboardOpen ? 'white' : '#F68E5F',
          }}
          data-testid="toggle-leaderboard-button"
          aria-label={isLeaderboardOpen ? t('game.leaderboard.close') : t('game.leaderboard.show')}
          title={isLeaderboardOpen ? t('game.leaderboard.close') : t('game.leaderboard.show')}
        >
          <Trophy width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        </Button>
      )}
      <Button
        onClick={() => {
          playButtonClickSound();
          onToggleMusic();
        }}
        variant="ghost"
        size="icon"
        className={buttonClass}
        style={buttonStyle}
        data-testid="toggle-music-button"
        aria-label={isMusicPlaying ? t('game.audio.toggleOff') : t('game.audio.toggleOn')}
        title={isMusicPlaying ? t('game.audio.toggleOff') : t('game.audio.toggleOn')}
      >
        {isMusicPlaying ? (
          <Volume2 width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        ) : (
          <VolumeX width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        )}
      </Button>
      <Button
        onClick={() => {
          playButtonClickSound();
          onToggleFullscreen();
        }}
        variant="ghost"
        size="icon"
        className={buttonClass}
        style={buttonStyle}
        data-testid="toggle-fullscreen-button"
        aria-label={isFullscreen ? t('game.fullscreen.exit') : t('game.fullscreen.enter')}
        title={isFullscreen ? t('game.fullscreen.exit') : t('game.fullscreen.enter')}
      >
        {isFullscreen ? (
          <Minimize width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        ) : (
          <Maximize width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        )}
      </Button>
    </div>
  );
};

export default GlobalUtilityButtons; 