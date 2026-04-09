import React, { useState, useEffect } from "react";
import { VirtualAuthService, PlayerProfile } from "@/utils/cloud/VirtualAuthService";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CloudGameRepository } from "@/utils/cloud/CloudGameRepository";
import { ShieldCheck, User, Key, RotateCw, LogOut, ChevronRight, AlertCircle, Info } from "lucide-react";
import { useTranslation } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

type AuthMode = "register" | "recover" | "collision_select" | "authenticated";

export default function VirtualAuthWidget({ onAuthSuccess, isLandscape }: { onAuthSuccess?: () => void, isLandscape?: boolean }) {
  const { user, signOut: nativeSignOut } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("register");
  
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [collisionList, setCollisionList] = useState<PlayerProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Omit<PlayerProfile, 'virtual_email'> | null>(null);

  // Check initial authenticated state
  useEffect(() => {
    if (user) {
      setMode("authenticated");
      VirtualAuthService.getCurrentProfile().then(profile => {
        if (profile) setCurrentProfile(profile);
      });
    } else {
      setMode("register");
      setCurrentProfile(null);
    }
  }, [user]);

  const validateInput = () => {
    setError(null);
    if (nickname.trim().length < 2 || nickname.trim().length > 8) {
      setError(t('auth.error.nicknameLength'));
      return false;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError(t('auth.error.pinFormat'));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateInput()) return;
    setLoading(true);
    
    const { data: existing, error: lookupError } = await VirtualAuthService.lookupAccounts(nickname.trim(), pin);
    if (lookupError) {
      setError(t('auth.error.lookupFail', { error: lookupError }));
      setLoading(false);
      return;
    }

    if (existing && existing.length > 0) {
      setError(t('auth.error.exists', { nickname }));
      setLoading(false);
      return;
    }

    const { success, error: authError } = await VirtualAuthService.register(nickname.trim(), pin);
    setLoading(false);

    if (!success) {
      setError(authError || t('auth.error.fail'));
    } else {
      handleSuccess();
    }
  };

  const handleRecover = async () => {
    if (!validateInput()) return;
    setLoading(true);

    const { data: accounts, error: lookupError } = await VirtualAuthService.lookupAccounts(nickname.trim(), pin);
    setLoading(false);

    if (lookupError) {
      setError(t('auth.error.recoverFail', { error: lookupError }));
    } else if (!accounts || accounts.length === 0) {
      setError(t('auth.error.notFound'));
    } else if (accounts.length === 1) {
      await executeLogin(accounts[0].virtual_email);
    } else {
      setCollisionList(accounts);
      setMode("collision_select");
    }
  };

  const executeLogin = async (virtualEmail: string) => {
    setLoading(true);
    setError(null);
    const { success, error: loginError } = await VirtualAuthService.loginWithVirtualEmail(virtualEmail, pin);
    setLoading(false);

    if (!success) {
      setError(loginError || t('auth.error.loginError'));
    } else {
      handleSuccess();
    }
  };

  const handleSuccess = async () => {
    try {
      await CloudGameRepository.syncOfflineSessions();
    } catch (e) {
      console.warn("[VirtualAuthWidget] 同步离线成绩失败:", e);
    }
    
    if (onAuthSuccess) {
      // 强制重置视口缩放，防止输入法弹出导致的残留缩放
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        // 先临时禁用缩放并重置，然后再恢复允许缩放以平衡无障碍需求
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        setTimeout(() => {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
        }, 300);
      }
      onAuthSuccess();
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await nativeSignOut();
    setNickname("");
    setPin("");
    setMode("register");
    setLoading(false);
  };

  // 渲染不同区块
  if (mode === "authenticated") {
    return (
      <div className={cn(
        "relative overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95 w-full h-full flex flex-col justify-center",
        isLandscape ? "p-4" : "p-2"
      )}>
        <div className={cn(
          "flex items-center justify-between relative z-10 w-full",
          isLandscape ? "flex-row gap-8" : "flex-col gap-4"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isLandscape ? "flex-1 min-w-0" : "w-full"
          )}>
            <div className="w-10 h-10 rounded-full bg-[#F68E5F]/20 flex items-center justify-center shadow-lg shadow-[#F68E5F]/10 flex-shrink-0">
              <User className="text-[#FFD5AB] w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-md font-bold text-[#FFB17A] truncate tracking-tight">{currentProfile?.nickname || t('auth.loading')}</h3>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
              </div>
              <p className="text-[10px] text-white/30 font-mono truncate">
                {t('auth.status.sessionId')}: {(user?.id || "").slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-2",
            isLandscape ? "flex-shrink-0" : "w-full"
          )}>
            <Button 
                onClick={() => onAuthSuccess?.()} 
                variant="ghost" 
                size="sm"
                className={cn(
                  "h-9 text-xs text-white/50 hover:text-white hover:bg-white/5 border border-white/5 rounded-lg",
                  isLandscape ? "px-6" : "flex-1"
                )}
            >
              {t('auth.status.sync')}
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSignOut} 
              disabled={loading}
              className={cn(
                "h-9 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold gap-1.5 rounded-lg",
                isLandscape ? "px-6" : "flex-1"
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
              {loading ? t('auth.status.processing') : t('auth.status.exit')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "collision_select") {
    if (isLandscape) {
      return (
        <div className="w-full h-full flex flex-row gap-6 p-4 animate-in fade-in duration-500">
           {/* Left side: Info */}
           <div className="w-[35%] flex flex-col justify-center border-r border-white/5 pr-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFD5AB]/10 flex items-center justify-center border border-[#FFD5AB]/20">
                  <Info className="text-[#FFD5AB] w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#FFB17A]">{t('auth.collision.title')}</h2>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed text-[#FFD5AB]/80">
                {t('auth.collision.hint')}
              </p>
           </div>
           
           {/* Right side: List */}
           <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-1 small-scrollbar space-y-2 mb-3">
                {collisionList.map((acc) => (
                  <button 
                    key={acc.id} 
                    onClick={() => executeLogin(acc.virtual_email)}
                    className="w-full text-left bg-black/30 hover:bg-black/50 p-2.5 rounded-xl border border-black/20 hover:border-[#FFD5AB]/30 transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0">
                        <div className="font-bold text-xs group-hover:text-[#FFD5AB] transition-colors truncate">{acc.nickname}</div>
                        <div className="flex gap-2 text-[9px] opacity-40 mt-0.5">
                          <span>🏆 {acc.best_score}</span>
                          <span>🔥 {acc.challenge_count}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
              <Button variant={"secondary"} onClick={() => setMode("recover")} disabled={loading} className="w-full h-9 text-xs bg-black/20 hover:bg-black/40 text-[#FFD5AB] border border-black/20 rounded-xl flex-shrink-0">
                {t('auth.collision.back')}
              </Button>
           </div>
        </div>
      );
    }

    return (
      <div className="w-full animate-in slide-in-from-bottom-4 duration-500 p-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFD5AB]/10 flex items-center justify-center border border-[#FFD5AB]/20">
            <Info className="text-[#FFD5AB] w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-md font-bold text-[#FFB17A] truncate">{t('auth.collision.title')}</h2>
            <p className="text-[10px] opacity-40 text-[#FFD5AB] truncate">{t('auth.collision.description')}</p>
          </div>
        </div>
        
        <p className="text-[11px] opacity-70 mb-4 leading-relaxed text-[#FFD5AB]/80">
          {t('auth.collision.hint')}
        </p>

        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1 small-scrollbar">
          {collisionList.map((acc) => (
            <button 
              key={acc.id} 
              onClick={() => executeLogin(acc.virtual_email)}
              className="w-full text-left bg-black/30 hover:bg-black/50 p-3 rounded-xl border border-black/20 hover:border-[#FFD5AB]/30 transition-all group"
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-bold text-sm group-hover:text-[#FFD5AB] transition-colors truncate">{acc.nickname}</div>
                  <div className="flex gap-2 text-[10px] opacity-40 mt-0.5">
                    <span>🏆 {acc.best_score}</span>
                    <span>🔥 {acc.challenge_count}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>

        <Button variant={"secondary"} onClick={() => setMode("recover")} disabled={loading} className="w-full h-10 text-xs bg-black/20 hover:bg-black/40 text-[#FFD5AB] border border-black/20 rounded-xl">
          {t('auth.collision.back')}
        </Button>
      </div>
    );
  }

  if (isLandscape) {
    return (
      <div className="relative text-white w-full h-full flex flex-row gap-0 py-2 items-center">
        {/* Left column: Branding & Title (Fixed Width) */}
        <div className="flex flex-col items-center justify-center text-center border-r border-white/5 px-8 whitespace-nowrap shrink-0 w-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFD5AB] to-[#F68E5F] flex items-center justify-center shadow-xl shadow-[#F68E5F]/20 relative mb-4">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
              {mode === 'register' ? <User className="w-8 h-8 text-[#2A2A2A] relative" /> : <RotateCw className="w-8 h-8 text-[#2A2A2A] relative" />}
          </div>
          <h2 className="text-xl font-black mb-1.5 text-[#FFB17A] tracking-tight uppercase whitespace-nowrap">
            {mode === 'register' ? t('auth.modes.register.title') : t('auth.modes.recover.title')}
          </h2>
          <p className="text-[10px] text-[#FFD5AB]/30 leading-tight font-medium whitespace-nowrap">
            {mode === 'register' 
              ? t('auth.modes.register.hint').split('，')[0]
              : t('auth.modes.recover.hint').split('？')[0]}
          </p>
        </div>

        {/* Right column: Form (Fixed Width via Flex-1) */}
        <div className="flex-1 flex flex-col justify-center gap-2.5 min-w-0 px-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-2 rounded-xl text-[10px] flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0 text-red-500" />
              <span className="truncate">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                <User className="w-2.5 h-2.5" /> {t('auth.inputs.nickname')}
            </label>
            <input
              type="text"
              placeholder={t('auth.inputs.nicknamePlaceholder')}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[#FFD5AB] text-base placeholder-[#FFD5AB]/30 focus:outline-none focus:ring-1 focus:ring-[#FFB17A]/40 transition-all font-medium"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                <Key className="w-2.5 h-2.5" /> {t('auth.inputs.pin')}
            </label>
            <input
              type="password"
              placeholder={t('auth.inputs.pinPlaceholder')}
              maxLength={4}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[#FFD5AB] text-base placeholder-[#FFD5AB]/30 focus:outline-none focus:ring-1 focus:ring-[#FFB17A]/40 transition-all text-center font-mono tracking-[0.3em]"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
            />
          </div>

          <div className="mt-1 flex flex-col gap-2">
            <button
                onClick={mode === 'register' ? handleRegister : handleRecover}
                disabled={loading}
                className="w-full box-border font-bold bg-gradient-to-r from-[#FFD5AB] to-[#F68E5F] text-[#2A2A2A] rounded-xl h-10 text-xs shadow-lg shadow-[#F68E5F]/20 active:opacity-80 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('auth.status.processing')}</span>
                </div>
              ) : (
                <span>{mode === 'register' ? t('auth.modes.register.button') : t('auth.modes.recover.button')}</span>
              )}
            </button>

            <button 
                onClick={() => { setError(null); setMode(mode === "register" ? "recover" : "register"); }}
                className="w-full box-border bg-white/5 hover:bg-white/10 text-[#FFD5AB] border border-white/15 rounded-xl h-9 text-[10px] font-bold transition-all"
            >
              {mode === "register" ? t('auth.modes.recover.button') : t('auth.modes.recover.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative text-white w-full transition-all duration-500 p-1 h-full flex flex-col">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFD5AB] to-[#F68E5F] flex items-center justify-center shadow-xl shadow-[#F68E5F]/20 relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                {mode === 'register' ? <User className="w-6 h-6 text-[#2A2A2A] relative" /> : <RotateCw className="w-6 h-6 text-[#2A2A2A] relative" />}
            </div>
        </div>

        <h2 className="text-sm font-bold mb-2 text-center text-[#FFB17A] tracking-tight uppercase">
          {mode === 'register' ? t('auth.modes.register.title') : t('auth.modes.recover.title')}
        </h2>

        {error && (
          <div className="mb-2 bg-red-500/10 border border-red-500/20 text-red-200 p-2 rounded-xl text-[10px] flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="space-y-0.5">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                <User className="w-2 h-2" /> {t('auth.inputs.nickname')}
            </label>
            <input
              type="text"
              placeholder={t('auth.inputs.nicknamePlaceholder')}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-[#FFD5AB] text-base placeholder-[#FFD5AB]/30 focus:outline-none focus:ring-1 focus:ring-[#FFB17A]/40 focus:border-[#FFB17A]/60 transition-all outline-none"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-0.5 pb-0.5">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                <Key className="w-2 h-2" /> {t('auth.inputs.pin')}
            </label>
            <input
              type="password"
              placeholder={t('auth.inputs.pinPlaceholder')}
              maxLength={4}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-[#FFD5AB] text-base placeholder-[#FFD5AB]/30 focus:outline-none focus:ring-1 focus:ring-[#FFB17A]/40 focus:border-[#FFB17A]/60 transition-all outline-none text-center font-mono tracking-[0.5em]"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <button
                onClick={mode === 'register' ? handleRegister : handleRecover}
                disabled={loading}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="w-full box-border font-bold bg-gradient-to-r from-[#FFD5AB] to-[#F68E5F] hover:from-[#FFE0C2] hover:to-[#FF9F7A] text-[#2A2A2A] rounded-2xl h-10 text-xs shadow-lg shadow-[#F68E5F]/20 active:opacity-80 transition-all disabled:opacity-50 cursor-pointer outline-none focus:outline-none select-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{mode === 'register' ? t('auth.modes.register.loading') : t('auth.modes.recover.loading')}</span>
                </div>
              ) : (
                <span>{mode === 'register' ? t('auth.modes.register.button') : t('auth.modes.recover.button')}</span>
              )}
            </button>

            <p className="text-[9px] text-[#FFD5AB]/30 text-center px-4 leading-tight font-medium">
              {mode === 'register' 
                ? t('auth.modes.register.hint')
                : t('auth.modes.recover.hint')}
            </p>
          </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 text-center">
          {mode === "register" ? (
            <div className="space-y-2">
               <button
                onClick={() => { setError(null); setMode("recover"); }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="w-full box-border bg-white/5 hover:bg-white/10 active:bg-white/[0.04] text-[#FFD5AB] hover:text-white border border-white/15 rounded-xl h-10 text-xs font-bold transition-all cursor-pointer outline-none focus:outline-none select-none"
              >
                {t('auth.modes.recover.button')}
              </button>
              <p className="text-[9px] text-white/20 uppercase tracking-[0.1em]">{t('auth.modes.recover.hint')}</p>
            </div>
          ) : (
            <button 
                onClick={() => { setError(null); setMode("register"); }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="w-full box-border bg-white/5 hover:bg-white/10 active:bg-white/[0.04] text-[#FFD5AB] hover:text-white border border-white/15 rounded-xl h-10 text-xs font-bold transition-all cursor-pointer outline-none focus:outline-none select-none"
            >
              {t('auth.modes.recover.back')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
