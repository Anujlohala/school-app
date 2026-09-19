-- Read-only structural checks. Run in the Supabase SQL Editor after migration.
-- Account-specific RLS/session tests follow when the two Auth users are provisioned.
do $$
begin
  assert (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
    'profiles must enable RLS';
  assert not has_table_privilege('anon', 'public.profiles', 'SELECT'),
    'anonymous reads must be denied';
  assert has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
    'authenticated users need SELECT';
  assert not has_table_privilege('authenticated', 'public.profiles', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
    'authenticated users must not mutate profiles';
  assert (select count(*) = 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'),
    'profiles must have exactly one policy';
  assert exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'profiles_read_own' and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual like '%auth.uid()%user_id%'
  ), 'profile reads must be scoped to the current user';
end;
$$;
