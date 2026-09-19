import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { detectQuality, type Quality } from "../lib/quality";
import { usePointerTracking } from "../lib/world";
import { ParticleField } from "./ParticleField";
import { Stations, stationsNearby } from "./robots/Stations";

// Bloom pulls in the postprocessing library, so it loads after the first frame.
const Effects = lazy(() => import("./Effects").then((m) => ({ default: m.Effects })));

const CAMERA = { position: [0, 0, 10] as [number, number, number], fov: 45, near: 0.1, far: 60 };

/*
 * Most pixels a canvas may render; above that the pixel ratio drops, so a 4K screen costs about
 * as much as 1080p (background, softened by bloom anyway) or 1440p (the crisper robots).
 */
const BACK_PIXELS = 1920 * 1080;
const FRONT_PIXELS = 2560 * 1440;

function budgetDpr(max: number, pixels: number): number {
  const native = Math.min(window.devicePixelRatio || 1, max);
  const fit = Math.sqrt(pixels / (window.innerWidth * window.innerHeight));
  return Math.max(Math.min(native, fit), 0.5);
}

/** Pixel ratio for a full-window canvas: at most `max`, and within the `pixels` budget. Follows resizes and screen changes. */
function useBudgetDpr(max: number, pixels: number): number {
  const [dpr, setDpr] = useState(() => budgetDpr(max, pixels));
  useEffect(() => {
    const update = () => setDpr(budgetDpr(max, pixels));
    // Moving to a screen with a different density doesn't resize the window, so watch the ratio itself.
    let mq: MediaQueryList;
    const watch = () => {
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener("change", onDensity, { once: true });
    };
    const onDensity = () => {
      update();
      watch();
    };
    watch();
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", onDensity);
    };
  }, [max, pixels]);
  return dpr;
}

/** The field only shows through the hero and footer; every section in between is opaque. */
function backgroundShowing(): boolean {
  const sections = document.querySelectorAll("main > .section");
  if (!sections.length) return true;
  const top = sections[0].getBoundingClientRect().top;
  const bottom = sections[sections.length - 1].getBoundingClientRect().bottom;
  return top > 0 || bottom < window.innerHeight;
}

export function useQuality(): Quality {
  return useMemo(detectQuality, []);
}

/** Particle field on a canvas fixed behind the page. Visible wherever a section is dark. */
export function BackgroundScene({ quality }: { quality: Quality }) {
  const high = quality === "high";
  const reduced = quality === "reduced";
  usePointerTracking(high);
  const dpr = useBudgetDpr(high ? 1.5 : 1, BACK_PIXELS);
  if (quality === "none") return null;

  return (
    <div className="scene scene--back" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={CAMERA}
        gl={{ antialias: !high, powerPreference: "high-performance", alpha: false, stencil: false }}
        frameloop={reduced ? "demand" : "always"}>
        <color attach="background" args={["#0a0a0a"]} />
        <ParticleField count={high ? 2100 : 900} interactive={high} frozen={reduced} />
        {high && (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        )}
        {reduced ? <InvalidateOnScroll /> : <PlayWhile active={backgroundShowing} />}
      </Canvas>
    </div>
  );
}

/** Robot stations on a transparent canvas in front of the page, so they sit on the solid section colours. */
export function ShapesScene({ quality }: { quality: Quality }) {
  const reduced = quality === "reduced";
  const dpr = useBudgetDpr(quality === "high" ? 2 : 1, FRONT_PIXELS);
  if (quality === "none") return null;

  return (
    <div className="scene scene--front" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={CAMERA}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        frameloop={reduced ? "demand" : "always"}>
        <hemisphereLight args={["#ffffff", "#3a3a3a", 1.6]} />
        <directionalLight position={[5, 8, 6]} intensity={3.2} />
        <directionalLight position={[-6, -2, 4]} intensity={1.4} color="#f386a1" />
        <directionalLight position={[3, 2, -6]} intensity={2.2} color="#9fd0ff" />
        <Stations frozen={reduced} />
        {reduced ? <InvalidateOnScroll /> : <PlayWhile active={stationsNearby} />}
      </Canvas>
    </div>
  );
}

/** In reduced-motion mode the loop is on demand, so re-render on scroll/resize only. */
function InvalidateOnScroll() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const f = () => invalidate();
    window.addEventListener("scroll", f, { passive: true });
    window.addEventListener("resize", f);
    invalidate();
    return () => {
      window.removeEventListener("scroll", f);
      window.removeEventListener("resize", f);
    };
  }, [invalidate]);
  return null;
}

/**
 * Runs the render loop only while `active()` holds, checked on scroll and resize. On stopping it
 * draws one more frame, so nothing stale is left on screen.
 */
function PlayWhile({ active }: { active: () => boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let playing = true;
    const check = () => {
      const want = active();
      if (want === playing) return;
      playing = want;
      setFrameloop(want ? "always" : "demand");
      if (!want) invalidate();
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      setFrameloop("always");
    };
  }, [active, setFrameloop, invalidate]);
  return null;
}
