(function () {
  // What the four maps share: the tiles, the purple of the outlines, where
  // the outlines and the article index come from, the article popup and the
  // framing. The layout loads it right after Leaflet and before the map
  // scripts, which read it as window.lmjMap.
  if (typeof L === 'undefined') return;

  const STATICS_HOST = document.querySelector('meta[name="statics-host"]')?.content
    ?? 'https://files.lugaresmiticosdejaen.com';
  const JAEN_CENTER = [37.9556459, -3.361515];

  // Same purple the original used for the outlines.
  const COLOR = '#423780';

  // A map with OpenStreetMap's own tiles: no API key, unlike the Carto
  // basemap the original used, which now answers with a placeholder tile.
  // Their licence asks for attribution, so the control stays on. The muted
  // look comes from a CSS filter rather than from the tiles themselves.
  function create(container, options) {
    const map = L.map(container, { center: JAEN_CENTER, ...options });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    return map;
  }

  function json(url) {
    return fetch(url)
      .then(response => response.ok ? response.json() : null)
      .catch(() => null);
  }

  // An outline, `province` or `locality_{id}`, or null when it does not
  // arrive. They are GeoJSON files on the assets host, so CORS applies: the
  // bucket answers with an allowlist of origins, which has to include
  // wherever the site is being served from — localhost too while developing.
  function outline(name) {
    return json(`${STATICS_HOST}/files/geojson/${name}.json`);
  }

  // /{locale}/articles.json, the one index of geolocated articles, which is
  // same-origin; null when it does not arrive.
  function articles(locale) {
    return json(`/${locale}/articles.json`);
  }

  // The popup of the original: the teaser photo over the title, the whole
  // thing a link to the article.
  function popup({ path, title, image }, base) {
    const link = document.createElement('a');
    link.href = path;

    if (image) {
      const photo = document.createElement('img');
      photo.src = `${base}/${image.dir}/teaser_tablet/${image.file}`;
      photo.alt = '';
      link.append(photo);
    }

    const heading = document.createElement('h2');
    heading.textContent = title;
    link.append(heading);

    return link;
  }

  // A GeoJSON layer of the index's features, each marker with its popup.
  function markers(features, index) {
    const base = index.host + index.imageBase;
    return L.geoJSON(features, {
      onEachFeature: (feature, marker) =>
        marker.bindPopup(popup(feature.properties, base), {
          minWidth: 320,
          keepInView: true
        })
    });
  }

  // Frame whatever the layers hold. With nothing in them the map keeps the
  // view it has.
  function frame(map, layers, options) {
    const bounds = L.latLngBounds([]);
    for (const layer of layers) {
      if (layer.getLayers().length) bounds.extend(layer.getBounds());
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], ...options });
  }

  window.lmjMap = { COLOR, create, outline, articles, markers, frame };
})();
