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
│   ├── en_articles.json
│   ├── es_articles.json
│   ├── en_categories.json
│   ├── es_categories.json
│   ├── localities.json
│   ├── regions.json
│   ├── en_locality_pages.js  # Generated locality page data (EN)
│   ├── es_locality_pages.js  # Generated locality page data (ES)
│   ├── en_region_pages.js    # Generated region page data (EN)
│   ├── es_region_pages.js    # Generated region page data (ES)
│   ├── en_category_pages.js  # Generated category page data (EN)
│   └── es_category_pages.js  # Generated category page data (ES)
├── src/              # Source pages
│   ├── index.njk     # Root (language redirect)
│   ├── es/           # Spanish pages
│   │   ├── index.njk
│   │   ├── article.njk
│   │   ├── category.njk
│   │   ├── locality.njk
│   │   └── region.njk
│   └── en/           # English pages
│       ├── index.njk
│       ├── article.njk
│       ├── category.njk
│       ├── locality.njk
│       └── region.njk
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
- **Global data:** `en_articles`, `es_articles`, `en_categories`, `es_categories`, `localities`, `regions`, `en_locality_pages`, `es_locality_pages`, `en_region_pages`, `es_region_pages`, `en_category_pages`, `es_category_pages` (auto-loaded from `_data/`)
- **Filters:**
  - `limit` - limits array items
  - `formatDate` - formats date strings as DD/MM/YYYY
  - `getLocalities` - maps locality names to locality objects
  - `getRegion` - gets a region object by name
  - `getCategories` - maps category names to category objects
- **Shortcodes:** `featured_image` - generates image URLs from article media
- **Ignored paths:** `CLAUDE.md`, `README.md`, `content`

## Page Generation

**Article pages** are generated using Eleventy pagination:
- Data source: `es_articles` / `en_articles` global data
- URLs: `/es/articles/{slug}.html` and `/en/articles/{slug}.html`
- Templates: `src/es/article.njk` and `src/en/article.njk`

**Locality pages** are generated using custom data files:
- Data source: `es_locality_pages` / `en_locality_pages` (JS files that filter and paginate articles by locality)
- URLs: `/es/localities/{slug}/` and `/en/localities/{slug}/`
- Templates: `src/es/locality.njk` and `src/en/locality.njk`
- Articles are sorted by `published_at` in descending order (newest first)

**Region pages** are generated using custom data files:
- Data source: `es_region_pages` / `en_region_pages` (JS files that filter articles by region through localities)
- URLs: `/es/regions/{slug}/` and `/en/regions/{slug}/`
- Templates: `src/es/region.njk` and `src/en/region.njk`
- Articles are sorted by `published_at` in descending order (newest first)

**Category pages** are generated using custom data files:
- Data source: `es_category_pages` / `en_category_pages` (JS files that filter articles by category)
- URLs: `/es/categories/{slug}/` and `/en/categories/{slug}/`
- Templates: `src/es/category.njk` and `src/en/category.njk`
- Articles are sorted by `published_at` in descending order (newest first)

## Data Structure

Articles contain:
- Content and metadata
- `media` array with images (look for `featured: true` and `type: "Photo"`)
- Image URLs available in multiple sizes via `image_urls` object

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
