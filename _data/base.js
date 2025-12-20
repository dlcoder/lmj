import regions from './raw/regions.json' with { type: 'json' };
import en_categories_raw from './raw/en_categories.json' with { type: 'json' };
import es_categories_raw from './raw/es_categories.json' with { type: 'json' };

const PAGE_SIZE = 10;

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
  locale
}) {
  const pages = [];

  for (const entity of entities) {
    const filteredArticles = articles
      .filter(article => filterFn(article, entity))
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (filteredArticles.length === 0) continue;

    const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);

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
