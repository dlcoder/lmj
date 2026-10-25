import { STATICS_HOST } from './base.js';
import * as articles from './articles.js';

// Every featured image path is the same but for the size segment:
//   /system/medium/photos/images/000/000/001/<variant>/01.jpg
// so each entry only carries the directory and the file name, and the
// carousel builds the four URLs it needs. Over 164 articles that is the
// difference between an index of ~80 KB and one of ~20 KB.
const IMAGE_PATH = /^\/system\/medium\/photos\/images\/(.+)\/big_teaser_mobile\/([^/]+)$/;

function entry(article) {
  const featured = article.media?.find(m => m.featured && m.type === 'Photo');
  const match = featured?.image_urls?.big_teaser_mobile?.match(IMAGE_PATH);
  if (!match) return null;

  const date = new Date(article.published_at);
  const pad = n => String(n).padStart(2, '0');

  return {
    s: article.slug,
    t: article.title,
    l: (article.localities || []).join(', '),
    d: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    p: match[1],
    f: match[2]
  };
}

const index = locale => ({
  host: STATICS_HOST,
  articles: articles[locale].map(entry).filter(Boolean)
});

export default {
  en: index('en'),
  es: index('es')
};
