import { isInitialVisits, LEGACY_BAND_VISITS } from "./frequency";

// This device's checklist, kept locally so a return visit picks up where it left off.
// Before submitting it's a draft of remembered visit counts; after, counts that can only go up.
const KEY = "eat-list.checkin.v3";
const LEGACY_KEYS = ["eat-list.checkin.v2", "eat-list.checkin.v1"];

export interface Saved {
  id: string | null; // set once submitted
  draft: Record<string, number>;
  visits: Record<string, number>;
  addedOn: Record<string, string>; // restaurant -> last day a visit was added (YYYY-MM-DD)
}

const empty = (): Saved => ({ id: null, draft: {}, visits: {}, addedOn: {} });

const fromBands = (bands: Record<string, unknown> = {}): Record<string, number> =>
  Object.fromEntries(
    Object.entries(bands)
      .filter(([, b]) => typeof b === "number" && LEGACY_BAND_VISITS[b] !== undefined)
      .map(([id, b]) => [id, LEGACY_BAND_VISITS[b as number]]),
  );

// v2 kept bands in `draft` and counts in `visits`; v1 kept bands in `items`.
function fromLegacy(raw: string): Saved {
  const old = JSON.parse(raw) as Partial<Saved> & { items?: Record<string, unknown> };
  const draft = fromBands((old.draft ?? old.items) as Record<string, unknown> | undefined);
  if (old.id) return { ...empty(), id: old.id, visits: old.visits ?? draft, addedOn: old.addedOn ?? {} };
  return { ...empty(), draft };
}

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = { ...empty(), ...(JSON.parse(raw) as Partial<Saved>) };
      saved.draft = Object.fromEntries(Object.entries(saved.draft).filter(([, v]) => isInitialVisits(v)));
      return saved;
    }
    for (const key of LEGACY_KEYS) {
      const old = localStorage.getItem(key);
      if (old) return fromLegacy(old);
    }
  } catch {
    // unreadable or blocked: start empty
  }
  return empty();
}

export function storeSaved(saved: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // storage blocked: the checklist lasts for this visit only
  }
}

// The calendar date in Melbourne, matching the server's once-a-day rule.
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
