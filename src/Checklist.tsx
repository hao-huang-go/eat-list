import { useEffect, useState } from "react";
import { AreaPicker } from "./AreaPicker";
import { cuisineLabel, type Cuisine } from "./cuisines";
import { CuisineChips } from "./CuisineChips";
import { matchesArea, matchesCuisine, type Area } from "./filters";
import { FREQUENCIES, type Frequency } from "./frequency";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

interface Props {
  lang: Lang;
  // Before submitting: rough bands per restaurant. After: visit counts, only ever added to.
  submitted: boolean;
  draft: Record<string, Frequency>;
  visits: Record<string, number>;
  addedToday: (id: string) => boolean;
  adding: string | null;
  onPick: (id: string, freq: Frequency) => void; // picking the band already chosen clears it
  onAddVisit: (id: string) => void;
}

const PAGE_SIZE = 10;
const FREQ_KEYS: Record<Frequency, MessageKey> = { 1: "freq1", 2: "freq2", 3: "freq3", 4: "freq4" };

export function Checklist({ lang, submitted, draft, visits, addedToday, adding, onPick, onAddVisit }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<Area>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(0);

  // Any change to what's filtered starts again from the first page.
  useEffect(() => setPage(0), [cuisine, query, area, mineOnly]);

  const isMine = (id: string) => (submitted ? visits[id] !== undefined : draft[id] !== undefined);
  const q = query.trim().toLowerCase();
  const shown = RESTAURANTS.filter(
    (r) =>
      matchesCuisine(r, cuisine) &&
      matchesArea(r, area) &&
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
        <CuisineChips lang={lang} value={cuisine} onChange={setCuisine} />
        <div className="toggles">
          <AreaPicker lang={lang} value={area} onChange={setArea} />
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
          const picked = draft[r.id];
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
                <div className="freqs" role="group" aria-label={primary}>
                  {FREQUENCIES.map((f) => (
                    <button key={f} aria-pressed={picked === f} className={picked === f ? "freq on" : "freq"} onClick={() => onPick(r.id, f)}>
                      {t(FREQ_KEYS[f])}
                    </button>
                  ))}
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
