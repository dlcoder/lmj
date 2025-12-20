import regions from './regions.json' with { type: 'json' };
import localities from './localities.json' with { type: 'json' };
import en_articles from './en_articles.json' with { type: 'json' };

const PAGE_SIZE = 10;

export default function() {
  const pages = [];

  for (const region of regions) {
    const regionLocalities = localities
      .filter(loc => loc.region === region.name)
      .map(loc => loc.name);

    const articles = en_articles
      .filter(article =>
        article.localities &&
        article.localities.some(loc => regionLocalities.includes(loc))
      )
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (articles.length === 0) continue;

    const totalPages = Math.ceil(articles.length / PAGE_SIZE);

    for (let i = 0; i < totalPages; i++) {
      pages.push({
        region,
        articles: articles.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE),
        pagination: {
          pageNumber: i,
          pages: Array(totalPages),
          href: {
            previous: i > 0 ? `/en/regions/${region.slug}${i === 1 ? '/' : `/page/${i}/`}` : null,
            next: i < totalPages - 1 ? `/en/regions/${region.slug}/page/${i + 2}/` : null
          }
        }
      });
    }
  }

  return pages;
}
