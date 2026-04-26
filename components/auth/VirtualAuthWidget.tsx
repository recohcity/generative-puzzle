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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'register') {
        handleRegister();
      } else if (mode === 'recover') {
        handleRecover();
      }
    }
  };

  if (mode === "authenticated") {
    if (isLandscape) {
      return (
        <div className="relative overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95 w-full h-full flex flex-col justify-center p-4">
          <div className="flex items-center justify-between relative z-10 w-full flex-row gap-8">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                <User className="w-6 h-6 text-brand-dark relative" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-md font-bold text-brand-amber truncate tracking-tight uppercase">{currentProfile?.nickname || t('auth.loading')}</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                </div>
                <p className="text-[10px] text-white/30 font-mono truncate">
                  {t('auth.loggedIn')} | {t('auth.status.sessionId')}: {(user?.id || "").slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                  onClick={() => onAuthSuccess?.()} 
                  variant="ghost" 
                  size="sm"
                  className="h-9 text-xs text-white/50 hover:text-white hover:bg-white/5 border border-white/5 rounded-lg px-6"
              >
                {t('auth.status.sync')}
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleSignOut} 
                disabled={loading}
                className="h-9 text-[14px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-normal gap-1.5 rounded-lg px-6"
              >
                <LogOut className="w-3.5 h-3.5" />
                {loading ? t('auth.status.processing') : t('auth.status.exit')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative text-white w-full transition-all duration-500 p-1 h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="flex justify-center mb-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                    <User className="w-6 h-6 text-brand-dark relative" />
                </div>
            </div>

            <h2 className="text-sm font-bold text-center text-brand-amber tracking-tight uppercase mb-1">
              {currentProfile?.nickname || t('auth.loading')}
            </h2>

            <div className="flex items-center justify-center gap-1.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
              <p className="text-[10px] text-white/40 font-medium">
                {t('auth.loggedIn')}
              </p>
            </div>

            <div className="space-y-2.5 px-1 mt-auto">
              <button
                  onClick={() => onAuthSuccess?.()} 
                  className="w-full h-11 rounded-xl font-normal text-[14px] transition-all bg-white/5 text-brand-peach/60 border border-white/10 hover:bg-white/10 flex items-center justify-center outline-none select-none"
              >
                {t('auth.status.sync')}
              </button>

              <button
                  onClick={handleSignOut} 
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-normal text-[14px] transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center gap-1.5 outline-none select-none"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loading ? t('auth.status.processing') : t('auth.status.exit')}
              </button>
            </div>
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
                <div className="w-8 h-8 rounded-lg bg-brand-peach/10 flex items-center justify-center border border-brand-peach/20">
                  <Info className="text-brand-peach w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-brand-amber">{t('auth.collision.title')}</h2>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed text-brand-peach/80">
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
                    className="w-full text-left bg-black/30 hover:bg-black/50 p-2.5 rounded-xl border border-black/20 hover:border-brand-peach/30 transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0">
                        <div className="font-bold text-xs group-hover:text-brand-peach transition-colors truncate">{acc.nickname}</div>
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
              <Button variant={"secondary"} onClick={() => setMode("recover")} disabled={loading} className="w-full h-9 text-xs bg-black/20 hover:bg-black/40 text-brand-peach border border-black/20 rounded-xl flex-shrink-0">
                {t('auth.collision.back')}
              </Button>
           </div>
        </div>
      );
    }

    return (
      <div className="w-full animate-in slide-in-from-bottom-4 duration-500 p-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-peach/10 flex items-center justify-center border border-brand-peach/20">
            <Info className="text-brand-peach w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-md font-bold text-brand-amber truncate">{t('auth.collision.title')}</h2>
            <p className="text-[10px] opacity-40 text-brand-peach truncate">{t('auth.collision.description')}</p>
          </div>
        </div>
        
        <p className="text-[11px] opacity-70 mb-4 leading-relaxed text-brand-peach/80">
          {t('auth.collision.hint')}
        </p>

        <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1 small-scrollbar">
          {collisionList.map((acc) => (
            <button 
              key={acc.id} 
              onClick={() => executeLogin(acc.virtual_email)}
              className="w-full text-left bg-black/30 hover:bg-black/50 p-3 rounded-xl border border-black/20 hover:border-brand-peach/30 transition-all group"
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-bold text-sm group-hover:text-brand-peach transition-colors truncate">{acc.nickname}</div>
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

        <Button variant={"secondary"} onClick={() => setMode("recover")} disabled={loading} className="w-full h-10 text-xs bg-black/20 hover:bg-black/40 text-brand-peach border border-black/20 rounded-xl">
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative mb-4">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
              {mode === 'register' ? <User className="w-8 h-8 text-brand-dark relative" /> : <RotateCw className="w-8 h-8 text-brand-dark relative" />}
          </div>
          <h2 className="text-xl font-black mb-1.5 text-brand-amber tracking-tight uppercase whitespace-nowrap">
            {mode === 'register' ? t('auth.modes.register.title') : t('auth.modes.recover.title')}
          </h2>
          <p className="text-[10px] text-brand-peach/30 leading-tight font-medium whitespace-nowrap">
            {mode === 'register' 
              ? t('auth.modes.register.hint').split('，')[0]
              : t('auth.modes.recover.hint').split('？')[0]}
          </p>
        </div>

        {/* Right column: Form (Fixed Width via Flex-1) */}
        <div className="flex-1 flex flex-col justify-center gap-2.5 min-w-0 px-8">
          <div className="h-[36px] flex items-center w-full">
            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200 p-2 rounded-xl text-[10px] flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-3 h-3 flex-shrink-0 text-red-500 mt-0.5" />
                <span className="truncate leading-tight">{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                <User className="w-2.5 h-2.5" /> {t('auth.inputs.nickname')}
            </label>
            <input
              type="text"
              placeholder={t('auth.inputs.nicknamePlaceholder')}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-brand-peach text-base placeholder-brand-peach/30 focus:outline-none focus:ring-1 focus:ring-brand-amber/40 transition-all font-medium"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                <Key className="w-2.5 h-2.5" /> {t('auth.inputs.pin')}
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder={t('auth.inputs.pinPlaceholder')}
              maxLength={4}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-brand-peach text-base placeholder-brand-peach/30 focus:outline-none focus:ring-1 focus:ring-brand-amber/40 transition-all text-center font-mono tracking-[0.3em]"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              onFocus={(e) => { e.target.setAttribute('readonly', 'readonly'); setTimeout(() => { e.target.removeAttribute('readonly'); e.target.focus(); }, 100); }}
              disabled={loading}
            />
          </div>

          <div className="mt-1 flex gap-2">
            <button
                onClick={mode === 'register' ? handleRegister : () => { setError(null); setMode('register'); }}
                disabled={loading}
                className={cn(
                  "flex-1 h-10 rounded-xl font-normal text-[14px] transition-all",
                  mode === 'register' 
                    ? "bg-gradient-to-r from-brand-peach to-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20" 
                    : "bg-white/5 text-brand-peach/60 border border-white/10 hover:bg-white/10"
                )}
            >
              {loading && mode === 'register' ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : (
                <span>{t('auth.registerButton')}</span>
              )}
            </button>

            <button 
                onClick={mode === 'recover' ? handleRecover : () => { setError(null); setMode('recover'); }}
                disabled={loading}
                className={cn(
                  "flex-1 h-10 rounded-xl font-normal text-[14px] transition-all",
                  mode === 'recover' 
                    ? "bg-gradient-to-r from-brand-peach to-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20" 
                    : "bg-white/5 text-brand-peach/60 border border-white/10 hover:bg-white/10"
                )}
            >
              {loading && mode === 'recover' ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin mx-auto" />
              ) : (
                <span>{t('auth.loginButton')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative text-white w-full transition-all duration-500 p-1 h-full flex flex-col overflow-hidden">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-1 flex flex-col justify-center py-2">
          <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-peach to-brand-orange flex items-center justify-center shadow-xl shadow-brand-orange/20 relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm animate-pulse-slow"></div>
                  {mode === 'register' ? <User className="w-6 h-6 text-brand-dark relative" /> : <RotateCw className="w-6 h-6 text-brand-dark relative" />}
              </div>
          </div>

          <h2 className="text-sm font-bold text-center text-brand-amber tracking-tight uppercase">
            {mode === 'register' ? t('auth.modes.register.title') : t('auth.modes.recover.title')}
          </h2>

          <div className="h-[34px] my-1 flex items-center w-full">
            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200 p-2 rounded-xl text-[10px] flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="space-y-0.5">
              <label className="flex items-center gap-1.5 text-[10px] font-normal text-white/30 uppercase tracking-widest pl-1">
                  <User className="w-2 h-2" /> {t('auth.inputs.nickname')}
              </label>
              <input
                type="text"
                placeholder={t('auth.inputs.nicknamePlaceholder')}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-brand-peach text-base placeholder-brand-peach/30 focus:outline-none focus:ring-1 focus:ring-brand-amber/40 focus:border-brand-amber/60 transition-all outline-none"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-0.5 pb-0.5">
              <label className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">
                  <Key className="w-2 h-2" /> {t('auth.inputs.pin')}
              </label>
              <input
                type="password"
                inputMode="numeric"
                placeholder={t('auth.inputs.pinPlaceholder')}
                maxLength={4}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-brand-peach text-base placeholder-brand-peach/30 focus:outline-none focus:ring-1 focus:ring-brand-amber/40 focus:border-brand-amber/60 transition-all outline-none text-center font-mono tracking-[0.5em]"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleKeyDown}
                onFocus={(e) => { e.target.setAttribute('readonly', 'readonly'); setTimeout(() => { e.target.removeAttribute('readonly'); e.target.focus(); }, 100); }}
                disabled={loading}
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex gap-3">
                <button
                    onClick={mode === 'register' ? handleRegister : () => { setError(null); setMode('register'); }}
                    disabled={loading}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={cn(
                      "flex-1 h-11 rounded-xl font-normal text-[14px] transition-all outline-none select-none",
                      mode === 'register' 
                        ? "bg-gradient-to-r from-brand-peach to-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20" 
                        : "bg-white/5 text-brand-peach/60 border border-white/10 hover:bg-white/10"
                    )}
                >
                  {loading && mode === 'register' ? (
                    <RotateCw className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <span>{t('auth.registerButton')}</span>
                  )}
                </button>

                <button
                    onClick={mode === 'recover' ? handleRecover : () => { setError(null); setMode('recover'); }}
                    disabled={loading}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={cn(
                      "flex-1 h-11 rounded-xl font-normal text-[14px] transition-all outline-none select-none",
                      mode === 'recover' 
                        ? "bg-gradient-to-r from-brand-peach to-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20" 
                        : "bg-white/5 text-brand-peach/60 border border-white/10 hover:bg-white/10"
                    )}
                >
                  {loading && mode === 'recover' ? (
                    <RotateCw className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <span>{t('auth.loginButton')}</span>
                  )}
                </button>
              </div>

              <div className="h-[28px] flex items-center justify-center">
                <p className="text-[10px] text-brand-peach/40 text-center px-2 leading-relaxed italic">
                  {mode === 'register' 
                    ? t('auth.modes.register.hint')
                    : t('auth.modes.recover.hint')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
