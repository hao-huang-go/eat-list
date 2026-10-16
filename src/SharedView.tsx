import { useEffect, useState } from "react";
import { fetchSharedReport, type SharedReport } from "./api";
import { translate, type Lang } from "./i18n";
import { CoffeeCard } from "./CoffeeCard";
import { Report } from "./Report";

// Someone else's report, opened from a shared link: read-only, with a way in for the viewer.
export function SharedView({ lang, id }: { lang: Lang; id: string }) {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetchSharedReport(id).then(setReport).catch(() => setMissing(true));
  }, [id]);

  return (
    <>
      <p className="shared-kicker">{translate(lang, "sharedKicker")}</p>
      {missing && <p className="panel locked">{translate(lang, "sharedMissing")}</p>}
      {report && <Report lang={lang} year={report.year} visits={report.visits} stats={report.stats} shared />}
      <a className="primary wide cta" href="/">
        {translate(lang, "sharedCta")}
      </a>
      <CoffeeCard lang={lang} />
    </>
  );
}
