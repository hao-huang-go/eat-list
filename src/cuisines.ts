import type { Lang } from "./i18n";

export const CUISINES = [
  "hotpot", "sichuan_hunan", "chinese", "cantonese", "noodles", "korean",
  "japanese", "southeast_asian", "brunch", "dessert", "bbq", "western",
] as const;
export type Cuisine = (typeof CUISINES)[number];

const LABELS: Record<Cuisine, [zh: string, en: string]> = {
  hotpot: ["火锅", "Hotpot"],
  sichuan_hunan: ["川湘菜", "Sichuan & Hunan"],
  chinese: ["中餐", "Chinese"],
  cantonese: ["粤菜点心", "Cantonese & dim sum"],
  noodles: ["面 / 粉", "Noodles"],
  korean: ["韩餐", "Korean"],
  japanese: ["日料", "Japanese"],
  southeast_asian: ["东南亚", "Southeast Asian"],
  brunch: ["Brunch / 咖啡", "Brunch & coffee"],
  dessert: ["甜品 / 饮品", "Dessert & drinks"],
  bbq: ["烧烤 / 烤肉", "BBQ"],
  western: ["西餐", "Western"],
};

// The "taste type" a year-in-review assigns when one cuisine family dominates.
const TASTES: Record<Cuisine, [zh: string, en: string]> = {
  hotpot: ["川湘重口派 🌶️", "Spice chaser 🌶️"],
  sichuan_hunan: ["川湘重口派 🌶️", "Spice chaser 🌶️"],
  chinese: ["家乡味守护者 🥢", "Taste-of-home keeper 🥢"],
  cantonese: ["粤式早茶派 🥟", "Yum cha devotee 🥟"],
  noodles: ["碳水嗦面派 🍜", "Noodle slurper 🍜"],
  korean: ["日韩精致派 🍱", "K & J food fan 🍱"],
  japanese: ["日韩精致派 🍱", "K & J food fan 🍱"],
  southeast_asian: ["东南亚风味派 🍛", "Southeast Asian flavour hunter 🍛"],
  brunch: ["Brunch 咖啡续命派 ☕", "Brunch & coffee regular ☕"],
  dessert: ["甜品续命派 🍰", "Sweet tooth 🍰"],
  bbq: ["烤肉撸串派 🍖", "Grill master 🍖"],
  western: ["西餐牛排派 🥩", "Steak & wine type 🥩"],
};

export const cuisineLabel = (c: Cuisine, lang: Lang) => LABELS[c][lang === "zh" ? 0 : 1];
export const tasteLabel = (c: Cuisine, lang: Lang) => TASTES[c][lang === "zh" ? 0 : 1];
export const omnivoreLabel = (lang: Lang) => (lang === "zh" ? "杂食探险家 🧭" : "Adventurous omnivore 🧭");
