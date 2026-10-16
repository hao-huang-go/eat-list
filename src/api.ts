import { deviceId } from "./device";
import type { Frequency } from "./frequency";
import { visitSource } from "./source";

export interface Stats {
  n: number;
  below: number;
  ties: number;
  median: number;
  hist: number[];
  popularity: Record<string, number>;
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

export async function saveCheckin(items: Record<string, Frequency>): Promise<CheckinResult> {
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

export async function fetchRanking(): Promise<Ranking> {
  return json(await fetch("/api/ranking", { headers: { "x-device-id": deviceId() } }));
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
