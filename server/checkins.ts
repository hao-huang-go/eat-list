import type { SupabaseClient } from "@supabase/supabase-js";
import { BAND_VISITS, isFrequency } from "../src/frequency.js";
import { RESTAURANT_IDS } from "../src/restaurants.js";
import { InputError } from "./request.js";

export const CITY = "melbourne";
export const YEAR = 2026;
const SOURCE_PATTERN = /^[a-z0-9._-]{1,40}$/;

export interface CheckinInput {
  items: { id: string; visits: number }[];
  source: string | null;
}

export function parseCheckin(body: unknown): CheckinInput {
  if (typeof body !== "object" || body === null) throw new InputError("body");
  const b = body as Record<string, unknown>;
  if (typeof b.items !== "object" || b.items === null || Array.isArray(b.items)) throw new InputError("items");
  const items: CheckinInput["items"] = [];
  for (const [id, freq] of Object.entries(b.items as Record<string, unknown>)) {
    if (!RESTAURANT_IDS.has(id) || !isFrequency(freq)) throw new InputError("items");
    items.push({ id, visits: BAND_VISITS[freq] });
  }
  return { items, source: typeof b.source === "string" && SOURCE_PATTERN.test(b.source) ? b.source : null };
}

export async function saveCheckin(
  db: SupabaseClient,
  input: CheckinInput,
  deviceHash: string,
  ipHash: string,
  day: string,
): Promise<{ id: string; created: boolean }> {
  const { data, error } = await db.rpc("food_submit", {
    p: { city: CITY, year: YEAR, device_hash: deviceHash, ip_hash: ipHash, submitted_on: day, source: input.source, items: input.items },
  });
  if (error) throw error;
  return data as { id: string; created: boolean };
}

export type VisitResult =
  | { status: "ok" | "already_today"; id: string; visits: number }
  | { status: "no_checkin" };

export function parseRestaurant(body: unknown): string {
  const id = typeof body === "object" && body !== null ? (body as Record<string, unknown>).restaurant : null;
  if (typeof id !== "string" || !RESTAURANT_IDS.has(id)) throw new InputError("restaurant");
  return id;
}

export async function addVisit(db: SupabaseClient, deviceHash: string, restaurant: string, day: string): Promise<VisitResult> {
  const { data, error } = await db.rpc("food_add_visit", {
    p_device_hash: deviceHash,
    p_city: CITY,
    p_year: YEAR,
    p_restaurant: restaurant,
    p_day: day,
  });
  if (error) throw error;
  return data as VisitResult;
}

export async function hasCheckin(db: SupabaseClient, deviceHash: string): Promise<boolean> {
  const { count, error } = await db
    .from("food_checkins")
    .select("id", { count: "exact", head: true })
    .eq("device_hash", deviceHash)
    .eq("city", CITY)
    .eq("year", YEAR);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Restaurant id -> [total visits recorded, people who recorded any].
export async function ranking(db: SupabaseClient): Promise<Record<string, [number, number]>> {
  const { data, error } = await db.rpc("food_ranking", { p_city: CITY, p_year: YEAR });
  if (error) throw error;
  return (data ?? {}) as Record<string, [number, number]>;
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
