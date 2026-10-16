import { translate, type Lang } from "./i18n";

const COFFEE_URL = "https://buymeacoffee.com/tyah0510";

export function CoffeeCard({ lang }: { lang: Lang }) {
  return (
    <section className="panel coffee">
      <p className="coffee-text">
        <b>{translate(lang, "coffeeTitle")}</b> {translate(lang, "coffeeBody")}
      </p>
      <div className="coffee-actions">
        <a className="secondary" href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
          ☕ {translate(lang, "coffeeButton")}
        </a>
        <button
          type="button"
          className="link"
          onClick={() => document.getElementById("feedback")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {translate(lang, "coffeeFeedback")}
        </button>
      </div>
    </section>
  );
}
