# Lugares Míticos de Jaén

A bilingual (Spanish/English) static website about mythical and legendary places in the province of Jaén, Spain: 164 articles across 97 localities, 10 regions and 11 categories.

**Live site:** https://www.lugaresmiticosdejaen.com/

This repository is the rewrite of the site as a static website built with [Eleventy](https://www.11ty.dev/).

## Getting started

Requires the Node version listed in `.nvmrc`:

```bash
nvm use
npm ci
npm run serve     # http://localhost:8080
```

| Script | What it does |
|---|---|
| `npm run build` | builds the site into `_site/` |
| `npm run serve` | dev server with hot reload |
| `npm run clean` | removes `_site/` |
| `npm run validate` | checks `_data/raw/` for broken references and gaps |
| `npm run check-site` | builds and checks canonicals, hreflang pairs, structured data, sitemap and redirects |
| `npm run check-pages` | builds and asserts the layout of the built pages in a browser |
| `npm run check-links` | builds and checks internal links |
| `npm run build-icons` | re-renders the icons in `img/` after changing `img/favicon.svg` |

## Where the data comes from

All content is static JSON under `_data/raw/`, exported from the MySQL database of the previous Rails app: articles and categories per language, plus `regions.json` with nested localities. There is no CMS and no API — to change content you edit those files and rebuild.

The `_data/*.js` layer hydrates that JSON (full localities and categories on every article) and builds the paginated collections consumed by the templates in `src/`.

**Images are not in the repo**: they are served from `https://files.lugaresmiticosdejaen.com` in 13 pre-generated sizes, and the templates build the URLs with the `featured_image` and `static_image` shortcodes.

## Deployment

Every push to `main` triggers `.github/workflows/deploy-to-ghpages.yml`, which builds the site and publishes `_site/` to GitHub Pages under the domain set in the `CNAME` file. Pull requests build but do not publish.

## Documentation

- [`AGENTS.md`](AGENTS.md) — architecture, data structure, page generation and known debt. It is the working reference (`CLAUDE.md` is a symlink to it).
