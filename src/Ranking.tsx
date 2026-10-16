import { useEffect, useState } from "react";
import { fetchRanking, type Ranking as RankingData } from "./api";
import { cuisineLabel, type Cuisine } from "./cuisines";
import { FilterPanel } from "./FilterPanel";
import { matchesAreas, matchesCuisines, type Area } from "./filters";
import { translate, type Lang, type MessageKey } from "./i18n";
import { RESTAURANTS, restaurantNames } from "./restaurants";

const TOP = 20;
// A restaurant needs this many people before its repeat rate is ranked, so one regular can't top it.
const MIN_PEOPLE_FOR_REPEAT = 2;

type Period = "year" | "month";
type Sort = "visits" | "people" | "repeat";

interface Props {
  lang: Lang;
  mine: Record<string, number>;
}

// Top restaurants by the visits everyone has recorded (this year or this month), filtered by area and
// cuisine, ranked by total visits, number of people, or repeat rate (visits per person).
export function Ranking({ lang, mine }: Props) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const [data, setData] = useState<RankingData | null>(null);
  const [failed, setFailed] = useState(false);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [period, setPeriod] = useState<Period>("year");
  const [sort, setSort] = useState<Sort>("visits");

  useEffect(() => {
    setData(null);
    fetchRanking(period).then(setData).catch(() => setFailed(true));
  }, [period]);

  const score = (x: { visits: number; people: number }) =>
    sort === "visits" ? x.visits : sort === "people" ? x.people : x.visits / x.people;
  const rows = data
    ? RESTAURANTS.filter((r) => data.restaurants[r.id] && matchesAreas(r, areas) && matchesCuisines(r, cuisines))
        .map((r) => ({ r, visits: data.restaurants[r.id][0], people: data.restaurants[r.id][1] }))
        .filter((x) => sort !== "repeat" || x.people >= MIN_PEOPLE_FOR_REPEAT)
        .sort((a, b) => score(b) - score(a) || b.visits - a.visits || b.people - a.people)
        .slice(0, TOP)
    : [];
  const periods: Period[] = ["year", "month"];
  const sorts: Sort[] = ["visits", "people", "repeat"];
  const periodKeys: Record<Period, MessageKey> = { year: "periodYear", month: "periodMonth" };
  const sortKeys: Record<Sort, MessageKey> = { visits: "sortVisits", people: "sortPeople", repeat: "sortRepeat" };

  return (
    <section className="ranking">
      <div className="switches">
        <div className="segmented" role="group">
          {periods.map((p) => (
            <button key={p} className={period === p ? "seg on" : "seg"} onClick={() => setPeriod(p)}>
              {t(periodKeys[p])}
            </button>
          ))}
        </div>
        <div className="segmented" role="group">
          {sorts.map((s) => (
            <button key={s} className={sort === s ? "seg on" : "seg"} onClick={() => setSort(s)}>
              {t(sortKeys[s])}
            </button>
          ))}
        </div>
      </div>
      <div className="filters">
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
          {data && <span className="hint">{t("rankPeople", { n: data.people })}</span>}
        </div>
      </div>
      <h3>{t(`rankTitle_${period}_${sort}`, { n: TOP })}</h3>
      {sort === "repeat" && <p className="hint">{t("repeatHint", { n: MIN_PEOPLE_FOR_REPEAT })}</p>}
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
                <b>
                  {sort === "people"
                    ? t("rankPeopleShort", { n: people })
                    : sort === "repeat"
                      ? t("rankRepeat", { n: (visits / people).toFixed(1) })
                      : t("rankVisits", { n: visits })}
                </b>
                <small>
                  {sort === "people" ? t("rankVisits", { n: visits }) : t("rankPeopleShort", { n: people })}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
