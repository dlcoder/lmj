import regions from './raw/regions.json' with { type: 'json' };
import { en_categories_raw, es_categories_raw } from './base.js';
import * as articles from './articles.js';
import i18n from './i18n.js';
import localities_list from './localities_list.js';

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
    add(`/${locale}/${p.articles}/${kind}/${old}`, to);
    add(`/${locale}/${p.articles}/${old}`, to);
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
  // The two shortcuts the old routes.rb kept for the second book.
  { from: '/libro2', to: `/es/${i18n.es.pages.book2}`, locale: 'es' },
  { from: '/libro-2', to: `/es/${i18n.es.pages.book2}`, locale: 'es' }
];
