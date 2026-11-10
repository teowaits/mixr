"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBar } from "@/components/bar-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { downloadBundle, makeBundle, parseBundle } from "@/lib/bundle";

export function TransferDialog({ trigger }: { trigger: React.ReactNode }) {
  const bar = useBar();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  function exportAll() {
    downloadBundle(
      makeBundle({
        kind: "all",
        pantry: bar.pantry,
        recipes: bar.customRecipes,
        savedIds: bar.savedIds,
      }),
      "mixr-bar.json",
    );
    toast("Downloaded your bar, saved drinks, and recipes.");
  }

  function exportRecipes() {
    const saved = new Set(bar.savedIds);
    const recipes = [
      ...bar.customRecipes,
      ...bar.catalog.recipes.filter((recipe) => saved.has(recipe.id)),
    ];
    downloadBundle(
      makeBundle({
        kind: "recipes",
        pantry: [],
        recipes,
        savedIds: bar.savedIds,
      }),
      "mixr-recipes.json",
    );
    toast("Downloaded recipes only. Your bar stayed out of the file.");
  }

  async function onFile(file: File | undefined) {
    setError(null);
    setPreview(null);
    setPending(null);
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = parseBundle(parsed);
      setPending(parsed);
      const pantry = result.bundle.includesPantry ? `${result.bundle.pantry.length} bar items` : "no bar list";
      setPreview(
        `${result.bundle.recipes.length} recipes, ${result.bundle.savedIds.length} saved ids, ${pantry}.` +
          (result.skippedRecipes ? ` Skipped ${result.skippedRecipes} unreadable recipes.` : ""),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn’t read that file.");
    }
  }

  function commit(mode: "merge" | "replace") {
    if (!pending) return;
    try {
      const result = bar.importBundle(pending, mode);
      toast(
        mode === "merge"
          ? `Merged ${result.bundle.recipes.length} recipes into this browser.`
          : "Replaced the included lists in this browser.",
      );
      setOpen(false);
      setPending(null);
      setPreview(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Import failed.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import and export</DialogTitle>
          <DialogDescription>
            Files are JSON. They carry your bar, drinks you wrote, and saved catalog ids.
            The API key stays on this browser and is left out of every file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportAll}>
              Export everything
            </Button>
            <Button variant="outline" onClick={exportRecipes}>
              Export recipes
            </Button>
          </div>
          <label className="grid gap-2 text-sm">
            Choose a JSON file
            <input
              type="file"
              accept="application/json,.json"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>
          {preview ? <p className="text-sm">{preview}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={!pending} onClick={() => commit("merge")}>
            Merge
          </Button>
          <Button disabled={!pending} onClick={() => commit("replace")}>
            Replace included lists
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
