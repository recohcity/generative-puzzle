import { createClient } from "@supabase/supabase-js";

// Note: This is browser-only code (used by "use client" components / hooks).
// Supabase env vars must be provided on the client build (NEXT_PUBLIC_...).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Important: don't throw at module-evaluation time.
// Vercel/Next will evaluate this during build; if env vars are temporarily missing,
// we still want the app to build and show a proper UI error.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

