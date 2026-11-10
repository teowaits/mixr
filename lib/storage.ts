import {
  defaultFilters,
  defaultSettings,
  type Filters,
  type PantryItem,
  type Recipe,
  type Settings,
} from "@/lib/types";

const STORAGE_KEY = "mixr:v1";
const LEGACY_STORAGE_KEY = "on-hand:v1";

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

function parseBar(raw: string): PersistedBar | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
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
    return null;
  }
}

export function readBar(): PersistedBar {
  if (typeof localStorage === "undefined") return emptyBar();
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      return parseBar(current) ?? emptyBar();
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = parseBar(legacy);
      if (migrated) {
        writeBar(migrated);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return migrated;
      }
    }

    return emptyBar();
  } catch {
    return emptyBar();
  }
}

export function writeBar(bar: PersistedBar): void {
  if (typeof localStorage === "undefined") return;
  const settings = { ...bar.settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...bar, version: 1, settings }));
}
