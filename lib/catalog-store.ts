import type { Recipe } from "@/lib/types";

export const CATALOG_SCHEMA = 1;

export type CatalogSnapshot = {
  schema: number;
  fingerprint: string;
  fetchedAt: number;
  recipes: Recipe[];
  truncated: boolean;
  cappedLetters: string[];
};

const DB_NAME = "on-hand";
const STORE = "snapshots";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readSnapshot(): Promise<CatalogSnapshot | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    request.onsuccess = () => {
      const value = request.result as CatalogSnapshot | undefined;
      if (!value || value.schema !== CATALOG_SCHEMA) resolve(null);
      else resolve(value);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function writeSnapshot(snapshot: CatalogSnapshot): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(snapshot, KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const CATALOG_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
