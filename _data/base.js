import regions from './raw/regions.json' with { type: 'json' };
import en_categories_raw from './raw/en_categories.json' with { type: 'json' };
import es_categories_raw from './raw/es_categories.json' with { type: 'json' };

const PAGE_SIZE = 12;

// Host for the pre-generated image variants. Kept here so both .eleventy.js
// and the data layer read it from one place.
export const STATICS_HOST = process.env.STATICS_HOST || "https://lmjstatic.deliriumcoder.com";

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
