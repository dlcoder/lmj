(function () {
  // The map behind the list of municipalities, on the home page and the
  // localities index: the province, and the outline of whichever
  // municipality the pointer is over.
  const container = document.getElementById('localities-map');
  if (!container || !window.lmjMap) return;

  const { COLOR, create, outline } = window.lmjMap;

  const map = create(container, {
    zoom: 9,
    // Whole zoom levels are a factor of two apart, which left the province
    // either cut off or lost in the middle once the map frames it.
    zoomSnap: 0.25,
    zoomControl: false,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false
  });

  const shapes = {};
  let current = null;
  // The municipality under the pointer, so an outline that arrives after
  // the pointer has moved on is not drawn.
  let hovered = null;

  async function showProvince() {
    const shape = await outline('province');
    if (!shape) return;

    const province = L.geoJSON(shape, {
      style: { color: '', opacity: 1, fillColor: COLOR, fillOpacity: 0.3 }
    }).addTo(map);

    // Behind the home list the fixed view is part of the design; on the
    // localities index the map frames the whole province. The list there
    // runs far taller than a screen on a phone, so the province is framed
    // in the first screenful of the map rather than in its middle.
    if ('fitProvince' in container.dataset) {
      const below = Math.max(0, container.clientHeight - window.innerHeight);
      map.fitBounds(province.getBounds(), {
        paddingTopLeft: [20, 20],
        paddingBottomRight: [20, 20 + below]
      });
    }
  }

  function clear() {
    if (current) map.removeLayer(current);
    current = null;
  }

  async function show(localityId) {
    hovered = localityId;
    shapes[localityId] ??= outline(`locality_${localityId}`);
    const shape = await shapes[localityId];
    if (hovered !== localityId) return;
    clear();
    if (!shape) return;

    current = L.geoJSON(shape, {
      style: { color: '', weight: 2, opacity: 1, fillColor: COLOR, fillOpacity: 0.5 }
    }).addTo(map);
  }

  for (const link of document.querySelectorAll('.locality-link[data-locality-id]')) {
    link.addEventListener('mouseenter', () => show(link.dataset.localityId));
    link.addEventListener('mouseleave', () => {
      hovered = null;
      clear();
    });
  }

  showProvince();
})();
