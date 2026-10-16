import type { Stats } from "./api";
import { CUISINES, type Cuisine } from "./cuisines";
import { RESTAURANTS, type Restaurant } from "./restaurants";

// Below this share for the top cuisine, nobody gets pinned to one taste.
const DOMINANT_SHARE = 0.3;

export interface Report {
  tried: number;
  totalVisits: number;
  beatPct: number | null; // null when you're the only one
  favourite: { restaurant: Restaurant; visits: number } | null;
  taste: Cuisine | null;
  cuisines: { cuisine: Cuisine; share: number }[];
  gem: { restaurant: Restaurant; pct: number } | null;
  todo: { restaurant: Restaurant; pct: number }[];
}

const pctOf = (stats: Stats, id: string) => Math.round(((stats.popularity[id] ?? 0) / Math.max(1, stats.n)) * 100);

export function buildReport(visitsById: Record<string, number>, stats: Stats | null): Report {
  const mine = RESTAURANTS.filter((r) => visitsById[r.id]);
  const visits = new Map<Cuisine, number>();
  for (const r of mine) visits.set(r.cuisine, (visits.get(r.cuisine) ?? 0) + visitsById[r.id]);
  // Hotpot and Sichuan/Hunan are one taste family; Korean and Japanese another.
  const family = (c: Cuisine): Cuisine => (c === "hotpot" ? "sichuan_hunan" : c === "korean" ? "japanese" : c);
  const families = new Map<Cuisine, number>();
  for (const [c, v] of visits) families.set(family(c), (families.get(family(c)) ?? 0) + v);
  const total = [...visits.values()].reduce((a, b) => a + b, 0);
  const topFamily = [...families.entries()].sort((a, b) => b[1] - a[1])[0];

  const favourite = mine
    .map((restaurant) => ({ restaurant, visits: visitsById[restaurant.id] }))
    .sort((a, b) => b.visits - a.visits || RESTAURANTS.indexOf(a.restaurant) - RESTAURANTS.indexOf(b.restaurant))[0];

  const others = stats && stats.n > 1;
  return {
    tried: mine.length,
    totalVisits: total,
    beatPct: others ? Math.round(((stats.below + (stats.ties - 1) / 2) / (stats.n - 1)) * 100) : null,
    favourite: favourite ?? null,
    taste: topFamily && total > 0 && topFamily[1] / total >= DOMINANT_SHARE ? topFamily[0] : null,
    cuisines: CUISINES.filter((c) => visits.has(c))
      .map((cuisine) => ({ cuisine, share: (visits.get(cuisine) ?? 0) / total }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 4),
    gem: others
      ? (mine.map((restaurant) => ({ restaurant, pct: pctOf(stats, restaurant.id) })).sort((a, b) => a.pct - b.pct)[0] ?? null)
      : null,
    todo: stats
      ? RESTAURANTS.filter((r) => !visitsById[r.id] && (stats.popularity[r.id] ?? 0) > 0)
          .map((restaurant) => ({ restaurant, pct: pctOf(stats, restaurant.id) }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 3)
      : [],
  };
}
