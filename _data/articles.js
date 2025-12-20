import en_json from './raw/en_articles.json' with { type: 'json' };
import es_json from './raw/es_articles.json' with { type: 'json' };
import { localityMap, enCategoryMap, esCategoryMap } from './base.js';

function hydrate(articles, categoryMap) {
  return articles.map(article => ({
    ...article,
    enrichedLocalities: (article.localities || [])
      .map(name => localityMap.get(name))
      .filter(Boolean),
    enrichedCategories: (article.categories || [])
      .map(name => categoryMap.get(name))
      .filter(Boolean)
  }));
}

export const en = hydrate(en_json, enCategoryMap);
export const es = hydrate(es_json, esCategoryMap);

export default [
  ...en.map(a => ({ ...a, locale: 'en' })),
  ...es.map(a => ({ ...a, locale: 'es' }))
];
