import { cleanText } from "@/lib/normalize";
import { seasonsForIngredients } from "@/lib/seasons";
import { inferTemperature } from "@/lib/temperature";
import type { AlcoholClass, Recipe } from "@/lib/types";
import { TEST_API_KEY } from "@/lib/types";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const FREE_LETTER_CAP = 25;

type RawDrink = Record<string, string | null | undefined>;

const ALCOHOL: AlcoholClass[] = ["Alcoholic", "Non alcoholic", "Optional alcohol"];

function asAlcohol(value: string | null): AlcoholClass | null {
  if (!value) return null;
  return ALCOHOL.find((item) => item.toLowerCase() === value.toLowerCase()) ?? null;
}

export function fingerprintKey(key: string): string {
  const trimmed = key.trim() || TEST_API_KEY;
  if (trimmed === TEST_API_KEY) return "test";
  return `k:${trimmed.length}:${trimmed.slice(-4)}`;
}

function baseUrl(key: string): string {
  const safe = encodeURIComponent(key.trim() || TEST_API_KEY);
  return `https://www.thecocktaildb.com/api/json/v1/${safe}`;
}

async function readDrinks(url: string): Promise<RawDrink[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TheCocktailDB returned ${response.status}.`);
  }
  const data = (await response.json()) as { drinks?: RawDrink[] | string | null };
  if (!data || !Array.isArray(data.drinks)) return [];
  return data.drinks;
}

export function recipeFromApi(raw: RawDrink): Recipe | null {
  const id = cleanText(raw.idDrink);
  const name = cleanText(raw.strDrink);
  if (!id || !name) return null;

  const ingredients = [];
  for (let index = 1; index <= 15; index += 1) {
    const ingredient = cleanText(raw[`strIngredient${index}`]);
    if (!ingredient) continue;
    ingredients.push({
      name: ingredient,
      measure: cleanText(raw[`strMeasure${index}`]),
    });
  }

  const category = cleanText(raw.strCategory);
  const glass = cleanText(raw.strGlass);
  const instructions = cleanText(raw.strInstructions) ?? "";
  const tags = (cleanText(raw.strTags) ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    id: `cdb:${id}`,
    source: "catalog",
    name,
    category,
    alcoholic: asAlcohol(cleanText(raw.strAlcoholic)),
    glass,
    instructions,
    image: cleanText(raw.strDrinkThumb),
    tags,
    iba: cleanText(raw.strIBA),
    ingredients,
    temperature: inferTemperature({ category, glass, instructions, ingredients }),
    temperatureSource: "inferred",
    seasons: seasonsForIngredients(ingredients),
    creditUrl: `https://www.thecocktaildb.com/drink/${id}`,
  };
}

export type CatalogFetch = {
  recipes: Recipe[];
  truncated: boolean;
  cappedLetters: string[];
};

export async function fetchCatalog(
  key: string,
  onProgress: (done: number, total: number, letter: string) => void,
): Promise<CatalogFetch> {
  const recipes = new Map<string, Recipe>();
  const cappedLetters: string[] = [];

  for (let index = 0; index < LETTERS.length; index += 1) {
    const letter = LETTERS[index]!;
    onProgress(index, LETTERS.length, letter);
    const drinks = await readDrinks(`${baseUrl(key)}/search.php?f=${letter}`);
    if (drinks.length >= FREE_LETTER_CAP) cappedLetters.push(letter);
    for (const drink of drinks) {
      const recipe = recipeFromApi(drink);
      if (recipe) recipes.set(recipe.id, recipe);
    }
  }

  onProgress(LETTERS.length, LETTERS.length, "");
  const list = [...recipes.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    recipes: list,
    truncated: cappedLetters.length >= 4,
    cappedLetters,
  };
}

export async function searchByName(key: string, query: string): Promise<Recipe[]> {
  const drinks = await readDrinks(
    `${baseUrl(key)}/search.php?s=${encodeURIComponent(query.trim())}`,
  );
  const recipes: Recipe[] = [];
  for (const drink of drinks) {
    const recipe = recipeFromApi(drink);
    if (recipe) recipes.push(recipe);
  }
  return recipes;
}

export function mergeRecipes(current: Recipe[], extra: Recipe[]): Recipe[] {
  const map = new Map(current.map((recipe) => [recipe.id, recipe]));
  for (const recipe of extra) map.set(recipe.id, recipe);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
