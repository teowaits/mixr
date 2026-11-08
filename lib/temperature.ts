import type { IngredientLine, Temperature } from "@/lib/types";

const HOT_INSTRUCTION =
  /\b(boil|boiling|boiled|mulled|mull|simmer|steaming|steam|hot water|boiling water|pour hot|top with hot|heat until|warmed|warm the|serve hot|hot coffee|hot milk|hot chocolate)\b/i;

export function inferTemperature(input: {
  category: string | null;
  glass: string | null;
  instructions: string;
  ingredients: IngredientLine[];
}): Temperature {
  if (HOT_INSTRUCTION.test(input.instructions)) return "hot";
  const place = `${input.category ?? ""} ${input.glass ?? ""}`.toLowerCase();
  const shakenCold = /\b(ice|shake|frozen|blend)\b/i.test(input.instructions);
  if (/coffee|tea/.test(place) && /mug/.test(place) && !shakenCold) return "hot";
  const names = input.ingredients.map((line) => line.name.toLowerCase()).join(" ");
  if (/\bhot chocolate\b/.test(names) && !shakenCold) return "hot";
  return "cold";
}
