import { ingredientKey } from "@/lib/normalize";
import type { IngredientLine, Recipe, Settings } from "@/lib/types";

const STAPLES = new Set(["ice", "water", "salt", "crushed ice", "cubed ice", "ice cubes"]);

const SUBSTITUTE_GROUPS: string[][] = [
  ["lime", "lime juice"],
  ["lemon", "lemon juice"],
  ["orange", "orange juice"],
  ["sugar syrup", "simple syrup", "syrup", "gomme syrup"],
  ["soda water", "club soda", "carbonated water", "sparkling water"],
  ["bitters", "angostura bitters"],
  ["triple sec", "cointreau"],
  ["light rum", "white rum"],
  ["powdered sugar", "icing sugar"],
];

export function isStaple(name: string): boolean {
  const key = ingredientKey(name);
  if (STAPLES.has(key)) return true;
  return key.endsWith(" ice") || key.startsWith("ice ");
}

function expandedKeys(name: string, allowSubstitutes: boolean): Set<string> {
  const key = ingredientKey(name);
  const keys = new Set<string>([key]);
  if (!allowSubstitutes || !key) return keys;
  for (const group of SUBSTITUTE_GROUPS) {
    const normalized = group.map((item) => ingredientKey(item));
    if (normalized.includes(key)) {
      for (const item of normalized) keys.add(item);
    }
  }
  return keys;
}

export function pantryKeySet(
  names: string[],
  settings: Pick<Settings, "allowSubstitutes" | "countStaples">,
): Set<string> {
  const keys = new Set<string>();
  for (const name of names) {
    for (const key of expandedKeys(name, settings.allowSubstitutes)) {
      if (key) keys.add(key);
    }
  }
  if (settings.countStaples) {
    for (const staple of STAPLES) keys.add(staple);
  }
  return keys;
}

export type IngredientScore = {
  missing: string[];
  matched: string[];
};

export function scoreIngredients(
  lines: IngredientLine[],
  names: string[],
  settings: Pick<Settings, "allowSubstitutes" | "countStaples">,
): IngredientScore {
  const available = pantryKeySet(names, settings);
  const missing: string[] = [];
  const matched: string[] = [];

  for (const line of lines) {
    if (settings.countStaples && isStaple(line.name)) {
      matched.push(line.name);
      continue;
    }
    const keys = expandedKeys(line.name, settings.allowSubstitutes);
    const hit = [...keys].some((key) => available.has(key));
    if (hit) matched.push(line.name);
    else missing.push(line.name);
  }

  return { missing, matched };
}

export function scoreRecipe(
  recipe: Recipe,
  names: string[],
  settings: Pick<Settings, "allowSubstitutes" | "countStaples">,
): IngredientScore {
  return scoreIngredients(recipe.ingredients, names, settings);
}
