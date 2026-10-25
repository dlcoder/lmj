(function () {
  // The search field on the home page. Its results take the place of the
  // category tiles while there is a query, as cards like every other list of
  // articles on the site.
  //
  // The index holds the full text of every article (~70 KB gzipped), so it is
  // only fetched the first time the field is used. Matching folds case and
  // accents on both sides — "jaen" finds "Jaén" — and every word of the query
  // has to appear somewhere in the article. Titles weigh most, then places
  // and categories, then the text; ties keep the newest first, which is the
  // order the index comes in.
  //
  // The query is kept in the address, so coming back from a result finds
  // the same results.
  const form = document.getElementById('home-search');
  const input = document.getElementById('home-search-input');
  const status = document.getElementById('home-search-status');
  const results = document.getElementById('home-search-results');
  const categories = document.getElementById('home-categories');
  if (!form || !input || !results || !categories) return;

  const locale = form.dataset.locale;
  const fold = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  let index = null;
  let loading = null;

  function load() {
    loading ??= fetch(`/${locale}/search.json`)
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!data) return null;
        index = {
          base: data.host + data.imageBase,
          articles: data.articles.map(article => ({
            ...article,
            title: fold(article.t),
            places: fold(`${article.l} ${article.c}`),
            text: fold(article.x)
          }))
        };
        return index;
      })
      .catch(() => null);
    return loading;
  }

  function score(article, terms) {
    let total = 0;
    for (const term of terms) {
      if (article.title.includes(term)) total += 10;
      else if (article.places.includes(term)) total += 5;
      else if (article.text.includes(term)) total += 1;
      else return 0;
    }
    return total;
  }

  // Same card as _includes/partials/article-grid.njk.
  function card(article, base) {
    const item = document.createElement('article');
    item.className = 'article-card';

    const link = document.createElement('a');
    link.className = 'article-card--link';
    link.href = `/${locale}/articles/${article.s}`;

    if (article.p) {
      const url = variant => `${base}/${article.p}/${variant}/${article.f}`;
      const image = document.createElement('img');
      image.className = 'article-card--image';
      image.src = url('teaser_desktop');
      image.srcset = `${url('teaser_tablet')} 320w, ${url('teaser_desktop')} 375w, ` +
        `${url('teaser_mobile')} 480w, ${url('teaser_desktop_hd')} 640w`;
      image.sizes = '(min-width: 1120px) 25vw, (min-width: 640px) 33vw, (min-width: 480px) 50vw, 100vw';
      image.width = 640;
      image.height = 480;
      image.alt = article.t;
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image);
    }

    const content = document.createElement('div');
    content.className = 'article-card--content';
    const title = document.createElement('h2');
    title.className = 'article-card--title';
    title.textContent = article.t;
    const place = document.createElement('div');
    place.className = 'article-card--location';
    place.textContent = article.l;
    const date = document.createElement('div');
    date.className = 'article-card--date';
    date.textContent = article.d;
    content.append(title, place, date);
    link.append(content);
    item.append(link);
    return item;
  }

  function announce(count, query) {
    const template = count === 0 ? form.dataset.none
      : count === 1 ? form.dataset.one
      : form.dataset.many;
    status.textContent = template.replace('%{count}', count).replace('%{query}', query);
  }

  function writeQuery(query) {
    const url = new URL(location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }

  async function search() {
    const query = input.value.trim();
    writeQuery(query);

    const terms = fold(query).split(/\s+/).filter(term => term.length > 1);
    if (!terms.length) {
      results.hidden = true;
      results.replaceChildren();
      categories.hidden = false;
      status.textContent = '';
      return;
    }

    const data = index ?? await load();
    // The reader may have typed on while the index was on its way.
    if (!data || input.value.trim() !== query) return;

    const found = data.articles
      .map(article => ({ article, score: score(article, terms) }))
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(match => match.article);

    results.replaceChildren(...found.map(article => card(article, data.base)));
    results.hidden = found.length === 0;
    categories.hidden = true;
    announce(found.length, query);
  }

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 150);
  });
  input.addEventListener('focus', load, { once: true });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(timer);
    search();
  });

  form.hidden = false;

  const initial = new URLSearchParams(location.search).get('q');
  if (initial) {
    input.value = initial;
    search();
  }
})();
