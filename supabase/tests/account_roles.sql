-- Run after both profiles are provisioned. Uses existing development identities.
-- All operations are rolled back; no Auth users or financial records are created.
begin;

do $$ begin
  assert (select count(*) = 2 from public.profiles), 'Both profiles must exist';
end $$;

select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role = 'member'), true);
set local role authenticated;
do $$ begin
  assert (select count(*) = 1 from public.profiles), 'Member must see only own profile';
  assert (select role = 'member' from public.profiles), 'Member must not see admin profile';
  begin
    update public.profiles set role = 'admin' where user_id = auth.uid();
    raise exception 'Member role escalation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.profiles where user_id = auth.uid();
    raise exception 'Member deletion unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.profiles(user_id, role) values (auth.uid(), 'admin');
    raise exception 'Member insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role = 'admin'), true);
set local role authenticated;
do $$ begin
  assert (select count(*) = 1 from public.profiles), 'Admin must see only own profile';
  assert (select role = 'admin' from public.profiles), 'Admin role must be readable';
  begin
    update public.profiles set role = 'member' where user_id = auth.uid();
    raise exception 'Admin client role mutation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  assert (select count(*) = 0 from public.profiles), 'Unprovisioned user must not see profiles';
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.profiles;
    raise exception 'Anonymous read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
