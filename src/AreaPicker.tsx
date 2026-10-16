import { SUBURBS, type Area } from "./filters";
import { translate, type Lang } from "./i18n";

interface Props {
  lang: Lang;
  value: Area;
  onChange: (area: Area) => void;
}

export function AreaPicker({ lang, value, onChange }: Props) {
  return (
    <select className="area" value={value} onChange={(e) => onChange(e.target.value as Area)} aria-label={translate(lang, "areaAll")}>
      <option value="all">{translate(lang, "areaAll")}</option>
      <option value="cbd">{translate(lang, "areaCbd")}</option>
      <option value="outside">{translate(lang, "areaSuburbs")}</option>
      {SUBURBS.map((s) => (
        <option key={s} value={`suburb:${s}`}>
          · {s}
        </option>
      ))}
    </select>
  );
}
