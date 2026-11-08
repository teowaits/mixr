export type AlcoholClass = "Alcoholic" | "Non alcoholic" | "Optional alcohol";

export type Temperature = "hot" | "cold";

export type Season = "winter" | "spring" | "summer" | "fall";

export type Hemisphere = "north" | "south";

export type IngredientLine = {
  name: string;
  measure: string | null;
};

export type Recipe = {
  id: string;
  source: "catalog" | "custom";
  name: string;
  category: string | null;
  alcoholic: AlcoholClass | null;
  glass: string | null;
  instructions: string;
  image: string | null;
  tags: string[];
  iba: string | null;
  ingredients: IngredientLine[];
  temperature: Temperature;
  temperatureSource: "inferred" | "user";
  seasons: Season[];
  creditUrl: string | null;
};

export type PantryItem = {
  id: string;
  name: string;
};

export type Settings = {
  apiKey: string;
  countStaples: boolean;
  allowSubstitutes: boolean;
  hemisphere: Hemisphere;
};

export type MissingFilter = 0 | 1 | 2;

export type Filters = {
  query: string;
  missingMax: MissingFilter;
  alcohol: "any" | AlcoholClass;
  temperature: "any" | Temperature;
  season: "any" | Season;
  category: string;
  glass: string;
  savedOnly: boolean;
};

export type Bundle = {
  version: 1;
  exportedAt: string;
  kind: "all" | "recipes";
  includesPantry: boolean;
  pantry: PantryItem[];
  recipes: Recipe[];
  savedIds: string[];
};

export const TEST_API_KEY = "1";

export const defaultSettings = (): Settings => ({
  apiKey: TEST_API_KEY,
  countStaples: true,
  allowSubstitutes: true,
  hemisphere: "north",
});

export const defaultFilters = (): Filters => ({
  query: "",
  missingMax: 0,
  alcohol: "any",
  temperature: "any",
  season: "any",
  category: "any",
  glass: "any",
  savedOnly: false,
});
