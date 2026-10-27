(function () {
  // Navigation for the article slide deck.
  //
  // The scrolling itself is the browser's: the container is a scroll-snap
  // list, so a trackpad pushes the photos directly, with the system's own
  // momentum and snapping. Earlier versions intercepted the wheel and tried
  // to infer the user's intent from the deltas, which never felt right.
  //
  // What is left is what the browser does not give for free: arrow keys that
  // move exactly one slide, and the navigation dots.
  const container = document.querySelector('.slides--container');
  const nav = document.getElementById('slides-nav');
  if (!container) return;

  const wide = window.matchMedia('(min-width: 1280px)');
  const slides = [...container.querySelectorAll('.slides--slide')];
  const header = document.getElementById('header');

  let hideTimer;
  let settleTimer;

  // Where the keys are heading. Reading the scroll position instead would
  // sample a smooth scroll mid-flight, so holding an arrow down lost presses.
  // It resyncs once scrolling has stopped, which is what happens when the
  // reader scrolls by hand.
  let target = 0;

  const currentIndex = () =>
    Math.round(container.scrollTop / container.clientHeight);

  const goTo = (index) => {
    target = Math.min(slides.length - 1, Math.max(0, index));
    container.scrollTo({ top: target * container.clientHeight, behavior: 'smooth' });
  };

  const updateDots = () => {
    const active = currentIndex();
    nav?.querySelectorAll('.slides-nav-dot')
      .forEach((dot, index) => dot.classList.toggle('active', index === active));
  };

  const revealDots = () => {
    if (!nav) return;
    clearTimeout(hideTimer);

    // The closing slide is a reading page over white and then over the
    // footer, where white dots are either invisible or in the way, and there
    // is nothing further down to jump to. Scrolling back up still works.
    if (currentIndex() === slides.length - 1) {
      nav.classList.remove('visible');
      return;
    }

    nav.classList.add('visible');

    // Always visible on the first slide, auto-hide anywhere else.
    if (currentIndex() !== 0) {
      hideTimer = setTimeout(() => nav.classList.remove('visible'), 2000);
    }
  };

  // The header stays over the intro and fades from the first photo on; the
  // CSS brings it back while it is pointed at.
  const updateHeader = () => {
    header?.classList.toggle('header--faded', currentIndex() > 0);
  };

  const onScroll = () => {
    updateDots();
    revealDots();
    updateHeader();

    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { target = currentIndex(); }, 120);
  };

  const onKeyDown = (event) => {
    const step = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[event.key];

    if (step) {
      event.preventDefault();
      goTo(target + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(slides.length - 1);
    }
  };

  const onMouseMove = (event) => {
    if (window.innerWidth - event.clientX < 150) revealDots();
  };

  const activate = () => {
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slides-nav-dot';
      dot.setAttribute('aria-label', `${index + 1} / ${slides.length}`);
      dot.addEventListener('click', () => goTo(index));
      nav?.appendChild(dot);
    });

    container.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousemove', onMouseMove);
    nav?.addEventListener('mouseenter', revealDots);

    target = currentIndex();
    updateDots();
    revealDots();
    updateHeader();
  };

  const deactivate = () => {
    clearTimeout(hideTimer);
    clearTimeout(settleTimer);
    container.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousemove', onMouseMove);
    nav?.removeEventListener('mouseenter', revealDots);
    nav?.classList.remove('visible');
    nav?.replaceChildren();
    header?.classList.remove('header--faded');
  };

  // Attached and detached as the viewport crosses the breakpoint: reading the
  // width once on load left stale handlers behind after a resize.
  const apply = () => {
    deactivate();
    if (wide.matches) activate();
  };

  apply();
  wide.addEventListener('change', apply);
})();
