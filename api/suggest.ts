import { CITY } from "../server/checkins.js";
import { clientIp, hashIp, today } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

const MAX_PER_DAY = 10;

const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null;

// A restaurant someone thinks belongs on the list.
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = text(body?.name, 80);
  if (!name) return Response.json({ error: "invalid", field: "name" }, { status: 400 });
  const area = text(body?.area, 60);

  const db = supabaseFromEnv();
  const day = today();
  const ipHash = hashIp(clientIp(request), day);
  try {
    const { count, error: countError } = await db
      .from("food_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("submitted_on", day);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PER_DAY) return Response.json({ error: "rate_limited" }, { status: 429 });
    const { error } = await db.from("food_suggestions").insert({ city: CITY, name, area, ip_hash: ipHash, submitted_on: day });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("suggestion failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
