"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { newId } from "@/lib/normalize";
import { SEASON_LABEL } from "@/lib/seasons";
import { inferTemperature } from "@/lib/temperature";
import type { AlcoholClass, Recipe, Season, Temperature } from "@/lib/types";

type DraftLine = { name: string; measure: string };

type Draft = {
  name: string;
  category: string;
  glass: string;
  alcoholic: AlcoholClass | "unspecified";
  temperature: Temperature | "infer";
  seasons: Season[];
  instructions: string;
  lines: DraftLine[];
};

const SEASONS: Season[] = ["winter", "spring", "summer", "fall"];

function fromRecipe(recipe: Recipe | null): Draft {
  if (!recipe) {
    return {
      name: "",
      category: "",
      glass: "",
      alcoholic: "unspecified",
      temperature: "infer",
      seasons: [],
      instructions: "",
      lines: [
        { name: "", measure: "" },
        { name: "", measure: "" },
      ],
    };
  }
  return {
    name: recipe.name,
    category: recipe.category ?? "",
    glass: recipe.glass ?? "",
    alcoholic: recipe.alcoholic ?? "unspecified",
    temperature: recipe.temperatureSource === "user" ? recipe.temperature : "infer",
    seasons: recipe.seasons,
    instructions: recipe.instructions,
    lines: recipe.ingredients.map((line) => ({
      name: line.name,
      measure: line.measure ?? "",
    })),
  };
}

function RecipeFields({
  initial,
  onOpenChange,
  onSubmit,
}: {
  initial?: Recipe | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (recipe: Recipe) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => fromRecipe(initial ?? null));
  const [error, setError] = useState<string | null>(null);

  function toggleSeason(season: Season) {
    setDraft((current) => ({
      ...current,
      seasons: current.seasons.includes(season)
        ? current.seasons.filter((item) => item !== season)
        : [...current.seasons, season],
    }));
  }

  function submit() {
    const lines = draft.lines
      .map((line) => ({ name: line.name.trim(), measure: line.measure.trim() }))
      .filter((line) => line.name);
    if (!draft.name.trim()) {
      setError("Name the drink.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }
    if (!draft.instructions.trim()) {
      setError("Write the method, even if it’s only a sentence.");
      return;
    }

    const ingredients = lines.map((line) => ({
      name: line.name,
      measure: line.measure || null,
    }));
    const temperature =
      draft.temperature === "infer"
        ? inferTemperature({
            category: draft.category || null,
            glass: draft.glass || null,
            instructions: draft.instructions,
            ingredients,
          })
        : draft.temperature;

    onSubmit({
      id: initial?.id ?? `custom:${newId()}`,
      source: "custom",
      name: draft.name.trim(),
      category: draft.category.trim() || null,
      alcoholic: draft.alcoholic === "unspecified" ? null : draft.alcoholic,
      glass: draft.glass.trim() || null,
      instructions: draft.instructions.trim(),
      image: initial?.image ?? null,
      tags: initial?.tags ?? [],
      iba: null,
      ingredients,
      temperature,
      temperatureSource: draft.temperature === "infer" ? "inferred" : "user",
      seasons: draft.seasons,
      creditUrl: null,
    });
    onOpenChange(false);
  }

  return (
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit recipe" : "New recipe"}</DialogTitle>
          <DialogDescription>
            Drinks you write live in this browser and match against the bar the same way
            catalog recipes do.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipe-name">Name</Label>
            <Input
              id="recipe-name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="recipe-category">Category</Label>
              <Input
                id="recipe-category"
                value={draft.category}
                placeholder="Cocktail, punch, coffee…"
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipe-glass">Glass</Label>
              <Input
                id="recipe-glass"
                value={draft.glass}
                placeholder="Coupe, highball…"
                onChange={(event) => setDraft({ ...draft, glass: event.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Alcohol</Label>
              <Select
                value={draft.alcoholic}
                onValueChange={(value) =>
                  setDraft({ ...draft, alcoholic: value as Draft["alcoholic"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  <SelectItem value="Alcoholic">Alcoholic</SelectItem>
                  <SelectItem value="Non alcoholic">No alcohol</SelectItem>
                  <SelectItem value="Optional alcohol">Optional alcohol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Temperature</Label>
              <Select
                value={draft.temperature}
                onValueChange={(value) =>
                  setDraft({ ...draft, temperature: value as Draft["temperature"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infer">Infer from the method</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Seasonal produce</legend>
            <p className="text-xs text-muted-foreground">
              Leave these off for a year-round drink. Checked seasons stay visible in that
              filter.
            </p>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((season) => {
                const on = draft.seasons.includes(season);
                return (
                  <Button
                    key={season}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => toggleSeason(season)}
                  >
                    {SEASON_LABEL[season]}
                  </Button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDraft({ ...draft, lines: [...draft.lines, { name: "", measure: "" }] })
                }
              >
                Add line
              </Button>
            </div>
            <div className="grid gap-2">
              {draft.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[1fr_7rem_auto] gap-2">
                  <Input
                    aria-label={`Ingredient ${index + 1}`}
                    placeholder="Gin"
                    value={line.name}
                    onChange={(event) => {
                      const lines = [...draft.lines];
                      lines[index] = { ...line, name: event.target.value };
                      setDraft({ ...draft, lines });
                    }}
                  />
                  <Input
                    aria-label={`Measure ${index + 1}`}
                    placeholder="2 oz"
                    value={line.measure}
                    onChange={(event) => {
                      const lines = [...draft.lines];
                      lines[index] = { ...line, measure: event.target.value };
                      setDraft({ ...draft, lines });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        lines: draft.lines.filter((_, lineIndex) => lineIndex !== index),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipe-method">Method</Label>
            <Textarea
              id="recipe-method"
              rows={5}
              value={draft.instructions}
              onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{initial ? "Save changes" : "Save recipe"}</Button>
        </DialogFooter>
      </DialogContent>
  );
}

export function RecipeForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Recipe | null;
  onSubmit: (recipe: Recipe) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <RecipeFields
          key={initial?.id ?? "new"}
          initial={initial}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}
