import { en_categories_raw, es_categories_raw } from './base.js';

export default {
  en: en_categories_raw.map(cat => ({ ...cat, imageSlug: cat.slug })),
  es: es_categories_raw.map((cat, i) => ({ ...cat, imageSlug: en_categories_raw[i].slug }))
};
