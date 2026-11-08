const LEADING_NOISE =
  /\b(fresh|freshly|squeezed|organic|chilled|large|small|whole|ripe)\b/g;

export function ingredientKey(name: string): string {
  let value = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  value = value.replace(/&/g, " and ");
  value = value.replace(/[^a-z0-9\s]/g, " ");
  value = value.replace(LEADING_NOISE, " ");
  value = value.replace(/\bwhisky\b/g, "whiskey");
  value = value.replace(/\s+/g, " ").trim();
  return value;
}

export function tokens(key: string): string[] {
  return key.split(" ").filter(Boolean);
}

export function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
