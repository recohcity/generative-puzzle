"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/browserClient";

export default function SupabaseAuthWidget() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUserId = useMemo(() => {
    if (!userId) return null;
    return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
  }, [userId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase 未配置：请在 Vercel / 环境变量中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    supabase.auth
      .getSession()
      .then(({ data }) => setUserId(data.session?.user?.id ?? null))
      .catch((e) => {
        console.warn("[SupabaseAuthWidget] getSession error", e);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    subscription = data?.subscription ?? null;

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const signInWithMagicLink = async () => {
    setError(null);
    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase 未配置，无法登录。");
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
      setError(e?.message ?? "登录失败");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase 未配置，无法登出。");
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) setError(error.message);
      setUserId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="text-[#FFD5AB] font-medium mb-2">账户登录（Supabase）</div>

      {userId ? (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-white/80">
            已登录：<span className="font-mono">{displayUserId}</span>
          </div>
          <Button onClick={signOut} disabled={busy} size="sm" className="bg-black/30">
            登出
          </Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-white/70 mb-3">
            使用 Magic Link 登录后，游戏记录会自动写入云端并用于多端一致。
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-[220px] px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder:text-white/40 outline-none"
              disabled={busy}
            />
            <Button
              onClick={signInWithMagicLink}
              disabled={busy}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              {busy ? "发送中..." : "发送魔法链接"}
            </Button>
          </div>
        </>
      )}

      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
    </div>
  );
}

