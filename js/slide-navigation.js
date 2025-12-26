(function () {
  // Slide navigation dots
  const slidesContainer = document.querySelector('.slides--container');
  const navContainer = document.getElementById('slides-nav');

  if (slidesContainer && navContainer && window.innerWidth >= 1280) {
    const slides = slidesContainer.querySelectorAll('.slides--slide');
    const intro = document.querySelector('.article-gallery--intro');
    const totalDots = slides.length;

    // Helper: Navigate to a specific dot
    const navigateToDot = (dotIndex) => {
      if (dotIndex === 0) {
        // Dot 0: Show intro overlay
        slidesContainer.scrollTo({ top: 0, behavior: 'smooth' });
        if (intro) intro.style.opacity = '1';
      } else if (dotIndex === 1) {
        // Dot 1: Hide intro overlay, stay on first slide
        slidesContainer.scrollTo({ top: 0, behavior: 'smooth' });
        if (intro) intro.style.opacity = '0';
      } else {
        // Dots 2+: Navigate to slides
        slidesContainer.scrollTo({
          top: (dotIndex - 1) * window.innerHeight,
          behavior: 'smooth'
        });
      }
    };

    // Helper: Get active dot index
    const getActiveDotIndex = () => {
      const currentSlide = Math.round(slidesContainer.scrollTop / window.innerHeight);
      const introVisible = intro && intro.style.opacity !== '0';

      if (currentSlide === 0) {
        return introVisible ? 0 : 1; // First slide: intro or no intro
      }
      return currentSlide + 1; // Other slides: offset by 1
    };

    // Helper: Update active dot visual state
    const updateActiveDot = () => {
      if (window.innerWidth < 1280) return;

      const activeDotIndex = getActiveDotIndex();
      const dots = navContainer.querySelectorAll('.slides-nav-dot');

      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeDotIndex);
      });
    };

    // Create dots
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'slides-nav-dot';
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => navigateToDot(i));
      navContainer.appendChild(dot);
    }

    // Listen for scroll and intro changes
    slidesContainer.addEventListener('scroll', updateActiveDot);
    if (intro) {
      new MutationObserver(updateActiveDot).observe(intro, {
        attributes: true,
        attributeFilter: ['style']
      });
    }

    // Auto-hide dots: always visible on first slide, auto-hide on others
    let hideTimeout;
    const showDots = () => {
      navContainer.classList.add('visible');
      clearTimeout(hideTimeout);

      // Only auto-hide if not on first slide
      const currentSlide = Math.round(slidesContainer.scrollTop / window.innerHeight);
      if (currentSlide !== 0) {
        hideTimeout = setTimeout(() => {
          navContainer.classList.remove('visible');
        }, 2000);
      }
    };

    // Update visibility based on scroll position
    const updateDotsVisibility = () => {
      const currentSlide = Math.round(slidesContainer.scrollTop / window.innerHeight);
      if (currentSlide === 0) {
        // On first slide: always visible
        navContainer.classList.add('visible');
        clearTimeout(hideTimeout);
      } else {
        // Left first slide: trigger auto-hide
        showDots();
      }
    };

    document.addEventListener('mousemove', (e) => {
      const distanceFromRight = window.innerWidth - e.clientX;
      if (distanceFromRight < 150) {
        showDots();
      }
    });

    navContainer.addEventListener('mouseenter', showDots);
    slidesContainer.addEventListener('scroll', updateDotsVisibility);

    // Show dots initially (on first slide)
    updateDotsVisibility();
  }
})();
