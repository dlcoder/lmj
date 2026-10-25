// Renders the built site in a real browser and asserts the things that have
// actually broken here before: images resolving to url(''), layouts
// collapsing, content spilling sideways, the footer not reaching the edges,
// the slide deck losing its dots. Run with `npm run check-pages`.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { STATICS_HOST } from '../_data/base.js';

const PORT = 8123;
const BASE = `http://localhost:${PORT}`;
const ASSETS = STATICS_HOST;
const CACHE = '/tmp/lmjimg';

const WIDE = 1440;
const NARROW = 900;
const MOBILE = 390;

// A 2x1 grey GIF, so a photo that is not cached locally still occupies space
// and the layout can be measured without reaching the network.
const PLACEHOLDER = Buffer.from('R0lGODlhAgABAIAAAMLCwgAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==', 'base64');

const pages = [
  { name: 'home',      url: '/es/' },
  { name: 'index',     url: '/es/articles/' },
  { name: 'category',  url: '/es/categories/naturaleza/' },
  { name: 'locality',  url: '/es/localities/jaen/' },
  { name: 'localities', url: '/es/localities/' },
  { name: 'explorer',  url: '/es/localities/map/' },
  { name: 'region',    url: '/es/regions/sierra-sur/' },
  { name: 'regions',   url: '/es/regions/' },
  { name: 'static',    url: '/es/acerca-de' },
  { name: 'place',     url: '/es/articles/el-posito' },
  // The featured photo is the last medium here, not the first, which has
  // broken index-based assumptions before.
  { name: 'place-last-featured', url: '/es/articles/hoya-del-salobral' },
  { name: 'place-en',  url: '/en/articles/el-posito' },
  { name: 'tradition', url: '/es/articles/la-forja' }
];

const failures = [];
const notes = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

async function measure(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const box = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    };
    // Any element whose background is an empty url(), which is what a broken
    // shortcode call produces.
    const emptyBackgrounds = [...document.querySelectorAll('[style*="url("]')]
      .filter(el => /url\(["']{2}\)/.test(el.getAttribute('style')) ||
                    getComputedStyle(el).backgroundImage === 'none' && /--img|--intro/.test(el.getAttribute('style')))
      .length;

    return {
      viewport: de.clientWidth,
      scrollWidth: de.scrollWidth,
      emptyBackgrounds,
      rawEmptyUrls: (document.documentElement.innerHTML.match(/url\(''\)/g) || []).length,
      footers: document.querySelectorAll('footer.footer').length,
      footer: box('footer.footer'),
      slides: document.querySelectorAll('.slides--slide').length,
      dots: document.querySelectorAll('.slides-nav-dot').length,
      startButton: document.getElementById('article-start')
        ? getComputedStyle(document.getElementById('article-start')).display : null,
      introBackground: document.querySelector('.article-gallery')
        ? getComputedStyle(document.querySelector('.article-gallery')).backgroundImage : null,
      galleryImages: document.querySelectorAll('.article-gallery--photo').length,
      traditionIntro: box('.article-tradition__intro'),
      traditionSections: [...document.querySelectorAll('.article-tradition__full-image-with-text, .article-tradition__closing')]
        .map(el => Math.round(el.getBoundingClientRect().height)),
      localityMap: box('.locality-map'),
      pageTitle: box('.page-title'),
      pageProse: box('.page-prose')
    };
  });
}

function check(name, width, m, consoleErrors) {
  const where = `${name} @${width}`;

  if (m.scrollWidth > m.viewport + 1) {
    fail(where, `content spills sideways: scrollWidth ${m.scrollWidth} > ${m.viewport}`);
  }
  if (m.rawEmptyUrls > 0) {
    fail(where, `${m.rawEmptyUrls} image url('') — a shortcode returned nothing`);
  }
  if (m.footers !== 1) {
    fail(where, `expected exactly one footer, found ${m.footers}`);
  }
  if (m.footer && (m.footer.left !== 0 || m.footer.right !== m.viewport)) {
    fail(where, `footer does not reach the edges: ${m.footer.left}..${m.footer.right} of ${m.viewport}`);
  }
  if (consoleErrors.length) {
    fail(where, `console errors: ${consoleErrors.slice(0, 2).join(' / ')}`);
  }

  if (name.startsWith('place')) {
    if (m.slides < 3) fail(where, `deck has only ${m.slides} slides`);
    if (m.galleryImages < 2) fail(where, `only ${m.galleryImages} gallery photos rendered`);

    if (width >= 1280) {
      // The intro is laid over the opening photo only on the deck; stacked,
      // that photo simply follows the text.
      if (!m.introBackground || m.introBackground === 'none') {
        fail(where, 'the opening photo behind the intro is missing');
      }
      if (m.dots !== m.slides) fail(where, `${m.dots} dots for ${m.slides} slides`);
      if (m.startButton === 'none') fail(where, 'the start button is hidden on the deck');
    } else {
      if (m.dots !== 0) fail(where, `${m.dots} dots outside the deck`);
      if (m.startButton !== 'none') fail(where, `the start button shows at ${width}px`);
    }
  }

  if (name === 'tradition') {
    if (m.slides !== 0) fail(where, `a tradition should not be a deck, found ${m.slides} slides`);
    if (!m.traditionIntro || m.traditionIntro.height < 100) {
      fail(where, `the intro collapsed: ${m.traditionIntro ? m.traditionIntro.height : 'missing'}px`);
    }
    for (const height of m.traditionSections) {
      if (height < 300) fail(where, `a full-width section collapsed to ${height}px`);
    }
  }

  // The map runs edge to edge, as it did in the original. The container it
  // lives in is what used to stop it, so this is the thing to watch.
  if (name === 'locality' || name === 'localities' || name === 'explorer') {
    if (!m.localityMap) {
      fail(where, 'the locality map is missing');
    } else if (m.localityMap.left !== 0 || m.localityMap.right !== m.viewport) {
      fail(where, `the map does not reach the edges: ${m.localityMap.left}..${m.localityMap.right} of ${m.viewport}`);
    }
  }

  if (name === 'static' && m.pageTitle && m.pageProse) {
    if (m.pageTitle.left !== m.pageProse.left) {
      fail(where, `title and body do not line up: ${m.pageTitle.left} against ${m.pageProse.left}`);
    }
  }
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('playwright is not installed. Run `npm install` first.');
  process.exit(1);
}

const server = spawn(process.execPath, ['scripts/serve-site.mjs'], {
  stdio: ['ignore', 'ignore', 'inherit'],
  env: { ...process.env, PORT: String(PORT) }
});

for (let i = 0; i < 50; i++) {
  try { await fetch(BASE + '/'); break; } catch { await new Promise(r => setTimeout(r, 100)); }
}

const browser = await chromium.launch();

for (const spec of pages) {
  for (const width of [WIDE, NARROW, MOBILE]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });

    await context.route(`${ASSETS}/**`, route => {
      // Photos are stubbed so the layout can be measured without the network,
      // but the outlines have to come from the host itself: whether it serves
      // them to this origin is the thing being checked.
      if (route.request().url().includes('/geojson/')) return route.continue();

      const file = CACHE + decodeURIComponent(new URL(route.request().url()).pathname);
      if (existsSync(file)) {
        const type = { '.png': 'image/png', '.json': 'application/json' }[extname(file)] ?? 'image/jpeg';
        route.fulfill({ status: 200, contentType: type, body: readFileSync(file) });
      } else {
        route.fulfill({ status: 200, contentType: 'image/gif', body: PLACEHOLDER });
      }
    });
    // Third-party embeds are slow and out of our hands.
    // Tiles are pictures of a map; the outlines are the behaviour under test.
    await context.route(/youtube|speakerdeck|tile\.openstreetmap/, route => route.abort());

    const consoleErrors = [];
    const page = await context.newPage();
    page.on('console', message => {
      // The third-party requests aborted above surface as failed resources;
      // they are the harness's doing, not the page's.
      const text = message.text();
      // Noise from the aborted third parties above, and from outlines the
      // assets host may not serve to this origin.
      const expected = /ERR_FAILED|ERR_ABORTED|CORS policy|province boundary|locality GeoJSON/i.test(text);
      if (message.type() === 'error' && !expected) consoleErrors.push(text);
    });
    page.on('pageerror', error => consoleErrors.push(error.message));

    await page.goto(BASE + spec.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);

    check(spec.name, width, await measure(page), consoleErrors);

    // The dots are white, to sit over photos. The closing slide is white
    // paper and then the purple footer, so they have to get out of the way.
    if (spec.name.startsWith('place') && width >= 1280) {
      const dotsOnLastSlide = await page.evaluate(async () => {
        const deck = document.querySelector('.slides--container');
        const nav = document.getElementById('slides-nav');
        deck.scrollTo({ top: deck.scrollHeight, behavior: 'instant' });
        deck.dispatchEvent(new Event('scroll'));
        // Long enough for the 0.3s fade to finish, or the reading catches it
        // mid-transition and reports a visible nav that is on its way out.
        await new Promise(resolve => setTimeout(resolve, 700));
        const visible = parseFloat(getComputedStyle(nav).opacity) > 0.05;
        deck.scrollTo({ top: 0, behavior: 'instant' });
        deck.dispatchEvent(new Event('scroll'));
        return visible;
      });

      if (dotsOnLastSlide) fail(spec.name, 'the dots stay over the closing slide');
    }

    // The five newest articles are a carousel only once their script runs;
    // without it the slides stack and all five stay reachable. What broke
    // here was the slide overflowing its track, which pushed a full-size
    // photo down the page.
    if (spec.name === 'home') {
      const carousel = await page.evaluate(() => {
        const root = document.getElementById('latest-articles');
        if (!root) return null;
        const slides = [...root.querySelectorAll('.latest-article')];
        return {
          count: slides.length,
          track: root.querySelector('.latest-articles--track').getBoundingClientRect().height,
          tallest: Math.max(...slides.flatMap(s => [
            s.getBoundingClientRect().height,
            s.querySelector('.latest-article--image').getBoundingClientRect().height
          ])),
          current: slides.filter(s => s.classList.contains('is-current')).length,
          title: root.querySelector('.is-current .latest-article--title')?.textContent.trim()
        };
      });

      if (!carousel || !carousel.count) {
        fail('home carousel', 'the latest articles block is missing');
      } else if (carousel.current !== 1) {
        fail('home carousel', `${carousel.current} slides are showing, expected 1`);
      } else if (carousel.tallest > carousel.track + 1) {
        fail('home carousel', `a slide spills to ${Math.round(carousel.tallest)}px inside a ${Math.round(carousel.track)}px track`);
      } else {
        await page.locator('#latest-articles-next').click();
        await page.waitForTimeout(700);
        const next = await page.evaluate(() =>
          document.querySelector('.is-current .latest-article--title')?.textContent.trim());
        if (next === carousel.title) fail('home carousel', 'the next arrow does not change the slide');
      }
    }

    // The home map outlines a municipality when you point at it, reading
    // GeoJSON from the assets host with fetch(). That is subject to CORS and
    // the host answers with an allowlist of origins, so this can only be held
    // to account from an origin the host knows about.
    if (spec.name === 'home' && width === WIDE) {
      // A response can come back 200 and still be withheld from the page, so
      // ask the page itself whether it is allowed to read one.
      const allowed = await page.evaluate(async host => {
        try {
          await fetch(`${host}/files/geojson/province.json`);
          return true;
        } catch {
          return false;
        }
      }, ASSETS);

      if (!allowed) {
        notes.push(`the home map was not checked: the assets host does not serve the outlines to ${BASE}. Add that origin to its CORS allowlist to cover it.`);
      } else {
        await page.evaluate(() => document.getElementById('localities-map')?.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(600);
        const before = await page.evaluate(() => document.querySelectorAll('#localities-map .leaflet-overlay-pane path').length);
        await page.locator('.locality-link').first().hover();
        await page.waitForTimeout(1500);
        const after = await page.evaluate(() => document.querySelectorAll('#localities-map .leaflet-overlay-pane path').length);

        if (before < 1) fail('home map', 'the province outline never loaded');
        else if (after <= before) fail('home map', 'pointing at a municipality draws nothing');
      }
    }

    // A locality page opens with a map carrying a marker per article in the
    // municipality, read from /{locale}/articles.json. That index is
    // same-origin, so unlike the outline behind it — same CORS caveat as the
    // home map — the markers can be held to account from anywhere.
    //
    // Baeza is the page under test rather than Jaén: with a single article
    // there is no cluster in the way, so the marker itself can be clicked and
    // its popup read. Jaén, with 43, is what the clustering is there for.
    if (spec.name === 'locality' && width === WIDE) {
      await page.goto(`${BASE}/es/localities/baeza/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const markers = await page.evaluate(() =>
        document.querySelectorAll('#locality-map .leaflet-marker-icon').length);

      if (markers !== 1) {
        fail('locality map', `${markers} markers for the one article in Baeza`);
      } else {
        // force: the marker sits under the fixed header once Playwright
        // scrolls it into view, and the click is about the popup, not about
        // whether the header is in the way.
        await page.locator('#locality-map .leaflet-marker-icon').click({ force: true });
        await page.waitForTimeout(300);
        const popup = await page.evaluate(() => {
          const link = document.querySelector('.leaflet-popup-content a');
          return link && {
            href: link.getAttribute('href'),
            title: link.querySelector('h2')?.textContent,
            image: !!link.querySelector('img')
          };
        });

        if (!popup) fail('locality map', 'the marker opens no popup');
        else if (!/^\/es\/articles\/./.test(popup.href) || !popup.title || !popup.image) {
          fail('locality map', `the popup is incomplete: ${JSON.stringify(popup)}`);
        }
      }
    }

    // The explorer plots every geolocated article from the same-origin index
    // and narrows them in the browser. The status line counts what is on the
    // map, so a filter has to bring that number down and clearing it put it
    // back, whatever happens to the outline behind.
    if (spec.name === 'explorer' && width === WIDE) {
      const count = () => page.evaluate(() =>
        Number(document.getElementById('explorer-status').textContent.match(/\d+/)?.[0] ?? NaN));
      const all = await count();
      const plotted = await page.evaluate(() =>
        document.querySelectorAll('#explorer-map .leaflet-marker-icon').length);

      if (!(all > 100)) fail('explorer', `the status reports ${all} places with no filter`);
      else if (!plotted) fail('explorer', 'nothing is plotted on the map');
      else {
        await page.selectOption('#explorer-category', 'naturaleza');
        await page.waitForTimeout(500);
        const filtered = await count();
        const query = new URL(page.url()).search;
        await page.selectOption('#explorer-category', '');
        await page.waitForTimeout(500);
        const cleared = await count();

        if (!(filtered > 0 && filtered < all)) fail('explorer', `a category leaves ${filtered} of ${all} places`);
        if (query !== '?category=naturaleza') fail('explorer', `the filter is not in the address: "${query}"`);
        if (cleared !== all) fail('explorer', `clearing the filter leaves ${cleared} of ${all} places`);
      }
    }

    await context.close();
  }
  process.stdout.write(`  ${spec.name}\n`);
}

await browser.close();
server.kill();

if (notes.length) {
  console.log('');
  for (const note of notes) console.log(`  note: ${note}`);
}

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const line of failures) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`\nAll ${pages.length} pages pass at ${WIDE}, ${NARROW} and ${MOBILE}px.`);
