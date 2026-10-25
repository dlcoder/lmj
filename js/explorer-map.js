(function () {
  // The explorer map: every geolocated article, narrowed by municipality and
  // by category, as the original's /es/municipios/mapa did.
  //
  // The articles come from /{locale}/articles.json, the one index every map
  // here reads. The outline behind them — the province, or the municipality
  // picked — is a GeoJSON file on the assets host, so CORS applies to it; if
  // it does not arrive the markers still do.
  //
  // The filters live in the query string too, so a filtered map can be
  // linked to and survives a reload.
  const container = document.getElementById('explorer-map');
  const form = document.getElementById('explorer-filters');
  if (!container || !form || typeof L === 'undefined') return;

  const STATICS_HOST = document.querySelector('meta[name="statics-host"]')?.content
    ?? 'https://lmjstatic.deliriumcoder.com';
  const GEOJSON = `${STATICS_HOST}/files/geojson`;
  const JAEN_CENTER = [37.9556459, -3.361515];
  const JAEN_ZOOM = 9;

  const locale = container.dataset.locale;
  const localitySelect = form.elements.locality;
  const categorySelect = form.elements.category;
  const status = document.getElementById('explorer-status');

  const map = L.map(container, {
    center: JAEN_CENTER,
    zoom: JAEN_ZOOM,
    zoomSnap: 0.25
  });

  // OpenStreetMap's own tiles, as on the other maps.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Same style the original used for the outlines.
  const OUTLINE = { weight: 0, color: '#423780', fillOpacity: 0.2 };

  const outline = L.geoJSON(null, { style: () => OUTLINE }).addTo(map);
  const clusters = L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map);
  const shapes = {};

  // The popup of the original: the teaser photo over the title, the whole
  // thing a link to the article. Same as the locality map's.
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

  function shape(name) {
    shapes[name] ??= fetch(`${GEOJSON}/${name}.json`)
      .then(response => response.ok ? response.json() : null)
      .catch(() => null);
    return shapes[name];
  }

  function announce(count) {
    const template = count === 0 ? status.dataset.none
      : count === 1 ? status.dataset.one
      : status.dataset.many;
    status.textContent = template.replace('%{count}', count);
  }

  // Each change bumps this, so an outline that arrives after the reader has
  // already moved on to another municipality is dropped, not drawn.
  let generation = 0;

  async function render(index) {
    const run = ++generation;
    const localityId = Number(localitySelect.value) || null;
    const category = categorySelect.value || null;
    const base = index.host + index.imageBase;

    const features = index.features.filter(({ properties }) =>
      (!localityId || properties.localities.includes(localityId)) &&
      (!category || properties.categories.includes(category)));

    const markers = L.geoJSON(features, {
      onEachFeature: (feature, marker) =>
        marker.bindPopup(popup(feature.properties, base), {
          minWidth: 320,
          keepInView: true
        })
    });

    clusters.clearLayers();
    clusters.addLayer(markers);
    announce(features.length);

    const area = await shape(localityId ? `locality_${localityId}` : 'province');
    if (run !== generation) return;

    outline.clearLayers();
    if (area) outline.addData(area);

    // Frame the outline and the markers together, as the original did.
    const bounds = L.latLngBounds([]);
    for (const layer of [outline, markers]) {
      if (layer.getLayers().length) bounds.extend(layer.getBounds());
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
  }

  function readQuery() {
    const params = new URLSearchParams(location.search);
    for (const select of [localitySelect, categorySelect]) {
      const value = params.get(select.name) ?? '';
      if ([...select.options].some(option => option.value === value)) select.value = value;
    }
  }

  function writeQuery() {
    const params = new URLSearchParams();
    for (const select of [localitySelect, categorySelect]) {
      if (select.value) params.set(select.name, select.value);
    }
    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
  }

  async function load() {
    const index = await fetch(`/${locale}/articles.json`)
      .then(response => response.ok ? response.json() : null)
      .catch(() => null);
    if (!index) return;

    readQuery();
    form.addEventListener('change', () => {
      writeQuery();
      render(index);
    });
    form.addEventListener('submit', event => event.preventDefault());
    render(index);
  }

  load();
})();
