# Lugares Míticos de Jaén

A bilingual (Spanish/English) static website about mythical and legendary places in Jaén, Spain.
Migrated from a previous Rails app.

> **Single source of truth.** `CLAUDE.md` is a symlink to this file. Keep it up to date when making
> structural changes (new templates, filters, shortcodes, data files).

**Live site:** https://www.lugaresmiticosdejaen.com/ (still served by the original Rails app)

## Tech Stack

| | |
|---|---|
| Static Site Generator | Eleventy 3.1.7 (version pinned exactly) |
| Templating | Nunjucks (`.njk`) |
| Language | ES Modules (`"type": "module"`) |
| Node | defined in `.nvmrc` (v26.12.1); the workflow reads it from there |
| Deployment | GitHub Actions → GitHub Pages |

## Commands

```bash
npm ci               # install dependencies (honours package-lock.json)
npm run build        # build the site into _site/
npm run serve        # dev server with hot reload
npm run clean        # remove _site/ and .cache/
npm run validate     # check _data/raw/ for broken references and gaps
npm run check-links  # build and validate internal links with linkinator
npm run check-pages  # render the built pages in a browser and assert the layout
```

## Project Structure

```
├── .eleventy.js                      # Eleventy configuration
├── .nvmrc                            # Node version (single source)
├── CNAME                             # GitHub Pages domain
├── _data/                            # Global data (Eleventy auto-loads)
│   ├── raw/                          # Raw JSON, exported from Rails
│   │   ├── es_articles.json          # 164 articles
│   │   ├── en_articles.json          # 164 articles
│   │   ├── es_pages.json             # 10 static pages
│   │   ├── en_pages.json             # 8 static pages
│   │   ├── es_categories.json        # 11 categories
│   │   ├── en_categories.json        # 11 categories
│   │   └── regions.json              # 9 regions → 97 nested localities
│   ├── base.js                       # Lookup maps + generatePaginatedPages()
│   ├── articles.js                   # Hydrated articles per locale
│   ├── index_pages.js                # Main index pages
│   ├── all_pages.js                  # All page collections
│   ├── categories_list.js            # Categories for the home page
│   ├── localities_list.js            # Localities with article counts
│   └── i18n.js                       # Translation strings
├── src/                              # Page templates (locale-aware)
│   ├── index_redirect_to_locale.njk  # `/` → JS language redirect
│   ├── index.njk                     # Home page per locale
│   ├── articles.njk                  # All-articles index
│   ├── article.njk                   # Article
│   ├── category.njk                  # Category index
│   ├── region.njk                    # Region index
│   └── locality.njk                  # Locality index
├── _includes/
│   ├── layouts/main.njk              # Single layout
│   └── partials/
│       ├── article.njk               # Article body (slides + gallery)
│       ├── article-grid.njk          # Card grid + pagination
│       ├── article-category.njk
│       ├── article-date.njk
│       ├── article-location.njk
│       └── pagination.njk
├── css/styles.css                    # Passthrough-copied to _site/css/
├── js/                               # Passthrough-copied to _site/js/
│   ├── hamburger-menu.js
│   ├── article-slides.js             # Keyboard and dots for the article deck
│   └── localities-map.js             # Leaflet map on the home page
├── scripts/                          # Dev utilities (not part of the build)
│   ├── validate-data.mjs             # Raw data integrity checks (runs in CI)
│   ├── check-pages.mjs               # Browser layout checks (runs in CI)
│   ├── serve-site.mjs                # Static server mimicking GitHub Pages
│   └── check-links.mjs               # Internal link validation
├── content/                          # HTML for the 3 `Tradition` articles (ES+EN); ignored today
└── _site/                            # Build output (gitignored)
```

## Key Configuration (`.eleventy.js`)

- **Static assets host:** `https://lmjstatic.deliriumcoder.com` (`STATICS_HOST` constant)
- **Global data:** `env`, `timestamp` (CSS/JS cache busting)
- **Filters:** `formatDate` → `DD/MM/YYYY`
- **Shortcodes:**
  - `featured_image(article, size)` — URL of the featured photo (`featured: true` and `type: "Photo"`)
  - `static_image(path)` — absolute URL of a bucket asset
- **Passthrough copy:** `css`, `js`
- **Ignored paths:** `AGENTS.md`, `CLAUDE.md`, `README.md`, `content`. Anything in `.gitignore`
  (`node_modules`, `_site`) is ignored by Eleventy on its own — no need to repeat it

## Data Architecture

### `base.js`
- `localityMap` — `Map` of locality name → object including its region
- `enCategoryMap` / `esCategoryMap` — `Map` of category name → object
- `generatePaginatedPages({ entities, articles, filterFn, entityKey, pathPrefix, locale, includeEmpty })`
  — generates paginated pages for any entity type. **`PAGE_SIZE = 12`.** Sorts by `published_at`
  descending and returns objects with `articles`, `locale`, `pagination` and the entity itself.
  With `includeEmpty: true` it also generates pages with no articles (used by localities).

### `articles.js`
Hydrates the raw JSON, adding to each article:
- `enrichedLocalities` — full locality objects, including their region
- `enrichedCategories` — full category objects

Exports `en`, `es` and, as default, the union of both with a `locale` property.

### `all_pages.js`
| Export | Contents |
|---|---|
| `all_articles` | every article from both locales |
| `all_indices` | main index pages (both locales) |
| `all_home_pages` | only the first page of each index → the home page |
| `all_categories` | paginated category pages |
| `all_regions` | paginated region pages |
| `all_localities` | paginated locality pages (empty ones included) |

### `categories_list.js` / `localities_list.js`
Lists for the home page blocks. `categories_list` maps each category to its `imageSlug` (the
**English** slug, because that is how the bucket files are named). `localities_list` adds
`articleCount` and sorts alphabetically with `localeCompare('es')`.

## Page Generation

All templates are unified and receive the language in the `locale` variable.

| Page | Data source | URL | Template |
|---|---|---|---|
| Root redirect | — | `/` | `src/index_redirect_to_locale.njk` |
| Home | `all_home_pages` | `/{locale}/` | `src/index.njk` |
| All articles | `all_indices` | `/{locale}/articles/`, `/{locale}/articles/page/{n}/` | `src/articles.njk` |
| Article | `all_articles` | `/{locale}/articles/{slug}.html` | `src/article.njk` |
| Category | `all_categories` | `/{locale}/categories/{slug}/`, `…/page/{n}/` | `src/category.njk` |
| Region | `all_regions` | `/{locale}/regions/{slug}/`, `…/page/{n}/` | `src/region.njk` |
| Locality | `all_localities` | `/{locale}/localities/{slug}/`, `…/page/{n}/` | `src/locality.njk` |

All article lists are sorted by `published_at` in descending order (newest first).

## Data Structure

### Articles
- `id` — stable across locales, and the **only** way to pair an article with its
  translation: 16 articles have a different slug in each language, and the 107 untranslated
  ones reuse the Spanish slug
- Content and metadata (`title`, `summary`, `sentences`, `published_at`, `hashtag`, `type`,
  `translated`, `related_articles`, geolocation)
- `summary` and `sentences` are plain text, HTML entities already decoded during hydration
- `body` — only for `Tradition` articles: the HTML from `content/`, with its `[img::N]`
  placeholders resolved to real images
- `type`: `Place` (161) or `Tradition` (3; the body lives in `content/`)
- `media[]`: 2,068 photos + 4 videos. Look for `featured: true` and `type: "Photo"` for the featured one
- `image_urls`: relative paths per size, to be concatenated with `STATICS_HOST`

### Image Sizes

**Featured images** (`featured: true`)

| Key | Dimensions | Notes |
|---|---|---|
| `big_teaser_desktop_hd` | 1920x768 | Cropped |
| `big_teaser_desktop` | 1120x448 | Cropped |
| `big_teaser_tablet` | 640x256 | Cropped |
| `big_teaser_mobile` | 480x192 | Cropped |
| `teaser_desktop_hd` | 640w | Proportional |
| `teaser_desktop` | 375w | Proportional |
| `teaser_tablet` | 320w | Proportional |
| `teaser_mobile` | 480w | Proportional |
| `facebook` | 1200x630 | Cropped (Open Graph) |

**Non-featured images** (`featured: false`)

| Key | Dimensions | Notes |
|---|---|---|
| `desktop_hd` | 1920w | Proportional |
| `desktop` | 1120w | Proportional |
| `tablet` | 640w | Proportional |
| `mobile` | 480w | Proportional |

All images also have an `original` size available.

### Regions (`regions.json`)

```json
{
  "name": "Sierra de Cazorla",
  "slug": "sierra-de-cazorla",
  "localities": [
    { "name": "Cazorla", "slug": "cazorla" },
    { "name": "Quesada", "slug": "quesada" }
  ]
}
```

## Deployment

`.github/workflows/deploy-to-ghpages.yml`: on every push to `main` it builds with
`ELEVENTY_ENV=production` and publishes `_site/` to the GitHub Pages branch via
`peaceiris/actions-gh-pages`, setting the domain from the `CNAME` file. Pull requests build
but do not publish.

## Known Debt

The most relevant items when touching templates:

- `main.njk` has a hardcoded `<html lang="en">`, and there is no Open Graph, `hreflang`,
  `canonical`, `sitemap.xml`, `robots.txt` or 404 page.
- The article gallery paints photos with `background-image` and per-breakpoint custom
  properties: no `srcset`, no lazy loading. Moving to `<picture>`/`<img>` is the biggest
  pending performance win (−92% traffic).
- From 1280px up the article is a scroll-snap deck: the intro over the featured photo,
  the featured photo on its own, then the gallery. The scrolling is the browser's; the
  script only adds arrow keys and the navigation dots. Below that width it is an ordinary
  stacked page.
- Some photos have black letterbox bands baked into the file. Nothing in the CSS adds
  them.
- 107 of 164 articles have `translated: false` and are published in EN anyway.
- Articles are written as `{slug}.html` but linked without the extension
  (`/es/articles/{slug}`). This works because GitHub Pages resolves `.html` automatically,
  but it ties the site to hosts with that convention. `npm run check-links` reproduces that
  behaviour locally via `scripts/serve-site.mjs`.
- Leaflet is loaded from unpkg.
- The home map reads municipality outlines from the assets host with `fetch()`, so CORS
  applies. That host answers with an allowlist of origins: the deployed domains are on it,
  local development is not unless the origin is added. `npm run check-pages` reports this
  as a note rather than a failure, since it is configuration outside the repo. The origins
  used here are `http://localhost:8099` (`scripts/serve-site.mjs`) and `http://localhost:8123`
  (`scripts/check-pages.mjs`).
- Missing: the Rails static pages (`about-us`, `the-team`, `press`, books, `cookies`…),
  the footer, the language switcher and the explorer map with filters.
