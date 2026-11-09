import regions from './raw/regions.json' with { type: 'json' };
import { en_categories_raw, es_categories_raw } from '../lib/base.js';
import * as articles from './articles.js';
import i18n from './i18n.js';
import localities_list from './localities_list.js';
import regions_list from './regions_list.js';
import { PAGE_SIZE } from '../lib/base.js';

// Every URL the Rails app served that this site serves somewhere else, with
// where it lives now. GitHub Pages has no server-side redirects, so each one
// is written out as a page of its own that sends the reader on with a meta
// refresh (see src/redirect.njk). Query strings — the old ?page=N — cannot
// reach a static page and are lost.
//
// The final slugs are the same as the old ones; it is the prefixes that
// changed, so the list is derived from the same data that builds the site.
// Paths the old app shares with this one, such as /en/articles or
// /en/categories/{slug}, already resolve and need nothing.
const prefixes = {
  es: { articles: 'articulos', places: 'lugares', traditions: 'tradiciones', categories: 'categorias', localities: 'municipios', map: 'mapa' },
  en: { articles: 'articles', places: 'places', traditions: 'traditions', categories: 'categories', localities: 'cities', map: 'map' }
};

const categories = { es: es_categories_raw, en: en_categories_raw };

// Region slugs this site used until the comarcas followed the official list,
// in October 2026, with the regions each one became. La Loma y Las Villas was
// split in two, so it goes to the regions index. Their pages were linked with
// a trailing slash, so these redirects are written as directory indexes.
const formerRegions = {
  'area-metropolitana-de-jaen': ['comarca-metropolitana-de-jaen'],
  'alto-guadalquivir': ['sierra-de-cazorla'],
  'campina': ['campina-de-jaen'],
  'la-loma-y-las-villas': ['la-loma', 'las-villas'],
  'sierra-norte': ['sierra-morena']
};

// Slugs some articles had before they were renamed, from the Rails app's
// friendly_id_slugs table, by article id. The old app kept answering to them
// in either language, as the table carries no locale.
const formerSlugs = {
  93: ['castilo-de-sabiote-i'],
  95: ['banos-arabes-de-segura-de-la-sierra'],
  98: ['el-puente-viejo'],
  107: ['catatumbas-de-san-ildelfonso'],
  109: ['la-serrezuela'],
  111: ['castulo-2-parte'],
  114: ['refugio-de-miramundos-00e6f0b2-7aca-4166-9e50-5c3d22c47360'],
  116: ['exteriores-del-castillo-de-segura-de-la-sierra'],
  117: ['castillo-de-segura-de-la-sierra'],
  119: ['casco-historico-de-iznatoraf'],
  121: ['castillo-de-segura-exteriores'],
  136: ['el-peregrino'],
  140: ['galapan-y-campos'],
  145: ['cueva-del-agua'],
  146: ['los-negros'],
  161: ['zapatero']
};

function forLocale(locale) {
  const p = prefixes[locale];
  const pages = i18n[locale].pages;
  const list = [];
  const add = (from, to) => list.push({ from, to, locale });

  add(`/${locale}/${p.articles}`, `/${locale}/articles/`);
  add(`/${locale}/${p.articles}/${p.places}`, `/${locale}/articles/`);
  add(`/${locale}/${p.articles}/${p.traditions}`, `/${locale}/articles/`);

  for (const article of articles[locale]) {
    const kind = article.type === 'Tradition' ? p.traditions : p.places;
    const to = `/${locale}/articles/${article.slug}`;
    // 68 English articles got a slug of their own when they were translated
    // in 2026. Until then they were published, here and by the Rails app,
    // under the Spanish one, which legacy_slug keeps.
    const old = article.legacy_slug ?? article.slug;
    for (const slug of [old, ...(formerSlugs[article.id] ?? [])]) {
      add(`/${locale}/${p.articles}/${kind}/${slug}`, to);
      add(`/${locale}/${p.articles}/${slug}`, to);
    }
    // The old app also found an article by its database id, and links of that
    // form still turn up in its logs.
    add(`/${locale}/${p.articles}/${kind}/${article.id}`, to);
    add(`/${locale}/${p.articles}/${article.id}`, to);
  }

  for (const category of categories[locale]) {
    add(`/${locale}/${p.categories}/${category.slug}`, `/${locale}/categories/${category.slug}/`);
  }
  // A slug the old app had retired but still answered to.
  if (locale === 'es') add('/es/categorias/patrimonio', '/es/categories/patrimonio-monumental/');

  add(`/${locale}/${p.localities}`, `/${locale}/localities/`);
  add(`/${locale}/${p.localities}/${p.map}`, `/${locale}/localities/map/`);

  // The 51 municipalities with no article have no page here, but they are
  // still on the localities index, which is where they send the reader.
  const withArticles = new Set(localities_list.filter(l => l.articleCount).map(l => l.slug));
  for (const locality of regions.flatMap(region => region.localities)) {
    add(`/${locale}/${p.localities}/${locality.slug}`,
      withArticles.has(locality.slug) ? `/${locale}/localities/${locality.slug}/` : `/${locale}/localities/`);
  }

  for (const [slug, became] of Object.entries(formerRegions)) {
    const to = became.length === 1 ? `/${locale}/regions/${became[0]}/` : `/${locale}/regions/`;
    const count = regions_list.filter(r => became.includes(r.slug)).reduce((n, r) => n + r.articleCount, 0);
    add(`/${locale}/regions/${slug}/`, to);
    for (let page = 2; page <= Math.ceil(count / PAGE_SIZE); page++) add(`/${locale}/regions/${slug}/page/${page}/`, to);
  }

  // The static pages that were renamed or folded into another.
  const old = locale === 'es'
    ? { 'libro': pages.book1, 'libro-1': pages.book1, 'libro-2': pages.book2, 'el-equipo': pages.project, 'medios': pages.project }
    : { 'book-1': pages.book1, 'libro-2': pages.book2, 'the-team': pages.project, 'press': pages.project };
  for (const [slug, to] of Object.entries(old)) add(`/${locale}/${slug}`, `/${locale}/${to}`);

  // Same address in both languages, so the slug may collide with a page.
  return list.filter(({ from, to }) => from !== to.replace(/\/$/, ''));
}

export default [
  ...forLocale('es'),
  ...forLocale('en'),
  // The site before the Rails app published its articles under /reportajes,
  // with the slugs they still have, and links to them still turn up.
  ...articles.es.map(article => ({ from: `/reportajes/${article.slug}`, to: `/es/articles/${article.slug}`, locale: 'es' })),
  { from: '/portada', to: '/es/', locale: 'es' },
  { from: '/colaboradores', to: `/es/${i18n.es.pages.project}`, locale: 'es' },
  { from: '/es/tienda/product/lugares-miticos-de-jaen-vol-2-ebook', to: `/es/${i18n.es.pages.book2}`, locale: 'es' },
  // The two shortcuts the old routes.rb kept for the second book.
  { from: '/libro2', to: `/es/${i18n.es.pages.book2}`, locale: 'es' },
  { from: '/libro-2', to: `/es/${i18n.es.pages.book2}`, locale: 'es' }
];
