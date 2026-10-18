import { readFileSync } from "node:fs";

// A project gets its own page only if its Markdown file has a body below the front matter.
// Front-matter-only projects still appear in lists and link out to their first `links` entry.
function hasBody(inputPath) {
  const src = readFileSync(inputPath, "utf8");
  return src.replace(/^---[\s\S]*?\n---/, "").trim().length > 0;
}

export default {
  layout: "layouts/project.njk",
  eleventyComputed: {
    permalink: (data) =>
      hasBody(data.page.inputPath) ? `/projects/${data.page.fileSlug}/` : false,
  },
};
