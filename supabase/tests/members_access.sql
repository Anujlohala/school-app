-- Existing development profiles; every test row is rolled back.
begin;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='admin'), true);
set local role authenticated;
do $$ declare test_id uuid; affected integer; begin
  assert public.is_admin(), 'Admin helper must recognize admin';
  insert into public.members(full_name) values ('__Roster verification 20260919__') returning id into test_id;
  update public.members set full_name='__Roster verification edited 20260919__' where id=test_id;
  get diagnostics affected = row_count;
  assert affected=1, 'Admin update must succeed';
  begin
    insert into public.members(full_name) values ('__ROSTER VERIFICATION EDITED 20260919__');
    raise exception 'Duplicate active name accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.members(full_name) values ('  ');
    raise exception 'Blank name accepted';
  exception when check_violation then null; end;
  update public.members set active=false where id=test_id;
  insert into public.members(full_name) values ('__Roster verification edited 20260919__');
  begin
    update public.members set active=true where id=test_id;
    raise exception 'Conflicting reactivation accepted';
  exception when unique_violation then null; end;
  begin
    delete from public.members where id=test_id;
    raise exception 'Deletion accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='member'), true);
set local role authenticated;
do $$ declare affected integer; begin
  assert not public.is_admin(), 'Member must not be admin';
  assert (select count(*)=2 from public.members where full_name='__Roster verification edited 20260919__'), 'Member must read roster including inactive';
  begin
    insert into public.members(full_name) values ('__Forbidden member insert__');
    raise exception 'Member insert accepted';
  exception when insufficient_privilege then null; end;
  update public.members set active=false where full_name='__Roster verification edited 20260919__';
  get diagnostics affected = row_count;
  assert affected=0, 'Member update must affect no rows';
  begin
    delete from public.members where full_name='__Roster verification edited 20260919__';
    raise exception 'Member delete accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  assert (select count(*)=0 from public.members), 'Unprovisioned account must not read roster';
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.members;
    raise exception 'Anonymous read accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Member access checks passed; test data rolled back' as result;
