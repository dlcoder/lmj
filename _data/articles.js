import { readFileSync } from 'node:fs';
import en_json from './raw/en_articles.json' with { type: 'json' };
import es_json from './raw/es_articles.json' with { type: 'json' };
import { localityMap, enCategoryMap, esCategoryMap, STATICS_HOST } from './base.js';

// Tradition articles keep their body as hand-written HTML under content/,
// where images are referenced with the placeholder the Rails app used:
// [img:PAD:N]. N is a 1-based index into the article's non-featured media in
// id order, and PAD is an optional aspect ratio, as a percentage, for photos
// that are not the usual 3:2. Both halves matter: a quarter of the
// placeholders carry a PAD, and skipping those leaves raw text on the page.
const IMAGE_PLACEHOLDER = /\[img:(\d*):(\d+)\]/g;

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

function responsiveImage(media, paddingTop) {
  if (!media?.image_urls) return '';

  const url = size => `${STATICS_HOST}${media.image_urls[size]}`;
  return `<div class="responsive-image" role="img" style="` +
    (paddingTop ? `padding-top: ${paddingTop}%;` : '') +
    `--img-mobile: url('${url('mobile')}');` +
    `--img-tablet: url('${url('tablet')}');` +
    `--img-desktop: url('${url('desktop')}');` +
    `--img-desktop-hd: url('${url('desktop_hd')}');` +
    `"></div>`;
}

function traditionBody(article, galleryMedia, locale) {
  let html;
  try {
    html = readFileSync(`content/${locale}_${article.slug}.html`, 'utf8');
  } catch {
    return null;
  }

  return html.replace(IMAGE_PLACEHOLDER, (_, padding, index) =>
    responsiveImage(galleryMedia[Number(index) - 1], padding));
}

function hydrate(articles, categoryMap, locale) {
  return articles.map(article => {
    // What the old app called no_featured_media: everything but the featured
    // item, in id order, which is the order the raw JSON already has. The
    // featured one is not always first, so it cannot be assumed away.
    const galleryMedia = (article.media ?? []).filter(m => !m.featured);

    return {
    ...article,
    galleryPhotos: galleryMedia.filter(m => m.type === 'Photo'),
    enrichedLocalities: (article.localities || [])
      .map(name => localityMap.get(name))
      .filter(Boolean),
    enrichedCategories: (article.categories || [])
      .map(name => categoryMap.get(name))
      .filter(Boolean),
    summary: decodeEntities(article.summary),
    sentences: (article.sentences || []).map(decodeEntities),
    body: article.type === 'Tradition' ? traditionBody(article, galleryMedia, locale) : null
    };
  });
}

export const en = hydrate(en_json, enCategoryMap, 'en');
export const es = hydrate(es_json, esCategoryMap, 'es');

export default [
  ...en.map(a => ({ ...a, locale: 'en' })),
  ...es.map(a => ({ ...a, locale: 'es' }))
];
