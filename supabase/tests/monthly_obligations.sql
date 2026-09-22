-- Existing development profiles; all fixtures roll back.
begin;

-- Allow this rollback-only test to run beside real draft or active records.
-- The final rollback restores their original state.
delete from public.cycles where status = 'draft';
update public.cycles
set status = 'completed', completed_on = current_date
where status = 'active';

select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='admin'), true);
set local role authenticated;

do $$
declare
  member_ids uuid[];
  v_cycle_id uuid;
  v_month_1 uuid;
  v_month_2 uuid;
  v_winner_1 uuid;
  v_winner_2 uuid;
  v_version timestamptz;
begin
  insert into public.members(full_name)
  select '__Obligation verification member ' || item || '__'
  from generate_series(1, 11) item;
  select array_agg(id order by full_name)
  into member_ids
  from public.members where full_name like '__Obligation verification member %__';
  v_winner_1 := member_ids[1];
  v_winner_2 := member_ids[2];

  select public.save_draft_cycle(null, null, date '2026-09-01', 2000, 100, 200, member_ids)
  into v_cycle_id;
  select updated_at into v_version from public.cycles where id = v_cycle_id;
  perform public.activate_cycle(v_cycle_id, v_version);
  select id into v_month_1 from public.cycle_months where cycle_id = v_cycle_id and month_number = 1;
  select id into v_month_2 from public.cycle_months where cycle_id = v_cycle_id and month_number = 2;

  begin
    perform public.set_month_winner_and_generate_payments(
      v_month_2, v_winner_2, (select updated_at from public.cycle_months where id = v_month_2)
    );
    raise exception 'Out-of-order winner accepted';
  exception when raise_exception then
    if sqlerrm = 'Out-of-order winner accepted' then raise; end if;
  end;

  perform public.set_month_winner_and_generate_payments(
    v_month_1, v_winner_1, (select updated_at from public.cycle_months where id = v_month_1)
  );
  assert (select status = 'open' and winner_member_id = v_winner_1 from public.cycle_months where id = v_month_1),
    'Winner recording must open the month';
  assert (select count(*) = 11 from public.member_monthly_payments where month_id = v_month_1),
    'Month must contain 11 obligation snapshots';
  assert (select dhukuti_due = 0 and fixed_saving_due = 100 and interest_due = 0 and total_due = 100
    from public.member_monthly_payments where month_id = v_month_1 and member_id = v_winner_1),
    'Current winner owes only fixed saving';
  assert (select bool_and(dhukuti_due = 2000 and fixed_saving_due = 100 and interest_due = 0 and total_due = 2100)
    from public.member_monthly_payments where month_id = v_month_1 and member_id <> v_winner_1),
    'Other Month 1 members owe contribution plus saving';

  perform public.set_month_winner_and_generate_payments(
    v_month_2, v_winner_2, (select updated_at from public.cycle_months where id = v_month_2)
  );
  assert (select interest_due = 200 and total_due = 2300
    from public.member_monthly_payments where month_id = v_month_2 and member_id = v_winner_1),
    'Previous winner must also owe interest';
  assert (select dhukuti_due = 0 and total_due = 100
    from public.member_monthly_payments where month_id = v_month_2 and member_id = v_winner_2),
    'Current winner must not owe contribution or interest';

  begin
    perform public.set_month_winner_and_generate_payments(
      v_month_1, v_winner_2, (select updated_at from public.cycle_months where id = v_month_1)
    );
    raise exception 'A recorded month was changed';
  exception when raise_exception then
    if sqlerrm = 'A recorded month was changed' then raise; end if;
  end;
end
$$;

reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='member'), true);
set local role authenticated;
do $$ begin
  assert (select count(*) > 0 from public.member_monthly_payments),
    'Member must read obligation snapshots';
  begin
    perform public.set_month_winner_and_generate_payments(
      (select id from public.cycle_months limit 1),
      (select member_id from public.cycle_members limit 1),
      (select updated_at from public.cycle_months limit 1)
    );
    raise exception 'Member recorded a winner';
  exception when raise_exception then
    if sqlerrm = 'Member recorded a winner' then raise; end if;
  end;
end $$;

reset role;
rollback;
select 'Monthly winner and obligation checks passed; test data rolled back' as result;
