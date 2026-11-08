import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Outfit } from "next/font/google";
import { BarProvider } from "@/components/bar-context";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "On Hand",
  description: "Find cocktails you can make from the bottles and mixers already on your bar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <BarProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
            Recipes are for adults 21 and older. Drink slowly, and not before you drive.
            Recipe data and imagery:{" "}
            <a className="underline-offset-4 hover:underline" href="https://www.thecocktaildb.com/">
              TheCocktailDB
            </a>
            .
          </footer>
          <Toaster />
        </BarProvider>
      </body>
    </html>
  );
}
