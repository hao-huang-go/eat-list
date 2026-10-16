import { BAND_VISITS, isFrequency, type Frequency } from "./frequency";

// This device's checklist, kept locally so a return visit picks up where it left off.
// Before submitting it's a draft of rough bands; after, it's visit counts that can only go up.
const KEY = "eat-list.checkin.v2";
const OLD_KEY = "eat-list.checkin.v1";

export interface Saved {
  id: string | null; // set once submitted
  draft: Record<string, Frequency>;
  visits: Record<string, number>;
  addedOn: Record<string, string>; // restaurant -> last day a visit was added (YYYY-MM-DD)
}

const empty = (): Saved => ({ id: null, draft: {}, visits: {}, addedOn: {} });

export const visitsFromDraft = (draft: Record<string, Frequency>): Record<string, number> =>
  Object.fromEntries(Object.entries(draft).map(([id, f]) => [id, BAND_VISITS[f]]));

function fromV1(raw: string): Saved {
  const old = JSON.parse(raw) as { items?: Record<string, unknown>; id?: string | null };
  const draft: Record<string, Frequency> = {};
  for (const [id, f] of Object.entries(old.items ?? {})) if (isFrequency(f)) draft[id] = f;
  return old.id ? { ...empty(), id: old.id, visits: visitsFromDraft(draft) } : { ...empty(), draft };
}

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<Saved>) };
    const old = localStorage.getItem(OLD_KEY);
    if (old) return fromV1(old);
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

export const today = () => new Date().toISOString().slice(0, 10);
