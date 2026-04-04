-- 部署于 Supabase SQL Editor
-- 根据 Game Cloud 架构文档 §4，使用 RPC 和 Security Definer 清理所有的用户游戏记录
create or replace function public.clear_user_game_sessions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- 获取当前安全的验证码用户
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- 删除 game_sessions（不删除 Auth 用户本体）
  delete from public.game_sessions where user_id = v_user_id;
  
  -- 连带清除汇总排行榜中的记录，防止出现空尸数据
  delete from public.public_leaderboard_entries where user_id = v_user_id;

end;
$$;
