(function () {
  const STATIC_HOST = 'https://lmjstatic.deliriumcoder.com';
  const JAEN_CENTER = [37.9556459, -3.361515];
  const JAEN_ZOOM = 9;

  let map = null;
  let currentLayer = null;
  let geoJsonCache = {};

  function initMap() {
    const mapContainer = document.getElementById('localities-map');
    if (!mapContainer) return;

    map = L.map('localities-map', {
      center: JAEN_CENTER,
      zoom: JAEN_ZOOM,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    });

    // OpenStreetMap's own tiles: no API key, unlike the Carto basemap that
    // used to be here and now answers with a placeholder tile.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // Load and render province boundary
    loadProvinceBoundary();

    setupHoverListeners();
  }

  async function loadProvinceBoundary() {
    try {
      const response = await fetch(`${STATIC_HOST}/files/geojson/province.json`);
      if (!response.ok) return;

      const geoJson = await response.json();
      L.geoJSON(geoJson, {
        style: {
          stroke: false,
          fillColor: '#423780',
          fillOpacity: 0.18
        }
      }).addTo(map);
    } catch (error) {
      console.error('Error loading province boundary:', error);
    }
  }

  function setupHoverListeners() {
    const localityLinks = document.querySelectorAll('.locality-link[data-locality-id]');

    localityLinks.forEach(link => {
      link.addEventListener('mouseenter', handleMouseEnter);
      link.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  async function handleMouseEnter(event) {
    const localityId = event.target.dataset.localityId;
    if (!localityId) return;

    try {
      const geoJson = await fetchGeoJson(localityId);
      if (geoJson) {
        showLocality(geoJson);
      }
    } catch (error) {
      console.error('Error loading locality GeoJSON:', error);
    }
  }

  function handleMouseLeave() {
    clearLocality();
  }

  async function fetchGeoJson(localityId) {
    if (geoJsonCache[localityId]) {
      return geoJsonCache[localityId];
    }

    const url = `${STATIC_HOST}/files/geojson/locality_${localityId}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON for locality ${localityId}`);
    }

    const data = await response.json();
    geoJsonCache[localityId] = data;
    return data;
  }

  function showLocality(geoJson) {
    clearLocality();

    // An outline as well as a fill: over a detailed basemap a change in fill
    // alone is hard to pick out. The original set an empty colour, which the
    // renderer ignored, so there was never a stroke.
    currentLayer = L.geoJSON(geoJson, {
      style: {
        color: '#2b2357',
        weight: 2,
        opacity: 1,
        fillColor: '#423780',
        fillOpacity: 0.75
      }
    }).addTo(map);
  }

  function clearLocality() {
    if (currentLayer) {
      map.removeLayer(currentLayer);
      currentLayer = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
