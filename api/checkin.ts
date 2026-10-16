import { checkinStats, parseCheckin, saveCheckin } from "../server/checkins.js";
import { clientIp, hashDevice, hashIp, InputError, parseId, today } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

// Save this device's first checklist and return its ranking. A device submits once; after that it can
// only add visits (api/visit), so a second submit returns the existing checklist instead.
export async function POST(request: Request): Promise<Response> {
  let input;
  try {
    input = parseCheckin(await request.json());
  } catch (e) {
    return Response.json({ error: "invalid", field: e instanceof InputError ? e.message : "body" }, { status: 400 });
  }
  const deviceHash = hashDevice(request.headers.get("x-device-id"));
  if (!deviceHash) return Response.json({ error: "invalid", field: "device" }, { status: 400 });

  const db = supabaseFromEnv();
  const day = today();
  try {
    const { id, created } = await saveCheckin(db, input, deviceHash, hashIp(clientIp(request), day), day);
    if (!created) return Response.json({ error: "already_submitted", id }, { status: 409 });
    return Response.json({ id, stats: await checkinStats(db, id) });
  } catch (e) {
    console.error("checkin save failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}

// Fresh ranking for a saved checklist.
export async function GET(request: Request): Promise<Response> {
  let id;
  try {
    id = parseId(new URL(request.url).searchParams.get("id"));
  } catch {
    return Response.json({ error: "invalid", field: "id" }, { status: 400 });
  }
  try {
    const stats = await checkinStats(supabaseFromEnv(), id);
    if (!stats) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ id, stats });
  } catch (e) {
    console.error("checkin stats failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
