import { STATICS_HOST, IMAGE_BASE, featuredImageParts } from '../lib/base.js';
import * as articles from './articles.js';

// The full text of every article, one file per locale, for the search on
// the home page. It is fetched the first time the field is used rather than
// embedded, since it weighs ~70 KB gzipped against the carousel's ~5 KB.
// Short keys, as in the carousel index; the client folds case and accents
// itself, so the text is stored once, as it is shown.
function entry(article) {
  const image = featuredImageParts(article);
  const date = new Date(article.published_at);
  const pad = n => String(n).padStart(2, '0');

  return {
    s: article.slug,
    t: article.title,
    l: (article.localities || []).join(', '),
    c: article.enrichedCategories.map(category => category.name).join(', '),
    x: [article.summary, ...(article.sentences || [])].filter(Boolean).join(' '),
    d: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    ...(image && { p: image.dir, f: image.file })
  };
}

const index = locale => ({
  host: STATICS_HOST,
  imageBase: IMAGE_BASE,
  articles: articles[locale]
    .toSorted((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .map(entry)
});

export default {
  en: index('en'),
  es: index('es')
};
