(function () {
  // On a Tradition article the header has no band while it is over the
  // opening photo and the black intro that follows it, as the place
  // articles' header has none over theirs. Once the white page reaches it,
  // white names on white would vanish, so it gets its band back. The CSS
  // only acts on this from the deck's width up.
  const header = document.getElementById('header');
  const intro = document.querySelector('.article-tradition__intro');
  if (!header || !intro) return;

  let frame;

  const update = () => {
    frame = null;
    header.classList.toggle('header--solid', intro.getBoundingClientRect().bottom <= header.offsetHeight);
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
})();
