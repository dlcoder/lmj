import regions from './raw/regions.json' with { type: 'json' };

// Regions sorted by name, for the footer sitemap.
export default [...regions]
  .map(({ name, slug }) => ({ name, slug }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));
