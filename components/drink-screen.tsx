"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { toast } from "sonner";
import { useBar } from "@/components/bar-context";
import { RecipeForm } from "@/components/recipe-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scoreRecipe } from "@/lib/pantry-match";
import { SEASON_LABEL } from "@/lib/seasons";

export function DrinkScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";
  const bar = useBar();
  const [editing, setEditing] = useState(false);
  const recipe = bar.allRecipes.find((item) => item.id === id) ?? null;

  const score = useMemo(() => {
    if (!recipe) return null;
    return scoreRecipe(
      recipe,
      bar.pantry.map((item) => item.name),
      bar.settings,
    );
  }, [recipe, bar.pantry, bar.settings]);

  if (!bar.hydrated || (bar.catalog.status === "loading" && !recipe)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Looking up that drink…</p>;
  }

  if (!recipe || !score) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-heading text-4xl italic">That drink isn’t here.</h1>
        <p className="mt-2 text-muted-foreground">
          It may have been deleted, or the catalog hasn’t finished loading.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to drinks</Link>
        </Button>
      </div>
    );
  }

  const missing = new Set(score.missing.map((name) => name.toLowerCase()));

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div>
        {recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${recipe.image}/large`}
            alt={recipe.name}
            className="aspect-square w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex aspect-square items-end rounded-2xl bg-muted p-6">
            <span className="font-heading text-6xl italic text-primary">
              {recipe.name.slice(0, 1)}
            </span>
          </div>
        )}
      </div>
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">
          All drinks
        </Link>
        <h1 className="mt-2 font-heading text-4xl tracking-tight italic sm:text-5xl">
          {recipe.name}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={score.missing.length === 0 ? "ready" : "missing"}>
            {score.missing.length === 0 ? "Ready" : `Needs ${score.missing.length}`}
          </Badge>
          <Badge variant="secondary">
            {recipe.alcoholic === "Non alcoholic"
              ? "No alcohol"
              : recipe.alcoholic === "Optional alcohol"
                ? "Optional alcohol"
                : recipe.alcoholic ?? "Unspecified strength"}
          </Badge>
          <Badge variant="outline">{recipe.temperature === "hot" ? "Hot" : "Cold"}</Badge>
          {recipe.seasons.length === 0 ? (
            <Badge variant="outline">Year-round</Badge>
          ) : (
            recipe.seasons.map((season) => (
              <Badge key={season} variant="outline">
                {SEASON_LABEL[season]}
              </Badge>
            ))
          )}
          {recipe.glass ? <Badge variant="outline">{recipe.glass}</Badge> : null}
          {recipe.category ? <Badge variant="outline">{recipe.category}</Badge> : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {recipe.temperatureSource === "inferred"
            ? "Hot or cold is inferred from the method. The catalog doesn’t publish a temperature."
            : "Temperature was set on this recipe."}{" "}
          {recipe.seasons.length === 0
            ? "No seasonal produce turned up in the ingredient list."
            : "Season marks produce in the ingredient list, not a bottling date."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant={bar.isSaved(recipe.id) ? "default" : "outline"}
            onClick={() => {
              const saved = bar.isSaved(recipe.id);
              bar.toggleSaved(recipe.id);
              toast(saved ? "Removed from saved." : "Saved on this browser.");
            }}
          >
            {bar.isSaved(recipe.id) ? "Saved" : "Save"}
          </Button>
          {recipe.source === "custom" ? (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  bar.deleteCustom(recipe.id);
                  toast(`Deleted ${recipe.name}.`);
                  router.push("/");
                }}
              >
                Delete
              </Button>
            </>
          ) : null}
        </div>

        <h2 className="mt-8 font-heading text-2xl">Ingredients</h2>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {recipe.ingredients.map((line) => {
            const absent = missing.has(line.name.toLowerCase());
            return (
              <li key={`${line.name}-${line.measure}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className={absent ? "text-missing" : "text-foreground"}>
                  {line.measure ? `${line.measure} ` : ""}
                  {line.name}
                </span>
                <span className={cn("ml-auto text-xs", absent ? "text-missing" : "text-ready")}>
                  {absent ? "Missing" : "On hand"}
                </span>
                {absent ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      bar.addPantry(line.name);
                      toast(`Added ${line.name} to the bar.`);
                    }}
                  >
                    Add
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>

        <h2 className="mt-8 font-heading text-2xl">Method</h2>
        <p className="mt-3 max-w-prose whitespace-pre-wrap leading-7">{recipe.instructions}</p>

        {recipe.creditUrl ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Recipe data and imagery:{" "}
            <a className="text-primary underline-offset-4 hover:underline" href={recipe.creditUrl}>
              TheCocktailDB
            </a>
            .
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">A recipe written in this browser.</p>
        )}
      </div>
      {recipe.source === "custom" ? (
        <RecipeForm
          open={editing}
          onOpenChange={setEditing}
          initial={recipe}
          onSubmit={(next) => {
            bar.saveCustom(next);
            toast(`Updated ${next.name}.`);
          }}
        />
      ) : null}
    </article>
  );
}
