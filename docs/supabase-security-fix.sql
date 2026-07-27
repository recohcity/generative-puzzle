-- Supabase Security Advisor Precision Cleanup Script
begin;

-- 1. Revoke direct RPC execution permissions on trigger functions (internal DB triggers only)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'trg_refresh_leaderboard_after_delete') then
    revoke execute on function public.trg_refresh_leaderboard_after_delete() from public, anon, authenticated;
  end if;
  if exists (select 1 from pg_proc where proname = 'trg_refresh_leaderboard_after_game_session_insert') then
    revoke execute on function public.trg_refresh_leaderboard_after_game_session_insert() from public, anon, authenticated;
  end if;
end $$;

commit;
