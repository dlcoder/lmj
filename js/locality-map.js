(function () {
  // The map at the top of a locality page, as the Rails app had it: the
  // outline of the municipality, and a marker per article in it. Either can
  // fail to arrive without taking the other with it.
  const container = document.getElementById('locality-map');
  if (!container || !window.lmjMap) return;

  const { COLOR, create, outline, articles, markers, frame } = window.lmjMap;
  const localityId = Number(container.dataset.localityId);
  const locale = container.dataset.locale;

  const map = create(container, { zoom: 12, scrollWheelZoom: false });

  async function load() {
    const [shape, index] = await Promise.all([
      outline(`locality_${localityId}`),
      articles(locale)
    ]);

    // The outline is a shape, the articles are points, and only the points
    // cluster — 43 of them land on Jaén, most of them inside the old town,
    // which is why the original grouped them too.
    const area = L.geoJSON(shape, {
      style: () => ({ weight: 0, color: COLOR, fillOpacity: 0.2 })
    }).addTo(map);
    const points = index
      ? markers(index.features.filter(feature => feature.properties.localities.includes(localityId)), index)
      : L.geoJSON(null);
    map.addLayer(L.markerClusterGroup({ showCoverageOnHover: false }).addLayer(points));

    // With neither outline nor markers the default view of the province is
    // still a sensible thing to be looking at.
    frame(map, [area, points]);
  }

  load();
})();
