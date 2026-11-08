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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEST_API_KEY } from "@/lib/types";

export function KeyDialog({ trigger }: { trigger: React.ReactNode }) {
  const { settings, updateSettings, catalog } = useBar();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings.apiKey);

  const usingTest = settings.apiKey.trim() === TEST_API_KEY;
  const tail = settings.apiKey.trim().slice(-4);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(settings.apiKey);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>TheCocktailDB key</DialogTitle>
          <DialogDescription>
            The public test key works today. A Premium key is a one-time purchase on
            TheCocktailDB and lists drinks past the free cap of 25 per letter. The key
            stays in this browser and is never written into the project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="api-key">API key</Label>
          <Input
            id="api-key"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste a Premium key, or leave the test key"
          />
          <p className="text-xs text-muted-foreground">
            {usingTest
              ? "Using the shared test key."
              : `A personal key ending in ${tail} is saved on this browser.`}
            {catalog.truncated
              ? " Several letters stopped at the free limit, so some drinks are missing until a Premium key is saved."
              : ""}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              updateSettings({ apiKey: TEST_API_KEY });
              setDraft(TEST_API_KEY);
              setOpen(false);
              toast("Switched back to the test key. The catalog will reload.");
            }}
          >
            Use test key
          </Button>
          <Button
            onClick={() => {
              const next = draft.trim();
              if (!next || /[\s/]/.test(next)) {
                toast.error("Enter the key by itself, with no spaces.");
                return;
              }
              updateSettings({ apiKey: next });
              setOpen(false);
              toast("Key saved in this browser. Reloading the catalog.");
            }}
          >
            Save key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
