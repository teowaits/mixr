import { ingredientKey, tokens } from "@/lib/normalize";
import type { Hemisphere, IngredientLine, Season } from "@/lib/types";

const NORTH: Season[] = [
  "winter",
  "winter",
  "spring",
  "spring",
  "spring",
  "summer",
  "summer",
  "summer",
  "fall",
  "fall",
  "fall",
  "winter",
];

const FLIP: Record<Season, Season> = {
  winter: "summer",
  summer: "winter",
  spring: "fall",
  fall: "spring",
};

const SHELF =
  /\b(ale|beer|brandy|liqueur|schnapps|wine|rum|whiskey|vodka|gin|bourbon|scotch|tequila|vermouth|curacao|bitters|syrup|cream|kahlua|baileys)\b/;

const PRODUCE: { needle: string; seasons: Season[] }[] = [
  { needle: "cranberry", seasons: ["fall", "winter"] },
  { needle: "cinnamon", seasons: ["fall", "winter"] },
  { needle: "nutmeg", seasons: ["fall", "winter"] },
  { needle: "clove", seasons: ["fall", "winter"] },
  { needle: "cloves", seasons: ["fall", "winter"] },
  { needle: "peppermint", seasons: ["winter"] },
  { needle: "pomegranate", seasons: ["fall", "winter"] },
  { needle: "cocoa", seasons: ["winter"] },
  { needle: "eggnog", seasons: ["winter"] },
  { needle: "apple", seasons: ["fall"] },
  { needle: "cider", seasons: ["fall"] },
  { needle: "pear", seasons: ["fall"] },
  { needle: "pumpkin", seasons: ["fall"] },
  { needle: "maple", seasons: ["fall"] },
  { needle: "ginger", seasons: ["fall", "winter"] },
  { needle: "strawberry", seasons: ["spring", "summer"] },
  { needle: "rhubarb", seasons: ["spring"] },
  { needle: "mint", seasons: ["spring", "summer"] },
  { needle: "watermelon", seasons: ["summer"] },
  { needle: "peach", seasons: ["summer"] },
  { needle: "pineapple", seasons: ["summer"] },
  { needle: "mango", seasons: ["summer"] },
  { needle: "basil", seasons: ["summer"] },
  { needle: "cucumber", seasons: ["summer"] },
  { needle: "cantaloupe", seasons: ["summer"] },
  { needle: "melon", seasons: ["summer"] },
  { needle: "passion", seasons: ["summer"] },
  { needle: "coconut", seasons: ["summer"] },
  { needle: "berry", seasons: ["summer"] },
  { needle: "berries", seasons: ["summer"] },
  { needle: "blackberry", seasons: ["summer"] },
  { needle: "raspberry", seasons: ["summer"] },
  { needle: "blueberry", seasons: ["summer"] },
];

export function seasonForMonth(monthIndex: number, hemisphere: Hemisphere): Season {
  const north = NORTH[monthIndex] ?? "winter";
  return hemisphere === "north" ? north : FLIP[north];
}

export function currentSeason(hemisphere: Hemisphere, now = new Date()): Season {
  return seasonForMonth(now.getMonth(), hemisphere);
}

function matchesProduce(key: string, needle: string): boolean {
  const hit = needle.includes(" ") ? key.includes(needle) : tokens(key).includes(needle);
  if (!hit) return false;
  if (SHELF.test(key) && !/\b(juice|cider|nectar|puree|fresh)\b/.test(key)) {
    return false;
  }
  return true;
}

export function seasonsForIngredients(lines: IngredientLine[]): Season[] {
  const found = new Set<Season>();
  for (const line of lines) {
    const key = ingredientKey(line.name);
    if (!key) continue;
    if (key === "hot chocolate" || key.includes("hot chocolate")) {
      found.add("winter");
    }
    for (const rule of PRODUCE) {
      if (matchesProduce(key, rule.needle)) {
        for (const season of rule.seasons) found.add(season);
      }
    }
  }
  return [...found];
}

export const SEASON_LABEL: Record<Season, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};
