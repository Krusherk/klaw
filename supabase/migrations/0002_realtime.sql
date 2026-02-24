-- Enable Supabase Realtime publication for moderation workflow tables.
-- Run after 0001_initial.sql.

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    alter table public.stories replica identity full;
    alter table public.story_tasks replica identity full;
    alter table public.story_task_events replica identity full;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'stories'
    ) then
      alter publication supabase_realtime add table public.stories;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'story_tasks'
    ) then
      alter publication supabase_realtime add table public.story_tasks;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'story_task_events'
    ) then
      alter publication supabase_realtime add table public.story_task_events;
    end if;
  end if;
end;
$$;

create or replace function public.realtime_table_status()
returns table (table_name text, in_realtime boolean)
language sql
security definer
set search_path = public, pg_catalog
as $$
  with targets(table_name) as (
    values
      ('stories'::text),
      ('story_tasks'::text),
      ('story_task_events'::text)
  )
  select
    t.table_name,
    exists (
      select 1
      from pg_publication_tables ppt
      where ppt.pubname = 'supabase_realtime'
        and ppt.schemaname = 'public'
        and ppt.tablename = t.table_name
    ) as in_realtime
  from targets t;
$$;

grant execute on function public.realtime_table_status() to anon, authenticated, service_role;
