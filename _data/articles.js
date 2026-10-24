import { readFileSync } from 'node:fs';
import en_json from './raw/en_articles.json' with { type: 'json' };
import es_json from './raw/es_articles.json' with { type: 'json' };
import { localityMap, enCategoryMap, esCategoryMap, STATICS_HOST } from './base.js';

// Tradition articles keep their body as hand-written HTML under content/,
// where images are referenced as [img::N]. N is the file number of the media
// (N.jpg), which is also its index in the media array: index 0 is the
// featured image and the rest are named 1.jpg, 2.jpg and so on.
const IMAGE_PLACEHOLDER = /\[img::(\d+)\]/g;

// Summaries and sentences come out of the old database with HTML entities
// (&#8220; and friends) but no markup at all, so decoding them here keeps the
// data as plain text and lets the templates escape it normally.
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };

function decodeEntities(value) {
  if (typeof value !== 'string') return value;

  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x'
        ? parseInt(code.slice(2), 16)
        : Number(code.slice(1));
      return Number.isNaN(point) ? match : String.fromCodePoint(point);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

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
    summary: decodeEntities(article.summary),
    sentences: (article.sentences || []).map(decodeEntities),
    body: article.type === 'Tradition' ? traditionBody(article, locale) : null
  }));
}

export const en = hydrate(en_json, enCategoryMap, 'en');
export const es = hydrate(es_json, esCategoryMap, 'es');

export default [
  ...en.map(a => ({ ...a, locale: 'en' })),
  ...es.map(a => ({ ...a, locale: 'es' }))
];
