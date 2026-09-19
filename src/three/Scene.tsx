import { lazy, Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { detectQuality, type Quality } from "../lib/quality";
import { usePointerTracking } from "../lib/world";
import { ParticleField } from "./ParticleField";
import { SectionShapes } from "./SectionShapes";

// Bloom pulls in the postprocessing library, so it loads after the first frame.
const Effects = lazy(() => import("./Effects").then((m) => ({ default: m.Effects })));

const CAMERA = { position: [0, 0, 10] as [number, number, number], fov: 45, near: 0.1, far: 60 };

export function useQuality(): Quality {
  return useMemo(detectQuality, []);
}

/** Particle field on a canvas fixed behind the page. Visible wherever a section is dark. */
export function BackgroundScene({ quality }: { quality: Quality }) {
  const high = quality === "high";
  const reduced = quality === "reduced";
  usePointerTracking(high);
  if (quality === "none") return null;

  return (
    <div className="scene scene--back" aria-hidden="true">
      <Canvas
        dpr={high ? [1, 1.5] : 1}
        camera={CAMERA}
        gl={{ antialias: !high, powerPreference: "high-performance", alpha: false, stencil: false }}
        frameloop={reduced ? "demand" : "always"}>
        <color attach="background" args={["#0a0a0a"]} />
        <ParticleField count={high ? 3200 : 1400} interactive={high} frozen={reduced} />
        {high && (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        )}
        {reduced && <InvalidateOnScroll />}
      </Canvas>
    </div>
  );
}

/** Section shapes on a transparent canvas in front of the page, so they sit on the solid section colours. */
export function ShapesScene({ quality }: { quality: Quality }) {
  const reduced = quality === "reduced";
  if (quality === "none") return null;

  return (
    <div className="scene scene--front" aria-hidden="true">
      <Canvas
        dpr={quality === "high" ? [1, 2] : 1}
        camera={CAMERA}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        frameloop={reduced ? "demand" : "always"}>
        <hemisphereLight args={["#ffffff", "#3a3a3a", 1.6]} />
        <directionalLight position={[5, 8, 6]} intensity={3.2} />
        <directionalLight position={[-6, -2, 4]} intensity={1.4} color="#f386a1" />
        <directionalLight position={[3, 2, -6]} intensity={2.2} color="#9fd0ff" />
        <SectionShapes frozen={reduced} />
        {reduced && <InvalidateOnScroll />}
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
