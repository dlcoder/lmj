# Lugares Míticos de Jaén

A bilingual (Spanish/English) static website about mythical and legendary places in Jaén, Spain.

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
│   └── localities.json
├── src/              # Source pages
│   ├── index.njk     # Root (language redirect)
│   ├── es/           # Spanish pages
│   │   ├── index.njk
│   │   └── article.njk
│   └── en/           # English pages
│       ├── index.njk
│       └── article.njk
├── _includes/        # Templates and partials
│   ├── layouts/
│   │   └── main.njk
│   └── partials/
│       ├── article.njk
│       └── article-teaser-list.njk
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
- **Global data:** `en_articles`, `es_articles`, `en_categories`, `es_categories`, `localities` (auto-loaded from `_data/`)
- **Filters:** `limit` - limits array items
- **Shortcodes:** `featured_image` - generates image URLs from article media
- **Ignored paths:** `CLAUDE.md`, `README.md`, `content`

## Page Generation

Article pages are generated using Eleventy pagination:
- Data source: `es_articles` / `en_articles` global data
- URLs: `/es/articles/{slug}.html` and `/en/articles/{slug}.html`
- Templates: `src/es/article.njk` and `src/en/article.njk`

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
