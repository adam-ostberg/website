// Marks the "On this page" link for the section currently being read.
const links = [...document.querySelectorAll(".toc a")];
const headings = links.map((a) => document.getElementById(a.hash.slice(1)));
const OFFSET = 120; // a heading this close to the top of the window counts as being read

// A clicked link (or one in the URL on load) stays marked until the reader scrolls themselves.
// Short pages can't scroll its heading to the top, so the scroll position alone would pick another one.
let pinned = links.findIndex((a) => a.hash === location.hash);

function update() {
  queued = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  let active = pinned;
  if (active < 0 && max > 1) {
    // Over the last screen of scrolling, the reading line slides from OFFSET down to the bottom
    // of the window, so headings near the end still get their turn before the page runs out.
    const progress = Math.min(Math.max(1 - (max - scrollY) / Math.min(innerHeight, max), 0), 1);
    const line = OFFSET + progress * (innerHeight - OFFSET);
    active = headings.findLastIndex((h) => h.getBoundingClientRect().top <= line);
  }
  links.forEach((a, i) => (i === active ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
}

let queued = false;
const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

if (links.length) {
  links.forEach((a, i) => a.addEventListener("click", () => { pinned = i; update(); }));
  // Input from the reader releases the pin; the smooth scroll a click starts does not.
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
    addEventListener(type, () => { if (pinned >= 0) { pinned = -1; schedule(); } }, { passive: true });
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  update();
}
