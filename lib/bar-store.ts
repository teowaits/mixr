import { emptyBar, readBar, writeBar, type PersistedBar } from "@/lib/storage";
import type { Filters, PantryItem, Recipe, Settings } from "@/lib/types";

export type LiveBar = PersistedBar & { hydrated: boolean };

const serverSnapshot: LiveBar = { ...emptyBar(), hydrated: false };

let state: PersistedBar = emptyBar();
let snapshot: LiveBar = serverSnapshot;
let booted = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: PersistedBar) {
  state = next;
  snapshot = { ...next, hydrated: true };
  writeBar(next);
  emit();
}

export function subscribeBar(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBarSnapshot(): LiveBar {
  if (!booted && typeof window !== "undefined") {
    booted = true;
    state = readBar();
    snapshot = { ...state, hydrated: true };
  }
  return snapshot;
}

export function getServerBarSnapshot(): LiveBar {
  return serverSnapshot;
}

export function updateBar(updater: (current: PersistedBar) => PersistedBar) {
  if (!booted && typeof window !== "undefined") getBarSnapshot();
  commit(updater(state));
}

export function replacePantry(pantry: PantryItem[]) {
  updateBar((current) => ({ ...current, pantry }));
}

export function replaceCustomRecipes(customRecipes: Recipe[]) {
  updateBar((current) => ({ ...current, customRecipes }));
}

export function replaceSavedIds(savedIds: string[]) {
  updateBar((current) => ({ ...current, savedIds }));
}

export function patchSettings(patch: Partial<Settings>) {
  updateBar((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
}

export function patchFilters(patch: Partial<Filters>) {
  updateBar((current) => ({ ...current, filters: { ...current.filters, ...patch } }));
}
