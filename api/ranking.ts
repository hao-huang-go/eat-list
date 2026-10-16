import { hasCheckin, participantCount, ranking } from "../server/checkins.js";
import { hashDevice } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

// Everyone's recorded visits per restaurant; the page filters and ranks them by area and cuisine.
// Only devices that have submitted a checklist can see it.
export async function GET(request: Request): Promise<Response> {
  const deviceHash = hashDevice(request.headers.get("x-device-id"));
  if (!deviceHash) return Response.json({ error: "not_submitted" }, { status: 403 });
  try {
    const db = supabaseFromEnv();
    if (!(await hasCheckin(db, deviceHash))) return Response.json({ error: "not_submitted" }, { status: 403 });
    const [restaurants, people] = await Promise.all([ranking(db), participantCount(db)]);
    return Response.json({ people, restaurants }, { headers: { "cache-control": "private, max-age=60" } });
  } catch (e) {
    console.error("ranking failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
