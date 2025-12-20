(function () {
  const header = document.querySelector('.header');
  let lastScrollY = window.scrollY;

  // Header Scroll
  window.addEventListener('scroll', function () {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= 60) {
      header.classList.remove('header--faded');
    } else if (currentScrollY > lastScrollY) {
      header.classList.add('header--faded');
    } else if (lastScrollY - currentScrollY >= 10) {
      header.classList.remove('header--faded');
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
