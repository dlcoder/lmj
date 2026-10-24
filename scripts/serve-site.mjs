// Minimal static server over _site/ that mimics GitHub Pages: resolves
// `/path` as `/path.html` and `/dir/` as `/dir/index.html`.
// Meant for `npm run check-links`; for development use `npm run serve`.
import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { join, extname, resolve } from "node:path";

const ROOT = resolve("_site");
const PORT = Number(process.env.PORT) || 8099;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolvePath(pathname) {
  const target = join(ROOT, decodeURIComponent(pathname));
  if (!target.startsWith(ROOT)) return null;

  for (const candidate of [target, join(target, "index.html"), `${target}.html`]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
  const file = await resolvePath(pathname);

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }

  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
});

server.listen(PORT, () => {
  console.log(`_site served at http://localhost:${PORT}/`);
});
