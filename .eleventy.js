import { STATICS_HOST, SITE_URL } from "./_data/base.js";

export default function (eleventyConfig) {
  eleventyConfig.addGlobalData("env", {
    ELEVENTY_ENV: process.env.ELEVENTY_ENV || "development"
  });

  eleventyConfig.addGlobalData("timestamp", Date.now());

  eleventyConfig.addGlobalData("siteUrl", SITE_URL);

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
