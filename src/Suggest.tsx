import { useState } from "react";
import { sendSuggestion } from "./api";
import { translate, type Lang, type MessageKey } from "./i18n";

export function Suggest({ lang }: { lang: Lang }) {
  const t = (key: MessageKey) => translate(lang, key);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("busy");
    try {
      await sendSuggestion(name.trim(), area.trim());
      setStatus("done");
      setName("");
      setArea("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="panel suggest" onSubmit={submit}>
      <h3>{t("suggestTitle")}</h3>
      <div className="suggest-row">
        <input placeholder={t("suggestName")} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        <input placeholder={t("suggestArea")} value={area} maxLength={60} onChange={(e) => setArea(e.target.value)} />
        <button className="secondary" disabled={status === "busy" || !name.trim()}>
          {t("suggestSend")}
        </button>
      </div>
      {status === "done" && <p className="hint">{t("suggestThanks")}</p>}
      {status === "error" && <p className="error">{t("saveError")}</p>}
    </form>
  );
}
