import { deviceId } from "./device";
import { visitSource } from "./source";


export interface Rank {
  mine: number;
  below: number; // people with a lower value
  ties: number; // people with the same value, including this person
}

export type MetricKey = "visits" | "cuisines" | "areas" | "loyalty" | "niche";

export interface Stats {
  n: number;
  below: number;
  ties: number;
  median: number;
  hist: number[];
  popularity: Record<string, number>;
  metrics?: Record<MetricKey, Rank>;
  fans?: { id: string; place: number; people: number }[]; // restaurants where this person is a top-3 regular
}

export interface CheckinResult {
  id: string;
  stats: Stats;
}

export class ApiError extends Error {
  readonly code: string;
  readonly body: Record<string, unknown>;

  constructor(code: string, body: Record<string, unknown>) {
    super(code);
    this.code = code;
    this.body = body;
  }
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(typeof body.error === "string" ? body.error : "server", body);
  return body as T;
}

export async function saveCheckin(items: Record<string, number>): Promise<CheckinResult> {
  return json(
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": deviceId() },
      body: JSON.stringify({ items, source: visitSource() }),
    }),
  );
}

export async function addVisit(restaurant: string): Promise<{ id: string; visits: number }> {
  return json(
    await fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": deviceId() },
      body: JSON.stringify({ restaurant }),
    }),
  );
}

export interface Ranking {
  people: number;
  restaurants: Record<string, [visits: number, people: number]>;
}

export async function fetchRanking(period: "year" | "month"): Promise<Ranking> {
  const query = period === "month" ? "?period=month" : "";
  return json(await fetch(`/api/ranking${query}`, { headers: { "x-device-id": deviceId() } }));
}

export interface MonthStats {
  month: string;
  visits: number;
  places: number;
  newPlaces: number;
  top: { id: string; visits: number }[];
  active: number;
  below: number;
  ties: number;
  months: string[];
}

export async function fetchMonth(id: string, month?: string): Promise<MonthStats> {
  const query = month ? `&month=${month}` : "";
  return json(await fetch(`/api/month?id=${encodeURIComponent(id)}${query}`));
}

export interface SharedReport {
  year: number;
  visits: Record<string, number>;
  stats: Stats;
}

export async function fetchSharedReport(id: string): Promise<SharedReport> {
  return json(await fetch(`/api/report?id=${encodeURIComponent(id)}`));
}

export async function fetchStats(id: string): Promise<CheckinResult> {
  return json(await fetch(`/api/checkin?id=${encodeURIComponent(id)}`));
}

export async function sendSuggestion(name: string, area: string): Promise<void> {
  await json(
    await fetch("/api/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, area: area || null }),
    }),
  );
}

export type FeedbackWant = "more_places" | "sydney" | "friends" | "nearby" | "monthly" | "other";

export async function sendFeedback(input: { wants: FeedbackWant[]; message: string; lang: string; submitted: boolean }): Promise<void> {
  await json(
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function fetchPeople(): Promise<number | null> {
  try {
    const res = await fetch("/api/participants");
    if (!res.ok) return null;
    const body = (await res.json()) as { people?: unknown };
    return typeof body.people === "number" ? body.people : null;
  } catch {
    return null;
  }
}
