import { addVisit, parseRestaurant } from "../server/checkins.js";
import { hashDevice, InputError, today } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

// One more visit to a restaurant on this device's checklist (at most once per restaurant per day).
export async function POST(request: Request): Promise<Response> {
  let restaurant;
  try {
    restaurant = parseRestaurant(await request.json());
  } catch (e) {
    return Response.json({ error: "invalid", field: e instanceof InputError ? e.message : "body" }, { status: 400 });
  }
  const deviceHash = hashDevice(request.headers.get("x-device-id"));
  if (!deviceHash) return Response.json({ error: "invalid", field: "device" }, { status: 400 });

  try {
    const result = await addVisit(supabaseFromEnv(), deviceHash, restaurant, today());
    if (result.status === "no_checkin") return Response.json({ error: "no_checkin" }, { status: 404 });
    if (result.status === "already_today") return Response.json({ error: "already_today", visits: result.visits }, { status: 409 });
    return Response.json({ id: result.id, visits: result.visits });
  } catch (e) {
    console.error("add visit failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
