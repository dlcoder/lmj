# Lugares Míticos de Jaén

A bilingual (Spanish/English) static website about mythical and legendary places in Jaén, Spain.

> **Note:** Keep this file updated when making structural changes (new files, filters, shortcodes, etc.).

**Live site:** https://www.lugaresmiticosdejaen.com/

## Tech Stack

- **Static Site Generator:** Eleventy 3.x (11ty)
- **Templating:** Nunjucks (.njk)
- **Language:** ES Modules (type: module)

## Project Structure

```
├── .eleventy.js      # Eleventy configuration
├── _data/            # Global data files (Eleventy auto-loads)
│   ├── raw/          # Raw JSON data
│   │   ├── en_articles.json
│   │   ├── es_articles.json
│   │   ├── en_categories.json
│   │   ├── es_categories.json
│   │   └── regions.json      # Regions with nested localities
│   ├── base.js       # Shared utilities and generatePaginatedPages()
│   ├── articles.js   # Hydrated articles with enriched data
│   ├── all_pages.js  # All page collections (categories, regions, localities)
│   ├── index_pages.js # Index page generation
│   └── i18n.js       # Translation strings
├── src/              # Source pages (locale-aware templates)
│   ├── index.njk     # Root (language redirect)
│   ├── index_redirect_to_locale.njk
│   ├── article.njk   # Article template (uses locale variable)
│   ├── category.njk  # Category index template
│   ├── locality.njk  # Locality index template
│   └── region.njk    # Region index template
├── _includes/        # Templates and partials
│   ├── layouts/
│   │   └── main.njk
│   └── partials/
│       ├── article.njk
│       ├── article-category.njk
│       ├── article-date.njk
│       ├── article-location.njk
│       ├── index-of-articles.njk
│       └── pagination.njk
├── content/          # Content files - tradition articles (currently ignored)
└── _site/            # Build output (gitignored)
```

## Commands

```bash
npm run build    # Build the site
npm run serve    # Start dev server with hot reload
```

## Key Configuration

- **Static assets host:** `https://lmjstatic.deliriumcoder.com`
- **Global data:** Auto-loaded from `_data/` - includes `all_articles`, `all_categories`, `all_regions`, `all_localities`, `all_indices`, `i18n`
- **Filters:**
  - `formatDate` - formats date strings as DD/MM/YYYY
- **Shortcodes:**
  - `featured_image` - generates image URLs from article media
  - `static_image` - generates static asset URLs
- **Ignored paths:** `AGENTS.md`, `CLAUDE.md`, `README.md`, `content`

## Data Architecture

### Raw Data (`_data/raw/`)
- `en_articles.json` / `es_articles.json` - Article content per locale
- `en_categories.json` / `es_categories.json` - Category definitions per locale
- `regions.json` - Regions with nested localities array

### Data Processing (`_data/`)
- **base.js** - Exports shared utilities:
  - `localityMap` - Fast lookup for localities by name
  - `enCategoryMap` / `esCategoryMap` - Fast lookup for categories
  - `generatePaginatedPages()` - Generic pagination function for any entity type
- **articles.js** - Hydrates raw articles with:
  - `enrichedLocalities` - Full locality objects with region info
  - `enrichedCategories` - Full category objects
- **all_pages.js** - Exports page collections:
  - `all_categories` - Paginated category pages (both locales)
  - `all_regions` - Paginated region pages (both locales)
  - `all_localities` - Paginated locality pages (both locales)
  - `all_indices` - Index pages (both locales)
  - `all_articles` - All articles with locale property
- **i18n.js** - Translation strings keyed by locale (`en`, `es`)

## Page Generation

All pages use unified locale-aware templates with a `locale` variable.

**Article pages:**
- Data source: `all_articles` (from `articles.js`)
- URLs: `/{locale}/articles/{slug}.html`
- Template: `src/article.njk`

**Index pages:**
- Data source: `all_indices` (from `all_pages.js`)
- URLs: `/{locale}/` and `/{locale}/page/{n}/`
- Template: `src/index.njk`

**Category pages:**
- Data source: `all_categories` (from `all_pages.js`)
- URLs: `/{locale}/categories/{slug}/` and `/{locale}/categories/{slug}/page/{n}/`
- Template: `src/category.njk`

**Region pages:**
- Data source: `all_regions` (from `all_pages.js`)
- URLs: `/{locale}/regions/{slug}/` and `/{locale}/regions/{slug}/page/{n}/`
- Template: `src/region.njk`

**Locality pages:**
- Data source: `all_localities` (from `all_pages.js`)
- URLs: `/{locale}/localities/{slug}/` and `/{locale}/localities/{slug}/page/{n}/`
- Template: `src/locality.njk`

All article lists are sorted by `published_at` in descending order (newest first).

## Data Structure

### Articles
- Content and metadata
- `media` array with images (look for `featured: true` and `type: "Photo"`)
- `enrichedLocalities` - Pre-hydrated locality objects with region info
- `enrichedCategories` - Pre-hydrated category objects
- Image URLs available in multiple sizes via `image_urls` object

### Regions (`regions.json`)
Each region contains a `localities` array with nested locality objects:
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

### Image Sizes

**Featured images** (`featured: true`):
| Key | Dimensions | Notes |
|-----|------------|-------|
| `big_teaser_desktop_hd` | 1920x768 | Cropped |
| `big_teaser_desktop` | 1120x448 | Cropped |
| `big_teaser_tablet` | 640x256 | Cropped |
| `big_teaser_mobile` | 480x192 | Cropped |
| `teaser_desktop_hd` | 640w | Proportional |
| `teaser_desktop` | 375w | Proportional |
| `teaser_tablet` | 320w | Proportional |
| `teaser_mobile` | 480w | Proportional |
| `facebook` | 1200x630 | Cropped |

**Non-featured images** (`featured: false`):
| Key | Dimensions | Notes |
|-----|------------|-------|
| `desktop_hd` | 1920w | Proportional |
| `desktop` | 1120w | Proportional |
| `tablet` | 640w | Proportional |
| `mobile` | 480w | Proportional |

All images also have an `original` size available.

## Deployment

Deployed via GitHub Actions to GitHub Pages.
