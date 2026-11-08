import assert from "node:assert/strict";
import test from "node:test";
import { parseBundle } from "../lib/bundle";
import { filterRecipes } from "../lib/filter-recipes";
import { scoreRecipe } from "../lib/pantry-match";
import { seasonForMonth, seasonsForIngredients } from "../lib/seasons";
import { inferTemperature } from "../lib/temperature";
import { defaultFilters, defaultSettings, type Recipe } from "../lib/types";

function recipe(partial: Partial<Recipe> & Pick<Recipe, "id" | "name" | "ingredients">): Recipe {
  return {
    source: "catalog",
    category: "Cocktail",
    alcoholic: "Alcoholic",
    glass: "Cocktail glass",
    instructions: "Shake with ice and strain.",
    image: null,
    tags: [],
    iba: null,
    temperature: "cold",
    temperatureSource: "inferred",
    seasons: [],
    creditUrl: null,
    ...partial,
  };
}

const settings = defaultSettings();

test("lime juice covers a recipe that asks for lime when substitutes are on", () => {
  const scored = scoreRecipe(
    recipe({
      id: "cdb:1",
      name: "Daiquiri",
      ingredients: [
        { name: "Light rum", measure: "2 oz" },
        { name: "Lime", measure: "1" },
        { name: "Sugar syrup", measure: "1/2 oz" },
        { name: "Ice", measure: null },
      ],
    }),
    ["Light rum", "Lime juice", "Simple syrup"],
    settings,
  );
  assert.deepEqual(scored.missing, []);
});

test("ice is missing when staples are turned off", () => {
  const scored = scoreRecipe(
    recipe({
      id: "cdb:2",
      name: "Highball",
      ingredients: [
        { name: "Gin", measure: "2 oz" },
        { name: "Ice", measure: null },
      ],
    }),
    ["Gin"],
    { ...settings, countStaples: false },
  );
  assert.deepEqual(scored.missing, ["Ice"]);
});

test("apple juice is fall produce and apple brandy is not", () => {
  assert.deepEqual(seasonsForIngredients([{ name: "Apple juice", measure: null }]), ["fall"]);
  assert.deepEqual(seasonsForIngredients([{ name: "Apple brandy", measure: null }]), []);
  assert.deepEqual(seasonsForIngredients([{ name: "Ginger ale", measure: null }]), []);
});

test("hot espresso in a method is hot, a shaken espresso drink is cold", () => {
  assert.equal(
    inferTemperature({
      category: "Coffee / Tea",
      glass: "Coffee mug",
      instructions: "Pour hot espresso over the honey and stir.",
      ingredients: [{ name: "Coffee", measure: "1 cup" }],
    }),
    "hot",
  );
  assert.equal(
    inferTemperature({
      category: "Cocktail",
      glass: "Cocktail glass",
      instructions: "Shake with ice and strain.",
      ingredients: [{ name: "Espresso", measure: "1 oz" }],
    }),
    "cold",
  );
});

test("december is winter in the north and summer in the south", () => {
  assert.equal(seasonForMonth(11, "north"), "winter");
  assert.equal(seasonForMonth(11, "south"), "summer");
});

test("a name search ignores the ready-now cap", () => {
  const margarita = recipe({
    id: "cdb:11007",
    name: "Margarita",
    ingredients: [
      { name: "Tequila", measure: "1 1/2 oz" },
      { name: "Triple sec", measure: "1/2 oz" },
    ],
  });
  const filters = { ...defaultFilters(), query: "margarita", missingMax: 0 as const };
  const found = filterRecipes({
    recipes: [margarita],
    pantry: [],
    savedIds: [],
    settings,
    filters,
  });
  assert.equal(found.length, 1);
  assert.deepEqual(found[0]?.missing, ["Tequila", "Triple sec"]);
});

test("bundle import rejects an unknown version and skips a broken recipe", () => {
  assert.throws(() => parseBundle({ version: 2 }), /version/);
  const result = parseBundle({
    version: 1,
    kind: "recipes",
    includesPantry: false,
    pantry: [],
    savedIds: ["cdb:1"],
    recipes: [
      {
        id: "custom:1",
        source: "custom",
        name: "Porch cooler",
        instructions: "Build over ice.",
        alcoholic: "Non alcoholic",
        temperature: "cold",
        seasons: ["summer"],
        ingredients: [{ name: "Ginger ale", measure: "4 oz" }],
      },
      { name: "" },
    ],
  });
  assert.equal(result.skippedRecipes, 1);
  assert.equal(result.bundle.recipes.length, 1);
  assert.equal(result.bundle.includesPantry, false);
});
