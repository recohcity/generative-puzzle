import { isSupabaseConfigured, supabase } from "@/lib/supabase/browserClient";

export type PlayerProfile = {
  id: string;
  nickname: string;
  best_score: number;
  challenge_count: number;
  virtual_email: string;
};

export class VirtualAuthServiceClass {
  // We combine the 4-digit PIN with a salt to meet Supabase's >= 6 char password requirement
  private getSecurePassword(pin: number | string): string {
    return `${pin}#GpX9`;
  }

  /**
   * Register a new anonymous user with Nickname and PIN.
   * Under the hood, this creates a virtual email and signs up natively.
   */
  async register(nickname: string, pin: number | string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase client not configured." };
    }

    try {
      const virtualEmail = `${crypto.randomUUID()}@game-auth.local`;
      const password = this.getSecurePassword(pin);

      // 1. Native Sign Up
      const { data, error: authError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: password,
      });

      if (authError || !data.user) {
        return { success: false, error: authError?.message || "注册核心账户失败" };
      }

      // 2. Upsert profile information
      const { error: profileError } = await supabase.from("player_profiles").insert({
        id: data.user.id,
        virtual_email: virtualEmail,
        nickname: nickname,
        pin_code: Number(pin),
        best_score: 0,
      });

      if (profileError) {
        console.error("[VirtualAuth] 资料写入失败 (可能是 RLS 策略阻止):", profileError);
        return { success: false, error: `注册资料失败: ${profileError.message || profileError.details}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "未知错误" };
    }
  }

  /**
   * Lookup if there are existing records matching Nickname + PIN.
   * Uses the SECURITY DEFINER RPC to securely search player_profiles.
   */
  async lookupAccounts(nickname: string, pin: number | string): Promise<{ data: PlayerProfile[]; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { data: [], error: "Supabase not configured" };
    
    const searchNickname = nickname.trim();
    const searchPin = pin.toString().trim(); // 保持为字符串发送
    
    console.log(`[VirtualAuth] 📡 发起 RPC 请求: 昵称="${searchNickname}", PIN="${searchPin}"`);

    const { data, error } = await supabase.rpc("lookup_player_profiles", {
      p_nickname: searchNickname,
      p_pin_code: searchPin,
    });

    if (error) {
      console.error("[VirtualAuth] 查询发生错误:", error);
      return { data: [], error: error.message };
    }
    
    console.log(`[VirtualAuth] 查询结果: 找到 ${data?.length || 0} 个匹配项`);
    return { data: (data as PlayerProfile[]) || [] };
  }

  /**
   * Log into a specific virtual email account using the PIN as password.
   */
  async loginWithVirtualEmail(virtualEmail: string, pin: number | string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase client not configured." };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: this.getSecurePassword(pin),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "未知错误" };
    }
  }

  /**
   * Convenience method: Fetch current user profile if logged in
   */
  async getCurrentProfile(): Promise<Omit<PlayerProfile, 'virtual_email'> | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from("player_profiles")
      .select("id, nickname, best_score")
      .eq("id", session.user.id)
      .single();

    if (error || !data) return null;

    return data as any;
  }
}

export const VirtualAuthService = new VirtualAuthServiceClass();
