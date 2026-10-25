(function () {
  // The "Discover Jaén" dropdown in the header. On a wide screen the CSS
  // already opens it on hover; this adds what hover cannot do — opening it
  // by click or keyboard, closing it with Escape or by moving elsewhere —
  // and is the only thing that opens it inside the mobile menu, where it is
  // an accordion.
  const item = document.querySelector('.header-nav--item__expands');
  const toggle = item?.querySelector('.header-nav--toggle');
  if (!item || !toggle) return;

  const setOpen = (open) => {
    item.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(!item.classList.contains('is-open')));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !item.classList.contains('is-open')) return;
    setOpen(false);
    toggle.focus();
  });

  // A click or the focus landing anywhere outside closes it.
  document.addEventListener('click', (event) => {
    if (!item.contains(event.target)) setOpen(false);
  });
  item.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !item.contains(event.relatedTarget)) setOpen(false);
  });
})();
