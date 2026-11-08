import { ingredientKey } from "@/lib/normalize";
import { scoreRecipe } from "@/lib/pantry-match";
import type { Filters, PantryItem, Recipe, Settings } from "@/lib/types";

export type ScoredRecipe = {
  recipe: Recipe;
  missing: string[];
  matched: string[];
};

export function filterRecipes(input: {
  recipes: Recipe[];
  pantry: PantryItem[];
  savedIds: string[];
  settings: Settings;
  filters: Filters;
}): ScoredRecipe[] {
  const names = input.pantry.map((item) => item.name);
  const query = input.filters.query.trim().toLowerCase();
  const saved = new Set(input.savedIds);

  const scored = input.recipes
    .map((recipe) => {
      const score = scoreRecipe(recipe, names, input.settings);
      return { recipe, ...score };
    })
    .filter(({ recipe, missing }) => {
      if (input.filters.savedOnly && !saved.has(recipe.id)) return false;
      if (!query && missing.length > input.filters.missingMax) return false;
      if (input.filters.alcohol !== "any" && recipe.alcoholic !== input.filters.alcohol) return false;
      if (input.filters.temperature !== "any" && recipe.temperature !== input.filters.temperature) {
        return false;
      }
      if (input.filters.season !== "any") {
        if (recipe.seasons.length > 0 && !recipe.seasons.includes(input.filters.season)) return false;
      }
      if (input.filters.category !== "any" && recipe.category !== input.filters.category) return false;
      if (input.filters.glass !== "any" && recipe.glass !== input.filters.glass) return false;
      if (!query) return true;
      const haystack = [
        recipe.name,
        recipe.category ?? "",
        recipe.glass ?? "",
        ...recipe.ingredients.map((line) => line.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query) || ingredientKey(haystack).includes(ingredientKey(query));
    });

  scored.sort((a, b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return a.recipe.name.localeCompare(b.recipe.name);
  });
  return scored;
}

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))].sort(
    (a, b) => a.localeCompare(b),
  );
}
