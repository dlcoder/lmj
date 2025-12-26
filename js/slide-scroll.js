(function () {
  // Slide scrolling - intro toggle on first slide
  const slidesContainer = document.querySelector('.slides--container');

  if (slidesContainer && window.innerWidth >= 1280) {
    const intro = document.querySelector('.article-gallery--intro');

    // Track current virtual position (0 = intro visible, 1 = intro hidden, 2+ = other slides)
    let currentPosition = 0;
    let isTransitioning = false;

    // Helper: Get intro visibility state
    const isIntroVisible = () => intro && intro.style.opacity !== '0';

    // Helper: Navigate to a position
    const navigateToPosition = (newPosition) => {
      if (isTransitioning) return;
      isTransitioning = true;

      if (newPosition === 0) {
        // Position 0: Show intro on first slide
        slidesContainer.scrollTo({ top: 0, behavior: 'smooth' });
        if (intro) intro.style.opacity = '1';
        currentPosition = 0;
      } else if (newPosition === 1) {
        // Position 1: Hide intro on first slide
        slidesContainer.scrollTo({ top: 0, behavior: 'smooth' });
        if (intro) intro.style.opacity = '0';
        currentPosition = 1;
      } else if (newPosition >= 2) {
        // Position 2+: Navigate to actual slides
        const slideIndex = newPosition - 1;
        slidesContainer.scrollTo({
          top: slideIndex * window.innerHeight,
          behavior: 'smooth'
        });
        currentPosition = newPosition;
      }

      setTimeout(() => { isTransitioning = false; }, 600);
    };

    // Sync position based on scroll position
    const syncPosition = () => {
      const scrollTop = slidesContainer.scrollTop;
      const slideHeight = window.innerHeight;
      const currentSlideIndex = Math.round(scrollTop / slideHeight);

      if (currentSlideIndex === 0) {
        currentPosition = isIntroVisible() ? 0 : 1;
      } else {
        currentPosition = currentSlideIndex + 1;
      }
    };

    // Handle wheel/trackpad events
    slidesContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      syncPosition();

      const direction = e.deltaY > 0 ? 1 : -1;
      const newPosition = Math.max(0, currentPosition + direction);

      navigateToPosition(newPosition);
    }, { passive: false });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (window.innerWidth < 1280) return;

      syncPosition();

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        navigateToPosition(currentPosition + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        navigateToPosition(Math.max(0, currentPosition - 1));
      }
    });

    // Sync on scroll (handles direct scrollbar interaction)
    slidesContainer.addEventListener('scroll', syncPosition);

    // Initialize
    syncPosition();
  }
})();
