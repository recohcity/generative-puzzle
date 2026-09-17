'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/browserClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Supabase v2 SDK 本地会话存储键（localStorage，纯本地、无网络）
const SB_AUTH_TOKEN_KEY = 'supabase.auth.token';

/** 同步读取本地会话（不触发任何网络请求）；无/损坏/过期一律不阻塞 UI */
function readLocalSession(): Session | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(SB_AUTH_TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession ?? parsed;
    if (!session?.access_token || !session?.user) return null;
    return session as Session;
  } catch {
    return null;
  }
}

/** 竞速超时：主 Promise 在 ms 内未决则先用 fallback 放行 UI，后台继续 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>(resolve => {
    let settled = false;
    promise.then(
      v => { if (!settled) { settled = true; resolve(v); } },
      () => { if (!settled) { settled = true; resolve(fallback); } },
    );
    setTimeout(() => {
      if (!settled) { settled = true; resolve(fallback); }
    }, ms);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // 1) 本地会话立即注入（乐观）：UI 不等网络，游客/已登录秒显。
    //    （SDK getSession 在有过期 token 且 autoRefreshToken=true 时会先发起网络刷新，
    //      海外 Supabase 在中国网络下可能挂起数秒——不能让 UI 等它。）
    const localSession = readLocalSession();
    if (localSession) {
      setSession(localSession);
      setUser(localSession.user);
    }
    setIsLoading(false);

    // 2) 后台验证/刷新：带竞速超时降级，网络结果回来后再覆盖本地状态。
    try {
      withTimeout(supabase.auth.getSession(), 3000, { data: { session: null }, error: null })
        .then(({ data: { session: s } }) => {
          if (cancelled) return;
          setSession(s);
          setUser(s?.user ?? null);
        })
        .catch(err => {
          console.warn("[AuthContext] 初始会话验证静默失败 (可能网络不通):", err.message);
        });

      // 3) 监听认证状态变化（登录/登出/后台刷新结果）
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        if (cancelled) return;
        setSession(s);
        setUser(s?.user ?? null);
        setIsLoading(false);
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    } catch (e) {
      console.error("[AuthContext] 认证初始化异常:", e);
      setIsLoading(false);
    }
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
