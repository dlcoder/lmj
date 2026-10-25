import regions from './raw/regions.json' with { type: 'json' };
import es_articles from './raw/es_articles.json' with { type: 'json' };
import localities_list from './localities_list.js';

// Regions sorted by name: the footer sitemap reads the name and slug, the
// regions index the rest. Counted on the Spanish articles, as the locality
// counts are — both locales carry the same articles.
const countIn = names =>
  es_articles.filter(article => (article.localities || []).some(name => names.has(name))).length;

export default [...regions]
  .map(({ name, slug, localities }) => {
    const names = new Set(localities.map(locality => locality.name));
    return {
      name,
      slug,
      articleCount: countIn(names),
      localities: localities_list.filter(locality => names.has(locality.name))
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));
