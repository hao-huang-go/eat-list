-- Every +1 after the first checklist is logged with its (Melbourne) date, so visits can be reported by
-- month. First-checklist counts are "this year so far" and have no dates; they only count toward the year.
create table public.food_visit_events (
  checkin_id uuid not null references public.food_checkins (id) on delete cascade,
  restaurant_id text not null check (restaurant_id ~ '^[a-z0-9-]{1,80}$'),
  visited_on date not null,
  first_visit boolean not null, -- the first time this checklist recorded this restaurant
  primary key (checkin_id, restaurant_id, visited_on)
);
create index food_visit_events_day_idx on public.food_visit_events (visited_on);
alter table public.food_visit_events enable row level security;
revoke all on table public.food_visit_events from anon, authenticated;

create or replace function public.food_add_visit(p_device_hash text, p_city text, p_year smallint, p_restaurant text, p_day date)
returns json
language plpgsql
set search_path = public
as $$
declare
  cid uuid;
  item food_checkin_items;
  existed boolean;
begin
  select id into cid from food_checkins where device_hash = p_device_hash and city = p_city and year = p_year;
  if not found then
    return json_build_object('status', 'no_checkin');
  end if;

  select * into item from food_checkin_items where checkin_id = cid and restaurant_id = p_restaurant for update;
  existed := found;
  if existed and item.last_added_on = p_day then
    return json_build_object('status', 'already_today', 'id', cid, 'visits', item.visits);
  end if;

  insert into food_checkin_items (checkin_id, restaurant_id, visits, last_added_on)
  values (cid, p_restaurant, 1, p_day)
  on conflict (checkin_id, restaurant_id) do update
    set visits = food_checkin_items.visits + 1, last_added_on = p_day
  returning * into item;

  insert into food_visit_events (checkin_id, restaurant_id, visited_on, first_visit)
  values (cid, p_restaurant, p_day, not existed)
  on conflict do nothing;

  update food_checkins
  set tried = (select count(*) from food_checkin_items where checkin_id = cid), updated_at = now()
  where id = cid;

  return json_build_object('status', 'ok', 'id', cid, 'visits', item.visits);
end;
$$;

-- One checklist's month: its check-ins, where it ranks among people who checked in that month, and the
-- month's most-visited restaurants.
create or replace function public.food_month_stats(p_id uuid, p_month date) returns json
language sql
stable
set search_path = public
as $$
  with me as (select * from food_checkins where id = p_id),
  month_events as (
    select e.*
    from food_visit_events e join food_checkins c on c.id = e.checkin_id, me
    where c.city = me.city and c.year = me.year
      and e.visited_on >= date_trunc('month', p_month) and e.visited_on < date_trunc('month', p_month) + interval '1 month'
  ),
  per as (select checkin_id, count(*) as visits from month_events group by checkin_id),
  mine as (select * from month_events where checkin_id = p_id),
  my_visits as (select count(*) as visits from mine)
  select case when not exists (select 1 from me) then null else json_build_object(
    'month', to_char(date_trunc('month', p_month), 'YYYY-MM'),
    'visits', (select visits from my_visits),
    'places', (select count(distinct restaurant_id) from mine),
    'newPlaces', (select count(*) from mine where first_visit),
    'top', (select coalesce(json_agg(json_build_object('id', restaurant_id, 'visits', v) order by v desc, restaurant_id), '[]'::json)
            from (select restaurant_id, count(*) as v from mine group by restaurant_id order by v desc, restaurant_id limit 3) t),
    'active', (select count(*) from per),
    'below', (select count(*) from per where visits < (select visits from my_visits)),
    'ties', (select count(*) from per where visits = (select visits from my_visits)),
    'months', (select coalesce(json_agg(m order by m desc), '[]'::json)
               from (select distinct to_char(visited_on, 'YYYY-MM') as m from food_visit_events where checkin_id = p_id) x)
  ) end;
$$;

-- Restaurants' check-ins in one month (city-wide), for the "this month" leaderboard.
create or replace function public.food_month_ranking(p_city text, p_year smallint, p_month date) returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_object_agg(restaurant_id, json_build_array(visits, people)), '{}'::json)
  from (
    select e.restaurant_id, count(*) as visits, count(distinct e.checkin_id) as people
    from food_visit_events e join food_checkins c on c.id = e.checkin_id
    where c.city = p_city and c.year = p_year
      and e.visited_on >= date_trunc('month', p_month) and e.visited_on < date_trunc('month', p_month) + interval '1 month'
    group by e.restaurant_id
  ) x;
$$;

revoke all on function public.food_add_visit, public.food_month_stats, public.food_month_ranking from public, anon, authenticated;
