# website_v2

Minimal portfolio built with [Eleventy](https://www.11ty.dev/). Content lives in data files, and templates only render it.

```sh
npm install
npm run dev     # http://localhost:8080
npm run build   # outputs to _site/
```

## Editing content

| What                    | Where                                  |
| ----------------------- | -------------------------------------- |
| Name, tagline, intro    | `src/_data/site.json`                  |
| Header nav / footer     | `site.json` → `nav`, `links`           |
| Skills                  | `src/_data/skills.json`                |
| Experience / education  | `src/_data/experience.json`, `education.json` |
| Projects                | `src/projects/*.md` (one file each)    |
| Blog posts              | `src/posts/*.md` (one file each)       |
| Home section order      | `sections:` in `src/index.njk`         |
| CV and other static files | `src/static/` (copied to site root, e.g. `cv.pdf`) |
| Figures                 | `src/assets/img/`                      |

### Projects

```yaml
---
title: Project name
date: 2026-09-01          # sorts newest first; year is shown
summary: One sentence.
stack: [Python, PyTorch]
featured: true            # show on the home page
order: 1                  # optional, pins above date sorting
image: /assets/img/x.png  # optional thumbnail in home/projects lists
imageAlt: What it shows   # optional alt text
links:                    # any labels, rendered in order
  code: https://github.com/...
  paper: https://...
---
Optional write-up in Markdown.
```

- **Has a body** → gets its own page at `/projects/<filename>/`.
- **Front matter only** → listed, links to its first `links` entry.

### Blog

Each post is a Markdown file in `src/posts/`, published at `/blog/<filename>/` and listed newest first on `/blog/`.

```yaml
---
title: Post title
date: 2026-10-18
summary: One sentence, shown in the list and under the title.
shortTitle: Short name   # optional, used in the left-hand list
---
```

Project and blog pages share a layout: the left panel lists the section's pages, the right panel is an outline generated from the `##`/`###` headers. `{% note %}...{% endnote %}` makes a callout.

### Adding another tab

Copy the blog setup: a folder with a `*.11tydata.js` (layout, `sideNav`, `sideNavLabel`, permalink), a collection in `eleventy.config.js`, a list page, and an entry in `nav` in `site.json`.

### Adding a home section

Create `src/_includes/sections/<name>.njk` and add `<name>` to `sections:` in `src/index.njk`.

## Theme

Colors are CSS variables at the top of `src/assets/css/style.css`. Dark mode follows the system, and the header toggle overrides it (saved in localStorage).

## Deploy

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`. In the repo settings, set **Pages → Source** to **GitHub Actions**. The path prefix is handled automatically for both `user.github.io/repo` and a custom domain.
