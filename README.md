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

### Adding a new tab (e.g. a blog)

1. Create `src/blog/` with posts and a `blog.11tydata.js` (copy `projects/projects.11tydata.js` as a starting point).
2. Add a list page, e.g. `src/blog.njk` with `permalink: /blog/`, plus a collection in `eleventy.config.js`.
3. Add `{ "label": "Blog", "url": "/blog/" }` to `nav` in `site.json`.

### Adding a home section

Create `src/_includes/sections/<name>.njk` and add `<name>` to `sections:` in `src/index.njk`.

## Theme

Colors are CSS variables at the top of `src/assets/css/style.css`. Dark mode follows the system, and the header toggle overrides it (saved in localStorage).

## Deploy

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`. In the repo settings, set **Pages → Source** to **GitHub Actions**. The path prefix is handled automatically for both `user.github.io/repo` and a custom domain.
