import { existsSync } from "node:fs";
import { HtmlBasePlugin } from "@11ty/eleventy";
import site from "./src/_data/site.json" with { type: "json" };

export default function (eleventyConfig) {
  // Rewrites absolute URLs when deployed under a sub-path (e.g. user.github.io/repo/).
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Appended to asset URLs (?v=...) so browsers refetch CSS/JS after each deploy instead of
  // pairing new HTML with a stale cached stylesheet.
  eleventyConfig.addGlobalData("assetVersion", () => Date.now().toString(36));

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });

  // Newest first. Projects are sorted by `date`, then by `order` if you want to pin some.
  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("src/projects/*.md")
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99) || b.date - a.date)
  );

  // Blog posts, newest first.
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("postDate", (date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("year", (date) => (date === "now" ? new Date() : new Date(date)).getFullYear());

  // Shown year(s) for a project: `date` alone → "2025"; with `end` → "2021–2024" or "2021–present".
  // `end` may be a year (2024), a date (2024-05-01) or "present"; a range within one year shows once.
  eleventyConfig.addFilter("yearRange", (date, end) => {
    const start = new Date(date).getUTCFullYear();
    if (end === undefined || end === null || end === "") return String(start);
    if (String(end).toLowerCase() === "present") return `${start}–present`;
    const last = typeof end === "number" ? end : new Date(end).getUTCFullYear();
    return last === start ? String(start) : `${start}–${last}`;
  });
  eleventyConfig.addFilter("featured", (items) => items.filter((p) => p.data.featured));

  // {% note %}markdown{% endnote %}: a highlighted callout. The content is left as markdown
  // and parsed by the markdown pass, since the blank lines let it through the HTML block.
  eleventyConfig.addPairedShortcode("note", (content) => `\n<div class="note">\n\n${content.trim()}\n\n</div>\n`);

  // {% image "/assets/img/x.webp", "Alt text", "60%", "Optional caption" %}: an image at a set width,
  // centred. Width is any CSS length ("60%", "20rem"); a bare number means pixels. Plain ![]() stays full width.
  const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  eleventyConfig.addShortcode("image", (src, alt = "", width, caption) => {
    const w = width == null || width === "" ? "" : /^\d+$/.test(String(width)) ? `${width}px` : width;
    const style = w ? ` style="--w: ${escape(w)}"` : "";
    const cap = caption ? `<figcaption>${escape(caption)}</figcaption>` : "";
    return `\n<figure class="figure"${style}><img src="${escape(src)}" alt="${escape(alt)}" loading="lazy">${cap}</figure>\n`;
  });

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

  // External links (http/https, not our own domain) open in a new tab. Internal links, #anchors
  // and mailto: are left alone. Opt out per link with target="_self".
  eleventyConfig.addTransform("external-links", function (html) {
    if (!this.page.outputPath?.endsWith(".html")) return html;
    const own = new URL(site.url).hostname;
    return html.replace(/<a\s[^>]*>/g, (tag) => {
      const href = tag.match(/\shref="(https?:\/\/[^"]*)"/)?.[1];
      if (!href || /\starget=/.test(tag) || new URL(href).hostname === own) return tag;
      return tag.replace(/>$/, ' target="_blank" rel="noopener">');
    });
  });

  // Readable labels for a project's `links` keys; unknown keys are shown capitalised.
  const linkLabels = { code: "Code on GitHub", demo: "Live demo", site: "Visit site", website: "Website code", scraper: "Scraper code", analysis: "Analysis notebook", models: "Models notebook", paper: "Paper" };
  eleventyConfig.addFilter("linkLabel", (key) => linkLabels[key] ?? key.charAt(0).toUpperCase() + key.slice(1));

  // Link-preview image for a page: its own `image` if it has one, else the shared card.
  // Preview crawlers don't reliably read WebP, so a WebP image needs a JPG copy in assets/img/og/.
  eleventyConfig.addFilter("ogImage", (image) => {
    const fallback = "/assets/img/og-card.png";
    if (!image) return fallback;
    if (!image.endsWith(".webp")) return image;
    const jpg = image.replace(/\/([^/]+)\.webp$/, "/og/$1.jpg");
    return existsSync("src" + jpg) ? jpg : fallback;
  });

  // Own page if it has one, otherwise the first external link (code, paper, ...).
  eleventyConfig.addFilter("projectHref", (item) => item.url || Object.values(item.data.links ?? {})[0]);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
