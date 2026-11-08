import {
  defaultFilters,
  defaultSettings,
  type Filters,
  type PantryItem,
  type Recipe,
  type Settings,
} from "@/lib/types";

const STORAGE_KEY = "on-hand:v1";

export type PersistedBar = {
  version: 1;
  pantry: PantryItem[];
  customRecipes: Recipe[];
  savedIds: string[];
  settings: Settings;
  filters: Filters;
};

export function emptyBar(): PersistedBar {
  return {
    version: 1,
    pantry: [],
    customRecipes: [],
    savedIds: [],
    settings: defaultSettings(),
    filters: defaultFilters(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readBar(): PersistedBar {
  if (typeof localStorage === "undefined") return emptyBar();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBar();
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return emptyBar();
    const base = emptyBar();
    return {
      version: 1,
      pantry: Array.isArray(parsed.pantry) ? (parsed.pantry as PantryItem[]) : [],
      customRecipes: Array.isArray(parsed.customRecipes)
        ? (parsed.customRecipes as Recipe[])
        : [],
      savedIds: Array.isArray(parsed.savedIds) ? (parsed.savedIds as string[]) : [],
      settings: { ...base.settings, ...(isRecord(parsed.settings) ? parsed.settings : {}) },
      filters: { ...base.filters, ...(isRecord(parsed.filters) ? parsed.filters : {}) },
    };
  } catch {
    return emptyBar();
  }
}

export function writeBar(bar: PersistedBar): void {
  if (typeof localStorage === "undefined") return;
  const settings = { ...bar.settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...bar, version: 1, settings }));
}
