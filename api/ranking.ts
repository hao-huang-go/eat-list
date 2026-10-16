import { hasCheckin, monthRanking, participantCount, ranking } from "../server/checkins.js";
import { hashDevice, parseMonth } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

// Everyone's recorded visits per restaurant; the page filters and ranks them by area and cuisine.
// Only devices that have submitted a checklist can see it. ?period=month ranks this month's check-ins instead.
export async function GET(request: Request): Promise<Response> {
  const deviceHash = hashDevice(request.headers.get("x-device-id"));
  if (!deviceHash) return Response.json({ error: "not_submitted" }, { status: 403 });
  try {
    const db = supabaseFromEnv();
    if (!(await hasCheckin(db, deviceHash))) return Response.json({ error: "not_submitted" }, { status: 403 });
    const monthly = new URL(request.url).searchParams.get("period") === "month";
    const [restaurants, people] = await Promise.all([monthly ? monthRanking(db, parseMonth(null)) : ranking(db), participantCount(db)]);
    return Response.json({ people, restaurants }, { headers: { "cache-control": "private, max-age=60" } });
  } catch (e) {
    console.error("ranking failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
