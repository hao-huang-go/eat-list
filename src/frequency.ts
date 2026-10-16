// Visits are counts. The first checklist asks "about how many times this year" per restaurant
// (capped, since it's from memory); afterwards visits are only added one at a time.
export const MAX_INITIAL_VISITS = 10;

export const isInitialVisits = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_INITIAL_VISITS;

// Earlier versions stored rough bands (once, 2-5, 6-10, 10+); this is what each band counts as.
export const LEGACY_BAND_VISITS: Record<number, number> = { 1: 1, 2: 3, 3: 8, 4: 11 };
