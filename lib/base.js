import { readFileSync } from 'node:fs';
import regions from '../_data/raw/regions.json' with { type: 'json' };
import en_categories_raw from '../_data/raw/en_categories.json' with { type: 'json' };
import es_categories_raw from '../_data/raw/es_categories.json' with { type: 'json' };
import en_articles_raw from '../_data/raw/en_articles.json' with { type: 'json' };
import es_articles_raw from '../_data/raw/es_articles.json' with { type: 'json' };
import i18n from '../_data/i18n.js';

const PAGE_SIZE = 12;

// Host for the pre-generated image variants. Kept here so both .eleventy.js
// and the data layer read it from one place.
export const STATICS_HOST = process.env.STATICS_HOST || "https://files.lugaresmiticosdejaen.com";

// Where the site is published, for the absolute URLs that canonical,
// hreflang, Open Graph and the sitemap need. Read from CNAME, which is what
// tells GitHub Pages the domain, so the two cannot drift apart: moving the
// site to another domain is changing that one file.
export const SITE_URL = process.env.SITE_URL ||
  `https://${readFileSync(new URL('../CNAME', import.meta.url), 'utf8').trim()}`;

// Shared Maps for fast lookup
export const localityMap = new Map(
  regions.flatMap(region =>
    region.localities.map(locality => [
      locality.name,
      { ...locality, region: { name: region.name, slug: region.slug } }
    ])
  )
);

export const enCategoryMap = new Map(en_categories_raw.map(cat => [cat.name, cat]));
export const esCategoryMap = new Map(es_categories_raw.map(cat => [cat.name, cat]));

export { regions, en_categories_raw, es_categories_raw };

/**
 * Generic function to generate paginated pages for a set of entities.
 */
export function generatePaginatedPages({
  entities,
  articles,
  filterFn,
  entityKey,
  pathPrefix = '',
  locale,
  includeEmpty = false
}) {
  const pages = [];

  for (const entity of entities) {
    const filteredArticles = articles
      .filter(article => filterFn(article, entity))
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (filteredArticles.length === 0 && !includeEmpty) continue;

    const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));

    // Build base URL once per entity. Skip empty parts.
    const baseUrl = [locale, pathPrefix, entity?.slug].filter(Boolean).join('/');

    for (let i = 0; i < totalPages; i++) {
      const page = {
        articles: filteredArticles.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE),
        locale,
        pagination: {
          pageNumber: i,
          pages: Array(totalPages),
          href: {
            previous: i > 0 ? `/${baseUrl}/${i === 1 ? '' : `page/${i}/`}` : null,
            next: i < totalPages - 1 ? `/${baseUrl}/page/${i + 2}/` : null
          }
        }
      };

      // Only add entity if entityKey is provided
      if (entityKey) {
        page[entityKey] = entity;
      }

      pages.push(page);
    }
  }

  return pages;
}

// Every variant of a photo lives under the same directory but for the size
// segment:
//   /system/medium/photos/images/000/000/001/<variant>/01.jpg
// so the JSON indexes carry only the directory and the file name and let the
// client build whichever sizes it needs. Over 164 articles that is the
// difference between an index of ~80 KB and one of ~20 KB.
export const IMAGE_BASE = '/system/medium/photos/images';

const IMAGE_PATH = new RegExp(`^${IMAGE_BASE}/(.+)/[^/]+/([^/]+)$`);

/**
 * The directory and file name of an article's featured photo, or null when it
 * has none or its path is not the one the bucket uses.
 */
export function featuredImageParts(article) {
  const featured = article.media?.find(m => m.featured && m.type === 'Photo');
  const match = featured?.image_urls?.teaser_tablet?.match(IMAGE_PATH);
  return match ? { dir: match[1], file: match[2] } : null;
}

// Pairing a page with its translation. Most paths are the same in both
// locales but for the prefix; three kinds of slug are not:
//   - articles, 16 of which have a slug of their own in each language, so
//     they pair by id, the only key both JSON files share;
//   - categories, which pair by position, as categories_list already does;
//   - the static pages, whose slugs live in i18n.pages under the same keys.
const articleSlugs = { en: new Map(), es: new Map() };
const articleIds = { en: new Map(), es: new Map() };
for (const [locale, articles] of [['en', en_articles_raw], ['es', es_articles_raw]]) {
  for (const article of articles) {
    articleSlugs[locale].set(article.id, article.slug);
    articleIds[locale].set(article.slug, article.id);
  }
}

// The Spanish JSON marks everything as translated; whether an article really
// exists in both languages is what the English one says.
const translatedIds = new Set(en_articles_raw.filter(a => a.translated).map(a => a.id));

const categorySlugs = {
  en: en_categories_raw.map(category => category.slug),
  es: es_categories_raw.map(category => category.slug)
};

const otherLocale = locale => (locale === 'es' ? 'en' : 'es');

/**
 * The public form of a page URL: without `.html`, which is how every link on
 * the site writes it and how GitHub Pages serves it.
 */
export function cleanUrl(url) {
  return url.replace(/\.html$/, '');
}

/**
 * The same page in the other locale, as `{ path, translated }`, or null when
 * there is none. `translated` is false for the English articles that still
 * carry the Spanish text: they are the same page, but not a translation.
 */
export function alternateFor(url) {
  const [, locale, ...rest] = cleanUrl(url).split('/');
  if (!i18n[locale]) return null;

  const to = otherLocale(locale);
  const path = rest.join('/');
  const swap = tail => ({ path: `/${to}/${tail}`, translated: true });

  if (rest[0] === 'articles' && rest.length === 2 && rest[1]) {
    const id = articleIds[locale].get(rest[1]);
    if (id === undefined) return null;
    return { path: `/${to}/articles/${articleSlugs[to].get(id)}`, translated: translatedIds.has(id) };
  }

  if (rest[0] === 'categories' && rest[1]) {
    const index = categorySlugs[locale].indexOf(rest[1]);
    if (index < 0) return null;
    return swap(['categories', categorySlugs[to][index], ...rest.slice(2)].join('/'));
  }

  for (const [key, slug] of Object.entries(i18n[locale].pages)) {
    if (path === slug || `${path}/` === slug) return swap(i18n[to].pages[key]);
  }

  // Pages under the books index share its prefix but not its slug.
  const books = i18n[locale].pages.books;
  if (path.startsWith(books)) return null;

  return swap(path);
}
