import { createHash } from "node:crypto";

export class InputError extends Error {}
export class RateLimitError extends Error {}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const today = () => new Date().toISOString().slice(0, 10);

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// Salted by day so the stored value can't be tied to an IP across days.
export function hashIp(ip: string, day: string): string {
  return createHash("sha256").update(`${process.env.IP_HASH_SALT ?? ""}|${day}|${ip}`).digest("hex");
}

// Not salted by day: the same device stays the same device. Null when missing or malformed.
export function hashDevice(deviceId: string | null): string | null {
  if (!deviceId || !UUID_PATTERN.test(deviceId)) return null;
  return createHash("sha256").update(`${process.env.IP_HASH_SALT ?? ""}|device|${deviceId.toLowerCase()}`).digest("hex");
}

export function parseId(value: string | null): string {
  if (!value || !UUID_PATTERN.test(value)) throw new InputError("id");
  return value.toLowerCase();
}
