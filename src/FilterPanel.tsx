import { useMemo, useState } from "react";
import { CUISINES, cuisineLabel, type Cuisine } from "./cuisines";
import { SUBURBS, toggle, type Area } from "./filters";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS } from "./restaurants";

interface Props {
  lang: Lang;
  cuisines: Cuisine[];
  areas: Area[];
  onChange: (next: { cuisines: Cuisine[]; areas: Area[] }) => void;
}

// Cuisine and area filters behind one button; several of each can be picked at once.
export function FilterPanel({ lang, cuisines, areas, onChange }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [open, setOpen] = useState(false);
  const available = useMemo(() => new Set(RESTAURANTS.map((r) => r.cuisine)), []);
  const active = cuisines.length + areas.length;
  const areaOptions: [Area, string][] = [
    ["cbd", t("areaCbd")],
    ["outside", t("areaSuburbs")],
    ...SUBURBS.map((s): [Area, string] => [`suburb:${s}`, s]),
  ];

  return (
    <div className="filter-panel">
      <div className="filter-bar">
        <button className={active ? "filter-toggle on" : "filter-toggle"} onClick={() => setOpen(!open)} aria-expanded={open}>
          {t("filter")}
          {active > 0 && <span className="badge">{active}</span>}
          <span className="caret">{open ? "▲" : "▼"}</span>
        </button>
        {active > 0 && (
          <button className="link" onClick={() => onChange({ cuisines: [], areas: [] })}>
            {t("clearFilters")}
          </button>
        )}
      </div>
      {open && (
        <div className="filter-body">
          <p className="label">{t("filterCuisine")}</p>
          <div className="wrap-chips">
            {CUISINES.filter((c) => available.has(c)).map((c) => (
              <button
                key={c}
                aria-pressed={cuisines.includes(c)}
                className={cuisines.includes(c) ? "chip on" : "chip"}
                onClick={() => onChange({ cuisines: toggle(cuisines, c), areas })}
              >
                {cuisineLabel(c, lang)}
              </button>
            ))}
          </div>
          <p className="label">{t("filterArea")}</p>
          <div className="wrap-chips">
            {areaOptions.map(([area, label]) => (
              <button
                key={area}
                aria-pressed={areas.includes(area)}
                className={areas.includes(area) ? "chip on" : "chip"}
                onClick={() => onChange({ cuisines, areas: toggle(areas, area) })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
