import * as articles from './articles.js';
import { STATICS_HOST, IMAGE_BASE, featuredImageParts } from './base.js';

// The one index of geolocated articles, in the same shape the Rails app
// served from /articulos.json: a GeoJSON FeatureCollection that Leaflet can
// eat as it comes. There it was a filterable endpoint; here the whole thing
// is written once per locale and the filtering happens in the browser.
//
// Three places read it: the map on a locality page (filtered by locality),
// the explorer map (by locality and category) and, later, the search.
//
// 162 of the 164 articles have geolocation: the three traditional trades
// carry their town's, added in 2026 so they show on the maps. The two caves
// without it, kept off on purpose, are left out, exactly as the old
// _article.json.jbuilder did.
function feature(article) {
  const { latitude, longitude } = article.geolocation ?? {};
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const image = featuredImageParts(article);

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      title: article.title,
      path: `/${article.locale}/articles/${article.slug}`,
      // Ids, not slugs: they are what names the outline files on the bucket
      // (locality_{id}.json) and what the locality list already carries in
      // its data-locality-id.
      localities: article.enrichedLocalities.map(locality => locality.id),
      categories: article.enrichedCategories.map(category => category.slug),
      ...(image && { image })
    }
  };
}

const index = locale => ({
  type: 'FeatureCollection',
  // Foreign members, so the client needs nothing hardcoded to build the
  // teaser URLs: `${host}${imageBase}/${dir}/teaser_tablet/${file}`.
  host: STATICS_HOST,
  imageBase: IMAGE_BASE,
  features: articles[locale]
    .map(article => feature({ ...article, locale }))
    .filter(Boolean)
});

export default {
  en: index('en'),
  es: index('es')
};
