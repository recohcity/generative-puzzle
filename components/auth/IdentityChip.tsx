'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VirtualAuthService, PlayerProfile } from '@/utils/cloud/VirtualAuthService';
import { User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/I18nContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (authLoading) {
    return (
      <div className={cn("w-full h-8 animate-pulse bg-white/5 rounded-lg", className)} />
    );
  }

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLogoutDialog(true);
  };

  const executeLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
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
          user ? "text-brand-peach" : "text-white/40"
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
            className="text-premium-title truncate font-medium opacity-90"
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
        onClick={user ? handleLogoutClick : handleLoginAction}
        className="px-3 py-1 rounded-full text-[11px] font-bold transition-all uppercase tracking-wider glass-btn-active text-white shadow-lg"
      >
        {user 
          ? (t('auth.logout') || 'Logout') 
          : isPanelOpen 
            ? (t('common.close') || 'Close') 
            : (t('auth.login') || 'Login')
        }
      </button>

      {/* Modern non-blocking logout confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#1A1825]/95 border-white/10 backdrop-blur-xl text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-peach">{t('auth.logoutConfirm') || 'Confirm Logout?'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {t('common.cancel') ? '确定要退出当前账号吗？这不会删除您的记录。' : 'Are you sure you want to log out? Your records are safely saved.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white transition-all">
              {t('common.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeLogout}
              className="bg-brand-orange hover:bg-brand-peach text-white transition-all shadow-[0_0_15px_rgba(255,107,0,0.3)]"
            >
              {t('common.confirm') || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
