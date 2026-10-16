// How often someone ate somewhere this year, picked as a rough band rather than counted.
export const FREQUENCIES = [1, 2, 3, 4] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// Midpoint visits per band, used to weight taste and pick the most-visited place.
export const FREQUENCY_VISITS: Record<Frequency, number> = { 1: 1, 2: 3.5, 3: 8, 4: 12 };

export const isFrequency = (value: unknown): value is Frequency =>
  typeof value === "number" && (FREQUENCIES as readonly number[]).includes(value);
