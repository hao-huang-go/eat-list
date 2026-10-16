import { useEffect, useState } from "react";
import { fetchRanking, type Ranking as RankingData } from "./api";
import { AreaPicker } from "./AreaPicker";
import { cuisineLabel, type Cuisine } from "./cuisines";
import { CuisineChips } from "./CuisineChips";
import { matchesArea, matchesCuisine, type Area } from "./filters";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

const TOP = 20;

interface Props {
  lang: Lang;
  mine: Record<string, number>;
}

// Top restaurants by the visits everyone has recorded, filtered by area and cuisine.
export function Ranking({ lang, mine }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [data, setData] = useState<RankingData | null>(null);
  const [failed, setFailed] = useState(false);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [area, setArea] = useState<Area>("all");

  useEffect(() => {
    fetchRanking().then(setData).catch(() => setFailed(true));
  }, []);

  const rows = data
    ? RESTAURANTS.filter((r) => data.restaurants[r.id] && matchesArea(r, area) && matchesCuisine(r, cuisine))
        .map((r) => ({ r, visits: data.restaurants[r.id][0], people: data.restaurants[r.id][1] }))
        .sort((a, b) => b.visits - a.visits || b.people - a.people)
        .slice(0, TOP)
    : [];

  return (
    <section className="ranking">
      <div className="filters">
        <CuisineChips lang={lang} value={cuisine} onChange={setCuisine} />
        <div className="toggles">
          <AreaPicker lang={lang} value={area} onChange={setArea} />
          {data && <span className="hint">{t("rankPeople", { n: data.people })}</span>}
        </div>
      </div>
      <h3>{t("rankTitle", { n: TOP })}</h3>
      {failed && <p className="error">{t("saveError")}</p>}
      {data && rows.length === 0 && <p className="hint">{t("rankEmpty")}</p>}
      <ol className="board">
        {rows.map(({ r, visits, people }, i) => {
          const [primary, secondary] = restaurantNames(r, lang);
          return (
            <li key={r.id} className={mine[r.id] ? "mine" : ""}>
              <span className={i < 3 ? "medal top" : "medal"}>{i + 1}</span>
              <div className="place-name">
                <b>
                  {primary}
                  {secondary && <span className="alt">{secondary}</span>}
                </b>
                <small>
                  {r.area} · {cuisineLabel(r.cuisine, lang)}
                </small>
              </div>
              <div className="score">
                <b>{t("rankVisits", { n: visits })}</b>
                <small>{t("rankPeopleShort", { n: people })}</small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
