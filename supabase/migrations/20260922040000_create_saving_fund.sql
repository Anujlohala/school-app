begin;

alter table public.cycle_months
  add constraint cycle_months_cycle_id_id_unique unique (cycle_id, id);

create table public.extra_contributions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id),
  month_id uuid,
  member_id uuid not null,
  amount integer not null check (amount > 0),
  payment_method text not null
    check (payment_method in ('esewa', 'bank_transfer', 'cash')),
  reason text check (
    reason is null
    or (reason = btrim(reason) and char_length(reason) between 1 and 240)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (cycle_id, member_id)
    references public.cycle_members(cycle_id, member_id),
  foreign key (cycle_id, month_id)
    references public.cycle_months(cycle_id, id)
);

create index extra_contributions_cycle_created
  on public.extra_contributions(cycle_id, created_at desc);
create index extra_contributions_member
  on public.extra_contributions(member_id);

alter table public.extra_contributions enable row level security;
revoke all on table public.extra_contributions from public, anon, authenticated;
grant select on table public.extra_contributions to authenticated;

create policy extra_contributions_read
on public.extra_contributions for select to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.cycles c
    join public.profiles p on p.user_id = (select auth.uid())
    where c.id = cycle_id and c.status <> 'draft' and p.role = 'member'
  )
);

create function public.set_extra_contribution_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end $$;
revoke all on function public.set_extra_contribution_updated_at()
from public, anon, authenticated;
create trigger extra_contributions_updated_at
before update on public.extra_contributions
for each row execute function public.set_extra_contribution_updated_at();

create function public.add_extra_contribution(
  p_cycle_id uuid,
  p_month_id uuid,
  p_member_id uuid,
  p_amount integer,
  p_method text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contribution_id uuid;
  v_reason text := nullif(pg_catalog.btrim(p_reason), '');
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Contribution amount must be a positive whole NPR value';
  end if;
  if p_method is null or p_method not in ('esewa', 'bank_transfer', 'cash') then
    raise exception 'Choose a valid payment method';
  end if;
  if v_reason is not null and pg_catalog.char_length(v_reason) > 240 then
    raise exception 'Contribution reason is too long';
  end if;
  if not exists (
    select 1 from public.cycles
    where id = p_cycle_id and status <> 'draft'
  ) then
    raise exception 'Extra contributions cannot be recorded against a draft cycle';
  end if;
  if not exists (
    select 1 from public.cycle_members
    where cycle_id = p_cycle_id and member_id = p_member_id
  ) then
    raise exception 'Contributor does not belong to this cycle';
  end if;
  if p_month_id is not null and not exists (
    select 1 from public.cycle_months
    where id = p_month_id and cycle_id = p_cycle_id
  ) then
    raise exception 'Month does not belong to this cycle';
  end if;

  insert into public.extra_contributions(
    cycle_id, month_id, member_id, amount, payment_method, reason
  ) values (
    p_cycle_id, p_month_id, p_member_id, p_amount, p_method, v_reason
  ) returning id into v_contribution_id;
  return v_contribution_id;
end
$$;

create function public.update_extra_contribution(
  p_contribution_id uuid,
  p_expected_updated_at timestamptz,
  p_amount integer,
  p_method text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contribution public.extra_contributions%rowtype;
  v_reason text := nullif(pg_catalog.btrim(p_reason), '');
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Contribution amount must be a positive whole NPR value';
  end if;
  if p_method is null or p_method not in ('esewa', 'bank_transfer', 'cash') then
    raise exception 'Choose a valid payment method';
  end if;
  if v_reason is not null and pg_catalog.char_length(v_reason) > 240 then
    raise exception 'Contribution reason is too long';
  end if;

  select * into v_contribution
  from public.extra_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  -- A repeated request after an uncertain response is a successful no-op.
  if v_contribution.amount = p_amount
     and v_contribution.payment_method = p_method
     and v_contribution.reason is not distinct from v_reason then
    return;
  end if;
  if p_expected_updated_at is null
     or v_contribution.updated_at <> p_expected_updated_at then
    raise exception 'This contribution changed since it was reviewed'
      using errcode = '40001';
  end if;

  update public.extra_contributions
  set amount = p_amount, payment_method = p_method, reason = v_reason
  where id = p_contribution_id;
end
$$;

revoke all on function public.add_extra_contribution(uuid, uuid, uuid, integer, text, text)
from public, anon;
revoke all on function public.update_extra_contribution(uuid, timestamptz, integer, text, text)
from public, anon;
grant execute on function public.add_extra_contribution(uuid, uuid, uuid, integer, text, text)
to authenticated;
grant execute on function public.update_extra_contribution(uuid, timestamptz, integer, text, text)
to authenticated;

create view public.saving_fund_summary
with (security_invoker = true)
as
with payment_totals as (
  select
    cm.cycle_id,
    coalesce(sum(p.fixed_saving_due) filter (where p.payment_status = 'paid'), 0)::bigint
      as fixed_saving_received,
    coalesce(sum(p.interest_due) filter (where p.payment_status = 'paid'), 0)::bigint
      as interest_received,
    coalesce(sum(p.fixed_saving_due) filter (where p.payment_status = 'pending'), 0)::bigint
      as pending_fixed_saving,
    coalesce(sum(p.interest_due) filter (where p.payment_status = 'pending'), 0)::bigint
      as pending_interest
  from public.cycle_months cm
  left join public.member_monthly_payments p on p.month_id = cm.id
  group by cm.cycle_id
), contribution_totals as (
  select cycle_id, sum(amount)::bigint as extra_contributions
  from public.extra_contributions
  group by cycle_id
), cycle_savings as (
  select
    c.id as cycle_id,
    c.cycle_number,
    coalesce(p.fixed_saving_received, 0)::bigint as fixed_saving_received,
    coalesce(p.interest_received, 0)::bigint as interest_received,
    coalesce(e.extra_contributions, 0)::bigint as extra_contributions,
    coalesce(p.pending_fixed_saving, 0)::bigint as pending_fixed_saving,
    coalesce(p.pending_interest, 0)::bigint as pending_interest,
    (
      coalesce(p.fixed_saving_received, 0)
      + coalesce(p.interest_received, 0)
      + coalesce(e.extra_contributions, 0)
    )::bigint as actual_cycle_saving
  from public.cycles c
  left join payment_totals p on p.cycle_id = c.id
  left join contribution_totals e on e.cycle_id = c.id
)
select
  cycle_id,
  cycle_number,
  fixed_saving_received,
  interest_received,
  extra_contributions,
  pending_fixed_saving,
  pending_interest,
  actual_cycle_saving,
  coalesce(
    sum(actual_cycle_saving) over (
      order by cycle_number rows between unbounded preceding and 1 preceding
    ),
    0
  )::bigint as carried_from_previous_cycles,
  sum(actual_cycle_saving) over (
    order by cycle_number rows between unbounded preceding and current row
  )::bigint as cumulative_balance
from cycle_savings;

revoke all on table public.saving_fund_summary from public, anon, authenticated;
grant select on table public.saving_fund_summary to authenticated;

commit;
