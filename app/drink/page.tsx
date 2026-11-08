import { Suspense } from "react";
import { DrinkScreen } from "@/components/drink-screen";

export default function DrinkPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
          Looking up that drink…
        </p>
      }
    >
      <DrinkScreen />
    </Suspense>
  );
}
