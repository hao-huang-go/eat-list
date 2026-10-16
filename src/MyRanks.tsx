import type { MetricKey, Rank, Stats } from "./api";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

interface Props {
  lang: Lang;
  stats: Stats;
  tried: number;
  favouriteName: string | null;
  shared: boolean;
}

// Share of the other participants this person is ahead of; ties count half.
const ahead = (r: Rank, n: number) => (n <= 1 ? null : Math.round(((r.below + (r.ties - 1) / 2) / (n - 1)) * 100));

const ROWS: { key: MetricKey | "tried"; label: MessageKey; value: MessageKey }[] = [
  { key: "visits", label: "rankMyVisits", value: "rankMyVisitsValue" },
  { key: "tried", label: "rankMyTried", value: "rankMyTriedValue" },
  { key: "cuisines", label: "rankMyCuisines", value: "rankMyCuisinesValue" },
  { key: "areas", label: "rankMyAreas", value: "rankMyAreasValue" },
  { key: "loyalty", label: "rankMyLoyalty", value: "rankMyLoyaltyValue" },
  { key: "niche", label: "rankMyNiche", value: "rankMyNicheValue" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export function MyRanks({ lang, stats, tried, favouriteName, shared }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  if (!stats.metrics) return null;
  const metrics = stats.metrics;
  const triedRank: Rank = { mine: tried, below: stats.below, ties: stats.ties };
  const byId = new Map(RESTAURANTS.map((r) => [r.id, r]));

  return (
    <div className="panel">
      <h3>{t(shared ? "rankMineTitleShared" : "rankMineTitle")}</h3>
      {stats.n <= 1 && <p className="hint">{t("rankMineSolo")}</p>}
      <ul className="my-ranks">
        {ROWS.map((row) => {
          const rank = row.key === "tried" ? triedRank : metrics[row.key];
          const pct = ahead(rank, stats.n);
          const value =
            row.key === "niche"
                ? t(row.value)
                : row.key === "loyalty"
                  ? t(row.value, { n: rank.mine, name: favouriteName ?? "" })
                  : t(row.value, { n: rank.mine });
          return (
            <li key={row.key}>
              <span className="my-label">{t(row.label)}</span>
              <span className="my-value">{value}</span>
              {pct !== null && <b className="my-pct">{t("rankAhead", { n: pct })}</b>}
              {pct !== null && (
                <i className="my-bar">
                  <em style={{ width: `${Math.max(4, pct)}%` }} />
                </i>
              )}
            </li>
          );
        })}
      </ul>
      {(stats.fans ?? []).length > 0 && (
        <div className="fans">
          {(stats.fans ?? []).slice(0, 5).map((f) => {
            const r = byId.get(f.id);
            if (!r) return null;
            const [name] = restaurantNames(r, lang);
            return (
              <span key={f.id} className="fan">
                {MEDALS[f.place - 1]} {t(f.place === 1 ? "fanTop" : "fanPlace", { name, place: f.place, people: f.people })}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
