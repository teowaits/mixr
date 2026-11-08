"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, Library, Martini } from "lucide-react";
import { KeyDialog } from "@/components/key-dialog";
import { TransferDialog } from "@/components/transfer-dialog";
import { useBar } from "@/components/bar-context";
import { Button } from "@/components/ui/button";
import { TEST_API_KEY } from "@/lib/types";
import { cn } from "cn";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/bar", label: "Bar" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { settings, catalog } = useBar();
  const premium = settings.apiKey.trim() !== TEST_API_KEY && !catalog.truncated;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Martini className="size-4" />
          </span>
          <span className="font-heading text-xl tracking-tight">On Hand</span>
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <KeyDialog
            trigger={
              <Button variant="outline" size="sm">
                <KeyRound />
                {premium ? "Premium key" : "Test key"}
              </Button>
            }
          />
          <TransferDialog
            trigger={
              <Button variant="outline" size="sm">
                <Library />
                Import / export
              </Button>
            }
          />
        </div>
      </div>
    </header>
  );
}
