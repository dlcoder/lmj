import { readFileSync } from 'node:fs';
import en_json from './raw/en_articles.json' with { type: 'json' };
import es_json from './raw/es_articles.json' with { type: 'json' };
import { localityMap, enCategoryMap, esCategoryMap, STATICS_HOST } from './base.js';

// Tradition articles keep their body as hand-written HTML under content/,
// where images are referenced as [img::N]. N is the file number of the media
// (N.jpg), which is also its index in the media array: index 0 is the
// featured image and the rest are named 1.jpg, 2.jpg and so on.
const IMAGE_PLACEHOLDER = /\[img::(\d+)\]/g;

function responsiveImage(media) {
  if (!media?.image_urls) return '';

  const url = size => `${STATICS_HOST}${media.image_urls[size]}`;
  return `<div class="responsive-image" role="img" style="` +
    `--img-mobile: url('${url('mobile')}');` +
    `--img-tablet: url('${url('tablet')}');` +
    `--img-desktop: url('${url('desktop')}');` +
    `--img-desktop-hd: url('${url('desktop_hd')}');` +
    `"></div>`;
}

function traditionBody(article, locale) {
  let html;
  try {
    html = readFileSync(`content/${locale}_${article.slug}.html`, 'utf8');
  } catch {
    return null;
  }

  return html.replace(IMAGE_PLACEHOLDER, (_, index) => responsiveImage(article.media?.[Number(index)]));
}

function hydrate(articles, categoryMap, locale) {
  return articles.map(article => ({
    ...article,
    enrichedLocalities: (article.localities || [])
      .map(name => localityMap.get(name))
      .filter(Boolean),
    enrichedCategories: (article.categories || [])
      .map(name => categoryMap.get(name))
      .filter(Boolean),
    body: article.type === 'Tradition' ? traditionBody(article, locale) : null
  }));
}

export const en = hydrate(en_json, enCategoryMap, 'en');
export const es = hydrate(es_json, esCategoryMap, 'es');

export default [
  ...en.map(a => ({ ...a, locale: 'en' })),
  ...es.map(a => ({ ...a, locale: 'es' }))
];
