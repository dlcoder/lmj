import { regions, en_categories_raw, es_categories_raw, generatePaginatedPages } from './base.js';
import * as articles from './articles.js';
import index_pages from './index_pages.js';

export const all_categories = [
  ...generatePaginatedPages({
    entities: en_categories_raw,
    articles: articles.en,
    filterFn: (a, c) => a.categories?.includes(c.name),
    entityKey: 'category', pathPrefix: 'categories', locale: 'en'
  }),
  ...generatePaginatedPages({
    entities: es_categories_raw,
    articles: articles.es,
    filterFn: (a, c) => a.categories?.includes(c.name),
    entityKey: 'category', pathPrefix: 'categories', locale: 'es'
  })
];

export const all_regions = [
  ...generatePaginatedPages({
    entities: regions,
    articles: articles.en,
    filterFn: (a, r) => a.localities?.some(l => r.localities.some(rl => rl.name === l)),
    entityKey: 'region', pathPrefix: 'regions', locale: 'en'
  }),
  ...generatePaginatedPages({
    entities: regions,
    articles: articles.es,
    filterFn: (a, r) => a.localities?.some(l => r.localities.some(rl => rl.name === l)),
    entityKey: 'region', pathPrefix: 'regions', locale: 'es'
  })
];

export const all_localities = [
  ...generatePaginatedPages({
    entities: regions.flatMap(r => r.localities.map(l => ({ ...l, region: { name: r.name, slug: r.slug } }))),
    articles: articles.en,
    filterFn: (a, l) => a.localities?.includes(l.name),
    entityKey: 'locality', pathPrefix: 'localities', locale: 'en'
  }),
  ...generatePaginatedPages({
    entities: regions.flatMap(r => r.localities.map(l => ({ ...l, region: { name: r.name, slug: r.slug } }))),
    articles: articles.es,
    filterFn: (a, l) => a.localities?.includes(l.name),
    entityKey: 'locality', pathPrefix: 'localities', locale: 'es'
  })
];

export const all_indices = index_pages();
export const all_articles = articles.default;
