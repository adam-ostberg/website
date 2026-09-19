# adamostberg.com

Personal site. Vite + React + React Three Fiber, deployed to GitHub Pages.

## Run locally

```sh
npm install
npm run dev
```

## Edit content

Everything you'd normally change lives in `src/content/`:

| File            | What it controls                                  |
| --------------- | ------------------------------------------------- |
| `site.ts`       | Name, email, LinkedIn, CV path, hero intro        |
| `now.ts`        | The three "right now" cells under the hero        |
| `projects.ts`   | Project cards (instructions at the top of file)   |
| `experience.ts` | Work experience and education rows                |
| `skills.ts`     | Tools shown in the scrolling strip                |
| `about.ts`      | About lead paragraph and the three columns        |

Images and the CV PDF go in `public/assets/` and are referenced as `/assets/<file>`.
`public/assets/og.jpg` is the link preview image (1200×630) used by LinkedIn and others.

### Adding a project

1. Drop a screenshot in `public/assets/`.
2. Add an object to the array in `src/content/projects.ts`.
3. `featured: true` on one project makes it the large card at the top.

## Type

Three faces: Host Grotesk for headings and hero copy, JetBrains Mono for buttons and nav, and DotGothic16 (the pixel face)
for labels, ledes, card copy, tags and window title bars. The pixel face is rendered without anti-aliasing (`.px` rules in
`global.css`) so it stays crisp. Cards use the `.win` / `.win__bar` classes for the retro window frame.

## Section colours

Each section picks a theme class in its component, e.g. `section section--light section--pink`.
The palette lives at the top of `src/styles/global.css` (`.section--pink`, `--cream`, `--sage`, `--lavender`, `--sky`).
Text, borders and cards adapt automatically through the `--s-*` tokens.

## 3D scene

- `src/three/ParticleField.tsx`: the neural particle field behind the hero (custom shaders).
- `src/three/shapes.tsx`: the geometric shapes (`cube`, `frame`, `cluster`, `octa`).
- `src/three/SectionShapes.tsx`: positions a shape over every `[data-shape]` element in the page, on a transparent canvas in front of the content.
  To put a shape somewhere, add `<div className="shape-anchor" data-shape="cube" />` and lay it out with CSS.
  `data-ink` and `data-accent` change its colours.
- `src/lib/quality.ts`: picks the render tier (bloom + full particle count on desktop, lighter on phones, static frame with reduced motion, nothing without WebGL).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/`.
One-time setup: in the repo on GitHub, **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions**.
