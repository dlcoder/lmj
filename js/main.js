(function () {
  // Scroll effects
  const header = document.getElementById('header');
  const fadeEffectThreshold = 60;
  const headerBackThreshold = 10;
  let lastScrollY = window.scrollY;

  const handleScroll = (currentScrollY) => {
    if (currentScrollY <= fadeEffectThreshold) {
      header.classList.remove('header--faded');
    } else if (currentScrollY > lastScrollY) {
      header.classList.add('header--faded');
    } else if (lastScrollY - currentScrollY >= headerBackThreshold) {
      header.classList.remove('header--faded');
    }
    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', () => handleScroll(window.scrollY));

  // Hamburger Menu
  const hamburger = document.getElementById('hamburger-menu');
  const nav = document.getElementById('header-nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('is-active');
      nav.classList.toggle('is-open');
    });

    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-active');
        nav.classList.remove('is-open');
      });
    });
  }

  // Slides Snappy Scroll
  const slidesContainer = document.querySelector('.slides--container');
  if (slidesContainer) {
    // Header fade on scroll for article pages
    slidesContainer.addEventListener('scroll', () => {
      if (window.innerWidth >= 1280) {
        handleScroll(slidesContainer.scrollTop);
      }
    });

    // Slide Navigation Dots
    const navContainer = document.getElementById('slides-nav');
    if (navContainer && window.innerWidth >= 1280) {
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

    let isScrolling = false;
    let currentSlide = 0;

    slidesContainer.addEventListener('wheel', e => {
      if (window.innerWidth < 1280) return;

      e.preventDefault();
      if (isScrolling) return;
      isScrolling = true;

      const intro = document.querySelector('.article-gallery--intro');
      const isOnFirstSlide = slidesContainer.scrollTop < window.innerHeight * 0.5;

      // If on first slide and scrolling down, just fade intro instead of changing slides
      if (isOnFirstSlide && e.deltaY > 0 && intro && intro.style.opacity !== '0') {
        intro.style.opacity = '0';
        isScrolling = false;
        return;
      }

      // If intro is hidden and scrolling up on first slide, show intro instead of changing slides
      if (isOnFirstSlide && e.deltaY < 0 && intro && intro.style.opacity === '0') {
        intro.style.opacity = '1';
        isScrolling = false;
        return;
      }

      // Normal slide navigation
      if (e.deltaY > 0) {
        slidesContainer.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      } else {
        slidesContainer.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
      }

      setTimeout(() => { isScrolling = false; }, 500);
    }, { passive: false });
  }
})();
