-- Existing development profiles; all fixtures and corrections roll back.
begin;

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
  v_month_3 uuid;
  v_version timestamptz;
  v_paid_payment_id uuid;
begin
  insert into public.members(full_name)
  select '__Winner correction member ' || item || '__'
  from generate_series(1, 11) item;
  select array_agg(id order by full_name) into member_ids
  from public.members where full_name like '__Winner correction member %__';

  select public.save_draft_cycle(null, null, date '2026-09-01', 2000, 100, 200, member_ids)
  into v_cycle_id;
  select updated_at into v_version from public.cycles where id = v_cycle_id;
  perform public.activate_cycle(v_cycle_id, v_version);
  select id into v_month_1 from public.cycle_months where cycle_id = v_cycle_id and month_number = 1;
  select id into v_month_2 from public.cycle_months where cycle_id = v_cycle_id and month_number = 2;
  select id into v_month_3 from public.cycle_months where cycle_id = v_cycle_id and month_number = 3;

  perform public.set_month_winner_and_generate_payments(
    v_month_1, member_ids[1], (select updated_at from public.cycle_months where id = v_month_1)
  );
  perform public.set_month_winner_and_generate_payments(
    v_month_2, member_ids[2], (select updated_at from public.cycle_months where id = v_month_2)
  );
  perform public.set_month_winner_and_generate_payments(
    v_month_3, member_ids[3], (select updated_at from public.cycle_months where id = v_month_3)
  );

  select updated_at into v_version from public.cycle_months where id = v_month_2;
  perform public.correct_month_winner_and_rebuild_payments(v_month_2, member_ids[4], v_version);
  assert (select winner_member_id = member_ids[4] from public.cycle_months where id = v_month_2),
    'Correction must replace the selected month winner';
  assert (select dhukuti_due = 0 and fixed_saving_due = 100 and interest_due = 0
    from public.member_monthly_payments where month_id = v_month_2 and member_id = member_ids[4]),
    'Replacement winner must owe fixed saving only';
  assert (select dhukuti_due = 2000 and interest_due = 0
    from public.member_monthly_payments where month_id = v_month_2 and member_id = member_ids[2]),
    'Incorrect winner must return to a normal Month 2 obligation';
  assert (select interest_due = 200
    from public.member_monthly_payments where month_id = v_month_3 and member_id = member_ids[4]),
    'Replacement winner must owe winner interest in later recorded months';
  assert (select interest_due = 0
    from public.member_monthly_payments where month_id = v_month_3 and member_id = member_ids[2]),
    'Removed winner must not owe later winner interest';

  begin
    perform public.correct_month_winner_and_rebuild_payments(
      v_month_2, member_ids[1], (select updated_at from public.cycle_months where id = v_month_2)
    );
    raise exception 'Duplicate winner correction accepted';
  exception when raise_exception then
    if sqlerrm <> 'This member has already won in this cycle' then raise; end if;
  end;

  begin
    perform public.correct_month_winner_and_rebuild_payments(v_month_2, member_ids[5], v_version);
    raise exception 'Stale winner correction accepted';
  exception when serialization_failure then null; end;

  select id, updated_at into v_paid_payment_id, v_version
  from public.member_monthly_payments
  where month_id = v_month_3
  order by member_id limit 1;
  perform public.mark_monthly_payment_paid(v_paid_payment_id, 'cash', v_version);
  begin
    perform public.correct_month_winner_and_rebuild_payments(
      v_month_2, member_ids[5], (select updated_at from public.cycle_months where id = v_month_2)
    );
    raise exception 'Correction with affected received payment accepted';
  exception when raise_exception then
    if sqlerrm <> 'Return affected received payments to pending before correcting the winner' then raise; end if;
  end;
  assert (select winner_member_id = member_ids[4] from public.cycle_months where id = v_month_2),
    'Rejected correction must preserve the current winner';
end
$$;

reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='member'), true);
set local role authenticated;
do $$ begin
  begin
    perform public.correct_month_winner_and_rebuild_payments(
      (select id from public.cycle_months where winner_member_id is not null limit 1),
      (select member_id from public.cycle_members limit 1),
      (select updated_at from public.cycle_months where winner_member_id is not null limit 1)
    );
    raise exception 'Member corrected a winner';
  exception when raise_exception then
    if sqlerrm <> 'Administrator access required' then raise; end if;
  end;
end $$;

reset role;
rollback;
select 'Winner correction checks passed; test data rolled back' as result;
