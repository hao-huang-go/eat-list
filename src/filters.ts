import type { Cuisine } from "./cuisines";
import { RESTAURANTS, type Restaurant } from "./restaurants";

// An area filter is "cbd", "outside" (anywhere outside the CBD) or "suburb:<name>".
// Chains spread across the CBD count as CBD.
export type Area = "cbd" | "outside" | `suburb:${string}`;

export const inCbd = (r: Restaurant) => r.area.startsWith("CBD");

// Suburbs outside the CBD that have at least two listed places, busiest first.
export const SUBURBS: string[] = (() => {
  const counts = new Map<string, number>();
  for (const r of RESTAURANTS) if (!inCbd(r)) counts.set(r.area, (counts.get(r.area) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area);
})();

const matchesOneArea = (r: Restaurant, area: Area) =>
  area === "cbd" ? inCbd(r) : area === "outside" ? !inCbd(r) : r.area === area.slice("suburb:".length);

// Nothing picked means no filter; otherwise a place matches any of the picked options.
export const matchesAreas = (r: Restaurant, areas: Area[]) => areas.length === 0 || areas.some((a) => matchesOneArea(r, a));
export const matchesCuisines = (r: Restaurant, cuisines: Cuisine[]) => cuisines.length === 0 || cuisines.includes(r.cuisine);

export const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
