import { readFileSync } from "node:fs";
import { STATICS_HOST, SITE_URL, cleanUrl, alternateFor } from "./_data/base.js";

const versionOf = name =>
  JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8")).version;

export default function (eleventyConfig) {
  eleventyConfig.addGlobalData("staticsHost", STATICS_HOST);
  eleventyConfig.addGlobalData("siteUrl", SITE_URL);
  // For cache busting the vendored files: they change only with the package.
  eleventyConfig.addGlobalData("vendor", {
    leaflet: versionOf("leaflet"),
    markercluster: versionOf("leaflet.markercluster")
  });

  eleventyConfig.addFilter("cleanUrl", cleanUrl);
  eleventyConfig.addFilter("alternate", alternateFor);

  // The coordinates of a place, for its structured data. Nunjucks cannot
  // assign into a nested object, so the filter returns a copy that has them.
  eleventyConfig.addFilter("setGeo", (data, { latitude, longitude } = {}) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return data;
    return {
      ...data,
      about: { ...data.about, geo: { "@type": "GeoCoordinates", latitude, longitude } }
    };
  });

  // A description for the meta tags: the text cut at a word, never mid-way.
  eleventyConfig.addFilter("excerpt", (text, length = 160) => {
    if (!text) return "";
    const flat = String(text).replace(/\s+/g, " ").trim();
    if (flat.length <= length) return flat;
    return flat.slice(0, flat.lastIndexOf(" ", length - 1)).replace(/[,;:.]$/, "") + "…";
  });

  eleventyConfig.addGlobalData("env", {
    ELEVENTY_ENV: process.env.ELEVENTY_ENV || "development"
  });

  eleventyConfig.addGlobalData("timestamp", Date.now());

  eleventyConfig.addFilter("formatDate", (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  });

  eleventyConfig.addShortcode("featured_image", function (article, size) {
    const featuredMedia = article.media?.find(m => m.featured && m.type === "Photo");
    if (!featuredMedia || !featuredMedia.image_urls) {
      return "";
    }
    const imagePath = featuredMedia.image_urls[size] || "";
    return imagePath ? `${STATICS_HOST}${imagePath}` : "";
  });

  // Some files on the bucket have spaces in their name, so the path has to be
  // encoded or the browser will not request them.
  eleventyConfig.addShortcode("static_image", function (imagePath) {
    return imagePath ? `${STATICS_HOST}${imagePath.replace(/ /g, "%20")}` : "";
  });

  // The site has no Markdown pages: any .md at the root is documentation,
  // including notes kept locally and never committed.
  eleventyConfig.ignores.add("*.md");
  eleventyConfig.ignores.add("content");

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("img");
  // Browsers ask for it at the root whether or not a page links it.
  eleventyConfig.addPassthroughCopy({ "img/favicon.ico": "favicon.ico" });
  // Leaflet's stylesheet finds its marker images relative to itself.
  eleventyConfig.addPassthroughCopy({
    "node_modules/leaflet/dist/leaflet.js": "vendor/leaflet/leaflet.js",
    "node_modules/leaflet/dist/leaflet.css": "vendor/leaflet/leaflet.css",
    "node_modules/leaflet/dist/images": "vendor/leaflet/images",
    "node_modules/leaflet.markercluster/dist/leaflet.markercluster.js": "vendor/leaflet.markercluster/leaflet.markercluster.js",
    "node_modules/leaflet.markercluster/dist/MarkerCluster.css": "vendor/leaflet.markercluster/MarkerCluster.css",
    "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css": "vendor/leaflet.markercluster/MarkerCluster.Default.css"
  });
  // The site's two typefaces, only the weights the stylesheet declares.
  for (const file of [
    "merriweather/files/merriweather-latin-300-normal.woff2",
    "merriweather/files/merriweather-latin-300-italic.woff2",
    "merriweather/files/merriweather-latin-400-normal.woff2",
    "merriweather/files/merriweather-latin-400-italic.woff2",
    "merriweather/files/merriweather-latin-700-normal.woff2",
    "lato/files/lato-latin-300-normal.woff2",
    "lato/files/lato-latin-400-normal.woff2",
    "lato/files/lato-latin-700-normal.woff2",
    "lato/files/lato-latin-900-normal.woff2"
  ]) {
    eleventyConfig.addPassthroughCopy({ [`node_modules/@fontsource/${file}`]: `vendor/fonts/${file.split("/").pop()}` });
  }

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
