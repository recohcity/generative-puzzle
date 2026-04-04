-- Generative Puzzle - game-cloud MVP schema
-- Safe to run in Supabase SQL Editor (dev first, then prod).

begin;

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) profiles: one row per auth user
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) user_settings: one row per user
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  volume int not null default 80 check (volume >= 0 and volume <= 100),
  language text not null default 'zh-CN',
  theme text not null default 'system',
  reduce_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 3) game_sessions: append-only gameplay records
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  difficulty text not null,
  duration_ms int not null check (duration_ms >= 0),
  score int not null check (score >= 0),
  moves int,
  client_created_at timestamptz not null,
  uploaded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- Deduplicate repeated uploads from retry/reconnect.
create unique index if not exists game_sessions_user_id_idempotency_key_uq
  on public.game_sessions (user_id, idempotency_key);

create index if not exists game_sessions_user_created_at_idx
  on public.game_sessions (user_id, client_created_at desc);

-- 4) public leaderboard table (safe for global reads)
-- Keep game_sessions private; expose only sanitized aggregated fields.
create table if not exists public.public_leaderboard_entries (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  difficulty text not null,
  best_score int not null check (best_score >= 0),
  best_duration_ms int not null check (best_duration_ms >= 0),
  sessions_count int not null check (sessions_count >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, difficulty)
);

create index if not exists public_leaderboard_entries_difficulty_score_idx
  on public.public_leaderboard_entries (difficulty, best_score desc, best_duration_ms asc);

drop view if exists public.leaderboards;
create view public.leaderboards
with (security_invoker = true) as
select
  user_id,
  display_name,
  difficulty,
  best_score,
  best_duration_ms,
  sessions_count,
  updated_at
from public.public_leaderboard_entries;

-- Keep updated_at fresh on profile/settings updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recompute one user's leaderboard row for one difficulty.
-- Call this from backend/Edge Function using service role key.
create or replace function public.refresh_leaderboard_for_user(
  p_user_id uuid,
  p_difficulty text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_best_score int;
  v_best_duration_ms int;
  v_sessions_count int;
begin
  select coalesce(display_name, 'Player')
    into v_display_name
  from public.profiles
  where user_id = p_user_id;

  select
    coalesce(max(score), 0),
    coalesce(min(duration_ms), 0),
    count(*)
    into v_best_score, v_best_duration_ms, v_sessions_count
  from public.game_sessions
  where user_id = p_user_id
    and difficulty = p_difficulty;

  if v_sessions_count = 0 then
    delete from public.public_leaderboard_entries
    where user_id = p_user_id and difficulty = p_difficulty;
    return;
  end if;

  insert into public.public_leaderboard_entries (
    user_id,
    display_name,
    difficulty,
    best_score,
    best_duration_ms,
    sessions_count,
    updated_at
  )
  values (
    p_user_id,
    v_display_name,
    p_difficulty,
    v_best_score,
    v_best_duration_ms,
    v_sessions_count,
    now()
  )
  on conflict (user_id, difficulty)
  do update set
    display_name = excluded.display_name,
    best_score = excluded.best_score,
    best_duration_ms = excluded.best_duration_ms,
    sessions_count = excluded.sessions_count,
    updated_at = now();
end;
$$;

-- Keep global leaderboard in sync automatically.
-- When a new game_session row is inserted, recompute the user's aggregated entry.
create or replace function public.trg_refresh_leaderboard_after_game_session_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_leaderboard_for_user(new.user_id, new.difficulty);
  return new;
end;
$$;

drop trigger if exists trg_game_sessions_refresh_leaderboard on public.game_sessions;
create trigger trg_game_sessions_refresh_leaderboard
after insert on public.game_sessions
for each row execute function public.trg_refresh_leaderboard_after_game_session_insert();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.game_sessions enable row level security;
alter table public.public_leaderboard_entries enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User settings policies
drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "settings_insert_own" on public.user_settings;
create policy "settings_insert_own"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own"
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Game sessions policies
drop policy if exists "sessions_select_own" on public.game_sessions;
create policy "sessions_select_own"
  on public.game_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.game_sessions;
create policy "sessions_insert_own"
  on public.game_sessions
  for insert
  with check (auth.uid() = user_id);

-- Append-only by default (no update/delete policy) to reduce tampering surface.

-- Public leaderboard policies:
-- Allow all users to read global leaderboard rows.
drop policy if exists "leaderboard_read_all" on public.public_leaderboard_entries;
create policy "leaderboard_read_all"
  on public.public_leaderboard_entries
  for select
  using (true);

-- Users can only upsert/delete their own aggregated leaderboard row.
-- This enables the trigger (which runs in the inserting user's auth context)
-- to update the row without exposing raw game_sessions.
drop policy if exists "leaderboard_entries_upsert_own" on public.public_leaderboard_entries;
create policy "leaderboard_entries_upsert_own"
  on public.public_leaderboard_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "leaderboard_entries_update_own" on public.public_leaderboard_entries;
create policy "leaderboard_entries_update_own"
  on public.public_leaderboard_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "leaderboard_entries_delete_own" on public.public_leaderboard_entries;
create policy "leaderboard_entries_delete_own"
  on public.public_leaderboard_entries
  for delete
  using (auth.uid() = user_id);

-- Expose read access on the view to both anon/authenticated clients.
grant select on public.leaderboards to anon, authenticated;

commit;

