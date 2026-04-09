'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VirtualAuthService, PlayerProfile } from '@/utils/cloud/VirtualAuthService';
import { User, ShieldCheck, Cloud, AlertCircle, Loader2 } from 'lucide-react';
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

  // Use fixed font size matching "Select Shape Type" (text-md or text-sm)
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
        {/* Compact Avatar with Subtle Glow */}
        <div className={cn(
          "flex-shrink-0 rounded-md flex items-center justify-center transition-all duration-300",
          user 
            ? "text-[#FFD5AB] bg-[#F68E5F]/20" 
            : "text-white/20 bg-white/5"
        )}
        style={{ width: iconSize * 1.3, height: iconSize * 1.3 }}
        >
          {loading ? (
            <Loader2 className="animate-spin" style={{ width: iconSize * 0.8, height: iconSize * 0.8 }} />
          ) : (
            <User style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} />
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
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-bold transition-all uppercase tracking-wider",
          user
            ? "glass-btn-active text-white shadow-lg"
            : "glass-btn-active text-white shadow-lg"
        )}
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
