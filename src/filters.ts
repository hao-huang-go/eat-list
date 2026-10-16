import type { Cuisine } from "./cuisines";
import { RESTAURANTS, type Restaurant } from "./restaurants";

// Where a restaurant is: the CBD, or a named suburb outside it. Chains spread across the CBD count as CBD.
export type Area = "all" | "cbd" | "outside" | `suburb:${string}`;

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

export function matchesArea(r: Restaurant, area: Area): boolean {
  if (area === "all") return true;
  if (area === "cbd") return inCbd(r);
  if (area === "outside") return !inCbd(r);
  return r.area === area.slice("suburb:".length);
}

export const matchesCuisine = (r: Restaurant, cuisine: Cuisine | null) => !cuisine || r.cuisine === cuisine;
