import { useState } from "react";
import { sendFeedback, type FeedbackWant } from "./api";
import { translate, type Lang, type MessageKey } from "./i18n";

const WANTS: FeedbackWant[] = ["more_places", "sydney", "friends", "nearby", "monthly", "other"];
const WANT_KEYS: Record<FeedbackWant, MessageKey> = {
  more_places: "fbMorePlaces",
  sydney: "fbSydney",
  friends: "fbFriends",
  nearby: "fbNearby",
  monthly: "fbMonthly",
  other: "fbOther",
};

export function FeedbackCard({ lang, submitted }: { lang: Lang; submitted: boolean }) {
  const t = (key: MessageKey) => translate(lang, key);
  const [wants, setWants] = useState<FeedbackWant[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error" | "empty">("idle");

  if (status === "done") {
    return (
      <section className="panel" id="feedback">
        <h3>{t("fbThanksTitle")}</h3>
        <p className="hint">{t("fbThanks")}</p>
      </section>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!wants.length && !message.trim()) {
      setStatus("empty");
      return;
    }
    setStatus("busy");
    try {
      await sendFeedback({ wants, message: message.trim(), lang, submitted });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="panel feedback" id="feedback" onSubmit={submit}>
      <h3>{t("fbTitle")}</h3>
      <div className="wrap-chips">
        {WANTS.map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={wants.includes(w)}
            className={wants.includes(w) ? "chip on" : "chip"}
            onClick={() => setWants((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w]))}
          >
            {t(WANT_KEYS[w])}
          </button>
        ))}
      </div>
      <textarea rows={3} maxLength={1000} placeholder={t("fbPlaceholder")} value={message} onChange={(e) => setMessage(e.target.value)} />
      {status === "empty" && <p className="error">{t("fbEmpty")}</p>}
      {status === "error" && <p className="error">{t("saveError")}</p>}
      <button className="primary" disabled={status === "busy"}>
        {t("fbSend")}
      </button>
      <p className="hint">{t("fbAnon")}</p>
    </form>
  );
}
