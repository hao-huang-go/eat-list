export type Lang = "zh" | "en";

const zh = {
  title: "墨尔本吃过几家？",
  subtitle: "{total} 家墨尔本餐厅（小红书热门推荐 + CBD 高分店），勾一勾你吃过的，生成你的 2026 吃货报告",
  people: "已有 {n} 人参与",
  langToggle: "English",
  search: "搜店名或区域",
  all: "全部",
  areaAll: "全部区域",
  areaCbd: "CBD",
  areaSuburbs: "CBD 以外",
  mineOnly: "只看吃过的",
  tried: "已吃过 {n} / {total}",
  freq1: "1 次",
  freq2: "2–5",
  freq3: "6–10",
  freq4: "10+",
  freqHint: "点次数就算吃过，再点一次取消",
  generate: "生成我的吃货报告",
  generating: "生成中…",
  pickOne: "先勾至少一家",
  saveError: "保存失败了，稍后再试",
  reportTitle: "{year} 墨尔本吃货报告",
  reportTried: "吃过 {n} / {total} 家",
  beat: "打败了 {n}% 的人",
  beatSolo: "你是第一个参与的，快分享给朋友来比",
  favourite: "最常去",
  favouriteTimes: "{times}",
  taste: "你的口味",
  topCuisines: "吃得最多的菜系",
  gem: "宝藏店",
  gemLine: "你吃过，但只有 {pct}% 的人吃过",
  todo: "大家都吃过，你还没去",
  todoLine: "{pct}% 的人吃过",
  distribution: "大家吃过几家",
  distributionNote: "{n} 人参与 · 中位数 {median} 家",
  popular: "全城最多人吃过",
  edit: "修改我的清单",
  shareHint: "截图分享给朋友，看看谁更会吃",
  suggestTitle: "名单漏了你的爱店？",
  suggestName: "店名",
  suggestArea: "区域（可选）",
  suggestSend: "推荐",
  suggestThanks: "收到！被推荐多的店会加进名单",
  footer: "非官方小工具，名单整理自小红书热门推荐和 Google 地图上 CBD 的高分餐厅，只存店名和次数区间，不收集个人信息。",
  times1: "1 次",
  times2: "2–5 次",
  times3: "6–10 次",
  times4: "10 次以上",
};

const en: typeof zh = {
  title: "How Many Melbourne Spots Have You Tried?",
  subtitle: "{total} Melbourne restaurants (rednote favourites plus well-rated CBD spots). Tick the ones you've eaten at and get your 2026 foodie report.",
  people: "{n} people so far",
  langToggle: "中文",
  search: "Search by name or suburb",
  all: "All",
  areaAll: "All areas",
  areaCbd: "CBD",
  areaSuburbs: "Outside CBD",
  mineOnly: "Only ones I've tried",
  tried: "Tried {n} / {total}",
  freq1: "Once",
  freq2: "2–5",
  freq3: "6–10",
  freq4: "10+",
  freqHint: "Tap how often to mark it eaten; tap again to clear",
  generate: "Get my foodie report",
  generating: "Working…",
  pickOne: "Tick at least one place first",
  saveError: "Couldn't save. Try again shortly.",
  reportTitle: "{year} Melbourne foodie report",
  reportTried: "Tried {n} / {total}",
  beat: "Ahead of {n}% of people",
  beatSolo: "You're the first one here. Share it and compare with friends.",
  favourite: "Most visited",
  favouriteTimes: "{times}",
  taste: "Your taste",
  topCuisines: "What you eat most",
  gem: "Hidden gem",
  gemLine: "You've been, but only {pct}% of people have",
  todo: "Everyone's been, you haven't",
  todoLine: "{pct}% of people have been",
  distribution: "How many places people have tried",
  distributionNote: "{n} people · median {median}",
  popular: "Tried by the most people",
  edit: "Edit my list",
  shareHint: "Screenshot it and see which friend eats better",
  suggestTitle: "Is your favourite missing?",
  suggestName: "Restaurant",
  suggestArea: "Suburb (optional)",
  suggestSend: "Suggest",
  suggestThanks: "Thanks! The most-suggested places get added.",
  footer: "Unofficial. The list comes from popular rednote recommendations and well-rated CBD restaurants on Google Maps. Only restaurant ticks and visit ranges are stored, no personal details.",
  times1: "once",
  times2: "2–5 times",
  times3: "6–10 times",
  times4: "10+ times",
};

export type MessageKey = keyof typeof zh;
const LANG_KEY = "eat-list.lang.v1";

export function translate(lang: Lang, key: MessageKey, vars: Record<string, string | number> = {}): string {
  return (lang === "zh" ? zh : en)[key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

// Chinese by default; English when the link asks for it (?lang=en) or the visitor chose it before.
export function detectLang(): Lang {
  const fromLink = new URLSearchParams(window.location.search).get("lang");
  if (fromLink === "en" || fromLink === "zh") return fromLink;
  try {
    if (localStorage.getItem(LANG_KEY) === "en") return "en";
  } catch {
    // storage blocked: stay on the default
  }
  return "zh";
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
}
