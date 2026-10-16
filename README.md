# 墨尔本吃过几家？

Tick the Melbourne restaurants you've eaten at this year (with a rough visit count), and get a yearly foodie report: how many you've tried, how you rank against everyone else, your most-visited place and your taste type.

- Seed list: ~100 restaurants mined from popular rednote "must-eat" posts (`src/restaurants.ts`).
- Stack: Vite + React + TypeScript, Vercel Functions (`api/`), Supabase Postgres (`supabase/migrations/`).
- Privacy: no accounts. Each device keeps one checklist per year (a salted hash of a random device id); only restaurant ids and visit bands are stored.

Local: `npm install`, put `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `IP_HASH_SALT` in `.env.local`, then `npm run dev`.
