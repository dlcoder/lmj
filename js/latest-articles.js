(function () {
  // Carousel for the home page. Without this script the slides stack and all
  // of them stay reachable, so the markup is only turned into a carousel once
  // we know JavaScript is running.
  const carousel = document.getElementById('latest-articles');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.latest-article'));
  if (slides.length < 2) return;

  const prev = document.getElementById('latest-articles-prev');
  const next = document.getElementById('latest-articles-next');

  // --- Today's picks ------------------------------------------------------
  // The archive has not grown since 2018, so showing "the newest" would mean
  // the same five articles for ever. The pick is seeded by the date instead:
  // it changes daily, but stays put while you are reading, and two people
  // looking on the same day see the same home page.

  function seeded(seed) {
    // mulberry32: small, and good enough to shuffle 164 items.
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickForToday(articles, count) {
    const day = Math.floor(Date.now() / 86400000);
    const random = seeded(day);
    const pool = articles.slice();

    // Partial Fisher-Yates: only the first `count` positions are settled.
    for (let i = 0; i < count && i < pool.length; i++) {
      const j = i + Math.floor(random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  function imageUrl(base, article, variant) {
    return `${base}/${article.p}/${variant}/${article.f}`;
  }

  function paint(slide, article, base, locale) {
    slide.href = `/${locale}/articles/${article.s}`;

    const image = slide.querySelector('.latest-article--image');
    image.alt = article.t;

    const srcset = [
      `${imageUrl(base, article, 'big_teaser_mobile')} 480w`,
      `${imageUrl(base, article, 'big_teaser_tablet')} 640w`,
      `${imageUrl(base, article, 'big_teaser_desktop')} 1120w`,
      `${imageUrl(base, article, 'big_teaser_desktop_hd')} 1920w`
    ].join(', ');
    const src = imageUrl(base, article, 'big_teaser_desktop');

    // The first slide carries a real src from the server and is already on
    // its way; the rest wait in data attributes until they are shown. The
    // blurred backdrop asks for the same file, so it costs nothing.
    for (const element of [image, slide.querySelector('.latest-article--backdrop')]) {
      if (!element) continue;
      if (element.src) {
        element.srcset = srcset;
        element.src = src;
      } else {
        element.dataset.srcset = srcset;
        element.dataset.src = src;
      }
    }

    slide.querySelector('.latest-article--title').textContent = article.t;
    slide.querySelector('.latest-article--location').textContent = article.l;
    slide.querySelector('.latest-article--date').textContent = article.d;
  }

  const index = document.getElementById('latest-articles-index');
  if (index) {
    try {
      const { host, imageBase, articles } = JSON.parse(index.textContent);
      // The path is the reliable source: <html lang> is still hardcoded.
      const locale = location.pathname.split('/')[1] || 'es';
      // Repainting the slides the server rendered, rather than building new
      // ones, keeps the no-JavaScript markup as the fallback.
      pickForToday(articles, slides.length)
        .forEach((article, i) => paint(slides[i], article, host + imageBase, locale));
    } catch (error) {
      // A broken index is no reason to lose the carousel: the slides the
      // server rendered are already there and perfectly good.
      console.error('Could not read the article index:', error);
    }
  }

  // --- Carousel -----------------------------------------------------------

  let current = 0;

  // A slide's photo is only worth its bytes once the slide is on screen.
  function load(slide) {
    for (const image of slide.querySelectorAll('[data-src]')) {
      image.srcset = image.dataset.srcset;
      image.src = image.dataset.src;
      delete image.dataset.srcset;
      delete image.dataset.src;
    }
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const isCurrent = i === current;
      if (isCurrent) load(slide);
      slide.classList.toggle('is-current', isCurrent);
      // Keyboard and screen readers should only reach the visible slide.
      slide.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
      slide.tabIndex = isCurrent ? 0 : -1;
    });
  }

  carousel.classList.add('is-carousel');
  show(0);

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));

  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });
})();
