import { checkinStats, reportVisits, YEAR } from "../server/checkins.js";
import { parseId } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

// A shared report: one checklist's visits and its ranking, for anyone with the link.
export async function GET(request: Request): Promise<Response> {
  let id;
  try {
    id = parseId(new URL(request.url).searchParams.get("id"));
  } catch {
    return Response.json({ error: "invalid", field: "id" }, { status: 400 });
  }
  try {
    const db = supabaseFromEnv();
    const [stats, visits] = await Promise.all([checkinStats(db, id), reportVisits(db, id)]);
    if (!stats) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(
      { year: YEAR, visits, stats },
      { headers: { "cache-control": "public, max-age=60, s-maxage=60, stale-while-revalidate=600" } },
    );
  } catch (e) {
    console.error("shared report failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
