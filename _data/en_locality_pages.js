import localities from './localities.json' with { type: 'json' };
import en_articles from './en_articles.json' with { type: 'json' };

const PAGE_SIZE = 10;

export default function() {
  const pages = [];

  for (const locality of localities) {
    const articles = en_articles
      .filter(article => article.localities && article.localities.includes(locality.name))
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (articles.length === 0) continue;

    const totalPages = Math.ceil(articles.length / PAGE_SIZE);

    for (let i = 0; i < totalPages; i++) {
      pages.push({
        locality,
        articles: articles.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE),
        pagination: {
          pageNumber: i,
          pages: Array(totalPages),
          href: {
            previous: i > 0 ? `/en/localities/${locality.slug}${i === 1 ? '/' : `/page/${i}/`}` : null,
            next: i < totalPages - 1 ? `/en/localities/${locality.slug}/page/${i + 2}/` : null
          }
        }
      });
    }
  }

  return pages;
}
