-- All fixtures and state changes are isolated in this transaction and roll back.
begin;

do $$
declare
  member_ids uuid[];
  v_cycle_id uuid;
  v_cycle_number integer;
  v_month_1 uuid;
  v_month_2 uuid;
begin
  insert into public.members(full_name)
  select '__Saving verification member ' || item || '__'
  from generate_series(1, 11) item;
  select array_agg(id order by full_name) into member_ids
  from public.members
  where full_name like '__Saving verification member %__';
  select coalesce(max(cycle_number), 0) + 100 into v_cycle_number
  from public.cycles;

  insert into public.cycles(
    cycle_number, status, member_count, contribution_amount,
    fixed_saving_amount, interest_amount, started_on, completed_on
  ) values (
    v_cycle_number, 'completed', 11, 2000, 100, 200,
    date '2026-09-01', date '2027-07-31'
  ) returning id into v_cycle_id;
  insert into public.cycle_members(cycle_id, member_id, display_order)
  select v_cycle_id, member_id, member_order::integer
  from unnest(member_ids) with ordinality selected(member_id, member_order);
  insert into public.cycle_months(
    cycle_id, month_number, scheduled_date, winner_member_id, status
  ) values (
    v_cycle_id, 1, date '2026-09-26', member_ids[1], 'completed'
  ) returning id into v_month_1;
  insert into public.cycle_months(
    cycle_id, month_number, scheduled_date, winner_member_id, status
  ) values (
    v_cycle_id, 2, date '2026-10-31', member_ids[2], 'completed'
  ) returning id into v_month_2;

  insert into public.member_monthly_payments(
    month_id, member_id, dhukuti_due, fixed_saving_due, interest_due,
    payment_status, payment_method, paid_at
  )
  select
    v_month_1,
    member_id,
    case when member_id = member_ids[1] then 0 else 2000 end,
    100,
    0,
    case when member_id = member_ids[2] then 'paid' else 'pending' end,
    case when member_id = member_ids[2] then 'cash' end,
    case when member_id = member_ids[2] then clock_timestamp() end
  from unnest(member_ids) selected(member_id);
  insert into public.member_monthly_payments(
    month_id, member_id, dhukuti_due, fixed_saving_due, interest_due,
    payment_status, payment_method, paid_at
  )
  select
    v_month_2,
    member_id,
    case when member_id = member_ids[2] then 0 else 2000 end,
    100,
    case when member_id = member_ids[1] then 200 else 0 end,
    case when member_id = member_ids[1] then 'paid' else 'pending' end,
    case when member_id = member_ids[1] then 'esewa' end,
    case when member_id = member_ids[1] then clock_timestamp() end
  from unnest(member_ids) selected(member_id);
end
$$;

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.profiles where role = 'admin'),
  true
);
set local role authenticated;

do $$
declare
  v_cycle_id uuid;
  v_month_id uuid;
  v_member_id uuid;
  v_contribution_id uuid;
  v_contribution_version timestamptz;
begin
  select c.id into v_cycle_id
  from public.cycles c
  join public.members m on m.full_name = '__Saving verification member 1__'
  join public.cycle_members cm on cm.cycle_id = c.id and cm.member_id = m.id;
  select id into v_month_id from public.cycle_months
  where cycle_id = v_cycle_id and month_number = 2;
  select member_id into v_member_id from public.cycle_members
  where cycle_id = v_cycle_id order by display_order limit 1;

  select public.add_extra_contribution(
    v_cycle_id, v_month_id, v_member_id, 500, 'bank_transfer',
    '  Community support  '
  ) into v_contribution_id;
  assert (
    select amount = 500
      and payment_method = 'bank_transfer'
      and reason = 'Community support'
    from public.extra_contributions
    where id = v_contribution_id
  ), 'Contribution must normalize and preserve its trusted fields';

  assert (
    select fixed_saving_received = 200
      and interest_received = 200
      and extra_contributions = 500
      and actual_cycle_saving = 900
      and pending_fixed_saving = 2000
      and pending_interest = 0
    from public.saving_fund_summary
    where cycle_id = v_cycle_id
  ), 'Saving summary must include received components and exclude pending saving';

  select updated_at into v_contribution_version
  from public.extra_contributions where id = v_contribution_id;
  perform public.update_extra_contribution(
    v_contribution_id, v_contribution_version, 700, 'cash', null
  );
  assert (
    select amount = 700 and payment_method = 'cash' and reason is null
    from public.extra_contributions where id = v_contribution_id
  ), 'Correction must update allowed contribution fields';
  assert (
    select extra_contributions = 700 and actual_cycle_saving = 1100
    from public.saving_fund_summary where cycle_id = v_cycle_id
  ), 'Contribution correction must recalculate the saving summary';

  -- Same-value retries succeed even if the caller still holds the old version.
  perform public.update_extra_contribution(
    v_contribution_id, v_contribution_version, 700, 'cash', null
  );
  begin
    perform public.update_extra_contribution(
      v_contribution_id, v_contribution_version, 800, 'cash', null
    );
    raise exception 'Stale contribution correction accepted';
  exception when serialization_failure then null; end;

  begin
    perform public.add_extra_contribution(
      v_cycle_id, v_month_id, v_member_id, 0, 'cash', null
    );
    raise exception 'Non-positive contribution accepted';
  exception when raise_exception then
    if sqlerrm = 'Non-positive contribution accepted' then raise; end if;
  end;
  begin
    perform public.add_extra_contribution(
      v_cycle_id, v_month_id, v_member_id, 100, 'card', null
    );
    raise exception 'Invalid contribution method accepted';
  exception when raise_exception then
    if sqlerrm = 'Invalid contribution method accepted' then raise; end if;
  end;
  begin
    perform public.add_extra_contribution(
      v_cycle_id, gen_random_uuid(), v_member_id, 100, 'cash', null
    );
    raise exception 'Foreign month accepted';
  exception when raise_exception then
    if sqlerrm = 'Foreign month accepted' then raise; end if;
  end;

  assert not has_table_privilege(
    'authenticated', 'public.extra_contributions', 'INSERT'
  ) and not has_table_privilege(
    'authenticated', 'public.extra_contributions', 'UPDATE'
  ) and not has_table_privilege(
    'authenticated', 'public.extra_contributions', 'DELETE'
  ), 'Authenticated clients must not write contributions directly';
end
$$;

reset role;
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.profiles where role = 'member'),
  true
);
set local role authenticated;
do $$ begin
  assert exists (
    select 1
    from public.extra_contributions e
    join public.members m on m.id = e.member_id
    where m.full_name like '__Saving verification member %__'
  ), 'Member must read extra contributions for a visible cycle';
  assert exists (
    select 1 from public.saving_fund_summary s
    join public.cycles c on c.id = s.cycle_id
    join public.cycle_members cm on cm.cycle_id = c.id
    join public.members m on m.id = cm.member_id
    where m.full_name = '__Saving verification member 1__'
  ), 'Member must read the saving summary for a visible cycle';
  begin
    perform public.add_extra_contribution(
      (select c.id from public.cycles c
       join public.cycle_members cm on cm.cycle_id = c.id
       join public.members m on m.id = cm.member_id
       where m.full_name = '__Saving verification member 1__'),
      null,
      (select id from public.members
       where full_name = '__Saving verification member 1__'),
      100,
      'cash',
      null
    );
    raise exception 'Member added an extra contribution';
  exception when raise_exception then
    if sqlerrm = 'Member added an extra contribution' then raise; end if;
  end;
end $$;

reset role;
set local role anon;
do $$ begin
  assert not has_table_privilege(
    'anon', 'public.extra_contributions', 'SELECT'
  ), 'Anonymous contribution reads must be denied';
  assert not has_table_privilege(
    'anon', 'public.saving_fund_summary', 'SELECT'
  ), 'Anonymous saving summary reads must be denied';
end $$;
reset role;

rollback;
select 'Saving fund and extra contribution checks passed; test data rolled back' as result;
