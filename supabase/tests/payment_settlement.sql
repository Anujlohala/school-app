-- Existing development profiles; all fixtures and temporary state changes roll back.
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
  v_month_id uuid;
  v_winner_id uuid;
  v_payment_id uuid;
  v_version timestamptz;
  v_original_total integer;
begin
  insert into public.members(full_name)
  select '__Payment verification member ' || item || '__'
  from generate_series(1, 11) item;
  select array_agg(id order by full_name) into member_ids
  from public.members where full_name like '__Payment verification member %__';
  v_winner_id := member_ids[1];

  select public.save_draft_cycle(null, null, date '2026-09-01', 2000, 100, 200, member_ids)
  into v_cycle_id;
  select updated_at into v_version from public.cycles where id = v_cycle_id;
  perform public.activate_cycle(v_cycle_id, v_version);
  select id into v_month_id
  from public.cycle_months where cycle_id = v_cycle_id and month_number = 1;
  perform public.set_month_winner_and_generate_payments(
    v_month_id, v_winner_id,
    (select updated_at from public.cycle_months where id = v_month_id)
  );
  select id, updated_at, total_due into v_payment_id, v_version, v_original_total
  from public.member_monthly_payments
  where month_id = v_month_id and member_id <> v_winner_id
  order by member_id limit 1;

  begin
    perform public.mark_monthly_payment_paid(v_payment_id, 'card', v_version);
    raise exception 'Invalid payment method accepted';
  exception when raise_exception then
    if sqlerrm = 'Invalid payment method accepted' then raise; end if;
  end;
  assert (select payment_status = 'pending' from public.member_monthly_payments where id = v_payment_id),
    'Rejected method must preserve pending state';

  perform public.mark_monthly_payment_paid(v_payment_id, 'cash', v_version);
  assert (select payment_status = 'paid' and payment_method = 'cash' and paid_at is not null
    and total_due = v_original_total from public.member_monthly_payments where id = v_payment_id),
    'Paid transition must store method and time without changing the obligation';

  -- Same-method retries are successful even when the caller still has the pre-update version.
  perform public.mark_monthly_payment_paid(v_payment_id, 'cash', v_version);
  begin
    perform public.mark_monthly_payment_paid(v_payment_id, 'esewa', v_version);
    raise exception 'Paid method changed without correction';
  exception when raise_exception then
    if sqlerrm = 'Paid method changed without correction' then raise; end if;
  end;

  begin
    perform public.mark_monthly_payment_pending(v_payment_id, v_version);
    raise exception 'Stale correction accepted';
  exception when serialization_failure then null; end;
  select updated_at into v_version from public.member_monthly_payments where id = v_payment_id;
  perform public.mark_monthly_payment_pending(v_payment_id, v_version);
  assert (select payment_status = 'pending' and payment_method is null and paid_at is null
    and total_due = v_original_total from public.member_monthly_payments where id = v_payment_id),
    'Correction must clear settlement data and preserve the obligation';

  begin
    update public.member_monthly_payments set payment_status = 'paid' where id = v_payment_id;
    raise exception 'Direct authenticated payment update accepted';
  exception when insufficient_privilege then null; end;
end
$$;

reset role;
select set_config('request.jwt.claim.sub', (select user_id::text from public.profiles where role='member'), true);
set local role authenticated;
do $$ begin
  assert (
    select count(*) = 11
    from public.member_monthly_payments p
    join public.members m on m.id = p.member_id
    where m.full_name like '__Payment verification member %__'
  ),
    'Member must read all generated payment records';
  begin
    perform public.mark_monthly_payment_paid(
      (select id from public.member_monthly_payments limit 1),
      'cash',
      (select updated_at from public.member_monthly_payments limit 1)
    );
    raise exception 'Member marked a payment paid';
  exception when raise_exception then
    if sqlerrm = 'Member marked a payment paid' then raise; end if;
  end;
end $$;

reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.member_monthly_payments;
    raise exception 'Anonymous payment read accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

rollback;
select 'Payment settlement and correction checks passed; test data rolled back' as result;
