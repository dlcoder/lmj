import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadData(filename) {
  const dataPath = path.resolve(__dirname, "data/", filename);
  const content = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(content);
  return data;
}

export default function(eleventyConfig) {
  eleventyConfig.addGlobalData("env", {
    ELEVENTY_ENV: process.env.ELEVENTY_ENV || "development"
  });

  eleventyConfig.addCollection("articlesEn", function() {
    return loadData("articles-en.json");
  });

  eleventyConfig.addCollection("articlesEs", function() {
    return loadData("articles-en.json");
  });

  eleventyConfig.ignores.add("README.md");

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
