(function () {
  // The explorer map: every geolocated article, narrowed by municipality and
  // by category, as the original's /es/municipios/mapa did.
  //
  // The outline behind the markers — the province, or the municipality
  // picked — comes from the assets host; if it does not arrive the markers
  // still do.
  //
  // The filters live in the query string too, so a filtered map can be
  // linked to and survives a reload.
  const container = document.getElementById('explorer-map');
  const form = document.getElementById('explorer-filters');
  if (!container || !form || !window.lmjMap) return;

  const { COLOR, create, outline: fetchOutline, articles, markers: toMarkers, frame } = window.lmjMap;
  const locale = container.dataset.locale;
  const localitySelect = form.elements.locality;
  const categorySelect = form.elements.category;
  const status = document.getElementById('explorer-status');

  const map = create(container, { zoom: 9, zoomSnap: 0.25 });

  const outline = L.geoJSON(null, {
    style: () => ({ weight: 0, color: COLOR, fillOpacity: 0.2 })
  }).addTo(map);
  const clusters = L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map);
  const shapes = {};

  function shape(name) {
    shapes[name] ??= fetchOutline(name);
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

    const features = index.features.filter(({ properties }) =>
      (!localityId || properties.localities.includes(localityId)) &&
      (!category || properties.categories.includes(category)));

    const markers = toMarkers(features, index);

    clusters.clearLayers();
    clusters.addLayer(markers);
    announce(features.length);

    const area = await shape(localityId ? `locality_${localityId}` : 'province');
    if (run !== generation) return;

    outline.clearLayers();
    if (area) outline.addData(area);

    // Frame the outline and the markers together, as the original did.
    frame(map, [outline, markers], { maxZoom: 15 });
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
    const index = await articles(locale);
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
