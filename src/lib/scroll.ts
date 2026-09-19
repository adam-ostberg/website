/** Native smooth scroll to an anchor, with a little breathing room above it. */
export function scrollTo(target: string) {
  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;
  const top = target === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY - 24;
  window.scrollTo({ top, behavior: "smooth" });
}
