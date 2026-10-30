import { readdirSync, readFileSync } from 'node:fs';

// The stylesheet is kept in css/ as one file per part of the site and
// served as the one /css/styles.css the layout links. The parts are joined
// in the order their numbers give, which is the cascade's: some rules only
// win because they come later, so a part moves only with what it overrides.
export default class {
  data() {
    return { permalink: '/css/styles.css', eleventyExcludeFromCollections: true };
  }

  render() {
    return readdirSync('css')
      .filter(file => file.endsWith('.css'))
      .sort()
      .map(file => readFileSync(`css/${file}`, 'utf8'))
      .join('');
  }
}
