import { useEffect, useMemo, useState } from "react";
import { CUISINES, cuisineLabel, type Cuisine } from "./cuisines";
import { FREQUENCIES, type Frequency } from "./frequency";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

interface Props {
  lang: Lang;
  items: Record<string, Frequency>;
  onChange: (items: Record<string, Frequency>) => void;
}

type Scope = "all" | "cbd" | "suburbs";
const SCOPES: Scope[] = ["all", "cbd", "suburbs"];
const SCOPE_KEYS: Record<Scope, MessageKey> = { all: "areaAll", cbd: "areaCbd", suburbs: "areaSuburbs" };
const inCbd = (area: string) => area.startsWith("CBD");

const PAGE_SIZE = 10;

const FREQ_KEYS: Record<Frequency, MessageKey> = { 1: "freq1", 2: "freq2", 3: "freq3", 4: "freq4" };

export function Checklist({ lang, items, onChange }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(0);

  // Any change to what's filtered starts again from the first page.
  useEffect(() => setPage(0), [cuisine, query, scope, mineOnly]);

  const counts = useMemo(() => {
    const m = new Map<Cuisine, number>();
    for (const r of RESTAURANTS) m.set(r.cuisine, (m.get(r.cuisine) ?? 0) + 1);
    return m;
  }, []);

  const q = query.trim().toLowerCase();
  const shown = RESTAURANTS.filter(
    (r) =>
      (!cuisine || r.cuisine === cuisine) &&
      (scope === "all" || (scope === "cbd") === inCbd(r.area)) &&
      (!mineOnly || items[r.id] !== undefined) &&
      (!q || (r.name ?? "").toLowerCase().includes(q) || (r.zh ?? "").includes(q) || r.area.toLowerCase().includes(q)),
  );

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  function go(next: number) {
    setPage(next);
    document.querySelector(".places")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pick(id: string, freq: Frequency) {
    const next = { ...items };
    if (next[id] === freq) delete next[id];
    else next[id] = freq;
    onChange(next);
  }

  return (
    <section className="checklist">
      <div className="filters">
        <input className="search" type="search" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips" role="group">
          <button className={cuisine === null ? "chip on" : "chip"} onClick={() => setCuisine(null)}>
            {t("all")} <small>{RESTAURANTS.length}</small>
          </button>
          {CUISINES.filter((c) => counts.has(c)).map((c) => (
            <button key={c} className={cuisine === c ? "chip on" : "chip"} onClick={() => setCuisine(c)}>
              {cuisineLabel(c, lang)} <small>{counts.get(c)}</small>
            </button>
          ))}
        </div>
        <div className="toggles">
          <div className="segmented" role="group">
            {SCOPES.map((s) => (
              <button key={s} className={scope === s ? "seg on" : "seg"} onClick={() => setScope(s)}>
                {t(SCOPE_KEYS[s])}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            {t("mineOnly")}
          </label>
        </div>
        <p className="hint">{t("freqHint")}</p>
      </div>

      <ol className="places">
        {visible.map((r) => {
          const picked = items[r.id];
          const [primary, secondary] = restaurantNames(r, lang);
          return (
            <li key={r.id} className={picked ? "place eaten" : "place"}>
              <div className="place-name">
                <b>
                  {primary}
                  {secondary && <span className="alt">{secondary}</span>}
                </b>
                <small>
                  {r.area} · {cuisineLabel(r.cuisine, lang)}
                </small>
              </div>
              <div className="freqs" role="group" aria-label={primary}>
                {FREQUENCIES.map((f) => (
                  <button key={f} aria-pressed={picked === f} className={picked === f ? "freq on" : "freq"} onClick={() => pick(r.id, f)}>
                    {t(FREQ_KEYS[f])}
                  </button>
                ))}
              </div>
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
