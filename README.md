# Mixr

Mixr is a static cocktail finder for the home bar: given what you already own, it shows what you can pour tonight—and what is only one or two bottles away.

The goal is not another endless recipe browser. It is to close the gap between a half-stocked shelf and a drinkable drink. You keep a pantry of bottles and mixers in this browser; Mixr matches that list against TheCocktailDB (plus any recipes you write yourself), ranks results by how little is missing, and lets you cut the list by alcohol class, hot or cold, season, category, or glass. Ready means every line is already on the bar. One away and Two away surface near-misses so you know what to buy next—or what to skip.

Nothing requires an account. The bar, saved drinks, custom recipes, filters, and optional Premium API key stay in this browser. Import and export move them as JSON when you change machines. The catalog is cached locally so matching still works when the network is flaky. Hot/cold and season are inferred labels (method and produce), not invented ABV or marketing tags.

Recipe data and imagery come from [TheCocktailDB](https://www.thecocktaildb.com/).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3847.

```bash
npm test
npm run build
```

`npm run build` writes a static site to `out/`.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds that static site and deploys it with GitHub Actions.

1. Push this project to GitHub.
2. In the repository, open Settings → Pages.
3. Set **Source** to **GitHub Actions**.

A project site (`username.github.io/repo`) is built with that repository name as the base path. A user site whose repository is `username.github.io` is built at the domain root.

## API key

The app starts on TheCocktailDB’s public test key, `1`. That key is enough to browse and match, but free letter searches stop at 25 drinks, so some recipes are missing.

A [Premium key](https://www.thecocktaildb.com/api.php) is a one-time purchase (about $10) and removes that cap. If you buy one, open **Test key** in the header and paste it there. It is stored in this browser only and is never written into the repository or into an export file. Do not commit it.

Hot and cold are inferred from the method. Season follows a short produce list and the month, for the northern or southern hemisphere. Neither value is a field in the API, and the app does not invent ABV.

## What is saved

The bar, custom recipes, saved catalog ids, filters, and API key live in `localStorage`. The downloaded catalog lives in IndexedDB for a week. Export **everything** to move the bar and your recipes to another browser. Export **recipes** when you only want the drinks.

Storage keys are named for Mixr (`mixr:v1` / IndexedDB `mixr`). Older On Hand data is migrated once on load.

## Change Log

### 2026-11-10 — Mixr rebrand and bar atmosphere

- Renamed the product from **On Hand** to **Mixr** in the UI, document title, package name, and export filenames.
- Updated the site footer: responsible drinking notice, TheCocktailDB credit, link to [teowaits](https://github.com/teowaits), and MIT license.
- Migrated browser storage from `on-hand` keys to `mixr`, with a one-time copy so existing bars and catalog caches survive.
- Restyled the frontend for a moody bar look: Bodoni Moda italic headings, Figtree UI type, deeper amber/mahogany palette, mint Ready / berry Missing accents.
- Added atmospheric lighting: warm ambient washes, soft amber bokeh (respects reduced motion), header catch-light, and a quiet footer glow.

### Earlier

- Added the MIT License.
- Renamed the project toward Mixr in docs and packaging.
- Shipped On Hand: static Next.js cocktail matcher for the home bar (pantry matching, filters, custom recipes, import/export, GitHub Pages).
