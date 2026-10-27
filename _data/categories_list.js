import { en_categories_raw, es_categories_raw } from './base.js';
import en_articles from './raw/en_articles.json' with { type: 'json' };
import es_articles from './raw/es_articles.json' with { type: 'json' };

// Articles per category name, for the count on the home page's tiles.
const countBy = articles => {
  const counts = {};
  articles.forEach(article => {
    (article.categories || []).forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
};

const enCounts = countBy(en_articles);
const esCounts = countBy(es_articles);

export default {
  en: en_categories_raw.map(cat => ({ ...cat, imageSlug: cat.slug, articleCount: enCounts[cat.name] || 0 })),
  es: es_categories_raw.map((cat, i) => ({ ...cat, imageSlug: en_categories_raw[i].slug, articleCount: esCounts[cat.name] || 0 }))
};
