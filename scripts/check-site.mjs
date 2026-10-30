// Checks over the built files that need no browser: the URLs the pages give
// for themselves and their translation, the structured data, the sitemap and
// the redirects from the Rails app. Run with `npm run check-site`; the layout
// checks are in check-pages.mjs.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_URL } from '../lib/base.js';

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

// Every canonical and hreflang URL has to be a page that exists, every
// hreflang pair has to point back, and the structured data has to parse. A
// slug paired wrongly would otherwise only show up in Search Console.
function checkAlternates() {
  const isPage = path => [path, `${path}.html`, join(path, 'index.html')]
    .some(file => existsSync(file) && statSync(file).isFile());
  const local = url => join('_site', url.slice(SITE_URL.length));
  const pairs = new Map();

  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) { walk(path); continue; }
      if (!path.endsWith('.html')) continue;

      const html = readFileSync(path, 'utf8');
      for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
        try { JSON.parse(json); } catch { fail(path, 'its structured data is not valid JSON'); }
      }
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      if (!canonical) continue;
      if (!isPage(local(canonical))) fail(path, `canonical ${canonical} is not a page`);

      const alternates = [...html.matchAll(/<link rel="alternate" hreflang="\w+" href="([^"]+)"/g)]
        .map(match => match[1])
        .filter(url => url !== canonical);
      for (const url of alternates) {
        if (!isPage(local(url))) fail(path, `hreflang ${url} is not a page`);
        pairs.set(canonical, url);
      }
    }
  };

  walk('_site');
  for (const [from, to] of pairs) {
    if (pairs.get(to) !== from) fail(from, `hreflang points to ${to}, which does not point back`);
  }
  if (pairs.size < 100) fail('hreflang', `only ${pairs.size} pages carry a translation pair`);
}

// The sitemap lists every page but the root redirect, each one once and
// each one a page that exists. Pagination is the easy thing to lose: by
// default only the first page of a paginated template reaches a collection.
function checkSitemap() {
  const locs = [...readFileSync('_site/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => match[1]);
  let pages = 0;
  let redirects = 0;
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith('.html') && path !== join('_site', 'index.html') && path !== join('_site', '404.html')) {
        // The old Rails addresses are pages too, but only to send the reader
        // on; their targets are checked with the canonicals.
        if (readFileSync(path, 'utf8').includes('http-equiv="refresh"')) redirects++;
        else pages++;
      }
    }
  };
  walk('_site');
  if (redirects < 1400) fail('redirects', `only ${redirects} old Rails URLs are redirected`);

  if (new Set(locs).size !== locs.length) fail('sitemap', 'lists some pages twice');
  if (locs.length !== pages) fail('sitemap', `${locs.length} URLs for ${pages} pages`);
  for (const url of locs) {
    const path = join('_site', url.slice(SITE_URL.length));
    if (![path, `${path}.html`, join(path, 'index.html')].some(file => existsSync(file) && statSync(file).isFile())) {
      fail('sitemap', `${url} is not a page`);
    }
  }
}

checkAlternates();
checkSitemap();

if (failures.length) {
  console.error(`${failures.length} problem(s):\n`);
  for (const line of failures) console.error(`  ${line}`);
  process.exit(1);
}
console.log('Canonicals, hreflang pairs, structured data, sitemap and redirects pass.');
