-- What people want next, and anything else they'd like to say.
create table public.food_feedback (
  id uuid primary key default gen_random_uuid(),
  wants text[] not null default '{}',
  message text check (length(message) <= 1000),
  lang text check (lang in ('zh', 'en')),
  submitted boolean not null default false, -- whether this device had submitted a checklist
  ip_hash text not null,
  submitted_on date not null,
  created_at timestamptz not null default now()
);
create index food_feedback_ip_day_idx on public.food_feedback (ip_hash, submitted_on);
alter table public.food_feedback enable row level security;
revoke all on table public.food_feedback from anon, authenticated;
