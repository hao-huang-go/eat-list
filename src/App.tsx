import { useEffect, useState } from "react";
import { fetchPeople, fetchStats, saveCheckin, type Stats } from "./api";
import { Checklist } from "./Checklist";
import { detectLang, saveLang, translate, type Lang, type MessageKey } from "./i18n";
import { Report } from "./Report";
import { RESTAURANTS } from "./restaurants";
import { loadSaved, storeSaved, type Saved } from "./saved";
import { visitSource } from "./source";
import { Suggest } from "./Suggest";

const YEAR = 2026;

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang);
  const [saved, setSaved] = useState<Saved>(loadSaved);
  // A returning visitor with a submitted list lands on their report, refreshed.
  const [view, setView] = useState<"list" | "report">(() => (loadSaved().id ? "report" : "list"));
  const [stats, setStats] = useState<Stats | null>(null);
  const [people, setPeople] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);

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

  function update(items: Saved["items"]) {
    const next = { ...saved, items };
    setSaved(next);
    storeSaved(next);
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const result = await saveCheckin(saved.items);
      const next = { items: saved.items, id: result.id };
      setSaved(next);
      storeSaved(next);
      setStats(result.stats);
      setView("report");
      window.scrollTo({ top: 0 });
    } catch {
      setError(t("saveError"));
    } finally {
      setBusy(false);
    }
  }

  const triedCount = Object.keys(saved.items).length;

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

      {view === "report" ? (
        <Report lang={lang} year={YEAR} items={saved.items} stats={stats} onEdit={() => setView("list")} />
      ) : (
        <>
          <Checklist lang={lang} items={saved.items} onChange={update} />
          <div className="dock">
            <span>{t("tried", { n: triedCount, total: RESTAURANTS.length })}</span>
            <button className="primary" disabled={busy || triedCount === 0} onClick={() => void generate()}>
              {busy ? t("generating") : triedCount === 0 ? t("pickOne") : t("generate")}
            </button>
          </div>
          {error && <p className="error center">{error}</p>}
        </>
      )}

      <Suggest lang={lang} />
      <footer>{t("footer")}</footer>
    </main>
  );
}
