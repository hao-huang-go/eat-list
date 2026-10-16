import { monthStats } from "../server/checkins.js";
import { parseId, parseMonth } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

// One checklist's monthly report (check-ins logged with +1 in that month).
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  let id, month;
  try {
    id = parseId(params.get("id"));
    month = parseMonth(params.get("month"));
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const stats = await monthStats(supabaseFromEnv(), id, month);
    if (!stats) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(stats, { headers: { "cache-control": "private, max-age=30" } });
  } catch (e) {
    console.error("month stats failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
