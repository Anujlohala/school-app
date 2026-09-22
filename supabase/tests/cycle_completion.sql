-- Existing development records and all fixtures are restored by the rollback.
begin;

-- Make room for an isolated active-cycle test without changing hosted data.
update public.cycle_months
set status = 'completed'
where cycle_id in (select id from public.cycles where status = 'active');
update public.cycles
set status = 'completed', completed_on = current_date
where status = 'active';
delete from public.cycles where status = 'draft';

-- Test-only definer helper lets the fixture simulate a damaged snapshot while
-- application roles remain unable to write payment rows directly.
create function public.__test_delete_completion_payment(p_payment_id uuid)
returns void language sql security definer set search_path = ''
as $$ delete from public.member_monthly_payments where id = p_payment_id $$;
revoke all on function public.__test_delete_completion_payment(uuid) from public, anon;
grant execute on function public.__test_delete_completion_payment(uuid) to authenticated;

select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='admin'), true);
set local role authenticated;

do $$
declare
  member_ids uuid[];
  v_cycle_id uuid;
  v_next_cycle_id uuid;
  v_month record;
  v_reviewed_at timestamptz;
  v_stale_at timestamptz;
  v_payment_id uuid;
  v_payment_updated_at timestamptz;
begin
  insert into public.members(full_name)
  select '__Completion verification member ' || lpad(item::text, 2, '0') || '__'
  from generate_series(1, 11) item;
  select array_agg(id order by full_name) into member_ids
  from public.members where full_name like '__Completion verification member %__';

  select public.save_draft_cycle(
    null, null, date '2027-01-01', 2000, 100, 200, member_ids
  ) into v_cycle_id;
  perform public.activate_cycle(
    v_cycle_id,
    (select updated_at from public.cycles where id = v_cycle_id)
  );

  select greatest(
    (select updated_at from public.cycles where id = v_cycle_id),
    (select max(updated_at) from public.cycle_months where cycle_id = v_cycle_id)
  ) into v_reviewed_at;
  begin
    perform public.complete_cycle(v_cycle_id, v_reviewed_at);
    raise exception 'Completion accepted missing winners';
  exception when raise_exception then
    if sqlerrm <> 'Cycle is not ready for completion' then raise; end if;
  end;

  for v_month in
    select cm.id, cm.month_number, cm.updated_at
    from public.cycle_months cm
    where cm.cycle_id = v_cycle_id
    order by cm.month_number
  loop
    perform public.set_month_winner_and_generate_payments(
      v_month.id, member_ids[v_month.month_number], v_month.updated_at
    );
  end loop;
  assert (select count(*) = 121 from public.member_monthly_payments p join public.cycle_months cm on cm.id = p.month_id where cm.cycle_id = v_cycle_id),
    'Every month must have 11 obligation snapshots';

  -- A second draft may be prepared, but not activated while this cycle is active.
  select public.save_draft_cycle(
    null, null, date '2027-12-01', 2500, 150, 250, member_ids
  ) into v_next_cycle_id;
  begin
    perform public.activate_cycle(
      v_next_cycle_id,
      (select updated_at from public.cycles where id = v_next_cycle_id)
    );
    raise exception 'Next cycle activated before active-cycle completion';
  exception when raise_exception then
    if sqlerrm <> 'An active cycle already exists; complete it before activating another cycle' then raise; end if;
  end;

  -- Removing one snapshot must block completion; the exception restores it.
  begin
    perform public.__test_delete_completion_payment((
      select p.id from public.member_monthly_payments p
      join public.cycle_months cm on cm.id = p.month_id
      where cm.cycle_id = v_cycle_id limit 1
    ));
    select max(reviewed_at) into v_reviewed_at from (
      select updated_at as reviewed_at from public.cycles where id = v_cycle_id
      union all select updated_at from public.cycle_months where cycle_id = v_cycle_id
      union all select p.updated_at from public.member_monthly_payments p join public.cycle_months cm on cm.id = p.month_id where cm.cycle_id = v_cycle_id
    ) versions;
    perform public.complete_cycle(v_cycle_id, v_reviewed_at);
    raise exception 'Completion accepted a missing obligation';
  exception when raise_exception then
    if sqlerrm <> 'Cycle is not ready for completion' then raise; end if;
  end;

  select max(reviewed_at) into v_stale_at from (
    select updated_at as reviewed_at from public.cycles where id = v_cycle_id
    union all select updated_at from public.cycle_months where cycle_id = v_cycle_id
    union all select p.updated_at from public.member_monthly_payments p join public.cycle_months cm on cm.id = p.month_id where cm.cycle_id = v_cycle_id
  ) versions;
  select p.id, p.updated_at into v_payment_id, v_payment_updated_at
  from public.member_monthly_payments p
  join public.cycle_months cm on cm.id = p.month_id
  where cm.cycle_id = v_cycle_id limit 1;
  perform public.mark_monthly_payment_paid(v_payment_id, 'cash', v_payment_updated_at);
  begin
    perform public.complete_cycle(v_cycle_id, v_stale_at);
    raise exception 'Completion accepted a stale financial review';
  exception when serialization_failure then null; end;

  select max(reviewed_at) into v_reviewed_at from (
    select updated_at as reviewed_at from public.cycles where id = v_cycle_id
    union all select updated_at from public.cycle_months where cycle_id = v_cycle_id
    union all select p.updated_at from public.member_monthly_payments p join public.cycle_months cm on cm.id = p.month_id where cm.cycle_id = v_cycle_id
  ) versions;
  perform public.complete_cycle(v_cycle_id, v_reviewed_at);
  assert (select status = 'completed' and completed_on is not null from public.cycles where id = v_cycle_id),
    'Cycle must be completed with a completion date';
  assert (select count(*) = 11 from public.cycle_months where cycle_id = v_cycle_id and status = 'completed'),
    'Every month must be completed';
  assert (select count(*) = 120 from public.member_monthly_payments p join public.cycle_months cm on cm.id = p.month_id where cm.cycle_id = v_cycle_id and p.payment_status = 'pending'),
    'Pending payments must survive completion';

  perform public.activate_cycle(
    v_next_cycle_id,
    (select updated_at from public.cycles where id = v_next_cycle_id)
  );
  assert (select status = 'active' from public.cycles where id = v_next_cycle_id),
    'Next cycle must activate after completion';
  assert (select count(*) = 0 from public.cycle_months where cycle_id = v_next_cycle_id and winner_member_id is not null),
    'Next-cycle winner state must start empty';
end
$$;

reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='member'), true);
set local role authenticated;
do $$
declare v_cycle_id uuid;
begin
  select id into v_cycle_id from public.cycles where status = 'active';
  begin
    perform public.complete_cycle(v_cycle_id, now());
    raise exception 'Member completed a cycle';
  exception when raise_exception then
    if sqlerrm <> 'Administrator access required' then raise; end if;
  end;
end
$$;

reset role;
rollback;
select 'Cycle completion and transition checks passed; test data rolled back' as result;
