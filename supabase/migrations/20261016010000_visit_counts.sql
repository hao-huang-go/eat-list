-- Visits become counts: the first submission's bands map to 1 / 3 / 8 / 11, and afterwards a device can only
-- add visits (+1 per restaurant per day), never edit or remove. Rankings sum everyone's recorded visits.
alter table public.food_checkin_items add column visits smallint, add column last_added_on date;
update public.food_checkin_items set visits = case freq when 1 then 1 when 2 then 3 when 3 then 8 else 11 end;
alter table public.food_checkin_items
  alter column visits set not null,
  add constraint food_checkin_items_visits_check check (visits between 1 and 10000),
  drop column freq;

drop function if exists public.food_submit(jsonb);

-- The first checklist for a device. Returns the existing id (created = false) if the device already submitted.
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

  return json_build_object('id', cid, 'created', true);
exception when unique_violation then
  select id into cid from food_checkins
  where device_hash = p->>'device_hash' and city = p->>'city' and year = (p->>'year')::smallint;
  return json_build_object('id', cid, 'created', false);
end;
$$;

-- One more visit to a restaurant for this device's checklist, at most once per restaurant per day.
create or replace function public.food_add_visit(p_device_hash text, p_city text, p_year smallint, p_restaurant text, p_day date)
returns json
language plpgsql
set search_path = public
as $$
declare
  cid uuid;
  item food_checkin_items;
begin
  select id into cid from food_checkins where device_hash = p_device_hash and city = p_city and year = p_year;
  if not found then
    return json_build_object('status', 'no_checkin');
  end if;

  select * into item from food_checkin_items where checkin_id = cid and restaurant_id = p_restaurant for update;
  if found and item.last_added_on = p_day then
    return json_build_object('status', 'already_today', 'id', cid, 'visits', item.visits);
  end if;

  insert into food_checkin_items (checkin_id, restaurant_id, visits, last_added_on)
  values (cid, p_restaurant, 1, p_day)
  on conflict (checkin_id, restaurant_id) do update
    set visits = food_checkin_items.visits + 1, last_added_on = p_day
  returning * into item;

  update food_checkins
  set tried = (select count(*) from food_checkin_items where checkin_id = cid), updated_at = now()
  where id = cid;

  return json_build_object('status', 'ok', 'id', cid, 'visits', item.visits);
end;
$$;

-- Everyone's recorded visits and the number of people, per restaurant, for the rankings.
create or replace function public.food_ranking(p_city text, p_year smallint) returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_object_agg(restaurant_id, json_build_array(visits, people)), '{}'::json)
  from (
    select i.restaurant_id, sum(i.visits) as visits, count(*) as people
    from food_checkin_items i join food_checkins c on c.id = i.checkin_id
    where c.city = p_city and c.year = p_year
    group by i.restaurant_id
  ) x;
$$;

revoke all on function public.food_submit, public.food_add_visit, public.food_ranking from public, anon, authenticated;
