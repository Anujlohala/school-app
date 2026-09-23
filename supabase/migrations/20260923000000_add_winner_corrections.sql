begin;

create function public.correct_month_winner_and_rebuild_payments(
  p_month_id uuid,
  p_new_winner_member_id uuid,
  p_expected_updated_at timestamptz
)
returns table (
  month_id uuid,
  previous_winner_member_id uuid,
  winner_member_id uuid,
  winner_name text,
  rebuilt_payment_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month public.cycle_months%rowtype;
  v_cycle public.cycles%rowtype;
  v_previous_winner_member_id uuid;
  v_winner_name text;
  v_recorded_month_count integer;
  v_existing_payment_count integer;
  v_rebuilt_payment_count integer;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select * into v_month
  from public.cycle_months
  where id = p_month_id
  for update;
  if not found then raise exception 'Month not found'; end if;

  select * into v_cycle
  from public.cycles
  where id = v_month.cycle_id
  for update;
  if v_cycle.status not in ('active', 'completed') then
    raise exception 'Only an active or completed cycle winner can be corrected';
  end if;

  perform 1
  from public.cycle_months
  where cycle_id = v_month.cycle_id
  order by month_number
  for update;

  select * into v_month
  from public.cycle_months
  where id = p_month_id;
  if p_expected_updated_at is null or v_month.updated_at <> p_expected_updated_at then
    raise exception 'This month changed since it was reviewed' using errcode = '40001';
  end if;
  if v_month.winner_member_id is null then raise exception 'This month has no winner to correct'; end if;
  if p_new_winner_member_id = v_month.winner_member_id then
    raise exception 'Choose a different winner';
  end if;

  select m.full_name into v_winner_name
  from public.cycle_members cm
  join public.members m on m.id = cm.member_id
  where cm.cycle_id = v_month.cycle_id
    and cm.member_id = p_new_winner_member_id;
  if not found then raise exception 'Winner must belong to this cycle'; end if;
  if exists (
    select 1
    from public.cycle_months other_month
    where other_month.cycle_id = v_month.cycle_id
      and other_month.id <> v_month.id
      and other_month.winner_member_id = p_new_winner_member_id
  ) then
    raise exception 'This member has already won in this cycle';
  end if;

  perform 1
  from public.member_monthly_payments payment
  join public.cycle_months affected_month on affected_month.id = payment.month_id
  where affected_month.cycle_id = v_month.cycle_id
    and affected_month.month_number >= v_month.month_number
  order by affected_month.month_number, payment.member_id
  for update of payment;

  if exists (
    select 1
    from public.member_monthly_payments payment
    join public.cycle_months affected_month on affected_month.id = payment.month_id
    where affected_month.cycle_id = v_month.cycle_id
      and affected_month.month_number >= v_month.month_number
      and payment.payment_status = 'paid'
  ) then
    raise exception 'Return affected received payments to pending before correcting the winner';
  end if;

  select count(*) into v_recorded_month_count
  from public.cycle_months affected_month
  where affected_month.cycle_id = v_month.cycle_id
    and affected_month.month_number >= v_month.month_number
    and affected_month.winner_member_id is not null;

  select count(*) into v_existing_payment_count
  from public.member_monthly_payments payment
  join public.cycle_months affected_month on affected_month.id = payment.month_id
  where affected_month.cycle_id = v_month.cycle_id
    and affected_month.month_number >= v_month.month_number
    and affected_month.winner_member_id is not null;
  if v_existing_payment_count <> v_recorded_month_count * v_cycle.member_count then
    raise exception 'Affected months do not contain every member obligation';
  end if;

  v_previous_winner_member_id := v_month.winner_member_id;
  update public.cycle_months
  set winner_member_id = p_new_winner_member_id
  where id = p_month_id;

  update public.member_monthly_payments payment
  set
    dhukuti_due = case
      when payment.member_id = affected_month.winner_member_id then 0
      else v_cycle.contribution_amount
    end,
    fixed_saving_due = v_cycle.fixed_saving_amount,
    interest_due = case
      when payment.member_id <> affected_month.winner_member_id
        and exists (
          select 1
          from public.cycle_months previous_win
          where previous_win.cycle_id = affected_month.cycle_id
            and previous_win.month_number < affected_month.month_number
            and previous_win.winner_member_id = payment.member_id
        ) then v_cycle.interest_amount
      else 0
    end
  from public.cycle_months affected_month
  where payment.month_id = affected_month.id
    and affected_month.cycle_id = v_month.cycle_id
    and affected_month.month_number >= v_month.month_number
    and affected_month.winner_member_id is not null;
  get diagnostics v_rebuilt_payment_count = row_count;

  if v_rebuilt_payment_count <> v_existing_payment_count then
    raise exception 'Could not rebuild every affected member obligation';
  end if;

  return query select
    v_month.id,
    v_previous_winner_member_id,
    p_new_winner_member_id,
    v_winner_name,
    v_rebuilt_payment_count;
end
$$;

revoke all on function public.correct_month_winner_and_rebuild_payments(uuid, uuid, timestamptz)
from public, anon;
grant execute on function public.correct_month_winner_and_rebuild_payments(uuid, uuid, timestamptz)
to authenticated;

commit;
