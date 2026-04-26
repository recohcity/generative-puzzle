"use client";

import React from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
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
  // 用户状态按钮
  onToggleUser?: () => void;
  isLoggedIn?: boolean;
  isUserPanelOpen?: boolean;
}

const GlobalUtilityButtons: React.FC<GlobalUtilityButtonsProps> = ({
  isMusicPlaying,
  isFullscreen,
  onToggleMusic,
  onToggleFullscreen,
  onToggleLeaderboard,
  isLeaderboardOpen = false,
  onToggleUser,
  isLoggedIn = false,
  isUserPanelOpen = false,
}) => {
  const { t } = useTranslation();
  const buttonClass = `rounded-full border-none shadow-none cursor-pointer utility-button-fixed`;
  const iconSize = 12;
  const buttonStyle = {
    width: 'calc(var(--panel-scale, 1) * 26px)',
    height: 'calc(var(--panel-scale, 1) * 26px)',
    borderRadius: 'calc(var(--panel-scale, 1) * 16px)',
    minWidth: 'calc(var(--panel-scale, 1) * 26px)',
    minHeight: 'calc(var(--panel-scale, 1) * 26px)',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    border: 'none',
    transition: 'all 0.3s ease',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  } as React.CSSProperties;

  return (
    <div className="flex items-center" style={{ gap: '4px' }}>
      {/* 用户状态按钮：灰=游客，金=已登录 */}
      {onToggleUser && (
        <button
          onClick={() => {
            playButtonClickSound();
            onToggleUser();
          }}
          className={cn(buttonClass, isUserPanelOpen ? "glass-btn-active" : "glass-btn-inactive")}
          style={{
            ...buttonStyle,
            backgroundColor: isUserPanelOpen ? undefined : 'rgba(255, 255, 255, 0.05)',
            color: isUserPanelOpen
              ? 'var(--brand-dark)'
              : isLoggedIn
                ? 'var(--brand-amber)'
                : 'rgba(255,255,255,0.35)',
          }}
          data-testid="toggle-user-button"
          aria-label={isLoggedIn ? t('auth.userPanel') || '用户' : t('auth.login') || '登录'}
          title={isLoggedIn ? t('auth.userPanel') || '用户' : t('auth.login') || '登录'}
        >
          <User width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        </button>
      )}
      <LanguageSwitcher
        variant="iconOnly"
      />
      {onToggleLeaderboard && (
        <button
          onClick={() => {
            playButtonClickSound();
            onToggleLeaderboard();
          }}
          className={cn(buttonClass, isLeaderboardOpen ? "glass-btn-active" : "glass-btn-inactive")}
          style={{
            ...buttonStyle,
            backgroundColor: isLeaderboardOpen ? undefined : 'rgba(255, 255, 255, 0.05)',
            color: isLeaderboardOpen ? 'var(--brand-dark)' : 'var(--brand-amber)',
          }}
          data-testid="toggle-leaderboard-button"
          aria-label={isLeaderboardOpen ? t('game.leaderboard.close') : t('game.leaderboard.show')}
          title={isLeaderboardOpen ? t('game.leaderboard.close') : t('game.leaderboard.show')}
        >
          <Trophy width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        </button>
      )}
      <button
        onClick={() => {
          playButtonClickSound();
          onToggleMusic();
        }}
        className={cn(buttonClass, "glass-btn-inactive")}
        style={{
          ...buttonStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--brand-amber)',
        }}
        data-testid="toggle-music-button"
        aria-label={isMusicPlaying ? t('game.audio.toggleOff') : t('game.audio.toggleOn')}
        title={isMusicPlaying ? t('game.audio.toggleOff') : t('game.audio.toggleOn')}
      >
        {isMusicPlaying ? (
          <Volume2 width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        ) : (
          <VolumeX width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        )}
      </button>
      <button
        onClick={() => {
          playButtonClickSound();
          onToggleFullscreen();
        }}
        className={cn(buttonClass, "glass-btn-inactive")}
        style={{
          ...buttonStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--brand-amber)',
        }}
        data-testid="toggle-fullscreen-button"
        aria-label={isFullscreen ? t('game.fullscreen.exit') : t('game.fullscreen.enter')}
        title={isFullscreen ? t('game.fullscreen.exit') : t('game.fullscreen.enter')}
      >
        {isFullscreen ? (
          <Minimize width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        ) : (
          <Maximize width={iconSize} height={iconSize} strokeWidth={2} style={{ pointerEvents: 'none' }} />
        )}
      </button>
    </div>
  );
};

export default GlobalUtilityButtons; 