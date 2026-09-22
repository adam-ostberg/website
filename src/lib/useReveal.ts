import { useEffect } from "react";

/** Fades in every [data-reveal] element the first time it scrolls into view. */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add("is-visible");
            io.unobserve(el);
            /*
             * Once in, drop out of [data-reveal] entirely. Its slow, staggered transition
             * otherwise keeps overriding the element's own, so a card's hover lift would
             * crawl in over 0.9s behind the pointer.
             */
            const done = (e: TransitionEvent) => {
              if (e.target !== el || e.propertyName !== "opacity") return;
              el.removeEventListener("transitionend", done);
              el.removeAttribute("data-reveal");
              el.classList.remove("is-visible");
            };
            el.addEventListener("transitionend", done);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
