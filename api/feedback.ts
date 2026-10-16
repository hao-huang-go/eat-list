import { clientIp, hashIp, today } from "../server/request.js";
import { supabaseFromEnv } from "../server/supabase.js";

export const WANTS = ["more_places", "sydney", "friends", "nearby", "monthly", "other"] as const;
const MAX_MESSAGE = 1000;
const MAX_PER_DAY = 5;

const oneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "invalid", field: "body" }, { status: 400 });
  const wants = Array.isArray(body.wants) ? [...new Set(body.wants.filter((w) => oneOf(WANTS, w)))] : [];
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE) : "";
  if (!wants.length && !message) return Response.json({ error: "invalid", field: "empty" }, { status: 400 });

  const db = supabaseFromEnv();
  const day = today();
  const ipHash = hashIp(clientIp(request), day);
  try {
    const { count, error: countError } = await db
      .from("food_feedback")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("submitted_on", day);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PER_DAY) return Response.json({ error: "rate_limited" }, { status: 429 });
    const { error } = await db.from("food_feedback").insert({
      wants,
      message: message || null,
      lang: oneOf(["zh", "en"] as const, body.lang) ? body.lang : null,
      submitted: body.submitted === true,
      ip_hash: ipHash,
      submitted_on: day,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("feedback failed", { errorType: e instanceof Error ? e.name : typeof e });
    return Response.json({ error: "server" }, { status: 500 });
  }
}
