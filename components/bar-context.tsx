"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getBarSnapshot,
  getServerBarSnapshot,
  patchFilters,
  patchSettings,
  replacePantry,
  subscribeBar,
  updateBar,
} from "@/lib/bar-store";
import { parseBundle, type ImportResult } from "@/lib/bundle";
import {
  CATALOG_MAX_AGE_MS,
  readSnapshot,
  writeSnapshot,
  type CatalogSnapshot,
} from "@/lib/catalog-store";
import { fetchCatalog, fingerprintKey, mergeRecipes, searchByName } from "@/lib/cocktaildb";
import { ingredientKey, newId } from "@/lib/normalize";
import { defaultFilters, type Filters, type PantryItem, type Recipe, type Settings } from "@/lib/types";

type CatalogStatus = "idle" | "loading" | "ready" | "error";

type CatalogState = {
  status: CatalogStatus;
  progress: { done: number; total: number; letter: string };
  recipes: Recipe[];
  truncated: boolean;
  cappedLetters: string[];
  fetchedAt: number | null;
  error: string | null;
};

type BarContextValue = {
  hydrated: boolean;
  pantry: PantryItem[];
  customRecipes: Recipe[];
  savedIds: string[];
  settings: Settings;
  filters: Filters;
  catalog: CatalogState;
  allRecipes: Recipe[];
  ingredientOptions: string[];
  addPantry: (name: string) => void;
  addPantryMany: (names: string[]) => void;
  renamePantry: (id: string, name: string) => void;
  removePantry: (id: string) => void;
  clearPantry: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  saveCustom: (recipe: Recipe) => void;
  deleteCustom: (id: string) => void;
  importBundle: (raw: unknown, mode: "merge" | "replace") => ImportResult;
  refreshCatalog: () => void;
  searchRemote: (query: string) => Promise<number>;
};

const BarContext = createContext<BarContextValue | null>(null);

const initialCatalog: CatalogState = {
  status: "idle",
  progress: { done: 0, total: 26, letter: "" },
  recipes: [],
  truncated: false,
  cappedLetters: [],
  fetchedAt: null,
  error: null,
};

function applySnapshot(snapshot: CatalogSnapshot): CatalogState {
  return {
    status: "ready",
    progress: { done: 26, total: 26, letter: "" },
    recipes: snapshot.recipes,
    truncated: snapshot.truncated,
    cappedLetters: snapshot.cappedLetters,
    fetchedAt: snapshot.fetchedAt,
    error: null,
  };
}

export function BarProvider({ children }: { children: React.ReactNode }) {
  const bar = useSyncExternalStore(subscribeBar, getBarSnapshot, getServerBarSnapshot);
  const [catalog, setCatalog] = useState<CatalogState>(initialCatalog);
  const catalogRef = useRef<Recipe[]>([]);
  const loadId = useRef(0);

  const runCatalogLoad = useCallback(async (key: string, force: boolean) => {
    const requestId = ++loadId.current;
    const fingerprint = fingerprintKey(key);
    await Promise.resolve();
    if (requestId !== loadId.current) return;
    setCatalog((current) => ({
      ...current,
      status: "loading",
      error: null,
      progress: { done: 0, total: 26, letter: "a" },
    }));

    try {
      if (!force) {
        const cached = await readSnapshot();
        if (
          cached &&
          cached.fingerprint === fingerprint &&
          Date.now() - cached.fetchedAt < CATALOG_MAX_AGE_MS
        ) {
          if (requestId !== loadId.current) return;
          catalogRef.current = cached.recipes;
          setCatalog(applySnapshot(cached));
          return;
        }
      }

      const fetched = await fetchCatalog(key, (done, total, letter) => {
        if (requestId !== loadId.current) return;
        setCatalog((current) => ({
          ...current,
          status: "loading",
          progress: { done, total, letter },
        }));
      });
      if (requestId !== loadId.current) return;
      const snapshot: CatalogSnapshot = {
        schema: 1,
        fingerprint,
        fetchedAt: Date.now(),
        recipes: fetched.recipes,
        truncated: fetched.truncated,
        cappedLetters: fetched.cappedLetters,
      };
      await writeSnapshot(snapshot);
      catalogRef.current = fetched.recipes;
      setCatalog(applySnapshot(snapshot));
    } catch (error) {
      if (requestId !== loadId.current) return;
      const cached = await readSnapshot().catch(() => null);
      const message = error instanceof Error ? error.message : "TheCocktailDB didn’t answer.";
      if (cached?.recipes.length) {
        catalogRef.current = cached.recipes;
        setCatalog({
          ...applySnapshot(cached),
          error: `${message} Showing the catalog saved in this browser.`,
        });
        return;
      }
      setCatalog({ ...initialCatalog, status: "error", error: message });
    }
  }, []);

  useEffect(() => {
    if (!bar.hydrated) return;
    const key = bar.settings.apiKey;
    const timer = window.setTimeout(() => {
      void runCatalogLoad(key, false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bar.hydrated, bar.settings.apiKey, runCatalogLoad]);

  const addNames = useCallback((names: string[]) => {
    updateBar((current) => {
      const next = [...current.pantry];
      const seen = new Set(current.pantry.map((item) => ingredientKey(item.name)));
      for (const name of names) {
        const trimmed = name.trim();
        const key = ingredientKey(trimmed);
        if (!trimmed || !key || seen.has(key)) continue;
        seen.add(key);
        next.push({ id: newId(), name: trimmed });
      }
      next.sort((a, b) => a.name.localeCompare(b.name));
      return { ...current, pantry: next };
    });
  }, []);

  const ingredientOptions = useMemo(() => {
    const names = new Set<string>();
    for (const recipe of catalog.recipes) {
      for (const line of recipe.ingredients) names.add(line.name.trim());
    }
    for (const recipe of bar.customRecipes) {
      for (const line of recipe.ingredients) names.add(line.name.trim());
    }
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [catalog.recipes, bar.customRecipes]);

  const allRecipes = useMemo(() => {
    const customs = new Map(bar.customRecipes.map((recipe) => [recipe.id, recipe]));
    const merged = catalog.recipes.filter((recipe) => !customs.has(recipe.id));
    return [...merged, ...bar.customRecipes].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog.recipes, bar.customRecipes]);

  const importBundle = useCallback((raw: unknown, mode: "merge" | "replace") => {
    const result = parseBundle(raw);
    const custom = result.bundle.recipes.filter((recipe) => recipe.source === "custom");
    const catalogRecipes = result.bundle.recipes.filter((recipe) => recipe.source === "catalog");
    if (catalogRecipes.length > 0) {
      const next = mergeRecipes(catalogRef.current, catalogRecipes);
      catalogRef.current = next;
      setCatalog((current) => ({ ...current, recipes: next }));
      void readSnapshot()
        .then((cached) => {
          if (cached) return writeSnapshot({ ...cached, recipes: next });
          return undefined;
        })
        .catch(() => undefined);
    }
    updateBar((current) => {
      if (mode === "replace") {
        return {
          ...current,
          pantry: result.bundle.includesPantry ? result.bundle.pantry : current.pantry,
          customRecipes: custom,
          savedIds: result.bundle.savedIds,
        };
      }
      const seen = new Set(current.pantry.map((item) => ingredientKey(item.name)));
      const pantry = [...current.pantry];
      if (result.bundle.includesPantry) {
        for (const item of result.bundle.pantry) {
          const key = ingredientKey(item.name);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          pantry.push({ id: item.id || newId(), name: item.name });
        }
        pantry.sort((a, b) => a.name.localeCompare(b.name));
      }
      const recipes = new Map(current.customRecipes.map((recipe) => [recipe.id, recipe]));
      for (const recipe of custom) recipes.set(recipe.id, recipe);
      return {
        ...current,
        pantry,
        customRecipes: [...recipes.values()],
        savedIds: [...new Set([...current.savedIds, ...result.bundle.savedIds])],
      };
    });
    return result;
  }, []);

  const value = useMemo<BarContextValue>(
    () => ({
      hydrated: bar.hydrated,
      pantry: bar.pantry,
      customRecipes: bar.customRecipes,
      savedIds: bar.savedIds,
      settings: bar.settings,
      filters: bar.filters,
      catalog,
      allRecipes,
      ingredientOptions,
      addPantry: (name) => addNames([name]),
      addPantryMany: addNames,
      renamePantry: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        updateBar((current) => ({
          ...current,
          pantry: current.pantry
            .map((item) => (item.id === id ? { ...item, name: trimmed } : item))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
      },
      removePantry: (id) =>
        updateBar((current) => ({
          ...current,
          pantry: current.pantry.filter((item) => item.id !== id),
        })),
      clearPantry: () => replacePantry([]),
      updateSettings: (patch) => patchSettings(patch),
      updateFilters: (patch) => patchFilters(patch),
      resetFilters: () => updateBar((current) => ({ ...current, filters: defaultFilters() })),
      toggleSaved: (id) =>
        updateBar((current) => ({
          ...current,
          savedIds: current.savedIds.includes(id)
            ? current.savedIds.filter((item) => item !== id)
            : [...current.savedIds, id],
        })),
      isSaved: (id) => bar.savedIds.includes(id),
      saveCustom: (recipe) =>
        updateBar((current) => {
          const index = current.customRecipes.findIndex((item) => item.id === recipe.id);
          if (index === -1) return { ...current, customRecipes: [...current.customRecipes, recipe] };
          const next = [...current.customRecipes];
          next[index] = recipe;
          return { ...current, customRecipes: next };
        }),
      deleteCustom: (id) =>
        updateBar((current) => ({
          ...current,
          customRecipes: current.customRecipes.filter((recipe) => recipe.id !== id),
          savedIds: current.savedIds.filter((saved) => saved !== id),
        })),
      importBundle,
      refreshCatalog: () => {
        void runCatalogLoad(bar.settings.apiKey, true);
      },
      searchRemote: async (query) => {
        if (catalogRef.current.length === 0) return 0;
        const found = await searchByName(bar.settings.apiKey, query);
        const known = new Set(catalogRef.current.map((recipe) => recipe.id));
        const novel = found.filter((recipe) => !known.has(recipe.id));
        if (novel.length === 0) return 0;
        const next = mergeRecipes(catalogRef.current, novel);
        catalogRef.current = next;
        setCatalog((current) => ({ ...current, recipes: next }));
        const cached = await readSnapshot().catch(() => null);
        if (cached) await writeSnapshot({ ...cached, recipes: next });
        return novel.length;
      },
    }),
    [bar, catalog, allRecipes, ingredientOptions, addNames, importBundle, runCatalogLoad],
  );

  return <BarContext.Provider value={value}>{children}</BarContext.Provider>;
}

export function useBar(): BarContextValue {
  const value = useContext(BarContext);
  if (!value) throw new Error("useBar must be used within BarProvider");
  return value;
}
