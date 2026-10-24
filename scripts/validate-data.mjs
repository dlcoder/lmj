// Checks the raw JSON under _data/raw/ for the kinds of inconsistency that
// silently drop content at build time: names that no longer resolve to a
// locality or category, articles missing from one locale, and so on.
// Exits non-zero when something is actually broken, so it can gate CI.
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(`_data/raw/${path}`, 'utf8'));

const regions = read('regions.json');
const localityNames = new Set(regions.flatMap(r => r.localities.map(l => l.name)));
const articles = { es: read('es_articles.json'), en: read('en_articles.json') };
const categories = { es: read('es_categories.json'), en: read('en_categories.json') };
const pages = { es: read('es_pages.json'), en: read('en_pages.json') };

const errors = [];
const warnings = [];

// Slugs must be unique per locale: two articles sharing one would overwrite
// each other's page.
for (const [locale, list] of Object.entries(articles)) {
  const seen = new Set();
  for (const article of list) {
    if (seen.has(article.slug)) errors.push(`${locale}: duplicate article slug "${article.slug}"`);
    seen.add(article.slug);
  }
}

// Both locales must describe the same set of articles, otherwise the language
// switcher and hreflang have nothing to point at. Pairing goes through `id`,
// not the slug: 16 articles have a different slug in each language.
const esIds = new Set(articles.es.map(a => a.id));
const enIds = new Set(articles.en.map(a => a.id));
for (const id of esIds) if (!enIds.has(id)) errors.push(`missing from en_articles: id ${id}`);
for (const id of enIds) if (!esIds.has(id)) errors.push(`missing from es_articles: id ${id}`);
for (const [locale, list] of Object.entries(articles)) {
  for (const article of list) {
    if (article.id === undefined) errors.push(`${locale}/${article.slug}: missing id`);
  }
}

// Locality and category names are the join keys used during hydration; a name
// that does not resolve is dropped without warning.
for (const [locale, list] of Object.entries(articles)) {
  const categoryNames = new Set(categories[locale].map(c => c.name));

  for (const article of list) {
    for (const name of article.localities || []) {
      if (!localityNames.has(name)) errors.push(`${locale}/${article.slug}: unknown locality "${name}"`);
    }
    for (const name of article.categories || []) {
      if (!categoryNames.has(name)) errors.push(`${locale}/${article.slug}: unknown category "${name}"`);
    }
    if (!article.media?.some(m => m.featured && m.type === 'Photo')) {
      errors.push(`${locale}/${article.slug}: no featured photo`);
    }
    if (!article.geolocation && article.type !== 'Tradition') {
      warnings.push(`${locale}/${article.slug}: no geolocation`);
    }
    if (article.translated === false && locale === 'en') {
      warnings.push(`en/${article.slug}: not translated`);
    }
  }
}

// Static pages are paired by id too, since their slugs are translated as well
// (acerca-de / about-us).
const enPageIds = new Set(pages.en.map(p => p.id));
for (const page of pages.es) {
  if (!enPageIds.has(page.id)) warnings.push(`pages: "${page.slug}" exists only in Spanish`);
}

const summarise = (label, list) => {
  if (!list.length) return;
  const grouped = list.reduce((acc, line) => {
    const kind = line.replace(/^[^:]*: /, '').replace(/"[^"]*"/, '"…"');
    (acc[kind] ||= []).push(line);
    return acc;
  }, {});
  console.log(`\n${label} (${list.length})`);
  for (const [kind, lines] of Object.entries(grouped)) {
    console.log(`  ${kind} — ${lines.length}`);
    for (const line of lines.slice(0, 5)) console.log(`      ${line}`);
    if (lines.length > 5) console.log(`      … and ${lines.length - 5} more`);
  }
};

console.log(
  `articles: ${articles.es.length} es / ${articles.en.length} en` +
  `  |  categories: ${categories.es.length}` +
  `  |  localities: ${localityNames.size}` +
  `  |  pages: ${pages.es.length} es / ${pages.en.length} en`
);
summarise('WARNINGS', warnings);
summarise('ERRORS', errors);

if (errors.length) {
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(`\nNo errors.`);
