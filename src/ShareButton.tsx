import { useState } from "react";
import { translate, type Lang } from "./i18n";

// Copies (or opens the system share sheet for) a public link to this report.
export function ShareButton({ lang, id }: { lang: Lang; id: string }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "manual">("idle");
  const url = `${window.location.origin}/r/${id}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: translate(lang, "title"), url });
        return;
      } catch {
        // dismissed or unsupported: fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
    } catch {
      setCopied("manual");
    }
  }

  return (
    <div className="share">
      <button className="primary wide" onClick={() => void share()}>
        {translate(lang, copied === "copied" ? "shareCopied" : "shareButton")}
      </button>
      {copied === "manual" && <input className="share-url" readOnly value={url} onFocus={(e) => e.target.select()} />}
    </div>
  );
}
