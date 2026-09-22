-- Existing development profiles; all cycle and fixture records roll back.
begin;

do $$ begin
  assert to_regprocedure('public.activate_cycle(uuid)') is null,
    'Activation without a reviewed version must not remain available';
end $$;

select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='admin'), true);
set local role authenticated;

do $$
declare
  member_ids uuid[];
  v_cycle_id uuid;
  v_month_id uuid;
  v_reviewed_updated_at timestamptz;
  v_latest_updated_at timestamptz;
begin
  insert into public.members(full_name)
  select '__Cycle verification member ' || item || '__'
  from generate_series(1, 11) item;

  select array_agg(id order by full_name) into member_ids
  from public.members where full_name like '__Cycle verification member %__';

  select public.save_draft_cycle(
    null, null, date '2026-09-01', 2000, 100, 200, member_ids
  ) into v_cycle_id;
  assert (select count(*) = 11 from public.cycle_members where cycle_id = v_cycle_id),
    'Draft must snapshot 11 members';
  assert (select status = 'draft' from public.cycles where id = v_cycle_id),
    'New cycle must remain draft';
  assert (select count(*) = 0 from public.cycle_months where cycle_id = v_cycle_id),
    'Draft must not create persisted months';

  select updated_at into v_reviewed_updated_at from public.cycles where id = v_cycle_id;
  -- Simulate another tab saving after this draft was reviewed.
  perform public.save_draft_cycle(
    v_cycle_id, v_reviewed_updated_at, date '2026-09-01', 3000, 150, 250, member_ids
  );
  select updated_at into v_latest_updated_at from public.cycles where id = v_cycle_id;
  assert v_latest_updated_at <> v_reviewed_updated_at, 'Draft edits must change the version';
  begin
    perform public.activate_cycle(v_cycle_id, v_reviewed_updated_at);
    raise exception 'Activation accepted a stale review';
  exception when serialization_failure then null; end;
  begin
    perform public.activate_cycle(v_cycle_id, null);
    raise exception 'Activation accepted a missing review version';
  exception when serialization_failure then null; end;
  assert (select status = 'draft' and member_count = 0 from public.cycles where id = v_cycle_id),
    'Rejected activation must preserve the draft';
  assert (select count(*) = 0 from public.cycle_months where cycle_id = v_cycle_id),
    'Rejected activation must not create any months';

  perform public.activate_cycle(v_cycle_id, v_latest_updated_at);
  assert (select status = 'active' and member_count = 11 from public.cycles where id = v_cycle_id),
    'Activation must lock the 11-member snapshot';
  assert (select count(*) = 11 from public.cycle_months where cycle_id = v_cycle_id),
    'Activation must create 11 months';
  assert (select scheduled_date = date '2026-09-26' from public.cycle_months where cycle_id = v_cycle_id and month_number = 1),
    'Month 1 must use the last Saturday';
  assert (select scheduled_date = date '2027-07-31' from public.cycle_months where cycle_id = v_cycle_id and month_number = 11),
    'Month 11 must cross the year boundary correctly';

  select id into v_month_id from public.cycle_months where cycle_id = v_cycle_id and month_number = 1;
  perform public.override_meeting_date(v_month_id, date '2026-09-27');
  assert (select scheduled_date = date '2026-09-27' and date_overridden from public.cycle_months where id = v_month_id),
    'Administrator must be able to override one meeting date';

  begin
    update public.cycles set contribution_amount = 9999 where id = v_cycle_id;
    raise exception 'Direct authenticated update accepted';
  exception when insufficient_privilege then null; end;

  begin
    perform public.save_draft_cycle(
      v_cycle_id, now(), date '2026-10-01', 2000, 100, 200, member_ids
    );
    raise exception 'Active cycle was changed through draft function';
  exception when raise_exception then
    if sqlerrm = 'Active cycle was changed through draft function' then raise; end if;
  end;
end
$$;

reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='member'), true);
set local role authenticated;

do $$
declare
  v_cycle_id uuid;
begin
  select id into v_cycle_id from public.cycles where status = 'active';
  assert v_cycle_id is not null, 'Member must read active cycles';
  assert (select count(*) = 11 from public.cycle_members where cycle_id = v_cycle_id),
    'Member must read the active roster';
  assert (select count(*) = 11 from public.cycle_months where cycle_id = v_cycle_id),
    'Member must read the active schedule';
  begin
    perform public.activate_cycle(v_cycle_id, (select updated_at from public.cycles where id = v_cycle_id));
    raise exception 'Member activated a cycle';
  exception when raise_exception then
    if sqlerrm = 'Member activated a cycle' then raise; end if;
  end;
end
$$;

reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.cycles;
    raise exception 'Anonymous cycle read accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

rollback;
select 'Cycle access and activation checks passed; test data rolled back' as result;
