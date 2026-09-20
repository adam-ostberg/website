import { useEffect } from "react";

/*
 * Spring that pulls a released window home. Underdamped, so it overshoots once and
 * settles rather than easing in flat. Units are pixels and seconds.
 */
const STIFFNESS = 210;
const DAMPING = 15;
/** Fixed integration step: rAF deltas vary, and a variable step makes a stiff spring blow up. */
const STEP = 1 / 120;
/** Close enough to home, and slow enough, to stop and hand the element back to CSS. */
const REST = 0.5;
const REST_V = 8;
/** How far a window may travel, as a fraction of the viewport. Keeps it from being flung off the page. */
const REACH_X = 0.35;
const REACH_Y = 0.3;
/** A flick can only carry so much speed into the spring. */
const MAX_V = 2600;
/** A release this long after the last movement is a drop, not a throw. */
const STALE_MS = 90;

type Win = { el: HTMLElement; x: number; y: number; vx: number; vy: number; raf: number };

const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));

/**
 * Lets every .win be dragged around by its title bar, then springs it back to where it
 * belongs on release. Mouse-like pointers on wide screens only: on a phone the gesture
 * fights the scroll, and there is nowhere to drag to.
 */
export function useDragWindows() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 821px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wins = new Map<HTMLElement, Win>();

    let held: Win | null = null;
    let pointer = -1;
    let grabX = 0;
    let grabY = 0;
    let fromX = 0;
    let fromY = 0;
    let lastT = 0;

    const enabled = () => fine.matches && !calm.matches;

    const draw = (w: Win) => {
      w.el.style.transform = `translate3d(${w.x}px, ${w.y}px, 0)`;
    };

    /** Back home: drop every inline override so hover and reveal own the element again. */
    const rest = (w: Win) => {
      if (w.raf) cancelAnimationFrame(w.raf);
      w.el.classList.remove("is-dragging");
      w.el.style.transform = "";
      w.el.style.transition = "";
      w.el.style.zIndex = "";
      w.el.style.willChange = "";
      wins.delete(w.el);
    };

    const spring = (w: Win) => {
      let prev = performance.now();
      let owed = 0;
      const tick = (now: number) => {
        // Cap the catch-up so a backgrounded tab doesn't integrate a huge jump on return.
        owed += Math.min((now - prev) / 1000, 0.05);
        prev = now;
        while (owed >= STEP) {
          owed -= STEP;
          w.vx += (-STIFFNESS * w.x - DAMPING * w.vx) * STEP;
          w.vy += (-STIFFNESS * w.y - DAMPING * w.vy) * STEP;
          w.x += w.vx * STEP;
          w.y += w.vy * STEP;
        }
        if (Math.hypot(w.x, w.y) < REST && Math.hypot(w.vx, w.vy) < REST_V) {
          rest(w);
          return;
        }
        draw(w);
        w.raf = requestAnimationFrame(tick);
      };
      w.raf = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      if (!enabled() || e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      const bar = target?.closest<HTMLElement>(".win__bar");
      const el = bar?.closest<HTMLElement>(".win");
      if (!bar || !el) return;
      // Leave anything interactive that ends up in a title bar alone.
      if (target?.closest("a, button, input, select, textarea")) return;

      let w = wins.get(el);
      if (w) {
        // Caught mid-flight: keep where it is, drop the momentum.
        if (w.raf) cancelAnimationFrame(w.raf);
        w.raf = 0;
        w.vx = 0;
        w.vy = 0;
      } else {
        w = { el, x: 0, y: 0, vx: 0, vy: 0, raf: 0 };
        wins.set(el, w);
      }

      held = w;
      pointer = e.pointerId;
      grabX = e.clientX;
      grabY = e.clientY;
      fromX = w.x;
      fromY = w.y;
      lastT = e.timeStamp;

      /*
       * Both [data-reveal] and .project transition transform; easing every drag frame
       * through them would leave the window trailing the pointer. The spring below does
       * the animating instead, so transitions stay off until the window is home.
       */
      el.style.transition = "none";
      el.style.zIndex = "5";
      el.style.willChange = "transform";
      el.classList.add("is-dragging");
      // Keeps the drag alive when the pointer leaves the bar. The window listeners below
      // cover the common case on their own, so a browser that refuses capture still drags.
      try {
        bar.setPointerCapture(e.pointerId);
      } catch {
        /* no capture available */
      }
      e.preventDefault();
    };

    const move = (e: PointerEvent) => {
      if (!held || e.pointerId !== pointer) return;
      const w = held;
      const x = clamp(fromX + e.clientX - grabX, window.innerWidth * REACH_X);
      const y = clamp(fromY + e.clientY - grabY, window.innerHeight * REACH_Y);
      const dt = Math.max((e.timeStamp - lastT) / 1000, 1 / 240);
      // Smoothed, so one jittery frame doesn't decide how hard the window is thrown.
      w.vx = w.vx * 0.6 + ((x - w.x) / dt) * 0.4;
      w.vy = w.vy * 0.6 + ((y - w.y) / dt) * 0.4;
      w.x = x;
      w.y = y;
      lastT = e.timeStamp;
      draw(w);
    };

    const up = (e: PointerEvent) => {
      if (!held || e.pointerId !== pointer) return;
      const w = held;
      held = null;
      pointer = -1;
      w.el.classList.remove("is-dragging");
      if (e.timeStamp - lastT > STALE_MS) {
        w.vx = 0;
        w.vy = 0;
      }
      w.vx = clamp(w.vx, MAX_V);
      w.vy = clamp(w.vy, MAX_V);
      spring(w);
    };

    /** Turned off mid-drag (narrowed window, reduced motion switched on): put everything back at once. */
    const reset = () => {
      if (enabled()) return;
      held = null;
      pointer = -1;
      for (const w of [...wins.values()]) rest(w);
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    fine.addEventListener("change", reset);
    calm.addEventListener("change", reset);

    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      fine.removeEventListener("change", reset);
      calm.removeEventListener("change", reset);
      held = null;
      for (const w of [...wins.values()]) rest(w);
    };
  }, []);
}
