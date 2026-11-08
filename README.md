# On Hand

On Hand matches cocktail recipes to the bottles and mixers you already have. Search by what is on the bar, then narrow by alcohol, temperature, season, category, or glass. Your bar, saved drinks, and recipes you write stay in this browser. Import and export move them as JSON.

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
