import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATICS_HOST = "https://lmjstatic.deliriumcoder.com";

function loadData(filename) {
  const dataPath = path.resolve(__dirname, "data/", filename);
  const content = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(content);
  return data.articles;
}

export default function(eleventyConfig) {
  eleventyConfig.addGlobalData("env", {
    ELEVENTY_ENV: process.env.ELEVENTY_ENV || "development"
  });

  eleventyConfig.addGlobalData("timestamp", Date.now());

  eleventyConfig.addFilter("limit", (content, n) => {
    return content.slice(0, n);
  });

  eleventyConfig.addFilter("formatDate", (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  });

  eleventyConfig.addFilter("getLocalities", (localityNames, allLocalities) => {
    if (!localityNames || !allLocalities) return [];
    const localityMap = new Map(allLocalities.map(loc => [loc.name, loc]));
    return localityNames
      .map(name => localityMap.get(name))
      .filter(Boolean);
  });

  eleventyConfig.addShortcode("featured_image", function(article, size) {
    const featuredMedia = article.media?.find(m => m.featured && m.type === "Photo");
    if (!featuredMedia || !featuredMedia.image_urls) {
      return "";
    }
    const imagePath = featuredMedia.image_urls[size] || "";
    return imagePath ? `${STATICS_HOST}${imagePath}` : "";
  });

  eleventyConfig.ignores.add("CLAUDE.md");
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("content");

  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
