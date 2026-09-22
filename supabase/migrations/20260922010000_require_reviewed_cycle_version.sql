begin;

-- The cycle foundation has already been applied to development. Replace the
-- original RPC so clients cannot bypass the reviewed-version check.
drop function public.activate_cycle(uuid);

create function public.activate_cycle(p_cycle_id uuid, p_expected_updated_at timestamptz)
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

revoke all on function public.activate_cycle(uuid, timestamptz) from public, anon;
grant execute on function public.activate_cycle(uuid, timestamptz) to authenticated;

commit;
