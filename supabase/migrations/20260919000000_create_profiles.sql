begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id),
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- V1 has one administrator and one shared member identity.
  constraint profiles_one_account_per_role unique (role)
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;

create policy profiles_read_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Provision roles through trusted project management, never through client writes.
create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public, anon, authenticated;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

commit;
