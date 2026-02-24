create extension if not exists "pgcrypto";

create type public.story_status as enum ('normal', 'pending', 'approved', 'rejected');
create type public.task_state as enum ('awaiting_proof', 'proof_submitted', 'approved', 'rejected');
create type public.task_event_type as enum ('task_assigned', 'proof_submitted', 'approved', 'rejected', 'reopened');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  x_username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  x_username text not null,
  story_text text not null check (char_length(story_text) between 50 and 5000),
  wallet_solana text not null,
  country text not null,
  status public.story_status not null default 'normal',
  submitted_at timestamptz not null default now(),
  submission_date_utc date generated always as (((submitted_at at time zone 'UTC')::date)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, submission_date_utc)
);

create table if not exists public.story_tasks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.stories(id) on delete cascade,
  task_text text not null check (char_length(task_text) between 10 and 500),
  state public.task_state not null default 'awaiting_proof',
  proof_url text,
  proof_submitted_at timestamptz,
  decision_note text,
  assigned_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_task_events (
  id bigserial primary key,
  story_id uuid not null references public.stories(id) on delete cascade,
  task_id uuid references public.story_tasks(id) on delete set null,
  event_type public.task_event_type not null,
  event_note text,
  event_payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values (
  'proof_disclaimer',
  'Proof should preferably be a reply/comment under admin tweet. Non-compliant proof may be rejected.'
)
on conflict (key) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_stories_updated_at on public.stories;
create trigger trg_stories_updated_at
before update on public.stories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_story_tasks_updated_at on public.story_tasks;
create trigger trg_story_tasks_updated_at
before update on public.story_tasks
for each row
execute function public.set_updated_at();

create or replace function public.lock_x_username_after_set()
returns trigger
language plpgsql
as $$
begin
  if old.x_username is not null and new.x_username is distinct from old.x_username then
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
      and current_user not in ('postgres', 'supabase_admin')
    then
      raise exception 'x_username is immutable after being set';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_x_username on public.profiles;
create trigger trg_lock_x_username
before update on public.profiles
for each row
when (old.x_username is not null)
execute function public.lock_x_username_after_set();

create index if not exists idx_stories_status_submitted on public.stories(status, submitted_at asc);
create index if not exists idx_stories_x_username_lower on public.stories((lower(x_username)));
create index if not exists idx_story_tasks_state on public.story_tasks(state);
create index if not exists idx_story_task_events_story_id on public.story_task_events(story_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_tasks enable row level security;
alter table public.story_task_events enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists stories_insert_own on public.stories;
create policy stories_insert_own
on public.stories
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists stories_select_own on public.stories;
create policy stories_select_own
on public.stories
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists story_tasks_select_owner on public.story_tasks;
create policy story_tasks_select_owner
on public.story_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.stories s
    where s.id = story_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists story_task_events_select_owner on public.story_task_events;
create policy story_task_events_select_owner
on public.story_task_events
for select
to authenticated
using (
  exists (
    select 1
    from public.stories s
    where s.id = story_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists site_settings_read_all on public.site_settings;
create policy site_settings_read_all
on public.site_settings
for select
to anon, authenticated
using (true);

create or replace view public.story_feed_public as
select
  s.id,
  s.x_username,
  s.story_text,
  s.status,
  s.submitted_at,
  s.created_at,
  t.task_text
from public.stories s
left join public.story_tasks t on t.story_id = s.id;

grant select on public.story_feed_public to anon, authenticated;
