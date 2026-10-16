export type Lang = "zh" | "en";

const zh = {
  title: "墨尔本吃过几家？",
  subtitle: "{total} 家墨尔本餐厅（小红书热门推荐 + CBD 高分店），勾一勾你吃过的，生成你的 2026 吃货报告",
  people: "已有 {n} 人参与",
  langToggle: "English",
  search: "搜店名或区域",
  all: "全部",
  areaAll: "全部区域",
  filter: "筛选",
  filterCuisine: "菜系（可多选）",
  filterArea: "区域（可多选）",
  clearFilters: "清除",
  areaCbd: "CBD",
  areaSuburbs: "CBD 以外",
  mineOnly: "只看吃过的",
  prev: "上一页",
  next: "下一页",
  pageOf: "第 {page} / {pages} 页 · 共 {n} 家",
  noMatch: "没有找到，换个关键词试试，或者在下面推荐这家店",
  tried: "已吃过 {n} / {total}",
  freqHint: "吃过就点，填今年大概去过几次（最多 10 次，可以直接输数字或 − / +）。提交后打卡只能每天 +1",
  visitHint: "又去吃了？点 +1 记一次，每家店每天最多记一次",
  visitCount: "去过 {n} 次",
  timesUnit: "次",
  firstVisit: "+1 吃过",
  addedToday: "今天已记",
  tabList: "打卡",
  tabRanking: "排行榜",
  tabReport: "我的报告",
  rankLocked: "提交你的清单后解锁排行榜，看看大家最常去哪家",
  rankTitle: "大家最常去 Top {n}",
  rankPeople: "{n} 人参与",
  rankVisits: "{n} 次",
  rankPeopleShort: "{n} 人去过",
  rankEmpty: "这个分类还没有人打卡，来做第一个",
  reportVisits: "今年共记录 {n} 次",
  alreadySubmitted: "这台设备已经提交过了，之后可以在打卡里点 +1 继续记录",
  generate: "生成我的吃货报告",
  generating: "生成中…",
  pickOne: "先勾至少一家",
  saveError: "保存失败了，稍后再试",
  reportTitle: "{year} 墨尔本吃货报告",
  reportTried: "吃过 {n} / {total} 家",
  beat: "打败了 {n}% 的人",
  beatSolo: "你是第一个参与的，快分享给朋友来比",
  favourite: "最常去",
  taste: "你的口味",
  tasteShared: "TA 的口味",
  topCuisines: "吃得最多的菜系",
  gem: "宝藏店",
  gemLine: "你吃过，但只有 {pct}% 的人吃过",
  todo: "大家都吃过，你还没去",
  todoLine: "{pct}% 的人吃过",
  distribution: "大家吃过几家",
  distributionNote: "{n} 人参与 · 中位数 {median} 家",
  edit: "继续打卡 +1",
  shareButton: "分享我的报告",
  shareCopied: "链接已复制，发给朋友吧",
  sharedKicker: "朋友分享的吃货报告 👇",
  sharedCta: "我也来测测我吃过几家 →",
  sharedMissing: "这份报告找不到了",
  beatSoloShared: "TA 是第一批参与的吃货",
  suggestTitle: "名单漏了你的爱店？",
  suggestName: "店名",
  suggestArea: "区域（可选）",
  suggestSend: "推荐",
  suggestThanks: "收到！被推荐多的店会加进名单",
  footer: "非官方小工具，名单整理自小红书热门推荐和 Google 地图上 CBD 的高分餐厅，只存店名和次数，不收集个人信息。",
};

const en: typeof zh = {
  title: "How Many Melbourne Spots Have You Tried?",
  subtitle: "{total} Melbourne restaurants (rednote favourites plus well-rated CBD spots). Tick the ones you've eaten at and get your 2026 foodie report.",
  people: "{n} people so far",
  langToggle: "中文",
  search: "Search by name or suburb",
  all: "All",
  areaAll: "All areas",
  filter: "Filter",
  filterCuisine: "Cuisine (pick any)",
  filterArea: "Area (pick any)",
  clearFilters: "Clear",
  areaCbd: "CBD",
  areaSuburbs: "Outside CBD",
  mineOnly: "Only ones I've tried",
  prev: "Prev",
  next: "Next",
  pageOf: "Page {page} of {pages} · {n} places",
  noMatch: "No match. Try another word, or suggest the place below.",
  tried: "Tried {n} / {total}",
  freqHint: "Tap the ones you've been to and enter roughly how many times this year (up to 10; type it or use − / +). After submitting, check-ins are +1 a day.",
  visitHint: "Been again? Tap +1 to log it. One per restaurant per day.",
  visitCount: "{n} visits",
  timesUnit: "times",
  firstVisit: "+1 been",
  addedToday: "Logged today",
  tabList: "Check in",
  tabRanking: "Rankings",
  tabReport: "My report",
  rankLocked: "Submit your list to unlock the rankings and see where everyone goes most.",
  rankTitle: "Top {n} by visits",
  rankPeople: "{n} people",
  rankVisits: "{n} visits",
  rankPeopleShort: "{n} people",
  rankEmpty: "Nobody has logged this one yet. Be the first.",
  reportVisits: "{n} visits logged this year",
  alreadySubmitted: "This device has already submitted. Keep logging with +1 in Check in.",
  generate: "Get my foodie report",
  generating: "Working…",
  pickOne: "Tick at least one place first",
  saveError: "Couldn't save. Try again shortly.",
  reportTitle: "{year} Melbourne foodie report",
  reportTried: "Tried {n} / {total}",
  beat: "Ahead of {n}% of people",
  beatSolo: "You're the first one here. Share it and compare with friends.",
  favourite: "Most visited",
  taste: "Your taste",
  tasteShared: "Their taste",
  topCuisines: "What you eat most",
  gem: "Hidden gem",
  gemLine: "You've been, but only {pct}% of people have",
  todo: "Everyone's been, you haven't",
  todoLine: "{pct}% of people have been",
  distribution: "How many places people have tried",
  distributionNote: "{n} people · median {median}",
  edit: "Log more visits",
  shareButton: "Share my report",
  shareCopied: "Link copied. Send it to a friend.",
  sharedKicker: "A friend's foodie report 👇",
  sharedCta: "How many have I tried? →",
  sharedMissing: "This report couldn't be found.",
  beatSoloShared: "One of the first foodies here",
  suggestTitle: "Is your favourite missing?",
  suggestName: "Restaurant",
  suggestArea: "Suburb (optional)",
  suggestSend: "Suggest",
  suggestThanks: "Thanks! The most-suggested places get added.",
  footer: "Unofficial. The list comes from popular rednote recommendations and well-rated CBD restaurants on Google Maps. Only restaurants and visit counts are stored, no personal details.",
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
