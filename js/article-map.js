(function () {
  // Small map on the article page, marking where the place is.
  const container = document.getElementById('article-map');
  if (!container || typeof L === 'undefined') return;

  const latitude = Number(container.dataset.latitude);
  const longitude = Number(container.dataset.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  const map = L.map(container, {
    center: [latitude, longitude],
    zoom: 12,
    scrollWheelZoom: false,
    attributionControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png').addTo(map);
  L.marker([latitude, longitude]).addTo(map);

  // The deck only lays the slide out when it is scrolled to, so the map has
  // to be told once its container has a size.
  new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      map.invalidateSize();
      observer.disconnect();
    }
  }).observe(container);
})();
