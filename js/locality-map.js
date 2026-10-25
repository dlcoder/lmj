(function () {
  // The map at the top of a locality page, as the Rails app had it: the
  // outline of the municipality, and a marker per article in it.
  //
  // Both layers come from the network. The outline is a GeoJSON file on the
  // assets host, so CORS applies to it — the bucket answers with an allowlist
  // of origins, which has to include wherever the site is being served from.
  // The markers come from /{locale}/articles.json, the one index this site
  // generates for every map, which is same-origin.
  const container = document.getElementById('locality-map');
  if (!container || typeof L === 'undefined') return;

  const STATICS_HOST = document.querySelector('meta[name="statics-host"]')?.content
    ?? 'https://lmjstatic.deliriumcoder.com';
  const GEOJSON = `${STATICS_HOST}/files/geojson`;
  const JAEN_CENTER = [37.9556459, -3.361515];
  const JAEN_ZOOM = 12;

  const localityId = Number(container.dataset.localityId);
  const locale = container.dataset.locale;

  const map = L.map(container, {
    center: JAEN_CENTER,
    zoom: JAEN_ZOOM,
    scrollWheelZoom: false
  });

  // OpenStreetMap's own tiles: no API key, unlike the Carto basemap the
  // original used, which now answers with a placeholder tile.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Same style the original used for the outlines.
  const OUTLINE = { weight: 0, color: '#423780', fillOpacity: 0.2 };

  // The popup of the original: the teaser photo over the title, the whole
  // thing a link to the article.
  function popup(properties, base) {
    const link = document.createElement('a');
    link.href = properties.path;

    if (properties.image) {
      const image = document.createElement('img');
      image.src = `${base}/${properties.image.dir}/teaser_tablet/${properties.image.file}`;
      image.alt = '';
      link.append(image);
    }

    const title = document.createElement('h2');
    title.textContent = properties.title;
    link.append(title);

    return link;
  }

  async function load() {
    const [shape, index] = await Promise.all([
      fetch(`${GEOJSON}/locality_${localityId}.json`)
        .then(response => response.ok ? response.json() : null)
        .catch(() => null),
      fetch(`/${locale}/articles.json`)
        .then(response => response.ok ? response.json() : null)
        .catch(() => null)
    ]);

    const base = index ? index.host + index.imageBase : '';

    // The outline is a shape, the articles are points, and only the points
    // cluster — 43 of them land on Jaén, most of them inside the old town,
    // which is why the original grouped them too.
    const outline = L.geoJSON(null, { style: () => OUTLINE }).addTo(map);
    const markers = L.geoJSON(null, {
      onEachFeature: (feature, marker) =>
        marker.bindPopup(popup(feature.properties, base), {
          minWidth: 320,
          keepInView: true
        })
    });

    if (shape) outline.addData(shape);

    if (index) {
      markers.addData(index.features.filter(
        feature => feature.properties.localities.includes(localityId)
      ));
      map.addLayer(L.markerClusterGroup({ showCoverageOnHover: false }).addLayer(markers));
    }

    // Frame whatever arrived. With neither outline nor markers the default
    // view of the province is still a sensible thing to be looking at.
    const bounds = L.latLngBounds([]);
    for (const layer of [outline, markers]) {
      if (layer.getLayers().length) bounds.extend(layer.getBounds());
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  }

  load();
})();
