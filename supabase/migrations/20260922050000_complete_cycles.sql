begin;

create or replace function public.activate_cycle(
  p_cycle_id uuid,
  p_expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
  v_member_count integer;
  v_month integer;
  v_month_end date;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_cycle from public.cycles where id = p_cycle_id for update;
  if not found or v_cycle.status <> 'draft' then
    raise exception 'Only a draft cycle can be activated';
  end if;
  if p_expected_updated_at is null or v_cycle.updated_at <> p_expected_updated_at then
    raise exception 'This cycle changed since it was reviewed' using errcode = '40001';
  end if;
  if exists (select 1 from public.cycles where status = 'active' and id <> p_cycle_id) then
    raise exception 'An active cycle already exists; complete it before activating another cycle';
  end if;
  select count(*) into v_member_count
  from public.cycle_members cm
  join public.members m on m.id = cm.member_id
  where cm.cycle_id = p_cycle_id and m.active;
  if v_member_count <> 11 then raise exception 'Cycle requires 11 active members'; end if;
  if v_cycle.contribution_amount <= 0
     or v_cycle.fixed_saving_amount < 0
     or v_cycle.interest_amount < 0 then
    raise exception 'Cycle amounts are invalid';
  end if;
  if exists (select 1 from public.cycle_months where cycle_id = p_cycle_id) then
    raise exception 'Cycle schedule already exists';
  end if;

  for v_month in 1..11 loop
    v_month_end := (
      pg_catalog.date_trunc('month', v_cycle.started_on)
      + pg_catalog.make_interval(months => v_month)
      - interval '1 day'
    )::date;
    insert into public.cycle_months(cycle_id, month_number, scheduled_date)
    values (
      p_cycle_id,
      v_month,
      v_month_end - ((extract(dow from v_month_end)::integer + 1) % 7)
    );
  end loop;
  update public.cycles set status = 'active', member_count = v_member_count
  where id = p_cycle_id;
end
$$;

create function public.complete_cycle(
  p_cycle_id uuid,
  p_expected_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle public.cycles%rowtype;
  v_reviewed_updated_at timestamptz;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select * into v_cycle
  from public.cycles
  where id = p_cycle_id
  for update;
  if not found or v_cycle.status <> 'active' then
    raise exception 'Only an active cycle can be completed';
  end if;

  perform 1 from public.cycle_months where cycle_id = p_cycle_id for update;
  perform 1
  from public.member_monthly_payments p
  join public.cycle_months cm on cm.id = p.month_id
  where cm.cycle_id = p_cycle_id
  for update of p;

  select max(reviewed_at) into v_reviewed_updated_at
  from (
    select v_cycle.updated_at as reviewed_at
    union all
    select updated_at from public.cycle_months where cycle_id = p_cycle_id
    union all
    select p.updated_at
    from public.member_monthly_payments p
    join public.cycle_months cm on cm.id = p.month_id
    where cm.cycle_id = p_cycle_id
  ) versions;
  if p_expected_updated_at is null or v_reviewed_updated_at <> p_expected_updated_at then
    raise exception 'This cycle changed since it was reviewed' using errcode = '40001';
  end if;

  if v_cycle.member_count <> 11
     or (select count(*) from public.cycle_months where cycle_id = p_cycle_id) <> v_cycle.member_count
     or (select count(*) from public.cycle_members where cycle_id = p_cycle_id) <> v_cycle.member_count
     or (select count(*) from public.cycle_months where cycle_id = p_cycle_id and winner_member_id is not null) <> v_cycle.member_count
     or (select count(distinct winner_member_id) from public.cycle_months where cycle_id = p_cycle_id) <> v_cycle.member_count
     or exists (
       select 1
       from public.cycle_months cm
       left join public.member_monthly_payments p on p.month_id = cm.id
       where cm.cycle_id = p_cycle_id
       group by cm.id
       having count(p.id) <> v_cycle.member_count
     ) then
    raise exception 'Cycle is not ready for completion';
  end if;

  update public.cycle_months set status = 'completed' where cycle_id = p_cycle_id;
  update public.cycles
  set status = 'completed',
      completed_on = (clock_timestamp() at time zone 'Asia/Kathmandu')::date
  where id = p_cycle_id;
end
$$;

revoke all on function public.complete_cycle(uuid, timestamptz) from public, anon;
grant execute on function public.complete_cycle(uuid, timestamptz) to authenticated;

commit;
