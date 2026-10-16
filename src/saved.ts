import type { Frequency } from "./frequency";

// The checklist and the id of its saved submission, kept on this device so a return visit
// opens straight on the report instead of an empty list.
const KEY = "eat-list.checkin.v1";

export interface Saved {
  items: Record<string, Frequency>;
  id: string | null; // null until submitted
}

export function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    // unreadable or blocked: start empty
  }
  return { items: {}, id: null };
}

export function storeSaved(saved: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // storage blocked: the checklist lasts for this visit only
  }
}
