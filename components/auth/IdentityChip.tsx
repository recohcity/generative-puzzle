'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VirtualAuthService, PlayerProfile } from '@/utils/cloud/VirtualAuthService';
import { User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/I18nContext';

interface IdentityChipProps {
  onClick?: () => void;
  onClose?: () => void;
  isPanelOpen?: boolean;
  className?: string;
  panelScale?: number;
}

export default function IdentityChip({ onClick, onClose, isPanelOpen, className, panelScale = 1 }: IdentityChipProps) {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Omit<PlayerProfile, 'virtual_email'> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      VirtualAuthService.getCurrentProfile()
        .then(p => setProfile(p))
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
  }, [user]);

  const mainFontSize = "14px"; 
  const iconSize = 18;

  if (authLoading) {
    return (
      <div className={cn("w-full h-8 animate-pulse bg-white/5 rounded-lg", className)} />
    );
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('auth.logoutConfirm') || 'Confirm Logout?')) {
      await signOut();
    }
  };

  const handleLoginAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPanelOpen && onClose) {
      onClose();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className={cn("w-full flex items-center justify-between py-1 px-0.5", className)}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Removed background color block from the icon left of the username */}
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center transition-all duration-300",
          user ? "text-[#FFD5AB]" : "text-white/40"
        )}
        style={{ width: iconSize, height: iconSize }}
        >
          {loading ? (
            <Loader2 className="animate-spin" style={{ width: iconSize * 0.8, height: iconSize * 0.8 }} />
          ) : (
            <User style={{ width: iconSize, height: iconSize }} strokeWidth={2} />
          )}
        </div>
        
        <div className="flex items-center gap-2 min-w-0">
          <span 
            className="text-premium-title truncate font-bold opacity-90"
            style={{ fontSize: mainFontSize }}
          >
            {user ? (profile?.nickname || t('auth.loading')) : t('auth.guest')}
          </span>
          
          {user && (
             <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
          )}
        </div>
      </div>

      <button
        onClick={user ? handleLogout : handleLoginAction}
        className="px-3 py-1 rounded-full text-[11px] font-bold transition-all uppercase tracking-wider glass-btn-active text-white shadow-lg"
      >
        {user 
          ? (t('auth.logout') || 'Logout') 
          : isPanelOpen 
            ? (t('common.close') || 'Close') 
            : (t('auth.login') || 'Login')
        }
      </button>
    </div>
  );
}
