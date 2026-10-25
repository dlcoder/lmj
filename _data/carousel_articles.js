import { STATICS_HOST, IMAGE_BASE, featuredImageParts } from './base.js';
import * as articles from './articles.js';

// Each entry carries only the directory and the file name of the featured
// photo — see featuredImageParts — and the carousel builds the four
// big_teaser_* URLs it needs. Over 164 articles that is the difference
// between an index of ~80 KB and one of ~20 KB.
function entry(article) {
  const image = featuredImageParts(article);
  if (!image) return null;

  const date = new Date(article.published_at);
  const pad = n => String(n).padStart(2, '0');

  return {
    s: article.slug,
    t: article.title,
    l: (article.localities || []).join(', '),
    d: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    p: image.dir,
    f: image.file
  };
}

const index = locale => ({
  host: STATICS_HOST,
  imageBase: IMAGE_BASE,
  articles: articles[locale].map(entry).filter(Boolean)
});

export default {
  en: index('en'),
  es: index('es')
};
