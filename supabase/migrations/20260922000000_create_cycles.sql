begin;

create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  cycle_number integer not null unique check (cycle_number > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  member_count integer not null default 0 check (member_count between 0 and 11),
  contribution_amount integer not null check (contribution_amount > 0),
  fixed_saving_amount integer not null check (fixed_saving_amount >= 0),
  interest_amount integer not null check (interest_amount >= 0),
  started_on date not null check (extract(day from started_on) = 1),
  completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cycles_completion_state check (
    (status = 'completed' and completed_on is not null)
    or (status <> 'completed' and completed_on is null)
  )
);

create unique index cycles_one_draft on public.cycles ((true)) where status = 'draft';
create unique index cycles_one_active on public.cycles ((true)) where status = 'active';

create table public.cycle_members (
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  member_id uuid not null references public.members(id),
  display_order integer not null check (display_order between 1 and 11),
  created_at timestamptz not null default now(),
  primary key (cycle_id, member_id),
  unique (cycle_id, display_order)
);

create table public.cycle_months (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id),
  month_number integer not null check (month_number between 1 and 11),
  scheduled_date date not null,
  date_overridden boolean not null default false,
  winner_member_id uuid,
  status text not null default 'draft' check (status in ('draft', 'open', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, month_number),
  foreign key (cycle_id, winner_member_id)
    references public.cycle_members(cycle_id, member_id)
);

create unique index cycle_months_one_win_per_member
  on public.cycle_months(cycle_id, winner_member_id)
  where winner_member_id is not null;

alter table public.cycles enable row level security;
alter table public.cycle_members enable row level security;
alter table public.cycle_months enable row level security;

revoke all on table public.cycles from public, anon, authenticated;
revoke all on table public.cycle_members from public, anon, authenticated;
revoke all on table public.cycle_months from public, anon, authenticated;
grant select on table public.cycles, public.cycle_members, public.cycle_months to authenticated;

create policy cycles_read on public.cycles for select to authenticated
using (
  (select public.is_admin())
  or (
    status <> 'draft'
    and exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role = 'member'
    )
  )
);

create policy cycle_members_read on public.cycle_members for select to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1 from public.cycles c
    join public.profiles p on p.user_id = (select auth.uid())
    where c.id = cycle_id and c.status <> 'draft' and p.role = 'member'
  )
);

create policy cycle_months_read on public.cycle_months for select to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1 from public.cycles c
    join public.profiles p on p.user_id = (select auth.uid())
    where c.id = cycle_id and c.status <> 'draft' and p.role = 'member'
  )
);

create function public.set_cycle_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end $$;
revoke all on function public.set_cycle_updated_at() from public, anon, authenticated;
create trigger cycles_updated_at before update on public.cycles
for each row execute function public.set_cycle_updated_at();

create function public.set_cycle_month_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end $$;
revoke all on function public.set_cycle_month_updated_at() from public, anon, authenticated;
create trigger cycle_months_updated_at before update on public.cycle_months
for each row execute function public.set_cycle_month_updated_at();

create function public.save_draft_cycle(
  p_cycle_id uuid,
  p_expected_updated_at timestamptz,
  p_started_on date,
  p_contribution_amount integer,
  p_fixed_saving_amount integer,
  p_interest_amount integer,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle_id uuid;
  v_cycle_number integer;
  v_cycle public.cycles%rowtype;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_started_on is null or extract(day from p_started_on) <> 1 then
    raise exception 'Choose a valid starting month';
  end if;
  if p_contribution_amount <= 0 or p_fixed_saving_amount < 0 or p_interest_amount < 0 then
    raise exception 'Cycle amounts are invalid';
  end if;
  if coalesce(cardinality(p_member_ids), 0) <> 11
     or (
       select count(distinct member_id)
       from unnest(p_member_ids) as selected(member_id)
     ) <> 11 then
    raise exception 'Select exactly 11 unique members';
  end if;
  if (select count(*) from public.members where id = any(p_member_ids) and active) <> 11 then
    raise exception 'Every selected member must be active';
  end if;

  if p_cycle_id is null then
    perform pg_catalog.pg_advisory_xact_lock(2068, 1);
    select coalesce(max(cycle_number), 0) + 1 into v_cycle_number from public.cycles;
    insert into public.cycles(
      cycle_number, contribution_amount, fixed_saving_amount, interest_amount, started_on
    ) values (
      v_cycle_number, p_contribution_amount, p_fixed_saving_amount, p_interest_amount, p_started_on
    ) returning id into v_cycle_id;
  else
    select * into v_cycle from public.cycles where id = p_cycle_id for update;
    if not found or v_cycle.status <> 'draft' then
      raise exception 'Only a draft cycle can be changed';
    end if;
    if p_expected_updated_at is null or v_cycle.updated_at <> p_expected_updated_at then
      raise exception 'This cycle changed since the page was loaded';
    end if;
    update public.cycles set
      contribution_amount = p_contribution_amount,
      fixed_saving_amount = p_fixed_saving_amount,
      interest_amount = p_interest_amount,
      started_on = p_started_on
    where id = p_cycle_id;
    delete from public.cycle_members where cycle_id = p_cycle_id;
    v_cycle_id := p_cycle_id;
  end if;

  insert into public.cycle_members(cycle_id, member_id, display_order)
  select v_cycle_id, member_id, member_order::integer
  from unnest(p_member_ids) with ordinality selected(member_id, member_order);
  return v_cycle_id;
end
$$;

create function public.activate_cycle(p_cycle_id uuid)
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

create function public.override_meeting_date(p_month_id uuid, p_scheduled_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_scheduled_date is null then raise exception 'Choose a valid meeting date'; end if;
  update public.cycle_months cm set
    scheduled_date = p_scheduled_date,
    date_overridden = true
  from public.cycles c
  where cm.id = p_month_id and c.id = cm.cycle_id and c.status = 'active';
  if not found then raise exception 'Only an active cycle schedule can be changed'; end if;
end
$$;

revoke all on function public.save_draft_cycle(uuid, timestamptz, date, integer, integer, integer, uuid[]) from public, anon;
revoke all on function public.activate_cycle(uuid) from public, anon;
revoke all on function public.override_meeting_date(uuid, date) from public, anon;
grant execute on function public.save_draft_cycle(uuid, timestamptz, date, integer, integer, integer, uuid[]) to authenticated;
grant execute on function public.activate_cycle(uuid) to authenticated;
grant execute on function public.override_meeting_date(uuid, date) to authenticated;

commit;
