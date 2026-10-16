-- A shared report link shows that checklist's visits; anyone holding the (unguessable) id can view it.
create or replace function public.food_report_visits(p_id uuid) returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_object_agg(restaurant_id, visits), '{}'::json) from food_checkin_items where checkin_id = p_id;
$$;

revoke all on function public.food_report_visits from public, anon, authenticated;
