import { supabase, isSupabaseConfigured } from "@/lib/supabase/browserClient";

export const dynamic = 'force-dynamic'; // 确保不被 Vercel 缓存，每次请求都真实穿透

/**
 * 专门供 cron-job.org 使用的保活接口
 * 目的：通过极轻量的查询（无需下行数据包）保持 Supabase 数据库活跃，防止免费版休眠。
 */
export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return Response.json(
      { status: 'error', message: 'Supabase not configured' },
      { status: 500 }
    );
  }

  try {
    // 使用 head: true 模式，仅请求 Count 计数，不拉取任何具体行数据，流量消耗极低（Bytes 级别）
    const { count, error } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (error) throw error;

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Generative Puzzle Supabase Keep-Alive',
      active_records: count
    });
  } catch (err: any) {
    console.error('[Keep-Alive API Error]:', err.message);
    return Response.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
}
