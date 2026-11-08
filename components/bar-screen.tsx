"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBar } from "@/components/bar-context";
import { RecipeForm } from "@/components/recipe-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ingredientKey } from "@/lib/normalize";
import { PANTRY_PRESETS } from "@/lib/presets";
import type { Hemisphere } from "@/lib/types";

export function BarScreen() {
  const bar = useBar();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const suggestions = useMemo(() => {
    const query = ingredientKey(draft);
    if (query.length < 2) return [];
    return bar.ingredientOptions
      .filter((name) => ingredientKey(name).includes(query))
      .slice(0, 8);
  }, [draft, bar.ingredientOptions]);

  function add(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = bar.pantry.some((item) => ingredientKey(item.name) === ingredientKey(trimmed));
    setDraft("");
    if (exists) {
      toast(`${trimmed} is already on the bar.`);
      return;
    }
    bar.addPantry(trimmed);
    toast(`Added ${trimmed}.`);
  }

  if (!bar.hydrated) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">Opening the bar…</p>;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="order-2 grid gap-6 lg:order-1">
        <div>
          <p className="text-xs tracking-[0.22em] text-primary uppercase">The bar</p>
          <h1 className="mt-2 font-heading text-4xl tracking-tight">What you can reach.</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            This list stays in this browser. Export it if you want the same shelf on another
            machine. Names follow TheCocktailDB when they can, and anything else you type is
            kept too.
          </p>
        </div>

        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            add(draft);
          }}
        >
          <Label htmlFor="add-ingredient">Add a bottle or mixer</Label>
          <div className="flex gap-2">
            <Input
              id="add-ingredient"
              value={draft}
              list="ingredient-catalog"
              placeholder="Lime juice, bourbon, mint…"
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button type="submit">Add</Button>
          </div>
          <datalist id="ingredient-catalog">
            {bar.ingredientOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <Button key={name} type="button" size="sm" variant="outline" onClick={() => add(name)}>
                  {name}
                </Button>
              ))}
            </div>
          ) : null}
        </form>

        {bar.pantry.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-8">
            <h2 className="font-heading text-2xl">The shelf is clear.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a preset, or type the first bottle you actually own.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {bar.pantry.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                {editing === item.id ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      bar.renamePantry(item.id, editValue);
                      setEditing(null);
                    }}
                  >
                    <Input
                      value={editValue}
                      aria-label={`Rename ${item.name}`}
                      onChange={(event) => setEditValue(event.target.value)}
                    />
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="flex-1 text-left text-sm"
                    onClick={() => {
                      setEditing(item.id);
                      setEditValue(item.name);
                    }}
                  >
                    {item.name}
                  </button>
                )}
                <Button variant="ghost" size="sm" onClick={() => bar.removePantry(item.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}

        {bar.customRecipes.length > 0 ? (
          <div>
            <h2 className="font-heading text-2xl">Recipes you wrote</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
              {bar.customRecipes.map((recipe) => (
                <li key={recipe.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Link href={`/drink?id=${encodeURIComponent(recipe.id)}`} className="flex-1 hover:underline">
                    {recipe.name}
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => bar.deleteCustom(recipe.id)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {confirmClear ? (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  bar.clearPantry();
                  setConfirmClear(false);
                  toast("Cleared the bar.");
                }}
              >
                Clear {bar.pantry.length} items
              </Button>
              <Button variant="outline" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" disabled={bar.pantry.length === 0} onClick={() => setConfirmClear(true)}>
              Clear bar
            </Button>
          )}
          <Button variant="secondary" onClick={() => setRecipeOpen(true)}>
            Write a recipe
          </Button>
        </div>
        <RecipeForm
          open={recipeOpen}
          onOpenChange={setRecipeOpen}
          onSubmit={(recipe) => {
            bar.saveCustom(recipe);
            toast(`Saved ${recipe.name}.`);
          }}
        />
      </section>

      <aside className="order-1 grid content-start gap-4 lg:order-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-2xl">Starter shelves</h2>
          <div className="mt-3 grid gap-3">
            {PANTRY_PRESETS.map((preset) => (
              <div key={preset.id}>
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    bar.addPantryMany(preset.items);
                    toast(`Added the ${preset.name.toLowerCase()}.`);
                  }}
                >
                  Add {preset.items.length}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-4">
          <h2 className="font-heading text-2xl">How matching works</h2>
          <label className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Count ice, water, and salt</span>
              <span className="text-muted-foreground">Treat them as always on the bar.</span>
            </span>
            <Switch
              checked={bar.settings.countStaples}
              onCheckedChange={(countStaples) => bar.updateSettings({ countStaples })}
            />
          </label>
          <label className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Common substitutes</span>
              <span className="text-muted-foreground">
                Lime counts as lime juice. Triple sec counts as Cointreau. Soda water counts as
                club soda.
              </span>
            </span>
            <Switch
              checked={bar.settings.allowSubstitutes}
              onCheckedChange={(allowSubstitutes) => bar.updateSettings({ allowSubstitutes })}
            />
          </label>
          <div className="grid gap-2">
            <Label>Season calendar</Label>
            <Select
              value={bar.settings.hemisphere}
              onValueChange={(hemisphere) =>
                bar.updateSettings({ hemisphere: hemisphere as Hemisphere })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north">Northern hemisphere</SelectItem>
                <SelectItem value="south">Southern hemisphere</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Seasons follow produce, not proof. Spirits stay year-round. Hot and cold are read
              from the method, because the catalog has no temperature field.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
