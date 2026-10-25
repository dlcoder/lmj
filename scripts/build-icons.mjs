// Renders the raster icons from img/favicon.svg, the one source of the logo
// outside the header: the PNGs for touch screens and the web manifest, and a
// favicon.ico for whatever still asks for one. Run with `npm run build-icons`
// after changing the SVG, and commit what it writes.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const svg = readFileSync('img/favicon.svg', 'utf8');
// iOS rounds the corners itself and fills any transparency with black, so
// the touch icon is the same drawing on a square, full-bleed tile.
const square = svg.replace(/ rx="[\d.]+"/, '');

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(source, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`
  );
  return page.screenshot({ omitBackground: true });
}

const outputs = [
  ['img/apple-touch-icon.png', square, 180],
  ['img/icon-192.png', svg, 192],
  ['img/icon-512.png', svg, 512]
];
for (const [file, source, size] of outputs) {
  writeFileSync(file, await render(source, size));
  console.log(file);
}

// An .ico may simply wrap PNGs: a 6-byte header, a 16-byte entry per image,
// then the images themselves.
const images = [await render(svg, 16), await render(svg, 32), await render(svg, 48)];
const sizes = [16, 32, 48];
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((png, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(sizes[i], entry);
  header.writeUInt8(sizes[i], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
writeFileSync('img/favicon.ico', Buffer.concat([header, ...images]));
console.log('img/favicon.ico');

await browser.close();
