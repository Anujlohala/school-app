begin;

create function public.mark_monthly_payment_paid(
  p_payment_id uuid,
  p_method text,
  p_expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.member_monthly_payments%rowtype;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_method is null or p_method not in ('esewa', 'bank_transfer', 'cash') then
    raise exception 'Choose a valid payment method';
  end if;

  select * into v_payment
  from public.member_monthly_payments
  where id = p_payment_id
  for update;
  if not found then raise exception 'Payment not found'; end if;

  -- A repeated request after an uncertain response is a successful no-op.
  if v_payment.payment_status = 'paid' and v_payment.payment_method = p_method then
    return;
  end if;
  if v_payment.payment_status = 'paid' then
    raise exception 'Return this payment to pending before changing its method';
  end if;
  if p_expected_updated_at is null or v_payment.updated_at <> p_expected_updated_at then
    raise exception 'This payment changed since it was reviewed' using errcode = '40001';
  end if;

  update public.member_monthly_payments
  set payment_status = 'paid', payment_method = p_method, paid_at = clock_timestamp()
  where id = p_payment_id;
end
$$;

create function public.mark_monthly_payment_pending(
  p_payment_id uuid,
  p_expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.member_monthly_payments%rowtype;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select * into v_payment
  from public.member_monthly_payments
  where id = p_payment_id
  for update;
  if not found then raise exception 'Payment not found'; end if;

  if v_payment.payment_status = 'pending' then return; end if;
  if p_expected_updated_at is null or v_payment.updated_at <> p_expected_updated_at then
    raise exception 'This payment changed since it was reviewed' using errcode = '40001';
  end if;

  update public.member_monthly_payments
  set payment_status = 'pending', payment_method = null, paid_at = null
  where id = p_payment_id;
end
$$;

revoke all on function public.mark_monthly_payment_paid(uuid, text, timestamptz)
from public, anon;
revoke all on function public.mark_monthly_payment_pending(uuid, timestamptz)
from public, anon;
grant execute on function public.mark_monthly_payment_paid(uuid, text, timestamptz)
to authenticated;
grant execute on function public.mark_monthly_payment_pending(uuid, timestamptz)
to authenticated;

commit;
