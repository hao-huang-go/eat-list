import { useEffect, useState } from "react";
import { addVisit, ApiError, fetchPeople, fetchStats, saveCheckin, type Stats } from "./api";
import { Checklist } from "./Checklist";
import { detectLang, saveLang, translate, type Lang, type MessageKey } from "./i18n";
import { Ranking } from "./Ranking";
import { Report } from "./Report";
import { RESTAURANTS } from "./restaurants";
import { MAX_INITIAL_VISITS } from "./frequency";
import { loadSaved, storeSaved, today, type Saved } from "./saved";
import { visitSource } from "./source";
import { SharedView } from "./SharedView";
import { Suggest } from "./Suggest";

const YEAR = 2026;
type Tab = "list" | "ranking" | "report";

// /r/<id> is a shared report.
const sharedId = /^\/r\/([0-9a-f-]{36})\/?$/i.exec(window.location.pathname)?.[1] ?? null;

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang);
  const [saved, setSaved] = useState<Saved>(loadSaved);
  // A returning visitor who has submitted lands on their report, refreshed.
  const [tab, setTab] = useState<Tab>(() => (loadSaved().id ? "report" : "list"));
  const [stats, setStats] = useState<Stats | null>(null);
  const [people, setPeople] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const submitted = saved.id !== null;

  useEffect(() => {
    visitSource();
    fetchPeople().then(setPeople);
    const s = loadSaved();
    if (s.id) fetchStats(s.id).then((r) => setStats(r.stats)).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en-AU";
    document.title = translate(lang, "title");
  }, [lang]);

  // Functional updates, so quick taps in a row each build on the last one.
  function persist(update: (prev: Saved) => Saved) {
    setSaved((prev) => {
      const next = update(prev);
      storeSaved(next);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await saveCheckin(saved.draft);
      const day = today();
      persist((prev) => ({
        id: result.id,
        draft: {},
        visits: { ...prev.draft },
        addedOn: Object.fromEntries(Object.keys(prev.draft).map((id) => [id, day])),
      }));
      setStats(result.stats);
      setTab("report");
      window.scrollTo({ top: 0 });
    } catch (e) {
      // This device already submitted (e.g. local data was cleared): keep the earlier list on the server.
      if (e instanceof ApiError && e.code === "already_submitted" && typeof e.body.id === "string") {
        const id = e.body.id;
        persist((prev) => ({ ...prev, id }));
        setError(t("alreadySubmitted"));
      } else {
        setError(t("saveError"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function logVisit(id: string) {
    setAdding(id);
    setError(null);
    try {
      const result = await addVisit(id);
      persist((prev) => ({ ...prev, visits: { ...prev.visits, [id]: result.visits }, addedOn: { ...prev.addedOn, [id]: today() } }));
      fetchStats(result.id).then((r) => setStats(r.stats)).catch(() => undefined);
    } catch (e) {
      if (e instanceof ApiError && e.code === "already_today") {
        const known = typeof e.body.visits === "number" ? e.body.visits : null;
        persist((prev) => ({
          ...prev,
          visits: { ...prev.visits, [id]: known ?? prev.visits[id] ?? 1 },
          addedOn: { ...prev.addedOn, [id]: today() },
        }));
      } else {
        setError(t("saveError"));
      }
    } finally {
      setAdding(null);
    }
  }

  const draftCount = Object.keys(saved.draft).length;
  const tabs: Tab[] = ["list", "ranking", "report"];
  const tabKeys: Record<Tab, MessageKey> = { list: "tabList", ranking: "tabRanking", report: "tabReport" };

  return (
    <main>
      <header>
        <div>
          <h1>{t("title")}</h1>
          <p className="subtitle">{t("subtitle", { total: RESTAURANTS.length })}</p>
          {!!people && <p className="people">{t("people", { n: people })}</p>}
        </div>
        <button
          className="lang"
          onClick={() => {
            const next = lang === "zh" ? "en" : "zh";
            setLang(next);
            saveLang(next);
          }}
        >
          {t("langToggle")}
        </button>
      </header>

      {sharedId ? (
        <SharedView lang={lang} id={sharedId} />
      ) : (
        <>
      <nav className="tabs" role="tablist">
        {tabs
          .filter((x) => x !== "report" || submitted)
          .map((x) => (
            <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? "tab on" : "tab"} onClick={() => setTab(x)}>
              {t(tabKeys[x])}
            </button>
          ))}
      </nav>

      {error && <p className="error center">{error}</p>}

      {tab === "report" && submitted && (
        <Report lang={lang} year={YEAR} visits={saved.visits} stats={stats} shareId={saved.id} onEdit={() => setTab("list")} />
      )}
      {tab === "ranking" &&
        (submitted ? <Ranking lang={lang} mine={saved.visits} /> : <p className="panel locked">{t("rankLocked")}</p>)}
      {tab === "list" && (
        <>
          <Checklist
            lang={lang}
            submitted={submitted}
            draft={saved.draft}
            visits={saved.visits}
            addedToday={(id) => saved.addedOn[id] === today()}
            adding={adding}
            onStep={(id, delta) =>
              persist((prev) => {
                const draft = { ...prev.draft };
                const n = Math.min(MAX_INITIAL_VISITS, (draft[id] ?? 0) + delta);
                if (n <= 0) delete draft[id];
                else draft[id] = n;
                return { ...prev, draft };
              })
            }
            onSet={(id, n) =>
              persist((prev) => {
                const draft = { ...prev.draft };
                if (n <= 0) delete draft[id];
                else draft[id] = Math.min(MAX_INITIAL_VISITS, n);
                return { ...prev, draft };
              })
            }
            onAddVisit={(id) => void logVisit(id)}
          />
          {!submitted && (
            <div className="dock">
              <span>{t("tried", { n: draftCount, total: RESTAURANTS.length })}</span>
              <button className="primary" disabled={busy || draftCount === 0} onClick={() => void submit()}>
                {busy ? t("generating") : draftCount === 0 ? t("pickOne") : t("generate")}
              </button>
            </div>
          )}
        </>
      )}

      <Suggest lang={lang} />
        </>
      )}
      <footer>{t("footer")}</footer>
    </main>
  );
}
