"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useBar } from "@/components/bar-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { filterRecipes, uniqueSorted } from "@/lib/filter-recipes";
import { currentSeason, SEASON_LABEL } from "@/lib/seasons";
import type { AlcoholClass, MissingFilter, Season, Temperature } from "@/lib/types";

function alcoholLabel(value: AlcoholClass | null): string {
  if (value === "Non alcoholic") return "No alcohol";
  if (value === "Optional alcohol") return "Optional alcohol";
  if (value === "Alcoholic") return "Alcoholic";
  return "Unspecified";
}

function missingLabel(missing: string[]): string {
  if (missing.length === 0) return "Ready";
  if (missing.length === 1) return `Needs ${missing[0]}`;
  return `Needs ${missing.length}`;
}

export function DiscoverScreen() {
  const bar = useBar();
  const [remoteNote, setRemoteNote] = useState<string | null>(null);
  const seasonNow = currentSeason(bar.settings.hemisphere);

  const results = useMemo(
    () =>
      filterRecipes({
        recipes: bar.allRecipes,
        pantry: bar.pantry,
        savedIds: bar.savedIds,
        settings: bar.settings,
        filters: bar.filters,
      }),
    [bar.allRecipes, bar.pantry, bar.savedIds, bar.settings, bar.filters],
  );

  const categories = useMemo(
    () => uniqueSorted(bar.allRecipes.map((recipe) => recipe.category)),
    [bar.allRecipes],
  );
  const glasses = useMemo(
    () => uniqueSorted(bar.allRecipes.map((recipe) => recipe.glass)),
    [bar.allRecipes],
  );

  const query = bar.filters.query;
  const catalogStatus = bar.catalog.status;
  const searchRemote = bar.searchRemote;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || catalogStatus !== "ready") return;
    const handle = window.setTimeout(() => {
      void searchRemote(trimmed)
        .then((count) => {
          setRemoteNote(
            count > 0 ? `Pulled ${count} more name matches from TheCocktailDB.` : null,
          );
        })
        .catch(() => setRemoteNote("Name search didn’t reach TheCocktailDB."));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query, catalogStatus, searchRemote]);

  const progress =
    bar.catalog.progress.total === 0
      ? 0
      : Math.round((bar.catalog.progress.done / bar.catalog.progress.total) * 100);

  if (!bar.hydrated) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">Opening the bar…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="max-w-2xl">
        <p className="text-xs tracking-[0.22em] text-primary uppercase">What you can pour</p>
        <h1 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">
          Drinks from the shelf you have.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Ready means every bottle and mixer is already on the bar. One away means a single
          missing item. Ice, water, and salt count as staples unless you turn that off.
        </p>
      </section>

      {bar.catalog.status === "loading" ? (
        <div className="rounded-xl border border-border bg-card/70 p-4">
          <p className="text-sm">
            Reading the ledger
            {bar.catalog.progress.letter ? ` · ${bar.catalog.progress.letter.toUpperCase()}` : ""} ·{" "}
            {bar.catalog.progress.done}/{bar.catalog.progress.total}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {bar.catalog.error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {bar.catalog.error}
        </p>
      ) : null}

      {bar.catalog.truncated ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          The free catalog stops at 25 drinks for some letters, so a few recipes are missing.
          A Premium key from TheCocktailDB ($10, once) lists the rest. Save it from the key
          button — it stays in this browser.
        </p>
      ) : null}

      <section className="flex gap-2 overflow-x-auto pb-1">
        {bar.pantry.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The bar is empty.{" "}
            <Link href="/bar" className="text-primary underline-offset-4 hover:underline">
              Stock a shelf
            </Link>{" "}
            or search a drink by name.
          </p>
        ) : (
          bar.pantry.map((item) => (
            <Badge key={item.id} variant="secondary" className="h-7 px-3">
              {item.name}
            </Badge>
          ))
        )}
      </section>

      <div className="grid gap-3">
        <Input
          value={bar.filters.query}
          placeholder="Search a name or an ingredient"
          aria-label="Search drinks"
          onChange={(event) => bar.updateFilters({ query: event.target.value })}
        />
        {remoteNote ? <p className="text-xs text-muted-foreground">{remoteNote}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <MissingTabs
            value={bar.filters.missingMax}
            onChange={(missingMax) => bar.updateFilters({ missingMax })}
          />
          <FilterSelect
            label="Alcohol"
            value={bar.filters.alcohol}
            onChange={(alcohol) => bar.updateFilters({ alcohol: alcohol as FiltersAlcohol })}
            options={[
              ["any", "Any strength"],
              ["Alcoholic", "Alcoholic"],
              ["Non alcoholic", "No alcohol"],
              ["Optional alcohol", "Optional alcohol"],
            ]}
          />
          <FilterSelect
            label="Temperature"
            value={bar.filters.temperature}
            onChange={(temperature) =>
              bar.updateFilters({ temperature: temperature as "any" | Temperature })
            }
            options={[
              ["any", "Hot or cold"],
              ["cold", "Cold"],
              ["hot", "Hot"],
            ]}
          />
          <FilterSelect
            label="Season"
            value={bar.filters.season}
            onChange={(season) => bar.updateFilters({ season: season as "any" | Season })}
            options={[
              ["any", "Any season"],
              ...(["winter", "spring", "summer", "fall"] as Season[]).map(
                (season) =>
                  [
                    season,
                    season === seasonNow ? `${SEASON_LABEL[season]} · now` : SEASON_LABEL[season],
                  ] as [string, string],
              ),
            ]}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal />
                More
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>More filters</SheetTitle>
                <SheetDescription>
                  Category and glass come from the catalog. Saved drinks are the ones you marked.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 px-4">
                <FilterSelect
                  label="Category"
                  value={bar.filters.category}
                  onChange={(category) => bar.updateFilters({ category })}
                  options={[["any", "Any category"], ...categories.map((item) => [item, item] as [string, string])]}
                />
                <FilterSelect
                  label="Glass"
                  value={bar.filters.glass}
                  onChange={(glass) => bar.updateFilters({ glass })}
                  options={[["any", "Any glass"], ...glasses.map((item) => [item, item] as [string, string])]}
                />
                <Button
                  variant={bar.filters.savedOnly ? "default" : "outline"}
                  onClick={() => bar.updateFilters({ savedOnly: !bar.filters.savedOnly })}
                >
                  {bar.filters.savedOnly ? "Showing saved only" : "Show saved only"}
                </Button>
                <Button variant="ghost" onClick={() => bar.resetFilters()}>
                  Reset filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {bar.catalog.status === "loading" && results.length === 0
          ? "Matches will show up as the catalog arrives."
          : `${results.length} ${results.length === 1 ? "drink" : "drinks"}`}
      </p>

      {bar.catalog.status !== "loading" && results.length === 0 ? (
        <EmptyResults
          pantryEmpty={bar.pantry.length === 0}
          query={bar.filters.query}
          readyOnly={bar.filters.missingMax === 0}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Link key={result.recipe.id} href={`/drink?id=${encodeURIComponent(result.recipe.id)}`}>
              <Card className="h-full overflow-hidden transition-colors hover:bg-accent/40">
                {result.recipe.image ? (
                  // CocktailDB hosts the photo; next/image optimization needs a server.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${result.recipe.image}/medium`}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-end bg-muted p-4">
                    <span className="font-heading text-3xl text-primary">
                      {result.recipe.name.slice(0, 1)}
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-heading text-2xl leading-tight">
                    {result.recipe.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  <Badge variant={result.missing.length === 0 ? "default" : "outline"}>
                    {missingLabel(result.missing)}
                  </Badge>
                  <Badge variant="secondary">{alcoholLabel(result.recipe.alcoholic)}</Badge>
                  {result.recipe.temperature === "hot" ? <Badge variant="outline">Hot</Badge> : null}
                  {result.recipe.seasons.map((season) => (
                    <Badge key={season} variant="outline">
                      {SEASON_LABEL[season]}
                    </Badge>
                  ))}
                  {result.recipe.source === "custom" ? <Badge variant="secondary">Yours</Badge> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type FiltersAlcohol = "any" | AlcoholClass;

function MissingTabs({
  value,
  onChange,
}: {
  value: MissingFilter;
  onChange: (value: MissingFilter) => void;
}) {
  const options: { value: MissingFilter; label: string }[] = [
    { value: 0, label: "Ready" },
    { value: 1, label: "One away" },
    { value: 2, label: "Two away" },
  ];
  return (
    <div className="flex rounded-lg border border-border p-0.5">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-auto min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, optionLabel]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyResults({
  pantryEmpty,
  query,
  readyOnly,
}: {
  pantryEmpty: boolean;
  query: string;
  readyOnly: boolean;
}) {
  if (pantryEmpty && !query.trim()) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12">
        <h2 className="font-heading text-3xl">Nothing is on the bar yet.</h2>
        <p className="mt-2 max-w-lg text-muted-foreground">
          Add gin, lime, and a few mixers, or start from a shelf that already knows its
          classics. Name search still works before the bar is stocked.
        </p>
        <Button asChild className="mt-5">
          <Link href="/bar">Open the bar</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12">
      <h2 className="font-heading text-3xl">Nothing matches this cut.</h2>
      <p className="mt-2 max-w-lg text-muted-foreground">
        {readyOnly
          ? "Ready is on, so drinks that need another bottle are hidden. Try One away, or add the ingredient the cards keep asking for."
          : "Loosen a filter, or search a different name."}
      </p>
    </div>
  );
}
