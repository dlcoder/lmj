(function () {
  // Slide deck on the article page: wheel, keyboard and navigation dots.
  //
  // One target position is the single source of truth. Input retargets it
  // immediately instead of being dropped while a scroll is still animating,
  // so holding or hammering the arrow keys advances slide by slide rather
  // than swallowing every press after the first.
  //
  // The whole behaviour is attached and detached as the viewport crosses the
  // wide breakpoint, because reading the width once on load left the wheel
  // handler hijacking the page after a resize until it was reloaded.
  const container = document.querySelector('.slides--container');
  const nav = document.getElementById('slides-nav');
  if (!container) return;

  const wide = window.matchMedia('(min-width: 1280px)');
  const intro = document.querySelector('.article-gallery--intro');
  const slides = container.querySelectorAll('.slides--slide');

  // Positions: 0 = first slide with the intro over it, 1 = first slide without
  // it, and 2..n = each following slide. The first two slides share a grid row,
  // so there is one row less than there are slides.
  const LAST_POSITION = Math.max(1, slides.length - 1);
  const SETTLE_MS = 450;

  // A trackpad flick keeps firing wheel events through its momentum, for well
  // over a second, so one flick must not advance several slides. But waiting
  // for the events to stop blocks fast swiping, because the momentum of one
  // flick overlaps the start of the next.
  //
  // Momentum only ever decays, so the deck watches the smallest delta seen
  // since the last move: a delta rising well above that floor is a fresh
  // push and unlocks the next one. Comparing against the previous delta
  // instead would miss it, because a new push ramps up gradually.
  //
  // A mouse wheel gives steady deltas that never rise, so input that is still
  // strong well after the animation ended also unlocks. Momentum has decayed
  // to a trickle by then, which is what keeps one flick to one slide.
  const GESTURE_IDLE_MS = 140;
  const WHEEL_THRESHOLD = 24;
  const RENEWED_PUSH = 2;
  const SUSTAINED_MS = 700;

  let target = 0;
  let animating = false;
  let settleTimer;
  let wheelLocked = false;
  let gestureTimer;
  let wheelDelta = 0;
  let minMagnitudeSinceStep = Infinity;
  let lastStepAt = 0;
  let hideTimer;
  let introObserver;

  const slideOf = position => Math.max(0, position - 1);

  const goTo = (position) => {
    target = Math.min(LAST_POSITION, Math.max(0, position));

    if (intro) intro.style.opacity = target === 0 ? '1' : '0';
    container.scrollTo({ top: slideOf(target) * window.innerHeight, behavior: 'smooth' });

    animating = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { animating = false; }, SETTLE_MS);

    updateDots();
    revealDots();
  };

  const step = delta => goTo(target + delta);

  // Only trust the scroll position when nothing of ours is in flight;
  // mid-animation it reports a value between two slides.
  const syncFromScroll = () => {
    if (animating) return;
    const slide = Math.round(container.scrollTop / window.innerHeight);
    target = slide === 0 ? (intro && intro.style.opacity === '0' ? 1 : 0) : slide + 1;
    updateDots();
  };

  const updateDots = () => {
    if (!nav) return;
    nav.querySelectorAll('.slides-nav-dot')
      .forEach((dot, index) => dot.classList.toggle('active', index === target));
  };

  const revealDots = () => {
    if (!nav) return;
    nav.classList.add('visible');
    clearTimeout(hideTimer);

    // Always visible on the first slide, auto-hide anywhere else.
    if (target !== 0) {
      hideTimer = setTimeout(() => nav.classList.remove('visible'), 2000);
    }
  };

  const endGesture = () => {
    wheelLocked = false;
    wheelDelta = 0;
    minMagnitudeSinceStep = Infinity;
  };

  const onWheel = (event) => {
    event.preventDefault();

    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(endGesture, GESTURE_IDLE_MS);

    const magnitude = Math.abs(event.deltaY);

    if (wheelLocked) {
      const pushedAgain = magnitude >= WHEEL_THRESHOLD
        && magnitude > minMagnitudeSinceStep * RENEWED_PUSH + WHEEL_THRESHOLD / 2;
      const stillScrolling = magnitude >= WHEEL_THRESHOLD
        && Date.now() - lastStepAt > SUSTAINED_MS;

      minMagnitudeSinceStep = Math.min(minMagnitudeSinceStep, magnitude);
      if (!pushedAgain && !stillScrolling) return;

      wheelLocked = false;
      wheelDelta = 0;
    }

    wheelDelta += event.deltaY;
    if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) return;

    wheelLocked = true;
    minMagnitudeSinceStep = Infinity;
    lastStepAt = Date.now();
    step(wheelDelta > 0 ? 1 : -1);
    wheelDelta = 0;
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(LAST_POSITION);
    }
  };

  const onScroll = () => {
    syncFromScroll();
    revealDots();
  };

  const onMouseMove = (event) => {
    if (window.innerWidth - event.clientX < 150) revealDots();
  };

  const activate = () => {
    if (nav) {
      for (let i = 0; i <= LAST_POSITION; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slides-nav-dot';
        dot.setAttribute('aria-label', `${i + 1} / ${LAST_POSITION + 1}`);
        dot.addEventListener('click', () => goTo(i));
        nav.appendChild(dot);
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKeyDown);
    container.addEventListener('scroll', onScroll);
    document.addEventListener('mousemove', onMouseMove);
    if (nav) nav.addEventListener('mouseenter', revealDots);

    if (intro) {
      introObserver = new MutationObserver(updateDots);
      introObserver.observe(intro, { attributes: true, attributeFilter: ['style'] });
    }

    animating = false;
    syncFromScroll();
    revealDots();
  };

  const deactivate = () => {
    clearTimeout(settleTimer);
    clearTimeout(hideTimer);
    clearTimeout(gestureTimer);
    animating = false;
    endGesture();

    container.removeEventListener('wheel', onWheel, { passive: false });
    document.removeEventListener('keydown', onKeyDown);
    container.removeEventListener('scroll', onScroll);
    document.removeEventListener('mousemove', onMouseMove);
    if (nav) {
      nav.removeEventListener('mouseenter', revealDots);
      nav.classList.remove('visible');
      nav.replaceChildren();
    }
    introObserver?.disconnect();
    introObserver = null;

    // The narrow layout scrolls normally, so leave nothing behind.
    if (intro) intro.style.opacity = '';
  };

  const apply = () => {
    deactivate();
    if (wide.matches) activate();
  };

  apply();
  wide.addEventListener('change', apply);
})();
