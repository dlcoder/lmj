import { generatePaginatedPages } from './base.js';
import * as articles from './articles.js';

export default function () {
  return [
    ...generatePaginatedPages({
      entities: [{}],
      articles: articles.en,
      filterFn: () => true,
      pathPrefix: 'articles',
      locale: 'en'
    }),
    ...generatePaginatedPages({
      entities: [{}],
      articles: articles.es,
      filterFn: () => true,
      pathPrefix: 'articles',
      locale: 'es'
    })
  ];
}
