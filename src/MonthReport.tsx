import { useEffect, useState } from "react";
import { fetchMonth, type MonthStats } from "./api";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

const byId = new Map(RESTAURANTS.map((r) => [r.id, r]));

// The checklist's month: check-ins logged with +1, how that ranks among people active that month,
// and the most-visited places. The current month by default, with earlier months to flip back to.
export function MonthReport({ lang, id, refresh }: { lang: Lang; id: string; refresh: number }) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<MonthStats | null>(null);

  useEffect(() => {
    fetchMonth(id, month).then(setStats).catch(() => setStats(null));
  }, [id, month, refresh]);

  if (!stats) return null;
  const label = monthLabel(stats.month, lang);
  const ahead = stats.active > 1 && stats.visits > 0 ? Math.round(((stats.below + (stats.ties - 1) / 2) / (stats.active - 1)) * 100) : null;
  const months = stats.months.includes(stats.month) ? stats.months : [stats.month, ...stats.months];

  return (
    <div className="panel month">
      <div className="month-head">
        <h3>{t("monthTitle", { month: label })}</h3>
        {months.length > 1 && (
          <div className="segmented" role="group">
            {months.slice(0, 4).map((m) => (
              <button key={m} className={m === stats.month ? "seg on" : "seg"} onClick={() => setMonth(m)}>
                {monthLabel(m, lang, true)}
              </button>
            ))}
          </div>
        )}
      </div>
      {stats.visits === 0 ? (
        <p className="hint">{t("monthEmpty")}</p>
      ) : (
        <>
          <div className="month-stats">
            <div>
              <b>{stats.visits}</b>
              <small>{t("monthVisits")}</small>
            </div>
            <div>
              <b>{stats.places}</b>
              <small>{t("monthPlaces")}</small>
            </div>
            <div>
              <b>{stats.newPlaces}</b>
              <small>{t("monthNew")}</small>
            </div>
          </div>
          {ahead !== null && <p className="month-ahead">{t("monthAhead", { n: ahead, active: stats.active })}</p>}
          {stats.top.length > 0 && (
            <ol className="rank numbered">
              {stats.top.map((x) => {
                const r = byId.get(x.id);
                if (!r) return null;
                const [primary, secondary] = restaurantNames(r, lang);
                return (
                  <li key={x.id}>
                    <b>
                      {primary}
                      {secondary && <span className="alt">{secondary}</span>}
                    </b>
                    <small>{t("visitCount", { n: x.visits })}</small>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
      <p className="hint">{t("monthNote")}</p>
    </div>
  );
}

function monthLabel(month: string, lang: Lang, short = false): string {
  const [y, m] = month.split("-").map(Number);
  if (lang === "zh") return short ? `${m}月` : `${y} 年 ${m} 月`;
  const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-AU", { month: short ? "short" : "long", timeZone: "UTC" });
  return short ? name : `${name} ${y}`;
}
