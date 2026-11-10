import type { Metadata } from "next";
import { Bodoni_Moda, Figtree, Geist_Mono } from "next/font/google";
import { BarProvider } from "@/components/bar-context";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mixr",
  description: "Find cocktails you can make from the bottles and mixers already on your bar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${bodoniModa.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <BarProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
            Recipes are for adults 21 and older. Drink responsibly, and never before you drive.
            Recipe data and imagery:{" "}
            <a className="underline-offset-4 hover:underline" href="https://www.thecocktaildb.com/">
              TheCocktailDB
            </a>
            . Code by{" "}
            <a
              className="underline-offset-4 hover:underline"
              href="https://github.com/teowaits"
            >
              teowaits
            </a>
            . MIT license
          </footer>
          <Toaster />
        </BarProvider>
      </body>
    </html>
  );
}
