import { useEffect, useState } from "react";
import { cuisineLabel, type Cuisine } from "./cuisines";
import { FilterPanel } from "./FilterPanel";
import { matchesAreas, matchesCuisines, type Area } from "./filters";
import { MAX_INITIAL_VISITS } from "./frequency";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

interface Props {
  lang: Lang;
  // Before submitting: remembered visit counts, adjustable. After: counts that are only ever added to.
  submitted: boolean;
  draft: Record<string, number>;
  visits: Record<string, number>;
  addedToday: (id: string) => boolean;
  adding: string | null;
  onStep: (id: string, delta: number) => void; // a count reaching 0 takes the restaurant off the draft
  onAddVisit: (id: string) => void;
}

const PAGE_SIZE = 10;

export function Checklist({ lang, submitted, draft, visits, addedToday, adding, onStep, onAddVisit }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(0);

  // Any change to what's filtered starts again from the first page.
  useEffect(() => setPage(0), [cuisines, query, areas, mineOnly]);

  const isMine = (id: string) => (submitted ? visits[id] !== undefined : draft[id] !== undefined);
  const q = query.trim().toLowerCase();
  const shown = RESTAURANTS.filter(
    (r) =>
      matchesCuisines(r, cuisines) &&
      matchesAreas(r, areas) &&
      (!mineOnly || isMine(r.id)) &&
      (!q || (r.name ?? "").toLowerCase().includes(q) || (r.zh ?? "").includes(q) || r.area.toLowerCase().includes(q)),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  function go(next: number) {
    setPage(next);
    document.querySelector(".places")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="checklist">
      <div className="filters">
        <input className="search" type="search" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="toggles">
          <FilterPanel
            lang={lang}
            cuisines={cuisines}
            areas={areas}
            onChange={(next) => {
              setCuisines(next.cuisines);
              setAreas(next.areas);
            }}
          />
          <label className="check">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            {t("mineOnly")}
          </label>
        </div>
        <p className="hint">{t(submitted ? "visitHint" : "freqHint")}</p>
      </div>

      <ol className="places">
        {visible.map((r) => {
          const [primary, secondary] = restaurantNames(r, lang);
          const count = visits[r.id];
          const drafted = draft[r.id];
          return (
            <li key={r.id} className={isMine(r.id) ? "place eaten" : "place"}>
              <div className="place-name">
                <b>
                  {primary}
                  {secondary && <span className="alt">{secondary}</span>}
                </b>
                <small>
                  {r.area} · {cuisineLabel(r.cuisine, lang)}
                </small>
              </div>
              {submitted ? (
                <div className="visit">
                  {count !== undefined && <span className="count">{t("visitCount", { n: count })}</span>}
                  <button className="plus" disabled={adding === r.id || addedToday(r.id)} onClick={() => onAddVisit(r.id)}>
                    {addedToday(r.id) ? t("addedToday") : count === undefined ? t("firstVisit") : "+1"}
                  </button>
                </div>
              ) : (
                <div className="visit">
                  {drafted === undefined ? (
                    <button className="plus" onClick={() => onStep(r.id, 1)}>
                      {t("firstVisit")}
                    </button>
                  ) : (
                    <div className="stepper" role="group" aria-label={primary}>
                      <button onClick={() => onStep(r.id, -1)} aria-label="−1">
                        −
                      </button>
                      <span>{t("visitCount", { n: drafted })}</span>
                      <button onClick={() => onStep(r.id, 1)} disabled={drafted >= MAX_INITIAL_VISITS} aria-label="+1">
                        +
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {shown.length === 0 ? (
        <p className="hint center">{t("noMatch")}</p>
      ) : (
        pages > 1 && (
          <nav className="pager">
            <button className="seg" disabled={current === 0} onClick={() => go(current - 1)}>
              ← {t("prev")}
            </button>
            <span>{t("pageOf", { page: current + 1, pages, n: shown.length })}</span>
            <button className="seg" disabled={current >= pages - 1} onClick={() => go(current + 1)}>
              {t("next")} →
            </button>
          </nav>
        )
      )}
    </section>
  );
}
