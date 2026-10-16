// The first checklist asks how often as a rough band; it's stored as a visit count, and visits are
// added one at a time after that.
export const FREQUENCIES = [1, 2, 3, 4] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// Visits recorded for each band: once, 2-5, 6-10, more than 10.
export const BAND_VISITS: Record<Frequency, number> = { 1: 1, 2: 3, 3: 8, 4: 11 };

export const isFrequency = (value: unknown): value is Frequency =>
  typeof value === "number" && (FREQUENCIES as readonly number[]).includes(value);
