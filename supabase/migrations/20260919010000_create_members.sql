begin;

create function public.is_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (full_name = btrim(full_name) and char_length(full_name) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index members_active_name_unique on public.members (lower(full_name)) where active;

alter table public.members enable row level security;
revoke all on table public.members from public, anon, authenticated;
grant select, insert, update on table public.members to authenticated;

create policy members_read on public.members for select to authenticated
using (exists (select 1 from public.profiles where user_id = (select auth.uid()) and role in ('admin', 'member')));
create policy members_admin_insert on public.members for insert to authenticated
with check ((select public.is_admin()));
create policy members_admin_update on public.members for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create function public.set_member_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end $$;
revoke all on function public.set_member_updated_at() from public, anon, authenticated;
create trigger members_updated_at before update on public.members
for each row execute function public.set_member_updated_at();

commit;
