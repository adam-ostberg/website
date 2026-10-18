// Marks the "On this page" link for the section currently being read.
const links = [...document.querySelectorAll(".toc a")];
const headings = links.map((a) => document.getElementById(a.hash.slice(1)));

let queued = false;
function update() {
  queued = false;
  let active = headings.findLastIndex((h) => h.getBoundingClientRect().top <= 120);
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) active = headings.length - 1;
  links.forEach((a, i) => (i === active ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
}

if (links.length) {
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
