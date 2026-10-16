import type { SupabaseClient } from "@supabase/supabase-js";
import { isFrequency, type Frequency } from "../src/frequency.js";
import { RESTAURANT_IDS } from "../src/restaurants.js";
import { InputError } from "./request.js";

export const CITY = "melbourne";
export const YEAR = 2026;
const SOURCE_PATTERN = /^[a-z0-9._-]{1,40}$/;

export interface CheckinInput {
  items: { id: string; freq: Frequency }[];
  source: string | null;
}

export function parseCheckin(body: unknown): CheckinInput {
  if (typeof body !== "object" || body === null) throw new InputError("body");
  const b = body as Record<string, unknown>;
  if (typeof b.items !== "object" || b.items === null || Array.isArray(b.items)) throw new InputError("items");
  const items: CheckinInput["items"] = [];
  for (const [id, freq] of Object.entries(b.items as Record<string, unknown>)) {
    if (!RESTAURANT_IDS.has(id) || !isFrequency(freq)) throw new InputError("items");
    items.push({ id, freq });
  }
  return { items, source: typeof b.source === "string" && SOURCE_PATTERN.test(b.source) ? b.source : null };
}

export async function saveCheckin(
  db: SupabaseClient,
  input: CheckinInput,
  deviceHash: string,
  ipHash: string,
  day: string,
): Promise<string> {
  const { data, error } = await db.rpc("food_submit", {
    p: { city: CITY, year: YEAR, device_hash: deviceHash, ip_hash: ipHash, submitted_on: day, source: input.source, items: input.items },
  });
  if (error) throw error;
  return data as string;
}

export interface CheckinStats {
  n: number;
  below: number;
  ties: number;
  median: number;
  hist: number[];
  popularity: Record<string, number>;
}

export async function checkinStats(db: SupabaseClient, id: string): Promise<CheckinStats | null> {
  const { data, error } = await db.rpc("food_stats", { p_id: id });
  if (error) throw error;
  return (data as CheckinStats | null) ?? null;
}

export async function participantCount(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from("food_checkins")
    .select("id", { count: "exact", head: true })
    .eq("city", CITY)
    .eq("year", YEAR);
  if (error) throw error;
  return count ?? 0;
}
