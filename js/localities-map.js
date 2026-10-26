(function () {
  // The outlines come from the assets host and are read with fetch(), so the
  // browser applies CORS to them. The bucket answers with an allowlist of
  // origins, which has to include wherever the site is being served from —
  // including localhost while developing.
  const STATICS_HOST = document.querySelector('meta[name="statics-host"]')?.content
    ?? 'https://lmjstatic.deliriumcoder.com';
  const GEOJSON = `${STATICS_HOST}/files/geojson`;
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
      const response = await fetch(`${GEOJSON}/province.json`);
      if (!response.ok) return;

      const geoJson = await response.json();
      const province = L.geoJSON(geoJson, {
        style: {
          color: '',
          opacity: 1,
          fillColor: '#423780',
          fillOpacity: 0.3
        }
      }).addTo(map);

      // Behind the home list the fixed view is part of the design; on the
      // localities index the map frames the whole province. The list there
      // runs far taller than a screen on a phone, so the province is framed
      // in the first screenful of the map rather than in its middle.
      const container = map.getContainer();
      if ('fitProvince' in container.dataset) {
        const below = Math.max(0, container.clientHeight - window.innerHeight);
        map.fitBounds(province.getBounds(), {
          paddingTopLeft: [20, 20],
          paddingBottomRight: [20, 20 + below]
        });
      }
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

    const url = `${GEOJSON}/locality_${localityId}.json`;
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

    currentLayer = L.geoJSON(geoJson, {
      style: {
        color: '',
        weight: 2,
        opacity: 1,
        fillColor: '#423780',
        fillOpacity: 0.5
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
