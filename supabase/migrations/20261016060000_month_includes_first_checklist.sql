-- The first checklist's counts land in the month it was submitted, so a new submitter's monthly report
-- isn't empty. Events now carry a visit count (the first checklist's counts arrive as one event each).
alter table public.food_visit_events
  add column visits smallint not null default 1 check (visits between 1 and 10000),
  add column initial boolean not null default false;

-- Backfill: each existing checklist's counts, minus visits already logged with +1, on its submission day.
insert into public.food_visit_events (checkin_id, restaurant_id, visited_on, first_visit, visits, initial)
select i.checkin_id, i.restaurant_id, c.submitted_on, true,
       i.visits - coalesce((select sum(e.visits) from food_visit_events e
                            where e.checkin_id = i.checkin_id and e.restaurant_id = i.restaurant_id), 0),
       true
from food_checkin_items i join food_checkins c on c.id = i.checkin_id
where i.visits - coalesce((select sum(e.visits) from food_visit_events e
                           where e.checkin_id = i.checkin_id and e.restaurant_id = i.restaurant_id), 0) > 0
on conflict (checkin_id, restaurant_id, visited_on) do update
  set visits = food_visit_events.visits + excluded.visits, first_visit = true, initial = true;

create or replace function public.food_submit(p jsonb) returns json
language plpgsql
set search_path = public
as $$
declare
  cid uuid;
begin
  select id into cid from food_checkins
  where device_hash = p->>'device_hash' and city = p->>'city' and year = (p->>'year')::smallint;
  if found then
    return json_build_object('id', cid, 'created', false);
  end if;

  insert into food_checkins (city, year, device_hash, ip_hash, submitted_on, source, tried)
  values (p->>'city', (p->>'year')::smallint, p->>'device_hash', p->>'ip_hash', (p->>'submitted_on')::date,
          p->>'source', jsonb_array_length(p->'items'))
  returning id into cid;

  insert into food_checkin_items (checkin_id, restaurant_id, visits, last_added_on)
  select cid, x->>'id', (x->>'visits')::smallint, (p->>'submitted_on')::date from jsonb_array_elements(p->'items') x;

  insert into food_visit_events (checkin_id, restaurant_id, visited_on, first_visit, visits, initial)
  select cid, x->>'id', (p->>'submitted_on')::date, true, (x->>'visits')::smallint, true
  from jsonb_array_elements(p->'items') x;

  return json_build_object('id', cid, 'created', true);
exception when unique_violation then
  select id into cid from food_checkins
  where device_hash = p->>'device_hash' and city = p->>'city' and year = (p->>'year')::smallint;
  return json_build_object('id', cid, 'created', false);
end;
$$;

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
  per as (select checkin_id, sum(visits) as visits from month_events group by checkin_id),
  mine as (select * from month_events where checkin_id = p_id),
  my_visits as (select coalesce(sum(visits), 0) as visits from mine)
  select case when not exists (select 1 from me) then null else json_build_object(
    'month', to_char(date_trunc('month', p_month), 'YYYY-MM'),
    'visits', (select visits from my_visits),
    'places', (select count(distinct restaurant_id) from mine),
    'newPlaces', (select count(distinct restaurant_id) from mine where first_visit),
    'top', (select coalesce(json_agg(json_build_object('id', restaurant_id, 'visits', v) order by v desc, restaurant_id), '[]'::json)
            from (select restaurant_id, sum(visits) as v from mine group by restaurant_id order by v desc, restaurant_id limit 3) t),
    'active', (select count(*) from per),
    'below', (select count(*) from per where visits < (select visits from my_visits)),
    'ties', (select count(*) from per where visits = (select visits from my_visits)),
    'months', (select coalesce(json_agg(m order by m desc), '[]'::json)
               from (select distinct to_char(visited_on, 'YYYY-MM') as m from food_visit_events where checkin_id = p_id) x)
  ) end;
$$;

create or replace function public.food_month_ranking(p_city text, p_year smallint, p_month date) returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_object_agg(restaurant_id, json_build_array(visits, people)), '{}'::json)
  from (
    select e.restaurant_id, sum(e.visits) as visits, count(distinct e.checkin_id) as people
    from food_visit_events e join food_checkins c on c.id = e.checkin_id
    where c.city = p_city and c.year = p_year
      and e.visited_on >= date_trunc('month', p_month) and e.visited_on < date_trunc('month', p_month) + interval '1 month'
    group by e.restaurant_id
  ) x;
$$;

revoke all on function public.food_submit, public.food_month_stats, public.food_month_ranking from public, anon, authenticated;
