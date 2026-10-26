(function () {
  // The related articles at the end of a place article. The page carries
  // the whole pool, closest first, with the first four showing; this
  // draws four from it each day instead, as the home carousel does with
  // the archive. The seed mixes the day with the article's id, so two
  // articles do not draw alike and a reader sees the same four all day.
  const section = document.getElementById('related-articles');
  if (!section) return;

  const cards = Array.from(section.querySelectorAll('.article-card'));
  const count = 4;
  if (cards.length <= count) return;

  function seeded(seed) {
    // mulberry32, the same as the carousel's.
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const day = Math.floor(Date.now() / 86400000);
  const random = seeded(day * 1000 + Number(section.dataset.seed));
  const order = cards.map((_, index) => index);

  // Partial Fisher-Yates: only the first `count` positions are settled.
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (order.length - i));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const today = new Set(order.slice(0, count));
  cards.forEach((card, index) => { card.hidden = !today.has(index); });
})();
