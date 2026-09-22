begin;

create table public.member_monthly_payments (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.cycle_months(id),
  member_id uuid not null references public.members(id),
  dhukuti_due integer not null check (dhukuti_due >= 0),
  fixed_saving_due integer not null check (fixed_saving_due >= 0),
  interest_due integer not null check (interest_due >= 0),
  total_due integer generated always as
    (dhukuti_due + fixed_saving_due + interest_due) stored,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid')),
  payment_method text check (payment_method in ('esewa', 'bank_transfer', 'cash')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month_id, member_id),
  constraint member_monthly_payments_settlement check (
    (payment_status = 'pending' and payment_method is null and paid_at is null)
    or (payment_status = 'paid' and payment_method is not null and paid_at is not null)
  )
);

alter table public.member_monthly_payments enable row level security;
revoke all on table public.member_monthly_payments from public, anon, authenticated;
grant select on table public.member_monthly_payments to authenticated;

create policy member_monthly_payments_read
on public.member_monthly_payments for select to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.cycle_months cm
    join public.cycles c on c.id = cm.cycle_id
    join public.profiles p on p.user_id = (select auth.uid())
    where cm.id = month_id and c.status <> 'draft' and p.role = 'member'
  )
);

create function public.set_member_monthly_payment_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end $$;
revoke all on function public.set_member_monthly_payment_updated_at()
from public, anon, authenticated;
create trigger member_monthly_payments_updated_at
before update on public.member_monthly_payments
for each row execute function public.set_member_monthly_payment_updated_at();

create function public.set_month_winner_and_generate_payments(
  p_month_id uuid,
  p_winner_member_id uuid,
  p_expected_updated_at timestamptz
)
returns table (
  month_id uuid,
  winner_member_id uuid,
  winner_name text,
  payout integer,
  generated_payment_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month public.cycle_months%rowtype;
  v_cycle public.cycles%rowtype;
  v_winner_name text;
  v_generated integer;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select * into v_month from public.cycle_months where id = p_month_id for update;
  if not found then raise exception 'Month not found'; end if;
  select * into v_cycle from public.cycles where id = v_month.cycle_id for update;
  if v_cycle.status <> 'active' then raise exception 'Only an active cycle can record a winner'; end if;
  if p_expected_updated_at is null or v_month.updated_at <> p_expected_updated_at then
    raise exception 'This month changed since it was reviewed' using errcode = '40001';
  end if;
  if v_month.winner_member_id is not null or v_month.status <> 'draft' then
    raise exception 'This month already has a winner';
  end if;
  if exists (
    select 1 from public.cycle_months earlier
    where earlier.cycle_id = v_month.cycle_id
      and earlier.month_number < v_month.month_number
      and earlier.winner_member_id is null
  ) then
    raise exception 'Record earlier month winners first';
  end if;

  select m.full_name into v_winner_name
  from public.cycle_members cm
  join public.members m on m.id = cm.member_id
  where cm.cycle_id = v_month.cycle_id and cm.member_id = p_winner_member_id;
  if not found then raise exception 'Winner must belong to this cycle'; end if;
  if exists (
    select 1 from public.cycle_months other_month
    where other_month.cycle_id = v_month.cycle_id
      and other_month.winner_member_id = p_winner_member_id
  ) then
    raise exception 'This member has already won in this cycle';
  end if;

  update public.cycle_months
  set winner_member_id = p_winner_member_id, status = 'open'
  where id = p_month_id;

  insert into public.member_monthly_payments(
    month_id, member_id, dhukuti_due, fixed_saving_due, interest_due
  )
  select
    v_month.id,
    cm.member_id,
    case when cm.member_id = p_winner_member_id then 0 else v_cycle.contribution_amount end,
    v_cycle.fixed_saving_amount,
    case
      when cm.member_id <> p_winner_member_id and exists (
        select 1 from public.cycle_months previous_win
        where previous_win.cycle_id = v_month.cycle_id
          and previous_win.month_number < v_month.month_number
          and previous_win.winner_member_id = cm.member_id
      ) then v_cycle.interest_amount
      else 0
    end
  from public.cycle_members cm
  where cm.cycle_id = v_month.cycle_id;
  get diagnostics v_generated = row_count;
  if v_generated <> v_cycle.member_count then
    raise exception 'Could not generate every member obligation';
  end if;

  return query select
    v_month.id,
    p_winner_member_id,
    v_winner_name,
    (v_cycle.member_count - 1) * v_cycle.contribution_amount,
    v_generated;
end
$$;

revoke all on function public.set_month_winner_and_generate_payments(uuid, uuid, timestamptz)
from public, anon;
grant execute on function public.set_month_winner_and_generate_payments(uuid, uuid, timestamptz)
to authenticated;

commit;
