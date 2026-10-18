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

  // {% note %}markdown{% endnote %}: a highlighted callout. The content is left as markdown
  // and parsed by the markdown pass, since the blank lines let it through the HTML block.
  eleventyConfig.addPairedShortcode("note", (content) => `\n<div class="note">\n\n${content.trim()}\n\n</div>\n`);

  // "On this page" outline. The layout drops a <!--toc--> marker; this gives every ##/### in
  // the article an id and swaps the marker for a nav linking to them, so it always matches the content.
  eleventyConfig.addTransform("toc", function (html) {
    if (!this.page.outputPath?.endsWith(".html") || !html.includes("<!--toc-->")) return html;

    const start = html.indexOf('<div class="prose">');
    const end = html.indexOf("</article>", start);
    const used = new Set();
    const entries = [];
    const body = html.slice(start, end).replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (match, level, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      let id = attrs.match(/\sid="([^"]*)"/)?.[1];
      if (!id) {
        const base = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
        id = base;
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
        attrs += ` id="${id}"`;
      }
      used.add(id);
      entries.push({ level, id, text });
      return `<h${level}${attrs}>${inner}</h${level}>`;
    });

    const items = entries.map((e) => `<li class="toc-h${e.level}"><a href="#${e.id}">${e.text}</a></li>`).join("\n");
    const toc = entries.length
      ? `<nav class="toc" aria-label="On this page"><p class="side-label">On this page</p><ul>\n${items}\n</ul></nav>`
      : "";
    return (html.slice(0, start) + body + html.slice(end)).replace("<!--toc-->", () => toc);
  });

  // Own page if it has one, otherwise the first external link (code, paper, ...).
  eleventyConfig.addFilter("projectHref", (item) => item.url || Object.values(item.data.links ?? {})[0]);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
