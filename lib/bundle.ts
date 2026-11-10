import { newId } from "@/lib/normalize";
import type { AlcoholClass, Bundle, PantryItem, Recipe, Season, Temperature } from "@/lib/types";

const ALCOHOL: AlcoholClass[] = ["Alcoholic", "Non alcoholic", "Optional alcohol"];
const SEASONS: Season[] = ["winter", "spring", "summer", "fall"];

export type ImportResult = {
  bundle: Bundle;
  skippedRecipes: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asRecipe(value: unknown): Recipe | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  if (typeof value.instructions !== "string") return null;
  if (!Array.isArray(value.ingredients) || value.ingredients.length === 0) return null;

  const ingredients = [];
  for (const line of value.ingredients) {
    if (!isRecord(line) || typeof line.name !== "string" || !line.name.trim()) continue;
    ingredients.push({
      name: line.name.trim(),
      measure: typeof line.measure === "string" && line.measure.trim() ? line.measure.trim() : null,
    });
  }
  if (ingredients.length === 0) return null;

  const source = value.source === "catalog" ? "catalog" : "custom";
  const id =
    typeof value.id === "string" && value.id.trim()
      ? value.id.trim()
      : source === "custom"
        ? `custom:${newId()}`
        : null;
  if (!id) return null;

  const alcoholic =
    typeof value.alcoholic === "string"
      ? (ALCOHOL.find((item) => item === value.alcoholic) ?? null)
      : null;
  const temperature: Temperature = value.temperature === "hot" ? "hot" : "cold";
  const seasons = Array.isArray(value.seasons)
    ? value.seasons.filter((season): season is Season => SEASONS.includes(season as Season))
    : [];

  return {
    id,
    source,
    name: value.name.trim(),
    category: typeof value.category === "string" && value.category.trim() ? value.category.trim() : null,
    alcoholic,
    glass: typeof value.glass === "string" && value.glass.trim() ? value.glass.trim() : null,
    instructions: value.instructions.trim(),
    image: typeof value.image === "string" && value.image.trim() ? value.image.trim() : null,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
      : [],
    iba: typeof value.iba === "string" && value.iba.trim() ? value.iba.trim() : null,
    ingredients,
    temperature,
    temperatureSource: value.temperatureSource === "inferred" ? "inferred" : "user",
    seasons,
    creditUrl: typeof value.creditUrl === "string" && value.creditUrl.trim() ? value.creditUrl.trim() : null,
  };
}

export function parseBundle(raw: unknown): ImportResult {
  if (!isRecord(raw)) {
    throw new Error("That file isn’t a recipe bundle.");
  }
  if (raw.version !== 1) {
    throw new Error("This file uses a bundle version Mixr doesn’t read yet.");
  }

  const kind = raw.kind === "recipes" ? "recipes" : "all";
  const includesPantry = raw.includesPantry === true || (kind === "all" && Array.isArray(raw.pantry));
  const pantry: PantryItem[] = [];
  if (Array.isArray(raw.pantry)) {
    for (const item of raw.pantry) {
      if (!isRecord(item) || typeof item.name !== "string" || !item.name.trim()) continue;
      pantry.push({
        id: typeof item.id === "string" && item.id.trim() ? item.id : newId(),
        name: item.name.trim(),
      });
    }
  }

  let skippedRecipes = 0;
  const recipes: Recipe[] = [];
  if (Array.isArray(raw.recipes)) {
    for (const item of raw.recipes) {
      const recipe = asRecipe(item);
      if (recipe) recipes.push(recipe);
      else skippedRecipes += 1;
    }
  }

  const savedIds = Array.isArray(raw.savedIds)
    ? raw.savedIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : [];

  return {
    skippedRecipes,
    bundle: {
      version: 1,
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
      kind,
      includesPantry,
      pantry,
      recipes,
      savedIds,
    },
  };
}

export function makeBundle(input: {
  kind: "all" | "recipes";
  pantry: PantryItem[];
  recipes: Recipe[];
  savedIds: string[];
}): Bundle {
  const recipesOnly = input.kind === "recipes";
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    kind: input.kind,
    includesPantry: !recipesOnly,
    pantry: recipesOnly ? [] : input.pantry,
    recipes: input.recipes,
    savedIds: input.savedIds,
  };
}

export function downloadBundle(bundle: Bundle, filename: string): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
