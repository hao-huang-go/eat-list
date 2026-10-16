-- One row per device per city and year: which listed restaurants they've eaten at, and roughly how often.
create table public.food_checkins (
  id uuid primary key default gen_random_uuid(),
  city text not null check (city in ('melbourne')),
  year smallint not null check (year between 2024 and 2100),
  device_hash text not null,
  ip_hash text not null,
  submitted_on date not null,
  source text check (source ~ '^[a-z0-9._-]{1,40}$'),
  tried smallint not null check (tried between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_hash, city, year)
);

-- freq: 1 = once, 2 = 2-5 times, 3 = 6-10 times, 4 = more than 10 times.
create table public.food_checkin_items (
  checkin_id uuid not null references public.food_checkins (id) on delete cascade,
  restaurant_id text not null check (restaurant_id ~ '^[a-z0-9-]{1,80}$'),
  freq smallint not null check (freq between 1 and 4),
  primary key (checkin_id, restaurant_id)
);
create index food_checkin_items_restaurant_idx on public.food_checkin_items (restaurant_id);

create table public.food_suggestions (
  id uuid primary key default gen_random_uuid(),
  city text not null check (city in ('melbourne')),
  name text not null check (length(name) between 1 and 80),
  area text check (length(area) <= 60),
  ip_hash text not null,
  submitted_on date not null,
  created_at timestamptz not null default now()
);
create index food_suggestions_ip_day_idx on public.food_suggestions (ip_hash, submitted_on);

alter table public.food_checkins enable row level security;
alter table public.food_checkin_items enable row level security;
alter table public.food_suggestions enable row level security;
revoke all on table public.food_checkins, public.food_checkin_items, public.food_suggestions from anon, authenticated;

-- Insert or replace this device's checklist for the city and year, in one transaction.
create or replace function public.food_submit(p jsonb) returns uuid
language plpgsql
set search_path = public
as $$
declare
  cid uuid;
begin
  insert into food_checkins (city, year, device_hash, ip_hash, submitted_on, source, tried)
  values (p->>'city', (p->>'year')::smallint, p->>'device_hash', p->>'ip_hash', (p->>'submitted_on')::date,
          p->>'source', jsonb_array_length(p->'items'))
  on conflict (device_hash, city, year) do update
    set tried = excluded.tried, ip_hash = excluded.ip_hash, submitted_on = excluded.submitted_on, updated_at = now()
  returning id into cid;

  delete from food_checkin_items where checkin_id = cid;
  insert into food_checkin_items (checkin_id, restaurant_id, freq)
  select cid, x->>'id', (x->>'freq')::smallint from jsonb_array_elements(p->'items') x;

  return cid;
end;
$$;

-- Where this checklist ranks by places tried, plus how many people have tried each restaurant.
create or replace function public.food_stats(p_id uuid) returns json
language sql
stable
set search_path = public
as $$
  with me as (select * from food_checkins where id = p_id),
  peers as (select c.* from food_checkins c, me where c.city = me.city and c.year = me.year)
  select case when not exists (select 1 from me) then null else json_build_object(
    'n', (select count(*) from peers),
    'below', (select count(*) from peers where tried < (select tried from me)),
    'ties', (select count(*) from peers where tried = (select tried from me)),
    'median', (select percentile_cont(0.5) within group (order by tried) from peers),
    'hist', (select json_agg(coalesce(c, 0) order by b)
             from generate_series(0, 9) b
             left join (select least(tried / 10, 9) as bucket, count(*) as c from peers group by 1) h on h.bucket = b),
    'popularity', (select coalesce(json_object_agg(restaurant_id, n), '{}'::json)
                   from (select i.restaurant_id, count(*) as n
                         from food_checkin_items i join peers p on p.id = i.checkin_id
                         group by i.restaurant_id) x)
  ) end;
$$;

revoke all on function public.food_submit, public.food_stats from public, anon, authenticated;
