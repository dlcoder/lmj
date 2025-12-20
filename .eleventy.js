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

export default function (eleventyConfig) {
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

  eleventyConfig.addShortcode("static_image", function (imagePath) {
    return imagePath ? `${STATICS_HOST}${imagePath}` : "";
  });

  eleventyConfig.ignores.add("AGENTS.md");
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
