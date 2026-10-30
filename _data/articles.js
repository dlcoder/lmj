import { readFileSync } from 'node:fs';
import en_json from './raw/en_articles.json' with { type: 'json' };
import es_json from './raw/es_articles.json' with { type: 'json' };
import { localityMap, enCategoryMap, esCategoryMap, STATICS_HOST } from '../lib/base.js';

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
    // The deck's slides: the photos and, in their place among them, the four
    // YouTube videos, which the old app rendered in the same slide.
    galleryMedia,
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

// The pool of related articles for the end of each place article, the
// closest first: sharing the locality outranks sharing the region, which
// outranks each category in common, which outranks each word of the title.
// The eight closest make the pool, more when tied at the eighth, up to 12;
// ties are ordered with a seed of the article's id, so the pool is stable
// from build to build. The page shows the first four, and the script
// redraws four from the pool each day, as the home carousel does.
const STOPWORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'al', 'the', 'of', 'and', 'in', 'at']);
const POOL = 8;
const POOL_MAX = 12;

const words = title => new Set(title.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter(word => word.length > 2 && !STOPWORDS.has(word)));

function seeded(seed) {
  // mulberry32, as the home carousel uses.
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function score(a, b) {
  const shared = (x, y) => [...x].filter(item => y.has(item)).length;
  const regions = article => new Set(article.enrichedLocalities.map(l => l.region.slug));
  return 1000 * Math.min(1, shared(new Set(a.localities), new Set(b.localities)))
    + 100 * Math.min(1, shared(regions(a), regions(b)))
    + 10 * shared(new Set(a.categories), new Set(b.categories))
    + Math.min(9, shared(a.words, b.words));
}

function withRelated(articles) {
  const pool = articles.map(article => ({ ...article, words: words(article.title) }));
  return articles.map((article, index) => {
    const random = seeded(article.id);
    const ranked = pool.filter(other => other.id !== article.id)
      .map(other => ({ other, score: score(pool[index], other), tiebreak: random() }))
      .sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);
    const floor = ranked[Math.min(POOL, ranked.length) - 1].score;
    const related = ranked.filter(c => c.score >= floor).slice(0, POOL_MAX)
      // Only what a card needs, so the articles do not end up nesting each other.
      .map(({ other }) => ({
        slug: other.slug,
        title: other.title,
        localities: other.localities,
        published_at: other.published_at,
        media: other.media.filter(m => m.featured)
      }));
    return { ...article, related };
  });
}

export const en = withRelated(hydrate(en_json, enCategoryMap, 'en'));
export const es = withRelated(hydrate(es_json, esCategoryMap, 'es'));

export default [
  ...en.map(a => ({ ...a, locale: 'en' })),
  ...es.map(a => ({ ...a, locale: 'es' }))
];
