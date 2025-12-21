(function () {
  // Scroll effects
  const header = document.getElementById('header');
  const articleIntro = document.getElementById('article-intro');
  const fadeEffectThreshold = 60;
  const headerBackThreshold = 10;
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', function () {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= fadeEffectThreshold) {
      header.classList.remove('header--faded');
    } else if (currentScrollY > lastScrollY) {
      header.classList.add('header--faded');
    } else if (lastScrollY - currentScrollY >= headerBackThreshold) {
      header.classList.remove('header--faded');
    }

    if (articleIntro && window.innerWidth >= 1280) {
      if (currentScrollY > fadeEffectThreshold) {
        articleIntro.classList.add('article-intro--hidden');
      } else {
        articleIntro.classList.remove('article-intro--hidden');
      }
    }

    lastScrollY = currentScrollY;
  });

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
})();
