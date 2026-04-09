"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/browserClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import { User, LogOut, Mail, Send } from "lucide-react";

export default function SupabaseAuthWidget() {
  const { user, signOut: contextSignOut, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;

  const displayUserId = useMemo(() => {
    if (!userId) return null;
    return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
  }, [userId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError(t('auth.error.notConfigured'));
    }
  }, [t]);

  const signInWithMagicLink = async () => {
    setError(null);
    if (!email.trim()) {
      setError(t('auth.error.noEmail'));
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setError(t('auth.error.notConfigured'));
      return;
    }

    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/scores`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) setError(error.message);
    } catch (e: any) {
      setError(e?.message ?? t('auth.error.fail'));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setError(t('auth.error.notConfigured'));
        return;
      }

      await contextSignOut();
    } catch (e: any) {
      setError(e.message || t('auth.error.fail'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-[#2A2A2A]/40 backdrop-blur-xl p-5 shadow-xl transition-all">
      <div className="text-[#FFD5AB] font-bold text-lg mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        {t('auth.title')}
      </div>

      {userId ? (
        <div className="flex items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="text-sm text-white/80 flex flex-col">
            <span className="text-white/40 text-xs mb-1 uppercase tracking-wider">{t('auth.synced')}</span>
            <span className="font-mono text-[#FFD5AB]">{displayUserId}</span>
          </div>
          <Button 
            onClick={signOut} 
            disabled={busy} 
            size="sm" 
            className="bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.signOut')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-[#FFD5AB]/70 leading-relaxed bg-[#FFD5AB]/5 p-3 rounded-lg border border-[#FFD5AB]/10">
            {t('auth.description')}
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#FFD5AB] transition-colors" />
              <input
                value={email}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/20 border border-white/10 text-[#FFD5AB] text-base placeholder:text-white/20 outline-none focus:border-[#FFD5AB]/30 focus:bg-black/40 transition-all font-medium"
                disabled={busy}
              />
            </div>
            <Button
              onClick={signInWithMagicLink}
              disabled={busy}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FFD5AB] to-[#F68E5F] hover:from-[#F68E5F] hover:to-[#FFD5AB] text-[#2A2A2A] font-bold shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#2A2A2A]/30 border-t-[#2A2A2A] rounded-full animate-spin" />
                  {t('auth.sending')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {t('auth.signIn')}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
    </div>
  );
}

