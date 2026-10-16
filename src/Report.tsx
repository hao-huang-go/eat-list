import type { Stats } from "./api";
import { cuisineLabel, omnivoreLabel, tasteLabel } from "./cuisines";
import { translate, type Lang, type MessageKey } from "./i18n";
import { buildReport } from "./yearReport";
import { RESTAURANTS, restaurantNames, type Restaurant } from "./restaurants";

interface Props {
  lang: Lang;
  year: number;
  visits: Record<string, number>;
  stats: Stats | null;
  onEdit: () => void;
}

export function Report({ lang, year, visits, stats, onEdit }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const r = buildReport(visits, stats);
  const name = (x: Restaurant) => {
    const [primary, secondary] = restaurantNames(x, lang);
    return (
      <>
        {primary}
        {secondary && <span className="alt">{secondary}</span>}
      </>
    );
  };
  const tallest = Math.max(1, ...(stats?.hist ?? [0]));
  const myBin = Math.min(9, Math.floor(r.tried / 10));

  return (
    <section className="report">
      <div className="report-card">
        <p className="report-kicker">{t("reportTitle", { year })}</p>
        <p className="report-big">
          {r.tried}
          <span> / {RESTAURANTS.length}</span>
        </p>
        <p className="report-visits">{t("reportVisits", { n: r.totalVisits })}</p>
        <p className="report-beat">{r.beatPct === null ? t("beatSolo") : t("beat", { n: r.beatPct })}</p>

        <dl className="report-facts">
          {r.favourite && (
            <div>
              <dt>{t("favourite")}</dt>
              <dd>
                {name(r.favourite.restaurant)} <small>{t("visitCount", { n: r.favourite.visits })}</small>
              </dd>
            </div>
          )}
          <div>
            <dt>{t("taste")}</dt>
            <dd>{r.taste ? tasteLabel(r.taste, lang) : omnivoreLabel(lang)}</dd>
          </div>
          {r.gem && (
            <div>
              <dt>{t("gem")}</dt>
              <dd>
                {name(r.gem.restaurant)} <small>{t("gemLine", { pct: r.gem.pct })}</small>
              </dd>
            </div>
          )}
        </dl>

        {r.cuisines.length > 0 && (
          <div className="bars">
            <p className="label">{t("topCuisines")}</p>
            {r.cuisines.map((c) => (
              <div key={c.cuisine} className="bar">
                <span>{cuisineLabel(c.cuisine, lang)}</span>
                <i style={{ width: `${Math.max(6, c.share * 100)}%` }} />
                <em>{Math.round(c.share * 100)}%</em>
              </div>
            ))}
          </div>
        )}
        <p className="report-foot">{t("title")} · eat-list</p>
      </div>
      <p className="hint center">{t("shareHint")}</p>

      {r.todo.length > 0 && (
        <div className="panel">
          <h3>{t("todo")}</h3>
          <ul className="rank">
            {r.todo.map((x) => (
              <li key={x.restaurant.id}>
                <b>{name(x.restaurant)}</b>
                <small>
                  {x.restaurant.area} · {t("todoLine", { pct: x.pct })}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats && stats.n > 1 && (
        <div className="panel">
          <h3>{t("distribution")}</h3>
          <div className="hist">
            {stats.hist.map((count, i) => (
              <span key={i} className={i === myBin ? "you" : ""} style={{ height: `${Math.max(count ? 8 : 2, (count / tallest) * 100)}%` }} />
            ))}
          </div>
          <div className="hist-axis">
            <span>0</span>
            <span>50</span>
            <span>100+</span>
          </div>
          <p className="hint">{t("distributionNote", { n: stats.n, median: Math.round(stats.median) })}</p>
        </div>
      )}

      <button className="secondary wide" onClick={onEdit}>
        {t("edit")}
      </button>
    </section>
  );
}
