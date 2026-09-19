export type Quality = "high" | "low" | "reduced" | "none";

function webglSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Picks a rendering tier for the 3D scene.
 * - none:    no WebGL, render nothing (the CSS background stays).
 * - reduced: prefers-reduced-motion, render a static frame.
 * - low:     phones / weak hardware, fewer particles, no bloom.
 * - high:    everything on.
 */
export function detectQuality(): Quality {
  if (typeof window === "undefined" || !webglSupported()) return "none";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 820;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (coarse || small || cores <= 4 || memory <= 4) return "low";
  return "high";
}
