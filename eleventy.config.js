import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Rewrites absolute URLs when deployed under a sub-path (e.g. user.github.io/repo/).
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });

  // Newest first. Projects are sorted by `date`, then by `order` if you want to pin some.
  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("src/projects/*.md")
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || b.date - a.date)
  );

  eleventyConfig.addFilter("year", (date) => (date === "now" ? new Date() : new Date(date)).getFullYear());
  eleventyConfig.addFilter("featured", (items) => items.filter((p) => p.data.featured));

  // Own page if it has one, otherwise the first external link (code, paper, ...).
  eleventyConfig.addFilter("projectHref", (item) => item.url || Object.values(item.data.links ?? {})[0]);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
