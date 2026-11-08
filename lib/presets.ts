export type PantryPreset = {
  id: string;
  name: string;
  description: string;
  items: string[];
};

export const PANTRY_PRESETS: PantryPreset[] = [
  {
    id: "classic",
    name: "Classic shelf",
    description: "Enough for a martini, a daiquiri, a sour, and a highball.",
    items: [
      "Gin",
      "Vodka",
      "Light rum",
      "Tequila",
      "Bourbon",
      "Triple sec",
      "Dry Vermouth",
      "Sweet Vermouth",
      "Angostura Bitters",
      "Lime juice",
      "Lemon juice",
      "Sugar syrup",
      "Orange juice",
      "Cranberry juice",
      "Soda water",
    ],
  },
  {
    id: "tiki",
    name: "Tiki tray",
    description: "Rum, citrus, and the sweet bottles a long drink asks for.",
    items: [
      "Light rum",
      "Dark rum",
      "Lime juice",
      "Orange juice",
      "Pineapple juice",
      "Grenadine",
      "Angostura Bitters",
      "Sugar syrup",
    ],
  },
  {
    id: "zero",
    name: "Zero-proof",
    description: "Juice, fizz, and mint for drinks that skip the alcohol.",
    items: [
      "Lime juice",
      "Lemon juice",
      "Orange juice",
      "Cranberry juice",
      "Pineapple juice",
      "Ginger ale",
      "Soda water",
      "Sugar syrup",
      "Mint",
      "Grenadine",
    ],
  },
];
