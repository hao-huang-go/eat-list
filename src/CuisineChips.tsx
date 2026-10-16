import { useMemo } from "react";
import { CUISINES, cuisineLabel, type Cuisine } from "./cuisines";
import { translate, type Lang } from "./i18n";
import { RESTAURANTS } from "./restaurants";

interface Props {
  lang: Lang;
  value: Cuisine | null;
  onChange: (cuisine: Cuisine | null) => void;
}

export function CuisineChips({ lang, value, onChange }: Props) {
  const counts = useMemo(() => {
    const m = new Map<Cuisine, number>();
    for (const r of RESTAURANTS) m.set(r.cuisine, (m.get(r.cuisine) ?? 0) + 1);
    return m;
  }, []);
  return (
    <div className="chips" role="group">
      <button className={value === null ? "chip on" : "chip"} onClick={() => onChange(null)}>
        {translate(lang, "all")}
      </button>
      {CUISINES.filter((c) => counts.has(c)).map((c) => (
        <button key={c} className={value === c ? "chip on" : "chip"} onClick={() => onChange(c)}>
          {cuisineLabel(c, lang)}
        </button>
      ))}
    </div>
  );
}
